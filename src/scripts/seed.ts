import "dotenv/config";

import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";

const directUrl = process.env.DIRECT_URL;
const accelerateUrl = process.env.ACCELERATE_URL ?? process.env.DATABASE_URL;

const prisma = (() => {
  const logLevels =
    process.env.NODE_ENV === "development"
      ? (["error", "warn"] as const)
      : (["error"] as const);

  if (directUrl && !directUrl.startsWith("prisma+")) {
    const pool = new Pool({ connectionString: directUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: [...logLevels] });
  }

  if (!accelerateUrl) {
    throw new Error(
      "Missing database configuration. Set DIRECT_URL or DATABASE_URL/ACCELERATE_URL.",
    );
  }

  return new PrismaClient({ accelerateUrl, log: [...logLevels] });
})();

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

async function ensureCredentialAccount(userId: string, plainPassword: string) {
  const hashedPassword = await hashBetterAuthPassword(plainPassword);

  const existingCredentialAccount = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  });

  if (existingCredentialAccount) {
    await prisma.account.update({
      where: { id: existingCredentialAccount.id },
      data: {
        accountId: userId,
        password: hashedPassword,
      },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: randomUUID(),
      userId,
      providerId: "credential",
      accountId: userId,
      password: hashedPassword,
    },
  });
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@USTED.edu.gh";
  const plainPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";

  const deptAdminPassword =
    process.env.SEED_DEPT_ADMIN_PASSWORD ?? "DeptAdmin@123";

  // Minimal profile fields required by schema
  const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? "System";
  const lastName = process.env.SEED_ADMIN_LAST_NAME ?? "Administrator";
  const name = `${firstName} ${lastName}`;

  console.log("Seeding administrator user...");

  const adminTemplatePermissions = [{ action: "*", resource: "*" }] as const;

  try {
    await prisma.$connect();

    // Optional: create a default department so admin is linked to a department context.
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
        role: Role.ADMIN,
        isActive: true,
        departmentId: department.id,
      },
      update: {
        name,
        emailVerified: true,
        firstName,
        lastName,
        role: Role.ADMIN,
        isActive: true,
        departmentId: department.id,
      },
    });

    const systemAdminTemplate = await prisma.roleTemplate.upsert({
      where: { name: "System Administrator" },
      update: {
        role: Role.ADMIN,
        description: "Full system access across all modules",
        isSystem: true,
      },
      create: {
        name: "System Administrator",
        role: Role.ADMIN,
        description: "Full system access across all modules",
        isSystem: true,
      },
    });

    for (const permission of adminTemplatePermissions) {
      await prisma.roleTemplatePermission.upsert({
        where: {
          templateId_action_resource: {
            templateId: systemAdminTemplate.id,
            action: permission.action,
            resource: permission.resource,
          },
        },
        update: {
          granted: true,
        },
        create: {
          templateId: systemAdminTemplate.id,
          action: permission.action,
          resource: permission.resource,
          granted: true,
        },
      });
    }

    await prisma.userRoleTemplate.updateMany({
      where: { userId: user.id },
      data: { isPrimary: false },
    });

    await prisma.userRoleTemplate.upsert({
      where: {
        userId_templateId: {
          userId: user.id,
          templateId: systemAdminTemplate.id,
        },
      },
      update: {
        isPrimary: true,
      },
      create: {
        userId: user.id,
        templateId: systemAdminTemplate.id,
        isPrimary: true,
      },
    });

    // Ensure the Better Auth credential account exists and matches expected format.
    await ensureCredentialAccount(user.id, plainPassword);

    console.log("Seeding department admins (no departments assigned)...");

    const deptAdmins = Array.from({ length: 3 }, (_, idx) => {
      const n = idx + 1;
      const deptEmail =
        process.env[`SEED_DEPT_ADMIN_${n}_EMAIL`] ??
        `deptadmin${n}@USTED.edu.gh`;
      const first =
        process.env[`SEED_DEPT_ADMIN_${n}_FIRST_NAME`] ?? "Department";
      const last =
        process.env[`SEED_DEPT_ADMIN_${n}_LAST_NAME`] ?? `Admin ${n}`;
      const staffId =
        process.env[`SEED_DEPT_ADMIN_${n}_STAFF_ID`] ??
        `DA-${String(n).padStart(3, "0")}`;

      return {
        email: deptEmail,
        firstName: first,
        lastName: last,
        name: `${first} ${last}`,
        staffId,
      };
    });

    for (const deptAdmin of deptAdmins) {
      const deptUser = await prisma.user.upsert({
        where: { email: deptAdmin.email },
        create: {
          id: randomUUID(),
          name: deptAdmin.name,
          email: deptAdmin.email,
          emailVerified: true,
          firstName: deptAdmin.firstName,
          lastName: deptAdmin.lastName,
          role: Role.DEPARTMENT_ADMIN,
          isActive: true,
          departmentId: null,
        },
        update: {
          name: deptAdmin.name,
          emailVerified: true,
          firstName: deptAdmin.firstName,
          lastName: deptAdmin.lastName,
          role: Role.DEPARTMENT_ADMIN,
          isActive: true,
          departmentId: null,
        },
      });

      await prisma.departmentAdminProfile.upsert({
        where: { userId: deptUser.id },
        create: {
          userId: deptUser.id,
          staffId: deptAdmin.staffId,
        },
        update: {
          staffId: deptAdmin.staffId,
        },
      });

      await ensureCredentialAccount(deptUser.id, deptAdminPassword);
    }

    console.log("Seed complete:");
    console.log(`- Email: ${email}`);
    console.log(`- Password: ${plainPassword}`);
    console.log(`- UserId: ${user.id}`);
    console.log("- Role: ADMIN");
    console.log("- System Administrator template assigned");
    console.log(
      "- Department admins: 3 created/updated (no departments assigned)",
    );
    console.log(
      `- Dept admin password (shared): ${deptAdminPassword} (override via SEED_DEPT_ADMIN_PASSWORD)`,
    );
    console.log("- Dept admin emails:");
    for (const deptAdmin of deptAdmins) {
      console.log(`  - ${deptAdmin.email} (${deptAdmin.staffId})`);
    }
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
