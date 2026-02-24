import { NextResponse } from "next/server";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireDepartmentAdmin } from "@/lib/server";
import type { ApiResponse } from "@/types";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options: {
    N: number;
    r: number;
    p: number;
    maxmem: number;
  },
) => Promise<Buffer>;

async function hashBetterAuthPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

async function verifyBetterAuthPassword(
  plainPassword: string,
  stored: string,
): Promise<boolean> {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;

  const storedKey = Buffer.from(keyHex, "hex");
  const derived = await scryptAsync(plainPassword.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });

  if (storedKey.length !== derived.length) return false;
  return timingSafeEqual(storedKey, derived);
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function POST(request: Request) {
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

    const json = (await request.json()) as unknown;
    const input = changePasswordSchema.parse(json);

    if (input.currentPassword === input.newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different",
          code: "PASSWORD_UNCHANGED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const credentialAccount = await prisma.account.findFirst({
      where: { userId, providerId: "credential" },
      select: { id: true, password: true },
    });

    if (!credentialAccount?.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password login is not enabled for this account",
          code: "NO_CREDENTIAL_ACCOUNT",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const ok = await verifyBetterAuthPassword(
      input.currentPassword,
      credentialAccount.password,
    );

    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect",
          code: "INVALID_CURRENT_PASSWORD",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const hashed = await hashBetterAuthPassword(input.newPassword);

    await prisma.account.update({
      where: { id: credentialAccount.id },
      data: {
        accountId: userId,
        password: hashed,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true } satisfies ApiResponse<null>, {
      status: 200,
    });
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
        message: "Failed to change password",
        code: "PASSWORD_CHANGE_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
