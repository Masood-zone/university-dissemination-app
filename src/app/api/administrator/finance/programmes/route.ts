import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type { ApiResponse, FinanceProgrammeListItem } from "@/types";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const programmes = await prisma.programme.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        department: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const payload: FinanceProgrammeListItem[] = programmes.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      departmentName: p.department.name,
    }));

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<FinanceProgrammeListItem[]>);
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
        message: "Failed to load programmes",
        code: "FINANCE_PROGRAMMES_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
