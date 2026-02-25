import { NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import { emailService } from "@/lib/email-service";
import { smsService } from "@/lib/sms-service";
import { notificationService } from "@/lib/notification-service";
import type { ApiResponse } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const session = await requireAdmin(request);
    const adminId = session.user.id;

    const { applicationId } = await params;

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
        applicationNo: true,
        applicantFirstName: true,
        applicantLastName: true,
        applicantEmail: true,
        applicantPhone: true,
        applicantId: true,
      },
    });

    if (!app) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    if (app.status === ApplicationStatus.APPROVED) {
      return NextResponse.json(
        {
          success: false,
          message: "Application is already approved",
          code: "ALREADY_APPROVED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (app.status === ApplicationStatus.REJECTED) {
      return NextResponse.json(
        {
          success: false,
          message: "Application is already rejected",
          code: "ALREADY_REJECTED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const fromStatus = app.status;

    await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewedAt: new Date(),
          decidedAt: new Date(),
          statusHistory: {
            create: {
              fromStatus,
              toStatus: ApplicationStatus.APPROVED,
              changedById: adminId,
              note: "Approved by administrator",
            },
          },
        },
        select: { id: true },
      }),
      ...(app.applicantId
        ? [
            prisma.user.updateMany({
              where: { id: app.applicantId },
              data: { emailVerified: true },
            }),
          ]
        : []),
    ]);

    const studentName =
      `${app.applicantFirstName} ${app.applicantLastName}`.trim();

    const phoneRaw = app.applicantPhone?.trim() || "";
    const smsTo = phoneRaw ? smsService.formatPhoneNumber(phoneRaw) : "";

    const baseMetadata = {
      channels: {
        email: {
          to: app.applicantEmail,
          subject: `Enrollment APPROVED - ${process.env.APP_NAME || "SIDS"}`,
          status: "PENDING",
        },
        sms: {
          to: smsTo,
          status: "PENDING",
        },
      },
    } as const;

    const notificationId = app.applicantId
      ? await notificationService.create({
          userId: app.applicantId,
          type: "ACADEMIC",
          title: "Enrollment approved",
          message: `Your enrollment has been approved. Application No: ${app.applicationNo}.`,
          metadata: baseMetadata,
        })
      : null;

    let emailStatus: "SENT" | "FAILED" = "SENT";
    let smsStatus: "SENT" | "FAILED" = "SENT";

    try {
      await emailService.sendStudentEnrollmentDecisionEmail({
        to: app.applicantEmail,
        studentName,
        applicationNo: app.applicationNo,
        decision: "APPROVED",
      });
    } catch (err) {
      emailStatus = "FAILED";
      console.error("Failed to send approval email:", err);
    }

    if (smsTo) {
      try {
        await smsService.sendEnrollmentDecisionSMS({
          to: smsTo,
          applicationNo: app.applicationNo,
          decision: "APPROVED",
        });
      } catch (err) {
        smsStatus = "FAILED";
        console.error("Failed to send approval SMS:", err);
      }
    } else {
      smsStatus = "FAILED";
    }

    if (notificationId) {
      await notificationService.setMetadata(notificationId.id, {
        ...baseMetadata,
        channels: {
          email: { ...baseMetadata.channels.email, status: emailStatus },
          sms: { ...baseMetadata.channels.sms, status: smsStatus },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Application approved",
    } satisfies ApiResponse<{ ok: true }>);
  } catch (error) {
    if (error instanceof Response) {
      const status = error.status || 401;
      const code = status === 403 ? "FORBIDDEN" : "UNAUTHORIZED";
      const message = status === 403 ? "Forbidden" : "Unauthorized";

      return NextResponse.json(
        {
          success: false,
          message,
          code,
        } satisfies ApiResponse<never>,
        { status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to approve application",
        code: "APPLICATION_APPROVE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
