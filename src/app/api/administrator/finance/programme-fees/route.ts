import { NextResponse } from "next/server";
import { Prisma, SemesterName } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server";
import type {
  ApiResponse,
  ProgrammeFeeAllocation,
  UpsertProgrammeFeeInput,
} from "@/types";

function isSemester(value: string | null): value is SemesterName {
  return value === "FIRST" || value === "SECOND";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const programmeId = searchParams.get("programmeId")?.trim() ?? "";
    const semesterParam = searchParams.get("semester");

    if (!programmeId) {
      return NextResponse.json(
        {
          success: false,
          message: "programmeId is required",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (!isSemester(semesterParam)) {
      return NextResponse.json(
        {
          success: false,
          message: "semester must be FIRST or SECOND",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const session = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "No active academic session set",
          code: "NO_ACTIVE_SESSION",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const record = await prisma.programmeFee.findUnique({
      where: {
        programmeId_sessionId_semester: {
          programmeId,
          sessionId: session.id,
          semester: semesterParam,
        },
      },
      select: {
        programmeId: true,
        sessionId: true,
        semester: true,
        tuitionFee: true,
        libraryFee: true,
        facilityFee: true,
        totalFee: true,
        currency: true,
      },
    });

    const payload: ProgrammeFeeAllocation = {
      programmeId,
      sessionId: session.id,
      sessionName: session.name,
      semester: semesterParam,
      tuitionFee: record?.tuitionFee ?? 0,
      libraryFee: record?.libraryFee ?? 0,
      facilityFee: record?.facilityFee ?? 0,
      totalFee: record?.totalFee ?? 0,
      currency: record?.currency ?? "GHS",
      configured: Boolean(record),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<ProgrammeFeeAllocation>);
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
      if (error.code === "P2021" || error.code === "P2022") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Database schema is out of date. Run `pnpm prisma migrate dev` and redeploy.",
            code: "DB_SCHEMA_OUT_OF_DATE",
          } satisfies ApiResponse<never>,
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load programme fee allocation",
        code: "PROGRAMME_FEE_GET_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = (await request
      .json()
      .catch(() => null)) as UpsertProgrammeFeeInput | null;

    const programmeId = body?.programmeId?.trim() ?? "";
    const semester = body?.semester ?? null;

    const tuitionFee = toNumber(body?.tuitionFee);
    const libraryFee = toNumber(body?.libraryFee);
    const facilityFee = toNumber(body?.facilityFee);

    if (!programmeId || !semester) {
      return NextResponse.json(
        {
          success: false,
          message: "programmeId and semester are required",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (semester !== "FIRST" && semester !== "SECOND") {
      return NextResponse.json(
        {
          success: false,
          message: "semester must be FIRST or SECOND",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (tuitionFee === null || libraryFee === null || facilityFee === null) {
      return NextResponse.json(
        {
          success: false,
          message: "tuitionFee, libraryFee, and facilityFee must be numbers",
          code: "VALIDATION_ERROR",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const session = await prisma.academicSession.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "No active academic session set",
          code: "NO_ACTIVE_SESSION",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const totalFee = tuitionFee + libraryFee + facilityFee;

    const saved = await prisma.programmeFee.upsert({
      where: {
        programmeId_sessionId_semester: {
          programmeId,
          sessionId: session.id,
          semester,
        },
      },
      create: {
        programmeId,
        sessionId: session.id,
        semester,
        tuitionFee,
        libraryFee,
        facilityFee,
        totalFee,
      },
      update: {
        tuitionFee,
        libraryFee,
        facilityFee,
        totalFee,
      },
      select: {
        programmeId: true,
        sessionId: true,
        semester: true,
        tuitionFee: true,
        libraryFee: true,
        facilityFee: true,
        totalFee: true,
        currency: true,
      },
    });

    const payload: ProgrammeFeeAllocation = {
      programmeId: saved.programmeId,
      sessionId: saved.sessionId,
      sessionName: session.name,
      semester: saved.semester,
      tuitionFee: saved.tuitionFee,
      libraryFee: saved.libraryFee,
      facilityFee: saved.facilityFee,
      totalFee: saved.totalFee,
      currency: saved.currency,
      configured: true,
    };

    return NextResponse.json({
      success: true,
      data: payload,
    } satisfies ApiResponse<ProgrammeFeeAllocation>);
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
      if (error.code === "P2021" || error.code === "P2022") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Database schema is out of date. Run `pnpm prisma migrate dev` and redeploy.",
            code: "DB_SCHEMA_OUT_OF_DATE",
          } satisfies ApiResponse<never>,
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update programme fee allocation",
        code: "PROGRAMME_FEE_UPSERT_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
