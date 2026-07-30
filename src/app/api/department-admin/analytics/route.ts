import { NextResponse } from "next/server";

import {
  analyticsRange,
  getAnnouncementAnalytics,
} from "@/lib/announcement-analytics";
import {
  requireDepartmentAdmin,
  resolveDepartmentForDepartmentAdmin,
} from "@/lib/server";

export async function GET(request: Request) {
  try {
    const session = await requireDepartmentAdmin(request);
    const department = await resolveDepartmentForDepartmentAdmin(
      session.user.id,
    );
    if (!department) {
      return NextResponse.json(
        { success: false, message: "Department required" },
        { status: 400 },
      );
    }
    const data = await getAnnouncementAnalytics({
      ...analyticsRange(new URL(request.url)),
      departmentId: department.departmentId,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const status = error instanceof Response ? error.status : 500;
    return NextResponse.json(
      { success: false, message: "Failed to load analytics" },
      { status },
    );
  }
}
