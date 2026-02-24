import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type { ApiResponse, FinanceAnalytics } from "@/types";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const [successfulAgg, pendingAgg] = await Promise.all([
      prisma.paymentTransaction.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.paymentTransaction.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = successfulAgg._sum.amount ?? 0;
    const outstandingFees = pendingAgg._sum.amount ?? 0;

    const denom = totalRevenue + outstandingFees;
    const collectionRate =
      denom > 0 ? Math.round((totalRevenue / denom) * 1000) / 10 : null;

    const payload: FinanceAnalytics = {
      sessionId: activeSession?.id ?? null,
      sessionName: activeSession?.name ?? null,
      totalRevenue,
      outstandingFees,
      collectionRate,
      targetCollectionRate: 90,
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<FinanceAnalytics>);
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
        message: "Failed to load finance analytics",
        code: "FINANCE_ANALYTICS_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
