/*
  Warnings:

  - Added the required column `examSubmissionId` to the `result_reviews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "result_reviews" ADD COLUMN     "examSubmissionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "result_reviews" ADD CONSTRAINT "result_reviews_examSubmissionId_fkey" FOREIGN KEY ("examSubmissionId") REFERENCES "ExamSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
