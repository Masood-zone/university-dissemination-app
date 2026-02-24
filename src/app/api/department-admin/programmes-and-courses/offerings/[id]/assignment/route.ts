import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  requireDepartmentAdmin,
  resolveDepartmentForDepartmentAdmin,
} from "@/lib/server";
import type { ApiResponse } from "@/types";

const assignSchema = z.object({
  lecturerId: z.string().min(1).nullable(),
});

export async function PUT(
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

    const { id: offeringId } = await params;

    const offering = await prisma.courseOffering.findFirst({
      where: { id: offeringId, departmentId: dept.departmentId },
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

    const json = (await request.json()) as unknown;
    const input = assignSchema.parse(json);

    if (input.lecturerId) {
      const lecturer = await prisma.user.findFirst({
        where: {
          id: input.lecturerId,
          role: "LECTURER",
          departmentId: dept.departmentId,
          isActive: true,
        },
        select: { id: true },
      });

      if (!lecturer) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected lecturer is invalid",
            code: "INVALID_LECTURER",
          } satisfies ApiResponse<never>,
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.courseAssignment.deleteMany({ where: { offeringId } });

      if (input.lecturerId) {
        await tx.courseAssignment.create({
          data: {
            offeringId,
            lecturerId: input.lecturerId,
          },
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: { offeringId, lecturerId: input.lecturerId },
      } satisfies ApiResponse<{
        offeringId: string;
        lecturerId: string | null;
      }>,
      { status: 200 },
    );
  } catch (error) {
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
        message: "Failed to update assignment",
        code: "ASSIGNMENT_UPDATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
