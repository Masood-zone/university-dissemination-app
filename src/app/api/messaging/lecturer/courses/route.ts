import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";
import type { ApiResponse } from "@/types";

export type LecturerMessagingCourseRow = {
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  level: number | null;
  semesterName: string;
  sessionName: string;
  enrolledCount: number;
};

export type LecturerMessagingCoursesResponse = {
  rows: LecturerMessagingCourseRow[];
};

export async function GET(request: Request) {
  try {
    const session = await requireLecturer(request);
    const lecturerId = session.user?.id;

    if (!lecturerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const assignments = await prisma.courseAssignment.findMany({
      where: { lecturerId },
      select: {
        offering: {
          select: {
            id: true,
            session: { select: { name: true } },
            semester: { select: { name: true } },
            course: { select: { code: true, title: true, level: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows: LecturerMessagingCourseRow[] = assignments
      .map((a) => a.offering)
      .map((o) => ({
        offeringId: o.id,
        courseCode: o.course.code,
        courseTitle: o.course.title,
        level: o.course.level ?? null,
        semesterName: o.semester.name,
        sessionName: o.session.name,
        enrolledCount: o._count.enrollments,
      }))
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode));

    const payload: LecturerMessagingCoursesResponse = { rows };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<LecturerMessagingCoursesResponse>,
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
        code: "MESSAGING_COURSES_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
