import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email-service";
import { smsService } from "@/lib/sms-service";

function getAppUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:3000"
  );
}

function getMessagingPathForRole(role: Role | null | undefined): string {
  switch (role) {
    case Role.LECTURER:
      return "/lecturer/messaging";
    case Role.STUDENT:
      return "/student/messaging";
    default:
      return "/login";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function notifyUsersOfNewMessage(args: {
  senderName: string;
  recipientIds: string[];
  messagePreview: string;
}): Promise<void> {
  const uniqueRecipientIds = Array.from(new Set(args.recipientIds)).filter(
    Boolean,
  );

  if (!uniqueRecipientIds.length) return;

  const recipients = await prisma.user.findMany({
    where: { id: { in: uniqueRecipientIds } },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  const appUrl = getAppUrl();
  const appName = process.env.APP_NAME || "SIDS";

  const preview = args.messagePreview.trim();
  const previewSafe = escapeHtml(preview.slice(0, 400));

  await Promise.allSettled(
    recipients.flatMap((r) => {
      const tasks: Array<Promise<unknown>> = [];

      const messagingUrl = `${appUrl}${getMessagingPathForRole(r.role)}`;

      if (r.email?.trim()) {
        const subject = `New message - ${appName}`;
        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="margin: 0 0 12px;">You have a new message</h2>
            <p style="margin: 0 0 8px;">From: <strong>${escapeHtml(
              args.senderName || "Someone",
            )}</strong></p>
            <p style="margin: 0 0 12px; color: #374151;">
              <em>${previewSafe || "(no preview)"}</em>
            </p>
            <p style="margin: 0;">
              <a href="${messagingUrl}" style="color: #2563eb;">Open Messaging Center</a>
            </p>
          </div>
        `;

        tasks.push(
          emailService
            .sendEmail({
              to: r.email,
              subject,
              html,
              text: `New message from ${args.senderName}. Open: ${messagingUrl}`,
            })
            .catch((err) => {
              console.error("Failed to send message email:", err);
            }),
        );
      }

      const phoneRaw = r.phone?.trim() || "";
      if (phoneRaw) {
        const to = smsService.formatPhoneNumber(phoneRaw);
        const message = `New message from ${args.senderName}. Login to reply.`;
        tasks.push(
          smsService.sendSMS({ to, message }).catch((err) => {
            console.error("Failed to send message SMS:", err);
          }),
        );
      }

      return tasks;
    }),
  );
}
