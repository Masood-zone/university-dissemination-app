import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";
import type { ApiResponse } from "@/types";

export type LecturerCourseTimetableRow = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
};

export type LecturerAssignedCourse = {
  assignmentId: string;
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  courseDescription: string | null;
  credits: number;
  level: number | null;
  courseSemesterNumber: number;
  sessionName: string;
  semesterName: string;
  departmentName: string;
  enrolledCount: number;
  timetable: LecturerCourseTimetableRow[];
};

export type LecturerCoursesResponse = {
  rows: LecturerAssignedCourse[];
};

export async function GET(request: Request) {
  try {
    const session = await requireLecturer(request);
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

    const assignments = await prisma.courseAssignment.findMany({
      where: { lecturerId: userId },
      select: {
        id: true,
        offeringId: true,
        offering: {
          select: {
            id: true,
            session: { select: { name: true } },
            semester: { select: { name: true } },
            department: { select: { name: true } },
            course: {
              select: {
                code: true,
                title: true,
                description: true,
                credits: true,
                semester: true,
                level: true,
              },
            },
            _count: { select: { enrollments: true } },
            timetableEntries: {
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                location: true,
              },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows: LecturerAssignedCourse[] = assignments
      .map((a) => {
        const offering = a.offering;
        const course = offering.course;

        return {
          assignmentId: a.id,
          offeringId: offering.id,
          courseCode: course.code,
          courseTitle: course.title,
          courseDescription: course.description ?? null,
          credits: course.credits,
          level: course.level ?? null,
          courseSemesterNumber: course.semester,
          sessionName: offering.session.name,
          semesterName: offering.semester.name,
          departmentName: offering.department.name,
          enrolledCount: offering._count.enrollments,
          timetable: offering.timetableEntries.map((t) => ({
            id: t.id,
            dayOfWeek: t.dayOfWeek,
            startTime: t.startTime,
            endTime: t.endTime,
            location: t.location,
          })),
        };
      })
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode));

    const payload: LecturerCoursesResponse = { rows };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<LecturerCoursesResponse>,
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
