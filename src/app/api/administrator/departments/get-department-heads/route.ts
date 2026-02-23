import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type { ApiResponse, DepartmentHeadCandidate } from "@/types";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const heads = await prisma.user.findMany({
      where: { role: "DEPARTMENT_ADMIN", isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        departmentId: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: heads satisfies DepartmentHeadCandidate[],
    } satisfies ApiResponse<DepartmentHeadCandidate[]>);
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
        message: "Failed to load department heads",
        code: "DEPARTMENT_HEADS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
