-- CreateEnum
CREATE TYPE "GoalTargetType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "personal_exams" ADD COLUMN     "preparationChecklist" JSONB;

-- AlterTable
ALTER TABLE "student_corner_profiles" ADD COLUMN     "density" TEXT NOT NULL DEFAULT 'COMFORTABLE',
ADD COLUMN     "privacyModeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savedViews" JSONB,
ADD COLUMN     "streakGraceDaysAvailable" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "streakQualifyingCriteria" TEXT NOT NULL DEFAULT 'ONE_CHALLENGE',
ADD COLUMN     "widgetConfig" JSONB;

-- CreateTable
CREATE TABLE "student_goals" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "targetType" "GoalTargetType" NOT NULL DEFAULT 'MONTHLY',
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'tasks',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "milestonesPassed" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_reflections" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceKey" TEXT NOT NULL,
    "arabicText" TEXT,
    "banglaText" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_corner_notifications" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_corner_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_goals_studentProfileId_status_idx" ON "student_goals"("studentProfileId", "status");

-- CreateIndex
CREATE INDEX "saved_reflections_studentProfileId_idx" ON "saved_reflections"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_reflections_studentProfileId_type_referenceKey_key" ON "saved_reflections"("studentProfileId", "type", "referenceKey");

-- CreateIndex
CREATE INDEX "student_corner_notifications_studentProfileId_read_idx" ON "student_corner_notifications"("studentProfileId", "read");

-- CreateIndex
CREATE INDEX "student_corner_notifications_studentProfileId_createdAt_idx" ON "student_corner_notifications"("studentProfileId", "createdAt");

-- AddForeignKey
ALTER TABLE "student_goals" ADD CONSTRAINT "student_goals_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_reflections" ADD CONSTRAINT "saved_reflections_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_corner_notifications" ADD CONSTRAINT "student_corner_notifications_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
