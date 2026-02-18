/*
  Warnings:

  - The primary key for the `_ExamSetToQuestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ExamSetToQuestionBank` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_NoticeToClasses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `answerLatex` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `difficultyDetail` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `fbd` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `questionLatex` on the `questions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[A,B]` on the table `_ExamSetToQuestion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_ExamSetToQuestionBank` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_NoticeToClasses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuestionType" ADD VALUE 'MC';
ALTER TYPE "QuestionType" ADD VALUE 'INT';
ALTER TYPE "QuestionType" ADD VALUE 'AR';
ALTER TYPE "QuestionType" ADD VALUE 'MTF';

-- AlterTable
ALTER TABLE "_ExamSetToQuestion" DROP CONSTRAINT "_ExamSetToQuestion_AB_pkey";

-- AlterTable
ALTER TABLE "_ExamSetToQuestionBank" DROP CONSTRAINT "_ExamSetToQuestionBank_AB_pkey";

-- AlterTable
ALTER TABLE "_NoticeToClasses" DROP CONSTRAINT "_NoticeToClasses_AB_pkey";

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "mcNegativeMarking" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "mcPartialMarking" BOOLEAN DEFAULT true;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "answerLatex",
DROP COLUMN "difficultyDetail",
DROP COLUMN "fbd",
DROP COLUMN "questionLatex",
ADD COLUMN     "assertion" TEXT,
ADD COLUMN     "correctOption" INTEGER,
ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "isForPractice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leftColumn" JSONB,
ADD COLUMN     "matches" JSONB,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "rightColumn" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activeSessionId" TEXT,
ADD COLUMN     "lastSessionInfo" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "_ExamSetToQuestion_AB_unique" ON "_ExamSetToQuestion"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_ExamSetToQuestionBank_AB_unique" ON "_ExamSetToQuestionBank"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_NoticeToClasses_AB_unique" ON "_NoticeToClasses"("A", "B");

-- CreateIndex
CREATE INDEX "seat_allocations_examId_hallId_idx" ON "seat_allocations"("examId", "hallId");
