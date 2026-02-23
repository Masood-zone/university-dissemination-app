import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server";
import type { AdminOverviewData, ApiResponse } from "@/types";
import { prisma } from "@/lib/prisma";
import { formatEndsIn, formatGhs, formatStudentCount } from "@/lib/utils";

const quickActions: AdminOverviewData["quickActions"] = [
  {
    title: "New Session",
    description: "Define academic year",
    href: "/administrator/academic-sessions",
    icon: "add_box",
  },
  {
    title: "Create Department",
    description: "Manage academic units",
    href: "/administrator/department-management",
    icon: "apartment",
  },
  {
    title: "Broadcast Notice",
    description: "Announcements & communication",
    href: "/administrator/announcements",
    icon: "campaign",
  },
  {
    title: "Export Reports",
    description: "Excel / PDF / CSV",
    href: "/administrator/finance",
    icon: "download",
  },
];

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const now = new Date();

    const [
      totalStudents,
      totalDepartments,
      activeSession,
      paidFeesAgg,
      allFeesAgg,
      successfulPaymentsAgg,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.department.count(),
      prisma.academicSession.findFirst({
        where: { isActive: true },
        include: { semesters: true },
      }),
      prisma.fee.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.fee.aggregate({
        _sum: { amount: true },
      }),
      prisma.paymentTransaction.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
    ]);

    const currentSemester =
      (activeSession?.currentSemester
        ? activeSession.semesters.find(
            (s) => s.name === activeSession.currentSemester,
          )
        : null) ??
      activeSession?.semesters
        ?.filter((s) => {
          if (!s.startDate || !s.endDate) return false;
          return s.startDate <= now && now <= s.endDate;
        })
        .sort(
          (a, b) =>
            (b.startDate?.getTime() ?? 0) - (a.startDate?.getTime() ?? 0),
        )[0] ??
      activeSession?.semesters
        ?.slice()
        .sort(
          (a, b) =>
            (b.startDate?.getTime() ?? 0) - (a.startDate?.getTime() ?? 0),
        )[0] ??
      null;

    const semesterLabel =
      activeSession && currentSemester
        ? `${activeSession.name} ${currentSemester.name === "SECOND" ? "SEM II" : "SEM I"}`
        : activeSession
          ? activeSession.name
          : "Not set";

    const semesterNote = currentSemester
      ? formatEndsIn(currentSemester.endDate)
      : activeSession
        ? "Active session"
        : "No active session";

    const totalPaidFees = paidFeesAgg._sum.amount ?? 0;
    const totalFees = allFeesAgg._sum.amount ?? 0;
    const collectionRate =
      totalFees > 0 ? Math.round((totalPaidFees / totalFees) * 100) : null;

    const totalSuccessfulPayments = successfulPaymentsAgg._sum.amount ?? 0;
    const revenueValue =
      totalSuccessfulPayments > 0 ? totalSuccessfulPayments : totalPaidFees;

    const dashboardData: AdminOverviewData = {
      stats: [
        {
          label: "Total Students",
          value: formatStudentCount(totalStudents),
          note: "Registered students",
          icon: "groups",
        },
        {
          label: "Active Depts",
          value: String(totalDepartments),
          note: "Total departments",
          icon: "account_balance",
        },
        {
          label: "Current Semester",
          value: semesterLabel,
          note: semesterNote,
          icon: "calendar_today",
        },
        {
          label: "Total Revenue",
          value: formatGhs(revenueValue),
          note:
            collectionRate === null
              ? "No fees recorded"
              : `${collectionRate}% collection rate`,
          icon: "savings",
        },
      ],
      quickActions,
    };

    const response: ApiResponse<AdminOverviewData> = {
      success: true,
      data: dashboardData,
    };

    return NextResponse.json(response);
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
        message: "Failed to load dashboard data",
        code: "DASHBOARD_FETCH_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
