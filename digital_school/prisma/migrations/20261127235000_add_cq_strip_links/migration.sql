-- Multi-device DB-backed CQ Top-Cover Part 1 <-> Part 2 Blind-Grading Serial Linker
CREATE TABLE IF NOT EXISTS "cq_strip_links" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "studentId" TEXT,
    "rollNumber" TEXT,
    "registrationNo" TEXT,
    "studentName" TEXT,
    "obtainedMarksCQ" DOUBLE PRECISION,
    "headExaminerMarks" DOUBLE PRECISION,
    "examinerCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WAITING_PART2',
    "part1ScannedAt" TIMESTAMP(3),
    "part2ScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cq_strip_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cq_strip_links_examId_serial_key" ON "cq_strip_links"("examId", "serial");
CREATE INDEX IF NOT EXISTS "cq_strip_links_examId_status_idx" ON "cq_strip_links"("examId", "status");
CREATE INDEX IF NOT EXISTS "cq_strip_links_serial_idx" ON "cq_strip_links"("serial");
