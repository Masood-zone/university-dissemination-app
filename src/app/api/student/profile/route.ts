import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/server";
import type { ApiResponse } from "@/types";

export type StudentProfileResponse = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  roleLabel: string;
  departmentName: string | null;
  studentId: string | null;
  batch: string | null;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
};

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export async function GET(request: Request) {
  try {
    const session = await requireStudent(request);
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        department: { select: { name: true } },
        studentProfile: {
          select: {
            studentId: true,
            batch: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          code: "NOT_FOUND",
        } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    const payload: StudentProfileResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      avatar: user.avatar ?? null,
      roleLabel: "Student",
      departmentName: user.department?.name ?? null,
      studentId: user.studentProfile?.studentId ?? null,
      batch: user.studentProfile?.batch ?? null,
      emailVerified: user.emailVerified,
      lastLogin: toIso(user.lastLogin),
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json(
      { success: true, data: payload } satisfies ApiResponse<StudentProfileResponse>,
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
        message: "Failed to load profile",
        code: "PROFILE_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
