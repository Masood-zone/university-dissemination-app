import { NextResponse } from "next/server";
import { ApplicationStatus, Role } from "@prisma/client";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";

import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email-service";
import { smsService } from "@/lib/sms-service";
import { notificationService } from "@/lib/notification-service";
import type {
  ApiResponse,
  EnrollmentSubmitInput,
  EnrollmentSubmitResult,
} from "@/types";

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
  // Matches Better Auth v1.4.x: saltHex:keyHex (scrypt)
  // config: N=16384, r=16, p=1, dkLen=64
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

function generateTemporaryPassword(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `Student@${digits}`;
}

async function ensureCredentialAccount(userId: string, plainPassword: string) {
  const hashedPassword = await hashBetterAuthPassword(plainPassword);

  const existingCredentialAccount = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  });

  if (existingCredentialAccount) {
    await prisma.account.update({
      where: { id: existingCredentialAccount.id },
      data: {
        accountId: userId,
        password: hashedPassword,
      },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: randomUUID(),
      userId,
      providerId: "credential",
      accountId: userId,
      password: hashedPassword,
    },
  });
}

async function ensureUniqueApplicationNo(base: string): Promise<string> {
  const trimmed = base.trim();
  if (!trimmed) return `ADM-${new Date().getFullYear()}-${Date.now()}`;

  const exists = await prisma.application.findUnique({
    where: { applicationNo: trimmed },
    select: { id: true },
  });
  if (!exists) return trimmed;

  for (let i = 0; i < 3; i += 1) {
    const candidate = `${trimmed}-${Math.floor(10 + Math.random() * 90)}`;
    const taken = await prisma.application.findUnique({
      where: { applicationNo: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  return `${trimmed}-${Date.now()}`;
}

function validatePayload(input: EnrollmentSubmitInput): {
  ok: boolean;
  errors?: Record<string, string[]>;
} {
  const errors: Record<string, string[]> = {};

  if (!input.personal?.firstName?.trim()) errors.firstName = ["Required"];
  if (!input.personal?.lastName?.trim()) errors.lastName = ["Required"];
  if (!input.personal?.email?.trim()) errors.email = ["Required"];
  if (!input.personal?.phone?.trim()) errors.phone = ["Required"];
  if (!input.academic?.departmentId?.trim()) errors.departmentId = ["Required"];
  if (!input.academic?.programmeId?.trim()) errors.programmeId = ["Required"];
  if (!input.acceptedDeclaration) errors.acceptedDeclaration = ["Required"];

  return { ok: Object.keys(errors).length === 0, errors };
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as EnrollmentSubmitInput;

    const validated = validatePayload(input);
    if (!validated.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          errors: validated.errors,
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const department = await prisma.department.findUnique({
      where: { id: input.academic.departmentId },
      select: { id: true },
    });
    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message: "Department not found",
          code: "DEPARTMENT_NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    const programme = await prisma.programme.findUnique({
      where: { id: input.academic.programmeId },
      select: { id: true, departmentId: true },
    });
    if (!programme) {
      return NextResponse.json(
        {
          success: false,
          message: "Programme not found",
          code: "PROGRAMME_NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    if (programme.departmentId !== department.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Programme does not belong to selected department",
          code: "PROGRAMME_DEPARTMENT_MISMATCH",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const selectedSessionId = input.academic.sessionId?.trim() || null;
    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const session = selectedSessionId
      ? await prisma.academicSession.findUnique({
          where: { id: selectedSessionId },
          select: { id: true, name: true },
        })
      : activeSession;

    const applicationNo = await ensureUniqueApplicationNo(input.draftId);

    const email = input.personal.email.trim().toLowerCase();
    const firstName = input.personal.firstName.trim();
    const lastName = input.personal.lastName.trim();
    const name = `${firstName} ${lastName}`.trim();

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    let userId: string;
    let temporaryPassword: string | undefined;
    let accountCreated = false;

    if (!existing) {
      userId = randomUUID();
      temporaryPassword = generateTemporaryPassword();
      accountCreated = true;

      await prisma.user.create({
        data: {
          id: userId,
          name,
          email,
          emailVerified: false,
          firstName,
          lastName,
          phone: input.personal.phone.trim(),
          role: Role.STUDENT,
          isActive: true,
          departmentId: department.id,
        },
      });

      await ensureCredentialAccount(userId, temporaryPassword);

      const studentId = `STU-${new Date().getFullYear()}-${Math.floor(
        100000 + Math.random() * 900000,
      )}`;

      await prisma.studentProfile.create({
        data: {
          userId,
          studentId,
          batch: String(new Date().getFullYear()),
          enrolledCourses: [],
        },
      });
    } else {
      userId = existing.id;

      await prisma.user.update({
        where: { id: userId },
        data: {
          role: existing.role === Role.STUDENT ? existing.role : Role.STUDENT,
          departmentId: department.id,
        },
      });
    }

    await prisma.application.create({
      data: {
        applicationNo,
        status: ApplicationStatus.SUBMITTED,
        applicantFirstName: firstName,
        applicantLastName: lastName,
        applicantEmail: email,
        applicantPhone: input.personal.phone.trim(),
        applicantId: userId,
        departmentId: department.id,
        programmeId: programme.id,
        sessionId: session?.id ?? null,
        submittedAt: new Date(),
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: ApplicationStatus.SUBMITTED,
            changedById: null,
            note: "Submitted via enrollment portal",
          },
        },
      },
      select: { id: true },
    });

    // Notifications (store in DB + attempt external delivery)
    const phone = input.personal.phone.trim();
    const smsTo = smsService.formatPhoneNumber(phone);

    const baseMetadata = {
      channels: {
        email: {
          to: email,
          subject: `Enrollment Submitted - ${process.env.APP_NAME || "SIDS"}`,
          status: "PENDING",
        },
        sms: {
          to: smsTo,
          status: "PENDING",
        },
      },
    } as const;

    const dbNotification = await notificationService.create({
      userId,
      type: "ACADEMIC",
      title: "Enrollment submitted",
      message: `Your enrollment has been submitted. Application No: ${applicationNo}.`,
      metadata: baseMetadata,
    });

    let emailStatus: "SENT" | "FAILED" = "SENT";
    let smsStatus: "SENT" | "FAILED" = "SENT";

    try {
      await emailService.sendStudentEnrollmentSubmittedEmail({
        to: email,
        studentName: name,
        applicationNo,
        temporaryPassword,
      });
    } catch (error) {
      emailStatus = "FAILED";
      console.error("Failed to send enrollment email:", error);
    }

    try {
      await smsService.sendEnrollmentSubmittedSMS({
        to: smsTo,
        applicationNo,
      });
    } catch (error) {
      smsStatus = "FAILED";
      console.error("Failed to send enrollment SMS:", error);
    }

    await notificationService.setMetadata(dbNotification.id, {
      ...baseMetadata,
      channels: {
        email: { ...baseMetadata.channels.email, status: emailStatus },
        sms: { ...baseMetadata.channels.sms, status: smsStatus },
      },
    });

    const payload: EnrollmentSubmitResult = {
      applicationNo,
      status: ApplicationStatus.SUBMITTED,
      accountCreated,
      ...(temporaryPassword ? { temporaryPassword } : {}),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<EnrollmentSubmitResult>);
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit enrollment",
        code: "ENROLLMENT_SUBMIT_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
