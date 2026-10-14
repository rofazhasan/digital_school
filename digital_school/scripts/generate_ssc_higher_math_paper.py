#!/usr/bin/env python3
"""
Generate complete, authentic SSC Higher Mathematics Question Paper (2027-2028 Marks Distribution)
Total Marks: 75
- Written / Creative (CQ): 40 Marks (7 CQs: 3 from Algebra, 2 from Geometry & Vectors, 2 from Trig & Probability)
- Short Questions (SQ): 10 Marks (7 SQs given, answer 5, each 2 marks)
- Multiple Choice (MCQ): 25 Marks (19 regular MCQs including 6 multiple-completion + 2 SMCQs with 3 sub-questions each = 25 marks)
Strictly adheres to NCTB SSC Higher Math syllabus, proper Bengali mathematical terms, and question_template_objective.xlsx format.
"""

import os
import openpyxl

def generate_higher_math_paper():
    template_path = "/Users/md.rofazhasanrafiu/coding/question_template_objective.xlsx"
    output_path = "/Users/md.rofazhasanrafiu/coding/SSC_Higher_Math_Full_Question_Paper_2027_2028.xlsx"

    wb = openpyxl.load_workbook(template_path)

    # Ensure dummy sheets like 'Valid Classes Reference' are removed
    for sheet_name in list(wb.sheetnames):
        if "reference" in sheet_name.lower() or "class" in sheet_name.lower():
            del wb[sheet_name]

    ws = wb["Template"]

    # Clear existing rows except header
    for row in range(ws.max_row, 1, -1):
        ws.delete_rows(row)

    class_name = "10A - 1"
    subject = "Higher Mathematics"

    # Header list from template
    headers = [ws.cell(1, c).value for c in range(1, ws.max_column + 1)]
    col_map = {name: idx + 1 for idx, name in enumerate(headers) if name}

    # =========================================================================
    # 1. 19 MCQs (INCLUDING 6 MULTIPLE-COMPLETION / বহুপদী সমাপ্তিসূচক)
    # =========================================================================
    mcqs = [
        # --- অধ্যায় ১: সেট ও ফাংশন ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সেট ও ফাংশন (ডোমেন)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$f(x) = \\sqrt{3 - x}$ ফাংশনটির বাস্তব ডোমেন নিচের কোনটি?",
            "Option A": "$[3, \\infty)$", "Option B": "$(-\\infty, 3]$", "Option C": "$(-\\infty, 3)$", "Option D": "$\\mathbb{R} \\setminus \\{3\\}$",
            "Correct Option": "B", "Correct Answer": "$(-\\infty, 3]$",
            "Model Answer": "বাস্তব মানের জন্য $3 - x \\ge 0 \\implies x \\le 3$। অতএব ডোমেন $= (-\\infty, 3]$।",
            "Teacher Note / Explanation": "বর্গমূলের অভ্যন্তরীণ রাশি অঋণাত্মক ($\\ge 0$) হতে হবে।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সেট ও ফাংশন (এক-এক ও সার্বিক)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "$F: \\mathbb{R} \\to \\mathbb{R}$, যেখানে $F(x) = 2x - 3$ হলে—\ni. $F$ একটি এক-এক ফাংশন\nii. $F$ একটি সার্বিক (অন-টু) ফাংশন\niii. $F^{-1}(1) = 2$\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Model Answer": "$F(x_1) = F(x_2) \\implies x_1 = x_2$, সুতরাং এক-এক। রেঞ্জ $= \\mathbb{R} =$ কোডোমেন, তাই সার্বিক। $2x - 3 = 1 \\implies 2x = 4 \\implies x = 2$। তিনটি বিবৃতিই সঠিক।",
            "Teacher Note / Explanation": "একঘাত ফাংশন সর্বদাই এক-এক ও অন-টু (বাইজেক্টিভ)।"
        },

        # --- অধ্যায় ২: বীজগাণিতিক রাশি ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বীজগাণিতিক রাশি (উৎপাদক উপপাদ্য)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$P(x) = 2x^3 - 5x^2 + x + 2$ বহুপদীটির একটি উৎপাদক কোনটি?",
            "Option A": "$x + 1$", "Option B": "$x - 1$", "Option C": "$x - 2$", "Option D": "$2x + 1$",
            "Correct Option": "C", "Correct Answer": "$x - 2$",
            "Model Answer": "$P(2) = 2(2)^3 - 5(2)^2 + 2 + 2 = 16 - 20 + 4 = 0$। উৎপাদক উপপাদ্য অনুযায়ী $(x - 2)$ একটি উৎপাদক।",
            "Teacher Note / Explanation": "ভাগশেষ শূন্য হলে $(x - a)$ বহুপদীর উৎপাদক।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বীজগাণিতিক রাশি (প্রতিসম ও চক্র-ক্রমিক)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$F(x, y, z) = x^2(y - z) + y^2(z - x) + z^2(x - y)$ রাশিটি—\ni. সমমাত্রিক রাশি\nii. চক্র-ক্রমিক রাশি\niii. প্রতিসম রাশি\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "A", "Correct Answer": "i ও ii",
            "Model Answer": "প্রতিটি পদের মাত্রা ৩, সুতরাং সমমাত্রিক। $x \\to y \\to z \\to x$ রূপান্তরে রাশি অপরিবর্তিত থাকে, তাই চক্র-ক্রমিক। কিন্তু যেকোনো দুটি চলক বিনিময় করলে চিহ্নের পরিবর্তন ঘটে, তাই প্রতিসম নয়।",
            "Teacher Note / Explanation": "চক্র-ক্রমিক ও প্রতিসম রাশির পার্থক্যের পরিষ্কার ধারণা।"
        },

        # --- অধ্যায় ৩: জ্যামিতি (উপপাদ্য) ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "জ্যামিতি (অ্যাপোলোনিয়াসের উপপাদ্য)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$\\triangle ABC$ এ $AD$ মধ্যমা $BC$ বাহুর উপর অঙ্কিত হলে অ্যাপোলোনিয়াসের উপপাদ্য অনুসারে কোনটি সঠিক?",
            "Option A": "$AB^2 + AC^2 = 2(AD^2 + BD^2)$",
            "Option B": "$AB^2 + AC^2 = AD^2 + BD^2$",
            "Option C": "$AB^2 - AC^2 = 2(AD^2 - BD^2)$",
            "Option D": "$AB^2 + AC^2 = 4AD^2$",
            "Correct Option": "A", "Correct Answer": "$AB^2 + AC^2 = 2(AD^2 + BD^2)$",
            "Model Answer": "অ্যাপোলোনিয়াসের উপপাদ্য: ত্রিভুজের যেকোনো দুই বাহুর উপর অঙ্কিত বর্গক্ষেত্রদ্বয়ের ক্ষেত্রফলের সমষ্টি তৃতীয় বাহুর অর্ধেকের উপর অঙ্কিত বর্গক্ষেত্র এবং ওই বাহুর সমদ্বিখণ্ডক মধ্যমার উপর অঙ্কিত বর্গক্ষেত্রের ক্ষেত্রফলের সমষ্টির দ্বিগুণের সমান।",
            "Teacher Note / Explanation": "উচ্চতর গণিত ৩য় অধ্যায়ের মৌলিক ও বহুল ব্যবহৃত উপপাদ্য ৩.৬।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "জ্যামিতি (টলেমির উপপাদ্য)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "বৃত্তে অন্তর্লিখিত চতুর্ভুজ $ABCD$ এর কর্ণদ্বয় $AC$ ও $BD$ হলে টলেমির উপপাদ্য অনুসারে—",
            "Option A": "$AC \\cdot BD = AB \\cdot CD + BC \\cdot AD$",
            "Option B": "$AC + BD = AB + CD$",
            "Option C": "$AC \\cdot BD = AB \\cdot BC + CD \\cdot DA$",
            "Option D": "$AC^2 + BD^2 = AB^2 + CD^2$",
            "Correct Option": "A", "Correct Answer": "$AC \\cdot BD = AB \\cdot CD + BC \\cdot AD$",
            "Model Answer": "টলেমির উপপাদ্য: বৃত্তে অন্তর্লিখিত কোনো চতুর্ভুজের কর্ণদ্বয়ের অন্তর্গত আয়তক্ষেত্রের ক্ষেত্রফল ওই চতুর্ভুজের বিপরীত বাহুদ্বয়ের অন্তর্গত আয়তক্ষেত্রদ্বয়ের ক্ষেত্রফলের সমষ্টির সমান।",
            "Teacher Note / Explanation": "অধ্যায় ৩ এর উপপাদ্য ৩.৭।"
        },

        # --- অধ্যায় ৫: সমীকরণ ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সমীকরণ (নিশ্চয়ক ও মূলের প্রকৃতি)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$3x^2 - 2x + 1 = 0$ সমীকরণটির নিশ্চয়ক (Discriminant) $D$ এবং মূলদ্বয়ের প্রকৃতি কোনটি?",
            "Option A": "$D = -8$, মূলদ্বয় জটিল ও অসমান",
            "Option B": "$D = 16$, মূলদ্বয় বাস্তব ও অসমান",
            "Option C": "$D = 0$, মূলদ্বয় বাস্তব ও সমান",
            "Option D": "$D = -8$, মূলদ্বয় বাস্তব ও মূলদ",
            "Correct Option": "A", "Correct Answer": "$D = -8$, মূলদ্বয় জটিল ও অসমান",
            "Model Answer": "$D = b^2 - 4ac = (-2)^2 - 4(3)(1) = 4 - 12 = -8 < 0$। নিশ্চয়ক ঋণাত্মক হওয়ায় মূলদ্বয় জটিল/অবাস্তব ও অসমান।",
            "Teacher Note / Explanation": "দ্বিঘাত সমীকরণের নিশ্চয়ক ঋণাত্মক হলে মূলদ্বয় অনুবন্ধী জটিল সংখ্যা।"
        },

        # --- অধ্যায় ৬: অসমতা ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "অসমতা (সমাধান সেট)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$|2x - 3| < 5$ অসমতাটির সমাধান সেট নিচের কোনটি?",
            "Option A": "$-1 < x < 4$", "Option B": "$x < -1$ অথবা $x > 4$", "Option C": "$-4 < x < 1$", "Option D": "$1 < x < 4$",
            "Correct Option": "A", "Correct Answer": "$-1 < x < 4$",
            "Model Answer": "$-5 < 2x - 3 < 5 \\implies -2 < 2x < 8 \\implies -1 < x < 4$।",
            "Teacher Note / Explanation": "$|x| < a \\iff -a < x < a$ সূত্রের নির্ভুল প্রয়োগ।"
        },

        # --- অধ্যায় ৭: অসীম ধারা ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "অসীম ধারা (অসীমতক সমষ্টি)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$1 - \\frac{1}{3} + \\frac{1}{9} - \\frac{1}{27} + \\dots$ অসীম গুণোত্তর ধারাটির অসীমতক সমষ্টি কত?",
            "Option A": "$\\frac{3}{4}$", "Option B": "$\\frac{4}{3}$", "Option C": "$\\frac{2}{3}$", "Option D": "$\\frac{1}{2}$",
            "Correct Option": "A", "Correct Answer": "$\\frac{3}{4}$",
            "Model Answer": "$a = 1$, $r = -\\frac{1}{3}$। যেহেতু $|r| = |-\\frac{1}{3}| = \\frac{1}{3} < 1$, অসীমতক সমষ্টি $S_\\infty = \\frac{a}{1 - r} = \\frac{1}{1 - (-\\frac{1}{3})} = \\frac{1}{4/3} = \\frac{3}{4}$।",
            "Teacher Note / Explanation": "অসীম গুণোত্তর ধারার অভিসারী সমষ্টি নির্ণয়।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "অসীম ধারা (অভিসারী শর্ত)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "একটি গুণোত্তর ধারার প্রথম পদ $a$ এবং সাধারণ অনুপাত $r$ হলে—\ni. $|r| < 1$ হলে ধারাটির অসীমতক সমষ্টি থাকে\nii. $r = 1$ হলে ধারাটির অসীমতক সমষ্টি $S_\\infty = a$\niii. $S_\\infty = \\frac{a}{1 - r}$ যখন $|r| < 1$\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "B", "Correct Answer": "i ও iii",
            "Model Answer": "$|r| < 1$ হলে ধারাটি অভিসারী এবং $S_\\infty = \\frac{a}{1 - r}$। $r = 1$ হলে সমষ্টি অসীম, তাই ii সঠিক নয়।",
            "Teacher Note / Explanation": "গুণোত্তর ধারার অসীমতক সমষ্টির মৌলিক শর্ত।"
        },

        # --- অধ্যায় ৮: ত্রিকোণমিতি ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিকোণমিতি (চাপ ও কোণ)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি বৃত্তের ব্যাসার্ধ $14\\text{ cm}$ হলে বৃত্তের কেন্দ্রে $45^\\circ$ কোণ উৎপন্নকারী চাপের দৈর্ঘ্য কত? ($\\pi = \\frac{22}{7}$)",
            "Option A": "$11\\text{ cm}$", "Option B": "$22\\text{ cm}$", "Option C": "$5.5\\text{ cm}$", "Option D": "$44\\text{ cm}$",
            "Correct Option": "A", "Correct Answer": "$11\\text{ cm}$",
            "Model Answer": "$\\theta = 45^\\circ = 45 \\times \\frac{\\pi}{180} = \\frac{\\pi}{4}\\text{ rad}$। চাপের দৈর্ঘ্য $s = r\\theta = 14 \\times \\frac{22}{7 \\times 4} = 14 \\times \\frac{11}{14} = 11\\text{ cm}$।",
            "Teacher Note / Explanation": "$s = r\\theta$ সূত্রে কোণ অবশ্যই রেডিয়ানে হতে হবে।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিকোণমিতি (চতুর্ভাগ ও চিহ্ন)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "$\\cos\\theta = -\\frac{4}{5}$ এবং $\\pi < \\theta < \\frac{3\\pi}{2}$ হলে—\ni. $\\theta$ কোণটি তৃতীয় চতুর্ভাগে অবস্থিত\nii. $\\sin\\theta = -\\frac{3}{5}$\niii. $\\tan\\theta = \\frac{3}{4}$\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Model Answer": "তৃতীয় চতুর্ভাগে $\\sin$ ও $\\cos$ ঋণাত্মক এবং $\\tan$ ধনাত্মক। $\\sin\\theta = -\\sqrt{1 - (-4/5)^2} = -\\frac{3}{5}$। $\\tan\\theta = \\frac{-3/5}{-4/5} = \\frac{3}{4}$। তিনটিই সঠিক।",
            "Teacher Note / Explanation": "চতুর্ভাগ অনুযায়ী ত্রিকোণমিতিক অনুপাতের চিহ্নের বিশ্লেষণ।"
        },

        # --- অধ্যায় ৯: সূচকীয় ও লগারিদমীয় ফাংশন ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সূচকীয় ও লগারিদমীয় ফাংশন (লগের মান)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$\\log_{\\sqrt{3}} 81$ এর মান কত?",
            "Option A": "$4$", "Option B": "$8$", "Option C": "$16$", "Option D": "$2$",
            "Correct Option": "B", "Correct Answer": "$8$",
            "Model Answer": "$81 = 3^4 = ((\\sqrt{3})^2)^4 = (\\sqrt{3})^8$। অতএব $\\log_{\\sqrt{3}} (\\sqrt{3})^8 = 8$।",
            "Teacher Note / Explanation": "লগারিদমের ভিত্তি ও ঘাত রূপান্তর।"
        },

        # --- অধ্যায় ১০: দ্বিপদী বিস্তৃতি ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "দ্বিপদী বিস্তৃতি (সাধারণ পদ ও পদের সংখ্যা)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$\\left(x^2 - \\frac{2}{x}\\right)^8$ এর বিস্তৃতিতে—\ni. মোট পদের সংখ্যা ৯টি\nii. মধ্যপদটি হলো ৫ম পদ\niii. সাধারণ পদ $T_{r+1} = \\binom{8}{r} (x^2)^{8-r} (-2x^{-1})^r$\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Model Answer": "ঘাত $n = 8$ হওয়ায় পদসংখ্যা $8 + 1 = 9$। মধ্যপদ $= \\frac{8}{2} + 1 = 5$-তম পদ। সাধারণ পদের সূত্র সঠিক।",
            "Teacher Note / Explanation": "দ্বিপদী বিস্তৃতির সাধারণ বৈশিষ্ট্য।"
        },

        # --- অধ্যায় ১১: স্থানাঙ্ক জ্যামিতি ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "স্থানাঙ্ক জ্যামিতি (ঢাল ও সমীকরণ)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$2x - 3y + 6 = 0$ সরলরেখাটির—\ni. ঢাল $m = \\frac{2}{3}$\nii. $y$-অক্ষের ছেদিতাংশ $2$\niii. অক্ষদ্বয়ের সাথে উৎপন্ন ত্রিভুজের ক্ষেত্রফল $3\\text{ sq. unit}$\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Model Answer": "$3y = 2x + 6 \\implies y = \\frac{2}{3}x + 2$। সুতরাং ঢাল $2/3$, $y$-অক্ষের ছেদিতাংশ $2$। $\\frac{x}{-3} + \\frac{y}{2} = 1$, ক্ষেত্রফল $= \\frac{1}{2} \\times |-3| \\times 2 = 3$। তিনটিই সঠিক।",
            "Teacher Note / Explanation": "সরলরেখার ঢাল ও ছেদক আকারের পুঙ্খানুপুঙ্খ বিশ্লেষণ।"
        },

        # --- অধ্যায় ১২: সমতলীয় ভেক্টর ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সমতলীয় ভেক্টর (একক ভেক্টর)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$\\vec{a} = 3\\hat{i} - 4\\hat{j}$ হলে $\\vec{a}$ ভেক্টরের সমান্তরাল একক ভেক্টর কোনটি?",
            "Option A": "$\\frac{3\\hat{i} - 4\\hat{j}}{5}$", "Option B": "$\\frac{3\\hat{i} - 4\\hat{j}}{7}$", "Option C": "$\\frac{3\\hat{i} + 4\\hat{j}}{5}$", "Option D": "$3\\hat{i} - 4\\hat{j}$",
            "Correct Option": "A", "Correct Answer": "$\\frac{3\\hat{i} - 4\\hat{j}}{5}$",
            "Model Answer": "$|\\vec{a}| = \\sqrt{3^2 + (-4)^2} = \\sqrt{25} = 5$। সমান্তরাল একক ভেক্টর $= \\frac{\\vec{a}}{|\\vec{a}|} = \\frac{3\\hat{i} - 4\\hat{j}}{5}$।",
            "Teacher Note / Explanation": "যেকোনো ভেক্টরকে তার মান দিয়ে ভাগ করলে একক ভেক্টর পাওয়া যায়।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সমতলীয় ভেক্টর (ত্রিভুজ বিধি)",
            "Difficulty": "EASY", "Marks": 1,
            "Question Text": "$\\triangle ABC$ এর ক্ষেত্রে ভেক্টর যোগের ত্রিভুজ বিধি অনুযায়ী কোনটি সঠিক?",
            "Option A": "$\\vec{AB} + \\vec{BC} = \\vec{AC}$",
            "Option B": "$\\vec{AB} + \\vec{AC} = \\vec{BC}$",
            "Option C": "$\\vec{AB} + \\vec{BC} + \\vec{AC} = 0$",
            "Option D": "$\\vec{AB} - \\vec{BC} = \\vec{AC}$",
            "Correct Option": "A", "Correct Answer": "$\\vec{AB} + \\vec{BC} = \\vec{AC}$",
            "Model Answer": "ভেক্টর যোগের ত্রিভুজ সূত্র: একই ক্রমে সূচিত দুটি বাহুর ভেক্টর সমষ্টি বিপরীত ক্রমে সূচিত তৃতীয় বাহু দ্বারা প্রকাশিত হয়।",
            "Teacher Note / Explanation": "ভেক্টর অধ্যায়ের মূল প্রতিপাদ্য সূত্র।"
        },

        # --- অধ্যায় ১৩: ঘন জ্যামিতি ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "ঘন জ্যামিতি (সমবৃত্তভূমিক কোণক)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি সমবৃত্তভূমিক কোণকের ভূমির ব্যাসার্ধ $3\\text{ cm}$ এবং উচ্চতা $4\\text{ cm}$ হলে এর হেলানো উচ্চতা ($l$) কত?",
            "Option A": "$5\\text{ cm}$", "Option B": "$7\\text{ cm}$", "Option C": "$12\\text{ cm}$", "Option D": "$25\\text{ cm}$",
            "Correct Option": "A", "Correct Answer": "$5\\text{ cm}$",
            "Model Answer": "হেলানো উচ্চতা $l = \\sqrt{r^2 + h^2} = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5\\text{ cm}$।",
            "Teacher Note / Explanation": "কোণকের হেলানো উচ্চতার সরাসরি সূত্র প্রয়োগ।"
        },

        # --- অধ্যায় ১৪: সম্ভাবনা ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সম্ভাবনা (মৌলিক বৈশিষ্ট্য)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি ছক্কা একবার নিক্ষেপ করা হলে একটি মৌলিক সংখ্যা আসার সম্ভাবনা কত?",
            "Option A": "$\\frac{1}{2}$", "Option B": "$\\frac{1}{3}$", "Option C": "$\\frac{2}{3}$", "Option D": "$\\frac{1}{6}$",
            "Correct Option": "A", "Correct Answer": "$\\frac{1}{2}$",
            "Model Answer": "নমুনা ক্ষেত্রে মোট ফলাফল $S = \\{1, 2, 3, 4, 5, 6\\}$ (৬টি)। মৌলিক সংখ্যা হলো $\\{2, 3, 5\\}$ (৩টি)। সম্ভাবনা $= \\frac{3}{6} = \\frac{1}{2}$।",
            "Teacher Note / Explanation": "ছক্কার ফলাফল ও মৌলিক সংখ্যার নির্ভুল ধারণা।"
        }
    ]

    # =========================================================================
    # 2. 2 SMCQs (অভিন্ন তথ্যভিত্তিক বহুনির্বাচনী প্রশ্ন) - 3 MCQs each = 6 MCQs
    # =========================================================================
    smcqs = [
        # --- SMCQ 1: স্থানাঙ্ক জ্যামিতি (অধ্যায় ১১) ---
        {
            "Type": "SMCQ", "Class Name": class_name, "Subject": subject, "Topic": "স্থানাঙ্ক জ্যামিতি (অভিন্ন তথ্যভিত্তিক)",
            "Difficulty": "HARD", "Marks": 3,
            "Question Text": "উদ্দীপকটি পড় এবং পরবর্তী ৩টি প্রশ্নের উত্তর দাও:\nএকটি ত্রিভুজের শীর্ষত্রয়ের স্থানাঙ্ক যথাক্রমে $A(1, 2)$, $B(4, 6)$ এবং $C(-2, 6)$।",
            "Teacher Note / Explanation": "স্থানাঙ্ক জ্যামিতি থেকে শীর্ষবিন্দু ও সরলরেখার অভিন্ন তথ্যভিত্তিক প্রশ্নাবলী।",
            # Sub 1
            "Sub 1 Text": "$AB$ বাহুর দৈর্ঘ্য কত একক?",
            "Sub 1 Marks": 1,
            "Sub 1 Option A": "3", "Sub 1 Option B": "4", "Sub 1 Option C": "5", "Sub 1 Option D": "6",
            "Sub 1 Correct Option": "C",
            "Sub 1 Model Answer": "$AB = \\sqrt{(4 - 1)^2 + (6 - 2)^2} = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = 5\\text{ একক}$।",
            "Sub 1 Explanation": "দুই বিন্দুর দূরত্বের সূত্র প্রয়োগ।",
            # Sub 2
            "Sub 2 Text": "$AB$ রেখাংশের ঢাল ($m$) কত?",
            "Sub 2 Marks": 1,
            "Sub 2 Option A": "$\\frac{4}{3}$", "Sub 2 Option B": "$\\frac{3}{4}$", "Sub 2 Option C": "$-\\frac{4}{3}$", "Sub 2 Option D": "$1$",
            "Sub 2 Correct Option": "A",
            "Sub 2 Model Answer": "ঢাল $m = \\frac{6 - 2}{4 - 1} = \\frac{4}{3}$।",
            "Sub 2 Explanation": "ঢালের সূত্র $m = \\frac{y_2 - y_1}{x_2 - x_1}$।",
            # Sub 3
            "Sub 3 Text": "$\\triangle ABC$ এর ক্ষেত্রফল কত বর্গ একক?",
            "Sub 3 Marks": 1,
            "Sub 3 Option A": "$12$", "Sub 3 Option B": "$15$", "Sub 3 Option C": "$18$", "Sub 3 Option D": "$24$",
            "Sub 3 Correct Option": "A",
            "Sub 3 Model Answer": "ক্ষেত্রফল $= \\frac{1}{2} |1(6 - 6) + 4(6 - 2) + (-2)(2 - 6)| = \\frac{1}{2} |0 + 16 + 8| = \\frac{1}{2} \\times 24 = 12\\text{ sq. unit}$।",
            "Sub 3 Explanation": "শীর্ষবিন্দুর স্থানাঙ্ক হতে ত্রিভুজের ক্ষেত্রফল নির্ণয়।"
        },

        # --- SMCQ 2: দ্বিপদী বিস্তৃতি ও সমীকরণ (অধ্যায় ১০ ও ৫) ---
        {
            "Type": "SMCQ", "Class Name": class_name, "Subject": subject, "Topic": "দ্বিপদী বিস্তৃতি (অভিন্ন তথ্যভিত্তিক)",
            "Difficulty": "HARD", "Marks": 3,
            "Question Text": "উদ্দীপকটি পড় এবং পরবর্তী ৩টি প্রশ্নের উত্তর দাও:\nএকটি দ্বিপদী রাশি $\\left(x - \\frac{1}{x}\\right)^6$ এবং একটি দ্বিঘাত সমীকরণ $x^2 - px + q = 0$।",
            "Teacher Note / Explanation": "দ্বিপদী বিস্তৃতি ও দ্বিঘাত সমীকরণের সমন্বিত উদ্দীপকভিত্তিক প্রশ্ন।",
            # Sub 1
            "Sub 1 Text": "দ্বিপদী রাশিটির বিস্তৃতিতে মধ্যপদটি কোনটি?",
            "Sub 1 Marks": 1,
            "Sub 1 Option A": "৩য় পদ", "Sub 1 Option B": "৪র্থ পদ", "Sub 1 Option C": "৫ম পদ", "Sub 1 Option D": "৬ষ্ঠ পদ",
            "Sub 1 Correct Option": "B",
            "Sub 1 Model Answer": "ঘাত $n = 6$ জোড় সংখ্যা। মধ্যপদ $= \\frac{6}{2} + 1 = 4$-র্থ পদ।",
            "Sub 1 Explanation": "জোড় ঘাতের দ্বিপদী বিস্তৃতির মধ্যপদ নির্ণয়।",
            # Sub 2
            "Sub 2 Text": "দ্বিপদী রাশিটির $x$-বর্জিত পদটির মান কত?",
            "Sub 2 Marks": 1,
            "Sub 2 Option A": "$20$", "Sub 2 Option B": "$-20$", "Sub 2 Option C": "$15$", "Sub 2 Option D": "$-15$",
            "Sub 2 Correct Option": "B",
            "Sub 2 Model Answer": "মধ্যপদটিই $x$-বর্জিত পদ: $T_{3+1} = \\binom{6}{3} x^{6-3} (-x^{-1})^3 = 20 \\times x^3 \\times (-x^{-3}) = -20$।",
            "Sub 2 Explanation": "সাধারণ পদে $x^0$ এর সহগ বা পদ নির্ণয়।",
            # Sub 3
            "Sub 3 Text": "দ্বিঘাত সমীকরণ $x^2 - px + q = 0$ এর মূলদ্বয় সমান হওয়ার শর্ত কোনটি?",
            "Sub 3 Marks": 1,
            "Sub 3 Option A": "$p^2 = 4q$", "Sub 3 Option B": "$p^2 = -4q$", "Sub 3 Option C": "$q^2 = 4p$", "Sub 3 Option D": "$p = 4q$",
            "Sub 3 Correct Option": "A",
            "Sub 3 Model Answer": "মূলদ্বয় সমান হলে নিশ্চয়ক $D = 0 \\implies (-p)^2 - 4(1)(q) = 0 \\implies p^2 = 4q$।",
            "Sub 3 Explanation": "দ্বিঘাত সমীকরণের মূলের সমান হওয়ার নিশ্চয়ক শর্ত।"
        }
    ]

    # =========================================================================
    # 3. 7 SHORT QUESTIONS (SQ) - Answer 5, each 2 marks = 10 Marks
    # =========================================================================
    sqs = [
        # SQ 1 (অধ্যায় ১: সেট ও ফাংশন)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "সেট ও ফাংশন (ডোমেন ও বিপরীত ফাংশন)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "যদি $f(x) = \\frac{x - 3}{2x + 1}$ হয়, তবে $f^{-1}(2)$ এর মান নির্ণয় কর।",
            "Model Answer": "ধরি $y = \\frac{x - 3}{2x + 1} \\implies 2xy + y = x - 3 \\implies x(2y - 1) = -3 - y \\implies x = \\frac{3 + y}{1 - 2y}$।\nঅতএব $f^{-1}(x) = \\frac{3 + x}{1 - 2x}$।\nসুতরাং $f^{-1}(2) = \\frac{3 + 2}{1 - 2(2)} = \\frac{5}{1 - 4} = -\\frac{5}{3}$।",
            "Teacher Note / Explanation": "বিপরীত ফাংশন নির্ণয় করে তাতে নির্দিষ্ট মান বসানো।"
        },
        # SQ 2 (অধ্যায় ২: বীজগাণিতিক রাশি)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "বীজগাণিতিক রাশি (চক্র-ক্রমিক রাশি)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "দেখাও যে, $P(x, y, z) = x^3 + y^3 + z^3 - 3xyz$ একটি সমমাত্রিক ও চক্র-ক্রমিক রাশি।",
            "Model Answer": "$P(x, y, z)$ এর প্রতিটি পদের মাত্রা ৩, সুতরাং এটি ৩ মাত্রার সমমাত্রিক বহুপদী।\nএখন $x$-এর স্থলে $y$, $y$-এর স্থলে $z$ এবং $z$-এর স্থলে $x$ বসালে:\n$P(y, z, x) = y^3 + z^3 + x^3 - 3yzx = x^3 + y^3 + z^3 - 3xyz = P(x, y, z)$।\nযেহেতু চলকসমূহের চক্রাকার আবর্তনে রাশিটি অপরিবর্তিত থাকে, তাই এটি একটি চক্র-ক্রমিক রাশি। (দেখানো হলো)",
            "Teacher Note / Explanation": "চক্র-ক্রমিক ও সমমাত্রিক রাশির গাণিতিক সংজ্ঞা ও প্রতিপাদন।"
        },
        # SQ 3 (অধ্যায় ৭: অসীম ধারা)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "অসীম ধারা (পৌনঃপুনিক দশমিক ভগ্নাংশ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$0.\\dot{2}\\dot{7}$ কে অসীম গুণোত্তর ধারার সাহায্যে মূলদীয় সাধারণ ভগ্নাংশে প্রকাশ কর।",
            "Model Answer": "$0.\\dot{2}\\dot{7} = 0.272727\\dots = 0.27 + 0.0027 + 0.000027 + \\dots$\nএটি একটি অসীম গুণোত্তর ধারা যার প্রথম পদ $a = 0.27 = \\frac{27}{100}$ এবং সাধারণ অনুপাত $r = \\frac{0.0027}{0.27} = 0.01 = \\frac{1}{100}$।\nযেহেতু $|r| < 1$, এর অসীমতক সমষ্টি:\n$S_\\infty = \\frac{a}{1 - r} = \\frac{27/100}{1 - 1/100} = \\frac{27/100}{99/100} = \\frac{27}{99} = \\frac{3}{11}$।",
            "Teacher Note / Explanation": "পৌনঃপুনিক দশমিককে গুণোত্তর ধারার অসীমতক সমষ্টির সূত্রের সাহায্যে রূপান্তর।"
        },
        # SQ 4 (অধ্যায় ১০: দ্বিপদী বিস্তৃতি)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "দ্বিপদী বিস্তৃতি (নির্দিষ্ট পদের সহগ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$(1 - 2x)^7$ এর বিস্তৃতিতে $x^3$ এর সহগ নির্ণয় কর।",
            "Model Answer": "$(1 - 2x)^7$ এর সাধারণ পদ:\n$T_{r+1} = \\binom{7}{r} (1)^{7-r} (-2x)^r = \\binom{7}{r} (-2)^r x^r$।\n$x^3$ এর সহগের জন্য $r = 3$।\nঅতএব $x^3$ এর সহগ $= \\binom{7}{3} (-2)^3 = \\frac{7 \\times 6 \\times 5}{3 \\times 2 \\times 1} \\times (-8) = 35 \\times (-8) = -280$।",
            "Teacher Note / Explanation": "দ্বিপদী বিস্তৃতির সাধারণ পদ $T_{r+1}$ থেকে সরাসরি সহগ নির্ণয়।"
        },
        # SQ 5 (অধ্যায় ৩: জ্যামিতি)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "জ্যামিতি (লম্ব অভিক্ষেপ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "কোনো নির্দিষ্ট রেখার উপর অপর একটি রেখাংশের লম্ব অভিক্ষেপ বলতে কী বোঝায়? একটি বিন্দুর লম্ব অভিক্ষেপ কী?",
            "Model Answer": "কোনো নির্দিষ্ট সরলরেখার উপর কোনো রেখাংশের প্রান্তবিন্দুদ্বয় থেকে ওই রেখার উপর অঙ্কিত লম্বদ্বয়ের পাদবিন্দুদ্বয়ের মধ্যবর্তী দূরত্বকে প্রথম রেখাংশটির লম্ব অভিক্ষেপ বলে।\nএকটি বিন্দুর লম্ব অভিক্ষেপ হলো ওই বিন্দু থেকেই নির্দিষ্ট রেখার উপর অঙ্কিত লম্বের পাদবিন্দু (যা একটি একক বিন্দু এবং এর দৈর্ঘ্য শূন্য)।",
            "Teacher Note / Explanation": "লম্ব অভিক্ষেপের তাত্ত্বিক সংজ্ঞা ও বিন্দুর অভিক্ষেপ।"
        },
        # SQ 6 (অধ্যায় ৮: ত্রিকোণমিতি)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিকোণমিতি (কোণের রূপান্তর)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$\\cot\\left(\\frac{17\\pi}{4}\\right)$ এর মান নির্ণয় কর।",
            "Model Answer": "$\\frac{17\\pi}{4} = 4\\pi + \\frac{\\pi}{4} = 2(2\\pi) + \\frac{\\pi}{4}$।\n$\\cot\\left(\\frac{17\\pi}{4}\\right) = \\cot\\left(4\\pi + \\frac{\\pi}{4}\\right) = \\cot\\left(\\frac{\\pi}{4}\\right) = 1$।",
            "Teacher Note / Explanation": "পর্যাবৃত্ত কোণ $2n\\pi + \\theta$ এর নিয়মে সঠিক মান নির্ণয়।"
        },
        # SQ 7 (অধ্যায় ১২: সমতলীয় ভেক্টর)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "সমতলীয় ভেক্টর (ভেক্টরের মান ও সমান্তরাল)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$m$ এর মান কত হলে $\\vec{u} = 2\\hat{i} + 3\\hat{j}$ এবং $\\vec{v} = 6\\hat{i} + m\\hat{j}$ ভেক্টরদ্বয় পরস্পর সমান্তরাল হবে?",
            "Model Answer": "দুটি ভেক্টর পরস্পর সমান্তরাল হলে তাদের অনুরূপ সহগসমূহের অনুপাত সমান হবে:\n$\\frac{2}{6} = \\frac{3}{m} \\implies \\frac{1}{3} = \\frac{3}{m} \\implies m = 9$।\nঅতএব $m = 9$ হলে ভেক্টরদ্বয় পরস্পর সমান্তরাল হবে।",
            "Teacher Note / Explanation": "ভেক্টর সমান্তরাল হওয়ার সহগ অনুপাত শর্ত।"
        }
    ]

    # =========================================================================
    # 4. 7 CREATIVE QUESTIONS (CQ) - 3+2+2 Structure
    # 3 from Section A (Algebra), 2 from Section B (Geometry & Vector), 2 from Section C (Trig & Prob)
    # Answer at least 1 from each section, total 5 questions to answer (5 * 8 = 40 or 10 * 4 = 40)
    # In template each CQ has Sub 1 (2 marks), Sub 2 (4 marks), Sub 3 (4 marks) = 10 Marks
    # =========================================================================
    cqs = [
        # --- ক-বিভাগ: বীজগণিত (প্রশ্ন ১: ফাংশন ও লগারিদম) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "ফাংশন ও লগারিদম (সেট, ফাংশন ও সূচক-লগারিদম)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "দুটি ফাংশন নিম্নরূপ সংজ্ঞায়িত:\n$f(x) = \\frac{2x + 2}{x - 1}$ এবং $g(x) = \\ln\\left(\\frac{1 - x}{1 + x}\\right)$।",
            "Teacher Note / Explanation": "১ম ও ৯ম অধ্যায় (সেট, ফাংশন ও লগারিদম) এর সমন্বয়মূলক সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "$f(x)$ ফাংশনটির ডোমেন এবং রেঞ্জ নির্ণয় কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "ভগ্নাংশের হর শূন্য হতে পারবে না: $x - 1 \\ne 0 \\implies x \\ne 1$।\n$\\therefore \\text{Dom } f = \\mathbb{R} \\setminus \\{1\\}$।\nধরি $y = \\frac{2x + 2}{x - 1} \\implies xy - y = 2x + 2 \\implies x(y - 2) = y + 2 \\implies x = \\frac{y + 2}{y - 2}$।\nযেহেতু $y \\ne 2$, অতএব $\\text{Range } f = \\mathbb{R} \\setminus \\{2\\}$।",
            "Sub 1 Explanation": "ফাংশনের বাস্তব ডোমেন ও রেঞ্জ নির্ণয়।",
            # খ
            "Sub 2 Text": "দেখাও যে, $f(x)$ একটি এক-এক ফাংশন এবং $f^{-1}(4)$ এর মান নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "যেকোনো $x_1, x_2 \\in \\text{Dom } f$ এর জন্য:\n$f(x_1) = f(x_2) \\implies \\frac{2x_1 + 2}{x_1 - 1} = \\frac{2x_2 + 2}{x_2 - 1}$\n$\\implies (2x_1 + 2)(x_2 - 1) = (2x_2 + 2)(x_1 - 1)$\n$\\implies 2x_1x_2 - 2x_1 + 2x_2 - 2 = 2x_1x_2 - 2x_2 + 2x_1 - 2$\n$\\implies 4x_2 = 4x_1 \\implies x_1 = x_2$।\nঅতএব $f(x)$ একটি এক-এক ফাংশন। (দেখানো হলো)\nএখন $f^{-1}(x) = \\frac{x + 2}{x - 2}$।\n$\\therefore f^{-1}(4) = \\frac{4 + 2}{4 - 2} = \\frac{6}{2} = 3$।",
            "Sub 2 Explanation": "বীজগাণিতিক উপায়ে এক-এক ফাংশন প্রমাণ ও বিপরীত ফাংশনের মান নির্ণয়।",
            # গ
            "Sub 3 Text": "$g(x)$ এর ডোমেন নির্ণয় কর এবং প্রমাণ কর যে, $g(x)$ একটি বিজোড় (Odd) ফাংশন।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "লগারিদমের যুক্তি ধনাত্মক হতে হবে: $\\frac{1 - x}{1 + x} > 0$।\nলব ও হরকে $(1 + x)$ দ্বারা গুণ করে $(1 - x)(1 + x) > 0 \\implies 1 - x^2 > 0 \\implies x^2 < 1 \\implies -1 < x < 1$।\n$\\therefore \\text{Dom } g = (-1, 1)$।\nএখন বিজোড় ফাংশন প্রমাণ:\n$g(-x) = \\ln\\left(\\frac{1 - (-x)}{1 + (-x)}\\right) = \\ln\\left(\\frac{1 + x}{1 - x}\\right) = \\ln\\left(\\left(\\frac{1 - x}{1 + x}\\right)^{-1}\\right) = -\\ln\\left(\\frac{1 - x}{1 + x}\\right) = -g(x)$।\nযেহেতু $g(-x) = -g(x)$, সুতরাং $g(x)$ একটি বিজোড় ফাংশন। (প্রমাণিত)",
            "Sub 3 Explanation": "লগারিদমীয় ফাংশনের ডোমেন ও ঋণাত্মক ইনপুটে বিজোড় ফাংশনের বৈশিষ্ট্য প্রমাণ।"
        },

        # --- ক-বিভাগ: বীজগণিত (প্রশ্ন ২: বীজগাণিতিক রাশি ও সমীকরণ) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "বীজগাণিতিক রাশি ও সমীকরণ (আংশিক ভগ্নাংশ ও নিশ্চয়ক)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "একটি বহুপদী $P(x) = x^3 - 6x^2 + 11x - 6$ এবং একটি দ্বিঘাত সমীকরণ $kx^2 + (k + 3)x + 4 = 0$ দেওয়া হলো।",
            "Teacher Note / Explanation": "২য় ও ৫ম অধ্যায় (বীজগাণিতিক রাশি ও দ্বিঘাত সমীকরণ) এর সমন্বিত সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "ভাগশেষ উপপাদ্যের সাহায্যে দেখাও যে, $(x - 1)$ রাশিটি $P(x)$ এর একটি উৎপাদক।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "ভাগশেষ উপপাদ্য অনুযায়ী, $(x - 1)$ দ্বারা $P(x)$ কে ভাগ করলে ভাগশেষ হবে $P(1)$।\n$P(1) = 1^3 - 6(1)^2 + 11(1) - 6 = 1 - 6 + 11 - 6 = 12 - 12 = 0$।\nযেহেতু ভাগশেষ শূন্য, সুতরাং $(x - 1)$ রাশিটি $P(x)$ এর একটি উৎপাদক। (দেখানো হলো)",
            "Sub 1 Explanation": "ভাগশেষ উপপাদ্য প্রয়োগে উৎপাদক নিশ্চিতকরণ।",
            # খ
            "Sub 2 Text": "$\\frac{x + 1}{P(x)}$ কে আংশিক ভগ্নাংশে প্রকাশ কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "$P(x) = x^3 - 6x^2 + 11x - 6 = (x - 1)(x^2 - 5x + 6) = (x - 1)(x - 2)(x - 3)$।\nধরি, $\\frac{x + 1}{(x - 1)(x - 2)(x - 3)} \\equiv \\frac{A}{x - 1} + \\frac{B}{x - 2} + \\frac{C}{x - 3}$ ... (i)\nউভয়পক্ষকে $(x - 1)(x - 2)(x - 3)$ দ্বারা গুণ করে:\n$x + 1 \\equiv A(x - 2)(x - 3) + B(x - 1)(x - 3) + C(x - 1)(x - 2)$ ... (ii)\n$x = 1$ বসালে: $2 = A(-1)(-2) = 2A \\implies A = 1$।\n$x = 2$ বসালে: $3 = B(1)(-1) = -B \\implies B = -3$।\n$x = 3$ বসালে: $4 = C(2)(1) = 2C \\implies C = 2$।\n$\\therefore \\frac{x + 1}{P(x)} = \\frac{1}{x - 1} - \\frac{3}{x - 2} + \\frac{2}{x - 3}$।",
            "Sub 2 Explanation": "আংশিক ভগ্নাংশে রূপান্তরের স্ট্যান্ডার্ড ধাপসমূহ।",
            # গ
            "Sub 3 Text": "$k$ এর মান কত হলে দ্বিঘাত সমীকরণটির মূলদ্বয় বাস্তব ও সমান হবে? মূলদ্বয় নির্ণয় কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "সমীকরণ: $kx^2 + (k + 3)x + 4 = 0$। এখানে $a = k, b = k + 3, c = 4$।\nমূলদ্বয় বাস্তব ও সমান হওয়ার শর্ত নিশ্চয়ক $D = 0$:\n$b^2 - 4ac = 0 \\implies (k + 3)^2 - 4(k)(4) = 0$\n$\\implies k^2 + 6k + 9 - 16k = 0 \\implies k^2 - 10k + 9 = 0$\n$\\implies (k - 1)(k - 9) = 0 \\implies k = 1$ অথবা $k = 9$।\n$k = 1$ হলে সমীকরণ $x^2 + 4x + 4 = 0 \\implies (x + 2)^2 = 0 \\implies$ মূলদ্বয়: $-2, -2$।\n$k = 9$ হলে সমীকরণ $9x^2 + 12x + 4 = 0 \\implies (3x + 2)^2 = 0 \\implies$ মূলদ্বয়: $-\\frac{2}{3}, -\\frac{2}{3}$।",
            "Sub 3 Explanation": "নিশ্চয়ক শূন্য ধরে $k$ এর মান এবং সংশ্লিষ্ট সমান মূল নির্ণয়।"
        },

        # --- ক-বিভাগ: বীজগণিত (প্রশ্ন ৩: অসীম ধারা ও দ্বিপদী বিস্তৃতি) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "অসীম ধারা ও দ্বিপদী বিস্তৃতি",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "একটি অসীম গুণোত্তর ধারা: $\\frac{1}{2x + 1} + \\frac{1}{(2x + 1)^2} + \\frac{1}{(2x + 1)^3} + \\dots$\nএবং অপর একটি দ্বিপদী রাশি $\\left(2x^2 - \\frac{1}{4x}\\right)^9$।",
            "Teacher Note / Explanation": "৭ম ও ১০ম অধ্যায় (অসীম ধারা ও দ্বিপদী উপপাদ্য) এর বোর্ড স্ট্যান্ডার্ড সমন্বিত প্রশ্ন।",
            # ক
            "Sub 1 Text": "দ্বিপদী রাশিটির বিস্তৃতিতে মোট পদের সংখ্যা কত এবং সাধারণ পদটি লিখ।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "দ্বিপদী রাশিটির ঘাত $n = 9$ হওয়ায় বিস্তৃতিতে মোট পদের সংখ্যা $= 9 + 1 = 10$টি।\nসাধারণ পদ:\n$T_{r+1} = \\binom{9}{r} (2x^2)^{9-r} \\left(-\\frac{1}{4x}\\right)^r = \\binom{9}{r} 2^{9-r} \\left(-\\frac{1}{4}\\right)^r x^{18 - 3r}$।",
            "Sub 1 Explanation": "দ্বিপদী বিস্তৃতির সাধারণ পদের নির্ভুল সূত্র প্রয়োগ।",
            # খ
            "Sub 2 Text": "$x$ এর উপর কী শর্ত আরোপ করলে গুণোত্তর ধারাটির অসীমতক সমষ্টি থাকবে এবং সেই সমষ্টি $S_\\infty$ নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "ধারাটির ১ম পদ $a = \\frac{1}{2x + 1}$ এবং সাধারণ অনুপাত $r = \\frac{1}{2x + 1}$।\nঅসীমতক সমষ্টি থাকার শর্ত $|r| < 1 \\implies \\left|\\frac{1}{2x + 1}\\right| < 1 \\implies |2x + 1| > 1$\n$\\implies 2x + 1 > 1$ অথবা $2x + 1 < -1$\n$\\implies 2x > 0 \\implies x > 0$ অথবা $2x < -2 \\implies x < -1$।\n$\\therefore$ শর্ত: $x < -1$ অথবা $x > 0$।\nঅসীমতক সমষ্টি $S_\\infty = \\frac{a}{1 - r} = \\frac{\\frac{1}{2x + 1}}{1 - \\frac{1}{2x + 1}} = \\frac{\\frac{1}{2x + 1}}{\\frac{2x + 1 - 1}{2x + 1}} = \\frac{1}{2x}$।",
            "Sub 2 Explanation": "পরমমান অসমতা সমাধান করে অভিসারী ব্যবধি ও সমষ্টি নির্ণয়।",
            # গ
            "Sub 3 Text": "দ্বিপদী বিস্তৃতিটির $x$-বর্জিত পদ নির্ণয় কর এবং এর মান কত?",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "সাধারণ পদে $x$-এর ঘাত $18 - 3r$। পদটি $x$-বর্জিত হওয়ার জন্য:\n$18 - 3r = 0 \\implies 3r = 18 \\implies r = 6$।\nঅতএব $x$-বর্জিত পদটি হলো $(6 + 1) = 7$-তম পদ।\n$T_7 = \\binom{9}{6} 2^{9-6} \\left(-\\frac{1}{4}\\right)^6 x^0 = \\binom{9}{3} 2^3 \\left(\\frac{1}{4}\\right)^6$\n$\\binom{9}{3} = \\frac{9 \\times 8 \\times 7}{3 \\times 2 \\times 1} = 84$।\n$T_7 = 84 \\times 8 \\times \\frac{1}{4096} = 84 \\times \\frac{8}{4096} = 84 \\times \\frac{1}{512} = \\frac{84}{512} = \\frac{21}{128}$।\n$\\therefore x$-বর্জিত পদটির মান $\\frac{21}{128}$।",
            "Sub 3 Explanation": "ঘাত শূন্য ধরে $r$ নির্ণয় এবং সাংখ্যিক মান বের করা।"
        },

        # --- খ-বিভাগ: জ্যামিতি ও ভেক্টর (প্রশ্ন ৪: উপপাদ্য ও অ্যাপোলোনিয়াস - WITH GEOMETRY DIAGRAM) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "জ্যামিতি (অ্যাপোলোনিয়াসের উপপাদ্য ও মধ্যমা)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের জ্যামিতিক চিত্রটি লক্ষ্য কর:\n##GEO:triangle-median[labels:A,B,C,D;sides:c=6,b=8,m=AD]##\nউদ্দীপক: $\\triangle ABC$ এর বাহুত্রয় $AB = 6\\text{ cm}$, $AC = 8\\text{ cm}$, $BC = 10\\text{ cm}$ এবং $BC$ বাহুর উপর অঙ্কিত মধ্যমা $AD$।",
            "Teacher Note / Explanation": "৩য় অধ্যায় (জ্যামিতি - উপপাদ্য ৩.৬ অ্যাপোলোনিয়াসের উপপাদ্য ও পিথাগোরাসের বিস্তৃতি) সংক্রান্ত প্রমাণভিত্তিক প্রশ্ন।",
            # ক
            "Sub 1 Text": "লম্ব অভিক্ষেপ বলতে কী বোঝায়? উদ্দীপকের ত্রিভুজটির বৃহত্তম কোণটির পরিমাপ কত?",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "কোনো নির্দিষ্ট সরলরেখার উপর কোনো রেখাংশের প্রান্তবিন্দুদ্বয় থেকে ওই রেখার উপর অঙ্কিত লম্বদ্বয়ের পাদবিন্দুদ্বয়ের মধ্যবর্তী দূরত্বকে রেখাংশটির লম্ব অভিক্ষেপ বলে।\nএখানে বাহুত্রয়: $6^2 + 8^2 = 36 + 64 = 100 = 10^2$।\nপিথাগোরাসের বিপরীত উপপাদ্য অনুসারে $\\triangle ABC$ সমকোণী এবং বৃহত্তম কোণ $\\angle A = 90^\\circ$।",
            "Sub 1 Explanation": "লম্ব অভিক্ষেপের সংজ্ঞা ও সমকোণী ত্রিভুজ শনাক্তকরণ।",
            # খ
            "Sub 2 Text": "অ্যাপোলোনিয়াসের উপপাদ্য প্রয়োগ করে মধ্যমা $AD$ এর দৈর্ঘ্য নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "যেহেতু $D$ বিন্দু $BC$ বাহুর মধ্যবিন্দু, অতএব $BD = CD = \\frac{1}{2} BC = \\frac{10}{2} = 5\\text{ cm}$।\nঅ্যাপোলোনিয়াসের উপপাদ্য অনুসারে:\n$AB^2 + AC^2 = 2(AD^2 + BD^2)$\n$\\implies 6^2 + 8^2 = 2(AD^2 + 5^2)$\n$\\implies 36 + 64 = 2(AD^2 + 25)$\n$\\implies 100 = 2(AD^2 + 25)$\n$\\implies AD^2 + 25 = 50$\n$\\implies AD^2 = 25$\n$\\implies AD = 5\\text{ cm}$।\nঅতএব মধ্যমা $AD$ এর দৈর্ঘ্য $5\\text{ cm}$।",
            "Sub 2 Explanation": "অ্যাপোলোনিয়াসের সূত্রে মান বসিয়ে মধ্যমা নির্ণয়।",
            # গ
            "Sub 3 Text": "জ্যামিতিক পদ্ধতিতে প্রমাণ কর যে, $AB^2 + AC^2 = 2(AD^2 + BD^2)$।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "বিশেষ নির্বচন: মনে করি $\\triangle ABC$ এর $BC$ বাহুর উপর মধ্যমা $AD$। প্রমাণ করতে হবে যে, $AB^2 + AC^2 = 2(AD^2 + BD^2)$।\nঅঙ্কন: $A$ থেকে $BC$ এর উপর $AE \\perp BC$ লম্ব আঁকি। তাহলে $BC$ এর উপর $AD$ এর লম্ব অভিক্ষেপ $DE$।\nপ্রমাণ: $\\angle ADB$ ও $\\angle ADC$ এর মধ্যে একটি সূক্ষ্মকোণ ও অপরটি স্থূলকোণ। ধরি $\\angle ADB$ স্থূলকোণ এবং $\\angle ADC$ সূক্ষ্মকোণ।\nস্থূলকোণী $\\triangle ABD$ এ পিথাগোরাসের উপপাদ্যের বিস্তৃতি অনুসারে:\n$AB^2 = AD^2 + BD^2 + 2 \\cdot BD \\cdot DE$ ... (i)\nআবার সূক্ষ্মকোণী $\\triangle ACD$ এ পিথাগোরাসের উপপাদ্যের বিস্তৃতি অনুসারে:\n$AC^2 = AD^2 + CD^2 - 2 \\cdot CD \\cdot DE$ ... (ii)\nকিন্তু $D, BC$ এর মধ্যবিন্দু হওয়ায় $CD = BD$। সমীকরণ (ii) দাঁড়ায়:\n$AC^2 = AD^2 + BD^2 - 2 \\cdot BD \\cdot DE$ ... (iii)\nএখন (i) ও (iii) যোগ করে পাই:\n$AB^2 + AC^2 = 2AD^2 + 2BD^2 = 2(AD^2 + BD^2)$। (প্রমাণিত)",
            "Sub 3 Explanation": "পিথাগোরাসের উপপাদ্যের বিস্তৃতি উপপাদ্য ৩.৩ ও ৩.৪ প্রয়োগ করে অ্যাপোলোনিয়াসের উপপাদ্য প্রমাণ।"
        },

        # --- খ-বিভাগ: জ্যামিতি ও ভেক্টর (প্রশ্ন ৫: স্থানাঙ্ক জ্যামিতি ও সমতলীয় ভেক্টর - WITH VECTOR DIAGRAM) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "স্থানাঙ্ক জ্যামিতি ও ভেক্টর",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের ভেক্টর চিত্রটি লক্ষ্য কর:\n##GEO:vector-triangle[labels:P,Q,R;sides:u=a,v=b,w=c]##\nউদ্দীপক: তিনটি বিন্দুর স্থানাঙ্ক যথাক্রমে $A(2, 5)$, $B(-1, 1)$, $C(5, 1)$ এবং একটি ভেক্টর ত্রিভুজ $\\triangle PQR$ যেখানে $D$ ও $E$ যথাক্রমে $PQ$ ও $PR$ বাহুর মধ্যবিন্দু।",
            "Teacher Note / Explanation": "১১শ ও ১২শ অধ্যায় (স্থানাঙ্ক জ্যামিতি ও সমতলীয় ভেক্টর) এর সমন্বিত সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "$A$ ও $B$ বিন্দুগামী সরলরেখার সমীকরণ ও ঢাল নির্ণয় কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "ঢাল $m = \\frac{1 - 5}{-1 - 2} = \\frac{-4}{-3} = \\frac{4}{3}$।\nরেখার সমীকরণ: $y - 5 = \\frac{4}{3}(x - 2) \\implies 3y - 15 = 4x - 8 \\implies 4x - 3y + 7 = 0$।",
            "Sub 1 Explanation": "দুই বিন্দুগামী রেখার ঢাল ও সমীকরণ নির্ণয়।",
            # খ
            "Sub 2 Text": "$\\triangle ABC$ এর ক্ষেত্রফল নির্ণয় কর এবং $A$ শীর্ষ থেকে $BC$ ভূমির উপর অঙ্কিত উচ্চতা নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "বিন্দুত্রয়কে ঘড়ির কাঁটার বিপরীত ক্রমে সাজিয়ে ক্ষেত্রফল:\n$\\text{Area} = \\frac{1}{2} |2(1 - 1) + (-1)(1 - 5) + 5(5 - 1)| = \\frac{1}{2} |0 + 4 + 20| = \\frac{1}{2} \\times 24 = 12\\text{ sq. unit}$।\nভূমি $BC$ এর দৈর্ঘ্য $= \\sqrt{(5 - (-1))^2 + (1 - 1)^2} = \\sqrt{6^2 + 0} = 6\\text{ unit}$।\nআমরা জানি, ক্ষেত্রফল $= \\frac{1}{2} \\times \\text{ভূমি} \\times \\text{উচ্চতা}$\n$\\implies 12 = \\frac{1}{2} \\times 6 \\times h \\implies 3h = 12 \\implies h = 4\\text{ একক}$।",
            "Sub 2 Explanation": "শীর্ষবিন্দু থেকে ক্ষেত্রফল এবং ক্ষেত্রফলের সূত্র হতে উচ্চতা নির্ণয়।",
            # গ
            "Sub 3 Text": "ভেক্টর পদ্ধতিতে প্রমাণ কর যে, $\\vec{DE} = \\frac{1}{2}\\vec{QR}$ এবং $DE \\parallel QR$।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "মনে করি মূলবিন্দু $O$ এর সাপেক্ষে $P, Q, R, D, E$ বিন্দুসমূহের অবস্থান ভেক্টর যথাক্রমে $\\vec{p}, \\vec{q}, \\vec{r}, \\vec{d}, \\vec{e}$।\nযেহেতু $D, PQ$ এর মধ্যবিন্দু, $\\vec{d} = \\frac{\\vec{p} + \\vec{q}}{2}$।\nযেহেতু $E, PR$ এর মধ্যবিন্দু, $\\vec{e} = \\frac{\\vec{p} + \\vec{r}}{2}$।\nঅতএব, $\\vec{DE} = \\vec{e} - \\vec{d} = \\frac{\\vec{p} + \\vec{r}}{2} - \\frac{\\vec{p} + \\vec{q}}{2} = \\frac{\\vec{r} - \\vec{q}}{2}$।\nআবার, $\\vec{QR} = \\vec{r} - \\vec{q}$।\n$\\therefore \\vec{DE} = \\frac{1}{2}\\vec{QR}$। (প্রথম অংশ প্রমাণিত)\nমান নিয়ে পাই: $|\\vec{DE}| = \\frac{1}{2}|\\vec{QR}| \\implies DE = \\frac{1}{2}QR$।\nযেহেতু $\\vec{DE}$ ও $\\vec{QR}$ একই বা সমান্তরাল ধারক রেখাবিশিষ্ট এবং তাদের শীর্ষবিন্দু ভিন্ন, অতএব $DE \\parallel QR$। (প্রমাণিত)",
            "Sub 3 Explanation": "অবস্থান ভেক্টরের সাহায্যে মধ্যবিন্দুর সংযোজক রেখার উপপাদ্য প্রমাণ।"
        },

        # --- গ-বিভাগ: ত্রিকোণমিতি ও সম্ভাবনা (প্রশ্ন ৬: ত্রিকোণমিতিক সমীকরণ ও অনুপাত) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিকোণমিতি (সমীকরণ সমাধান ও অনুপাত)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "উদ্দীপক: $\\tan A = -\\frac{3}{4}$, যেখানে $\\frac{\\pi}{2} < A < \\pi$ এবং একটি ত্রিকোণমিতিক সমীকরণ $2\\cos^2\\theta + 3\\sin\\theta - 3 = 0$।",
            "Teacher Note / Explanation": "৮ম অধ্যায় (ত্রিকোণমিতি - ৮.২ ও ৮.৩) এর বোর্ড স্ট্যান্ডার্ড সমীকরণ ও অনুপাত সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "একটি চাকার ব্যাসার্ধ $21\\text{ cm}$ হলে চাকাটির পরিধি কত এবং কেন্দ্রে $60^\\circ$ কোণ উৎপন্নকারী চাপের দৈর্ঘ্য নির্ণয় কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "চাকার পরিধি $= 2\\pi r = 2 \\times \\frac{22}{7} \\times 21 = 132\\text{ cm}$।\nকোণ $\\theta = 60^\\circ = 60 \\times \\frac{\\pi}{180} = \\frac{\\pi}{3}\\text{ rad}$।\nচাপের দৈর্ঘ্য $s = r\\theta = 21 \\times \\frac{22}{7 \\times 3} = 22\\text{ cm}$।",
            "Sub 1 Explanation": "চাকার পরিধি ও বৃত্তচাপের দৈর্ঘ্য নির্ণয়।",
            # খ
            "Sub 2 Text": "উদ্দীপকের আলোকে $\\frac{\\sin A + \\cos A}{\\sec A - \\tan A}$ এর মান নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "যেহেতু $\\frac{\\pi}{2} < A < \\pi$, কোণ $A$ দ্বিতীয় চতুর্ভাগে অবস্থিত।\nদ্বিতীয় চতুর্ভাগে $\\sin$ ধনাত্মক, কিন্তু $\\cos, \\tan, \\sec$ ঋণাত্মক।\nদেওয়া আছে $\\tan A = -\\frac{3}{4} \\implies \\sec^2 A = 1 + \\tan^2 A = 1 + \\frac{9}{16} = \\frac{25}{16} \\implies \\sec A = -\\frac{5}{4}$।\n$\\cos A = -\\frac{4}{5}$ এবং $\\sin A = \\sqrt{1 - \\cos^2 A} = \\sqrt{1 - \\frac{16}{25}} = \\frac{3}{5}$।\nএখন রাশিটিতে মান বসিয়ে:\n$\\frac{\\sin A + \\cos A}{\\sec A - \\tan A} = \\frac{\\frac{3}{5} + \\left(-\\frac{4}{5}\\right)}{-\\frac{5}{4} - \\left(-\\frac{3}{4}\\right)} = \\frac{-\\frac{1}{5}}{-\\frac{2}{4}} = \\frac{-\\frac{1}{5}}{-\\frac{1}{2}} = \\frac{1}{5} \\times 2 = \\frac{2}{5}$।",
            "Sub 2 Explanation": "চতুর্ভাগ অনুসারে চিহ্নের সতর্কতা ও প্রতিটি অনুপাতের সঠিক মান বের করা।",
            # গ
            "Sub 3 Text": "সমীকরণটি সমাধান কর: $2\\cos^2\\theta + 3\\sin\\theta - 3 = 0$, যেখানে $0 < \\theta < 2\\pi$।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "$2(1 - \\sin^2\\theta) + 3\\sin\\theta - 3 = 0$\n$\\implies 2 - 2\\sin^2\\theta + 3\\sin\\theta - 3 = 0$\n$\\implies -2\\sin^2\\theta + 3\\sin\\theta - 1 = 0$\n$\\implies 2\\sin^2\\theta - 3\\sin\\theta + 1 = 0$\n$\\implies (2\\sin\\theta - 1)(\\sin\\theta - 1) = 0$\nহয় $2\\sin\\theta - 1 = 0 \\implies \\sin\\theta = \\frac{1}{2}$ অথবা $\\sin\\theta - 1 = 0 \\implies \\sin\\theta = 1$।\n১) $\\sin\\theta = \\frac{1}{2}$ হলে:\n১ম চতুর্ভাগে: $\\theta = \\frac{\\pi}{6}$\n২য় চতুর্ভাগে: $\\theta = \\pi - \\frac{\\pi}{6} = \\frac{5\\pi}{6}$\n২) $\\sin\\theta = 1$ হলে: $\\theta = \\frac{\\pi}{2}$।\n$\\therefore$ নির্ণেয় সমাধান: $\\theta = \\frac{\\pi}{6}, \\frac{\\pi}{2}, \\frac{5\\pi}{6}$।",
            "Sub 3 Explanation": "দ্বিঘাত ত্রিকোণমিতিক সমীকরণ সমাধান এবং নির্দিষ্ট ব্যবধিতে সব মূল নির্ণয়।"
        },

        # --- গ-বিভাগ: ত্রিকোণমিতি ও সম্ভাবনা (প্রশ্ন ৭: সম্ভাবনা ও Probability Tree) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "সম্ভাবনা (বল তোলা ও Probability Tree)",
            "Difficulty": "MEDIUM", "Marks": 10,
            "Question Text": "একটি বাক্সে ৪টি লাল, ৫টি সাদা এবং ৬টি কালো মার্বেল আছে। অপর একটি নিরপেক্ষ পরীক্ষায় একটি মুদ্রা ও একটি ছক্কা একসাথে একবার নিক্ষেপ করা হলো।",
            "Teacher Note / Explanation": "১৪শ অধ্যায় (সম্ভাবনা) থেকে মার্বেল নির্বাচন ও মুদ্রা-ছক্কার নমুনা ক্ষেত্র সংক্রান্ত সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "নিশ্চিত ঘটনা ও অসম্ভব ঘটনার একটি করে বাস্তব উদাহরণসহ সংজ্ঞা দাও।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "নিশ্চিত ঘটনা: যে ঘটনার ঘটার সম্ভাবনা ১, তাকে নিশ্চিত ঘটনা বলে। যেমন: একটি ছক্কা নিক্ষেপে ৭ এর চেয়ে ছোট সংখ্যা আসা একটি নিশ্চিত ঘটনা।\nঅসম্ভব ঘটনা: যে ঘটনার ঘটার সম্ভাবনা শূন্য, তাকে অসম্ভব ঘটনা বলে। যেমন: একটি সাধারণ ছক্কা নিক্ষেপে ৮ সংখ্যাটি আসা একটি অসম্ভব ঘটনা।",
            "Sub 1 Explanation": "সম্ভাবনার মৌলিক সংজ্ঞা ও উদাহরণ।",
            # খ
            "Sub 2 Text": "বাক্সটি থেকে দৈবভাবে একটি মার্বেল তোলা হলে মার্বেলটি— (i) লাল হওয়ার সম্ভাবনা, (ii) সাদা না হওয়ার সম্ভাবনা কত? পুনঃস্থাপন না করে পরপর দুটি মার্বেল তুললে উভয়টি কালো হওয়ার সম্ভাবনা কত?",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "মোট মার্বেল সংখ্যা $= 4 + 5 + 6 = 15$টি।\n(i) মার্বেলটি লাল হওয়ার সম্ভাবনা $P(\\text{Red}) = \\frac{4}{15}$।\n(ii) সাদা মার্বেল ৫টি, সাদা না হওয়ার অনুকূল ফলাফল $= 15 - 5 = 10$টি।\nসাদা না হওয়ার সম্ভাবনা $= \\frac{10}{15} = \\frac{2}{3}$।\n(iii) পুনঃস্থাপন না করে ১ম মার্বেলটি কালো হওয়ার সম্ভাবনা $= \\frac{6}{15}$।\n২য় মার্বেলটি কালো হওয়ার সম্ভাবনা $= \\frac{5}{14}$।\nউভয় মার্বেল কালো হওয়ার সম্ভাবনা $= \\frac{6}{15} \\times \\frac{5}{14} = \\frac{2}{5} \\times \\frac{5}{14} = \\frac{2}{14} = \\frac{1}{7}$।",
            "Sub 2 Explanation": "পরস্পর বর্জনশীল ও শর্তযুক্ত সম্ভাবনার নির্ভুল হিসাব।",
            # গ
            "Sub 3 Text": "মুদ্রা ও ছক্কার নিরপেক্ষ পরীক্ষার Probability Tree তৈরি করে নমুনা ক্ষেত্র $S$ লিখ। মুদ্রাটিতে Head ($H$) এবং ছক্কায় মৌলিক সংখ্যা আসার সম্ভাবনা কত?",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "Probability Tree:\nমুদ্রার ফলাফল $H$ ও $T$। প্রতিটি থেকে ছক্কার ফলাফল ১, ২, ৩, ৪, ৫, ৬ শাখা বের হবে।\nনমুনা ক্ষেত্র $S = \\{(H, 1), (H, 2), (H, 3), (H, 4), (H, 5), (H, 6), (T, 1), (T, 2), (T, 3), (T, 4), (T, 5), (T, 6)\\}$।\nনমুনা ক্ষেত্রে মোট বিন্দুর সংখ্যা $n(S) = 2 \\times 6 = 12$।\nমুদ্রায় Head ($H$) এবং ছক্কায় মৌলিক সংখ্যা $\\{2, 3, 5\\}$ আসার অনুকূল ফলাফলগুলো হলো:\n$E = \\{(H, 2), (H, 3), (H, 5)\\}$ (৩টি)।\n$\\therefore$ নির্ণেয় সম্ভাবনা $P(E) = \\frac{n(E)}{n(S)} = \\frac{3}{12} = \\frac{1}{4}$।",
            "Sub 3 Explanation": "Probability Tree ও নমুনা ক্ষেত্র গঠন এবং অনুকূল ফলাফলের অনুপাত দ্বারা সম্ভাবনা নির্ণয়।"
        }
    ]

    all_questions = mcqs + smcqs + sqs + cqs

    # Write each question row to Template sheet
    for q_idx, q in enumerate(all_questions, start=2):
        for field, val in q.items():
            if field in col_map:
                ws.cell(row=q_idx, column=col_map[field], value=val)

    wb.save(output_path)
    print(f"✅ Generated SSC Higher Math question paper with:")
    print(f"   - {len(mcqs)} standard MCQs")
    print(f"   - {len(smcqs)} SMCQs ({len(smcqs) * 3} sub-questions)")
    print(f"   - Total MCQ Marks: {len(mcqs) + len(smcqs) * 3} Marks")
    print(f"   - {len(sqs)} SQs (Total {len(sqs) * 2} Marks, answer 5 for 10 Marks)")
    print(f"   - {len(cqs)} CQs ({len(cqs)} * 10 Marks = {len(cqs) * 10} Marks, answer 5 for 40 Marks)")
    print(f"   Total rows in Template sheet: {ws.max_row - 1}")
    print(f"Saved at: {output_path}")

if __name__ == "__main__":
    generate_higher_math_paper()
