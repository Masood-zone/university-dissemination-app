import { NextResponse } from "next/server";
import { AnnouncementStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/server";
import type {
  ApiResponse,
  StudentAnnouncementPriorityFilter,
  StudentAnnouncementsFeedResult,
  StudentAnnouncementsScope,
  StudentAnnouncementsSort,
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

function normalizeSort(value: string | null): StudentAnnouncementsSort {
  return (value || "").toLowerCase() === "oldest" ? "OLDEST" : "RECENT";
}

function normalizeScope(value: string | null): StudentAnnouncementsScope {
  switch ((value || "").toLowerCase()) {
    case "departmental":
    case "department":
      return "DEPARTMENTAL";
    default:
      return "ALL";
  }
}

function normalizePriority(
  value: string | null,
): StudentAnnouncementPriorityFilter {
  switch ((value || "").toLowerCase()) {
    case "normal":
      return "NORMAL";
    case "high":
    case "high_priority":
      return "HIGH";
    case "critical":
    case "critical_only":
      return "CRITICAL";
    default:
      return "ALL";
  }
}

function labelForCategory(value: string): string {
  switch (value) {
    case "OLD_AFFAIRS":
      return "Old Affairs";
    case "CURRENT_AFFAIRS":
      return "Current Affairs";
    case "DEPARTMENTAL":
      return "Departmental";
    case "ACADEMIC":
      return "Academic";
    case "EVENT":
      return "Events";
    case "MAINTENANCE":
      return "Administrative";
    default:
      return "Other";
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireStudent(request);
    const userId = session.user.id;
    const departmentId =
      (session.user as unknown as { departmentId?: string | null })
        .departmentId ?? null;

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const scope = normalizeScope(url.searchParams.get("scope"));
    const category = (url.searchParams.get("category") || "").trim();
    const sort = normalizeSort(url.searchParams.get("sort"));
    const priority = normalizePriority(url.searchParams.get("priority"));
    const page = toSafeInt(url.searchParams.get("page"), 1);
    const pageSize = Math.min(
      toSafeInt(url.searchParams.get("pageSize"), 10),
      30,
    );

    const now = new Date();

    if (scope === "DEPARTMENTAL" && !departmentId) {
      const payload: StudentAnnouncementsFeedResult = {
        rows: [],
        categories: [],
        page,
        pageSize,
        total: 0,
        sort,
      };

      return NextResponse.json({
        success: true,
        data: payload,
      } satisfies ApiResponse<StudentAnnouncementsFeedResult>);
    }

    const scopeWhere: Prisma.AnnouncementWhereInput =
      scope === "DEPARTMENTAL"
        ? { departmentId: departmentId! }
        : departmentId
          ? { OR: [{ departmentId }, { departmentId: null }] }
          : {};

    const baseWhere: Prisma.AnnouncementWhereInput = {
      status: AnnouncementStatus.PUBLISHED,
      AND: [
        { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        scopeWhere,
        { recipients: { some: { userId } } },
      ],
    };

    const queryWhere: Prisma.AnnouncementWhereInput = q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const categoryWhere: Prisma.AnnouncementWhereInput = category
      ? {
          category: {
            equals: category as never,
          },
        }
      : {};

    const priorityWhere: Prisma.AnnouncementWhereInput =
      priority === "CRITICAL"
        ? { priority: { gte: 3 } }
        : priority === "HIGH"
          ? { priority: { gte: 2 } }
          : priority === "NORMAL"
            ? { priority: { lte: 1 } }
            : {};

    const where: Prisma.AnnouncementWhereInput = {
      AND: [baseWhere, queryWhere, categoryWhere, priorityWhere],
    };

    const [total, rows, grouped] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({
        where,
        orderBy:
          sort === "OLDEST"
            ? [{ publishedAt: "asc" }, { createdAt: "asc" }]
            : [
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
          priority: true,
          pinned: true,
          publishedAt: true,
          createdAt: true,
          viewCount: true,
          department: { select: { name: true } },
          author: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.announcement.groupBy({
        by: ["category"],
        where: { AND: [baseWhere, queryWhere, priorityWhere] },
        _count: { _all: true },
      }),
    ]);

    const categories = grouped
      .slice()
      .sort((a, b) => (b._count._all ?? 0) - (a._count._all ?? 0))
      .map((g) => ({
        category: g.category,
        label: labelForCategory(String(g.category)),
        count: g._count._all,
      }));

    const payload: StudentAnnouncementsFeedResult = {
      rows: rows.map((r) => ({
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
      categories,
      page,
      pageSize,
      total,
      sort,
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<StudentAnnouncementsFeedResult>);
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
        message: "Failed to load announcements",
        code: "ANNOUNCEMENTS_FEED_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
