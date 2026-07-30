import { NextResponse } from "next/server";
import {
  AnnouncementCategory,
  AnnouncementStatus,
  Prisma,
} from "@prisma/client";
import { z } from "zod";

import { replaceAnnouncementAudience } from "@/lib/announcement-audience";
import { broadcastAnnouncement, processDueAnnouncements } from "@/lib/announcement-broadcast";
import { prisma } from "@/lib/prisma";
import {
  requireDepartmentAdmin,
  resolveDepartmentForDepartmentAdmin,
} from "@/lib/server";
import type {
  AdminAnnouncementStatusFilter,
  AdminAnnouncementsListResult,
  ApiResponse,
  UpsertAnnouncementInput,
} from "@/types";

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toSafeInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

function normalizeFilter(value: string | null): AdminAnnouncementStatusFilter {
  switch ((value || "").toUpperCase()) {
    case "ACTIVE":
    case "SCHEDULED":
    case "DRAFT":
    case "ARCHIVED":
      return value!.toUpperCase() as AdminAnnouncementStatusFilter;
    default:
      return "ALL";
  }
}

function excerptFromContent(markdown: string): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[#>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 160);
}

const upsertSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  category: z.nativeEnum(AnnouncementCategory),
  priority: z.number().int().min(0).max(3),
  pinned: z.boolean().optional(),
  imageUrl: z.string().url().nullable().optional(),
  mode: z.enum(["DRAFT", "PUBLISH_NOW", "SCHEDULE"]),
  publishedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireDepartmentAdmin(request);
    void processDueAnnouncements(5);
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

    const dept = await resolveDepartmentForDepartmentAdmin(userId);
    if (!dept) {
      return NextResponse.json(
        {
          success: false,
          message: "Department admin has no department assigned",
          code: "DEPARTMENT_REQUIRED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const status = normalizeFilter(url.searchParams.get("status"));
    const page = toSafeInt(url.searchParams.get("page"), 1);
    const pageSize = Math.min(toSafeInt(url.searchParams.get("pageSize"), 10), 50);
    const now = new Date();

    const queryWhere: Prisma.AnnouncementWhereInput = q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const activeWhere: Prisma.AnnouncementWhereInput = {
      status: AnnouncementStatus.PUBLISHED,
      AND: [
        { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    };

    const scheduledWhere: Prisma.AnnouncementWhereInput = {
      status: AnnouncementStatus.PUBLISHED,
      publishedAt: { gt: now },
    };

    const archivedWhere: Prisma.AnnouncementWhereInput = {
      OR: [
        { status: AnnouncementStatus.ARCHIVED },
        {
          status: AnnouncementStatus.PUBLISHED,
          expiresAt: { not: null, lte: now },
        },
      ],
    };

    const statusWhere: Prisma.AnnouncementWhereInput =
      status === "ACTIVE"
        ? activeWhere
        : status === "SCHEDULED"
          ? scheduledWhere
          : status === "DRAFT"
            ? { status: AnnouncementStatus.DRAFT }
            : status === "ARCHIVED"
              ? archivedWhere
              : {};

    const where: Prisma.AnnouncementWhereInput = {
      AND: [{ departmentId: dept.departmentId }, queryWhere, statusWhere],
    };

    const [total, rows, activeCount, scheduledCount, highPriorityCount] =
      await Promise.all([
        prisma.announcement.count({ where }),
        prisma.announcement.findMany({
          where,
          orderBy: [
            { pinned: "desc" },
            { priority: "desc" },
            { publishedAt: "desc" },
            { createdAt: "desc" },
          ],
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            title: true,
            excerpt: true,
            category: true,
            status: true,
            priority: true,
            pinned: true,
            publishedAt: true,
            expiresAt: true,
            createdAt: true,
            viewCount: true,
            department: { select: { name: true } },
          },
        }),
        prisma.announcement.count({
          where: {
            AND: [{ departmentId: dept.departmentId }, queryWhere, activeWhere],
          },
        }),
        prisma.announcement.count({
          where: {
            AND: [
              { departmentId: dept.departmentId },
              queryWhere,
              scheduledWhere,
            ],
          },
        }),
        prisma.announcement.count({
          where: {
            AND: [
              { departmentId: dept.departmentId },
              queryWhere,
              activeWhere,
              { priority: { gte: 2 } },
            ],
          },
        }),
      ]);

    const activeWithViews = await prisma.announcement.count({
      where: {
        AND: [
          { departmentId: dept.departmentId },
          queryWhere,
          activeWhere,
          { viewCount: { gt: 0 } },
        ],
      },
    });

    const readRate =
      activeCount > 0 ? Math.round((activeWithViews / activeCount) * 100) : null;

    const payload: AdminAnnouncementsListResult = {
      stats: {
        totalActive: activeCount,
        scheduled: scheduledCount,
        highPriority: highPriorityCount,
        readRate,
      },
      rows: rows.map((r) => ({
        id: r.id,
        title: r.title,
        excerpt: r.excerpt ?? null,
        category: r.category,
        status: r.status,
        priority: r.priority,
        pinned: r.pinned,
        departmentName: r.department?.name ?? null,
        publishedAt: toIso(r.publishedAt),
        expiresAt: toIso(r.expiresAt),
        viewCount: r.viewCount,
        createdAt: r.createdAt.toISOString(),
      })),
      page,
      pageSize,
      total,
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<AdminAnnouncementsListResult>);
  } catch (error) {
    if (error instanceof Response) {
      const status = error.status || 401;
      const code = status === 403 ? "FORBIDDEN" : "UNAUTHORIZED";
      const message = status === 403 ? "Forbidden" : "Unauthorized";

      return NextResponse.json(
        { success: false, message, code } satisfies ApiResponse<never>,
        { status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load announcements",
        code: "ANNOUNCEMENTS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireDepartmentAdmin(request);
    const authorId = session.user?.id;

    if (!authorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const dept = await resolveDepartmentForDepartmentAdmin(authorId);
    if (!dept) {
      return NextResponse.json(
        {
          success: false,
          message: "Department admin has no department assigned",
          code: "DEPARTMENT_REQUIRED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const json = (await request.json()) as unknown;
    const input = upsertSchema.parse(json) satisfies UpsertAnnouncementInput;

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    const publishedAt =
      input.mode === "SCHEDULE" && input.publishedAt
        ? new Date(input.publishedAt)
        : input.mode === "PUBLISH_NOW"
          ? new Date()
          : null;

    const status =
      input.mode === "DRAFT"
        ? AnnouncementStatus.DRAFT
        : AnnouncementStatus.PUBLISHED;

    const excerpt =
      typeof input.excerpt === "string"
        ? input.excerpt
        : excerptFromContent(input.content);

    const now = new Date();
    const shouldNotifyNow =
      status === AnnouncementStatus.PUBLISHED &&
      (!publishedAt || publishedAt.getTime() <= now.getTime());

    const created = await prisma.announcement.create({
      data: {
        title: input.title,
        content: input.content,
        excerpt,
        category: input.category,
        status,
        authorId,
        departmentId: dept.departmentId,
        imageUrl: input.imageUrl ?? null,
        pinned: Boolean(input.pinned),
        priority: input.priority,
        publishedAt,
        expiresAt,
      },
      select: { id: true },
    });
    await prisma.$transaction((tx) =>
      replaceAnnouncementAudience(tx, created.id, {
        audienceAll: false,
        departmentIds: [dept.departmentId],
      }),
    );

    if (shouldNotifyNow) {
      void broadcastAnnouncement(created.id);
    }

    return NextResponse.json({
      success: true,
      data: { id: created.id },
    } satisfies ApiResponse<{ id: string }>);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
          code: "INVALID_BODY",
          errors: error.flatten().fieldErrors,
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (error instanceof Response) {
      const status = error.status || 401;
      const code = status === 403 ? "FORBIDDEN" : "UNAUTHORIZED";
      const message = status === 403 ? "Forbidden" : "Unauthorized";

      return NextResponse.json(
        { success: false, message, code } satisfies ApiResponse<never>,
        { status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create announcement",
        code: "ANNOUNCEMENT_CREATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
