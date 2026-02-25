import { ApplicationStatus, SemesterName } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type EnsureStudentEnrollmentsResult = {
  offeringIds: string[];
  createdCount: number;
};

async function getSessionForApplication(sessionId: string | null) {
  if (sessionId) {
    const selected = await prisma.academicSession.findUnique({
      where: { id: sessionId },
      select: { id: true, currentSemester: true },
    });

    if (selected) return selected;
  }

  return prisma.academicSession.findFirst({
    where: { isActive: true },
    select: { id: true, currentSemester: true },
  });
}

export async function ensureStudentEnrollmentsForCurrentSemester(options: {
  studentId: string;
}): Promise<EnsureStudentEnrollmentsResult> {
  const latestApproved = await prisma.application.findFirst({
    where: {
      applicantId: options.studentId,
      status: ApplicationStatus.APPROVED,
    },
    orderBy: { decidedAt: "desc" },
    select: {
      programmeId: true,
      departmentId: true,
      sessionId: true,
    },
  });

  if (!latestApproved) return { offeringIds: [], createdCount: 0 };

  const session = await getSessionForApplication(latestApproved.sessionId);
  if (!session) return { offeringIds: [], createdCount: 0 };

  const currentSemesterName: SemesterName =
    session.currentSemester ?? SemesterName.FIRST;

  const semester = await prisma.semester.findUnique({
    where: {
      sessionId_name: {
        sessionId: session.id,
        name: currentSemesterName,
      },
    },
    select: { id: true },
  });

  if (!semester) return { offeringIds: [], createdCount: 0 };

  const offerings = await prisma.courseOffering.findMany({
    where: {
      sessionId: session.id,
      semesterId: semester.id,
      departmentId: latestApproved.departmentId,
      isActive: true,
      course: {
        programmeId: latestApproved.programmeId,
      },
    },
    select: { id: true },
  });

  const offeringIds = offerings.map((o) => o.id);
  if (!offeringIds.length) return { offeringIds: [], createdCount: 0 };

  const created = await prisma.enrollment.createMany({
    data: offeringIds.map((offeringId) => ({
      offeringId,
      studentId: options.studentId,
    })),
    skipDuplicates: true,
  });

  return {
    offeringIds,
    createdCount: created.count,
  };
}
