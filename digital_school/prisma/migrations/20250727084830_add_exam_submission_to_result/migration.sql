/*
  Warnings:

  - A unique constraint covering the columns `[studentId,examId]` on the table `results` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `examId` to the `results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `results` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "results" ADD COLUMN     "examId" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL,
ALTER COLUMN "examSubmissionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "results_studentId_examId_key" ON "results"("studentId", "examId");

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
