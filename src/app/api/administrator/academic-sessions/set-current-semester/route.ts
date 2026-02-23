import { NextResponse } from "next/server";
import { Prisma, SemesterName } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type {
  AcademicSessionSummary,
  ApiResponse,
  SetCurrentSemesterInput,
} from "@/types";

const setCurrentSemesterSchema = z.object({
  sessionId: z.string().min(1),
  semesterName: z.nativeEnum(SemesterName),
});

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);

    const json = (await request.json()) as unknown;
    const input =
      setCurrentSemesterSchema.parse(json) satisfies SetCurrentSemesterInput;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.academicSession.updateMany({
        where: { isActive: true, id: { not: input.sessionId } },
        data: { isActive: false },
      });

      // Ensure the selected semester exists for this session.
      await tx.semester.upsert({
        where: {
          sessionId_name: { sessionId: input.sessionId, name: input.semesterName },
        },
        update: {},
        create: { sessionId: input.sessionId, name: input.semesterName },
      });

      return tx.academicSession.update({
        where: { id: input.sessionId },
        data: { isActive: true, currentSemester: input.semesterName },
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

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<AcademicSessionSummary>);
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
        message: "Failed to set current semester",
        code: "CURRENT_SEMESTER_SET_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
