import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type { AcademicSessionsOverviewResponse, ApiResponse } from "@/types";

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const sessions = await prisma.academicSession.findMany({
      include: {
        semesters: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ isActive: "desc" }, { startDate: "desc" }, { name: "desc" }],
    });

    const mapped = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: toIso(s.startDate),
      endDate: toIso(s.endDate),
      isActive: s.isActive,
      currentSemester: s.currentSemester,
      semesters: s.semesters.map((sem) => ({
        id: sem.id,
        name: sem.name,
        startDate: toIso(sem.startDate),
        endDate: toIso(sem.endDate),
      })),
    }));

    const activeSession = mapped.find((s) => s.isActive) ?? null;

    const now = new Date();
    const activeSemesterName =
      activeSession?.currentSemester ??
      activeSession?.semesters
        ?.filter((s) => {
          if (!s.startDate || !s.endDate) return false;
          const start = new Date(s.startDate);
          const end = new Date(s.endDate);
          return start <= now && now <= end;
        })
        .sort(
          (a, b) =>
            (new Date(b.startDate ?? 0).getTime() || 0) -
            (new Date(a.startDate ?? 0).getTime() || 0),
        )[0]?.name ??
      activeSession?.semesters
        ?.slice()
        .sort(
          (a, b) =>
            (new Date(b.startDate ?? 0).getTime() || 0) -
            (new Date(a.startDate ?? 0).getTime() || 0),
        )[0]?.name ??
      null;

    const payload: AcademicSessionsOverviewResponse = {
      sessions: mapped,
      activeSession,
      activeSemesterName,
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<AcademicSessionsOverviewResponse>);
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
        message: "Failed to load academic sessions",
        code: "ACADEMIC_SESSIONS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
