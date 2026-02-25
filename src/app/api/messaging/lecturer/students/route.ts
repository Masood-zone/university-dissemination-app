import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireLecturer } from "@/lib/server";
import type { ApiResponse } from "@/types";

export type LecturerMessagingStudentRow = {
  userId: string;
  name: string;
  email: string;
  departmentName: string | null;
  avatar: string | null;
  offeringIds: string[];
};

export type LecturerMessagingStudentsResponse = {
  rows: LecturerMessagingStudentRow[];
};

export async function GET(request: Request) {
  try {
    const session = await requireLecturer(request);
    const lecturerId = session.user?.id;

    if (!lecturerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const offeringId = url.searchParams.get("offeringId");

    const assignments = await prisma.courseAssignment.findMany({
      where: { lecturerId },
      select: { offeringId: true },
    });

    const offeringIds = assignments.map((a) => a.offeringId);

    if (!offeringIds.length) {
      return NextResponse.json(
        {
          success: true,
          data: { rows: [] },
        } satisfies ApiResponse<LecturerMessagingStudentsResponse>,
        { status: 200 },
      );
    }

    if (offeringId && !offeringIds.includes(offeringId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
          code: "FORBIDDEN",
        } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        offeringId: offeringId ? offeringId : { in: offeringIds },
      },
      select: {
        offeringId: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const map = new Map<string, LecturerMessagingStudentRow>();

    for (const e of enrollments) {
      const existing = map.get(e.student.id);

      if (existing) {
        if (!existing.offeringIds.includes(e.offeringId)) {
          existing.offeringIds.push(e.offeringId);
        }
        continue;
      }

      map.set(e.student.id, {
        userId: e.student.id,
        name: e.student.name,
        email: e.student.email,
        departmentName: e.student.department?.name ?? null,
        avatar: e.student.avatar ?? null,
        offeringIds: [e.offeringId],
      });
    }

    const rows = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return NextResponse.json(
      {
        success: true,
        data: { rows },
      } satisfies ApiResponse<LecturerMessagingStudentsResponse>,
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
        message: "Failed to load students",
        code: "MESSAGING_STUDENTS_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
