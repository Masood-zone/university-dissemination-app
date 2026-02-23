import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import { programmeCourseSchema } from "@/lib/validation";
import type {
  ApiResponse,
  CourseData,
  CreateProgrammeCourseInput,
} from "@/types";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const json = (await request.json()) as unknown;
    const input = programmeCourseSchema.parse(
      json,
    ) satisfies CreateProgrammeCourseInput;

    const programme = await prisma.programme.findUnique({
      where: { id: input.programmeId },
      select: { id: true, departmentId: true },
    });

    if (!programme) {
      return NextResponse.json(
        {
          success: false,
          message: "Programme not found",
          code: "PROGRAMME_NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    const created = await prisma.course.create({
      data: {
        programmeId: programme.id,
        departmentId: programme.departmentId,
        title: input.title,
        code: input.code,
        description: input.description,
        credits: input.credits,
        semester: input.semester,
        prerequisites: input.prerequisites,
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        credits: true,
        semester: true,
        capacity: true,
      },
    });

    const payload: CourseData = {
      id: created.id,
      code: created.code,
      title: created.title,
      description: created.description ?? undefined,
      credits: created.credits,
      semester: created.semester,
      capacity: created.capacity ?? undefined,
    };

    return NextResponse.json(
      { success: true, data: payload } satisfies ApiResponse<CourseData>,
      { status: 201 },
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            message: "A course with this code already exists in the department",
            code: "COURSE_ALREADY_EXISTS",
          } satisfies ApiResponse<never>,
          { status: 409 },
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid programme reference",
            code: "PROGRAMME_REFERENCE_INVALID",
          } satisfies ApiResponse<never>,
          { status: 400 },
        );
      }
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
