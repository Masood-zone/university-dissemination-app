import { NextResponse } from "next/server";

import { processDueAnnouncements } from "@/lib/announcement-broadcast";

export async function POST(request: Request) {
  const secret = process.env.ANNOUNCEMENT_CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  const processed = await processDueAnnouncements();
  return NextResponse.json({ success: true, data: { processed } });
}
