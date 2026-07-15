import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";
import type { Prisma } from "@prisma/client";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

export async function hashBetterAuthPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

export function generateTemporaryPassword(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `Student@${digits}`;
}

export async function ensureCredentialAccount(
  db: Prisma.TransactionClient,
  userId: string,
  plainPassword: string,
): Promise<void> {
  const hashedPassword = await hashBetterAuthPassword(plainPassword);
  const existing = await db.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  });

  if (existing) {
    await db.account.update({
      where: { id: existing.id },
      data: { accountId: userId, password: hashedPassword },
    });
    return;
  }

  await db.account.create({
    data: {
      id: randomUUID(),
      userId,
      providerId: "credential",
      accountId: userId,
      password: hashedPassword,
    },
  });
}
