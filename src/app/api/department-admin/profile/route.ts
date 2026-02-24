import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  requireDepartmentAdmin,
  resolveDepartmentForDepartmentAdmin,
} from "@/lib/server";
import type { ApiResponse } from "@/types";

export type DepartmentAdminProfileResponse = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  roleLabel: string;
  departmentName: string | null;
  staffId: string | null;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
};

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).nullable().optional(),
});

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
        departmentAdminProfile: { select: { staffId: true } },
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

    const payload: DepartmentAdminProfileResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      avatar: user.avatar ?? null,
      roleLabel: "Department Admin",
      departmentName: dept?.departmentName ?? null,
      staffId: user.departmentAdminProfile?.staffId ?? null,
      emailVerified: user.emailVerified,
      lastLogin: toIso(user.lastLogin),
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: payload,
      } satisfies ApiResponse<DepartmentAdminProfileResponse>,
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

export async function PATCH(request: Request) {
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

    const json = (await request.json()) as unknown;
    const input = updateProfileSchema.parse(json);

    const phone = input.phone ? input.phone : null;
    const name = `${input.firstName} ${input.lastName}`.trim();

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        name,
        phone,
      },
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
        departmentAdminProfile: { select: { staffId: true } },
      },
    });

    const payload: DepartmentAdminProfileResponse = {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      name: updated.name,
      email: updated.email,
      phone: updated.phone ?? null,
      avatar: updated.avatar ?? null,
      roleLabel: "Department Admin",
      departmentName: dept?.departmentName ?? null,
      staffId: updated.departmentAdminProfile?.staffId ?? null,
      emailVerified: updated.emailVerified,
      lastLogin: toIso(updated.lastLogin),
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json(
      { success: true, data: payload } satisfies ApiResponse<DepartmentAdminProfileResponse>,
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request",
          code: "INVALID_INPUT",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

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
        message: "Failed to update profile",
        code: "PROFILE_UPDATE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
