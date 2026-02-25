import { NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/server";
import { ensureStudentEnrollmentsForCurrentSemester } from "@/lib/student-auto-enrollment";
import type {
  ApiResponse,
  StudentCourseOfferingRow,
  StudentCourseOfferingsResponse,
} from "@/types";

function formatUserName(user: {
  name: string;
  firstName: string;
  lastName: string;
}): string {
  if (user.name?.trim()) return user.name.trim();
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
}

export async function GET(request: Request) {
  try {
    const session = await requireStudent(request);
    const userId = session.user.id;

    const latestApplication = await prisma.application.findFirst({
      where: { applicantId: userId },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    });

    if (
      !latestApplication ||
      latestApplication.status !== ApplicationStatus.APPROVED
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access restricted until enrollment is approved",
          code: "ACCESS_RESTRICTED",
        } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    await ensureStudentEnrollmentsForCurrentSemester({ studentId: userId });

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      select: {
        offering: {
          select: {
            id: true,
            department: { select: { name: true } },
            session: { select: { name: true } },
            semester: { select: { name: true } },
            course: {
              select: {
                code: true,
                title: true,
                credits: true,
                semester: true,
                level: true,
              },
            },
            assignments: {
              select: {
                lecturer: {
                  select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            timetableEntries: {
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                location: true,
                lecturer: true,
              },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
          },
        },
      },
    });

    const rows: StudentCourseOfferingRow[] = enrollments.map((e) => {
      const offering = e.offering;
      const course = offering.course;
      const lecturers = offering.assignments
        .map((a) => ({
          id: a.lecturer.id,
          name: formatUserName(a.lecturer),
        }))
        .filter((l) => l.name.length > 0);

      return {
        offeringId: offering.id,
        courseCode: course.code,
        courseTitle: course.title,
        credits: course.credits,
        semester: course.semester,
        level: course.level ?? null,
        departmentName: offering.department?.name ?? null,
        sessionName: offering.session.name,
        semesterName: offering.semester.name,
        lecturers,
        timetable: offering.timetableEntries.map((t) => ({
          id: t.id,
          dayOfWeek: t.dayOfWeek,
          startTime: t.startTime,
          endTime: t.endTime,
          location: t.location,
          lecturer: t.lecturer ?? null,
        })),
      };
    });

    rows.sort((a, b) => a.courseCode.localeCompare(b.courseCode));

    const first = rows[0] ?? null;

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionName: first?.sessionName ?? null,
          semesterName: first?.semesterName ?? null,
          rows,
        } satisfies StudentCourseOfferingsResponse,
      } satisfies ApiResponse<StudentCourseOfferingsResponse>,
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load course offerings";
    return NextResponse.json(
      {
        success: false,
        message,
        code: "SERVER_ERROR",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
