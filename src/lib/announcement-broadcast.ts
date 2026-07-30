import { AnnouncementStatus } from "@prisma/client";

import { materializeAnnouncementRecipients } from "@/lib/announcement-audience";
import { notifyAnnouncementPublished } from "@/lib/announcement-notifications";
import { prisma } from "@/lib/prisma";

export async function broadcastAnnouncement(
  announcementId: string,
): Promise<boolean> {
  const now = new Date();
  const claim = await prisma.announcement.updateMany({
    where: {
      id: announcementId,
      status: AnnouncementStatus.PUBLISHED,
      broadcastedAt: null,
      OR: [
        { broadcastClaimedAt: null },
        { broadcastClaimedAt: { lt: new Date(now.getTime() - 10 * 60_000) } },
      ],
      AND: [
        { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    data: { broadcastClaimedAt: now },
  });
  if (!claim.count) return false;

  try {
    const recipientIds =
      await materializeAnnouncementRecipients(announcementId);
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      select: {
        id: true,
        title: true,
        category: true,
        excerpt: true,
        departmentId: true,
        authorId: true,
        author: { select: { name: true } },
      },
    });
    if (!announcement) return false;
    await notifyAnnouncementPublished({
      announcementId,
      title: announcement.title,
      category: String(announcement.category),
      excerpt: announcement.excerpt,
      departmentId: announcement.departmentId,
      authorId: announcement.authorId,
      publishedByName: announcement.author.name,
      recipientIds,
    });
    await prisma.announcement.update({
      where: { id: announcementId },
      data: { broadcastedAt: new Date() },
    });
    return true;
  } catch (error) {
    await prisma.announcement.update({
      where: { id: announcementId },
      data: { broadcastClaimedAt: null },
    });
    throw error;
  }
}

export async function processDueAnnouncements(limit = 20): Promise<number> {
  const due = await prisma.announcement.findMany({
    where: {
      status: AnnouncementStatus.PUBLISHED,
      broadcastedAt: null,
      publishedAt: { lte: new Date() },
    },
    orderBy: { publishedAt: "asc" },
    take: limit,
    select: { id: true },
  });
  const results = await Promise.allSettled(
    due.map((row) => broadcastAnnouncement(row.id)),
  );
  return results.filter(
    (result) => result.status === "fulfilled" && result.value,
  ).length;
}
