import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/server";
import type { ApiResponse } from "@/types";

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export type MessagingMessageRow = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
};

export type StudentConversationResponse = {
  rows: MessagingMessageRow[];
};

export type StudentSendMessageInput = {
  recipientId: string;
  content: string;
};

async function getAllowedLecturerIdsForStudent(
  studentId: string,
): Promise<Set<string>> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    select: { offeringId: true },
  });

  const offeringIds = enrollments.map((e) => e.offeringId);

  if (!offeringIds.length) return new Set();

  const assignments = await prisma.courseAssignment.findMany({
    where: { offeringId: { in: offeringIds } },
    select: { lecturerId: true },
  });

  return new Set(assignments.map((a) => a.lecturerId));
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

    const url = new URL(request.url);
    const withUserId = url.searchParams.get("withUserId");

    if (!withUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "withUserId is required",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const allowedLecturerIds = await getAllowedLecturerIdsForStudent(studentId);

    if (!allowedLecturerIds.has(withUserId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
          code: "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: studentId, recipientId: withUserId },
          { senderId: withUserId, recipientId: studentId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        content: true,
        createdAt: true,
      },
    });

    const payload: StudentConversationResponse = {
      rows: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<StudentConversationResponse>,
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
        message: "Failed to load messages",
        code: "STUDENT_MESSAGING_MESSAGES_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    const body = (await request.json()) as Partial<StudentSendMessageInput>;

    const recipientId =
      typeof body.recipientId === "string" ? body.recipientId : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!recipientId) {
      return NextResponse.json(
        {
          success: false,
          message: "recipientId is required",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "Message content is required",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const allowedLecturerIds = await getAllowedLecturerIdsForStudent(studentId);

    if (!allowedLecturerIds.has(recipientId)) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only message lecturers handling your courses",
          code: "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const created = await prisma.message.create({
      data: {
        senderId: studentId,
        recipientId,
        content,
        status: "SENT",
      },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        content: true,
        createdAt: true,
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: NotificationType.MESSAGE,
        title: "New message",
        message: `You have a new message from ${sender?.name || "a student"}.`,
        isRead: false,
        metadata: safeStringify({
          kind: "MESSAGE",
          senderId: studentId,
        }),
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: created.id,
          senderId: created.senderId,
          recipientId: created.recipientId,
          content: created.content,
          createdAt: created.createdAt.toISOString(),
        },
      } satisfies ApiResponse<MessagingMessageRow>,
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
        message: "Failed to send message",
        code: "STUDENT_MESSAGING_MESSAGE_SEND_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
