import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type { ApiResponse, DepartmentInfoResponse } from "@/types";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const [departments, totalStudents, totalProgrammes] = await Promise.all([
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          headOfDept: true,
          contact: true,
          _count: { select: { programmes: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.programme.count(),
    ]);

    const studentsByDepartment = await prisma.user.groupBy({
      by: ["departmentId"],
      where: { role: "STUDENT", departmentId: { not: null } },
      _count: { _all: true },
    });

    const studentsCountMap = new Map<string, number>();
    for (const row of studentsByDepartment) {
      if (!row.departmentId) continue;
      studentsCountMap.set(row.departmentId, row._count._all);
    }

    const payload: DepartmentInfoResponse = {
      stats: {
        totalDepartments: departments.length,
        totalProgrammes,
        totalStudents,
      },
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        headOfDept: d.headOfDept,
        contact: d.contact,
        programmesCount: d._count.programmes,
        studentsCount: studentsCountMap.get(d.id) ?? 0,
      })),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<DepartmentInfoResponse>);
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
        message: "Failed to load department info",
        code: "DEPARTMENT_INFO_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
