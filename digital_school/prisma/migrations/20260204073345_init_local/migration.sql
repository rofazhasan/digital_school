-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- DropForeignKey
ALTER TABLE "QuestionVersion" DROP CONSTRAINT "QuestionVersion_questionId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_clonedFromId_fkey";

-- AlterTable
ALTER TABLE "ExamSubmission" ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "exam_halls" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roomNo" TEXT,
    "capacity" INTEGER NOT NULL,
    "rows" INTEGER NOT NULL DEFAULT 5,
    "columns" INTEGER NOT NULL DEFAULT 4,
    "seatsPerBench" INTEGER NOT NULL DEFAULT 2,
    "instituteId" TEXT NOT NULL,

    CONSTRAINT "exam_halls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_allocations" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "seatLabel" TEXT NOT NULL,

    CONSTRAINT "seat_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seat_allocations_examId_studentId_key" ON "seat_allocations"("examId", "studentId");

-- CreateIndex
CREATE INDEX "ExamSubmission_status_idx" ON "ExamSubmission"("status");

-- CreateIndex
CREATE INDEX "ExamSubmission_score_idx" ON "ExamSubmission"("score");

-- CreateIndex
CREATE INDEX "ExamSubmission_submittedAt_idx" ON "ExamSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "ExamSubmission_examId_idx" ON "ExamSubmission"("examId");

-- CreateIndex
CREATE INDEX "activity_audits_date_idx" ON "activity_audits"("date");

-- CreateIndex
CREATE INDEX "activity_audits_module_idx" ON "activity_audits"("module");

-- CreateIndex
CREATE INDEX "admit_cards_qrCode_idx" ON "admit_cards"("qrCode");

-- CreateIndex
CREATE INDEX "ai_activities_createdAt_idx" ON "ai_activities"("createdAt");

-- CreateIndex
CREATE INDEX "ai_activities_userId_idx" ON "ai_activities"("userId");

-- CreateIndex
CREATE INDEX "exams_createdAt_idx" ON "exams"("createdAt");

-- CreateIndex
CREATE INDEX "exams_classId_idx" ON "exams"("classId");

-- CreateIndex
CREATE INDEX "export_jobs_createdAt_idx" ON "export_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "logs_timestamp_idx" ON "logs"("timestamp");

-- CreateIndex
CREATE INDEX "logs_action_idx" ON "logs"("action");

-- CreateIndex
CREATE INDEX "logs_userId_idx" ON "logs"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "questions_type_idx" ON "questions"("type");

-- CreateIndex
CREATE INDEX "questions_subject_idx" ON "questions"("subject");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "questions_topic_idx" ON "questions"("topic");

-- CreateIndex
CREATE INDEX "questions_hasMath_idx" ON "questions"("hasMath");

-- CreateIndex
CREATE INDEX "questions_createdAt_idx" ON "questions"("createdAt");

-- CreateIndex
CREATE INDEX "questions_createdById_idx" ON "questions"("createdById");

-- CreateIndex
CREATE INDEX "questions_classId_idx" ON "questions"("classId");

-- CreateIndex
CREATE INDEX "results_examId_idx" ON "results"("examId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_halls" ADD CONSTRAINT "exam_halls_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_allocations" ADD CONSTRAINT "seat_allocations_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_allocations" ADD CONSTRAINT "seat_allocations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_allocations" ADD CONSTRAINT "seat_allocations_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "exam_halls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
