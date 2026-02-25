import { NextResponse } from "next/server";
import { ApplicationStatus, AnnouncementStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/server";
import { ensureStudentEnrollmentsForCurrentSemester } from "@/lib/student-auto-enrollment";
import type { ApiResponse, StudentDashboardAnalytics } from "@/types";

function parseHHmm(value: string): { hours: number; minutes: number } | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  return { hours: Number(m[1]), minutes: Number(m[2]) };
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

export async function GET(request: Request) {
  try {
    const session = await requireStudent(request);
    const userId = session.user.id;

    // Keep fee statuses fresh for dashboard indicators.
    await prisma.fee.updateMany({
      where: {
        studentId: userId,
        status: "PENDING",
        dueDate: { lt: new Date() },
      },
      data: { status: "OVERDUE" },
    });

    const latestApplication = await prisma.application.findFirst({
      where: { applicantId: userId },
      orderBy: { createdAt: "desc" },
      select: { status: true, departmentId: true },
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

    const now = new Date();
    const departmentId = latestApplication.departmentId;

    // Ensure approved students are enrolled into current semester offerings.
    await ensureStudentEnrollmentsForCurrentSemester({ studentId: userId });

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      select: { offeringId: true },
    });
    const offeringIds = enrollments.map((e) => e.offeringId);

    const [
      timetables,
      feesAgg,
      assessedAgg,
      paidAgg,
      nextDueFee,
      announcements,
      exams,
    ] = await Promise.all([
      offeringIds.length
        ? prisma.timetable.findMany({
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
                  course: {
                    select: { code: true, title: true },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
      prisma.fee.aggregate({
        where: {
          studentId: userId,
          status: { in: ["PENDING", "OVERDUE"] },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.fee.aggregate({
        where: {
          studentId: userId,
          status: { not: "CANCELLED" },
        },
        _sum: { amount: true },
      }),
      prisma.fee.aggregate({
        where: {
          studentId: userId,
          status: "PAID",
        },
        _sum: { amount: true },
      }),
      prisma.fee.findFirst({
        where: {
          studentId: userId,
          status: { in: ["PENDING", "OVERDUE"] },
        },
        orderBy: { dueDate: "asc" },
        select: { dueDate: true },
      }),
      prisma.announcement.findMany({
        where: {
          status: AnnouncementStatus.PUBLISHED,
          AND: [
            {
              OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
            },
            {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            {
              OR: [{ departmentId: null }, { departmentId }],
            },
          ],
        },
        orderBy: [
          { pinned: "desc" },
          { priority: "desc" },
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
        take: 5,
        select: {
          id: true,
          title: true,
          excerpt: true,
          category: true,
          pinned: true,
          priority: true,
          publishedAt: true,
          createdAt: true,
          department: { select: { name: true } },
        },
      }),
      offeringIds.length
        ? prisma.exam.findMany({
            where: {
              offeringId: { in: offeringIds },
              examDate: { gte: now },
            },
            orderBy: [{ examDate: "asc" }],
            take: 5,
            select: {
              id: true,
              examType: true,
              examDate: true,
              startTime: true,
              endTime: true,
              location: true,
              offering: {
                select: {
                  course: {
                    select: {
                      code: true,
                      title: true,
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const pendingCount = await prisma.fee.count({
      where: { studentId: userId, status: "PENDING" },
    });
    const overdueCount = await prisma.fee.count({
      where: { studentId: userId, status: "OVERDUE" },
    });

    let nextClass: StudentDashboardAnalytics["nextClass"] = null;
    let nextClassStart: Date | null = null;

    for (const row of timetables) {
      if (!row.offering?.course) continue;
      const startsAt = nextOccurrence({
        now,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
      });
      if (!startsAt) continue;

      if (!nextClassStart || startsAt.getTime() < nextClassStart.getTime()) {
        nextClassStart = startsAt;
        nextClass = {
          offeringId: row.offering?.id ?? null,
          courseCode: row.offering.course.code,
          courseTitle: row.offering.course.title,
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          location: row.location,
          lecturer: row.lecturer ?? null,
          startsAt: startsAt.toISOString(),
        };
      }
    }

    const nextClassInMinutes =
      nextClassStart && nextClassStart.getTime() > now.getTime()
        ? Math.max(
            0,
            Math.floor((nextClassStart.getTime() - now.getTime()) / 60000),
          )
        : null;

    const deadlineItems: StudentDashboardAnalytics["deadlines"] = [];

    if (nextDueFee?.dueDate) {
      deadlineItems.push({
        id: "fee-next-due",
        kind: "FEE",
        title: "Fee payment due",
        subtitle: "Outstanding fee",
        dueAt: nextDueFee.dueDate.toISOString(),
      });
    }

    for (const ex of exams) {
      const course = ex.offering.course;
      deadlineItems.push({
        id: ex.id,
        kind: "EXAM",
        title: `${course.code} ${ex.examType}`.trim(),
        subtitle: `${ex.location} • ${ex.startTime} - ${ex.endTime}`.trim(),
        dueAt: ex.examDate.toISOString(),
      });
    }

    const payload: StudentDashboardAnalytics = {
      nextClass,
      nextClassInMinutes,
      fees: {
        assessedTotal: assessedAgg._sum.amount ?? 0,
        paidTotal: paidAgg._sum.amount ?? 0,
        outstandingTotal: feesAgg._sum.amount ?? 0,
        currency: "GHS",
        pendingCount,
        overdueCount,
        nextDueAt: toIso(nextDueFee?.dueDate),
      },
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt ?? null,
        category: a.category,
        pinned: a.pinned,
        priority: a.priority,
        departmentName: a.department?.name ?? null,
        publishedAt: toIso(a.publishedAt) ?? toIso(a.createdAt),
      })),
      deadlines: deadlineItems
        .slice()
        .sort(
          (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
        )
        .slice(0, 5),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<StudentDashboardAnalytics>);
  } catch (error) {
    if (error instanceof Response) {
      const status = error.status || 401;
      const code = status === 403 ? "FORBIDDEN" : "UNAUTHORIZED";
      const message = status === 403 ? "Forbidden" : "Unauthorized";

      return NextResponse.json(
        {
          success: false,
          message,
          code,
        } satisfies ApiResponse<never>,
        { status },
      );
    }

    // Avoid leaking Prisma internals
    const isKnown = error instanceof Prisma.PrismaClientKnownRequestError;
    if (isKnown && process.env.NODE_ENV !== "production") {
      console.error("[api][student][dashboard] Prisma error", error);
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load student dashboard",
        code: "STUDENT_DASHBOARD_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
