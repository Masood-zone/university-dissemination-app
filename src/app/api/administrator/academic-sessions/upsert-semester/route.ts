import { NextResponse } from "next/server";
import { Prisma, SemesterName } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type {
  AcademicSessionSemester,
  ApiResponse,
  UpsertSessionSemesterInput,
} from "@/types";

const upsertSemesterSchema = z.object({
  sessionId: z.string().min(1),
  name: z.nativeEnum(SemesterName),
  enabled: z.boolean(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);

    const json = (await request.json()) as unknown;
    const input =
      upsertSemesterSchema.parse(json) satisfies UpsertSessionSemesterInput;

    if (!input.enabled) {
      await prisma.semester.deleteMany({
        where: { sessionId: input.sessionId, name: input.name },
      });

      return NextResponse.json({
        success: true,
        data: null,
      } satisfies ApiResponse<null>);
    }

    const upserted = await prisma.semester.upsert({
      where: {
        sessionId_name: { sessionId: input.sessionId, name: input.name },
      },
      update: {
        startDate: input.startDate ?? undefined,
        endDate: input.endDate ?? undefined,
      },
      create: {
        sessionId: input.sessionId,
        name: input.name,
        startDate: input.startDate ?? undefined,
        endDate: input.endDate ?? undefined,
      },
    });

    const payload: AcademicSessionSemester = {
      id: upserted.id,
      name: upserted.name,
      startDate: toIso(upserted.startDate),
      endDate: toIso(upserted.endDate),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<AcademicSessionSemester>);
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
      if (error.code === "P2003") {
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
        message: "Failed to update semester",
        code: "SEMESTER_UPDATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
