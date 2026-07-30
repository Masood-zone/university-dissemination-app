import { NextResponse } from "next/server";
import {
  AnnouncementCategory,
  AnnouncementStatus,
  Role,
} from "@prisma/client";
import { z } from "zod";

import {
  lifecycleWhere,
  replaceAnnouncementAudience,
} from "@/lib/announcement-audience";
import {
  broadcastAnnouncement,
  processDueAnnouncements,
} from "@/lib/announcement-broadcast";
import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";
import type { ApiResponse } from "@/types";

export type LecturerAnnouncementRow = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  courseOfferingId: string | null;
  courseOfferingIds: string[];
  courseCode: string | null;
  courseTitle: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  recipientCount: number;
  uniqueViewers: number;
  totalViews: number;
  reachRate: number | null;
};

export type LecturerAnnouncementsResponse = {
  rows: LecturerAnnouncementRow[];
};

export type CreateLecturerAnnouncementInput = {
  title: string;
  content: string;
  courseOfferingId?: string | null;
  courseOfferingIds?: string[];
  category?: AnnouncementCategory;
  mode?: "DRAFT" | "PUBLISH_NOW" | "SCHEDULE";
  publishedAt?: string | null;
  expiresAt?: string | null;
  target?: "DEPARTMENT" | "COURSES";
};

const inputSchema = z.object({
  title: z.string().trim().min(3),
  content: z.string().trim().min(1).max(50000),
  courseOfferingId: z.string().nullable().optional(),
  courseOfferingIds: z.array(z.string()).optional(),
  category: z.nativeEnum(AnnouncementCategory).default(
    AnnouncementCategory.ACADEMIC,
  ),
  mode: z.enum(["DRAFT", "PUBLISH_NOW", "SCHEDULE"]).default("PUBLISH_NOW"),
  publishedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  target: z.enum(["DEPARTMENT", "COURSES"]).default("COURSES"),
});

function excerptFromContent(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[#>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export async function GET(request: Request) {
  try {
    const session = await requireLecturer(request);
    const userId = session.user.id;
    void processDueAnnouncements(5);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.trim() ?? "";

    const announcements = await prisma.announcement.findMany({
      where: {
        authorId: userId,
        ...lifecycleWhere(status),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
        status: true,
        viewCount: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
        courseOfferingId: true,
        courseOffering: {
          select: { course: { select: { code: true, title: true } } },
        },
        audienceCourseOfferings: { select: { courseOfferingId: true } },
        recipients: {
          select: { firstViewedAt: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        rows: announcements.map((row) => {
          const uniqueViewers = row.recipients.filter(
            (recipient) => recipient.firstViewedAt,
          ).length;
          const recipientCount = row.recipients.length;
          return {
            id: row.id,
            title: row.title,
            excerpt: row.excerpt,
            content: row.content,
            category: row.category,
            status: row.status,
            courseOfferingId: row.courseOfferingId,
            courseOfferingIds: row.audienceCourseOfferings.map(
              (item) => item.courseOfferingId,
            ),
            courseCode: row.courseOffering?.course.code ?? null,
            courseTitle: row.courseOffering?.course.title ?? null,
            publishedAt: row.publishedAt?.toISOString() ?? null,
            expiresAt: row.expiresAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
            recipientCount,
            uniqueViewers,
            totalViews: row.viewCount,
            reachRate:
              recipientCount > 0
                ? Math.round((uniqueViewers / recipientCount) * 100)
                : null,
          };
        }),
      } satisfies LecturerAnnouncementsResponse,
    } satisfies ApiResponse<LecturerAnnouncementsResponse>);
  } catch (error) {
    const status = error instanceof Response ? error.status : 500;
    return NextResponse.json(
      {
        success: false,
        message: status === 500 ? "Failed to load announcements" : "Forbidden",
        code: status === 500 ? "ANNOUNCEMENTS_FETCH_FAILED" : "FORBIDDEN",
      } satisfies ApiResponse<never>,
      { status },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireLecturer(request);
    const userId = session.user.id;
    const input = inputSchema.parse(await request.json());
    const offeringIds = [
      ...new Set([
        ...(input.courseOfferingIds ?? []),
        ...(input.courseOfferingId ? [input.courseOfferingId] : []),
      ]),
    ];
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true },
    });
    if (!user?.departmentId) {
      return NextResponse.json(
        { success: false, message: "Department required", code: "DEPARTMENT_REQUIRED" },
        { status: 400 },
      );
    }
    if (input.target === "COURSES") {
      const assigned = await prisma.courseAssignment.count({
        where: { lecturerId: userId, offeringId: { in: offeringIds } },
      });
      if (!offeringIds.length || assigned !== offeringIds.length) {
        return NextResponse.json(
          {
            success: false,
            message: "You may target only assigned course offerings",
            code: "FORBIDDEN",
          },
          { status: 403 },
        );
      }
    }
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
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          excerpt: excerptFromContent(input.content),
          category: input.category,
          status,
          authorId: userId,
          departmentId: user.departmentId,
          courseOfferingId:
            input.target === "COURSES" ? offeringIds[0] ?? null : null,
          publishedAt,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
        select: { id: true },
      });
      await replaceAnnouncementAudience(tx, row.id, {
        audienceAll: false,
        roles: [Role.STUDENT],
        departmentIds:
          input.target === "DEPARTMENT" ? [user.departmentId!] : [],
        courseOfferingIds:
          input.target === "COURSES" ? offeringIds : [],
      });
      return row;
    });
    if (
      status === AnnouncementStatus.PUBLISHED &&
      (!publishedAt || publishedAt <= new Date())
    ) {
      void broadcastAnnouncement(created.id);
    }
    return NextResponse.json(
      { success: true, data: { id: created.id } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid announcement", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const status = error instanceof Response ? error.status : 500;
    return NextResponse.json(
      { success: false, message: "Failed to create announcement", code: "CREATE_FAILED" },
      { status },
    );
  }
}
