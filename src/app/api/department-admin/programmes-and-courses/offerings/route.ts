import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireDepartmentAdmin,
  resolveDepartmentForDepartmentAdmin,
} from "@/lib/server";
import type {
  ApiResponse,
  DepartmentAdminCourseOfferingListResult,
} from "@/types";

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

    const url = new URL(request.url);
    const view = (url.searchParams.get("view") || "CURRENT").toUpperCase();

    const activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, isActive: true },
    });

    const sessionWhere =
      view === "ARCHIVES"
        ? { session: { isActive: false } }
        : activeSession
          ? { sessionId: activeSession.id }
          : { session: { isActive: true } };

    const offerings = await prisma.courseOffering.findMany({
      where: {
        departmentId: dept.departmentId,
        isActive: true,
        ...sessionWhere,
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        createdAt: true,
        session: { select: { id: true, name: true, isActive: true } },
        semester: { select: { name: true } },
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            credits: true,
            level: true,
            semester: true,
            programme: { select: { id: true, name: true } },
          },
        },
        assignments: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            lecturerId: true,
            lecturer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    const lecturerCredits = new Map<string, number>();
    for (const o of offerings) {
      const assigned = o.assignments[0];
      if (!assigned) continue;
      lecturerCredits.set(
        assigned.lecturerId,
        (lecturerCredits.get(assigned.lecturerId) ?? 0) +
          (o.course.credits ?? 0),
      );
    }

    const rows = offerings.map((o) => {
      const assigned = o.assignments[0] ?? null;
      const lecturerName = assigned
        ? `${assigned.lecturer.firstName} ${assigned.lecturer.lastName}`.trim()
        : null;

      const loadCredits = assigned
        ? (lecturerCredits.get(assigned.lecturerId) ?? 0)
        : 0;
      const loadPercent = assigned
        ? Math.min(999, Math.round((loadCredits / 18) * 100))
        : 0;

      return {
        offeringId: o.id,
        createdAt: o.createdAt.toISOString(),
        sessionName: o.session.name,
        sessionIsActive: o.session.isActive,
        semesterName: String(o.semester.name),
        courseId: o.course.id,
        courseCode: o.course.code,
        courseTitle: o.course.title,
        credits: o.course.credits,
        level: o.course.level,
        courseSemester: o.course.semester,
        programmeName: o.course.programme?.name ?? null,
        lecturerId: assigned?.lecturerId ?? null,
        lecturerName,
        loadPercent,
      };
    });

    const result: DepartmentAdminCourseOfferingListResult = {
      departmentName: dept.departmentName,
      activeSessionName: activeSession?.name ?? null,
      view: view === "ARCHIVES" ? "ARCHIVES" : "CURRENT",
      rows,
    };

    return NextResponse.json(
      {
        success: true,
        data: result,
      } satisfies ApiResponse<DepartmentAdminCourseOfferingListResult>,
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
        message: "Failed to load course offerings",
        code: "OFFERINGS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
