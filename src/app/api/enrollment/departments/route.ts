import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse, EnrollmentDepartment } from "@/types";

export async function GET() {
  try {
    const rows = await prisma.department.findMany({
      select: { id: true, name: true, code: true, description: true },
      orderBy: { name: "asc" },
    });

    const payload: EnrollmentDepartment[] = rows.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
    }));

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<EnrollmentDepartment[]>);
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load departments",
        code: "DEPARTMENTS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
