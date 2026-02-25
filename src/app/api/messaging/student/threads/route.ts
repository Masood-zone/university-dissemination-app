import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/server";
import type { ApiResponse } from "@/types";

export type StudentMessagingLecturerThread = {
  userId: string;
  name: string;
  departmentName: string | null;
  avatar: string | null;
  courseCodes: string[];
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export type StudentMessagingThreadsResponse = {
  users: StudentMessagingLecturerThread[];
};

function excerpt(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 60 ? `${cleaned.slice(0, 60)}...` : cleaned;
}

export async function GET(request: Request) {
  try {
    const session = await requireStudent(request);
    const studentId = session.user?.id;

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      select: { offeringId: true },
    });

    const offeringIds = enrollments.map((e) => e.offeringId);

    if (!offeringIds.length) {
      const payload: StudentMessagingThreadsResponse = { users: [] };
      return NextResponse.json(
        {
          success: true,
          data: payload,
        } satisfies ApiResponse<StudentMessagingThreadsResponse>,
        { status: 200 },
      );
    }

    const assignments = await prisma.courseAssignment.findMany({
      where: { offeringId: { in: offeringIds } },
      select: {
        lecturerId: true,
        lecturer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            department: { select: { name: true } },
          },
        },
        offering: {
          select: { course: { select: { code: true } } },
        },
      },
    });

    const lecturers = new Map<
      string,
      {
        userId: string;
        name: string;
        avatar: string | null;
        departmentName: string | null;
        courseCodes: Set<string>;
      }
    >();

    for (const a of assignments) {
      const id = a.lecturer.id;
      const existing = lecturers.get(id);

      if (existing) {
        existing.courseCodes.add(a.offering.course.code);
        continue;
      }

      lecturers.set(id, {
        userId: id,
        name: a.lecturer.name,
        avatar: a.lecturer.avatar ?? null,
        departmentName: a.lecturer.department?.name ?? null,
        courseCodes: new Set([a.offering.course.code]),
      });
    }

    const lecturerIds = Array.from(lecturers.keys());

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: studentId, recipientId: { in: lecturerIds } },
          { recipientId: studentId, senderId: { in: lecturerIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        senderId: true,
        recipientId: true,
        content: true,
        createdAt: true,
      },
    });

    const latestByLecturerId = new Map<
      string,
      { content: string; createdAt: Date }
    >();

    for (const m of messages) {
      const counterpartId =
        m.senderId === studentId ? m.recipientId : m.senderId;
      if (!lecturers.has(counterpartId)) continue;
      if (latestByLecturerId.has(counterpartId)) continue;
      latestByLecturerId.set(counterpartId, {
        content: m.content,
        createdAt: m.createdAt,
      });
    }

    const users: StudentMessagingLecturerThread[] = Array.from(
      lecturers.values(),
    )
      .map((l) => {
        const latest = latestByLecturerId.get(l.userId) ?? null;
        return {
          userId: l.userId,
          name: l.name,
          avatar: l.avatar,
          departmentName: l.departmentName,
          courseCodes: Array.from(l.courseCodes).sort((a, b) =>
            a.localeCompare(b),
          ),
          lastMessage: latest ? excerpt(latest.content) : null,
          lastMessageAt: latest ? latest.createdAt.toISOString() : null,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });

    const payload: StudentMessagingThreadsResponse = { users };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<StudentMessagingThreadsResponse>,
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
        code: "STUDENT_MESSAGING_THREADS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
