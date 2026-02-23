-- CreateEnum
CREATE TYPE "ProgrammeAwardType" AS ENUM ('UNDERGRADUATE', 'POSTGRADUATE', 'DIPLOMA');

-- AlterTable
ALTER TABLE "Programme" ADD COLUMN     "awardType" "ProgrammeAwardType" NOT NULL DEFAULT 'UNDERGRADUATE',
ADD COLUMN     "minCredits" INTEGER,
ADD COLUMN     "totalSemesters" INTEGER;
