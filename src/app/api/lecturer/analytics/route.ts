import { NextResponse } from "next/server";

import {
  analyticsRange,
  getAnnouncementAnalytics,
} from "@/lib/announcement-analytics";
import { requireLecturer } from "@/lib/server";

export async function GET(request: Request) {
  try {
    const session = await requireLecturer(request);
    const data = await getAnnouncementAnalytics({
      ...analyticsRange(new URL(request.url)),
      authorId: session.user.id,
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
