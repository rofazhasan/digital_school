/*
  Warnings:

  - You are about to drop the column `examId` on the `results` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `results` table. All the data in the column will be lost.
  - You are about to drop the `cq_evaluations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cq_sheets` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[examSubmissionId]` on the table `results` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `examSubmissionId` to the `results` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'REVIEW_RESPONSE');

-- DropForeignKey
ALTER TABLE "cq_evaluations" DROP CONSTRAINT "cq_evaluations_cqSheetId_fkey";

-- DropForeignKey
ALTER TABLE "cq_sheets" DROP CONSTRAINT "cq_sheets_evaluatedById_fkey";

-- DropForeignKey
ALTER TABLE "cq_sheets" DROP CONSTRAINT "cq_sheets_examId_fkey";

-- DropForeignKey
ALTER TABLE "cq_sheets" DROP CONSTRAINT "cq_sheets_studentId_fkey";

-- DropForeignKey
ALTER TABLE "results" DROP CONSTRAINT "results_examId_fkey";

-- DropForeignKey
ALTER TABLE "results" DROP CONSTRAINT "results_studentId_fkey";

-- DropIndex
DROP INDEX "results_studentId_examId_key";

-- AlterTable
ALTER TABLE "ExamSubmission" ADD COLUMN     "evaluatedAt" TIMESTAMP(3),
ADD COLUMN     "evaluatorNotes" TEXT,
ADD COLUMN     "examSetId" TEXT;

-- AlterTable
ALTER TABLE "results" DROP COLUMN "examId",
DROP COLUMN "studentId",
ADD COLUMN     "examSubmissionId" TEXT NOT NULL,
ADD COLUMN     "sqMarks" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "cq_evaluations";

-- DropTable
DROP TABLE "cq_sheets";

-- DropEnum
DROP TYPE "CQEvaluationStatus";

-- CreateTable
CREATE TABLE "exam_submission_drawings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "imageData" TEXT NOT NULL,
    "originalImagePath" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_submission_drawings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_reviews" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentComment" TEXT NOT NULL,
    "evaluatorComment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "result_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_submission_drawings_studentId_questionId_key" ON "exam_submission_drawings"("studentId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "result_reviews_examId_studentId_key" ON "result_reviews"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "results_examSubmissionId_key" ON "results"("examSubmissionId");

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_examSubmissionId_fkey" FOREIGN KEY ("examSubmissionId") REFERENCES "ExamSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmission" ADD CONSTRAINT "ExamSubmission_examSetId_fkey" FOREIGN KEY ("examSetId") REFERENCES "exam_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_submission_drawings" ADD CONSTRAINT "exam_submission_drawings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_submission_drawings" ADD CONSTRAINT "exam_submission_drawings_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_submission_drawings" ADD CONSTRAINT "exam_submission_drawings_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_submission_drawings" ADD CONSTRAINT "exam_submission_drawings_studentId_examId_fkey" FOREIGN KEY ("studentId", "examId") REFERENCES "ExamSubmission"("studentId", "examId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_reviews" ADD CONSTRAINT "result_reviews_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_reviews" ADD CONSTRAINT "result_reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_reviews" ADD CONSTRAINT "result_reviews_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
