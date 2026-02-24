import { NextResponse } from "next/server";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireDepartmentAdmin } from "@/lib/server";
import type {
  ApiResponse,
  DepartmentAdminCreateStaffUserInput,
  DepartmentAdminStaffListRow,
  DepartmentAdminStaffListResult,
  DepartmentAdminStaffRoleFilter,
  DepartmentAdminStaffStatusFilter,
} from "@/types";

type DbClient = {
  account: {
    findFirst: typeof prisma.account.findFirst;
    update: typeof prisma.account.update;
    create: typeof prisma.account.create;
  };
  lecturerProfile: {
    findUnique: typeof prisma.lecturerProfile.findUnique;
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

async function generateEmployeeId(db: DbClient): Promise<string> {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `EMP-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await db.lecturerProfile.findUnique({
      where: { employeeId: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  return `EMP-${year}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function parseNumber(value: string | null, fallback: number): number {
  const parsed = value ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const session = await requireDepartmentAdmin(request);
    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        firstName: true,
        lastName: true,
        department: { select: { name: true } },
      },
    });

    let departmentId = currentUser?.departmentId ?? null;
    let departmentName = currentUser?.department?.name ?? "Department";

    if (!departmentId && currentUser) {
      const headName =
        `${currentUser.firstName} ${currentUser.lastName}`.trim();
      if (headName) {
        const dept = await prisma.department.findFirst({
          where: { headOfDept: headName },
          select: { id: true, name: true },
        });

        if (dept?.id) {
          departmentId = dept.id;
          departmentName = dept.name;
          prisma.user
            .update({ where: { id: userId }, data: { departmentId: dept.id } })
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

    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() || "";
    const role = (url.searchParams.get("role")?.trim() || "ALL") as
      | DepartmentAdminStaffRoleFilter
      | string;
    const status = (url.searchParams.get("status")?.trim() || "ALL") as
      | DepartmentAdminStaffStatusFilter
      | string;

    const page = Math.max(1, parseNumber(url.searchParams.get("page"), 1));
    const limit = Math.min(
      100,
      Math.max(1, parseNumber(url.searchParams.get("limit"), 25)),
    );
    const skip = (page - 1) * limit;

    const roleFilter: Role[] =
      role === "LECTURER"
        ? [Role.LECTURER]
        : role === "STUDENT"
          ? [Role.STUDENT]
          : [Role.LECTURER, Role.STUDENT];

    const where = {
      departmentId,
      role: { in: roleFilter },
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status === "ACTIVE"
        ? { isActive: true }
        : status === "DEACTIVATED"
          ? { isActive: false }
          : status === "PENDING_AUTH"
            ? { emailVerified: false }
            : {}),
    };

    const [
      total,
      users,
      statsTotal,
      statsLecturers,
      statsStudents,
      statsPending,
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          lecturerProfile: {
            select: {
              employeeId: true,
            },
          },
          studentProfile: {
            select: {
              studentId: true,
              batch: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          departmentId,
          role: { in: [Role.LECTURER, Role.STUDENT] },
        },
      }),
      prisma.user.count({ where: { departmentId, role: Role.LECTURER } }),
      prisma.user.count({ where: { departmentId, role: Role.STUDENT } }),
      prisma.user.count({
        where: {
          departmentId,
          role: { in: [Role.LECTURER, Role.STUDENT] },
          emailVerified: false,
        },
      }),
    ]);

    const rows: DepartmentAdminStaffListRow[] = users.map((u) => {
      const systemId =
        u.role === Role.LECTURER
          ? (u.lecturerProfile?.employeeId ?? null)
          : (u.studentProfile?.studentId ?? null);

      const levelOrMeta =
        u.role === Role.STUDENT ? (u.studentProfile?.batch ?? null) : null;

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        role:
          u.role === Role.LECTURER
            ? ("LECTURER" as const)
            : ("STUDENT" as const),
        systemId,
        departmentName,
        levelOrMeta,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt.toISOString(),
      };
    });

    const result: DepartmentAdminStaffListResult = {
      stats: {
        totalUsers: statsTotal,
        lecturers: statsLecturers,
        students: statsStudents,
        pendingAuth: statsPending,
      },
      rows,
      page,
      pageSize: limit,
      total,
    };

    return NextResponse.json({
      success: true,
      data: result,
    } satisfies ApiResponse<DepartmentAdminStaffListResult>);
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
        message: "Failed to load staff list",
        code: "STAFF_LIST_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    const input =
      (await request.json()) as unknown as DepartmentAdminCreateStaffUserInput;

    const role = input.role === "LECTURER" ? Role.LECTURER : Role.STUDENT;

    if (![Role.LECTURER, Role.STUDENT].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role",
          code: "INVALID_ROLE",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const email = input.email.trim().toLowerCase();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const name = `${firstName} ${lastName}`.trim();

    if (!email || !firstName || !lastName || !input.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
          code: "EMAIL_EXISTS",
        } satisfies ApiResponse<never>,
        { status: 409 },
      );
    }

    const userId = randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name,
          email,
          emailVerified: false,
          firstName,
          lastName,
          phone: input.phone?.trim() || null,
          role,
          isActive: true,
          departmentId,
        },
      });

      await ensureCredentialAccount(
        tx as unknown as DbClient,
        userId,
        input.password,
      );

      if (role === Role.LECTURER) {
        const employeeId =
          input.employeeId?.trim() ||
          (await generateEmployeeId(tx as unknown as DbClient));
        const qualification = input.qualification?.trim();
        const specialization = input.specialization?.trim();

        if (!qualification || !specialization) {
          throw new Response("Missing lecturer fields", { status: 400 });
        }

        await tx.lecturerProfile.create({
          data: {
            userId,
            employeeId,
            qualification,
            specialization,
            office: input.office?.trim() || null,
            taughtCourses: [],
          },
        });
      }

      if (role === Role.STUDENT) {
        const studentId =
          input.studentId?.trim() ||
          `STU-${new Date().getFullYear()}-${Math.floor(
            100000 + Math.random() * 900000,
          )}`;
        const batch = input.batch?.trim() || String(new Date().getFullYear());

        await tx.studentProfile.create({
          data: {
            userId,
            studentId,
            batch,
            enrolledCourses: [],
          },
        });
      }
    });

    return NextResponse.json(
      { success: true, data: { id: userId } } satisfies ApiResponse<{
        id: string;
      }>,
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: error.status === 400 ? "Validation error" : "Forbidden",
          code: error.status === 400 ? "VALIDATION_ERROR" : "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user",
        code: "CREATE_USER_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
