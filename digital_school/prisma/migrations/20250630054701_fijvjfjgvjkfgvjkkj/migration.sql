/*
  Warnings:

  - You are about to drop the column `correctOption` on the `questions` table. All the data in the column will be lost.
  - The `options` column on the `questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `difficulty` column on the `questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `classId` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_clonedFromId_fkey";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "correctOption",
ADD COLUMN     "classId" TEXT NOT NULL,
ADD COLUMN     "editedById" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3),
ADD COLUMN     "marks" DOUBLE PRECISION,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "options",
ADD COLUMN     "options" JSONB,
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
ALTER COLUMN "imageUrls" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
