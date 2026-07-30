import { NextResponse } from "next/server";
import {
  AnnouncementCategory,
  AnnouncementStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { z } from "zod";

import { replaceAnnouncementAudience } from "@/lib/announcement-audience";
import { broadcastAnnouncement } from "@/lib/announcement-broadcast";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type {
  AdminAnnouncementDetail,
  ApiResponse,
  UpsertAnnouncementInput,
} from "@/types";

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function getAudienceAll(value: object): boolean {
  return "audienceAll" in value ? value.audienceAll === true : true;
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
  departmentId: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  mode: z.enum(["DRAFT", "PUBLISH_NOW", "SCHEDULE"]),
  publishedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  audienceAll: z.boolean().optional(),
  audienceRoles: z.array(z.nativeEnum(Role)).optional(),
  audienceDepartmentIds: z.array(z.string()).optional(),
  audienceCourseOfferingIds: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const found = await prisma.announcement.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        category: true,
        status: true,
        priority: true,
        pinned: true,
        imageUrl: true,
        viewCount: true,
        publishedAt: true,
        expiresAt: true,
        audienceAll: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { id: true, name: true } },
        author: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        audienceRoles: { select: { role: true } },
        audienceDepartments: { select: { departmentId: true } },
        audienceCourseOfferings: { select: { courseOfferingId: true } },
      },
    });

    if (!found) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    const payload: AdminAnnouncementDetail = {
      id: found.id,
      title: found.title,
      content: found.content,
      excerpt: found.excerpt ?? null,
      category: found.category,
      status: found.status,
      priority: found.priority,
      pinned: found.pinned,
      imageUrl: found.imageUrl ?? null,
      department: found.department
        ? { id: found.department.id, name: found.department.name }
        : null,
      viewCount: found.viewCount,
      publishedAt: toIso(found.publishedAt),
      expiresAt: toIso(found.expiresAt),
      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString(),
      author: {
        id: found.author.id,
        firstName: found.author.firstName,
        lastName: found.author.lastName,
        avatar: found.author.avatar ?? null,
      },
      // Keep this response resilient to stale generated Prisma payload types in
      // restored deployment caches. The field is selected above and defaults to
      // true for announcements created before audience targeting was introduced.
      audienceAll: getAudienceAll(found),
      audienceRoles: found.audienceRoles.map((row) => row.role),
      audienceDepartmentIds: found.audienceDepartments.map(
        (row) => row.departmentId,
      ),
      audienceCourseOfferingIds: found.audienceCourseOfferings.map(
        (row) => row.courseOfferingId,
      ),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<AdminAnnouncementDetail>);
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
        message: "Failed to load announcement",
        code: "ANNOUNCEMENT_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

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

    const before = await prisma.announcement.findUnique({
      where: { id },
      select: { status: true, publishedAt: true, authorId: true },
    });

    if (!before) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    const now = new Date();
    const wasPublishedNow =
      before.status === AnnouncementStatus.PUBLISHED &&
      (!before.publishedAt || before.publishedAt.getTime() <= now.getTime());
    const willBePublishedNow =
      status === AnnouncementStatus.PUBLISHED &&
      (!publishedAt || publishedAt.getTime() <= now.getTime());

    await prisma.$transaction(async (tx) => {
      await tx.announcement.update({
        where: { id },
        data: {
          title: input.title,
          content: input.content,
          excerpt,
          category: input.category,
          status,
          departmentId: input.departmentId ?? null,
          imageUrl: input.imageUrl ?? null,
          pinned: Boolean(input.pinned),
          priority: input.priority,
          publishedAt,
          expiresAt,
          ...(willBePublishedNow && !wasPublishedNow
            ? { broadcastClaimedAt: null, broadcastedAt: null }
            : {}),
        },
        select: { id: true },
      });
      await replaceAnnouncementAudience(tx, id, {
        audienceAll: input.audienceAll,
        roles: input.audienceRoles,
        departmentIds:
          input.audienceDepartmentIds ??
          (input.departmentId ? [input.departmentId] : []),
        courseOfferingIds: input.audienceCourseOfferingIds,
      });
    });

    if (!wasPublishedNow && willBePublishedNow) {
      void broadcastAnnouncement(id);
    }

    return NextResponse.json({
      success: true,
      data: { id },
    } satisfies ApiResponse<{ id: string }>);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            message: "Announcement not found",
            code: "NOT_FOUND",
          } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }
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

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update announcement",
        code: "ANNOUNCEMENT_UPDATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    await prisma.announcement.delete({ where: { id }, select: { id: true } });

    return NextResponse.json({
      success: true,
      data: { id },
    } satisfies ApiResponse<{ id: string }>);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            message: "Announcement not found",
            code: "NOT_FOUND",
          } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }
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
        message: "Failed to delete announcement",
        code: "ANNOUNCEMENT_DELETE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
