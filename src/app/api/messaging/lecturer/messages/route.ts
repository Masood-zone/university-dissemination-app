import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";
import { notifyUsersOfNewMessage } from "@/lib/message-notifications";
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

export type LecturerConversationResponse = {
  rows: MessagingMessageRow[];
};

export type LecturerSendMessageInput = {
  recipientIds: string[];
  content: string;
  offeringId?: string | null;
};

async function getAllowedStudentIdsForLecturer(options: {
  lecturerId: string;
  offeringId?: string | null;
}): Promise<Set<string>> {
  const assignments = await prisma.courseAssignment.findMany({
    where: {
      lecturerId: options.lecturerId,
      ...(options.offeringId ? { offeringId: options.offeringId } : null),
    },
    select: { offeringId: true },
  });

  const offeringIds = assignments.map((a) => a.offeringId);

  if (!offeringIds.length) return new Set();

  const enrollments = await prisma.enrollment.findMany({
    where: { offeringId: { in: offeringIds } },
    select: { studentId: true },
  });

  return new Set(enrollments.map((e) => e.studentId));
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

    const allowedStudentIds = await getAllowedStudentIdsForLecturer({
      lecturerId,
    });

    if (!allowedStudentIds.has(withUserId)) {
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
          { senderId: lecturerId, recipientId: withUserId },
          { senderId: withUserId, recipientId: lecturerId },
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

    const payload: LecturerConversationResponse = {
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
      } satisfies ApiResponse<LecturerConversationResponse>,
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
        code: "MESSAGING_MESSAGES_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    const body = (await request.json()) as Partial<LecturerSendMessageInput>;

    const content = typeof body.content === "string" ? body.content.trim() : "";
    const offeringId =
      body.offeringId == null
        ? null
        : typeof body.offeringId === "string"
          ? body.offeringId
          : null;

    const recipientIds = Array.isArray(body.recipientIds)
      ? body.recipientIds.filter((v): v is string => typeof v === "string")
      : [];

    const uniqueRecipientIds = Array.from(new Set(recipientIds));

    if (!uniqueRecipientIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one recipient is required",
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

    const allowedStudentIds = await getAllowedStudentIdsForLecturer({
      lecturerId,
      offeringId,
    });

    const invalid = uniqueRecipientIds.filter(
      (id) => !allowedStudentIds.has(id),
    );

    if (invalid.length) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more recipients are not in your courses",
          code: "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const sender = await prisma.user.findUnique({
      where: { id: lecturerId },
      select: { name: true },
    });

    const senderName = sender?.name || "Lecturer";

    const now = new Date();

    // Create messages (batch-safe)
    await prisma.message.createMany({
      data: uniqueRecipientIds.map((recipientId) => ({
        senderId: lecturerId,
        recipientId,
        content,
        status: "SENT",
        createdAt: now,
        updatedAt: now,
      })),
    });

    // Notifications for all recipients (required for batch sends)
    await prisma.notification.createMany({
      data: uniqueRecipientIds.map((userId) => ({
        userId,
        type: NotificationType.MESSAGE,
        title: "New message",
        message: `You have a new message from ${senderName}.`,
        isRead: false,
        metadata: safeStringify({
          kind: "MESSAGE",
          senderId: lecturerId,
        }),
      })),
    });

    // External notifications (email + sms). Best-effort.
    await notifyUsersOfNewMessage({
      senderName,
      recipientIds: uniqueRecipientIds,
      messagePreview: content,
    });

    return NextResponse.json(
      {
        success: true,
        data: { count: uniqueRecipientIds.length },
      } satisfies ApiResponse<{ count: number }>,
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
        code: "MESSAGING_MESSAGE_SEND_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
