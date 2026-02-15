-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "cqRequiredQuestions" INTEGER DEFAULT 5,
ADD COLUMN     "cqTotalQuestions" INTEGER DEFAULT 8,
ADD COLUMN     "mcqNegativeMarking" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "sqRequiredQuestions" INTEGER DEFAULT 5,
ADD COLUMN     "sqTotalQuestions" INTEGER DEFAULT 15,
ALTER COLUMN "isActive" SET DEFAULT false;
