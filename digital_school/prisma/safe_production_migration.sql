-- Safe Incremental Migration for Production Database
-- This script checks for existing objects before creating them
-- Preserves all existing data while adding new features

-- ============================================
-- MIGRATION 1: init_local (20260204073345)
-- ============================================

-- Create SubmissionStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "SubmissionStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to ExamSubmission if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "ExamSubmission" ADD COLUMN "status" "SubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add maintenanceMode to settings if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "settings" ADD COLUMN "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create exam_halls table if it doesn't exist
CREATE TABLE IF NOT EXISTS "exam_halls" (
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

-- Create seat_allocations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "seat_allocations" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "seatLabel" TEXT NOT NULL,
    CONSTRAINT "seat_allocations_pkey" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "seat_allocations_examId_studentId_key" ON "seat_allocations" ("examId", "studentId");

CREATE INDEX IF NOT EXISTS "ExamSubmission_status_idx" ON "ExamSubmission" ("status");

CREATE INDEX IF NOT EXISTS "ExamSubmission_score_idx" ON "ExamSubmission" ("score");

CREATE INDEX IF NOT EXISTS "ExamSubmission_submittedAt_idx" ON "ExamSubmission" ("submittedAt");

CREATE INDEX IF NOT EXISTS "ExamSubmission_examId_idx" ON "ExamSubmission" ("examId");

CREATE INDEX IF NOT EXISTS "activity_audits_date_idx" ON "activity_audits" ("date");

CREATE INDEX IF NOT EXISTS "activity_audits_module_idx" ON "activity_audits" ("module");

CREATE INDEX IF NOT EXISTS "admit_cards_qrCode_idx" ON "admit_cards" ("qrCode");

CREATE INDEX IF NOT EXISTS "ai_activities_createdAt_idx" ON "ai_activities" ("createdAt");

CREATE INDEX IF NOT EXISTS "ai_activities_userId_idx" ON "ai_activities" ("userId");

CREATE INDEX IF NOT EXISTS "exams_createdAt_idx" ON "exams" ("createdAt");

CREATE INDEX IF NOT EXISTS "exams_classId_idx" ON "exams" ("classId");

CREATE INDEX IF NOT EXISTS "export_jobs_createdAt_idx" ON "export_jobs" ("createdAt");

CREATE INDEX IF NOT EXISTS "logs_timestamp_idx" ON "logs" ("timestamp");

CREATE INDEX IF NOT EXISTS "logs_action_idx" ON "logs" ("action");

CREATE INDEX IF NOT EXISTS "logs_userId_idx" ON "logs" ("userId");

CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications" ("userId", "isRead");

CREATE INDEX IF NOT EXISTS "questions_type_idx" ON "questions" ("type");

CREATE INDEX IF NOT EXISTS "questions_subject_idx" ON "questions" ("subject");

CREATE INDEX IF NOT EXISTS "questions_difficulty_idx" ON "questions" ("difficulty");

CREATE INDEX IF NOT EXISTS "questions_topic_idx" ON "questions" ("topic");

CREATE INDEX IF NOT EXISTS "questions_hasMath_idx" ON "questions" ("hasMath");

CREATE INDEX IF NOT EXISTS "questions_createdAt_idx" ON "questions" ("createdAt");

CREATE INDEX IF NOT EXISTS "questions_createdById_idx" ON "questions" ("createdById");

CREATE INDEX IF NOT EXISTS "questions_classId_idx" ON "questions" ("classId");

CREATE INDEX IF NOT EXISTS "results_examId_idx" ON "results" ("examId");

CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");

-- Add foreign keys if they don't exist (safe with IF NOT EXISTS equivalent)
DO $$ BEGIN
    ALTER TABLE "exam_halls" ADD CONSTRAINT "exam_halls_instituteId_fkey" 
        FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

EXCEPTION WHEN duplicate_object THEN null;

END $$;

DO $$ BEGIN
    ALTER TABLE "seat_allocations" ADD CONSTRAINT "seat_allocations_examId_fkey" 
        FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "seat_allocations" ADD CONSTRAINT "seat_allocations_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "seat_allocations" ADD CONSTRAINT "seat_allocations_hallId_fkey" 
        FOREIGN KEY ("hallId") REFERENCES "exam_halls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- MIGRATION 2: school_management (20260205132340)
-- ============================================

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'TEST_SCHEDULED', 'TEST_COMPLETED', 'ACCEPTED', 'REJECTED', 'ADMITTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FeeFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'ONE_TIME');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'CARD', 'UPI', 'MOBILE_BANKING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DocumentType" AS ENUM ('INVOICE', 'RECEIPT', 'CERTIFICATE', 'ADMIT_CARD', 'ID_CARD', 'TRANSFER_CERTIFICATE', 'ADMISSION_LETTER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admission_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS "admission_applications" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "photo" TEXT,
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "guardianEmail" TEXT,
    "address" TEXT NOT NULL,
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "previousGPA" DOUBLE PRECISION,
    "applyingForClass" TEXT NOT NULL,
    "applyingForClassId" TEXT,
    "birthCertificate" TEXT,
    "previousMarksheet" TEXT,
    "transferCertificate" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "testScore" DOUBLE PRECISION,
    "testDate" TIMESTAMP(3),
    "admittedAt" TIMESTAMP(3),
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- Create fee_structures table if it doesn't exist
CREATE TABLE IF NOT EXISTS "fee_structures" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "tuitionFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "admissionFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "examFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "libraryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sportsFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "frequency" "FeeFrequency" NOT NULL DEFAULT 'ANNUAL',
    "dueDay" INTEGER,
    "siblingDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meritDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAmount" DOUBLE PRECISION NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "qrCode" TEXT NOT NULL,
    "verificationUrl" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionId" TEXT,
    "bankReference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "qrCode" TEXT NOT NULL,
    "verificationUrl" TEXT NOT NULL,
    "notes" TEXT,
    "collectedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Create verifiable_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS "verifiable_documents" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "qrHash" TEXT NOT NULL,
    "verificationUrl" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "verifiable_documents_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes for school management tables
CREATE UNIQUE INDEX IF NOT EXISTS "admission_applications_applicationNo_key" ON "admission_applications" ("applicationNo");

CREATE UNIQUE INDEX IF NOT EXISTS "admission_applications_studentId_key" ON "admission_applications" ("studentId");

CREATE INDEX IF NOT EXISTS "admission_applications_status_idx" ON "admission_applications" ("status");

CREATE INDEX IF NOT EXISTS "admission_applications_appliedAt_idx" ON "admission_applications" ("appliedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_key" ON "invoices" ("invoiceNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_qrCode_key" ON "invoices" ("qrCode");

CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" ("status");

CREATE INDEX IF NOT EXISTS "invoices_studentId_idx" ON "invoices" ("studentId");

CREATE INDEX IF NOT EXISTS "invoices_dueDate_idx" ON "invoices" ("dueDate");

CREATE UNIQUE INDEX IF NOT EXISTS "payments_receiptNumber_key" ON "payments" ("receiptNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "payments_qrCode_key" ON "payments" ("qrCode");

CREATE INDEX IF NOT EXISTS "payments_paymentDate_idx" ON "payments" ("paymentDate");

CREATE INDEX IF NOT EXISTS "payments_invoiceId_idx" ON "payments" ("invoiceId");

CREATE UNIQUE INDEX IF NOT EXISTS "verifiable_documents_documentNumber_key" ON "verifiable_documents" ("documentNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "verifiable_documents_qrHash_key" ON "verifiable_documents" ("qrHash");

CREATE INDEX IF NOT EXISTS "verifiable_documents_qrHash_idx" ON "verifiable_documents" ("qrHash");

CREATE INDEX IF NOT EXISTS "verifiable_documents_documentNumber_idx" ON "verifiable_documents" ("documentNumber");

-- Add foreign keys for school management tables
DO $$ BEGIN
    ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_applyingForClassId_fkey" 
        FOREIGN KEY ("applyingForClassId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

EXCEPTION WHEN duplicate_object THEN null;

END $$;

DO $$ BEGIN
    ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_reviewedBy_fkey" 
        FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_classId_fkey" 
        FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_feeStructureId_fkey" 
        FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdBy_fkey" 
        FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_collectedBy_fkey" 
        FOREIGN KEY ("collectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- MIGRATION 3: add_fbd_to_questions (20260206055459)
-- ============================================

-- Add fbd column to questions if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "questions" ADD COLUMN "fbd" JSONB;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- ============================================
-- Mark migrations as applied in Prisma
-- ============================================

-- Insert migration records if they don't exist
INSERT INTO
    "_prisma_migrations" (
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
    )
SELECT gen_random_uuid (), '', NOW(), '20260204073345_init_local', NULL, NULL, NOW(), 1
WHERE
    NOT EXISTS (
        SELECT 1
        FROM "_prisma_migrations"
        WHERE
            migration_name = '20260204073345_init_local'
    );

INSERT INTO
    "_prisma_migrations" (
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
    )
SELECT gen_random_uuid (), '', NOW(), '20260205132340_add_school_management_system', NULL, NULL, NOW(), 1
WHERE
    NOT EXISTS (
        SELECT 1
        FROM "_prisma_migrations"
        WHERE
            migration_name = '20260205132340_add_school_management_system'
    );

INSERT INTO
    "_prisma_migrations" (
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
    )
SELECT gen_random_uuid (), '', NOW(), '20260206055459_add_fbd_to_questions', NULL, NULL, NOW(), 1
WHERE
    NOT EXISTS (
        SELECT 1
        FROM "_prisma_migrations"
        WHERE
            migration_name = '20260206055459_add_fbd_to_questions'
    );

-- ============================================
-- Verification Queries
-- ============================================

-- Check that all new tables exist
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE
                table_name = 'exam_halls'
        ) THEN '✓'
        ELSE '✗'
    END AS exam_halls,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE
                table_name = 'seat_allocations'
        ) THEN '✓'
        ELSE '✗'
    END AS seat_allocations,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE
                table_name = 'admission_applications'
        ) THEN '✓'
        ELSE '✗'
    END AS admission_applications,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE
                table_name = 'fee_structures'
        ) THEN '✓'
        ELSE '✗'
    END AS fee_structures,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE
                table_name = 'invoices'
        ) THEN '✓'
        ELSE '✗'
    END AS invoices,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE
                table_name = 'payments'
        ) THEN '✓'
        ELSE '✗'
    END AS payments,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE
                table_name = 'verifiable_documents'
        ) THEN '✓'
        ELSE '✗'
    END AS verifiable_documents;

-- Check that fbd column exists in questions
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE
                table_name = 'questions'
                AND column_name = 'fbd'
        ) THEN '✓ fbd column exists'
        ELSE '✗ fbd column missing'
    END AS fbd_column_status;

-- Show migration status
SELECT migration_name, finished_at
FROM "_prisma_migrations"
WHERE
    migration_name IN (
        '20260204073345_init_local',
        '20260205132340_add_school_management_system',
        '20260206055459_add_fbd_to_questions'
    )
ORDER BY finished_at DESC;