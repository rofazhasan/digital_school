"""
Class Cohort & 15-Exam Simulation Engine
Generates:
- 50 Realistic Bangladeshi High School / College Students (Class 12 / HSC Batch)
- 15 Comprehensive Board & Admission Examination Specs
- 1,150 Physical OMR MCQ & CQ Cover Sheets under Human-Like Physical Degradations
- Evaluates grading, GPA (5.0 scale), Letter Grades, and Merit List Rankings
"""

import math
import random
import time
import uuid
import numpy as np
import cv2

from math_vision_model import GeometricHomographyEngine, HybridBubbleDetector
from data_augmentation import PhysicalAugmentationPipeline
from cq_top_sheet_engine import BangladeshBoardCQScanner, CANONICAL_CQ_W, CANONICAL_CQ_H, FIDUCIAL_COORDS

# Standard OMR Canvas Dimensions
CANONICAL_OMR_W = 1060
CANONICAL_OMR_H = 1500
OMR_FIDUCIALS = [
    [40, 40],
    [1020, 40],
    [1020, 1460],
    [40, 1460]
]

STUDENT_NAMES = [
    "Md. Tanvir Ahmed", "Nusrat Jahan", "Rofaz Hasan", "Anika Tabassum", "Sabbir Hossain",
    "Fatima Tuz Zohra", "Mahmudul Hasan", "Tasnim Rahman", "Abdur Rahman", "Sumaiya Akter",
    "Shahriar Kabir", "Sadia Islam", "Mehedi Hasan", "Nafisa Kamal", "Zubair Al Mahmud",
    "Farzana Yeasmin", "Al-Amin Sheikh", "Tahmina Begum", "Nazmul Huda", "Jannatul Ferdous",
    "Rayhan Chowdhury", "Afsana Mimi", "Imran Hossain", "Ishrat Jahan", "Ashraful Islam",
    "Samia Sultana", "Habibur Rahman", "Marufa Khatun", "Shohel Rana", "Ruma Parvin",
    "Kawsar Ahmed", "Sharmin Sultana", "Tariqul Islam", "Priyanka Roy", "Sourav Saha",
    "Dipok Kumar", "Bishal Das", "Puja Chakraborty", "Arifur Rahman", "Sultana Razia",
    "Morshed Alam", "Shamima Nasrin", "Golam Kibria", "Farhana Sharmin", "Enamul Haque",
    "Sabina Yasmin", "Asaduzzaman Noor", "Hasibul Islam", "Munira Parveen", "Khaled Mahmud"
]

COLLEGES = [
    "Dhaka Residential Model College",
    "Notre Dame College, Dhaka",
    "Viqarunnisa Noon School & College",
    "Rajuk Uttara Model College",
    "Holy Cross College, Dhaka"
]

EXAMS_SPEC = [
    # 8 Board Core Theory Subjects (MCQ + CQ)
    {'id': 'phy_1st', 'name': 'Physics 1st Paper', 'sub_code': 174, 'type': 'BOARD_MCQ_CQ', 'mcq_q': 25, 'mcq_m': 25, 'cq_m': 50, 'tot_m': 75, 'pass': 25.0},
    {'id': 'phy_2nd', 'name': 'Physics 2nd Paper', 'sub_code': 175, 'type': 'BOARD_MCQ_CQ', 'mcq_q': 25, 'mcq_m': 25, 'cq_m': 50, 'tot_m': 75, 'pass': 25.0},
    {'id': 'chem_1st', 'name': 'Chemistry 1st Paper', 'sub_code': 176, 'type': 'BOARD_MCQ_CQ', 'mcq_q': 25, 'mcq_m': 25, 'cq_m': 50, 'tot_m': 75, 'pass': 25.0},
    {'id': 'chem_2nd', 'name': 'Chemistry 2nd Paper', 'sub_code': 177, 'type': 'BOARD_MCQ_CQ', 'mcq_q': 25, 'mcq_m': 25, 'cq_m': 50, 'tot_m': 75, 'pass': 25.0},
    {'id': 'math_1st', 'name': 'Higher Mathematics 1st Paper', 'sub_code': 265, 'type': 'BOARD_MCQ_CQ', 'mcq_q': 25, 'mcq_m': 25, 'cq_m': 50, 'tot_m': 75, 'pass': 25.0},
    {'id': 'math_2nd', 'name': 'Higher Mathematics 2nd Paper', 'sub_code': 266, 'type': 'BOARD_MCQ_CQ', 'mcq_q': 25, 'mcq_m': 25, 'cq_m': 50, 'tot_m': 75, 'pass': 25.0},
    {'id': 'bio_1st', 'name': 'Biology 1st Paper', 'sub_code': 178, 'type': 'BOARD_MCQ_CQ', 'mcq_q': 25, 'mcq_m': 25, 'cq_m': 50, 'tot_m': 75, 'pass': 25.0},
    {'id': 'bio_2nd', 'name': 'Biology 2nd Paper', 'sub_code': 179, 'type': 'BOARD_MCQ_CQ', 'mcq_q': 25, 'mcq_m': 25, 'cq_m': 50, 'tot_m': 75, 'pass': 25.0},

    # 4 General Subjects (MCQ / Language)
    {'id': 'ban_1st', 'name': 'Bangla 1st Paper', 'sub_code': 101, 'type': 'BOARD_MCQ_ONLY', 'mcq_q': 30, 'mcq_m': 30, 'cq_m': 0, 'tot_m': 30, 'pass': 10.0},
    {'id': 'ban_2nd', 'name': 'Bangla 2nd Paper', 'sub_code': 102, 'type': 'BOARD_MCQ_ONLY', 'mcq_q': 30, 'mcq_m': 30, 'cq_m': 0, 'tot_m': 30, 'pass': 10.0},
    {'id': 'eng_1st', 'name': 'English 1st Paper', 'sub_code': 107, 'type': 'BOARD_MCQ_ONLY', 'mcq_q': 50, 'mcq_m': 50, 'cq_m': 0, 'tot_m': 50, 'pass': 16.5},
    {'id': 'eng_2nd', 'name': 'English 2nd Paper', 'sub_code': 108, 'type': 'BOARD_MCQ_ONLY', 'mcq_q': 50, 'mcq_m': 50, 'cq_m': 0, 'tot_m': 50, 'pass': 16.5},
    {'id': 'ict', 'name': 'Information & Comm. Technology', 'sub_code': 275, 'type': 'BOARD_MCQ_ONLY', 'mcq_q': 25, 'mcq_m': 25, 'cq_m': 0, 'tot_m': 25, 'pass': 8.5},

    # 2 Admission Tests (100 Questions with Negative Marking -0.25)
    {'id': 'med_adm', 'name': 'Medical Admission Model Test (DGHS)', 'sub_code': 991, 'type': 'ADMISSION_NEG_MARK', 'mcq_q': 100, 'mcq_m': 100, 'cq_m': 0, 'tot_m': 100, 'pass': 40.0},
    {'id': 'du_adm', 'name': 'DU Ka-Unit Admission Test', 'sub_code': 992, 'type': 'ADMISSION_NEG_MARK', 'mcq_q': 100, 'mcq_m': 100, 'cq_m': 0, 'tot_m': 100, 'pass': 40.0}
]

AUGMENTATION_PROFILES = [
    "PRISTINE_SCAN",
    "PHONE_TILT_15DEG",
    "PHONE_TILT_25DEG_SHADOW",
    "FLASHLIGHT_GLARE",
    "FOLDED_WRINKLED",
    "IMPERFECT_FILLS_PENCIL",
    "MOTION_BLUR_JPEG",
    "TORN_CORNER_3MARKER"
]


def create_cohort_students(n=50):
    """
    Creates 50 students with realistic rolls, registrations, names, and academic abilities.
    """
    students = []
    for i in range(n):
        roll = 101001 + i
        reg = 1810000000 + roll * 7 + 139
        name = STUDENT_NAMES[i % len(STUDENT_NAMES)]
        college = COLLEGES[i % len(COLLEGES)]
        # Academic ability profile (mean probability of knowing answer)
        # Follows realistic bell curve
        ability = float(np.clip(random.gauss(0.74, 0.16), 0.35, 0.98))

        students.append({
            'student_id': f"std_hsc26_{roll}",
            'roll_number': roll,
            'reg_number': reg,
            'student_name': name,
            'college_name': college,
            'batch_year': "HSC-2026",
            'ability': ability
        })
    return students


class StandardOMRSheetGenerator:
    """
    Synthesizes standard 25, 30, 50, and 100 question MCQ OMR sheets.
    """
    @staticmethod
    def generate_mcq_sheet(roll_num, set_code, total_q, student_answers):
        """
        Generates canonical OMR sheet bitmap with 4 fiducials and answer bubbles.
        Returns: image, bubble_coordinates_dict
        """
        img = np.ones((CANONICAL_OMR_H, CANONICAL_OMR_W, 3), dtype=np.uint8) * 255

        # 4 Optical Corner Crosshairs
        for cx, cy in OMR_FIDUCIALS:
            cv2.circle(img, (cx, cy), 18, (0, 0, 0), 2)
            cv2.circle(img, (cx, cy), 4, (0, 0, 0), -1)
            cv2.line(img, (cx - 24, cy), (cx + 24, cy), (0, 0, 0), 2)
            cv2.line(img, (cx, cy - 24), (cx, cy + 24), (0, 0, 0), 2)

        # Header Title
        cv2.putText(img, "OFFICIAL OMR ANSWER SCRIPT - 2026", (320, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
        cv2.putText(img, f"ROLL: {roll_num}    SET: {set_code}    QUESTIONS: {total_q}", (330, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1)

        # Top ID bar
        cv2.rectangle(img, (80, 110), (980, 125), (0, 0, 0), -1)

        # Columns layout
        # 25 Q -> 1 col, 50 Q -> 2 cols, 100 Q -> 4 cols
        if total_q <= 30:
            num_cols = 1
            col_w = 400
            start_x = 330
        elif total_q <= 50:
            num_cols = 2
            col_w = 420
            start_x = 120
        else:
            num_cols = 4
            col_w = 220
            start_x = 90

        q_per_col = int(math.ceil(total_q / num_cols))
        bubble_coords = {}  # (q_idx, opt) -> (cx, cy)
        OPTIONS = ['A', 'B', 'C', 'D']

        for c in range(num_cols):
            cx_base = start_x + c * col_w
            for r in range(q_per_col):
                q_idx = c * q_per_col + r + 1
                if q_idx > total_q:
                    break

                cy = 180 + r * 25
                # Draw question label
                cv2.putText(img, f"{q_idx:02d}.", (cx_base, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)

                chosen_opt = student_answers.get(q_idx)

                # Draw 4 option bubbles
                for o_idx, opt in enumerate(OPTIONS):
                    bx = cx_base + 45 + o_idx * 34
                    bubble_coords[(q_idx, opt)] = (bx, cy)

                    # Empty bubble ring
                    cv2.circle(img, (bx, cy), 11, (100, 100, 100), 1)
                    cv2.putText(img, opt, (bx - 4, cy + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (80, 80, 80), 1)

                    if chosen_opt == opt:
                        # Filled by student
                        cv2.circle(img, (bx, cy), 10, (25, 20, 20), -1)

        return img, bubble_coords

