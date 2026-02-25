import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";
import type { ApiResponse } from "@/types";

export type LecturerMessagingOfferingThread = {
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  level: number | null;
  enrolledCount: number;
};

export type LecturerMessagingUserThread = {
  userId: string;
  name: string;
  departmentName: string | null;
  avatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  offeringId: string | null;
  courseCode: string | null;
};

export type LecturerMessagingThreadsResponse = {
  offerings: LecturerMessagingOfferingThread[];
  users: LecturerMessagingUserThread[];
};

function excerpt(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 60 ? `${cleaned.slice(0, 60)}...` : cleaned;
}

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

    const url = new URL(request.url);
    const offeringId = url.searchParams.get("offeringId");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

    const assignments = await prisma.courseAssignment.findMany({
      where: { lecturerId },
      select: {
        offeringId: true,
        offering: {
          select: {
            id: true,
            course: { select: { code: true, title: true, level: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const offeringIds = assignments.map((a) => a.offeringId);

    const offerings: LecturerMessagingOfferingThread[] = assignments
      .map((a) => a.offering)
      .map((o) => ({
        offeringId: o.id,
        courseCode: o.course.code,
        courseTitle: o.course.title,
        level: o.course.level ?? null,
        enrolledCount: o._count.enrollments,
      }))
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode));

    if (!offeringIds.length) {
      const payload: LecturerMessagingThreadsResponse = {
        offerings,
        users: [],
      };
      return NextResponse.json(
        {
          success: true,
          data: payload,
        } satisfies ApiResponse<LecturerMessagingThreadsResponse>,
        { status: 200 },
      );
    }

    if (offeringId && !offeringIds.includes(offeringId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
          code: "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        offeringId: offeringId ? offeringId : { in: offeringIds },
      },
      select: {
        offeringId: true,
        offering: { select: { course: { select: { code: true } } } },
        student: {
          select: {
            id: true,
            name: true,
            avatar: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    const studentsById = new Map<
      string,
      {
        id: string;
        name: string;
        avatar: string | null;
        departmentName: string | null;
        offeringId: string;
        courseCode: string;
      }
    >();

    for (const e of enrollments) {
      if (studentsById.has(e.student.id)) continue;

      studentsById.set(e.student.id, {
        id: e.student.id,
        name: e.student.name,
        avatar: e.student.avatar ?? null,
        departmentName: e.student.department?.name ?? null,
        offeringId: e.offeringId,
        courseCode: e.offering.course.code,
      });
    }

    const studentIds = Array.from(studentsById.keys());

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: lecturerId, recipientId: { in: studentIds } },
          { recipientId: lecturerId, senderId: { in: studentIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        content: true,
        createdAt: true,
      },
    });

    const latestByStudentId = new Map<
      string,
      { content: string; createdAt: Date }
    >();

    for (const m of messages) {
      const counterpartId =
        m.senderId === lecturerId ? m.recipientId : m.senderId;
      if (!studentsById.has(counterpartId)) continue;
      if (latestByStudentId.has(counterpartId)) continue;
      latestByStudentId.set(counterpartId, {
        content: m.content,
        createdAt: m.createdAt,
      });
    }

    const users: LecturerMessagingUserThread[] = Array.from(
      studentsById.values(),
    )
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.courseCode.toLowerCase().includes(q)
        );
      })
      .map((s) => {
        const latest = latestByStudentId.get(s.id) ?? null;
        return {
          userId: s.id,
          name: s.name,
          departmentName: s.departmentName,
          avatar: s.avatar,
          lastMessage: latest ? excerpt(latest.content) : null,
          lastMessageAt: latest ? latest.createdAt.toISOString() : null,
          offeringId: s.offeringId,
          courseCode: s.courseCode,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });

    const payload: LecturerMessagingThreadsResponse = { offerings, users };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<LecturerMessagingThreadsResponse>,
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
        message: "Failed to load threads",
        code: "MESSAGING_THREADS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
