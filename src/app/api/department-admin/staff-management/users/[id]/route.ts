import { NextResponse } from "next/server";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireDepartmentAdmin } from "@/lib/server";
import type {
  ApiResponse,
  DepartmentAdminStaffUserDetail,
  DepartmentAdminUpdateStaffUserInput,
} from "@/types";

type DbClient = {
  account: {
    findFirst: typeof prisma.account.findFirst;
    update: typeof prisma.account.update;
    create: typeof prisma.account.create;
  };
};

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options: {
    N: number;
    r: number;
    p: number;
    maxmem: number;
  },
) => Promise<Buffer>;

async function hashBetterAuthPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

async function ensureCredentialAccount(
  db: DbClient,
  userId: string,
  plainPassword: string,
) {
  const hashedPassword = await hashBetterAuthPassword(plainPassword);

  const existingCredentialAccount = await db.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  });

  if (existingCredentialAccount) {
    await db.account.update({
      where: { id: existingCredentialAccount.id },
      data: {
        accountId: userId,
        password: hashedPassword,
      },
    });
    return;
  }

  await db.account.create({
    data: {
      id: randomUUID(),
      userId,
      providerId: "credential",
      accountId: userId,
      password: hashedPassword,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireDepartmentAdmin(request);
    const actorId = session.user?.id;

    if (!actorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { departmentId: true, firstName: true, lastName: true },
    });

    let departmentId = actor?.departmentId ?? null;

    if (!departmentId && actor) {
      const headName = `${actor.firstName} ${actor.lastName}`.trim();
      if (headName) {
        const dept = await prisma.department.findFirst({
          where: { headOfDept: headName },
          select: { id: true },
        });
        if (dept?.id) {
          departmentId = dept.id;
          prisma.user
            .update({ where: { id: actorId }, data: { departmentId: dept.id } })
            .catch(() => undefined);
        }
      }
    }

    if (!departmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Department admin has no department assigned",
          code: "DEPARTMENT_REQUIRED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        departmentId,
        role: { in: [Role.LECTURER, Role.STUDENT] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        departmentId: true,
        department: { select: { name: true } },
        lecturerProfile: {
          select: {
            employeeId: true,
            qualification: true,
            specialization: true,
            office: true,
          },
        },
        studentProfile: {
          select: {
            studentId: true,
            batch: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    const detail: DepartmentAdminStaffUserDetail = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role === Role.LECTURER ? "LECTURER" : "STUDENT",
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      departmentId: user.departmentId ?? departmentId,
      departmentName: user.department?.name ?? "Department",
      lecturerProfile: user.lecturerProfile,
      studentProfile: user.studentProfile,
    };

    return NextResponse.json(
      {
        success: true,
        data: detail,
      } satisfies ApiResponse<DepartmentAdminStaffUserDetail>,
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: error.status === 401 ? "Unauthorized" : "Forbidden",
          code: error.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load user",
        code: "USER_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireDepartmentAdmin(request);
    const actorId = session.user?.id;

    if (!actorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { departmentId: true, firstName: true, lastName: true },
    });

    let departmentId = actor?.departmentId ?? null;

    if (!departmentId && actor) {
      const headName = `${actor.firstName} ${actor.lastName}`.trim();
      if (headName) {
        const dept = await prisma.department.findFirst({
          where: { headOfDept: headName },
          select: { id: true },
        });
        if (dept?.id) {
          departmentId = dept.id;
          prisma.user
            .update({ where: { id: actorId }, data: { departmentId: dept.id } })
            .catch(() => undefined);
        }
      }
    }

    if (!departmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Department admin has no department assigned",
          code: "DEPARTMENT_REQUIRED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const { id } = await params;

    const input =
      (await request.json()) as unknown as DepartmentAdminUpdateStaffUserInput;

    const target = await prisma.user.findFirst({
      where: {
        id,
        departmentId,
        role: { in: [Role.LECTURER, Role.STUDENT] },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!target) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          firstName: input.firstName?.trim() || undefined,
          lastName: input.lastName?.trim() || undefined,
          name:
            input.firstName || input.lastName
              ? `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim()
              : undefined,
          phone:
            input.phone === undefined ? undefined : input.phone?.trim() || null,
          isActive: input.isActive,
        },
      });

      if (typeof input.password === "string" && input.password.trim()) {
        await ensureCredentialAccount(
          tx as unknown as DbClient,
          id,
          input.password.trim(),
        );
      }

      if (target.role === Role.LECTURER) {
        await tx.lecturerProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            employeeId: input.employeeId?.trim() || `EMP-${Date.now()}`,
            qualification: input.qualification?.trim() || "",
            specialization: input.specialization?.trim() || "",
            office: input.office?.trim() || null,
            taughtCourses: [],
          },
          update: {
            employeeId: input.employeeId?.trim() || undefined,
            qualification: input.qualification?.trim() || undefined,
            specialization: input.specialization?.trim() || undefined,
            office:
              input.office === undefined
                ? undefined
                : input.office?.trim() || null,
          },
        });
      }

      if (target.role === Role.STUDENT) {
        await tx.studentProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            studentId:
              input.studentId?.trim() ||
              `STU-${new Date().getFullYear()}-${Math.floor(
                100000 + Math.random() * 900000,
              )}`,
            batch: input.batch?.trim() || String(new Date().getFullYear()),
            enrolledCourses: [],
          },
          update: {
            studentId: input.studentId?.trim() || undefined,
            batch: input.batch?.trim() || undefined,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: { id },
    } satisfies ApiResponse<{ id: string }>);
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: error.status === 401 ? "Unauthorized" : "Forbidden",
          code: error.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user",
        code: "UPDATE_USER_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
