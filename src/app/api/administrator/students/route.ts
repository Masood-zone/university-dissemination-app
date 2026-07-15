import { ApplicationStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type { AdminStudentListResult, ApiResponse } from "@/types";

const statusValues = new Set(Object.values(ApplicationStatus));

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const departmentId = url.searchParams.get("departmentId")?.trim() || undefined;
    const programmeId = url.searchParams.get("programmeId")?.trim() || undefined;
    const rawStatus = url.searchParams.get("status")?.trim().toUpperCase() ?? "ALL";
    const status = statusValues.has(rawStatus as ApplicationStatus)
      ? (rawStatus as ApplicationStatus)
      : undefined;
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(
      100,
      Math.max(10, Number(url.searchParams.get("pageSize") ?? 25) || 25),
    );

    const where: Prisma.UserWhereInput = {
      role: "STUDENT",
      ...(departmentId ? { departmentId } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { studentProfile: { studentId: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(programmeId || status
        ? {
            applications: {
              some: {
                ...(programmeId ? { programmeId } : {}),
                ...(status ? { status } : {}),
              },
            },
          }
        : {}),
    };

    const [users, total, totalStudents, approved, pending, active] =
      await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            departmentId: true,
            department: { select: { name: true } },
            studentProfile: { select: { studentId: true, batch: true } },
            applications: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                status: true,
                programmeId: true,
                programme: { select: { name: true } },
              },
            },
          },
        }),
        prisma.user.count({ where }),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({
          where: { role: "STUDENT", applications: { some: { status: "APPROVED" } } },
        }),
        prisma.user.count({
          where: {
            role: "STUDENT",
            applications: { some: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } },
          },
        }),
        prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
      ]);

    const payload: AdminStudentListResult = {
      stats: { total: totalStudents, approved, pending, active },
      rows: users.map((user) => {
        const application = user.applications[0] ?? null;
        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phone,
          studentId: user.studentProfile?.studentId ?? "—",
          batch: user.studentProfile?.batch ?? "—",
          departmentId: user.departmentId,
          departmentName: user.department?.name ?? null,
          programmeId: application?.programmeId ?? null,
          programmeName: application?.programme.name ?? null,
          applicationStatus: application?.status ?? null,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
        };
      }),
      page,
      pageSize,
      total,
    };

    return NextResponse.json({ success: true, data: payload } satisfies ApiResponse<AdminStudentListResult>);
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { success: false, message: error.status === 401 ? "Unauthorized" : "Forbidden" } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to load students", code: "STUDENTS_FETCH_FAILED" } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
