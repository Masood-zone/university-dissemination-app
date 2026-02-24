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
  DepartmentAdminUpdateCourseInput,
} from "@/types/index";

const updateCourseSchema = z.object({
  programmeId: z.string().min(1).nullable().optional(),
  code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  credits: z.number().int().min(1).max(30).optional(),
  semester: z.number().int().min(1).max(2).optional(),
  level: z.number().int().min(0).max(1000).nullable().optional(),
});

function semesterNumberToName(semester: number): SemesterName {
  return semester === 2 ? SemesterName.SECOND : SemesterName.FIRST;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const json = (await request.json()) as unknown;
    const input = updateCourseSchema.parse(
      json,
    ) satisfies DepartmentAdminUpdateCourseInput;

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    const course = await prisma.course.findFirst({
      where: { id, departmentId: dept.departmentId },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message: "Course not found",
          code: "COURSE_NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id },
        data: {
          code: input.code ? input.code.trim().toUpperCase() : undefined,
          title: input.title ? input.title.trim() : undefined,
          credits: input.credits,
          semester: input.semester,
          level: input.level === undefined ? undefined : input.level,
          programmeId:
            input.programmeId === undefined ? undefined : input.programmeId,
        },
      });

      if (activeSession && typeof input.semester === "number") {
        const semesterName = semesterNumberToName(input.semester);
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
              courseId: id,
              sessionId: activeSession.id,
              semesterId: semester.id,
            },
          },
          update: { isActive: true, departmentId: dept.departmentId },
          create: {
            courseId: id,
            departmentId: dept.departmentId,
            sessionId: activeSession.id,
            semesterId: semester.id,
            isActive: true,
          },
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: { id },
      } satisfies ApiResponse<{ id: string }>,
      { status: 200 },
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
        message: "Failed to update course",
        code: "COURSE_UPDATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const course = await prisma.course.findFirst({
      where: { id, departmentId: dept.departmentId },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message: "Course not found",
          code: "COURSE_NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    await prisma.course.delete({ where: { id } });

    return NextResponse.json(
      {
        success: true,
        data: { id },
      } satisfies ApiResponse<{ id: string }>,
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
        message: "Failed to delete course",
        code: "COURSE_DELETE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
