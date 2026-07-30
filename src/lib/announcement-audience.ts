import { AnnouncementStatus, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AnnouncementAudienceInput = {
  audienceAll?: boolean;
  roles?: Role[];
  departmentIds?: string[];
  courseOfferingIds?: string[];
};

function unique(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).filter(Boolean))];
}

export function normalizeAudience(input: AnnouncementAudienceInput) {
  const roles = [...new Set(input.roles ?? [])];
  const departmentIds = unique(input.departmentIds);
  const courseOfferingIds = unique(input.courseOfferingIds);
  const audienceAll =
    input.audienceAll === true ||
    (roles.length === 0 &&
      departmentIds.length === 0 &&
      courseOfferingIds.length === 0);
  return { audienceAll, roles, departmentIds, courseOfferingIds };
}

export async function replaceAnnouncementAudience(
  tx: Prisma.TransactionClient,
  announcementId: string,
  input: AnnouncementAudienceInput,
) {
  const audience = normalizeAudience(input);
  await Promise.all([
    tx.announcementAudienceRole.deleteMany({ where: { announcementId } }),
    tx.announcementAudienceDepartment.deleteMany({
      where: { announcementId },
    }),
    tx.announcementAudienceCourseOffering.deleteMany({
      where: { announcementId },
    }),
  ]);

  await Promise.all([
    audience.roles.length
      ? tx.announcementAudienceRole.createMany({
          data: audience.roles.map((role) => ({ announcementId, role })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    audience.departmentIds.length
      ? tx.announcementAudienceDepartment.createMany({
          data: audience.departmentIds.map((departmentId) => ({
            announcementId,
            departmentId,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    audience.courseOfferingIds.length
      ? tx.announcementAudienceCourseOffering.createMany({
          data: audience.courseOfferingIds.map((courseOfferingId) => ({
            announcementId,
            courseOfferingId,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
  ]);

  await tx.announcement.update({
    where: { id: announcementId },
    data: { audienceAll: audience.audienceAll },
  });
  return audience;
}

export async function resolveAudienceUserIds(args: {
  authorId: string;
  input: AnnouncementAudienceInput;
}): Promise<string[]> {
  const audience = normalizeAudience(args.input);
  let courseMemberIds: string[] | undefined;

  if (!audience.audienceAll && audience.courseOfferingIds.length) {
    const [enrollments, assignments] = await Promise.all([
      prisma.enrollment.findMany({
        where: { offeringId: { in: audience.courseOfferingIds } },
        select: { studentId: true },
      }),
      prisma.courseAssignment.findMany({
        where: { offeringId: { in: audience.courseOfferingIds } },
        select: { lecturerId: true },
      }),
    ]);
    courseMemberIds = [
      ...new Set([
        ...enrollments.map((row) => row.studentId),
        ...assignments.map((row) => row.lecturerId),
      ]),
    ];
    if (!courseMemberIds.length) return [];
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      id: {
        not: args.authorId,
        ...(courseMemberIds ? { in: courseMemberIds } : {}),
      },
      ...(!audience.audienceAll && audience.roles.length
        ? { role: { in: audience.roles } }
        : {}),
      ...(!audience.audienceAll && audience.departmentIds.length
        ? { departmentId: { in: audience.departmentIds } }
        : {}),
    },
    select: { id: true },
  });
  return users.map((user) => user.id);
}

export async function materializeAnnouncementRecipients(
  announcementId: string,
): Promise<string[]> {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: {
      id: true,
      authorId: true,
      audienceAll: true,
      audienceRoles: { select: { role: true } },
      audienceDepartments: { select: { departmentId: true } },
      audienceCourseOfferings: { select: { courseOfferingId: true } },
    },
  });
  if (!announcement) return [];

  const userIds = await resolveAudienceUserIds({
    authorId: announcement.authorId,
    input: {
      audienceAll: announcement.audienceAll,
      roles: announcement.audienceRoles.map((row) => row.role),
      departmentIds: announcement.audienceDepartments.map(
        (row) => row.departmentId,
      ),
      courseOfferingIds: announcement.audienceCourseOfferings.map(
        (row) => row.courseOfferingId,
      ),
    },
  });

  if (userIds.length) {
    await prisma.announcementRecipient.createMany({
      data: userIds.map((userId) => ({ announcementId, userId })),
      skipDuplicates: true,
    });
  }
  return userIds;
}

export async function recordAnnouncementView(args: {
  announcementId: string;
  userId: string;
}) {
  const now = new Date();
  return prisma.$transaction([
    prisma.announcement.update({
      where: { id: args.announcementId },
      data: { viewCount: { increment: 1 } },
    }),
    prisma.announcementRecipient.upsert({
      where: {
        announcementId_userId: {
          announcementId: args.announcementId,
          userId: args.userId,
        },
      },
      create: {
        announcementId: args.announcementId,
        userId: args.userId,
        firstViewedAt: now,
        lastViewedAt: now,
        viewCount: 1,
      },
      update: {
        lastViewedAt: now,
        viewCount: { increment: 1 },
      },
    }),
  ]);
}

export function lifecycleWhere(
  status: string | null,
  now = new Date(),
): Prisma.AnnouncementWhereInput {
  switch ((status ?? "").toUpperCase()) {
    case "DRAFT":
      return { status: AnnouncementStatus.DRAFT };
    case "SCHEDULED":
      return {
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: { gt: now },
      };
    case "ARCHIVED":
      return { status: AnnouncementStatus.ARCHIVED };
    case "EXPIRED":
      return { expiresAt: { lte: now } };
    case "ACTIVE":
      return {
        status: AnnouncementStatus.PUBLISHED,
        AND: [
          { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      };
    default:
      return {};
  }
}
