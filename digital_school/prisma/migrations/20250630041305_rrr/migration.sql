/*
  Warnings:

  - You are about to drop the column `chapter` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `cqStructure` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `marks` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `modelAnswer_bn` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `modelAnswer_en` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `referenceFiles` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `title_bn` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `title_en` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `totalSubQuestions` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `usageCount` on the `questions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_teacherId_fkey";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "chapter",
DROP COLUMN "cqStructure",
DROP COLUMN "isActive",
DROP COLUMN "marks",
DROP COLUMN "modelAnswer_bn",
DROP COLUMN "modelAnswer_en",
DROP COLUMN "referenceFiles",
DROP COLUMN "status",
DROP COLUMN "teacherId",
DROP COLUMN "title_bn",
DROP COLUMN "title_en",
DROP COLUMN "totalSubQuestions",
DROP COLUMN "usageCount",
ADD COLUMN     "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teacherProfileId" TEXT,
ADD COLUMN     "topic" TEXT,
ALTER COLUMN "questionText" DROP NOT NULL,
ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
