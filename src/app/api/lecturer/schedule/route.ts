import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";
import type { ApiResponse } from "@/types";

function parseHHmm(value: string): { hours: number; minutes: number } | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  return { hours: Number(m[1]), minutes: Number(m[2]) };
}

function formatHHmm(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toIso(value: Date): string {
  return value.toISOString();
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function startOfWeekSunday(anchor: Date): Date {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function dateForWeekdayTime(options: {
  weekStart: Date;
  dayOfWeek: number;
  time: string;
}): Date | null {
  const parsed = parseHHmm(options.time);
  if (!parsed) return null;

  const normalizedTarget = ((options.dayOfWeek % 7) + 7) % 7;
  const d = new Date(options.weekStart);
  d.setDate(d.getDate() + normalizedTarget);
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  return d;
}

function dateForDateTime(options: { date: Date; time: string }): Date | null {
  const parsed = parseHHmm(options.time);
  if (!parsed) return null;

  const d = new Date(options.date);
  d.setHours(0, 0, 0, 0);
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  return d;
}

function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type LecturerScheduleEventKind = "CLASS" | "EXAM";

export type LecturerScheduleEventRow = {
  id: string;
  kind: LecturerScheduleEventKind;
  entityId: string;
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  examType?: string | null;
};

export type LecturerScheduleResponse = {
  rows: LecturerScheduleEventRow[];
};

export type UpdateScheduleEventInput = {
  kind: LecturerScheduleEventKind;
  id: string;
  start: string;
  end: string;
};

export type CreateExamInput = {
  offeringId: string;
  examType: string;
  examDate: string;
  startTime: string;
  endTime: string;
  location: string;
  totalMarks?: number;
  duration?: number;
};

async function ensureLecturerAssignedToOffering(options: {
  lecturerId: string;
  offeringId: string;
}): Promise<boolean> {
  const found = await prisma.courseAssignment.findFirst({
    where: {
      lecturerId: options.lecturerId,
      offeringId: options.offeringId,
    },
    select: { id: true },
  });

  return Boolean(found);
}

async function notifyEnrolledStudents(options: {
  offeringId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const enrollments = await prisma.enrollment.findMany({
    where: { offeringId: options.offeringId },
    select: { studentId: true },
  });

  if (!enrollments.length) return;

  await prisma.notification.createMany({
    data: enrollments.map((e) => ({
      userId: e.studentId,
      type: NotificationType.ACADEMIC,
      title: options.title,
      message: options.message,
      isRead: false,
      metadata:
        options.metadata === undefined ? null : safeStringify(options.metadata),
    })),
  });
}

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
        offeringId: true,
        offering: {
          select: {
            id: true,
            course: { select: { code: true, title: true } },
            timetableEntries: {
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                location: true,
              },
            },
            exams: {
              select: {
                id: true,
                examType: true,
                examDate: true,
                startTime: true,
                endTime: true,
                location: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();
    const weekStart = startOfWeekSunday(now);

    const rows: LecturerScheduleEventRow[] = [];

    for (const a of assignments) {
      const offering = a.offering;
      const course = offering.course;

      for (const t of offering.timetableEntries) {
        const startDate = dateForWeekdayTime({
          weekStart,
          dayOfWeek: t.dayOfWeek,
          time: t.startTime,
        });
        const endDate = dateForWeekdayTime({
          weekStart,
          dayOfWeek: t.dayOfWeek,
          time: t.endTime,
        });

        if (!startDate || !endDate) continue;

        const safeEnd =
          endDate.getTime() <= startDate.getTime()
            ? new Date(startDate.getTime() + 60 * 60 * 1000)
            : endDate;

        rows.push({
          id: `CLASS:${t.id}`,
          kind: "CLASS",
          entityId: t.id,
          offeringId: offering.id,
          courseCode: course.code,
          courseTitle: course.title,
          start: toIso(startDate),
          end: toIso(safeEnd),
          allDay: false,
          location: t.location || null,
        });
      }

      for (const e of offering.exams) {
        const startDate = dateForDateTime({
          date: e.examDate,
          time: e.startTime,
        });
        const endDate = dateForDateTime({ date: e.examDate, time: e.endTime });

        if (!startDate || !endDate) continue;

        const safeEnd =
          endDate.getTime() <= startDate.getTime()
            ? new Date(startDate.getTime() + 60 * 60 * 1000)
            : endDate;

        rows.push({
          id: `EXAM:${e.id}`,
          kind: "EXAM",
          entityId: e.id,
          offeringId: offering.id,
          courseCode: course.code,
          courseTitle: course.title,
          start: toIso(startDate),
          end: toIso(safeEnd),
          allDay: false,
          location: e.location || null,
          examType: e.examType,
        });
      }
    }

    const payload: LecturerScheduleResponse = {
      rows: rows.sort((a, b) => a.start.localeCompare(b.start)),
    };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<LecturerScheduleResponse>,
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
        message: "Failed to load schedule",
        code: "SCHEDULE_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = (await request.json()) as Partial<UpdateScheduleEventInput>;

    const kind =
      body.kind === "CLASS" || body.kind === "EXAM" ? body.kind : null;
    const id = typeof body.id === "string" ? body.id : "";
    const start = typeof body.start === "string" ? new Date(body.start) : null;
    const end = typeof body.end === "string" ? new Date(body.end) : null;

    if (
      !kind ||
      !id ||
      !start ||
      Number.isNaN(start.getTime()) ||
      !end ||
      Number.isNaN(end.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (kind === "CLASS") {
      const timetable = await prisma.timetable.findUnique({
        where: { id },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          location: true,
          offeringId: true,
          assignmentId: true,
          assignment: { select: { offeringId: true } },
          offering: {
            select: { course: { select: { code: true, title: true } } },
          },
        },
      });

      if (!timetable) {
        return NextResponse.json(
          {
            success: false,
            message: "Not found",
            code: "NOT_FOUND",
          } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }

      const offeringId =
        timetable.offeringId ?? timetable.assignment?.offeringId ?? null;

      if (!offeringId) {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot reschedule this class",
            code: "VALIDATION_ERROR",
          } satisfies ApiResponse<never>,
          { status: 400 },
        );
      }

      const allowed = await ensureLecturerAssignedToOffering({
        lecturerId: userId,
        offeringId,
      });

      if (!allowed) {
        return NextResponse.json(
          {
            success: false,
            message: "Forbidden",
            code: "FORBIDDEN",
          } satisfies ApiResponse<never>,
          { status: 403 },
        );
      }

      const startTime = formatHHmm(start);
      const endTime = formatHHmm(end);
      const dayOfWeek = start.getDay();

      const updated = await prisma.timetable.update({
        where: { id },
        data: { dayOfWeek, startTime, endTime },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          location: true,
        },
      });

      const courseCode = timetable.offering?.course.code ?? "";
      const courseTitle = timetable.offering?.course.title ?? "";

      await notifyEnrolledStudents({
        offeringId,
        title: "Class rescheduled",
        message: courseCode
          ? `${courseCode} (${courseTitle}) has a new class time.`
          : "A class has been rescheduled.",
        metadata: {
          kind: "CLASS",
          timetableId: updated.id,
          offeringId,
          dayOfWeek: updated.dayOfWeek,
          startTime: updated.startTime,
          endTime: updated.endTime,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            kind: "CLASS" as const,
            timetableId: updated.id,
          },
        } satisfies ApiResponse<{ kind: "CLASS"; timetableId: string }>,
        { status: 200 },
      );
    }

    // kind === "EXAM"
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        offeringId: true,
        examType: true,
        examDate: true,
        startTime: true,
        endTime: true,
        location: true,
        offering: {
          select: { course: { select: { code: true, title: true } } },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        {
          success: false,
          message: "Not found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    const allowed = await ensureLecturerAssignedToOffering({
      lecturerId: userId,
      offeringId: exam.offeringId,
    });

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
          code: "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        examDate: toMidnight(start),
        startTime: formatHHmm(start),
        endTime: formatHHmm(end),
      },
      select: { id: true, examType: true },
    });

    const courseCode = exam.offering.course.code;
    const courseTitle = exam.offering.course.title;

    await notifyEnrolledStudents({
      offeringId: exam.offeringId,
      title: `${updatedExam.examType} rescheduled`,
      message: `${courseCode} (${courseTitle}) ${updatedExam.examType} date/time updated.`,
      metadata: {
        kind: "EXAM",
        examId: updatedExam.id,
        offeringId: exam.offeringId,
        examType: updatedExam.examType,
        examDate: toMidnight(start).toISOString(),
        startTime: formatHHmm(start),
        endTime: formatHHmm(end),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          kind: "EXAM" as const,
          examId: updatedExam.id,
        },
      } satisfies ApiResponse<{ kind: "EXAM"; examId: string }>,
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
        message: "Failed to update schedule",
        code: "SCHEDULE_UPDATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    const body = (await request.json()) as Partial<CreateExamInput>;

    const offeringId =
      typeof body.offeringId === "string" ? body.offeringId : "";
    const examType =
      typeof body.examType === "string" ? body.examType.trim() : "";
    const examDate =
      typeof body.examDate === "string" ? new Date(body.examDate) : null;
    const startTime =
      typeof body.startTime === "string" ? body.startTime.trim() : "";
    const endTime = typeof body.endTime === "string" ? body.endTime.trim() : "";
    const location =
      typeof body.location === "string" ? body.location.trim() : "";

    if (
      !offeringId ||
      !examType ||
      !examDate ||
      Number.isNaN(examDate.getTime()) ||
      !parseHHmm(startTime) ||
      !parseHHmm(endTime) ||
      !location
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const allowed = await ensureLecturerAssignedToOffering({
      lecturerId: userId,
      offeringId,
    });

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
          code: "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const marks =
      typeof body.totalMarks === "number" && Number.isFinite(body.totalMarks)
        ? Math.max(0, Math.floor(body.totalMarks))
        : 100;

    const parsedStart = parseHHmm(startTime)!;
    const parsedEnd = parseHHmm(endTime)!;

    const durationFromTimes =
      parsedEnd.hours * 60 +
      parsedEnd.minutes -
      (parsedStart.hours * 60 + parsedStart.minutes);

    const duration =
      typeof body.duration === "number" && Number.isFinite(body.duration)
        ? Math.max(1, Math.floor(body.duration))
        : durationFromTimes > 0
          ? durationFromTimes
          : 60;

    const created = await prisma.exam.create({
      data: {
        offeringId,
        examType,
        examDate: toMidnight(examDate),
        startTime,
        endTime,
        location,
        totalMarks: marks,
        duration,
      },
      select: {
        id: true,
        examType: true,
        examDate: true,
        startTime: true,
        endTime: true,
        location: true,
        offering: {
          select: {
            course: { select: { code: true, title: true } },
          },
        },
      },
    });

    const startDate = dateForDateTime({
      date: created.examDate,
      time: created.startTime,
    });
    const endDate = dateForDateTime({
      date: created.examDate,
      time: created.endTime,
    });

    if (startDate && endDate) {
      await notifyEnrolledStudents({
        offeringId,
        title: `${created.examType} scheduled`,
        message: `${created.offering.course.code} (${created.offering.course.title}) ${created.examType} has been scheduled.`,
        metadata: {
          kind: "EXAM",
          examId: created.id,
          offeringId,
          examType: created.examType,
          examDate: created.examDate.toISOString(),
          startTime: created.startTime,
          endTime: created.endTime,
        },
      });

      const row: LecturerScheduleEventRow = {
        id: `EXAM:${created.id}`,
        kind: "EXAM",
        entityId: created.id,
        offeringId,
        courseCode: created.offering.course.code,
        courseTitle: created.offering.course.title,
        start: toIso(startDate),
        end: toIso(endDate),
        allDay: false,
        location: created.location || null,
        examType: created.examType,
      };

      return NextResponse.json(
        {
          success: true,
          data: row,
        } satisfies ApiResponse<LecturerScheduleEventRow>,
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: created.id },
      } satisfies ApiResponse<{ id: string }>,
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

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create exam",
        code: "EXAM_CREATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
