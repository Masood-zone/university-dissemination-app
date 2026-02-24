import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireDepartmentAdmin,
  resolveDepartmentForDepartmentAdmin,
} from "@/lib/server";
import type { ApiResponse } from "@/types";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const offering = await prisma.courseOffering.findFirst({
      where: { id, departmentId: dept.departmentId },
      select: { id: true },
    });

    if (!offering) {
      return NextResponse.json(
        {
          success: false,
          message: "Course offering not found",
          code: "OFFERING_NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    await prisma.courseOffering.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(
      {
        success: true,
        data: { id },
      } satisfies ApiResponse<{ id: string }>,
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
        message: "Failed to remove offering",
        code: "OFFERING_REMOVE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
