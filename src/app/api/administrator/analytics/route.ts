import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import {
  analyticsRange,
  getAnnouncementAnalytics,
} from "@/lib/announcement-analytics";
import { requireAdmin } from "@/lib/server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const range = analyticsRange(url);
    const role = url.searchParams.get("role") as Role | null;
    const data = await getAnnouncementAnalytics({
      ...range,
      departmentId: url.searchParams.get("departmentId") || undefined,
      courseOfferingId:
        url.searchParams.get("courseOfferingId") || undefined,
      role: role && Object.values(Role).includes(role) ? role : undefined,
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
