import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireDepartmentAdmin,
  resolveDepartmentForDepartmentAdmin,
} from "@/lib/server";
import type { ApiResponse, DepartmentAdminLecturerOption } from "@/types";

const MAX_CREDITS_PER_SEMESTER = 18;

export async function GET(request: Request) {
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

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    const lecturers = await prisma.user.findMany({
      where: {
        role: "LECTURER",
        departmentId: dept.departmentId,
        isActive: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const lecturerIds = lecturers.map((l) => l.id);

    const loadCreditsByLecturer = new Map<string, number>();
    if (activeSession && lecturerIds.length) {
      const assignments = await prisma.courseAssignment.findMany({
        where: {
          lecturerId: { in: lecturerIds },
          offering: { sessionId: activeSession.id },
        },
        select: {
          lecturerId: true,
          offering: { select: { course: { select: { credits: true } } } },
        },
      });

      for (const a of assignments) {
        const credits = a.offering.course.credits ?? 0;
        loadCreditsByLecturer.set(
          a.lecturerId,
          (loadCreditsByLecturer.get(a.lecturerId) ?? 0) + credits,
        );
      }
    }

    const data: DepartmentAdminLecturerOption[] = lecturers.map((l) => {
      const loadCredits = loadCreditsByLecturer.get(l.id) ?? 0;
      const loadPercent = Math.min(
        999,
        Math.round((loadCredits / MAX_CREDITS_PER_SEMESTER) * 100),
      );

      return {
        id: l.id,
        name: `${l.firstName} ${l.lastName}`.trim(),
        loadCredits,
        loadPercent,
        overload: loadCredits > MAX_CREDITS_PER_SEMESTER,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
      } satisfies ApiResponse<DepartmentAdminLecturerOption[]>,
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

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load lecturers",
        code: "LECTURERS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
