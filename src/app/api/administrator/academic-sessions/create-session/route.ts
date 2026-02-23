import { NextResponse } from "next/server";
import { Prisma, SemesterName } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import { academicSessionSchema } from "@/lib/validation";
import type { AcademicSessionSummary, ApiResponse } from "@/types";

const semesterInputSchema = z.object({
  name: z.nativeEnum(SemesterName),
  enabled: z.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const createAcademicSessionSchema = academicSessionSchema.extend({
  currentSemester: z.nativeEnum(SemesterName).optional(),
  semesters: z.array(semesterInputSchema).optional(),
});

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toSummary(session: {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  currentSemester: SemesterName | null;
  semesters: Array<{
    id: string;
    name: SemesterName;
    startDate: Date | null;
    endDate: Date | null;
  }>;
}): AcademicSessionSummary {
  return {
    id: session.id,
    name: session.name,
    startDate: toIso(session.startDate),
    endDate: toIso(session.endDate),
    isActive: session.isActive,
    currentSemester: session.currentSemester,
    semesters: session.semesters.map((sem) => ({
      id: sem.id,
      name: sem.name,
      startDate: toIso(sem.startDate),
      endDate: toIso(sem.endDate),
    })),
  };
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const json = (await request.json()) as unknown;
    const input = createAcademicSessionSchema.parse(json);

    const semesters = (input.semesters ?? []).filter(
      (s) => s.enabled !== false,
    );

    const created = await prisma.$transaction(async (tx) => {
      if (input.isActive) {
        await tx.academicSession.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return tx.academicSession.create({
        data: {
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: input.isActive ?? false,
          currentSemester:
            input.currentSemester ?? (input.isActive ? "FIRST" : null),
          semesters: semesters.length
            ? {
                create: semesters.map((s) => ({
                  name: s.name,
                  startDate: s.startDate,
                  endDate: s.endDate,
                })),
              }
            : undefined,
        },
        include: {
          semesters: { orderBy: { name: "asc" } },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: toSummary(created),
      } satisfies ApiResponse<AcademicSessionSummary>,
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
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create academic session",
        code: "ACADEMIC_SESSION_CREATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
