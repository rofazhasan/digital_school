/*
  Warnings:

  - A unique constraint covering the columns `[studentId,questionId,imageIndex]` on the table `exam_submission_drawings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "exam_submission_drawings_studentId_questionId_key";

-- AlterTable
ALTER TABLE "exam_submission_drawings" ADD COLUMN     "imageIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "exam_submission_drawings_studentId_questionId_imageIndex_key" ON "exam_submission_drawings"("studentId", "questionId", "imageIndex");
