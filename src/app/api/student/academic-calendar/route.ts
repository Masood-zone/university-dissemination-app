import { NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/server";
import { ensureStudentEnrollmentsForCurrentSemester } from "@/lib/student-auto-enrollment";
import type {
  ApiResponse,
  StudentAcademicCalendarEvent,
  StudentAcademicCalendarResponse,
} from "@/types";

function parseHHmm(value: string): { hours: number; minutes: number } | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  return { hours: Number(m[1]), minutes: Number(m[2]) };
}

function startOfWeekMonday(anchor: Date): Date {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  // JS: 0=Sun..6=Sat. Convert so Monday is week start.
  const dayIndexFromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayIndexFromMonday);
  return d;
}

function dateForWeekdayTime(options: {
  weekStartMonday: Date;
  dayOfWeek: number;
  time: string;
}): Date | null {
  const parsed = parseHHmm(options.time);
  if (!parsed) return null;

  const normalized = ((options.dayOfWeek % 7) + 7) % 7; // 0=Sun
  const offset = (normalized - 1 + 7) % 7; // Monday -> 0
  const d = new Date(options.weekStartMonday);
  d.setDate(d.getDate() + offset);
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  return d;
}

function toIso(value: Date): string {
  return value.toISOString();
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
      select: { offeringId: true },
    });
    const offeringIds = enrollments.map((e) => e.offeringId);

    const timetables = offeringIds.length
      ? await prisma.timetable.findMany({
          where: { offeringId: { in: offeringIds } },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            location: true,
            lecturer: true,
            offering: {
              select: {
                id: true,
                course: { select: { code: true, title: true } },
              },
            },
          },
        })
      : [];

    const now = new Date();
    const weekStartMonday = startOfWeekMonday(now);
    const weekEnd = new Date(weekStartMonday);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const events: StudentAcademicCalendarEvent[] = [];

    for (const row of timetables) {
      if (!row.offering?.course) continue;
      const start = dateForWeekdayTime({
        weekStartMonday,
        dayOfWeek: row.dayOfWeek,
        time: row.startTime,
      });
      const end = dateForWeekdayTime({
        weekStartMonday,
        dayOfWeek: row.dayOfWeek,
        time: row.endTime,
      });
      if (!start || !end) continue;

      const safeEnd =
        end.getTime() <= start.getTime()
          ? new Date(start.getTime() + 60 * 60 * 1000)
          : end;

      events.push({
        id: row.id,
        offeringId: row.offering.id,
        courseCode: row.offering.course.code,
        courseTitle: row.offering.course.title,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        start: toIso(start),
        end: toIso(safeEnd),
        location: row.location,
        lecturer: row.lecturer ?? null,
      });
    }

    events.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          weekStart: toIso(weekStartMonday),
          weekEnd: toIso(weekEnd),
          events,
        } satisfies StudentAcademicCalendarResponse,
      } satisfies ApiResponse<StudentAcademicCalendarResponse>,
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load academic calendar";
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
