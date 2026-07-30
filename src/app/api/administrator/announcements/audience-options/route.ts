import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const [departments, offerings] = await Promise.all([
      prisma.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      }),
      prisma.courseOffering.findMany({
        where: { isActive: true },
        orderBy: { course: { code: "asc" } },
        select: {
          id: true,
          departmentId: true,
          course: { select: { code: true, title: true } },
          session: { select: { name: true } },
          semester: { select: { name: true } },
        },
      }),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        departments,
        offerings: offerings.map((row) => ({
          id: row.id,
          departmentId: row.departmentId,
          label: `${row.course.code} — ${row.course.title} (${row.session.name}, ${row.semester.name})`,
        })),
      },
    });
  } catch (error) {
    const status = error instanceof Response ? error.status : 500;
    return NextResponse.json(
      { success: false, message: "Failed to load audience options" },
      { status },
    );
  }
}
