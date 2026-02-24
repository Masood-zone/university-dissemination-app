import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type NotificationMetadata = Record<string, unknown>;

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export const notificationService = {
  async create(args: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    announcementId?: string;
    metadata?: NotificationMetadata;
  }): Promise<{ id: string }> {
    const created = await prisma.notification.create({
      data: {
        userId: args.userId,
        type: args.type,
        title: args.title,
        message: args.message,
        isRead: false,
        announcementId: args.announcementId ?? null,
        metadata:
          args.metadata === undefined ? null : safeStringify(args.metadata),
      },
      select: { id: true },
    });

    return created;
  },

  async setMetadata(
    notificationId: string,
    metadata: NotificationMetadata,
  ): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        metadata: safeStringify(metadata),
      },
      select: { id: true },
    });
  },
};
