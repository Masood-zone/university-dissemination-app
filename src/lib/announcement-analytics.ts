import { AnnouncementStatus, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AnnouncementAnalyticsData = {
  range: { from: string; to: string };
  kpis: {
    posts: number;
    eligibleRecipients: number;
    totalViews: number;
    uniqueViewers: number;
    reachRate: number;
    averageViewsPerPost: number;
  };
  daily: Array<{ date: string; posts: number; views: number; unique: number }>;
  top: Array<{
    id: string;
    title: string;
    publishedAt: string | null;
    recipients: number;
    totalViews: number;
    uniqueViewers: number;
    reachRate: number;
  }>;
};

function startOfUtcDay(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

export async function getAnnouncementAnalytics(args: {
  from: Date;
  to: Date;
  departmentId?: string;
  authorId?: string;
  role?: Role;
  courseOfferingId?: string;
}): Promise<AnnouncementAnalyticsData> {
  const where: Prisma.AnnouncementWhereInput = {
    status: { in: [AnnouncementStatus.PUBLISHED, AnnouncementStatus.ARCHIVED] },
    publishedAt: { gte: args.from, lte: args.to },
    ...(args.departmentId ? { departmentId: args.departmentId } : {}),
    ...(args.authorId ? { authorId: args.authorId } : {}),
    ...(args.courseOfferingId
      ? {
          audienceCourseOfferings: {
            some: { courseOfferingId: args.courseOfferingId },
          },
        }
      : {}),
  };

  const announcements = await prisma.announcement.findMany({
    where,
    select: {
      id: true,
      title: true,
      publishedAt: true,
      viewCount: true,
      recipients: {
        where: args.role ? { user: { role: args.role } } : undefined,
        select: {
          firstViewedAt: true,
          lastViewedAt: true,
          viewCount: true,
        },
      },
    },
  });

  const days = new Map<
    string,
    { date: string; posts: number; views: number; unique: number }
  >();
  for (
    let cursor = startOfUtcDay(args.from);
    cursor <= args.to;
    cursor = new Date(cursor.getTime() + 86_400_000)
  ) {
    const date = cursor.toISOString().slice(0, 10);
    days.set(date, { date, posts: 0, views: 0, unique: 0 });
  }

  let eligibleRecipients = 0;
  let uniqueViewers = 0;
  let totalViews = 0;
  const top = announcements.map((announcement) => {
    const recipients = announcement.recipients.length;
    const unique = announcement.recipients.filter(
      (recipient) => recipient.firstViewedAt,
    ).length;
    const views = announcement.recipients.reduce(
      (sum, recipient) => sum + recipient.viewCount,
      0,
    );
    eligibleRecipients += recipients;
    uniqueViewers += unique;
    totalViews += views;
    if (announcement.publishedAt) {
      const key = announcement.publishedAt.toISOString().slice(0, 10);
      const bucket = days.get(key);
      if (bucket) bucket.posts += 1;
    }
    for (const recipient of announcement.recipients) {
      if (!recipient.lastViewedAt) continue;
      const key = recipient.lastViewedAt.toISOString().slice(0, 10);
      const bucket = days.get(key);
      if (bucket) {
        bucket.views += recipient.viewCount;
        bucket.unique += recipient.firstViewedAt ? 1 : 0;
      }
    }
    return {
      id: announcement.id,
      title: announcement.title,
      publishedAt: announcement.publishedAt?.toISOString() ?? null,
      recipients,
      totalViews: views,
      uniqueViewers: unique,
      reachRate: recipients ? Math.round((unique / recipients) * 100) : 0,
    };
  });

  return {
    range: { from: args.from.toISOString(), to: args.to.toISOString() },
    kpis: {
      posts: announcements.length,
      eligibleRecipients,
      totalViews,
      uniqueViewers,
      reachRate: eligibleRecipients
        ? Math.round((uniqueViewers / eligibleRecipients) * 100)
        : 0,
      averageViewsPerPost: announcements.length
        ? Math.round((totalViews / announcements.length) * 10) / 10
        : 0,
    },
    daily: [...days.values()],
    top: top
      .sort(
        (a, b) =>
          b.reachRate - a.reachRate || b.uniqueViewers - a.uniqueViewers,
      )
      .slice(0, 10),
  };
}

export function analyticsRange(url: URL) {
  const to = url.searchParams.get("to")
    ? new Date(url.searchParams.get("to")!)
    : new Date();
  const from = url.searchParams.get("from")
    ? new Date(url.searchParams.get("from")!)
    : new Date(to.getTime() - 29 * 86_400_000);
  return {
    from: Number.isNaN(from.getTime())
      ? new Date(to.getTime() - 29 * 86_400_000)
      : from,
    to: Number.isNaN(to.getTime()) ? new Date() : to,
  };
}
