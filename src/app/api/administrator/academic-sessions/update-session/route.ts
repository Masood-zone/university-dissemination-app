import { NextResponse } from "next/server";
import { Prisma, SemesterName } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type { AcademicSessionSummary, ApiResponse } from "@/types";

const updateAcademicSessionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(4).max(20).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  currentSemester: z.nativeEnum(SemesterName).optional().nullable(),
});

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);

    const json = (await request.json()) as unknown;
    const input = updateAcademicSessionSchema.parse(json);

    const updated = await prisma.$transaction(async (tx) => {
      if (input.isActive) {
        await tx.academicSession.updateMany({
          where: { isActive: true, id: { not: input.id } },
          data: { isActive: false },
        });
      }

      return tx.academicSession.update({
        where: { id: input.id },
        data: {
          name: input.name,
          startDate: input.startDate ?? undefined,
          endDate: input.endDate ?? undefined,
          isActive: input.isActive,
          currentSemester: input.currentSemester,
        },
        include: { semesters: { orderBy: { name: "asc" } } },
      });
    });

    const payload: AcademicSessionSummary = {
      id: updated.id,
      name: updated.name,
      startDate: toIso(updated.startDate),
      endDate: toIso(updated.endDate),
      isActive: updated.isActive,
      currentSemester: updated.currentSemester,
      semesters: updated.semesters.map((sem) => ({
        id: sem.id,
        name: sem.name,
        startDate: toIso(sem.startDate),
        endDate: toIso(sem.endDate),
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<AcademicSessionSummary>,
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
          errors: error.flatten().fieldErrors,
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            message: "Academic session name already exists",
            code: "ACADEMIC_SESSION_ALREADY_EXISTS",
          } satisfies ApiResponse<never>,
          { status: 409 },
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            message: "Academic session not found",
            code: "ACADEMIC_SESSION_NOT_FOUND",
          } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update academic session",
        code: "ACADEMIC_SESSION_UPDATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
