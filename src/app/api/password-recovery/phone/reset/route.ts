import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { emailService } from "@/lib/email-service";
import { normalizeGhanaPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { smsService } from "@/lib/sms-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    phoneNumber?: string;
    otp?: string;
    newPassword?: string;
  };
  const phoneNumber = normalizeGhanaPhone(body.phoneNumber);
  if (!phoneNumber || !body.otp || !body.newPassword) {
    return NextResponse.json(
      { success: false, message: "Phone, code and password are required" },
      { status: 400 },
    );
  }
  try {
    await auth.api.resetPasswordPhoneNumber({
      body: {
        phoneNumber,
        otp: body.otp,
        newPassword: body.newPassword,
      },
      headers: request.headers,
    });
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: { id: true, email: true, name: true },
    });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await Promise.allSettled([
        emailService.sendPasswordResetConfirmationEmail({
          userEmail: user.email,
          userName: user.name,
        }),
        smsService.sendPasswordResetConfirmationSMS({ to: phoneNumber }),
      ]);
    }
    return NextResponse.json({ success: true, data: { status: true } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The code is invalid or expired",
      },
      { status: 400 },
    );
  }
}
