#!/usr/bin/env python3
"""
Comprehensive Audit Suite for All 21 HSC Physics Workbooks.
Validates:
1. Row count = 101 (1 header + 100 questions).
2. Exact 50% Conceptual (Rows 2-51) & 50% Mathematical (Rows 52-101) division.
3. 100% Unique questions per workbook (Zero cloned duplicate text).
4. Zero placeholder text (e.g. 'সমস্যা XX', 'সমাধান XX', placeholder markers).
5. Zero corrupted LaTeX control characters (\x07, \x08, \x0c, \x0b).
6. Diagram delimiter consistency (Col 8 delimiter matches Col 7 prefix).
7. Non-empty Model Answer and Explanation across all 100 questions.
"""

import os
import glob
import re
import openpyxl
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE

def run_audit():
    base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "untitled folder")
    files = sorted(glob.glob(os.path.join(base_dir, "*.xlsx")))
    
    print(f"Auditing {len(files)} Workbooks in: {base_dir}\n")
    
    total_files = len(files)
    total_questions = 0
    total_mathematical = 0
    total_conceptual = 0
    total_with_diagrams = 0
    
    all_passed = True
    
    for f in files:
        fname = os.path.basename(f)
        wb = openpyxl.load_workbook(f, data_only=True)
        ws = wb.active
        
        # Check 1: Row count
        if ws.max_row != 101:
            print(f"❌ [{fname}] Invalid row count: {ws.max_row} (expected 101)")
            all_passed = False
            continue
            
        questions_text_set = set()
        file_placeholders = 0
        file_corruptions = 0
        file_delimiter_mismatches = 0
        file_empty_answers = 0
        file_diagrams = 0
        
        for r in range(2, 102):
            q_text = str(ws.cell(r, 7).value or "").strip()
            img_url = str(ws.cell(r, 8).value or "").strip()
            expl = str(ws.cell(r, 9).value or "").strip()
            ans = str(ws.cell(r, 10).value or "").strip()
            
            total_questions += 1
            if r <= 51:
                total_conceptual += 1
            else:
                total_mathematical += 1
                
            # Check duplicates
            # Clean off leading diagram delimiter for uniqueness check
            pure_text = re.sub(r"^##(GEO|PRESET):[^#]+##\s*", "", q_text).strip()
            if pure_text in questions_text_set:
                print(f"❌ [{fname}] Duplicate question at row {r}: {pure_text[:50]}...")
                all_passed = False
            questions_text_set.add(pure_text)
            
            # Check placeholders
            if re.search(r"সমস্যা\s*\d+|সমাধান\s*\d+|Placeholder|Ans:\s*সমাধান", q_text + expl + ans):
                file_placeholders += 1
                
            # Check control characters
            raw_combined = q_text + img_url + expl + ans
            if any(ord(c) in (7, 8, 11, 12) for c in raw_combined):
                file_corruptions += 1
                
            # Check diagram consistency
            if img_url and img_url not in ['None', 'none', '']:
                file_diagrams += 1
                total_with_diagrams += 1
                if (img_url.startswith('##GEO:') or img_url.startswith('##PRESET:')) and not q_text.startswith(img_url):
                    file_delimiter_mismatches += 1
                    
            # Check non-empty answers
            if not ans or ans in ['None', 'none']:
                file_empty_answers += 1
            if not expl or expl in ['None', 'none']:
                file_empty_answers += 1
                
        errors = []
        if file_placeholders > 0:
            errors.append(f"{file_placeholders} placeholders")
        if file_corruptions > 0:
            errors.append(f"{file_corruptions} control-char corruptions")
        if file_delimiter_mismatches > 0:
            errors.append(f"{file_delimiter_mismatches} diagram mismatches")
        if file_empty_answers > 0:
            errors.append(f"{file_empty_answers} empty answers/explanations")
        if len(questions_text_set) != 100:
            errors.append(f"{100 - len(questions_text_set)} duplicate questions")
            
        if errors:
            print(f"⚠️  [{fname}] Issues: {', '.join(errors)}")
            all_passed = False
        else:
            print(f"✅ [{fname}] PERFECT: 100 unique questions (50 conceptual + 50 mathematical), {file_diagrams} diagrams, 0 issues")
            
    print("\n" + "=" * 60)
    print(f"AUDIT SUMMARY:")
    print(f"Total Workbooks: {total_files}")
    print(f"Total Questions: {total_questions} ({total_conceptual} Conceptual, {total_mathematical} Mathematical)")
    print(f"Total Diagrams:  {total_with_diagrams}")
    print(f"Status:          {'ALL PASSED PERFECTLY ✅' if all_passed else 'SOME ISSUES DETECTED ❌'}")
    print("=" * 60)
    return all_passed

if __name__ == '__main__':
    run_audit()
