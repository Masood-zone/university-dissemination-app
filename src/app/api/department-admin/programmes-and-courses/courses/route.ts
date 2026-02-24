import { NextResponse } from "next/server";
import { z } from "zod";
import { SemesterName } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  requireDepartmentAdmin,
  resolveDepartmentForDepartmentAdmin,
} from "@/lib/server";
import type {
  ApiResponse,
  DepartmentAdminCourseListResult,
  DepartmentAdminCreateCourseInput,
} from "@/types/index";

const createCourseSchema = z.object({
  programmeId: z.string().min(1).nullable().optional(),
  code: z.string().min(1),
  title: z.string().min(1),
  credits: z.number().int().min(1).max(30),
  semester: z.number().int().min(1).max(2),
  level: z.number().int().min(0).max(1000).nullable().optional(),
});

function semesterNumberToName(semester: number): SemesterName {
  return semester === 2 ? SemesterName.SECOND : SemesterName.FIRST;
}

export async function GET(request: Request) {
  try {
    const session = await requireDepartmentAdmin(request);
    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const dept = await resolveDepartmentForDepartmentAdmin(userId);
    if (!dept) {
      return NextResponse.json(
        {
          success: false,
          message: "Department admin has no department assigned",
          code: "DEPARTMENT_REQUIRED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const programmeId = url.searchParams.get("programmeId")?.trim() || "";

    const where = {
      departmentId: dept.departmentId,
      ...(programmeId ? { programmeId } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" as const } },
              { title: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const courses = await prisma.course.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        code: true,
        title: true,
        credits: true,
        semester: true,
        level: true,
        programme: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    const result: DepartmentAdminCourseListResult = {
      rows: courses.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        credits: c.credits,
        semester: c.semester,
        level: c.level,
        programmeId: c.programme?.id ?? null,
        programmeName: c.programme?.name ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: result,
      } satisfies ApiResponse<DepartmentAdminCourseListResult>,
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: error.status === 401 ? "Unauthorized" : "Forbidden",
          code: error.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load courses",
        code: "COURSES_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireDepartmentAdmin(request);
    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const dept = await resolveDepartmentForDepartmentAdmin(userId);
    if (!dept) {
      return NextResponse.json(
        {
          success: false,
          message: "Department admin has no department assigned",
          code: "DEPARTMENT_REQUIRED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const json = (await request.json()) as unknown;
    const input = createCourseSchema.parse(
      json,
    ) satisfies DepartmentAdminCreateCourseInput;

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!activeSession) {
      return NextResponse.json(
        {
          success: false,
          message: "No active academic session found",
          code: "NO_ACTIVE_SESSION",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const semesterName = semesterNumberToName(input.semester);

    const created = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          code: input.code.trim().toUpperCase(),
          title: input.title.trim(),
          credits: input.credits,
          semester: input.semester,
          level: input.level ?? null,
          departmentId: dept.departmentId,
          programmeId: input.programmeId ?? null,
          prerequisites: [],
        },
        select: { id: true },
      });

      const semester = await tx.semester.upsert({
        where: {
          sessionId_name: { sessionId: activeSession.id, name: semesterName },
        },
        update: {},
        create: { sessionId: activeSession.id, name: semesterName },
        select: { id: true },
      });

      await tx.courseOffering.upsert({
        where: {
          courseId_sessionId_semesterId: {
            courseId: course.id,
            sessionId: activeSession.id,
            semesterId: semester.id,
          },
        },
        update: { isActive: true, departmentId: dept.departmentId },
        create: {
          courseId: course.id,
          departmentId: dept.departmentId,
          sessionId: activeSession.id,
          semesterId: semester.id,
          isActive: true,
        },
        select: { id: true },
      });

      return course;
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: created.id },
      } satisfies ApiResponse<{ id: string }>,
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request",
          code: "INVALID_INPUT",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: error.status === 401 ? "Unauthorized" : "Forbidden",
          code: error.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create course",
        code: "COURSE_CREATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
