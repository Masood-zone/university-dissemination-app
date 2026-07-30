import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { normalizeGhanaPhone } from "@/lib/phone";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    phoneNumber?: string;
  };
  const phoneNumber = normalizeGhanaPhone(body.phoneNumber);
  if (phoneNumber) {
    await auth.api
      .requestPasswordResetPhoneNumber({
        body: { phoneNumber },
        headers: request.headers,
      })
      .catch(() => undefined);
  }
  return NextResponse.json({
    success: true,
    data: {
      message: "If that phone number exists, a reset code has been sent.",
    },
  });
}
