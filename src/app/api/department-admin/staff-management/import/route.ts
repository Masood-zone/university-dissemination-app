import { NextResponse } from "next/server";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireDepartmentAdmin } from "@/lib/server";
import type {
  ApiResponse,
  DepartmentAdminBulkImportResult,
  DepartmentAdminBulkImportRow,
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

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

    const body = (await request.json()) as unknown as { rows?: unknown };
    const rows = Array.isArray(body.rows)
      ? (body.rows as DepartmentAdminBulkImportRow[])
      : [];

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "No rows provided",
          code: "NO_ROWS",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const result: DepartmentAdminBulkImportResult = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 1;

      try {
        const role = row.role === "LECTURER" ? Role.LECTURER : Role.STUDENT;
        const email = normalizeEmail(row.email);
        const firstName = normalizeString(row.firstName);
        const lastName = normalizeString(row.lastName);
        const password = normalizeString(row.password);

        if (!email || !firstName || !lastName || !password) {
          throw new Error(
            "Missing required fields (email, password, firstName, lastName)",
          );
        }

        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true },
        });

        if (!existing) {
          const userId = randomUUID();
          const name = `${firstName} ${lastName}`.trim();

          await prisma.$transaction(async (tx) => {
            await tx.user.create({
              data: {
                id: userId,
                name,
                email,
                emailVerified: false,
                firstName,
                lastName,
                phone: normalizeString(row.phone) || null,
                role,
                isActive: true,
                departmentId,
              },
            });

            await ensureCredentialAccount(
              tx as unknown as DbClient,
              userId,
              password,
            );

            if (role === Role.LECTURER) {
              const employeeId =
                normalizeString(row.employeeId) ||
                (await generateEmployeeId(tx as unknown as DbClient));
              const qualification = normalizeString(row.qualification);
              const specialization = normalizeString(row.specialization);

              if (!qualification || !specialization) {
                throw new Error(
                  "Missing lecturer fields (employeeId, qualification, specialization)",
                );
              }

              await tx.lecturerProfile.create({
                data: {
                  userId,
                  employeeId,
                  qualification,
                  specialization,
                  office: normalizeString(row.office) || null,
                  taughtCourses: [],
                },
              });
            }

            if (role === Role.STUDENT) {
              const studentId =
                normalizeString(row.studentId) ||
                `STU-${new Date().getFullYear()}-${Math.floor(
                  100000 + Math.random() * 900000,
                )}`;
              const batch =
                normalizeString(row.batch) || String(new Date().getFullYear());

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

          result.created += 1;
        } else {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              role: existing.role === role ? existing.role : role,
              departmentId,
            },
          });

          result.updated += 1;
        }
      } catch (err) {
        result.failed += 1;
        const message = err instanceof Error ? err.message : "Import failed";
        result.errors.push({ row: rowNumber, message });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
      } satisfies ApiResponse<DepartmentAdminBulkImportResult>,
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
        message: "Bulk import failed",
        code: "BULK_IMPORT_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
