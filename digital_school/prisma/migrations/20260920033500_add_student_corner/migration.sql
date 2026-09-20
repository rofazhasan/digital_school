-- CreateEnum
CREATE TYPE "DayMode" AS ENUM ('NORMAL', 'STRICT', 'LOCKED');

-- CreateEnum
CREATE TYPE "ChallengeCategory" AS ENUM ('STUDY', 'CODING', 'SALAT', 'QURAN', 'HABIT', 'EXERCISE', 'READING', 'DIET', 'ASSIGNMENT', 'REVISION', 'EXAM_PREP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ChallengePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FocusSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "student_corner_profiles" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 240,
    "defaultDayMode" "DayMode" NOT NULL DEFAULT 'NORMAL',
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredCategories" "ChallengeCategory"[] DEFAULT ARRAY['STUDY', 'CODING', 'SALAT', 'QURAN', 'REVISION']::"ChallengeCategory"[],
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_corner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_corner_subjects" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_corner_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_corner_topics" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_corner_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_arenas" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mode" "DayMode" NOT NULL DEFAULT 'NORMAL',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "summary" JSONB,
    "notes" TEXT,
    "totalPlannedMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalCompletedMinutes" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_arenas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arena_challenges" (
    "id" TEXT NOT NULL,
    "arenaId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ChallengeCategory" NOT NULL DEFAULT 'STUDY',
    "customCategoryName" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "scheduledTime" TEXT,
    "priority" "ChallengePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ChallengeStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "actualMinutesSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arena_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_subject_maps" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "challenge_subject_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_topic_maps" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "challenge_topic_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_focus_sessions" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "arenaId" TEXT NOT NULL,
    "challengeId" TEXT,
    "plannedDurationMinutes" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plannedEnd" TIMESTAMP(3) NOT NULL,
    "actualEnd" TIMESTAMP(3),
    "status" "FocusSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "secondsElapsed" INTEGER NOT NULL DEFAULT 0,
    "pauseCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_exams" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "location" TEXT,
    "priority" "ChallengePriority" NOT NULL DEFAULT 'HIGH',
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_quran_ayahs" (
    "id" INTEGER NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "surahNameArabic" TEXT NOT NULL,
    "surahNameBangla" TEXT NOT NULL,
    "surahNameEnglish" TEXT NOT NULL,
    "ayahNumber" INTEGER NOT NULL,
    "arabicText" TEXT NOT NULL,
    "banglaPronunciation" TEXT NOT NULL,
    "banglaMeaning" TEXT NOT NULL,
    "englishMeaning" TEXT,
    "theme" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_quran_ayahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_hadiths" (
    "id" INTEGER NOT NULL,
    "arabicText" TEXT,
    "banglaText" TEXT NOT NULL,
    "englishText" TEXT,
    "sourceBook" TEXT NOT NULL,
    "hadithNumber" TEXT NOT NULL,
    "chapter" TEXT,
    "grade" TEXT NOT NULL,
    "theme" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_hadiths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arena_audit_logs" (
    "id" TEXT NOT NULL,
    "arenaId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arena_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_corner_profiles_studentProfileId_key" ON "student_corner_profiles"("studentProfileId");

-- CreateIndex
CREATE INDEX "student_corner_profiles_studentProfileId_idx" ON "student_corner_profiles"("studentProfileId");

-- CreateIndex
CREATE INDEX "student_corner_subjects_studentProfileId_idx" ON "student_corner_subjects"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "student_corner_subjects_studentProfileId_name_key" ON "student_corner_subjects"("studentProfileId", "name");

-- CreateIndex
CREATE INDEX "student_corner_topics_subjectId_idx" ON "student_corner_topics"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "student_corner_topics_subjectId_name_key" ON "student_corner_topics"("subjectId", "name");

-- CreateIndex
CREATE INDEX "daily_arenas_studentProfileId_date_idx" ON "daily_arenas"("studentProfileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_arenas_studentProfileId_date_key" ON "daily_arenas"("studentProfileId", "date");

-- CreateIndex
CREATE INDEX "arena_challenges_arenaId_orderIndex_idx" ON "arena_challenges"("arenaId", "orderIndex");

-- CreateIndex
CREATE INDEX "arena_challenges_studentProfileId_status_idx" ON "arena_challenges"("studentProfileId", "status");

-- CreateIndex
CREATE INDEX "challenge_subject_maps_challengeId_idx" ON "challenge_subject_maps"("challengeId");

-- CreateIndex
CREATE INDEX "challenge_subject_maps_subjectId_idx" ON "challenge_subject_maps"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_subject_maps_challengeId_subjectId_key" ON "challenge_subject_maps"("challengeId", "subjectId");

-- CreateIndex
CREATE INDEX "challenge_topic_maps_challengeId_idx" ON "challenge_topic_maps"("challengeId");

-- CreateIndex
CREATE INDEX "challenge_topic_maps_topicId_idx" ON "challenge_topic_maps"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_topic_maps_challengeId_topicId_key" ON "challenge_topic_maps"("challengeId", "topicId");

-- CreateIndex
CREATE INDEX "student_focus_sessions_studentProfileId_startedAt_idx" ON "student_focus_sessions"("studentProfileId", "startedAt");

-- CreateIndex
CREATE INDEX "student_focus_sessions_arenaId_idx" ON "student_focus_sessions"("arenaId");

-- CreateIndex
CREATE INDEX "student_focus_sessions_challengeId_idx" ON "student_focus_sessions"("challengeId");

-- CreateIndex
CREATE INDEX "personal_exams_studentProfileId_examDate_idx" ON "personal_exams"("studentProfileId", "examDate");

-- CreateIndex
CREATE INDEX "daily_quran_ayahs_id_idx" ON "daily_quran_ayahs"("id");

-- CreateIndex
CREATE INDEX "daily_hadiths_id_idx" ON "daily_hadiths"("id");

-- CreateIndex
CREATE INDEX "arena_audit_logs_arenaId_createdAt_idx" ON "arena_audit_logs"("arenaId", "createdAt");

-- CreateIndex
CREATE INDEX "arena_audit_logs_studentProfileId_idx" ON "arena_audit_logs"("studentProfileId");

-- AddForeignKey
ALTER TABLE "student_corner_profiles" ADD CONSTRAINT "student_corner_profiles_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_corner_subjects" ADD CONSTRAINT "student_corner_subjects_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_corner_topics" ADD CONSTRAINT "student_corner_topics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "student_corner_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_arenas" ADD CONSTRAINT "daily_arenas_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_challenges" ADD CONSTRAINT "arena_challenges_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "daily_arenas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_challenges" ADD CONSTRAINT "arena_challenges_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_subject_maps" ADD CONSTRAINT "challenge_subject_maps_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "arena_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_subject_maps" ADD CONSTRAINT "challenge_subject_maps_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "student_corner_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_topic_maps" ADD CONSTRAINT "challenge_topic_maps_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "arena_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_topic_maps" ADD CONSTRAINT "challenge_topic_maps_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "student_corner_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_focus_sessions" ADD CONSTRAINT "student_focus_sessions_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_focus_sessions" ADD CONSTRAINT "student_focus_sessions_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "daily_arenas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_focus_sessions" ADD CONSTRAINT "student_focus_sessions_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "arena_challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_exams" ADD CONSTRAINT "personal_exams_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_audit_logs" ADD CONSTRAINT "arena_audit_logs_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "daily_arenas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_audit_logs" ADD CONSTRAINT "arena_audit_logs_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

