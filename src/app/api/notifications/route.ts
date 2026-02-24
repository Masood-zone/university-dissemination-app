import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server";
import type { ApiResponse } from "@/types";

function toSafeInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

function safeParseMetadata(
  value: string | null,
): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const userId = session.user.id;

    const url = new URL(request.url);
    const limit = Math.min(toSafeInt(url.searchParams.get("limit"), 10), 50);

    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          metadata: true,
          createdAt: true,
          announcement: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications: rows.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          announcement: n.announcement ?? undefined,
          metadata: safeParseMetadata(n.metadata),
        })),
        unreadCount,
      },
    } satisfies ApiResponse<{
      notifications: Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: string;
        announcement?: { id: string; title: string };
        metadata?: Record<string, unknown>;
      }>;
      unreadCount: number;
    }>);
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: error.status === 403 ? "Forbidden" : "Unauthorized",
          code: error.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load notifications",
        code: "NOTIFICATIONS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession(request);
    const userId = session.user.id;

    const json = (await request.json()) as unknown;
    const body = json as {
      notificationId?: string;
      read?: boolean;
      markAll?: boolean;
    };

    if (body.markAll === true) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json({
        success: true,
        data: { ok: true },
      } satisfies ApiResponse<{ ok: true }>);
    }

    if (!body.notificationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing notificationId",
          code: "BAD_REQUEST",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const where: Prisma.NotificationWhereUniqueInput = {
      id: body.notificationId,
    };

    const existing = await prisma.notification.findFirst({
      where: { id: where.id, userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    await prisma.notification.update({
      where,
      data: { isRead: body.read === true },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: { ok: true },
    } satisfies ApiResponse<{ ok: true }>);
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: error.status === 403 ? "Forbidden" : "Unauthorized",
          code: error.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update notification",
        code: "NOTIFICATION_UPDATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession(request);
    const userId = session.user.id;

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing id",
          code: "BAD_REQUEST",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const existing = await prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    await prisma.notification.delete({ where: { id }, select: { id: true } });

    return NextResponse.json({
      success: true,
      data: { ok: true },
    } satisfies ApiResponse<{ ok: true }>);
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: error.status === 403 ? "Forbidden" : "Unauthorized",
          code: error.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete notification",
        code: "NOTIFICATION_DELETE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
