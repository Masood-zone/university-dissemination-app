import { NextResponse } from "next/server";
import {
  AnnouncementCategory,
  AnnouncementStatus,
  Role,
} from "@prisma/client";
import { z } from "zod";

import { replaceAnnouncementAudience } from "@/lib/announcement-audience";
import { broadcastAnnouncement } from "@/lib/announcement-broadcast";
import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";

const schema = z.object({
  title: z.string().trim().min(3),
  content: z.string().trim().min(1).max(50000),
  category: z.nativeEnum(AnnouncementCategory),
  mode: z.enum(["DRAFT", "PUBLISH_NOW", "SCHEDULE"]),
  publishedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  target: z.enum(["DEPARTMENT", "COURSES"]),
  courseOfferingIds: z.array(z.string()).default([]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireLecturer(request);
    const { id } = await params;
    const input = schema.parse(await request.json());
    const current = await prisma.announcement.findFirst({
      where: { id, authorId: session.user.id },
      select: { id: true, status: true, broadcastedAt: true },
    });
    if (!current) {
      return NextResponse.json(
        { success: false, message: "Announcement not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true },
    });
    if (!user?.departmentId) {
      return NextResponse.json(
        { success: false, message: "Department required" },
        { status: 400 },
      );
    }
    if (input.target === "COURSES") {
      const assigned = await prisma.courseAssignment.count({
        where: {
          lecturerId: session.user.id,
          offeringId: { in: input.courseOfferingIds },
        },
      });
      if (!input.courseOfferingIds.length || assigned !== input.courseOfferingIds.length) {
        return NextResponse.json(
          { success: false, message: "Invalid course audience", code: "FORBIDDEN" },
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
    await prisma.$transaction(async (tx) => {
      await tx.announcement.update({
        where: { id },
        data: {
          title: input.title,
          content: input.content,
          excerpt: input.content.replace(/[#>*_~`]/g, " ").slice(0, 160),
          category: input.category,
          status,
          publishedAt,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          departmentId: user.departmentId,
          courseOfferingId:
            input.target === "COURSES"
              ? input.courseOfferingIds[0] ?? null
              : null,
          ...(current.broadcastedAt ? {} : { broadcastClaimedAt: null }),
        },
      });
      if (!current.broadcastedAt) {
        await replaceAnnouncementAudience(tx, id, {
          audienceAll: false,
          roles: [Role.STUDENT],
          departmentIds:
            input.target === "DEPARTMENT" ? [user.departmentId!] : [],
          courseOfferingIds:
            input.target === "COURSES" ? input.courseOfferingIds : [],
        });
      }
    });
    if (
      !current.broadcastedAt &&
      status === AnnouncementStatus.PUBLISHED &&
      (!publishedAt || publishedAt <= new Date())
    ) {
      void broadcastAnnouncement(id);
    }
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : error instanceof Response ? error.status : 500;
    return NextResponse.json(
      { success: false, message: "Failed to update announcement" },
      { status },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireLecturer(request);
  const { id } = await params;
  const updated = await prisma.announcement.updateMany({
    where: { id, authorId: session.user.id },
    data: { status: AnnouncementStatus.ARCHIVED },
  });
  if (!updated.count) {
    return NextResponse.json(
      { success: false, message: "Announcement not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, data: { id } });
}
