"""
Enterprise Local PostgreSQL Persistence Layer for OMR & CQ Test Benchmarks
Implements:
- Production schema with normalized relational structure
- Indices on foreign keys & query predicates (per postgres-best-practices skill)
- Transactional batch ingestion via psycopg2.extras.execute_values
- Automated Tabulation & GPA calculation
"""

import sys
import time
import psycopg2
import psycopg2.extras


def get_db_connection():
    """
    Connects to local PostgreSQL digital_school database.
    """
    try:
        conn = psycopg2.connect(
            dbname="digital_school",
            user="md.rofazhasanrafiu",
            host="localhost",
            port=5432
        )
        conn.autocommit = False
        return conn
    except Exception as e:
        print(f"Error connecting to local PostgreSQL: {e}")
        raise e


def init_benchmark_schema(conn):
    """
    Creates enterprise benchmark tables with optimal indices.
    """
    cur = conn.cursor()
    cur.execute("""
    -- 1. Cohort Students Table
    CREATE TABLE IF NOT EXISTS omr_benchmark_cohort (
        student_id VARCHAR(50) PRIMARY KEY,
        roll_number INT UNIQUE NOT NULL,
        reg_number BIGINT NOT NULL,
        student_name VARCHAR(150) NOT NULL,
        college_name VARCHAR(200) NOT NULL,
        batch_year VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Academic Exams Table
    CREATE TABLE IF NOT EXISTS omr_benchmark_exams (
        exam_id VARCHAR(50) PRIMARY KEY,
        exam_name VARCHAR(150) NOT NULL,
        subject_code INT NOT NULL,
        exam_type VARCHAR(50) NOT NULL,
        total_mcq_marks FLOAT NOT NULL,
        total_cq_marks FLOAT NOT NULL,
        total_marks FLOAT NOT NULL,
        pass_marks FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. OMR MCQ Scans Table
    CREATE TABLE IF NOT EXISTS omr_benchmark_scans (
        id VARCHAR(64) PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES omr_benchmark_cohort(student_id) ON DELETE CASCADE,
        roll_number INT NOT NULL,
        exam_id VARCHAR(50) REFERENCES omr_benchmark_exams(exam_id) ON DELETE CASCADE,
        sheet_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        detected_set VARCHAR(10) NOT NULL,
        score FLOAT NOT NULL,
        total_questions INT NOT NULL,
        correct_count INT NOT NULL,
        wrong_count INT NOT NULL,
        unattempted_count INT NOT NULL,
        confidence_score FLOAT NOT NULL,
        processing_ms FLOAT NOT NULL,
        augmentation_profile VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Bangladesh Board CQ Top Sheet Scans Table
    CREATE TABLE IF NOT EXISTS omr_benchmark_cq_sheets (
        id VARCHAR(64) PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES omr_benchmark_cohort(student_id) ON DELETE CASCADE,
        roll_number INT NOT NULL,
        exam_id VARCHAR(50) REFERENCES omr_benchmark_exams(exam_id) ON DELETE CASCADE,
        subject_code INT NOT NULL,
        examiner_code INT NOT NULL,
        obtained_marks_omr INT NOT NULL,
        audit_status VARCHAR(50) NOT NULL,
        is_verified BOOLEAN NOT NULL,
        processing_ms FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Student Final Tabulation & GPA Results Table
    CREATE TABLE IF NOT EXISTS omr_benchmark_tabulation (
        id VARCHAR(64) PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES omr_benchmark_cohort(student_id) ON DELETE CASCADE,
        roll_number INT UNIQUE NOT NULL,
        student_name VARCHAR(150) NOT NULL,
        total_aggregate_marks FLOAT NOT NULL,
        gpa FLOAT NOT NULL,
        letter_grade VARCHAR(10) NOT NULL,
        failed_subjects_count INT NOT NULL,
        merit_rank INT NOT NULL,
        is_passed BOOLEAN NOT NULL,
        results_breakdown JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Optimized Indices (postgres-best-practices)
    CREATE INDEX IF NOT EXISTS idx_omr_scans_roll ON omr_benchmark_scans(roll_number);
    CREATE INDEX IF NOT EXISTS idx_omr_scans_exam ON omr_benchmark_scans(exam_id);
    CREATE INDEX IF NOT EXISTS idx_omr_scans_status ON omr_benchmark_scans(status);

    CREATE INDEX IF NOT EXISTS idx_cq_sheets_roll ON omr_benchmark_cq_sheets(roll_number);
    CREATE INDEX IF NOT EXISTS idx_cq_sheets_exam ON omr_benchmark_cq_sheets(exam_id);
    CREATE INDEX IF NOT EXISTS idx_cq_sheets_status ON omr_benchmark_cq_sheets(audit_status);

    CREATE INDEX IF NOT EXISTS idx_tabulation_rank ON omr_benchmark_tabulation(merit_rank);
    CREATE INDEX IF NOT EXISTS idx_tabulation_gpa ON omr_benchmark_tabulation(gpa DESC, total_aggregate_marks DESC);
    """)
    conn.commit()
    cur.close()


def batch_insert_students(conn, students):
    cur = conn.cursor()
    query = """
    INSERT INTO omr_benchmark_cohort (student_id, roll_number, reg_number, student_name, college_name, batch_year)
    VALUES %s
    ON CONFLICT (roll_number) DO UPDATE SET
        student_name = EXCLUDED.student_name,
        reg_number = EXCLUDED.reg_number;
    """
    records = [
        (s['student_id'], s['roll_number'], s['reg_number'], s['student_name'], s['college_name'], s['batch_year'])
        for s in students
    ]
    psycopg2.extras.execute_values(cur, query, records)
    conn.commit()
    cur.close()


def batch_insert_exams(conn, exams):
    cur = conn.cursor()
    query = """
    INSERT INTO omr_benchmark_exams (exam_id, exam_name, subject_code, exam_type, total_mcq_marks, total_cq_marks, total_marks, pass_marks)
    VALUES %s
    ON CONFLICT (exam_id) DO UPDATE SET
        exam_name = EXCLUDED.exam_name,
        total_marks = EXCLUDED.total_marks;
    """
    records = [
        (e['exam_id'], e['exam_name'], e['subject_code'], e['exam_type'], e['total_mcq_marks'], e['total_cq_marks'], e['total_marks'], e['pass_marks'])
        for e in exams
    ]
    psycopg2.extras.execute_values(cur, query, records)
    conn.commit()
    cur.close()


def batch_insert_mcq_scans(conn, scans):
    cur = conn.cursor()
    query = """
    INSERT INTO omr_benchmark_scans (
        id, student_id, roll_number, exam_id, sheet_type, status,
        detected_set, score, total_questions, correct_count, wrong_count,
        unattempted_count, confidence_score, processing_ms, augmentation_profile
    ) VALUES %s
    ON CONFLICT (id) DO NOTHING;
    """
    records = [
        (
            s['id'], s['student_id'], s['roll_number'], s['exam_id'], s['sheet_type'], s['status'],
            s['detected_set'], s['score'], s['total_questions'], s['correct_count'], s['wrong_count'],
            s['unattempted_count'], s['confidence_score'], s['processing_ms'], s['augmentation_profile']
        )
        for s in scans
    ]
    psycopg2.extras.execute_values(cur, query, records)
    conn.commit()
    cur.close()


def batch_insert_cq_scans(conn, cq_scans):
    cur = conn.cursor()
    query = """
    INSERT INTO omr_benchmark_cq_sheets (
        id, student_id, roll_number, exam_id, subject_code,
        examiner_code, obtained_marks_omr, audit_status, is_verified, processing_ms
    ) VALUES %s
    ON CONFLICT (id) DO NOTHING;
    """
    records = [
        (
            c['id'], c['student_id'], c['roll_number'], c['exam_id'], c['subject_code'],
            c['examiner_code'], c['obtained_marks_omr'], c['audit_status'], c['is_verified'], c['processing_ms']
        )
        for c in cq_scans
    ]
    psycopg2.extras.execute_values(cur, query, records)
    conn.commit()
    cur.close()


def batch_insert_tabulations(conn, tabulations):
    import json
    cur = conn.cursor()
    query = """
    INSERT INTO omr_benchmark_tabulation (
        id, student_id, roll_number, student_name, total_aggregate_marks,
        gpa, letter_grade, failed_subjects_count, merit_rank, is_passed, results_breakdown
    ) VALUES %s
    ON CONFLICT (roll_number) DO UPDATE SET
        total_aggregate_marks = EXCLUDED.total_aggregate_marks,
        gpa = EXCLUDED.gpa,
        letter_grade = EXCLUDED.letter_grade,
        failed_subjects_count = EXCLUDED.failed_subjects_count,
        merit_rank = EXCLUDED.merit_rank,
        is_passed = EXCLUDED.is_passed,
        results_breakdown = EXCLUDED.results_breakdown;
    """
    records = [
        (
            t['id'], t['student_id'], t['roll_number'], t['student_name'], t['total_aggregate_marks'],
            t['gpa'], t['letter_grade'], t['failed_subjects_count'], t['merit_rank'], t['is_passed'], json.dumps(t['results_breakdown'])
        )
        for t in tabulations
    ]
    psycopg2.extras.execute_values(cur, query, records)
    conn.commit()
    cur.close()

