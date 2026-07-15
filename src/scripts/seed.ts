import "dotenv/config";

import { Role, SemesterName } from "@prisma/client";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";

import { prisma } from "@/lib/prisma";
import { provisionApprovedStudent } from "@/lib/student-provisioning";

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
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@usted.edu.gh")
    .trim()
    .toLowerCase();
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

    const existingAdmin = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    const user = existingAdmin
      ? await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            name,
            email,
            emailVerified: true,
            firstName,
            lastName,
            role: Role.ADMIN,
            isActive: true,
            departmentId: department.id,
          },
        })
      : await prisma.user.create({
          data: {
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
        `deptadmin${n}@usted.edu.gh`;
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
      const existingStaffProfile = await prisma.departmentAdminProfile.findUnique({
        where: { staffId: deptAdmin.staffId },
        select: { userId: true },
      });
      const existingDeptUser = existingStaffProfile
        ? { id: existingStaffProfile.userId }
        : await prisma.user.findFirst({
            where: { email: { equals: deptAdmin.email, mode: "insensitive" } },
            select: { id: true },
          });
      const deptUser = existingDeptUser
        ? await prisma.user.update({
            where: { id: existingDeptUser.id },
            data: {
              name: deptAdmin.name,
              emailVerified: true,
              firstName: deptAdmin.firstName,
              lastName: deptAdmin.lastName,
              role: Role.DEPARTMENT_ADMIN,
              isActive: true,
            },
          })
        : await prisma.user.create({
            data: {
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

    console.log("Seeding portal-ready students...");

    const academicDepartments = [
      {
        code: "FASME",
        name: "Faculty of Applied Sciences and Mathematics Education",
        description: "Applied sciences, mathematics and computing programmes",
      },
      {
        code: "FLLT",
        name: "Faculty of Languages and Literary Studies",
        description: "Language and literary education programmes",
      },
    ] as const;

    const seededDepartments = new Map<string, string>();
    for (const item of academicDepartments) {
      const seeded = await prisma.department.upsert({
        where: { code: item.code },
        create: item,
        update: { name: item.name, description: item.description },
        select: { id: true, code: true },
      });
      seededDepartments.set(seeded.code, seeded.id);
    }

    const programmeFixtures = [
      { code: "BSc-CSC", name: "Bachelor of Science in Computer Science", departmentCode: "FASME" },
      { code: "BSc-ITE", name: "Bachelor of Science in Information Technology", departmentCode: "FASME" },
      { code: "BSc-MED", name: "Bachelor of Science in Mathematics Education", departmentCode: "FASME" },
      { code: "BSc-Eng", name: "Bachelor of Science in English Education", departmentCode: "FLLT" },
    ] as const;

    for (const item of programmeFixtures) {
      const departmentId = seededDepartments.get(item.departmentCode);
      if (!departmentId) throw new Error(`Missing seeded department ${item.departmentCode}`);
      await prisma.programme.upsert({
        where: { departmentId_code: { departmentId, code: item.code } },
        create: {
          name: item.name,
          code: item.code,
          departmentId,
          durationYears: 4,
          totalSemesters: 8,
          isActive: true,
        },
        update: { name: item.name, isActive: true },
      });
    }

    let activeSession = await prisma.academicSession.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
    });
    if (!activeSession) {
      activeSession = await prisma.academicSession.upsert({
        where: { name: "2026/2027" },
        create: {
          name: "2026/2027",
          isActive: true,
          currentSemester: SemesterName.FIRST,
          startDate: new Date("2026-08-01T00:00:00.000Z"),
          endDate: new Date("2027-07-31T23:59:59.000Z"),
        },
        update: { isActive: true, currentSemester: SemesterName.FIRST },
      });
    }
    await prisma.semester.upsert({
      where: { sessionId_name: { sessionId: activeSession.id, name: SemesterName.FIRST } },
      create: {
        sessionId: activeSession.id,
        name: SemesterName.FIRST,
        startDate: activeSession.startDate,
        endDate: activeSession.endDate,
      },
      update: {},
    });

    const studentPassword = process.env.SEED_STUDENT_PASSWORD ?? "Student@123";
    const studentFixtures = [
      ["Ama", "Mensah", "BSc-CSC", "FASME"],
      ["Kwame", "Asante", "BSc-CSC", "FASME"],
      ["Akosua", "Owusu", "BSc-ITE", "FASME"],
      ["Kofi", "Boateng", "BSc-ITE", "FASME"],
      ["Abena", "Osei", "BSc-MED", "FASME"],
      ["Yaw", "Agyeman", "BSc-MED", "FASME"],
      ["Efua", "Brew", "BSc-Eng", "FLLT"],
      ["Kojo", "Arthur", "BSc-Eng", "FLLT"],
    ] as const;

    for (let index = 0; index < studentFixtures.length; index += 1) {
      const [studentFirstName, studentLastName, programmeCode, departmentCode] = studentFixtures[index];
      const ordinal = String(index + 1).padStart(3, "0");
      await provisionApprovedStudent({
        row: {
          email: `student${ordinal}@usted.edu.gh`,
          password: studentPassword,
          firstName: studentFirstName,
          lastName: studentLastName,
          studentId: `USTED-2026-${ordinal}`,
          batch: "2026",
          departmentCode,
          programmeCode,
        },
      });
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
    console.log(`- Students: ${studentFixtures.length} created/updated`);
    console.log(`- Student password (shared): ${studentPassword}`);
    console.log("- Student emails: student001@usted.edu.gh through student008@usted.edu.gh");
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
