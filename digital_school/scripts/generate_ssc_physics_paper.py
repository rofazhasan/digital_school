#!/usr/bin/env python3
"""
Generate complete, authentic SSC Physics Question Paper (Marks Distribution 2027-2028)
Total Marks: 75
- Written / Creative (CQ): 40 Marks (7 CQs: 3 Mechanics/Matter, 2 Heat/Waves/Optics, 2 Electricity/Magnetism/Modern Physics)
- Short Questions (SQ): 10 Marks (7 SQs given, answer 5, each 2 marks)
- Multiple Choice (MCQ): 25 Marks (19 regular MCQs including 6 multiple-completion + 2 SMCQs with 3 sub-questions each = 25 marks)
Strictly adheres to NCTB SSC Physics syllabus, proper Bengali physics terms, authentic diagrams, and question_template_objective.xlsx format.
"""

import os
import openpyxl

def generate_physics_paper():
    template_path = "/Users/md.rofazhasanrafiu/coding/question_template_objective.xlsx"
    output_path = "/Users/md.rofazhasanrafiu/coding/SSC_Physics_Full_Question_Paper_2027_2028.xlsx"

    wb = openpyxl.load_workbook(template_path)

    # Clean non-question reference sheets to ensure 0 dummy rows
    for sheet_name in list(wb.sheetnames):
        if "reference" in sheet_name.lower() or "class" in sheet_name.lower():
            del wb[sheet_name]

    ws = wb["Template"]

    # Clear existing data rows except headers
    for row in range(ws.max_row, 1, -1):
        ws.delete_rows(row)

    class_name = "10A - 1"
    subject = "Physics"

    headers = [ws.cell(1, c).value for c in range(1, ws.max_column + 1)]
    col_map = {name: idx + 1 for idx, name in enumerate(headers) if name}

    # =========================================================================
    # 1. 19 MCQs (INCLUDING 6 MULTIPLE-COMPLETION / বহুপদী সমাপ্তিসূচক)
    # =========================================================================
    mcqs = [
        # --- অধ্যায় ০১: ভৌত রাশি এবং পরিমাপ ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "ভৌত রাশি এবং পরিমাপ (ভার্নিয়ার ধ্রুবক)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি স্লাইড ক্যালিপার্সের প্রধান স্কেলের ক্ষুদ্রতম এক ঘরের মান $1\\text{ mm}$ এবং ভার্নিয়ার স্কেলের ২০ ঘর প্রধান স্কেলের ১৯ ঘরের সমান হলে ভার্নিয়ার ধ্রুবক ($VC$) কত?",
            "Option A": "$0.05\\text{ mm}$", "Option B": "$0.01\\text{ mm}$", "Option C": "$0.1\\text{ mm}$", "Option D": "$0.02\\text{ mm}$",
            "Correct Option": "A", "Correct Answer": "$0.05\\text{ mm}$",
            "Model Answer": "$VC = \\frac{s}{n} = \\frac{1\\text{ mm}}{20} = 0.05\\text{ mm}$।",
            "Teacher Note / Explanation": "ভার্নিয়ার ধ্রুবক $VC = s/n$ সূত্রের সরাসরি প্রয়োগ।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "ভৌত রাশি এবং পরিমাপ (মাত্রা সমীকরণ)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "ক্ষমতা (Power)-র মাত্রা সমীকরণ নিচের কোনটি?",
            "Option A": "$[ML^2 T^{-3}]$", "Option B": "$[ML^2 T^{-2}]$", "Option C": "$[ML T^{-2}]$", "Option D": "$[ML^{-1} T^{-2}]$",
            "Correct Option": "A", "Correct Answer": "$[ML^2 T^{-3}]$",
            "Model Answer": "ক্ষমতা $P = \\frac{W}{t} = \\frac{[ML^2 T^{-2}]}{[T]} = [ML^2 T^{-3}]$।",
            "Teacher Note / Explanation": "কাজকে সময় দিয়ে ভাগ করে ক্ষমতার মাত্রা সমীকরণ।"
        },

        # --- অধ্যায় ০২: গতি ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "গতি (সুষম ত্বরণ)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "স্থির অবস্থান হতে একটি বস্তু $3\\text{ m/s}^2$ সুষম ত্বরণে চললে $4\\text{ s}$ পর বস্তুটির অতিক্রান্ত দূরত্ব কত হবে?",
            "Option A": "$12\\text{ m}$", "Option B": "$24\\text{ m}$", "Option C": "$48\\text{ m}$", "Option D": "$36\\text{ m}$",
            "Correct Option": "B", "Correct Answer": "$24\\text{ m}$",
            "Model Answer": "$u = 0, a = 3\\text{ m/s}^2, t = 4\\text{ s}$। $s = ut + \\frac{1}{2}at^2 = 0 + \\frac{1}{2} \\times 3 \\times 16 = 24\\text{ m}$।",
            "Teacher Note / Explanation": "গতির দ্বিতীয় সমীকরণ প্রয়োগ।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "গতি (গতির সমীকরণ ও লেখচিত্র)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "সুষম ত্বরণে চলমান কোনো বস্তুর ক্ষেত্রে—\ni. বেগ-সময় লেখচিত্র একটি মূলবিন্দুগামী সরলরেখা\nii. অতিক্রান্ত দূরত্ব সময়ের বর্গের সমানুপাতিক ($s \\propto t^2$ যখন $u = 0$)\niii. ত্বরণ-সময় লেখচিত্র সময় অক্ষের সমান্তরাল\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Model Answer": "সুষম ত্বরণে $v = at$ (মূলবিন্দুগামী রেখা), $s = \\frac{1}{2}at^2 \\implies s \\propto t^2$, এবং ত্বরণ ধ্রুবক হওয়ায় ত্বরণ-সময় রেখা অনুভূমিক। তিনটিই সঠিক।",
            "Teacher Note / Explanation": "গতির বিভিন্ন লেখচিত্র ও সম্পর্কের বিশ্লেষণ।"
        },

        # --- অধ্যায় ০৩: বল ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বল (ভরবেগ সংরক্ষণ সূত্র)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$5\\text{ kg}$ ভরের একটি বন্দুক হতে $20\\text{ g}$ ভরের একটি গুলি $400\\text{ m/s}$ বেগে নির্গত হলে বন্দুকের পশ্চাৎ বেগ কত?",
            "Option A": "$1.6\\text{ m/s}$", "Option B": "$-1.6\\text{ m/s}$", "Option C": "$-0.8\\text{ m/s}$", "Option D": "$2.0\\text{ m/s}$",
            "Correct Option": "B", "Correct Answer": "$-1.6\\text{ m/s}$",
            "Model Answer": "$m = 0.02\\text{ kg}, v = 400\\text{ m/s}, M = 5\\text{ kg}$। ভরবেগের সংরক্ষণ সূত্র: $MV + mv = 0 \\implies V = -\\frac{mv}{M} = -\\frac{0.02 \\times 400}{5} = -1.6\\text{ m/s}$।",
            "Teacher Note / Explanation": "ভরবেগের সংরক্ষণ নীতিতে পশ্চাৎ বেগের হিসাব।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বল (ঘর্ষণ ও নিউটনের সূত্র)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "ঘর্ষণ বলের ক্ষেত্রে—\ni. অভিলম্ব প্রতিক্রিয়া বৃদ্ধি পেলে ঘর্ষণ বল বৃদ্ধি পায়\nii. স্পর্শতলের ক্ষেত্রফল দ্বিগুণ করলে স্থিত ঘর্ষণ বল দ্বিগুণ হয়\niii. স্থিতি ঘর্ষণের সর্বোচ্চ মানকে সীমান্তিক ঘর্ষণ বলে\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "B", "Correct Answer": "i ও iii",
            "Model Answer": "ঘর্ষণ বল অভিলম্ব প্রতিক্রিয়ার সমানুপাতিক ($F_s = \\mu R$) এবং সীমান্তিক ঘর্ষণ সর্বোচ্চ স্থিতি ঘর্ষণ। ঘর্ষণ বল আপাত স্পর্শতলের ক্ষেত্রফলের উপর নির্ভর করে না। তাই ii ভুল।",
            "Teacher Note / Explanation": "ঘর্ষণের নীতিসমূহের সঠিক ব্যাখ্যা।"
        },

        # --- অধ্যায় ০৪: কাজ, ক্ষমতা ও শক্তি ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "কাজ, ক্ষমতা ও শক্তি (গতিশক্তি)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "কোনো বস্তুর ভরবেগ দ্বিগুণ করা হলে তার গতিশক্তি পূর্বের কতগুণ হবে?",
            "Option A": "২ গুণ", "Option B": "৪ গুণ", "Option C": "৮ গুণ", "Option D": "অপরিবর্তিত থাকবে",
            "Correct Option": "B", "Correct Answer": "৪ গুণ",
            "Model Answer": "গতিশক্তি $E_k = \\frac{p^2}{2m}$। ভরবেগ $p$ দ্বিগুণ হলে গতিশক্তি $(2p)^2 = 4p^2$, অর্থাৎ ৪ গুণ হবে।",
            "Teacher Note / Explanation": "গতিশক্তি ও ভরবেগের আন্তঃসম্পর্ক।"
        },

        # --- অধ্যায় ০৫: পদার্থের অবস্থা ও চাপ ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের অবস্থা ও চাপ (প্যাসকেলের সূত্র)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি হাইড্রোলিক প্রেসের ছোট ও বড় পিস্টনের ব্যাসের অনুপাত $1 : 4$। ছোট পিস্টনে $50\\text{ N}$ বল প্রয়োগ করলে বড় পিস্টনে কত বল অনুভূত হবে?",
            "Option A": "$200\\text{ N}$", "Option B": "$800\\text{ N}$", "Option C": "$400\\text{ N}$", "Option D": "$1600\\text{ N}$",
            "Correct Option": "B", "Correct Answer": "$800\\text{ N}$",
            "Model Answer": "$\\frac{F_2}{F_1} = \\frac{A_2}{A_1} = \\left(\\frac{d_2}{d_1}\\right)^2 = 4^2 = 16$। $F_2 = 16 \\times 50\\text{ N} = 800\\text{ N}$।",
            "Teacher Note / Explanation": "ক্ষেত্রফল ব্যাসের বর্গের সমানুপাতিক।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের অবস্থা ও চাপ (প্লবতা ও ঘনত্ব)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "পানিতে নিমজ্জিত কোনো বস্তুর ক্ষেত্রে—\ni. প্লবতা অপসারিত তরলের ওজনের সমান\nii. বস্তুর ঘনত্ব তরলের ঘনত্বের চেয়ে বেশি হলে বস্তুটি ডুবে যাবে\niii. তরলের ঘনত্ব বৃদ্ধি পেলে প্লবতা হ্রাস পায়\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "A", "Correct Answer": "i ও ii",
            "Model Answer": "আর্কিমিডিসের নীতি অনুযায়ী প্লবতা $= V\\rho g$। তরলের ঘনত্ব $\\rho$ বাড়লে প্লবতা বৃদ্ধি পায়, হ্রাস পায় না। তাই iii ভুল।",
            "Teacher Note / Explanation": "প্লবতার নির্ভরশীলতা ও ভাসন-নিমজ্জনের শর্ত।"
        },

        # --- অধ্যায় ০৬: বস্তুর ওপর তাপের প্রভাব ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বস্তুর ওপর তাপের প্রভাব (তাপধারণ ক্ষমতা)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$2\\text{ kg}$ ভরের পানির তাপমাত্রা $10^\\circ\\text{C}$ বৃদ্ধি করতে প্রয়োজনীয় তাপের পরিমাণ কত? (পানির আপেক্ষিক তাপ $s = 4200\\text{ J/kg}\\cdot\\text{K}$)",
            "Option A": "$42,000\\text{ J}$", "Option B": "$84,000\\text{ J}$", "Option C": "$8,400\\text{ J}$", "Option D": "$21,000\\text{ J}$",
            "Correct Option": "B", "Correct Answer": "$84,000\\text{ J}$",
            "Model Answer": "$Q = ms\\Delta\\theta = 2 \\times 4200 \\times 10 = 84,000\\text{ J}$।",
            "Teacher Note / Explanation": "গৃহীত বা বর্জিত তাপের সূত্র।"
        },

        # --- অধ্যায় ০৭: তরঙ্গ ও শব্দ ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "তরঙ্গ ও শব্দ (তরঙ্গবেগ ও কম্পাঙ্ক)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "বাতাসে একটি শব্দের কম্পাঙ্ক $400\\text{ Hz}$ এবং তরঙ্গদৈর্ঘ্য $0.85\\text{ m}$ হলে শব্দের বেগ কত?",
            "Option A": "$320\\text{ m/s}$", "Option B": "$340\\text{ m/s}$", "Option C": "$350\\text{ m/s}$", "Option D": "$300\\text{ m/s}$",
            "Correct Option": "B", "Correct Answer": "$340\\text{ m/s}$",
            "Model Answer": "$v = f\\lambda = 400 \\times 0.85 = 340\\text{ m/s}$।",
            "Teacher Note / Explanation": "$v = f\\lambda$ সূত্রের নির্ভুল প্রয়োগ।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "তরঙ্গ ও শব্দ (শব্দ ও প্রতিধ্বনি)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "শব্দ তরঙ্গের ক্ষেত্রে—\ni. শব্দ একটি অনুদৈর্ঘ্য যান্ত্রিক তরঙ্গ\nii. বায়ুর তাপমাত্রা বৃদ্ধি পেলে শব্দের বেগ বৃদ্ধি পায়\niii. মস্তিষ্কে শব্দের অনুভূতির স্থায়িত্বকাল $0.1\\text{ s}$\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Model Answer": "শব্দ অনুদৈর্ঘ্য তরঙ্গ, শব্দানুভূতি ০.১ সেকেন্ড স্থায়ী হয় এবং তাপমাত্রা বৃদ্ধিতে শব্দের বেগ বাড়ে। তিনটিই সঠিক।",
            "Teacher Note / Explanation": "শব্দের ভৌত বৈশিষ্ট্য ও শব্দানুভূতির স্থায়িত্বকাল।"
        },

        # --- অধ্যায় ০৮: আলোর প্রতিফলন ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "আলোর প্রতিফলন (গোলীয় দর্পণ)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি অবতল দর্পণের বক্রতার ব্যাসার্ধ $24\\text{ cm}$ হলে এর ফোকাস দূরত্ব কত?",
            "Option A": "$48\\text{ cm}$", "Option B": "$12\\text{ cm}$", "Option C": "$6\\text{ cm}$", "Option D": "$24\\text{ cm}$",
            "Correct Option": "B", "Correct Answer": "$12\\text{ cm}$",
            "Model Answer": "ফোকাস দূরত্ব $f = \\frac{R}{2} = \\frac{24}{2} = 12\\text{ cm}$।",
            "Teacher Note / Explanation": "গোলীয় দর্পণের ফোকাস দূরত্ব ও বক্রতার ব্যাসার্ধের সম্পর্ক।"
        },

        # --- অধ্যায় ০৯: আলোর প্রতিসরণ ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "আলোর প্রতিসরণ (লেন্সের ক্ষমতা)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি উত্তল লেন্সের ফোকাস দূরত্ব $+25\\text{ cm}$ হলে লেন্সটির ক্ষমতা ($P$) কত?",
            "Option A": "$+4\\text{ D}$", "Option B": "$-4\\text{ D}$", "Option C": "$+0.25\\text{ D}$", "Option D": "$+2.5\\text{ D}$",
            "Correct Option": "A", "Correct Answer": "$+4\\text{ D}$",
            "Model Answer": "$f = +0.25\\text{ m}$। $P = \\frac{1}{f} = \\frac{1}{0.25} = +4\\text{ D}$।",
            "Teacher Note / Explanation": "ডায়োপ্টার এককে লেন্সের ক্ষমতা নির্ণয়।"
        },

        # --- অধ্যায় ১০: স্থির বিদ্যুৎ ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "স্থির বিদ্যুৎ (কুলম্বের সূত্র)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "দুটি আধানের মধ্যবর্তী দূরত্ব অর্ধেক করা হলে তাদের মধ্যকার আকর্ষণ বা বিকর্ষণ বলের মান কত হবে?",
            "Option A": "অর্ধেক", "Option B": "দ্বিগুণ", "Option C": "৪ গুণ", "Option D": "এক-চতুর্থাংশ",
            "Correct Option": "C", "Correct Answer": "৪ গুণ",
            "Model Answer": "কুলম্বের সূত্রানুসারে $F \\propto \\frac{1}{r^2}$। দূরত্ব অর্ধেক ($r/2$) হলে বল $\\frac{1}{(1/2)^2} = 4$ গুণ বৃদ্ধি পাবে।",
            "Teacher Note / Explanation": "দূরত্বের ব্যস্তানুপাতিক বর্গীয় নিয়ম।"
        },

        # --- অধ্যায় ১১: চল বিদ্যুৎ ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "চল বিদ্যুৎ (তুল্যরোধ ও ওহমের সূত্র)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "দুটি সমান মানের রোধ সমান্তরাল সমবায়ে যুক্ত করলে তুল্যরোধ $5\\,\\Omega$ হয়। এদের শ্রেণী সমবায়ে যুক্ত করলে তুল্যরোধ কত হবে?",
            "Option A": "$10\\,\\Omega$", "Option B": "$20\\,\\Omega$", "Option C": "$2.5\\,\\Omega$", "Option D": "$15\\,\\Omega$",
            "Correct Option": "B", "Correct Answer": "$20\\,\\Omega$",
            "Model Answer": "সমান্তরালে $R_p = \\frac{R}{2} = 5 \\implies R = 10\\,\\Omega$। শ্রেণীতে $R_s = R + R = 10 + 10 = 20\\,\\Omega$।",
            "Teacher Note / Explanation": "শ্রেণী ও সমান্তরাল সমবায়ের তুলনা।"
        },

        # --- অধ্যায় ১২: বিদ্যুতের চৌম্বক ক্রিয়া ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বিদ্যুতের চৌম্বক ক্রিয়া (ট্রান্সফরমার)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "একটি স্টেপ-আপ ট্রান্সফরমারে—\ni. গৌণ কুণ্ডলীর ভোল্টেজ মুখ্য কুণ্ডলীর চেয়ে বেশি ($V_s > V_p$)\nii. গৌণ কুণ্ডলীর পাকসংখ্যা মুখ্য কুণ্ডলীর চেয়ে বেশি ($N_s > N_p$)\niii. গৌণ কুণ্ডলীর তড়িৎপ্রবাহ মুখ্য কুণ্ডলীর চেয়ে বেশি ($I_s > I_p$)\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "A", "Correct Answer": "i ও ii",
            "Model Answer": "স্টেপ-আপ ট্রান্সফরমারে ভোল্টেজ বাড়ে কিন্তু তড়িৎপ্রবাহ হ্রাস পায় ($I_s < I_p$)। তাই iii ভুল।",
            "Teacher Note / Explanation": "ট্রান্সফরমারে শক্তি সংরক্ষণের নীতি।"
        },

        # --- অধ্যায় ১৩: আধুনিক পদার্থবিজ্ঞান ও ইলেকট্রনিকস ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "আধুনিক পদার্থবিজ্ঞান (তেজস্ক্রিয়তা)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "তেজস্ক্রিয় বিকিরণে নির্গত কোন রশ্মির ভেদন ক্ষমতা সবচেয়ে বেশি?",
            "Option A": "আলফা ($\\alpha$) রশ্মি", "Option B": "বিটা ($\\beta$) রশ্মি", "Option C": "গামা ($\\gamma$) রশ্মি", "Option D": "এক্স-রশ্মি",
            "Correct Option": "C", "Correct Answer": "গামা ($\\gamma$) রশ্মি",
            "Model Answer": "গামা রশ্মি উচ্চ শক্তিসম্পন্ন তড়িৎচৌম্বক তরঙ্গ হওয়ায় এর ভেদন ক্ষমতা সর্বাধিক।",
            "Teacher Note / Explanation": "তেজস্ক্রিয় রশ্মির তুলনামূলক ভেদন ক্ষমতা।"
        },

        # --- অধ্যায় ১৪: জীবন বাঁচাতে পদার্থবিজ্ঞান ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "জীবন বাঁচাতে পদার্থবিজ্ঞান (চিকিৎসা যন্ত্রপাতি)",
            "Difficulty": "EASY", "Marks": 1,
            "Question Text": "কোনো অঙ্গের ত্রিমাত্রিক (3D) প্রতিচ্ছবি পাওয়ার জন্য চিকিৎসাক্ষেত্রে নিচের কোনটি ব্যবহৃত হয়?",
            "Option A": "ইসিজি (ECG)", "Option B": "এক্স-রে (X-ray)", "Option C": "সিটি স্ক্যান (CT Scan)", "Option D": "এন্ডোস্কোপি",
            "Correct Option": "C", "Correct Answer": "সিটি স্ক্যান (CT Scan)",
            "Model Answer": "সিটি স্ক্যান (Computed Tomography) ত্রিমাত্রিক ও প্রস্থচ্ছেদের পুঙ্খানুপুঙ্খ চিত্র তৈরি করতে পারে।",
            "Teacher Note / Explanation": "আধুনিক রোগ নির্ণয়কারী যন্ত্রপাতির কার্যকারিতা।"
        }
    ]

    # =========================================================================
    # 2. 2 SMCQs (অভিন্ন তথ্যভিত্তিক বহুনির্বাচনী প্রশ্ন) - 3 MCQs each = 6 MCQs
    # =========================================================================
    smcqs = [
        # --- SMCQ 1: গতি ও বল (অধ্যায় ০২ ও ০৩) ---
        {
            "Type": "SMCQ", "Class Name": class_name, "Subject": subject, "Topic": "গতি ও বল (অভিন্ন তথ্যভিত্তিক)",
            "Difficulty": "HARD", "Marks": 3,
            "Question Text": "উদ্দীপকটি পড় এবং পরবর্তী ৩টি প্রশ্নের উত্তর দাও:\n$1000\\text{ kg}$ ভরের একটি প্রাইভেট কার স্থির অবস্থান হতে যাত্রা শুরু করে $2\\text{ m/s}^2$ সুষম ত্বরণে $10\\text{ s}$ চলল। এরপর চালক ব্রেক চেপে $5\\text{ s}$-এ গাড়িটি থামিয়ে দিলেন।",
            "Teacher Note / Explanation": "ত্বরণ, মন্দন ও বল সংক্রান্ত অভিন্ন তথ্যভিত্তিক প্রশ্নাবলী।",
            # Sub 1
            "Sub 1 Text": "প্রথম ১০ সেকেন্ড পর গাড়িটির বেগ কত হবে?",
            "Sub 1 Marks": 1,
            "Sub 1 Option A": "$10\\text{ m/s}$", "Sub 1 Option B": "$20\\text{ m/s}$", "Sub 1 Option C": "$40\\text{ m/s}$", "Sub 1 Option D": "$5\\text{ m/s}$",
            "Sub 1 Correct Option": "B",
            "Sub 1 Model Answer": "$v = u + at = 0 + 2 \\times 10 = 20\\text{ m/s}$।",
            "Sub 1 Explanation": "সুষম ত্বরণে বেগ নির্ণয়।",
            # Sub 2
            "Sub 2 Text": "ব্রেক চাপার পর গাড়িটির মন্দন কত ছিল?",
            "Sub 2 Marks": 1,
            "Sub 2 Option A": "$2\\text{ m/s}^2$", "Sub 2 Option B": "$3\\text{ m/s}^2$", "Sub 2 Option C": "$4\\text{ m/s}^2$", "Sub 2 Option D": "$5\\text{ m/s}^2$",
            "Sub 2 Correct Option": "C",
            "Sub 2 Model Answer": "$a = \\frac{v - u}{t} = \\frac{0 - 20}{5} = -4\\text{ m/s}^2$। মন্দন $= 4\\text{ m/s}^2$।",
            "Sub 2 Explanation": "মন্দন নির্ণয়।",
            # Sub 3
            "Sub 3 Text": "ব্রেকজনিত বলের মান কত নিউটন ছিল?",
            "Sub 3 Marks": 1,
            "Sub 3 Option A": "$2000\\text{ N}$", "Sub 3 Option B": "$3000\\text{ N}$", "Sub 3 Option C": "$4000\\text{ N}$", "Sub 3 Option D": "$5000\\text{ N}$",
            "Sub 3 Correct Option": "C",
            "Sub 3 Model Answer": "$F = ma = 1000 \\times 4 = 4000\\text{ N}$।",
            "Sub 3 Explanation": "নিউটনের ২য় সূত্র প্রয়োগ।"
        },

        # --- SMCQ 2: চল বিদ্যুৎ (অধ্যায় ১১) ---
        {
            "Type": "SMCQ", "Class Name": class_name, "Subject": subject, "Topic": "চল বিদ্যুৎ (অভিন্ন তথ্যভিত্তিক)",
            "Difficulty": "HARD", "Marks": 3,
            "Question Text": "উদ্দীপকটি পড় এবং পরবর্তী ৩টি প্রশ্নের উত্তর দাও:\nএকটি তড়িৎ উৎসের তড়িৎচালক শক্তি $12\\text{ V}$। এর সাথে $6\\,\\Omega$ ও $12\\,\\Omega$ মানের দুটি রোধ সমান্তরাল সমবায়ে যুক্ত আছে।",
            "Teacher Note / Explanation": "সমান্তরাল বর্তনীর তুল্যরোধ, প্রবাহ ও ক্ষমতা সংক্রান্ত প্রশ্ন।",
            # Sub 1
            "Sub 1 Text": "রোধদ্বয়ের তুল্যরোধ কত ওহম?",
            "Sub 1 Marks": 1,
            "Sub 1 Option A": "$18\\,\\Omega$", "Sub 1 Option B": "$4\\,\\Omega$", "Sub 1 Option C": "$3\\,\\Omega$", "Sub 1 Option D": "$9\\,\\Omega$",
            "Sub 1 Correct Option": "B",
            "Sub 1 Model Answer": "$R_p = \\frac{6 \\times 12}{6 + 12} = \\frac{72}{18} = 4\\,\\Omega$।",
            "Sub 1 Explanation": "সমান্তরাল তুল্যরোধের হিসাব।",
            # Sub 2
            "Sub 2 Text": "বর্তনীর মূল তড়িৎপ্রবাহ কত অ্যাম্পিয়ার?",
            "Sub 2 Marks": 1,
            "Sub 2 Option A": "$1\\text{ A}$", "Sub 2 Option B": "$2\\text{ A}$", "Sub 2 Option C": "$3\\text{ A}$", "Sub 2 Option D": "$4\\text{ A}$",
            "Sub 2 Correct Option": "C",
            "Sub 2 Model Answer": "$I = \\frac{V}{R_p} = \\frac{12}{4} = 3\\text{ A}$।",
            "Sub 2 Explanation": "ওহমের সূত্র প্রয়োগ।",
            # Sub 3
            "Sub 3 Text": "বর্তনীটিতে মোট কত ওয়াট তড়িৎ ক্ষমতা ব্যয়িত হচ্ছে?",
            "Sub 3 Marks": 1,
            "Sub 3 Option A": "$24\\text{ W}$", "Sub 3 Option B": "$36\\text{ W}$", "Sub 3 Option C": "$48\\text{ W}$", "Sub 3 Option D": "$72\\text{ W}$",
            "Sub 3 Correct Option": "B",
            "Sub 3 Model Answer": "$P = VI = 12 \\times 3 = 36\\text{ W}$।",
            "Sub 3 Explanation": "তড়িৎ ক্ষমতার সূত্র।"
        }
    ]

    # =========================================================================
    # 3. 7 SHORT QUESTIONS (SQ) - Answer 5, each 2 marks = 10 Marks
    # =========================================================================
    sqs = [
        # SQ 1 (অধ্যায় ০১: ভৌত রাশি)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "ভৌত রাশি (কাজের মাত্রা সমীকরণ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "কাজের মাত্রা সমীকরণ প্রতিপাদন কর।",
            "Model Answer": "কাজ $=$ বল $\\times$ সরণ $=$ (ভর $\\times$ ত্বরণ) $\\times$ সরণ $=$ ভর $\\times \\frac{\\text{বেগ}}{\\text{সময়}} \\times$ সরণ $=$ ভর $\\times \\frac{\\text{সরণ}}{\\text{সময়}^2} \\times$ সরণ।\nঅতএব, কাজের মাত্রা $[W] = [M] \\times \\frac{[L]}{[T]^2} \\times [L] = [ML^2 T^{-2}]$।",
            "Teacher Note / Explanation": "মৌলিক মাত্রা সমীকরণ বিশ্লেষণের মাধ্যমে কাজের মাত্রা নির্ণয়।"
        },
        # SQ 2 (অধ্যায় ০২: গতি)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "গতি (সুষম বৃত্তাকার গতিতে ত্বরণ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "সুষম দ্রুতিতে ঘূর্ণনরত বস্তুর ত্বরণ থাকে কেন? ব্যাখ্যা কর।",
            "Model Answer": "ত্বরণ হলো সময়ের সাথে বেগের পরিবর্তনের হার। বেগ একটি ভেক্টর রাশি, যার মান ও দিক উভয়ই আছে। সুষম দ্রুতিতে ঘূর্ণনরত বস্তুর দ্রুতি (বেগের মান) স্থির থাকলেও প্রতি মুহূর্তে গতিপথের দিক পরিবর্তিত হয়। বেগের দিকের এই ক্রমাগত পরিবর্তনের কারণে বস্তুতে কেন্দ্রের দিকে একটি ত্বরণ সৃষ্টি হয়, যাকে কেন্দ্রমুখী ত্বরণ ($a = \\frac{v^2}{r}$) বলে।",
            "Teacher Note / Explanation": "ভেক্টর রাশির দিক পরিবর্তনজনিত ত্বরণের সঠিক বৈজ্ঞানিক ব্যাখ্যা।"
        },
        # SQ 3 (অধ্যায় ০৩: বল)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "বল (ঘর্ষণের প্রকারভেদ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "কোনো ভারী বস্তুকে মেঝের ওপর দিয়ে টেনে নেওয়ার চেয়ে চাকা লাগিয়ে গড়িয়ে নেওয়া সহজ কেন?",
            "Model Answer": "কোনো বস্তুকে টেনে নেওয়ার সময় তলের সাথে পিছলানো ঘর্ষণ (Sliding Friction) কাজ করে, যেখানে দুটি তলের খাঁজগুলো পরস্পরের মধ্যে শক্তভাবে আটকে যায়। পক্ষান্তরে, চাকা লাগিয়ে গড়ালে আবর্ত ঘর্ষণ (Rolling Friction) কাজ করে, যেখানে চাকা মেঝেকে স্পর্শ করে সামান্য সময়েই উঠে যায়। আবর্ত ঘর্ষণ বলের মান পিছলানো ঘর্ষণের চেয়ে অনেক কম হওয়ায় চাকাযুক্ত বস্তুকে সরানো অনেক সহজ হয়।",
            "Teacher Note / Explanation": "আবর্ত ঘর্ষণ ও পিছলানো ঘর্ষণের তুলনামূলক বৈজ্ঞানিক কারণ।"
        },
        # SQ 4 (অধ্যায় ০৫: পদার্থের অবস্থা ও চাপ)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের অবস্থা ও চাপ (নদী ও সমুদ্রের প্লবতা)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "নদীর পানি অপেক্ষা সমুদ্রের পানিতে সাঁতার কাটা সহজ কেন? ব্যাখ্যা কর।",
            "Model Answer": "প্লবতা নির্ভর করে অপসারিত তরলের ঘনত্বের ওপর ($F_B = V\\rho g$)। সমুদ্রের পানিতে বিভিন্ন ধরনের লবণ দ্রবীভূত থাকায় এর ঘনত্ব নদীর মিষ্টি পানির ঘনত্বের চেয়ে বেশি। ফলে সমুদ্রের পানিতে নিমজ্জিত ব্যক্তির শরীরের ওপর নদীর চেয়ে বেশি ঊর্ধ্বমুখী প্লবতা বল প্রযুক্ত হয়। অধিক প্লবতার কারণে শরীর সহজে ভেসে থাকে, তাই সমুদ্রে সাঁতার কাটা সহজ।",
            "Teacher Note / Explanation": "ঘনত্ব ও প্লবতার মধ্যকার সম্পর্কের প্রয়োগ।"
        },
        # SQ 5 (অধ্যায় ০৬: তাপ)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "বস্তুর ওপর তাপের প্রভাব (সুপ্ততাপ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$0^\\circ\\text{C}$ তাপমাত্রার $1\\text{ kg}$ বরফকে $0^\\circ\\text{C}$ তাপমাত্রার পানিতে রূপান্তর করতে কত তাপ লাগবে? (বরফ গলনের সুপ্ততাপ $L_f = 3.36 \\times 10^5\\text{ J/kg}$)",
            "Model Answer": "তাপমাত্রার পরিবর্তন না ঘটিয়ে শুধু অবস্থার পরিবর্তনে প্রয়োজনীয় তাপ হলো গলনের সুপ্ততাপ।\n$Q = mL_f = 1\\text{ kg} \\times (3.36 \\times 10^5\\text{ J/kg}) = 3.36 \\times 10^5\\text{ J}$ বা $336\\text{ kJ}$।",
            "Teacher Note / Explanation": "সুপ্ততাপের সূত্রের সরাসরি প্রয়োগ।"
        },
        # SQ 6 (অধ্যায় ০৭: তরঙ্গ ও শব্দ)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "তরঙ্গ ও শব্দ (তাপমাত্রার সাথে শব্দের বেগ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "গ্রীষ্মকালে শীতকালের চেয়ে শব্দ দ্রুত শোনা যায় কেন?",
            "Model Answer": "গ্যাসে শব্দের বেগ পরম তাপমাত্রার বর্গমূলের সমানুপাতিক ($v \\propto \\sqrt{T}$)। গ্রীষ্মকালে বায়ুর তাপমাত্রা শীতকালের তুলনায় বেশি থাকে। তাপমাত্রা বৃদ্ধি পেলে বায়ুর অনুগুলোর গতিশক্তি বৃদ্ধি পায় এবং স্থিতিস্থাপকতা ও ঘনত্বের পরিবর্তনের কারণে শব্দের বেগ বৃদ্ধি পায়। প্রতি ডিগ্রি সেলসিয়াস তাপমাত্রা বৃদ্ধিতে শব্দের বেগ প্রায় $0.6\\text{ m/s}$ বৃদ্ধি পায়। এজন্য গ্রীষ্মকালে শব্দ দ্রুত পরিবাহিত হয়।",
            "Teacher Note / Explanation": "$v \\propto \\sqrt{T}$ সমীকরণভিত্তিক যুক্তি।"
        },
        # SQ 7 (অধ্যায় ১১: চল বিদ্যুৎ)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "চল বিদ্যুৎ (তড়িৎ ক্ষমতা)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "একটি নির্দিষ্ট রোধের পরিবাহীর দুই প্রান্তের বিভব পার্থক্য দ্বিগুণ করা হলে ব্যয়িত তড়িৎ ক্ষমতা কতগুণ হবে?",
            "Model Answer": "আমরা জানি, ব্যয়িত ক্ষমতা $P = \\frac{V^2}{R}$ (যেখানে রোধ $R$ ধ্রুবক)।\nবিভব পার্থক্য $V' = 2V$ করা হলে নতুন ক্ষমতা:\n$P' = \\frac{(2V)^2}{R} = \\frac{4V^2}{R} = 4P$।\nঅতএব, বিভব পার্থক্য দ্বিগুণ করা হলে ব্যয়িত তড়িৎ ক্ষমতা ৪ গুণ হবে।",
            "Teacher Note / Explanation": "ক্ষমতার সমীকরণে বিভব পার্থক্যের বর্গের নির্ভরশীলতা।"
        }
    ]

    # =========================================================================
    # 4. 7 CREATIVE QUESTIONS (CQ) - 3+2+2 Structure
    # 3 from Section A (Mechanics & Matter), 2 from Section B (Heat, Waves & Optics), 2 from Section C (Electricity & Modern)
    # Total marks 40 (Answer 5 * 8 = 40 or standard 10 marks per CQ with Sub 1=2, Sub 2=4, Sub 3=4)
    # =========================================================================
    cqs = [
        # --- ক-বিভাগ: মেকানিক্স ও পদার্থ (প্রশ্ন ১: গতি ও বল) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "গতি ও বল (সুষম ত্বরণ ও ব্রেকিং বল)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "উদ্দীপক: $800\\text{ kg}$ ভরের একটি প্রাইভেট কার স্থির অবস্থান হতে যাত্রা শুরু করে $2\\text{ m/s}^2$ সুষম ত্বরণে $10\\text{ s}$ চলল। এরপর গাড়িটি অর্জিত সুষম বেগে $20\\text{ s}$ চলার পর চালক ব্রেক চেপে $5\\text{ s}$-এ গাড়িটিকে সম্পূর্ণরূপে থামিয়ে দিলেন।",
            "Teacher Note / Explanation": "২য় ও ৩য় অধ্যায় (গতি ও বল) থেকে বহু-ধাপীয় গতি ও ব্রেকিং বল সংক্রান্ত সমন্বিত প্রশ্ন।",
            # ক
            "Sub 1 Text": "ত্বরণ কাকে বলে? এর এসআই (SI) একক ও মাত্রা লিখ।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "সময়ের সাথে কোনো বস্তুর অসম বেগের পরিবর্তনের হারকে ত্বরণ বলে।\nত্বরণের এসআই একক $\\text{m/s}^2$ (মিটার প্রতি বর্গসেকেন্ড) এবং মাত্রা $[LT^{-2}]$।",
            "Sub 1 Explanation": "ত্বরণের সংজ্ঞা, একক ও মাত্রা।",
            # খ
            "Sub 2 Text": "প্রথম ১০ সেকেন্ডে গাড়িটির অর্জিত শেষবেগ এবং অতিক্রান্ত দূরত্ব নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "দেওয়া আছে, আদিবেগ $u = 0$, ত্বরণ $a = 2\\text{ m/s}^2$, সময় $t_1 = 10\\text{ s}$।\n১০ সেকেন্ড পর অর্জিত বেগ $v_1 = u + at_1 = 0 + 2 \\times 10 = 20\\text{ m/s}$।\nপ্রথম ১০ সেকেন্ডে অতিক্রান্ত দূরত্ব:\n$s_1 = ut_1 + \\frac{1}{2}at_1^2 = 0 + \\frac{1}{2} \\times 2 \\times (10)^2 = 100\\text{ m}$।\nঅতএব অর্জিত বেগ $20\\text{ m/s}$ এবং অতিক্রান্ত দূরত্ব $100\\text{ মিটার}$।",
            "Sub 2 Explanation": "গতির সূত্র প্রয়োগ করে বেগ ও দূরত্ব হিসাব।",
            # গ
            "Sub 3 Text": "গাড়িটির সমগ্র গতিপথের মোট অতিক্রান্ত দূরত্ব নির্ণয় কর এবং ত্বরণকাল ও মন্দনকালে প্রযুক্ত নিট বলের মান তুলনা কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "১ম ধাপ: ত্বরণকালে দূরত্ব $s_1 = 100\\text{ m}$। প্রযুক্ত বল $F_1 = ma_1 = 800 \\times 2 = 1600\\text{ N}$।\n২য় ধাপ: সুষম বেগে ২০ সেকেন্ডে দূরত্ব $s_2 = v_1 \\times t_2 = 20 \\times 20 = 400\\text{ m}$।\n৩য় ধাপ: ব্রেক চাপায় শেষবেগ $v_3 = 0$, আদিবেগ $u_3 = 20\\text{ m/s}$, সময় $t_3 = 5\\text{ s}$।\nমন্দন $a_3 = \\frac{v_3 - u_3}{t_3} = \\frac{0 - 20}{5} = -4\\text{ m/s}^2$ (মন্দন $4\\text{ m/s}^2$)।\nমন্দনকালে দূরত্ব $s_3 = \\left(\\frac{u_3 + v_3}{2}\\right) t_3 = \\left(\\frac{20 + 0}{2}\\right) \\times 5 = 50\\text{ m}$।\nমোট অতিক্রান্ত দূরত্ব $s = s_1 + s_2 + s_3 = 100 + 400 + 50 = 550\\text{ মিটার}$।\nব্রেকিং বল $F_2 = ma_3 = 800 \\times 4 = 3200\\text{ N}$।\nবলদ্বয়ের তুলনা: $\\frac{F_2}{F_1} = \\frac{3200}{1600} = 2$। অর্থাৎ মন্দনকালে প্রযুক্ত বল ত্বরণকালীন বলের দ্বিগুণ।",
            "Sub 3 Explanation": "তিনটি পৃথক ধাপের দূরত্ব যোগ ও বলের অনুপাত নির্ণয়।"
        },

        # --- ক-বিভাগ: মেকানিক্স ও পদার্থ (প্রশ্ন ২: কাজ, ক্ষমতা ও শক্তি) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "কাজ, ক্ষমতা ও শক্তি (যান্ত্রিক শক্তির সংরক্ষণশীলতা)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "উদ্দীপক: $50\\text{ m}$ উঁচু একটি ভবনের ছাদ থেকে $2\\text{ kg}$ ভরের একটি বস্তুকে মুক্তভাবে নিচে ফেলে দেওয়া হলো। ($g = 9.8\\text{ m/s}^2$)",
            "Teacher Note / Explanation": "৪র্থ অধ্যায় (কাজ, ক্ষমতা ও শক্তি) থেকে মুক্তভাবে পড়ন্ত বস্তুর শক্তির সংরক্ষণশীলতা নীতি পরীক্ষা।",
            # ক
            "Sub 1 Text": "কর্মদক্ষতা (Efficiency) কাকে বলে? এর কোনো একক নেই কেন?",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "কোনো ব্যবস্থা বা যন্ত্র থেকে প্রাপ্ত মোট কার্যকর শক্তি এবং যন্ত্রে প্রদত্ত মোট শক্তির অনুপাতকে কর্মদক্ষতা বলে।\nকর্মদক্ষতা দুটি সমজাতীয় রাশির (শক্তি বা ক্ষমতা) অনুপাত হওয়ায় এর কোনো একক নেই।",
            "Sub 1 Explanation": "কর্মদক্ষতার সংজ্ঞা ও মাত্রাহীনতার কারণ।",
            # খ
            "Sub 2 Text": "পতনকালে ভূমি হতে কত উচ্চতায় বস্তুটির গতিশক্তি বিভবশক্তির দ্বিগুণ হবে?",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "ধরি, ভূমি হতে $x$ মিটার উচ্চতায় গতিশক্তি বিভবশক্তির দ্বিগুণ হবে ($E_k = 2E_p$)।\nভূমি থেকে উচ্চতা $= x$, সুতরাং বস্তুটির পতন দূরত্ব $= (50 - x)$।\nউচ্চতা $x$-এ বিভবশক্তি $E_p = mgx$।\nগতিশক্তি $E_k = \\frac{1}{2}mv^2 = \\frac{1}{2}m(2g(50 - x)) = mg(50 - x)$।\nশর্তমতে, $E_k = 2E_p$\n$\\implies mg(50 - x) = 2mgx$\n$\\implies 50 - x = 2x$\n$\\implies 3x = 50 \\implies x = \\frac{50}{3} \\approx 16.67\\text{ m}$।\nঅতএব ভূমি হতে $16.67\\text{ মিটার}$ উচ্চতায় গতিশক্তি বিভবশক্তির দ্বিগুণ হবে।",
            "Sub 2 Explanation": "গতিশক্তি ও বিভবশক্তির সমীকরণ গঠন করে উচ্চতা নির্ণয়।",
            # গ
            "Sub 3 Text": "বস্তুটির সর্বোচ্চ বিন্দুতে, পতনের মধ্যবিন্দুতে ($25\\text{ m}$) এবং ভূমি স্পর্শ করার পূর্বমুহূর্তে মোট যান্ত্রিক শক্তি সংরক্ষিত থাকে কিনা—গাণিতিকভাবে যাচাই কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "(১) সর্বোচ্চ বিন্দুতে ($h = 50\\text{ m}$):\nবেগ $v = 0 \\implies E_k = 0$।\nবিভবশক্তি $E_p = mgh = 2 \\times 9.8 \\times 50 = 980\\text{ J}$।\nমোট শক্তি $E_1 = E_k + E_p = 0 + 980 = 980\\text{ J}$।\n\n(২) পতনের মধ্যবিন্দুতে ($h = 25\\text{ m}$, পতন দূরত্ব $d = 25\\text{ m}$):\nবিভবশক্তি $E_p = mgh = 2 \\times 9.8 \\times 25 = 490\\text{ J}$।\nগতিশক্তি $E_k = mgd = 2 \\times 9.8 \\times 25 = 490\\text{ J}$।\nমোট শক্তি $E_2 = 490 + 490 = 980\\text{ J}$।\n\n(৩) ভূমি স্পর্শের মুহূর্তে ($h = 0$, পতন দূরত্ব $d = 50\\text{ m}$):\nবিভবশক্তি $E_p = mg(0) = 0\\text{ J}$।\nগতিশক্তি $E_k = mgd = 2 \\times 9.8 \\times 50 = 980\\text{ J}$।\nমোট শক্তি $E_3 = 980 + 0 = 980\\text{ J}$।\nযেহেতু $E_1 = E_2 = E_3 = 980\\text{ J}$, সুতরাং বস্তুটির গতিপথে মোট যান্ত্রিক শক্তি সংরক্ষিত থাকে।",
            "Sub 3 Explanation": "তিনটি বিন্দুতে পৃথকভাবে শক্তির নিত্যতা যাচাই।"
        },

        # --- ক-বিভাগ: মেকানিক্স ও পদার্থ (প্রশ্ন ৩: পদার্থের অবস্থা ও চাপ - WITH CYLINDER DIAGRAM) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের অবস্থা ও চাপ (আর্কিমিডিসের নীতি ও প্লবতা)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের চিত্রটি লক্ষ্য কর:\n##GEO:cylinder[sides:r=0.08,h=0.5]##\nউদ্দীপক: একটি সমবৃত্তভূমিক নিরেট সিলিন্ডারের প্রস্থচ্ছেদের ক্ষেত্রফল $0.02\\text{ m}^2$ এবং উচ্চতা $0.5\\text{ m}$। বস্তুটিকে $1000\\text{ kg/m}^3$ ঘনত্বের পানিতে সম্পূর্ণ নিমজ্জিত করা হলো। সিলিন্ডারের ওপরের পৃষ্ঠ পানির উপরিভাগ হতে $1.5\\text{ m}$ গভীরে অবস্থিত। ($g = 9.8\\text{ m/s}^2$)",
            "Teacher Note / Explanation": "৫ম অধ্যায় (পদার্থের অবস্থা ও চাপ) থেকে নিমজ্জিত বস্তুর চাপ, আর্কিমিডিসের নীতি ও প্লবতা প্রমাণের আদর্শ সৃজনশীল।",
            # ক
            "Sub 1 Text": "প্যাসকেলের সূত্রটি বিবৃত কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "আবদ্ধ পাত্রে তরল বা বায়বীয় পদার্থের কোনো অংশের ওপর বাইরে থেকে চাপ প্রয়োগ করলে সেই চাপ কিছুমাত্র না কমে সবদিকে সমানভাবে সঞ্চালিত হয় এবং পাত্রের সংলগ্ন গায়ের ওপর লম্বভাবে কাজ করে।",
            "Sub 1 Explanation": "প্যাসকেলের সূত্রের সুস্পষ্ট বিবৃতি।",
            # খ
            "Sub 2 Text": "সিলিন্ডারের ওপরের পৃষ্ঠে এবং নিচের পৃষ্ঠে পানির চাপ ও প্রযুক্ত বল নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "ওপরের পৃষ্ঠের গভীরতা $h_1 = 1.5\\text{ m}$।\nওপরের পৃষ্ঠে চাপ $P_1 = h_1 \\rho g = 1.5 \\times 1000 \\times 9.8 = 14,700\\text{ Pa}$।\nওপরের পৃষ্ঠে নিম্নমুখী বল $F_1 = P_1 A = 14,700 \\times 0.02 = 294\\text{ N}$।\nনিচের পৃষ্ঠের গভীরতা $h_2 = 1.5 + 0.5 = 2.0\\text{ m}$।\nনিচের পৃষ্ঠে চাপ $P_2 = h_2 \\rho g = 2.0 \\times 1000 \\times 9.8 = 19,600\\text{ Pa}$।\nনিচের পৃষ্ঠে ঊর্ধ্বমুখী বল $F_2 = P_2 A = 19,600 \\times 0.02 = 392\\text{ N}$।",
            "Sub 2 Explanation": "উভয় পৃষ্ঠের চাপ ও বলের নির্ভুল গণনা।",
            # গ
            "Sub 3 Text": "সিলিন্ডারটির ওপর প্রযুক্ত প্লবতা নির্ণয় কর এবং দেখাও যে তা অপসারিত পানির ওজনের সমান (আর্কিমিডিসের নীতি সমর্থন করে)।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "লব্ধি ঊর্ধ্বমুখী বল বা প্লবতা $F_B = F_2 - F_1 = 392 - 294 = 98\\text{ N}$।\nআবার, সিলিন্ডারটির আয়তন $V = A \\times h = 0.02 \\times 0.5 = 0.01\\text{ m}^3$।\nযেহেতু সিলিন্ডারটি সম্পূর্ণ নিমজ্জিত, অপসারিত পানির আয়তন $V = 0.01\\text{ m}^3$।\nঅপসারিত পানির ভর $m = V\\rho = 0.01 \\times 1000 = 10\\text{ kg}$।\nঅপসারিত পানির ওজন $W = mg = 10 \\times 9.8 = 98\\text{ N}$।\nদেখা যাচ্ছে যে, প্লবতা ($F_B$) $=$ অপসারিত পানির ওজন ($W$) $= 98\\text{ N}$।\nঅতএব উদ্দীপকের তথ্যটি আর্কিমিডিসের নীতিকে সম্পূর্ণরূপে সমর্থন করে। (দেখানো হলো)",
            "Sub 3 Explanation": "উভয়মুখী বলের পার্থক্য থেকে প্লবতা বের করে অপসারিত পানির ওজনের সমতা প্রদর্শন।"
        },

        # --- খ-বিভাগ: তাপ, শব্দ ও আলোকবিজ্ঞান (প্রশ্ন ৪: তরঙ্গ ও শব্দ - WITH TRANSVERSE WAVE DIAGRAM) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "তরঙ্গ ও শব্দ (তরঙ্গবেগ ও প্রতিধ্বনি)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের তরঙ্গ চিত্রটি লক্ষ্য কর:\n##PRESET:wave-transverse##\nউদ্দীপক: একটি কম্পনশীল সুরশলাকা প্রতি সেকেন্ডে ২৫০ বার কম্পিত হয়ে বায়ুতে শব্দ তরঙ্গ সৃষ্টি করে। উক্ত স্থানে বায়ুর তাপমাত্রা $20^\\circ\\text{C}$ এবং $0^\\circ\\text{C}$ তাপমাত্রায় শব্দের বেগ $332\\text{ m/s}$। উৎস হতে $80\\text{ m}$ দূরে একটি প্রতিফলক দেওয়াল অবস্থিত।",
            "Teacher Note / Explanation": "৭ম অধ্যায় (তরঙ্গ ও শব্দ) থেকে কম্পাঙ্ক, তাপমাত্রা অনুসারে শব্দের বেগ ও প্রতিধ্বনি সংক্রান্ত সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "অনুপ্রস্থ তরঙ্গ ও অনুদৈর্ঘ্য তরঙ্গের মধ্যে মূল পার্থক্য কী?",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "যে তরঙ্গ মাধ্যমের কণাগুলোর স্পন্দনের দিকের সাথে লম্বভাবে অগ্রসর হয়, তাকে অনুপ্রস্থ তরঙ্গ (Transverse Wave) বলে (যেমন: পানির ঢেউ)।\nআর যে তরঙ্গ কণাগুলোর স্পন্দনের দিকের সাথে সমান্তরালে অগ্রসর হয়, তাকে অনুদৈর্ঘ্য তরঙ্গ (Longitudinal Wave) বলে (যেমন: শব্দ তরঙ্গ)।",
            "Sub 1 Explanation": "স্পন্দনের দিকের ভিত্তিতে তরঙ্গের সুস্পষ্ট পার্থক্য।",
            # খ
            "Sub 2 Text": "$20^\\circ\\text{C}$ তাপমাত্রায় বায়ুতে শব্দ তরঙ্গের বেগ এবং তরঙ্গদৈর্ঘ্য নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "$20^\\circ\\text{C}$ তাপমাত্রায় শব্দের বেগ:\n$v = v_0 + 0.6 \\times T = 332 + (0.6 \\times 20) = 332 + 12 = 344\\text{ m/s}$।\nকম্পাঙ্ক $f = 250\\text{ Hz}$।\nতরঙ্গদৈর্ঘ্য $\\lambda = \\frac{v}{f} = \\frac{344}{250} = 1.376\\text{ m}$।\nঅতএব শব্দের বেগ $344\\text{ m/s}$ এবং তরঙ্গদৈর্ঘ্য $1.376\\text{ মিটার}$।",
            "Sub 2 Explanation": "তাপমাত্রায় শব্দের বেগ নির্ণয় এবং $v = f\\lambda$ থেকে তরঙ্গদৈর্ঘ্য বের করা।",
            # গ
            "Sub 3 Text": "উৎস থেকে শব্দ তৈরি করলে প্রতিফলক দেওয়াল থেকে প্রতিধ্বনি শোনা যাবে কি? গাণিতিক বিশ্লেষণের মাধ্যমে মতামত দাও।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "উৎস হতে প্রতিফলকের দূরত্ব $d = 80\\text{ m}$।\nশব্দ গিয়ে ফিরে আসতে মোট অতিক্রান্ত দূরত্ব $= 2d = 2 \\times 80 = 160\\text{ m}$।\nপ্রতিধ্বনি শোনার প্রয়োজনীয় সময় $t = \\frac{2d}{v} = \\frac{160}{344} \\approx 0.465\\text{ s}$।\nআমরা জানি, মানুষের মস্তিষ্কে শব্দানুভূতির স্থায়িত্বকাল $0.1\\text{ s}$। কোনো শব্দের প্রতিধ্বনি শুনতে হলে মূল শব্দ ও প্রতিফলিত শব্দের মধ্যকার সময়ের ব্যবধান অবশ্যই ন্যূনতম $0.1\\text{ s}$ হতে হবে।\nযেহেতু এখানে সময় ব্যবধান $0.465\\text{ s} > 0.1\\text{ s}$, সুতরাং স্পষ্ট প্রতিধ্বনি শোনা যাবে।",
            "Sub 3 Explanation": "শব্দানুভূতির স্থায়িত্বকাল ০.১ সেকেন্ডের সাথে সময়ের তুলনা করে প্রতিধ্বনি নিশ্চিতকরণ।"
        },

        # --- খ-বিভাগ: তাপ, শব্দ ও আলোকবিজ্ঞান (প্রশ্ন ৫: আলোর প্রতিফলন - WITH CONCAVE MIRROR DIAGRAM) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "আলোর প্রতিফলন (অবতল দর্পণে বিম্ব গঠন)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের গোলীয় দর্পণের চিত্রটি লক্ষ্য কর:\n##PRESET:mirror-concave##\nউদ্দীপক: একটি অবতল দর্পণের বক্রতার ব্যাসার্ধ $30\\text{ cm}$। দর্পণের প্রধান অক্ষের ওপর মেরু থেকে $20\\text{ cm}$ দূরে $4\\text{ cm}$ দীর্ঘ একটি লক্ষ্যবস্তু লম্বভাবে রাখা হলো।",
            "Teacher Note / Explanation": "৮ম অধ্যায় (আলোর প্রতিফলন) থেকে অবতল দর্পণের ফোকাস, বিম্বের অবস্থান, প্রকৃতি ও বিবর্ধনের পূর্ণাঙ্গ গাণিতিক সমাধান।",
            # ক
            "Sub 1 Text": "প্রধান ফোকাস ও ফোকাস দূরত্ব কাকে বলে?",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "প্রধান অক্ষের সমান্তরাল ও নিকটবর্তী আলোক রশ্মিগুচ্ছ গোলীয় দর্পণে প্রতিফলিত হয়ে প্রধান অক্ষের ওপর যে নির্দিষ্ট বিন্দুতে মিলিত হয় (বা মিলিত হচ্ছে বলে মনে হয়), তাকে প্রধান ফোকাস ($F$) বলে।\nমেরু থেকে প্রধান ফোকাস পর্যন্ত দূরত্বকে ফোকাস দূরত্ব ($f$) বলে।",
            "Sub 1 Explanation": "প্রধান ফোকাস ও ফোকাস দূরত্বের সংজ্ঞা।",
            # খ
            "Sub 2 Text": "দর্পণটিতে সৃষ্ট বিম্বের অবস্থান, প্রকৃতি এবং দৈর্ঘ্য নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "বক্রতার ব্যাসার্ধ $R = 30\\text{ cm} \\implies f = \\frac{R}{2} = 15\\text{ cm}$।\nলক্ষ্যবস্তুর দূরত্ব $u = 20\\text{ cm}$, লক্ষ্যবস্তুর দৈর্ঘ্য $L = 4\\text{ cm}$।\nদর্পণের সমীকরণ হতে:\n$\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f} \\implies \\frac{1}{v} = \\frac{1}{15} - \\frac{1}{20} = \\frac{4 - 3}{60} = \\frac{1}{60} \\implies v = +60\\text{ cm}$।\nযেহেতু $v$ ধনাত্মক, বিম্বটি দর্পণের সামনে $60\\text{ cm}$ দূরে গঠিত হবে এবং এটি বাস্তব ও উল্টো।\nরৈখিক বিবর্ধন $m = \\left|\\frac{v}{u}\\right| = \\frac{60}{20} = 3$।\nবিম্বের দৈর্ঘ্য $L' = m \\times L = 3 \\times 4 = 12\\text{ cm}$।",
            "Sub 2 Explanation": "দর্পণ সূত্র থেকে বিম্বের দূরত্ব ও বিবর্ধন নির্ণয়।",
            # গ
            "Sub 3 Text": "লক্ষ্যবস্তুটিকে দর্পণের মেরু থেকে $10\\text{ cm}$ দূরে স্থাপন করা হলে বিম্বের প্রকৃতি ও অবস্থানের কী পরিবর্তন ঘটবে? রশ্মিচিত্রের মূল নিয়মাবলি সহ ব্যাখ্যা কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "যখন $u = 10\\text{ cm}$, তখন লক্ষ্যবস্তুটি প্রধান ফোকাস ($f = 15\\text{ cm}$) এবং মেরুর মধ্যে অবস্থিত ($u < f$)।\nনতুন সমীকরণ:\n$\\frac{1}{v} = \\frac{1}{f} - \\frac{1}{u} = \\frac{1}{15} - \\frac{1}{10} = \\frac{2 - 3}{30} = -\\frac{1}{30} \\implies v = -30\\text{ cm}$।\nবিম্বের বৈশিষ্ট্যসমূহের পরিবর্তন:\n১. অবস্থান: বিম্বটি দর্পণের পেছনে $30\\text{ cm}$ দূরত্বে গঠিত হবে।\n২. প্রকৃতি: $v$ ঋণাত্মক হওয়ায় বিম্বটি অবাস্তব ও সোজা হবে (পূর্বে বাস্তব ও উল্টো ছিল)।\n৩. বিবর্ধন: $m = \\left|\\frac{-30}{10}\\right| = 3$, বিম্বটি বিবর্ধিত হবে ($L' = 12\\text{ cm}$)।\nরশ্মিচিত্রের নিয়ম: বস্তু থেকে প্রধান অক্ষের সমান্তরাল রশ্মি প্রতিফলনের পর ফোকাস দিয়ে যায় এবং বক্রতার কেন্দ্র বরাবর আপতিত রশ্মি একই পথে ফিরে আসে। পেছনের দিকে বর্ধিত করলে তারা দর্পণের পেছনে মিলিত হয়ে অবাস্তব ও সোজা বিম্ব গঠন করে।",
            "Sub 3 Explanation": "ফোকাসের ভেতরে বস্তুর অবস্থানের কারণে বাস্তব থেকে অবাস্তব বিম্বে রূপান্তরের বিশদ ব্যাখ্যা।"
        },

        # --- গ-বিভাগ: তড়িৎ, চুম্বক ও আধুনিক পদার্থবিজ্ঞান (প্রশ্ন ৬: চল বিদ্যুৎ - WITH CIRCUIT DIAGRAM) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "চল বিদ্যুৎ (মিশ্র বর্তনী ও তড়িৎ ক্ষমতা)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের বর্তনী চিত্রটি লক্ষ্য কর:\n##PRESET:circuit-parallel##\nউদ্দীপক: একটি তড়িৎ বর্তনীতে $12\\text{ V}$ তড়িৎচালক শক্তির ব্যাটারির সাথে $R_1 = 6\\,\\Omega$ ও $R_2 = 12\\,\\Omega$ রোধদ্বয় সমান্তরালে যুক্ত আছে এবং তাদের সাথে $R_3 = 4\\,\\Omega$ রোধটি শ্রেণী সমবায়ে সংযুক্ত আছে। ব্যাটারির অভ্যন্তরীণ রোধ উপেক্ষণীয়।",
            "Teacher Note / Explanation": "১১শ অধ্যায় (চল বিদ্যুৎ) থেকে মিশ্র সমবায়ের তুল্যরোধ, ওহমের সূত্র ও প্রতিটি রোধে ব্যয়িত ক্ষমতা বিশ্লেষণ।",
            # ক
            "Sub 1 Text": "তড়িৎচালক শক্তি ও বিভব পার্থক্যের মধ্যে মূল পার্থক্য কী?",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "একক ধনাত্মক আধানকে সম্পূর্ণ বর্তনী ঘুরিয়ে পুনরায় প্রারম্ভিক বিন্দুতে আনতে উৎস কর্তৃক সম্পন্ন মোট কাজকে তড়িৎচালক শক্তি ($E$) বলে।\nআর বর্তনীর যেকোনো দুটি বিন্দুর মধ্যে একক ধনাত্মক আধান স্থানান্তরে সম্পন্ন কাজকে ওই দুই বিন্দুর বিভব পার্থক্য ($V$) বলে।",
            "Sub 1 Explanation": "তড়িৎচালক শক্তি ও বিভব পার্থক্যের সুস্পষ্ট সংজ্ঞা ও পার্থক্য।",
            # খ
            "Sub 2 Text": "বর্তনীটির মোট তুল্যরোধ এবং মূল তড়িৎপ্রবাহ ($I$) নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "$R_1 = 6\\,\\Omega$ ও $R_2 = 12\\,\\Omega$ সমান্তরালে থাকায় তাদের তুল্যরোধ:\n$R_p = \\frac{R_1 \\times R_2}{R_1 + R_2} = \\frac{6 \\times 12}{6 + 12} = \\frac{72}{18} = 4\\,\\Omega$।\n$R_p$ এর সাথে $R_3 = 4\\,\\Omega$ শ্রেণীতে যুক্ত থাকায় বর্তনীর মোট তুল্যরোধ:\n$R_{\\text{total}} = R_p + R_3 = 4 + 4 = 8\\,\\Omega$।\nওহমের সূত্রানুযায়ী মূল তড়িৎপ্রবাহ:\n$I = \\frac{V}{R_{\\text{total}}} = \\frac{12\\text{ V}}{8\\,\\Omega} = 1.5\\text{ A}$।",
            "Sub 2 Explanation": "সমান্তরাল ও শ্রেণী সমবায়ের ধারাবাহিক তুল্যরোধ এবং মূল প্রবাহ।",
            # গ
            "Sub 3 Text": "$R_1$ ও $R_2$ রোধের মধ্য দিয়ে প্রবাহিত পৃথক তড়িৎপ্রবাহ এবং প্রতিটি রোধে ব্যয়িত তড়িৎ ক্ষমতা নির্ণয় কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "সমান্তরাল অংশের দুই প্রান্তের বিভব পার্থক্য:\n$V_p = I \\times R_p = 1.5\\text{ A} \\times 4\\,\\Omega = 6\\text{ V}$।\n$R_1$ এর মধ্য দিয়ে তড়িৎপ্রবাহ $I_1 = \\frac{V_p}{R_1} = \\frac{6}{6} = 1.0\\text{ A}$।\n$R_2$ এর মধ্য দিয়ে তড়িৎপ্রবাহ $I_2 = \\frac{V_p}{R_2} = \\frac{6}{12} = 0.5\\text{ A}$।\n(যাচাই: $I_1 + I_2 = 1.0 + 0.5 = 1.5\\text{ A} = I$)\nপ্রতিটি রোধে ব্যয়িত ক্ষমতা:\n$P_1 = I_1^2 R_1 = (1.0)^2 \\times 6 = 6\\text{ W}$।\n$P_2 = I_2^2 R_2 = (0.5)^2 \\times 12 = 0.25 \\times 12 = 3\\text{ W}$।\n$R_3$ রোধে ক্ষমতা $P_3 = I^2 R_3 = (1.5)^2 \\times 4 = 2.25 \\times 4 = 9\\text{ W}$।\nমোট ক্ষমতা $P_{\\text{total}} = 6 + 3 + 9 = 18\\text{ W} = V \\times I = 12 \\times 1.5 = 18\\text{ W}$।",
            "Sub 3 Explanation": "কারেন্ট ডিভাইডার রুল ও প্রতিটি রোধের বৈদ্যুতিক ক্ষমতার গাণিতিক সমাহার।"
        },

        # --- গ-বিভাগ: তড়িৎ, চুম্বক ও আধুনিক পদার্থবিজ্ঞান (প্রশ্ন ৭: ট্রান্সফরমার ও তেজস্ক্রিয়তা) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "বিদ্যুতের চৌম্বক ক্রিয়া ও আধুনিক পদার্থবিজ্ঞান",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "উদ্দীপক: একটি স্টেপ-ডাউন ট্রান্সফরমারের মুখ্য কুণ্ডলীর ভোল্টেজ $220\\text{ V}$ এবং পাকসংখ্যা ১০০০। গৌণ কুণ্ডলীর পাকসংখ্যা ৫০। মুখ্য কুণ্ডলীর তড়িৎপ্রবাহ $0.5\\text{ A}$। অপর একটি তেজস্ক্রিয় মৌলের অর্ধায়ু ৮ দিন এবং এর প্রাথমিক ভর $16\\text{ g}$।",
            "Teacher Note / Explanation": "১২শ ও ১৩শ অধ্যায় (ট্রান্সফরমার এবং তেজস্ক্রিয় মৌলের অর্ধায়ু) এর সমন্বিত সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "তড়িৎচৌম্বক আবেশ (Electromagnetic Induction) কাকে বলে?",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "একটি গতিশীল চুম্বক বা তড়িৎবাহী কুণ্ডলীর প্রভাবে একটি বদ্ধ কুণ্ডলীতে ক্ষণস্থায়ী তড়িৎপ্রবাহ বা তড়িৎচালক শক্তি উৎপন্ন হওয়ার ঘটনাকে তড়িৎচৌম্বক আবেশ বলে।",
            "Sub 1 Explanation": "ফ্যারাডের তড়িৎচৌম্বক আবেশের সংজ্ঞা।",
            # খ
            "Sub 2 Text": "ট্রান্সফরমারটির গৌণ কুণ্ডলীর ভোল্টেজ এবং গৌণ কুণ্ডলীর তড়িৎপ্রবাহ নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "দেওয়া আছে, $V_p = 220\\text{ V}, N_p = 1000, N_s = 50, I_p = 0.5\\text{ A}$।\nট্রান্সফরমারের অনুপাত সূত্র হতে:\n$\\frac{V_s}{V_p} = \\frac{N_s}{N_p} \\implies V_s = 220 \\times \\frac{50}{1000} = 220 \\times \\frac{1}{20} = 11\\text{ V}$।\nক্ষমতা অপরিবর্তিত থাকলে ($V_p I_p = V_s I_s$):\n$\\frac{I_s}{I_p} = \\frac{N_p}{N_s} \\implies I_s = I_p \\times \\frac{N_p}{N_s} = 0.5 \\times \\frac{1000}{50} = 0.5 \\times 20 = 10\\text{ A}$।\nঅতএব গৌণ কুণ্ডলীর ভোল্টেজ $11\\text{ ভোল্ট}$ এবং তড়িৎপ্রবাহ $10\\text{ অ্যাম্পিয়ার}$।",
            "Sub 2 Explanation": "ট্রান্সফরমারের ভোল্টেজ ও প্রবাহের সূত্র প্রয়োগ।",
            # গ
            "Sub 3 Text": "৩২ দিন পর তেজস্ক্রিয় মৌলটির কতটুকু অংশ অবিভক্ত থাকবে এবং মোট কতটুকু ক্ষয়প্রাপ্ত হবে? গাণিতিকভাবে বিশ্লেষণ কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "অর্ধায়ু $T_{1/2} = 8\\text{ দিন}$। অতিবাহিত মোট সময় $t = 32\\text{ দিন}$।\nঅর্ধায়ুর সংখ্যা $n = \\frac{t}{T_{1/2}} = \\frac{32}{8} = 4$টি।\nপ্রাথমিক ভর $N_0 = 16\\text{ g}$।\n$n$ অর্ধায়ু পর অবিভক্ত অংশের ভর:\n$N = N_0 \\times \\left(\\frac{1}{2}\\right)^n = 16 \\times \\left(\\frac{1}{2}\\right)^4 = 16 \\times \\frac{1}{16} = 1\\text{ g}$।\nঅতএব ৩২ দিন পর মাত্র $1\\text{ গ্রাম}$ অবিভক্ত বা অবশিষ্ট থাকবে।\nক্ষয়প্রাপ্ত অংশের ভর $= N_0 - N = 16 - 1 = 15\\text{ g}$।\nশতকরা ক্ষয়িত অংশ $= \\frac{15}{16} \\times 100\\% = 93.75\\%$।",
            "Sub 3 Explanation": "অর্ধায়ুর সমীকরণ প্রয়োগ করে অবশিষ্ট ও ক্ষয়প্রাপ্ত অংশের সঠিক হিসাব।"
        }
    ]

    all_questions = mcqs + smcqs + sqs + cqs

    for q_idx, q in enumerate(all_questions, start=2):
        for field, val in q.items():
            if field in col_map:
                ws.cell(row=q_idx, column=col_map[field], value=val)

    wb.save(output_path)
    print(f"✅ Generated SSC Physics Question Paper workbook with:")
    print(f"   - {len(mcqs)} standard MCQs")
    print(f"   - {len(smcqs)} SMCQs ({len(smcqs) * 3} sub-questions)")
    print(f"   - Total MCQ Marks: {len(mcqs) + len(smcqs) * 3} Marks")
    print(f"   - {len(sqs)} SQs (Total {len(sqs) * 2} Marks, answer 5 for 10 Marks)")
    print(f"   - {len(cqs)} CQs ({len(cqs)} * 10 Marks = {len(cqs) * 10} Marks, answer 5 for 40 Marks)")
    print(f"   Total rows in Template sheet: {ws.max_row - 1}")
    print(f"Saved at: {output_path}")

if __name__ == "__main__":
    generate_physics_paper()
