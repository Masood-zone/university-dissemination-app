import { NextResponse } from "next/server";
import { ApplicationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type {
  AdminStudentApplicationsListResult,
  ApiResponse,
} from "@/types";

function parseTake(value: string | null): number {
  const parsed = value ? Number(value) : 25;
  if (!Number.isFinite(parsed) || parsed <= 0) return 25;
  return Math.min(Math.floor(parsed), 100);
}

function parseStatus(value: string | null): ApplicationStatus | null {
  if (!value) return null;
  const candidate = value.trim().toUpperCase();
  const all = Object.values(ApplicationStatus);
  return all.includes(candidate as ApplicationStatus)
    ? (candidate as ApplicationStatus)
    : null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const departmentId = url.searchParams.get("departmentId")?.trim() || "";
    const programmeId = url.searchParams.get("programmeId")?.trim() || "";
    const status = parseStatus(url.searchParams.get("status"));
    const take = parseTake(url.searchParams.get("take"));

    const where: Prisma.ApplicationWhereInput = {
      ...(departmentId ? { departmentId } : {}),
      ...(programmeId ? { programmeId } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { applicationNo: { contains: q, mode: "insensitive" } },
              { applicantFirstName: { contains: q, mode: "insensitive" } },
              { applicantLastName: { contains: q, mode: "insensitive" } },
              { applicantEmail: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
        take,
        select: {
          id: true,
          applicationNo: true,
          status: true,
          applicantFirstName: true,
          applicantLastName: true,
          submittedAt: true,
          createdAt: true,
          department: { select: { id: true, name: true } },
          programme: { select: { id: true, name: true } },
          documents: { select: { isVerified: true } },
        },
      }),
      prisma.application.count({ where }),
    ]);

    const payload: AdminStudentApplicationsListResult = {
      total,
      rows: rows.map((row) => {
        const verifiedCount = row.documents.filter((d) => d.isVerified).length;
        const docsCount = row.documents.length;

        return {
          id: row.id,
          applicationNo: row.applicationNo,
          status: row.status,
          studentName: `${row.applicantFirstName} ${row.applicantLastName}`.trim(),
          departmentId: row.department.id,
          departmentName: row.department.name,
          programmeId: row.programme.id,
          programmeName: row.programme.name,
          submittedAt: (row.submittedAt ?? row.createdAt).toISOString(),
          docsCount,
          docsVerifiedCount: verifiedCount,
        };
      }),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<AdminStudentApplicationsListResult>);
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
        message: "Failed to load applications",
        code: "APPLICATIONS_LIST_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
