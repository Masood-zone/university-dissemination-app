import { NextResponse } from "next/server";
import {
  PaymentStatus,
  PaymentTransactionStatus,
  SemesterName,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/server";
import type {
  ApiResponse,
  StudentFinancePayInput,
  StudentFinancePayResult,
  StudentFinanceSummary,
} from "@/types";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function semesterToInt(value: SemesterName): 1 | 2 {
  return value === "SECOND" ? 2 : 1;
}

function isPaymentMethod(value: unknown): value is "M_MONEY" | "CARD_BANK" {
  return value === "M_MONEY" || value === "CARD_BANK";
}

export async function GET(request: Request) {
  try {
    const session = await requireStudent(request);
    const userId = session.user.id;

    const latestApplication = await prisma.application.findFirst({
      where: { applicantId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        programmeId: true,
        sessionId: true,
        programme: { select: { id: true, name: true, code: true } },
      },
    });

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, currentSemester: true },
    });

    const targetSession = latestApplication?.sessionId
      ? await prisma.academicSession.findUnique({
          where: { id: latestApplication.sessionId },
          select: { id: true, name: true, currentSemester: true },
        })
      : activeSession;

    const semester = targetSession?.currentSemester ?? SemesterName.FIRST;

    // Keep fee statuses fresh.
    await prisma.fee.updateMany({
      where: {
        studentId: userId,
        status: PaymentStatus.PENDING,
        dueDate: { lt: new Date() },
      },
      data: { status: PaymentStatus.OVERDUE },
    });

    const programmeId = latestApplication?.programmeId ?? null;
    const programme = latestApplication?.programme ?? null;

    if (!programmeId || !targetSession) {
      const payload: StudentFinanceSummary = {
        sessionId: targetSession?.id ?? null,
        sessionName: targetSession?.name ?? null,
        semester: targetSession?.currentSemester ?? null,
        applicationStatus: latestApplication?.status ?? null,
        programme,
        configured: false,
        feeId: null,
        feeStatus: null,
        totals: {
          totalFee: 0,
          totalPaid: 0,
          outstanding: 0,
          currency: "GHS",
          dueAt: null,
        },
        breakdown: [],
        transactions: [],
      };

      return NextResponse.json({
        success: true,
        data: payload,
      } satisfies ApiResponse<StudentFinanceSummary>);
    }

    const programmeFee = await prisma.programmeFee.findUnique({
      where: {
        programmeId_sessionId_semester: {
          programmeId,
          sessionId: targetSession.id,
          semester,
        },
      },
      select: {
        id: true,
        semester: true,
        tuitionFee: true,
        libraryFee: true,
        facilityFee: true,
        totalFee: true,
        currency: true,
      },
    });

    if (!programmeFee) {
      const payload: StudentFinanceSummary = {
        sessionId: targetSession.id,
        sessionName: targetSession.name,
        semester,
        applicationStatus: latestApplication?.status ?? null,
        programme,
        configured: false,
        feeId: null,
        feeStatus: null,
        totals: {
          totalFee: 0,
          totalPaid: 0,
          outstanding: 0,
          currency: "GHS",
          dueAt: null,
        },
        breakdown: [],
        transactions: [],
      };

      return NextResponse.json({
        success: true,
        data: payload,
      } satisfies ApiResponse<StudentFinanceSummary>);
    }

    const semesterRow = await prisma.semester.findUnique({
      where: {
        sessionId_name: {
          sessionId: targetSession.id,
          name: programmeFee.semester,
        },
      },
      select: { startDate: true },
    });

    const dueDate = addDays(semesterRow?.startDate ?? new Date(), 14);

    await prisma.fee.createMany({
      data: [
        {
          studentId: userId,
          programmeFeeId: programmeFee.id,
          feeType: "PROGRAMME_FEE",
          amount: programmeFee.totalFee,
          dueDate,
          status: PaymentStatus.PENDING,
          semester: semesterToInt(programmeFee.semester),
          academicYear: targetSession.name,
        },
      ],
      skipDuplicates: true,
    });

    const fee = await prisma.fee.findUnique({
      where: {
        studentId_programmeFeeId: {
          studentId: userId,
          programmeFeeId: programmeFee.id,
        },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        dueDate: true,
      },
    });

    const transactions = fee
      ? await prisma.paymentTransaction.findMany({
          where: { studentId: userId, feeId: fee.id },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            reference: true,
            amount: true,
            currency: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
          },
        })
      : [];

    const outstanding =
      fee?.status === PaymentStatus.PENDING ||
      fee?.status === PaymentStatus.OVERDUE
        ? fee.amount
        : 0;

    const totalPaid = fee?.status === PaymentStatus.PAID ? fee.amount : 0;

    const payload: StudentFinanceSummary = {
      sessionId: targetSession.id,
      sessionName: targetSession.name,
      semester,
      applicationStatus: latestApplication?.status ?? null,
      programme,
      configured: true,
      feeId: fee?.id ?? null,
      feeStatus: fee?.status ?? null,
      totals: {
        totalFee: fee?.amount ?? programmeFee.totalFee,
        totalPaid,
        outstanding,
        currency: programmeFee.currency ?? "GHS",
        dueAt: fee?.dueDate ? fee.dueDate.toISOString() : null,
      },
      breakdown: [
        {
          key: "tuition",
          description: "Tuition Fees",
          kind: "Academic",
          amount: programmeFee.tuitionFee,
          status: fee?.status ?? PaymentStatus.PENDING,
          note: `${targetSession.name} - ${semester === "FIRST" ? "Sem 1" : "Sem 2"}`,
        },
        {
          key: "library",
          description: "Library Fees",
          kind: "Utility",
          amount: programmeFee.libraryFee,
          status: fee?.status ?? PaymentStatus.PENDING,
          note: "Compulsory fee",
        },
        {
          key: "facility",
          description: "Facility Fees",
          kind: "Facility",
          amount: programmeFee.facilityFee,
          status: fee?.status ?? PaymentStatus.PENDING,
          note: "Compulsory fee",
        },
      ],
      transactions: transactions.map((t) => ({
        id: t.id,
        reference: t.reference,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        paymentMethod: t.paymentMethod,
        createdAt: t.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<StudentFinanceSummary>);
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
        message: "Failed to load student finance",
        code: "STUDENT_FINANCE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireStudent(request);
    const userId = session.user.id;

    const body = (await request
      .json()
      .catch(() => null)) as StudentFinancePayInput | null;

    const feeId = body?.feeId?.trim() ?? "";
    const paymentMethod = body?.paymentMethod ?? null;

    if (!feeId || !isPaymentMethod(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: "feeId and valid paymentMethod are required",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      select: {
        id: true,
        studentId: true,
        amount: true,
        status: true,
      },
    });

    if (!fee || fee.studentId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Fee not found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    if (fee.status === PaymentStatus.PAID) {
      return NextResponse.json(
        {
          success: false,
          message: "Fee is already paid",
          code: "ALREADY_PAID",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (fee.status === PaymentStatus.CANCELLED) {
      return NextResponse.json(
        {
          success: false,
          message: "Fee is cancelled",
          code: "FEE_CANCELLED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const reference = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    await prisma.$transaction([
      prisma.paymentTransaction.create({
        data: {
          reference,
          feeId: fee.id,
          studentId: userId,
          amount: fee.amount,
          currency: "GHS",
          paymentMethod,
          provider: "SIMULATED",
          status: PaymentTransactionStatus.SUCCESS,
          paidAt: now,
        },
        select: { id: true },
      }),
      prisma.fee.update({
        where: { id: fee.id },
        data: { status: PaymentStatus.PAID, paidDate: now },
        select: { id: true },
      }),
    ]);

    const payload: StudentFinancePayResult = { ok: true };

    return NextResponse.json({
      success: true,
      data: payload,
      message: "Payment recorded",
    } satisfies ApiResponse<StudentFinancePayResult>);
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
        message: "Failed to process payment",
        code: "STUDENT_FINANCE_PAY_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
