-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('APPROVED', 'NEEDS_REVIEW', 'DRAFT');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "clonedFromId" TEXT,
ADD COLUMN     "modelAnswer_bn" TEXT,
ADD COLUMN     "modelAnswer_en" TEXT,
ADD COLUMN     "referenceFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "title_bn" TEXT,
ADD COLUMN     "title_en" TEXT,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "QuestionVersion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
