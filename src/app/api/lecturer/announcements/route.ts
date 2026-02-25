import { NextResponse } from "next/server";
import { AnnouncementCategory, AnnouncementStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";
import type { ApiResponse } from "@/types";

function excerptFromContent(content: string): string {
  const cleaned = content.replace(/\s+/g, " ").trim();
  return cleaned.length > 140 ? `${cleaned.slice(0, 140)}...` : cleaned;
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export type LecturerAnnouncementRow = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  courseOfferingId: string | null;
  courseCode: string | null;
  courseTitle: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type LecturerAnnouncementsResponse = {
  rows: LecturerAnnouncementRow[];
};

export type CreateLecturerAnnouncementInput = {
  title: string;
  content: string;
  courseOfferingId?: string | null;
  category?: AnnouncementCategory;
};

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

    const assignmentOfferings = await prisma.courseAssignment.findMany({
      where: { lecturerId: userId },
      select: { offeringId: true },
    });

    const offeringIds = assignmentOfferings.map((a) => a.offeringId);

    const now = new Date();

    const announcements = await prisma.announcement.findMany({
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
            OR: [
              { authorId: userId },
              offeringIds.length
                ? { courseOfferingId: { in: offeringIds } }
                : { courseOfferingId: null },
            ],
          },
        ],
      },
      orderBy: [
        { pinned: "desc" },
        { priority: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: 30,
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        courseOfferingId: true,
        courseOffering: {
          select: {
            course: { select: { code: true, title: true } },
          },
        },
      },
    });

    const payload: LecturerAnnouncementsResponse = {
      rows: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt ?? null,
        content: a.content,
        category: a.category,
        status: a.status,
        courseOfferingId: a.courseOfferingId ?? null,
        courseCode: a.courseOffering?.course.code ?? null,
        courseTitle: a.courseOffering?.course.title ?? null,
        publishedAt: toIso(a.publishedAt),
        createdAt: a.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<LecturerAnnouncementsResponse>,
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
        message: "Failed to load announcements",
        code: "ANNOUNCEMENTS_FETCH_FAILED",
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

    const body =
      (await request.json()) as Partial<CreateLecturerAnnouncementInput>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const courseOfferingId =
      body.courseOfferingId == null
        ? null
        : typeof body.courseOfferingId === "string"
          ? body.courseOfferingId
          : null;

    const category: AnnouncementCategory =
      body.category &&
      Object.values(AnnouncementCategory).includes(body.category)
        ? body.category
        : AnnouncementCategory.ACADEMIC;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "Content is required",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    let departmentId: string | null = null;

    if (courseOfferingId) {
      const assignment = await prisma.courseAssignment.findFirst({
        where: { lecturerId: userId, offeringId: courseOfferingId },
        select: {
          offering: {
            select: {
              departmentId: true,
            },
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          {
            success: false,
            message: "You are not assigned to that course",
            code: "FORBIDDEN",
          } satisfies ApiResponse<never>,
          { status: 403 },
        );
      }

      departmentId = assignment.offering.departmentId;
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true },
      });

      departmentId = user?.departmentId ?? null;
    }

    const created = await prisma.announcement.create({
      data: {
        title,
        content,
        excerpt: excerptFromContent(content),
        category,
        status: AnnouncementStatus.PUBLISHED,
        authorId: userId,
        departmentId,
        courseOfferingId,
        publishedAt: new Date(),
      },
      select: { id: true },
    });

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
        message: "Failed to create announcement",
        code: "ANNOUNCEMENT_CREATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
