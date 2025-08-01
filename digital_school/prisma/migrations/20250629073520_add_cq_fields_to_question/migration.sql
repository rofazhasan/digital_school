-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "cqStructure" JSONB,
ADD COLUMN     "stem" TEXT,
ADD COLUMN     "subQuestions" JSONB,
ADD COLUMN     "totalSubQuestions" INTEGER;
