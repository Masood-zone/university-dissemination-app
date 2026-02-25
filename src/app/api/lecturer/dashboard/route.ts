import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";
import type { ApiResponse } from "@/types";

function parseHHmm(value: string): { hours: number; minutes: number } | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  return { hours: Number(m[1]), minutes: Number(m[2]) };
}

function minutesBetween(startTime: string, endTime: string): number {
  const s = parseHHmm(startTime);
  const e = parseHHmm(endTime);
  if (!s || !e) return 0;

  const start = s.hours * 60 + s.minutes;
  const end = e.hours * 60 + e.minutes;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;

  // Ignore negative durations (bad data)
  return Math.max(0, end - start);
}

function nextOccurrence(options: {
  now: Date;
  dayOfWeek: number;
  startTime: string;
}): Date | null {
  const parsed = parseHHmm(options.startTime);
  if (!parsed) return null;

  const { now, dayOfWeek } = options;
  const nowDay = now.getDay();
  const normalizedTarget = ((dayOfWeek % 7) + 7) % 7;
  const diffDays = (normalizedTarget - nowDay + 7) % 7;

  const candidate = new Date(now);
  candidate.setHours(0, 0, 0, 0);
  candidate.setDate(candidate.getDate() + diffDays);
  candidate.setHours(parsed.hours, parsed.minutes, 0, 0);

  if (diffDays === 0 && candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return candidate;
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export type LecturerDashboardCoursePreview = {
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  credits: number;
  sessionName: string;
  semesterName: string;
  enrolledCount: number;
};

export type LecturerUpcomingClass = {
  id: string;
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  startsAt: string;
};

export type LecturerDashboardAnnouncementPreview = {
  id: string;
  title: string;
  excerpt: string | null;
  courseCode: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type LecturerDashboardAnalyticsResponse = {
  summary: {
    assignedCourses: number;
    totalStudents: number;
    weeklyHours: number;
    myAnnouncements: number;
  };
  assignedCoursesPreview: LecturerDashboardCoursePreview[];
  upcomingSchedule: LecturerUpcomingClass[];
  recentAnnouncements: LecturerDashboardAnnouncementPreview[];
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
            course: {
              select: {
                code: true,
                title: true,
                credits: true,
              },
            },
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const assignedCourses = assignments.length;
    const totalStudents = assignments.reduce(
      (sum, a) => sum + (a.offering?._count.enrollments ?? 0),
      0,
    );

    const assignmentIds = assignments.map((a) => a.id);

    const timetableRows = assignmentIds.length
      ? await prisma.timetable.findMany({
          where: { assignmentId: { in: assignmentIds } },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            location: true,
            assignment: {
              select: {
                offering: {
                  select: {
                    id: true,
                    course: { select: { code: true, title: true } },
                  },
                },
              },
            },
          },
        })
      : [];

    const weeklyMinutes = timetableRows.reduce(
      (sum, row) => sum + minutesBetween(row.startTime, row.endTime),
      0,
    );
    const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10;

    const myAnnouncements = await prisma.announcement.count({
      where: { authorId: userId },
    });

    const recentAnnouncements = await prisma.announcement.findMany({
      where: { authorId: userId },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        createdAt: true,
        courseOffering: {
          select: {
            course: { select: { code: true } },
          },
        },
      },
    });

    const now = new Date();

    const upcomingSchedule = timetableRows
      .map((row) => {
        const offering = row.assignment?.offering;
        const course = offering?.course;
        if (!offering?.id || !course) return null;

        const startsAt = nextOccurrence({
          now,
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
        });

        if (!startsAt) return null;

        return {
          id: row.id,
          offeringId: offering.id,
          courseCode: course.code,
          courseTitle: course.title,
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          location: row.location,
          startsAt: startsAt.toISOString(),
        } satisfies LecturerUpcomingClass;
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(a!.startsAt).getTime() - new Date(b!.startsAt).getTime(),
      )
      .slice(0, 5) as LecturerUpcomingClass[];

    const assignedCoursesPreview: LecturerDashboardCoursePreview[] = assignments
      .slice(0, 3)
      .map((a) => {
        const offering = a.offering;
        return {
          offeringId: a.offeringId,
          courseCode: offering.course.code,
          courseTitle: offering.course.title,
          credits: offering.course.credits,
          sessionName: offering.session.name,
          semesterName: offering.semester.name,
          enrolledCount: offering._count.enrollments,
        };
      });

    const payload: LecturerDashboardAnalyticsResponse = {
      summary: {
        assignedCourses,
        totalStudents,
        weeklyHours,
        myAnnouncements,
      },
      assignedCoursesPreview,
      upcomingSchedule,
      recentAnnouncements: recentAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt ?? null,
        courseCode: a.courseOffering?.course.code ?? null,
        publishedAt: toIso(a.publishedAt),
        createdAt: a.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<LecturerDashboardAnalyticsResponse>,
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
        message: "Failed to load dashboard",
        code: "DASHBOARD_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
