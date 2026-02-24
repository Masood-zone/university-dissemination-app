import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import { notifyDepartmentAdminAssigned } from "@/lib/department-notifications";
import type {
  ApiResponse,
  DepartmentSummary,
  UpdateDepartmentHodInput,
} from "@/types";

const updateHodSchema = z.object({
  departmentId: z.string().min(1),
  headUserId: z.string().min(1).nullable(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);

    const json = (await request.json()) as unknown;
    const input = updateHodSchema.parse(
      json,
    ) satisfies UpdateDepartmentHodInput;

    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
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

    let headName: string | null = null;
    let contact: string | null = null;

    if (input.headUserId) {
      const head = await prisma.user.findFirst({
        where: {
          id: input.headUserId,
          role: "DEPARTMENT_ADMIN",
          isActive: true,
        },
        select: { firstName: true, lastName: true, email: true, phone: true },
      });
      if (!head) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected head is invalid",
            code: "INVALID_HEAD_SELECTION",
          } satisfies ApiResponse<never>,
          { status: 400 },
        );
      }

      headName = `${head.firstName} ${head.lastName}`.trim();
      contact = (head.phone && head.phone.trim()) || head.email;
    }

    const updated = await prisma.department.update({
      where: { id: input.departmentId },
      data: { headOfDept: headName, contact },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        headOfDept: true,
        contact: true,
        _count: { select: { programmes: true } },
      },
    });

    const studentsCount = await prisma.user.count({
      where: { role: "STUDENT", departmentId: updated.id },
    });

    const payload: DepartmentSummary = {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      description: updated.description,
      headOfDept: updated.headOfDept,
      contact: updated.contact,
      programmesCount: updated._count.programmes,
      studentsCount,
    };

    if (input.headUserId) {
      prisma.user
        .update({
          where: { id: input.headUserId },
          data: { departmentId: updated.id },
        })
        .catch(() => undefined);

      notifyDepartmentAdminAssigned({
        userId: input.headUserId,
        departmentId: updated.id,
        departmentName: updated.name,
        kind: "HOD_ASSIGNED",
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<DepartmentSummary>);
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request",
          code: "INVALID_INPUT",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update department head",
        code: "DEPARTMENT_HOD_UPDATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
