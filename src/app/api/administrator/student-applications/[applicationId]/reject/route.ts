import { NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import { emailService } from "@/lib/email-service";
import { smsService } from "@/lib/sms-service";
import { notificationService } from "@/lib/notification-service";
import type { ApiResponse } from "@/types";

type RejectBody = {
  reason?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const session = await requireAdmin(request);
    const adminId = session.user.id;

    const body = (await request.json().catch(() => ({}))) as RejectBody;
    const reason = body.reason?.trim() || "";

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Rejection reason is required",
          code: "VALIDATION_ERROR",
          errors: { reason: ["Required"] },
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

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

    const fromStatus = app.status;

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.REJECTED,
        reviewedAt: new Date(),
        decidedAt: new Date(),
        notes: reason,
        statusHistory: {
          create: {
            fromStatus,
            toStatus: ApplicationStatus.REJECTED,
            changedById: adminId,
            note: reason,
          },
        },
      },
      select: { id: true },
    });

    const studentName = `${app.applicantFirstName} ${app.applicantLastName}`.trim();

    const phoneRaw = app.applicantPhone?.trim() || "";
    const smsTo = phoneRaw ? smsService.formatPhoneNumber(phoneRaw) : "";

    const baseMetadata = {
      channels: {
        email: {
          to: app.applicantEmail,
          subject: `Enrollment REJECTED - ${process.env.APP_NAME || "SIDS"}`,
          status: "PENDING",
        },
        sms: {
          to: smsTo,
          status: "PENDING",
        },
      },
    } as const;

    const notificationId = app.applicantId
      ? (await notificationService.create({
          userId: app.applicantId,
          type: "ACADEMIC",
          title: "Enrollment rejected",
          message: `Your enrollment has been rejected. Application No: ${app.applicationNo}.`,
          metadata: baseMetadata,
        }))
      : null;

    let emailStatus: "SENT" | "FAILED" = "SENT";
    let smsStatus: "SENT" | "FAILED" = "SENT";

    try {
      await emailService.sendStudentEnrollmentDecisionEmail({
        to: app.applicantEmail,
        studentName,
        applicationNo: app.applicationNo,
        decision: "REJECTED",
        reason,
      });
    } catch (err) {
      emailStatus = "FAILED";
      console.error("Failed to send rejection email:", err);
    }

    if (smsTo) {
      try {
        await smsService.sendEnrollmentDecisionSMS({
          to: smsTo,
          applicationNo: app.applicationNo,
          decision: "REJECTED",
        });
      } catch (err) {
        smsStatus = "FAILED";
        console.error("Failed to send rejection SMS:", err);
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
      message: "Application rejected",
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
        message: "Failed to reject application",
        code: "APPLICATION_REJECT_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
