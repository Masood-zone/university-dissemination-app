import { NextResponse } from "next/server";
import { ProgrammeAwardType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ApiResponse, EnrollmentProgramme } from "@/types";

function getAwardTypeLabel(type: ProgrammeAwardType): string {
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

function getDurationLabel(
  durationYears: number | null,
  totalSemesters: number | null,
): string {
  if (!durationYears && !totalSemesters) return "—";
  if (durationYears && totalSemesters) {
    return `${durationYears} Academic Years (${totalSemesters} Semesters)`;
  }
  if (durationYears) return `${durationYears} Academic Years`;
  return `${totalSemesters} Semesters`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId")?.trim() ?? "";

    if (!departmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "departmentId is required",
          code: "VALIDATION_ERROR",
          errors: { departmentId: ["Required"] },
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const programmes = await prisma.programme.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        departmentId: true,
        awardType: true,
        durationYears: true,
        totalSemesters: true,
      },
      orderBy: { name: "asc" },
    });

    const payload: EnrollmentProgramme[] = programmes.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      departmentId: p.departmentId,
      awardType: p.awardType,
      awardTypeLabel: getAwardTypeLabel(p.awardType),
      durationYears: p.durationYears,
      totalSemesters: p.totalSemesters,
      durationLabel: getDurationLabel(p.durationYears, p.totalSemesters),
    }));

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<EnrollmentProgramme[]>);
  } catch {
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
