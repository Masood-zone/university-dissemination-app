import "dotenv/config";

import { PrismaClient, Role } from "@prisma/client";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";

const accelerateUrl = process.env.ACCELERATE_URL ?? process.env.DATABASE_URL;

const prisma = new PrismaClient({
  accelerateUrl: accelerateUrl || undefined,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

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
  // Matches Better Auth v1.4.x: saltHex:keyHex (scrypt)
  // config: N=16384, r=16, p=1, dkLen=64
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

async function main() {
  const email = "kiritokaisel@gmail.com";
  const plainPassword = "Student@123";

  // Minimal profile fields required by schema
  const firstName = "Kirito";
  const lastName = "Kaisel";
  const name = `${firstName} ${lastName}`;

  console.log("Seeding single student user...");

  try {
    await prisma.$connect();

    // Optional: create a default department so the student is fully linked.
    const department = await prisma.department.upsert({
      where: { code: "CS" },
      create: {
        name: "Computer Science",
        code: "CS",
        description: "Department of Computer Science and Engineering",
      },
      update: {
        name: "Computer Science",
        description: "Department of Computer Science and Engineering",
      },
    });

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        id: randomUUID(),
        name,
        email,
        emailVerified: true,
        firstName,
        lastName,
        role: Role.STUDENT,
        isActive: true,
        departmentId: department.id,
      },
      update: {
        name,
        emailVerified: true,
        firstName,
        lastName,
        role: Role.STUDENT,
        isActive: true,
        departmentId: department.id,
      },
    });

    // Ensure the Better Auth credential account exists and matches expected format.
    const hashedPassword = await hashBetterAuthPassword(plainPassword);

    const existingCredentialAccount = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    });

    if (existingCredentialAccount) {
      await prisma.account.update({
        where: { id: existingCredentialAccount.id },
        data: {
          accountId: user.id,
          password: hashedPassword,
        },
      });
    } else {
      await prisma.account.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          providerId: "credential",
          accountId: user.id,
          password: hashedPassword,
        },
      });
    }

    const emailLocal = email.split("@")[0] ?? "STUDENT";
    const studentId = `STU-${emailLocal.toUpperCase()}`;

    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        studentId,
        batch: "2025/2026",
        enrolledCourses: [],
      },
      update: {
        studentId,
        batch: "2025/2026",
        enrolledCourses: [],
      },
    });

    console.log("Seed complete:");
    console.log(`- Email: ${email}`);
    console.log(`- Password: ${plainPassword}`);
    console.log(`- UserId: ${user.id}`);
    console.log(`- StudentId: ${studentId}`);
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
