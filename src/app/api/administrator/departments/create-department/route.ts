import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import { departmentSchema } from "@/lib/validation";
import type {
  ApiResponse,
  CreateDepartmentInput,
  DepartmentSummary,
} from "@/types";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const json = (await request.json()) as unknown;
    const input = departmentSchema.parse(json) satisfies CreateDepartmentInput;

    const created = await prisma.department.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        headOfDept: input.headOfDept,
        contact: input.contact,
      },
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

    const payload: DepartmentSummary = {
      id: created.id,
      name: created.name,
      code: created.code,
      description: created.description,
      headOfDept: created.headOfDept,
      contact: created.contact,
      programmesCount: created._count.programmes,
      studentsCount: 0,
    };

    return NextResponse.json(
      { success: true, data: payload } satisfies ApiResponse<DepartmentSummary>,
      { status: 201 },
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            message: "Department name or code already exists",
            code: "DEPARTMENT_ALREADY_EXISTS",
          } satisfies ApiResponse<never>,
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create department",
        code: "DEPARTMENT_CREATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
