import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireDepartmentAdmin } from "@/lib/server";
import type {
  ApiResponse,
  DepartmentAdminActivityItem,
  DepartmentAdminOverviewData,
} from "@/types";

function toIso(value: Date | null | undefined): string {
  return value ? value.toISOString() : new Date(0).toISOString();
}

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        firstName: true,
        lastName: true,
      },
    });

    let departmentId = user?.departmentId ?? null;

    if (!departmentId && user) {
      const headName = `${user.firstName} ${user.lastName}`.trim();
      if (headName) {
        const dept = await prisma.department.findFirst({
          where: { headOfDept: headName },
          select: { id: true },
        });

        if (dept?.id) {
          departmentId = dept.id;
          prisma.user
            .update({ where: { id: userId }, data: { departmentId: dept.id } })
            .catch(() => undefined);
        }
      }
    }

    if (!departmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Department admin has no department assigned",
          code: "DEPARTMENT_REQUIRED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const now = new Date();

    const [
      totalCourses,
      activeOfferings,
      totalLecturers,
      totalStudents,
      recentAssignments,
      recentAnnouncements,
      recentLecturers,
      nextCalendar,
    ] = await Promise.all([
      prisma.course.count({ where: { departmentId } }),
      prisma.courseOffering.count({
        where: {
          departmentId,
          isActive: true,
          session: { isActive: true },
        },
      }),
      prisma.user.count({ where: { role: "LECTURER", departmentId } }),
      prisma.user.count({ where: { role: "STUDENT", departmentId } }),
      prisma.courseAssignment.findMany({
        where: { offering: { departmentId } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          offering: {
            include: { course: true, session: true, semester: true },
          },
          lecturer: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.announcement.findMany({
        where: { departmentId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: "LECTURER", departmentId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),
      prisma.academicCalendar.findFirst({
        where: { endDate: { gte: now } },
        orderBy: { startDate: "asc" },
        select: {
          title: true,
          description: true,
          startDate: true,
          endDate: true,
        },
      }),
    ]);

    const activities: DepartmentAdminActivityItem[] = [];

    for (const item of recentAssignments) {
      const courseLabel = `${item.offering.course.code} ${item.offering.course.title}`;
      const lecturerLabel =
        `${item.lecturer.firstName} ${item.lecturer.lastName}`.trim();
      activities.push({
        id: `assignment_${item.id}`,
        icon: "menu_book",
        title: `Course assigned: ${item.offering.course.code}`,
        description: `${courseLabel} assigned to ${lecturerLabel}.`,
        createdAt: toIso(item.createdAt),
      });
    }

    for (const item of recentAnnouncements) {
      const authorLabel = item.author
        ? `${item.author.firstName} ${item.author.lastName}`.trim()
        : "System";

      activities.push({
        id: `announcement_${item.id}`,
        icon: "campaign",
        title: "New department announcement",
        description: `${item.title} • by ${authorLabel}.`,
        createdAt: toIso(item.createdAt),
      });
    }

    for (const item of recentLecturers) {
      const name = `${item.firstName} ${item.lastName}`.trim();
      activities.push({
        id: `lecturer_${item.id}`,
        icon: "person_add",
        title: "New lecturer profile created",
        description: `${name} has been added to the department.`,
        createdAt: toIso(item.createdAt),
      });
    }

    activities.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const quickActions: DepartmentAdminOverviewData["quickActions"] = [
      {
        title: "Add New Lecturer",
        description: "Manage department staff",
        href: "/department-admin/staff-management",
        icon: "person_add",
      },
      {
        title: "Register Course",
        description: "Add department courses",
        href: "/department-admin/programmes-and-courses",
        icon: "library_add",
      },
      {
        title: "View Assignments",
        description: "Course assignments",
        href: "/department-admin/programmes-and-courses",
        icon: "assignment",
      },
      {
        title: "Generate Report",
        description: "Department analytics",
        href: "/department-admin/analytics",
        icon: "analytics",
      },
    ];

    const dashboardData: DepartmentAdminOverviewData = {
      stats: [
        {
          label: "Department Courses",
          value: String(totalCourses),
          note: "Courses under your department",
          icon: "book_4",
          badge: `${activeOfferings} active`,
        },
        {
          label: "Total Lecturers",
          value: String(totalLecturers),
          note: "Active department lecturers",
          icon: "person_pin",
          badge: null,
        },
        {
          label: "Student Count",
          value: totalStudents.toLocaleString(),
          note: "Students in your department",
          icon: "school",
          badge: null,
        },
      ],
      activities: activities.slice(0, 5),
      quickActions,
      calendar: nextCalendar
        ? {
            title: nextCalendar.title,
            description:
              nextCalendar.description ?? "Academic calendar update.",
            startDate: nextCalendar.startDate.toISOString(),
            endDate: nextCalendar.endDate.toISOString(),
          }
        : null,
    };

    const response: ApiResponse<DepartmentAdminOverviewData> = {
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
