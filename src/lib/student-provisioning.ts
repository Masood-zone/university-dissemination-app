import { randomUUID } from "node:crypto";
import { ApplicationStatus, Role } from "@prisma/client";

import { ensureCredentialAccount, generateTemporaryPassword } from "@/lib/credential-account";
import { prisma } from "@/lib/prisma";
import { ensureStudentEnrollmentsForCurrentSemester } from "@/lib/student-auto-enrollment";
import { normalizeStudentImportRow } from "@/lib/student-import-validation";
import { normalizeGhanaPhone } from "@/lib/phone";
import type { AdminStudentImportRow, ImportedStudentCredential } from "@/types";

export type ProvisionStudentOptions = {
  row: AdminStudentImportRow;
  actorId?: string | null;
  allowedDepartmentId?: string | null;
};

export type ProvisionStudentResult = {
  created: boolean;
  credential: ImportedStudentCredential | null;
};

export async function provisionApprovedStudent(
  options: ProvisionStudentOptions,
): Promise<ProvisionStudentResult> {
  const row = normalizeStudentImportRow(options.row);
  const department = await prisma.department.findUnique({
    where: { code: row.departmentCode },
    select: { id: true, code: true },
  });
  if (!department) throw new Error(`Department ${row.departmentCode} was not found`);
  if (options.allowedDepartmentId && department.id !== options.allowedDepartmentId) {
    throw new Error("Student department is outside your assigned department");
  }

  const programme = await prisma.programme.findFirst({
    where: {
      code: { equals: row.programmeCode, mode: "insensitive" },
      departmentId: department.id,
      isActive: true,
    },
    select: { id: true, code: true },
  });
  if (!programme) {
    throw new Error(
      `Programme ${row.programmeCode} is not active in ${row.departmentCode}`,
    );
  }

  const activeSession = await prisma.academicSession.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  if (!activeSession) throw new Error("No active academic session is configured");

  const existingByEmail = await prisma.user.findUnique({
    where: { email: row.email },
    select: { id: true, role: true },
  });
  const existingByStudentId = await prisma.studentProfile.findUnique({
    where: { studentId: row.studentId },
    select: { userId: true },
  });
  if (existingByEmail && existingByEmail.role !== Role.STUDENT) {
    throw new Error("Email belongs to a non-student account");
  }
  if (
    existingByEmail &&
    existingByStudentId &&
    existingByEmail.id !== existingByStudentId.userId
  ) {
    throw new Error("Email and student ID belong to different accounts");
  }

  const userId = existingByEmail?.id ?? existingByStudentId?.userId ?? randomUUID();
  const created = !existingByEmail && !existingByStudentId;
  let generatedPassword: string | null = null;
  const suppliedPassword = row.password ?? null;

  await prisma.$transaction(async (tx) => {
    if (created) {
      await tx.user.create({
        data: {
          id: userId,
          name: `${row.firstName} ${row.lastName}`.trim(),
          email: row.email,
          emailVerified: false,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone ?? null,
          phoneNumber: normalizeGhanaPhone(row.phone),
          role: Role.STUDENT,
          isActive: true,
          departmentId: department.id,
        },
      });
    } else {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: `${row.firstName} ${row.lastName}`.trim(),
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone ?? null,
          phoneNumber: normalizeGhanaPhone(row.phone),
          isActive: true,
          departmentId: department.id,
        },
      });
    }

    await tx.studentProfile.upsert({
      where: { userId },
      create: { userId, studentId: row.studentId, batch: row.batch, enrolledCourses: [] },
      update: { studentId: row.studentId, batch: row.batch },
    });

    const credential = await tx.account.findFirst({
      where: { userId, providerId: "credential" },
      select: { id: true },
    });
    if (suppliedPassword || !credential) {
      generatedPassword = suppliedPassword ?? generateTemporaryPassword();
      await ensureCredentialAccount(tx, userId, generatedPassword);
    }

    const now = new Date();
    const applicationNo = `IMP-${row.studentId}`;
    const existingApplication = await tx.application.findUnique({
      where: { applicationNo },
      select: { id: true, status: true },
    });
    const application = await tx.application.upsert({
      where: { applicationNo },
      create: {
        applicationNo,
        status: ApplicationStatus.APPROVED,
        applicantFirstName: row.firstName,
        applicantLastName: row.lastName,
        applicantEmail: row.email,
        applicantPhone: row.phone ?? null,
        applicantId: userId,
        departmentId: department.id,
        programmeId: programme.id,
        sessionId: activeSession.id,
        submittedAt: now,
        reviewedAt: now,
        decidedAt: now,
        notes: "Imported student roster",
      },
      update: {
        status: ApplicationStatus.APPROVED,
        applicantFirstName: row.firstName,
        applicantLastName: row.lastName,
        applicantEmail: row.email,
        applicantPhone: row.phone ?? null,
        applicantId: userId,
        departmentId: department.id,
        programmeId: programme.id,
        sessionId: activeSession.id,
        reviewedAt: now,
        decidedAt: now,
        createdAt: now,
      },
      select: { id: true },
    });
    if (!existingApplication || existingApplication.status !== ApplicationStatus.APPROVED) {
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: existingApplication?.status ?? null,
          toStatus: ApplicationStatus.APPROVED,
          changedById: options.actorId ?? null,
          note: "Approved through student roster import",
        },
      });
    }
  });

  await ensureStudentEnrollmentsForCurrentSemester({ studentId: userId });

  return {
    created,
    credential: generatedPassword
      ? { email: row.email, studentId: row.studentId, password: generatedPassword }
      : null,
  };
}
