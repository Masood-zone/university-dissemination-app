import "dotenv/config";

import { prisma } from "@/lib/prisma";

async function main() {
  const emails = Array.from(
    { length: 8 },
    (_, index) => `student${String(index + 1).padStart(3, "0")}@usted.edu.gh`,
  );
  const studentIds = Array.from(
    { length: 8 },
    (_, index) => `USTED-2026-${String(index + 1).padStart(3, "0")}`,
  );

  const [users, profiles, approvedApplications, credentials] =
    await Promise.all([
      prisma.user.count({ where: { email: { in: emails }, role: "STUDENT" } }),
      prisma.studentProfile.count({ where: { studentId: { in: studentIds } } }),
      prisma.application.count({
        where: {
          applicationNo: { in: studentIds.map((id) => `IMP-${id}`) },
          status: "APPROVED",
        },
      }),
      prisma.account.count({
        where: {
          providerId: "credential",
          user: { email: { in: emails }, role: "STUDENT" },
        },
      }),
    ]);

  const result = {
    users,
    profiles,
    approvedApplications,
    credentials,
  };
  console.log(JSON.stringify(result, null, 2));

  if (
    users !== 8 ||
    profiles !== 8 ||
    approvedApplications !== 8 ||
    credentials !== 8
  ) {
    throw new Error("Seed verification failed");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
