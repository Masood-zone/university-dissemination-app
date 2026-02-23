import { NextResponse } from "next/server";
import { ProgrammeAwardType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type { ApiResponse, ProgrammeListItem } from "@/types";

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

function getDurationLabel(durationYears: number | null): string {
  if (!durationYears) return "—";
  return `${durationYears} Years`;
}

function isProgrammeAwardType(value: string): value is ProgrammeAwardType {
  return (
    value === "UNDERGRADUATE" || value === "POSTGRADUATE" || value === "DIPLOMA"
  );
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const awardTypeParam = searchParams.get("awardType");

    const awardType =
      awardTypeParam && isProgrammeAwardType(awardTypeParam)
        ? awardTypeParam
        : undefined;

    const programmes = await prisma.programme.findMany({
      where: {
        ...(awardType ? { awardType } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
                { department: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
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
      orderBy: { name: "asc" },
    });

    const payload: ProgrammeListItem[] = programmes.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      departmentName: p.department.name,
      awardType: p.awardType,
      awardTypeLabel: getAwardTypeLabel(p.awardType),
      durationLabel: getDurationLabel(p.durationYears),
      activeCourses: p._count.courses,
    }));

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<ProgrammeListItem[]>);
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
        message: "Failed to load programmes",
        code: "PROGRAMMES_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
