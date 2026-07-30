import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";

import {
  ensureCredentialAccount,
  generateTemporaryPassword,
} from "@/lib/credential-account";
import { notifyDepartmentStaffWelcome } from "@/lib/department-staff-notifications";
import { normalizeGhanaPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";

const createSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().nullable(),
  password: z.string().min(8).optional(),
  role: z.nativeEnum(Role),
  departmentId: z.string().trim().optional().nullable(),
  staffId: z.string().trim().optional().nullable(),
  employeeId: z.string().trim().optional().nullable(),
  qualification: z.string().trim().optional().nullable(),
  specialization: z.string().trim().optional().nullable(),
  office: z.string().trim().optional().nullable(),
  studentId: z.string().trim().optional().nullable(),
  batch: z.string().trim().optional().nullable(),
});

function numberParam(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const role = url.searchParams.get("role") as Role | null;
    const status = url.searchParams.get("status") ?? "ALL";
    const departmentId = url.searchParams.get("departmentId")?.trim() ?? "";
    const page = Math.max(1, numberParam(url.searchParams.get("page"), 1));
    const pageSize = Math.min(
      100,
      Math.max(1, numberParam(url.searchParams.get("pageSize"), 20)),
    );

    const where = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q } },
            ],
          }
        : {}),
      ...(role && Object.values(Role).includes(role) ? { role } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(status === "ACTIVE"
        ? { isActive: true }
        : status === "INACTIVE"
          ? { isActive: false }
          : status === "UNVERIFIED"
            ? { emailVerified: false }
            : {}),
    };

    const [total, users, grouped, departments] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          department: { select: { id: true, name: true } },
          departmentAdminProfile: { select: { staffId: true } },
          lecturerProfile: { select: { employeeId: true } },
          studentProfile: { select: { studentId: true } },
        },
      }),
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const stats = Object.fromEntries(
      Object.values(Role).map((item) => [
        item,
        grouped.find((row) => row.role === item)?._count._all ?? 0,
      ]),
    );

    return NextResponse.json({
      success: true,
      data: {
        rows: users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          systemId:
            user.departmentAdminProfile?.staffId ??
            user.lecturerProfile?.employeeId ??
            user.studentProfile?.studentId ??
            null,
          phoneRecoveryReady: Boolean(user.phoneNumber),
        })),
        stats,
        departments,
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    const status = error instanceof Response ? error.status : 500;
    return NextResponse.json(
      {
        success: false,
        message: status === 500 ? "Failed to load users" : "Forbidden",
        code: status === 500 ? "USERS_FETCH_FAILED" : "FORBIDDEN",
      },
      { status },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    const input = createSchema.parse(await request.json());
    const email = input.email.toLowerCase();
    const phoneNumber = input.phone ? normalizeGhanaPhone(input.phone) : null;
    if (input.phone && !phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid Ghana phone number",
          code: "INVALID_PHONE",
        },
        { status: 400 },
      );
    }
    if (input.role !== Role.ADMIN && !input.departmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Department is required for this role",
          code: "DEPARTMENT_REQUIRED",
        },
        { status: 400 },
      );
    }
    if (
      input.role === Role.LECTURER &&
      (!input.qualification || !input.specialization)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Qualification and specialization are required",
          code: "LECTURER_PROFILE_REQUIRED",
        },
        { status: 400 },
      );
    }

    const password = input.password ?? generateTemporaryPassword();
    const userId = randomUUID();
    const name = `${input.firstName} ${input.lastName}`.trim();

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name,
          firstName: input.firstName,
          lastName: input.lastName,
          email,
          emailVerified: false,
          phone: input.phone || null,
          phoneNumber,
          phoneNumberVerified: false,
          role: input.role,
          departmentId:
            input.role === Role.ADMIN ? null : input.departmentId || null,
          isActive: true,
        },
      });
      await ensureCredentialAccount(tx, userId, password);

      if (input.role === Role.DEPARTMENT_ADMIN) {
        await tx.departmentAdminProfile.create({
          data: { userId, staffId: input.staffId || null },
        });
      } else if (input.role === Role.LECTURER) {
        await tx.lecturerProfile.create({
          data: {
            userId,
            employeeId: input.employeeId || `EMP-${Date.now()}`,
            qualification: input.qualification!,
            specialization: input.specialization!,
            office: input.office || null,
            taughtCourses: [],
          },
        });
      } else if (input.role === Role.STUDENT) {
        await tx.studentProfile.create({
          data: {
            userId,
            studentId: input.studentId || `STU-${Date.now()}`,
            batch: input.batch || String(new Date().getFullYear()),
            enrolledCourses: [],
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "USER_CREATED",
          resource: "User",
          resourceId: userId,
          details: JSON.stringify({ role: input.role, email }),
        },
      });
    });

    const department = input.departmentId
      ? await prisma.department.findUnique({
          where: { id: input.departmentId },
          select: { name: true },
        })
      : null;
    void notifyDepartmentStaffWelcome({
      recipientName: name,
      departmentName: department?.name ?? "University Administration",
      role: input.role,
      email,
      phone: input.phone ?? "",
      password,
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: userId, temporaryPassword: password },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user details",
          code: "VALIDATION_ERROR",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "Email, phone, or system ID already exists"
        : "Failed to create user";
    const status = error instanceof Response ? error.status : 500;
    return NextResponse.json(
      { success: false, message, code: "USER_CREATE_FAILED" },
      { status },
    );
  }
}
