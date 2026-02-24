import { NotificationType } from "@prisma/client";

import { emailService } from "@/lib/email-service";
import { notificationService } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";
import { smsService } from "@/lib/sms-service";

type ChannelStatus = "PENDING" | "SENT" | "FAILED";

function getAppName(): string {
  return process.env.APP_NAME || "SIDS";
}

function buildAssignmentEmailHtml(args: {
  recipientName: string;
  departmentName: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Department Assignment</h2>
      <p style="margin: 0 0 12px;">Hi ${args.recipientName},</p>
      <p style="margin: 0 0 12px;">
        You have been assigned as the department admin for <strong>${args.departmentName}</strong>.
      </p>
      <p style="margin: 0; color: #666;">${getAppName()}</p>
    </div>
  `.trim();
}

export async function notifyDepartmentAdminAssigned(args: {
  userId: string;
  departmentId: string;
  departmentName: string;
  kind: "DEPARTMENT_CREATED" | "HOD_ASSIGNED";
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      isActive: true,
      role: true,
    },
  });

  if (!user || !user.isActive) return;

  const recipientName = `${user.firstName} ${user.lastName}`.trim();
  const title = "Department assignment";
  const message = `You have been assigned to ${args.departmentName}.`;

  const emailTo = user.email?.trim() || "";
  const phoneRaw = user.phone?.trim() || "";
  const smsTo = phoneRaw ? smsService.formatPhoneNumber(phoneRaw) : "";

  const subject = `Department Assignment - ${getAppName()}`;

  const metadata: {
    kind: string;
    departmentId: string;
    departmentName: string;
    channels: {
      inApp: { status: "SENT" };
      email?: { to: string; subject: string; status: ChannelStatus };
      sms?: { to: string; status: ChannelStatus };
    };
  } = {
    kind: args.kind,
    departmentId: args.departmentId,
    departmentName: args.departmentName,
    channels: {
      inApp: { status: "SENT" },
      ...(emailTo
        ? { email: { to: emailTo, subject, status: "PENDING" } }
        : {}),
      ...(smsTo ? { sms: { to: smsTo, status: "PENDING" } } : {}),
    },
  };

  const created = await notificationService.create({
    userId: args.userId,
    type: NotificationType.SYSTEM,
    title,
    message,
    metadata,
  });

  // Try email/SMS; never throw (don't block the main request).
  if (metadata.channels.email) {
    try {
      await emailService.sendEmail({
        to: metadata.channels.email.to,
        subject: metadata.channels.email.subject,
        html: buildAssignmentEmailHtml({
          recipientName,
          departmentName: args.departmentName,
        }),
        text: `Hi ${recipientName}, you have been assigned as the department admin for ${args.departmentName}.`,
      });
      metadata.channels.email.status = "SENT";
    } catch {
      metadata.channels.email.status = "FAILED";
    }
  }

  if (metadata.channels.sms) {
    try {
      await smsService.sendSMS({
        to: metadata.channels.sms.to,
        message: `You have been assigned as the department admin for ${args.departmentName}.`,
      });
      metadata.channels.sms.status = "SENT";
    } catch {
      metadata.channels.sms.status = "FAILED";
    }
  }

  await notificationService.setMetadata(created.id, metadata);
}
