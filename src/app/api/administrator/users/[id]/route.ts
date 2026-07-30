import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";

import { ensureCredentialAccount } from "@/lib/credential-account";
import { normalizeGhanaPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";

const updateSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
  staffId: z.string().trim().nullable().optional(),
  employeeId: z.string().trim().nullable().optional(),
  qualification: z.string().trim().nullable().optional(),
  specialization: z.string().trim().nullable().optional(),
  office: z.string().trim().nullable().optional(),
  studentId: z.string().trim().nullable().optional(),
  batch: z.string().trim().nullable().optional(),
});

async function activeAdminCount() {
  return prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        departmentAdminProfile: true,
        lecturerProfile: true,
        studentProfile: true,
        department: { select: { id: true, name: true } },
      },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    const status = error instanceof Response ? error.status : 500;
    return NextResponse.json(
      { success: false, message: "Failed to load user", code: "USER_FAILED" },
      { status },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(request);
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const current = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
            applications: true,
            lecturerAssignments: true,
          },
        },
      },
    });
    if (!current) {
      return NextResponse.json(
        { success: false, message: "User not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const nextRole = input.role ?? current.role;
    const removingAdmin =
      current.role === Role.ADMIN &&
      (nextRole !== Role.ADMIN || input.isActive === false);
    if (removingAdmin && (id === session.user.id || (await activeAdminCount()) <= 1)) {
      return NextResponse.json(
        {
          success: false,
          message: "The current or last active Super Admin cannot be removed",
          code: "LAST_SUPER_ADMIN",
        },
        { status: 409 },
      );
    }
    if (
      nextRole !== current.role &&
      current.role === Role.STUDENT &&
      (current._count.enrollments > 0 || current._count.applications > 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Remove student academic assignments before changing role",
          code: "ROLE_CONFLICT",
        },
        { status: 409 },
      );
    }
    if (
      nextRole !== current.role &&
      current.role === Role.LECTURER &&
      current._count.lecturerAssignments > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Remove lecturer course assignments before changing role",
          code: "ROLE_CONFLICT",
        },
        { status: 409 },
      );
    }
    if (nextRole !== Role.ADMIN && !(input.departmentId ?? current.departmentId)) {
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
      nextRole === Role.LECTURER &&
      (!input.qualification || !input.specialization) &&
      current.role !== Role.LECTURER
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Lecturer profile fields are required",
          code: "LECTURER_PROFILE_REQUIRED",
        },
        { status: 400 },
      );
    }

    const phoneNumber =
      input.phone === undefined
        ? undefined
        : input.phone
          ? normalizeGhanaPhone(input.phone)
          : null;
    if (input.phone && !phoneNumber) {
      return NextResponse.json(
        { success: false, message: "Invalid Ghana phone", code: "INVALID_PHONE" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const firstName = input.firstName ?? current.firstName;
      const lastName = input.lastName ?? current.lastName;
      await tx.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          email: input.email?.toLowerCase(),
          phone: input.phone,
          phoneNumber,
          role: nextRole,
          departmentId:
            nextRole === Role.ADMIN
              ? null
              : input.departmentId === undefined
                ? current.departmentId
                : input.departmentId,
          isActive: input.isActive,
        },
      });
      if (input.password) await ensureCredentialAccount(tx, id, input.password);

      if (nextRole !== current.role) {
        await Promise.all([
          tx.departmentAdminProfile.deleteMany({ where: { userId: id } }),
          tx.lecturerProfile.deleteMany({ where: { userId: id } }),
          tx.studentProfile.deleteMany({ where: { userId: id } }),
        ]);
      }
      if (nextRole === Role.DEPARTMENT_ADMIN) {
        await tx.departmentAdminProfile.upsert({
          where: { userId: id },
          create: { userId: id, staffId: input.staffId || null },
          update: { staffId: input.staffId },
        });
      } else if (nextRole === Role.LECTURER) {
        await tx.lecturerProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            employeeId: input.employeeId || `EMP-${Date.now()}`,
            qualification: input.qualification!,
            specialization: input.specialization!,
            office: input.office || null,
            taughtCourses: [],
          },
          update: {
            employeeId: input.employeeId || undefined,
            qualification: input.qualification || undefined,
            specialization: input.specialization || undefined,
            office: input.office,
          },
        });
      } else if (nextRole === Role.STUDENT) {
        await tx.studentProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            studentId: input.studentId || `STU-${Date.now()}`,
            batch: input.batch || String(new Date().getFullYear()),
            enrolledCourses: [],
          },
          update: {
            studentId: input.studentId || undefined,
            batch: input.batch || undefined,
          },
        });
      }
      if (input.isActive === false) {
        await tx.session.deleteMany({ where: { userId: id } });
      }
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action:
            input.isActive === false
              ? "USER_DEACTIVATED"
              : input.isActive === true && !current.isActive
                ? "USER_REACTIVATED"
                : nextRole !== current.role
                  ? "USER_ROLE_CHANGED"
                  : "USER_UPDATED",
          resource: "User",
          resourceId: id,
          details: JSON.stringify({
            fromRole: current.role,
            toRole: nextRole,
          }),
        },
      });
    });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid user details", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const status = error instanceof Response ? error.status : 500;
    return NextResponse.json(
      { success: false, message: "Failed to update user", code: "USER_UPDATE_FAILED" },
      { status },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin(request);
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true, isActive: true },
  });
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  if (
    id === session.user.id ||
    (user.role === Role.ADMIN && (await activeAdminCount()) <= 1)
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "The current or last active Super Admin cannot be deactivated",
        code: "LAST_SUPER_ADMIN",
      },
      { status: 409 },
    );
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { isActive: false } }),
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "USER_DEACTIVATED",
        resource: "User",
        resourceId: id,
      },
    }),
  ]);
  return NextResponse.json({ success: true, data: { id } });
}
