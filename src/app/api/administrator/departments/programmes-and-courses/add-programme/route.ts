import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import { programmeSchema } from "@/lib/validation";
import type {
  ApiResponse,
  CreateProgrammeInput,
  ProgrammeListItem,
} from "@/types";

function getAwardTypeLabel(type: ProgrammeListItem["awardType"]): string {
  switch (type) {
    case "UNDERGRADUATE":
      return "Degree";
    case "POSTGRADUATE":
      return "Masters";
    case "DIPLOMA":
      return "Diploma";
    default:
      return "Programme";
  }
}

function getDurationLabel(durationYears: number | null): string {
  if (!durationYears) return "—";
  return `${durationYears} Years`;
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const json = (await request.json()) as unknown;
    const input = programmeSchema.parse(json) satisfies CreateProgrammeInput;

    const created = await prisma.programme.create({
      data: {
        name: input.name,
        code: input.code,
        awardType: input.awardType,
        departmentId: input.departmentId,
        durationYears: input.durationYears ?? null,
        totalSemesters: input.totalSemesters ?? null,
        minCredits: input.minCredits ?? null,
      },
      select: {
        id: true,
        name: true,
        code: true,
        awardType: true,
        durationYears: true,
        department: { select: { name: true } },
        _count: { select: { courses: true } },
      },
    });

    const payload: ProgrammeListItem = {
      id: created.id,
      name: created.name,
      code: created.code,
      departmentName: created.department.name,
      awardType: created.awardType,
      awardTypeLabel: getAwardTypeLabel(created.awardType),
      durationLabel: getDurationLabel(created.durationYears),
      activeCourses: created._count.courses,
    };

    return NextResponse.json(
      { success: true, data: payload } satisfies ApiResponse<ProgrammeListItem>,
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
            message:
              "A programme with this code already exists in the selected department",
            code: "PROGRAMME_ALREADY_EXISTS",
          } satisfies ApiResponse<never>,
          { status: 409 },
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            message: "Selected department does not exist",
            code: "DEPARTMENT_NOT_FOUND",
          } satisfies ApiResponse<never>,
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create programme",
        code: "PROGRAMME_CREATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
