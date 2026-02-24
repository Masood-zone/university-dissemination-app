import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireDepartmentAdmin,
  resolveDepartmentForDepartmentAdmin,
} from "@/lib/server";
import type { ApiResponse, DepartmentAdminProgrammeOption } from "@/types";

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

    const dept = await resolveDepartmentForDepartmentAdmin(userId);
    if (!dept) {
      return NextResponse.json(
        {
          success: false,
          message: "Department admin has no department assigned",
          code: "DEPARTMENT_REQUIRED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const programmes = await prisma.programme.findMany({
      where: { departmentId: dept.departmentId, isActive: true },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        awardType: true,
      },
    });

    const data: DepartmentAdminProgrammeOption[] = programmes.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      awardType: String(p.awardType),
    }));

    return NextResponse.json(
      {
        success: true,
        data,
      } satisfies ApiResponse<DepartmentAdminProgrammeOption[]>,
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
        message: "Failed to load programmes",
        code: "PROGRAMMES_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
