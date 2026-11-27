-- Enforce strict 4-digit numeric Roll (0001-9999) and 6-digit numeric Registration No (100000-999999)
-- for every student in student_profiles, safely migrating all existing records without data loss.

-- 1. Temporarily normalize registrationNo to unique temporary placeholders to avoid unique-key collisions during renumbering
UPDATE "student_profiles"
SET "registrationNo" = 'TMP_' || "id"
WHERE "registrationNo" !~ '^[0-9]{6}$';

-- 2. Assign clean unique 6-digit numeric registration numbers (starting at 260001) to any non-6-digit students
WITH ranked_reg AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "student_profiles"
  WHERE "registrationNo" !~ '^[0-9]{6}$'
),
max_existing AS (
  SELECT COALESCE(MAX(CAST("registrationNo" AS INTEGER)), 260000) AS base_reg
  FROM "student_profiles"
  WHERE "registrationNo" ~ '^[0-9]{6}$'
)
UPDATE "student_profiles" sp
SET "registrationNo" = LPAD((m.base_reg + rr.rn)::TEXT, 6, '0')
FROM ranked_reg rr, max_existing m
WHERE sp."id" = rr."id";

-- 3. Normalize rolls:
--    - If roll is already 1..4 pure digits (e.g. '1', '01', '12', '25'), zero-pad to 4 digits ('0001', '0012', '0025')
--    - Otherwise (e.g. 'ROLL1773...', '2203044'), assign sequential 4-digit rolls starting at 1001
WITH normalized AS (
  SELECT
    "id",
    "classId",
    "createdAt",
    CASE
      WHEN "roll" ~ '^[0-9]{1,4}$' AND CAST("roll" AS INTEGER) > 0
        THEN LPAD(CAST("roll" AS INTEGER)::TEXT, 4, '0')
      ELSE NULL
    END AS candidate_roll
  FROM "student_profiles"
),
deduped AS (
  SELECT
    "id",
    "classId",
    "createdAt",
    candidate_roll,
    ROW_NUMBER() OVER (PARTITION BY "classId", candidate_roll ORDER BY "createdAt" ASC, "id" ASC) AS dup_rn
  FROM normalized
),
needs_roll AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS seq_rn
  FROM deduped
  WHERE candidate_roll IS NULL OR dup_rn > 1
)
UPDATE "student_profiles" sp
SET "roll" = COALESCE(
  (SELECT d.candidate_roll FROM deduped d WHERE d."id" = sp."id" AND d.candidate_roll IS NOT NULL AND d.dup_rn = 1),
  (SELECT LPAD((1000 + nr.seq_rn)::TEXT, 4, '0') FROM needs_roll nr WHERE nr."id" = sp."id")
);

-- 4. Enforce 4-digit Roll and 6-digit Registration at the database level
ALTER TABLE "student_profiles"
  DROP CONSTRAINT IF EXISTS "student_profiles_roll_4digit_chk",
  DROP CONSTRAINT IF EXISTS "student_profiles_reg_6digit_chk";

ALTER TABLE "student_profiles"
  ADD CONSTRAINT "student_profiles_roll_4digit_chk" CHECK ("roll" ~ '^[0-9]{4}$'),
  ADD CONSTRAINT "student_profiles_reg_6digit_chk" CHECK ("registrationNo" ~ '^[0-9]{6}$');
