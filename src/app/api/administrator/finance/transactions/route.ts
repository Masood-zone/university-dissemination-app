import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type {
  ApiResponse,
  FinanceTransactionsResult,
  PaymentTransactionStatusFilter,
} from "@/types";

function parseRangeDays(value: string | null): number {
  switch (value) {
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "7d":
    default:
      return 7;
  }
}

function isStatusFilter(
  value: string | null,
): value is PaymentTransactionStatusFilter {
  return (
    value === "ALL" ||
    value === "PENDING" ||
    value === "SUCCESS" ||
    value === "FAILED" ||
    value === "REVERSED" ||
    value === "REFUNDED" ||
    value === "CANCELLED"
  );
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const range = parseRangeDays(searchParams.get("range"));
    const statusParam = searchParams.get("status");
    const status: PaymentTransactionStatusFilter =
      statusParam && isStatusFilter(statusParam) ? statusParam : "ALL";

    const from = new Date();
    from.setDate(from.getDate() - range);

    const txns = await prisma.paymentTransaction.findMany({
      where: {
        createdAt: { gte: from },
        ...(status !== "ALL" ? { status } : {}),
        ...(q
          ? {
              OR: [
                { reference: { contains: q, mode: "insensitive" } },
                { providerRef: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        reference: true,
        studentId: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const studentIds = Array.from(new Set(txns.map((t) => t.studentId)));
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
      },
    });

    const studentById = new Map(
      students.map((s) => [
        s.id,
        {
          name:
            (s.name || `${s.firstName} ${s.lastName}`.trim()).trim() || s.email,
          email: s.email,
        },
      ]),
    );

    const rows = txns.map((t) => {
      const student = studentById.get(t.studentId);
      return {
        id: t.id,
        reference: t.reference,
        studentId: t.studentId,
        studentName: student?.name ?? "Unknown",
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      };
    });

    const payload: FinanceTransactionsResult = {
      rangeDays: range,
      rows,
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<FinanceTransactionsResult>);
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
        message: "Failed to load transactions",
        code: "FINANCE_TRANSACTIONS_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
