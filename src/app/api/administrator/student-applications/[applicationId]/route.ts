import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type { AdminStudentApplicationDetail, ApiResponse } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    await requireAdmin(request);

    const { applicationId } = await params;

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        applicationNo: true,
        status: true,
        applicantFirstName: true,
        applicantLastName: true,
        applicantEmail: true,
        applicantPhone: true,
        notes: true,
        submittedAt: true,
        reviewedAt: true,
        decidedAt: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
        programme: { select: { id: true, name: true } },
        documents: {
          orderBy: { uploadedAt: "desc" },
          select: {
            id: true,
            type: true,
            fileName: true,
            fileUrl: true,
            mimeType: true,
            sizeBytes: true,
            isVerified: true,
            verifiedAt: true,
            uploadedAt: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
            changedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
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

    const payload: AdminStudentApplicationDetail = {
      id: app.id,
      applicationNo: app.applicationNo,
      status: app.status,
      applicantFirstName: app.applicantFirstName,
      applicantLastName: app.applicantLastName,
      applicantEmail: app.applicantEmail,
      applicantPhone: app.applicantPhone,
      studentName: `${app.applicantFirstName} ${app.applicantLastName}`.trim(),
      submittedAt: (app.submittedAt ?? app.createdAt).toISOString(),
      reviewedAt: app.reviewedAt?.toISOString() ?? null,
      decidedAt: app.decidedAt?.toISOString() ?? null,
      department: app.department,
      programme: app.programme,
      notes: app.notes,
      documents: app.documents.map((doc) => ({
        ...doc,
        verifiedAt: doc.verifiedAt?.toISOString() ?? null,
        uploadedAt: doc.uploadedAt.toISOString(),
      })),
      statusHistory: app.statusHistory.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
        changedBy: h.changedBy,
      })),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<AdminStudentApplicationDetail>);
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
        message: "Failed to load application",
        code: "APPLICATION_GET_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
