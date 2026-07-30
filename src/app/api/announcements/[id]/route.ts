import { NextResponse } from "next/server";
import { AnnouncementStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/server";
import { recordAnnouncementView } from "@/lib/announcement-audience";
import type { ApiResponse, StudentAnnouncementDetailResult } from "@/types";

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireStudent(request);
    const userId = session.user.id;
    const departmentId =
      (session.user as unknown as { departmentId?: string | null })
        .departmentId ?? null;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing announcement id",
          code: "BAD_REQUEST",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const now = new Date();
    const where: Prisma.AnnouncementWhereInput = {
      id,
      status: AnnouncementStatus.PUBLISHED,
      AND: [
        { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {},
        { recipients: { some: { userId } } },
      ],
    };

    const announcement = await prisma.announcement.findFirst({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        category: true,
        priority: true,
        pinned: true,
        imageUrl: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        viewCount: true,
        department: { select: { name: true } },
        author: { select: { firstName: true, lastName: true } },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    // Increment view count but don't block response if it fails.
    void recordAnnouncementView({
      announcementId: announcement.id,
      userId,
    });

    const relatedWhere: Prisma.AnnouncementWhereInput = {
      status: AnnouncementStatus.PUBLISHED,
      AND: [
        { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        { NOT: { id: announcement.id } },
        { category: announcement.category },
        departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {},
        { recipients: { some: { userId } } },
      ],
    };

    const related = await prisma.announcement.findMany({
      where: relatedWhere,
      orderBy: [
        { pinned: "desc" },
        { priority: "desc" },
        { publishedAt: "desc" },
      ],
      take: 6,
      select: {
        id: true,
        title: true,
        excerpt: true,
        category: true,
        priority: true,
        pinned: true,
        publishedAt: true,
        createdAt: true,
        viewCount: true,
        department: { select: { name: true } },
        author: { select: { firstName: true, lastName: true } },
      },
    });

    const payload: StudentAnnouncementDetailResult = {
      announcement: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        excerpt: announcement.excerpt ?? null,
        category: announcement.category,
        priority: announcement.priority,
        pinned: announcement.pinned,
        imageUrl: announcement.imageUrl ?? null,
        departmentName: announcement.department?.name ?? null,
        authorName:
          `${announcement.author.firstName} ${announcement.author.lastName}`.trim(),
        publishedAt: toIso(announcement.publishedAt),
        expiresAt: toIso(announcement.expiresAt),
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
        viewCount: announcement.viewCount,
      },
      related: related.map((r) => ({
        id: r.id,
        title: r.title,
        excerpt: r.excerpt ?? null,
        category: r.category,
        priority: r.priority,
        pinned: r.pinned,
        departmentName: r.department?.name ?? null,
        authorName: `${r.author.firstName} ${r.author.lastName}`.trim(),
        publishedAt: toIso(r.publishedAt),
        createdAt: r.createdAt.toISOString(),
        viewCount: r.viewCount,
      })),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<StudentAnnouncementDetailResult>);
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
        message: "Failed to load announcement",
        code: "ANNOUNCEMENT_DETAIL_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
