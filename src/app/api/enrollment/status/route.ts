import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server";
import type { ApiResponse, EnrollmentStatusResult } from "@/types";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const role = (session?.user as unknown as { role?: Role | string })?.role;

    if (role !== Role.STUDENT && role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
          code: "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const userId = session?.user.id;

    const app = await prisma.application.findFirst({
      where: { applicantId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        applicationNo: true,
        status: true,
        submittedAt: true,
        department: { select: { name: true } },
        programme: { select: { name: true } },
      },
    });

    if (!app) {
      return NextResponse.json(
        {
          success: false,
          message: "No enrollment application found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    const payload: EnrollmentStatusResult = {
      applicationNo: app.applicationNo,
      status: app.status,
      submittedAt: app.submittedAt?.toISOString() ?? null,
      departmentName: app.department.name,
      programmeName: app.programme.name,
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<EnrollmentStatusResult>);
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load enrollment status",
        code: "ENROLLMENT_STATUS_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
