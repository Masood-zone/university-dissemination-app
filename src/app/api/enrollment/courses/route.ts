import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse, EnrollmentCourse } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programmeId = searchParams.get("programmeId")?.trim() ?? "";

    if (!programmeId) {
      return NextResponse.json(
        {
          success: false,
          message: "programmeId is required",
          code: "VALIDATION_ERROR",
          errors: { programmeId: ["Required"] },
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const rows = await prisma.course.findMany({
      where: { programmeId },
      select: {
        id: true,
        code: true,
        title: true,
        credits: true,
        semester: true,
      },
      orderBy: [{ semester: "asc" }, { code: "asc" }],
    });

    const payload: EnrollmentCourse[] = rows.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      credits: c.credits,
      semester: c.semester,
    }));

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<EnrollmentCourse[]>);
  } catch {
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
