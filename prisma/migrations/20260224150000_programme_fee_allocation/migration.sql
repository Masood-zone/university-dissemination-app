-- CreateTable
CREATE TABLE "ProgrammeFee" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "semester" "SemesterName" NOT NULL,
    "tuitionFee" DOUBLE PRECISION NOT NULL,
    "libraryFee" DOUBLE PRECISION NOT NULL,
    "facilityFee" DOUBLE PRECISION NOT NULL,
    "totalFee" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammeFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeFee_programmeId_sessionId_semester_key" ON "ProgrammeFee"("programmeId", "sessionId", "semester");

-- CreateIndex
CREATE INDEX "ProgrammeFee_programmeId_idx" ON "ProgrammeFee"("programmeId");

-- CreateIndex
CREATE INDEX "ProgrammeFee_sessionId_idx" ON "ProgrammeFee"("sessionId");

-- AddForeignKey
ALTER TABLE "ProgrammeFee" ADD CONSTRAINT "ProgrammeFee_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeFee" ADD CONSTRAINT "ProgrammeFee_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
