-- AlterTable
ALTER TABLE "Fee" ADD COLUMN     "programmeFeeId" TEXT;

-- CreateIndex
CREATE INDEX "Fee_programmeFeeId_idx" ON "Fee"("programmeFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Fee_studentId_programmeFeeId_key" ON "Fee"("studentId", "programmeFeeId");

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_programmeFeeId_fkey" FOREIGN KEY ("programmeFeeId") REFERENCES "ProgrammeFee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
