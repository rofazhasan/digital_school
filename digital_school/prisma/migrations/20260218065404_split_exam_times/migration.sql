-- AlterTable
ALTER TABLE "ExamSubmission" ADD COLUMN     "cqSqStartedAt" TIMESTAMP(3),
ADD COLUMN     "cqSqStatus" "SubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
ADD COLUMN     "cqSqSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "objectiveStartedAt" TIMESTAMP(3),
ADD COLUMN     "objectiveStatus" "SubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
ADD COLUMN     "objectiveSubmittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "cqSqTime" INTEGER,
ADD COLUMN     "objectiveTime" INTEGER;
