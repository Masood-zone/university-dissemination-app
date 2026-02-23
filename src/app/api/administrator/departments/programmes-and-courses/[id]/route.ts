import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type {
  ApiResponse,
  ProgrammeDetailsResponse,
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

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;

    const programme = await prisma.programme.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        awardType: true,
        durationYears: true,
        totalSemesters: true,
        minCredits: true,
        departmentId: true,
        department: { select: { name: true } },
        _count: { select: { courses: true } },
        courses: {
          select: { code: true, title: true },
          orderBy: { code: "asc" },
          take: 25,
        },
      },
    });

    if (!programme) {
      return NextResponse.json(
        {
          success: false,
          message: "Programme not found",
          code: "PROGRAMME_NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    const payload: ProgrammeDetailsResponse = {
      programme: {
        id: programme.id,
        name: programme.name,
        code: programme.code,
        departmentId: programme.departmentId,
        departmentName: programme.department.name,
        awardType: programme.awardType,
        awardTypeLabel: getAwardTypeLabel(programme.awardType),
        durationYears: programme.durationYears ?? undefined,
        durationLabel: getDurationLabel(programme.durationYears),
        totalSemesters: programme.totalSemesters ?? undefined,
        minCredits: programme.minCredits ?? undefined,
      },
      coursesCount: programme._count.courses,
      prerequisiteOptions: programme.courses.map((c) => ({
        code: c.code,
        title: c.title,
      })),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<ProgrammeDetailsResponse>);
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
        message: "Failed to load programme",
        code: "PROGRAMME_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;

    const deleted = await prisma.programme.delete({
      where: { id },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: { id: deleted.id },
    } satisfies ApiResponse<{ id: string }>);
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
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            message: "Programme not found",
            code: "PROGRAMME_NOT_FOUND",
          } satisfies ApiResponse<never>,
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete programme",
        code: "PROGRAMME_DELETE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
