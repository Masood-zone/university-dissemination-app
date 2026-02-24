import { NotificationType, Role } from "@prisma/client";

import { emailService } from "@/lib/email-service";
import { notificationService } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";
import { smsService } from "@/lib/sms-service";

type ChannelStatus = "PENDING" | "SENT" | "FAILED";

function getAppUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:3000"
  );
}

function buildAnnouncementUrl(args: {
  announcementId: string;
  role: Role;
}): string {
  const base = getAppUrl();

  const path =
    args.role === Role.ADMIN || args.role === Role.DEPARTMENT_ADMIN
      ? `/administrator/announcements/${args.announcementId}`
      : `/student/announcements/${args.announcementId}`;

  return `${base}${path}`;
}

export async function notifyAnnouncementPublished(args: {
  announcementId: string;
  title: string;
  category: string;
  excerpt?: string | null;
  departmentId?: string | null;
  authorId: string;
  publishedByName?: string;
}): Promise<void> {
  const recipients = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { not: args.authorId },
      ...(args.departmentId
        ? {
            OR: [
              { departmentId: args.departmentId },
              { role: { in: [Role.ADMIN, Role.DEPARTMENT_ADMIN] } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  if (!recipients.length) return;

  const message =
    args.excerpt?.trim() || "A new announcement has been published.";

  const subject = `New Announcement: ${args.title}`;

  async function processRecipient(recipient: (typeof recipients)[number]) {
    const recipientName = `${recipient.firstName} ${recipient.lastName}`.trim();
    const announcementUrl = buildAnnouncementUrl({
      announcementId: args.announcementId,
      role: recipient.role,
    });

    const emailTo = recipient.email?.trim() || "";
    const phoneRaw = recipient.phone?.trim() || "";
    const smsTo = phoneRaw ? smsService.formatPhoneNumber(phoneRaw) : "";

    const metadata: {
      kind: "ANNOUNCEMENT_PUBLISHED";
      announcementId: string;
      category: string;
      announcementUrl: string;
      channels: {
        inApp: { status: "SENT" };
        email?: { to: string; subject: string; status: ChannelStatus };
        sms?: { to: string; status: ChannelStatus };
      };
    } = {
      kind: "ANNOUNCEMENT_PUBLISHED",
      announcementId: args.announcementId,
      category: args.category,
      announcementUrl,
      channels: {
        inApp: { status: "SENT" },
        ...(emailTo
          ? { email: { to: emailTo, subject, status: "PENDING" } }
          : {}),
        ...(smsTo ? { sms: { to: smsTo, status: "PENDING" } } : {}),
      },
    };

    const created = await notificationService.create({
      userId: recipient.id,
      type: NotificationType.ANNOUNCEMENT,
      title: args.title,
      message,
      announcementId: args.announcementId,
      metadata,
    });

    if (metadata.channels.email) {
      try {
        await emailService.sendAnnouncementPublishedEmail({
          to: metadata.channels.email.to,
          recipientName,
          title: args.title,
          category: args.category,
          publishedByName: args.publishedByName,
          announcementUrl,
          summary: args.excerpt?.trim() || undefined,
        });
        metadata.channels.email.status = "SENT";
      } catch {
        metadata.channels.email.status = "FAILED";
      }
    }

    if (metadata.channels.sms) {
      try {
        await smsService.sendAnnouncementPublishedSMS({
          to: metadata.channels.sms.to,
          title: args.title,
          category: args.category,
        });
        metadata.channels.sms.status = "SENT";
      } catch {
        metadata.channels.sms.status = "FAILED";
      }
    }

    await notificationService.setMetadata(created.id, metadata);
  }

  // Best-effort, limited concurrency (avoid hammering SMTP/SMS providers)
  const batchSize = 8;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const chunk = recipients.slice(i, i + batchSize);
    await Promise.all(
      chunk.map((r) =>
        processRecipient(r).catch(() => {
          // Never throw from the overall notification flow.
        }),
      ),
    );
  }
}
