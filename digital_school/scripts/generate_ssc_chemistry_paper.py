#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate complete, authentic SSC Chemistry Question Paper (Marks Distribution 2027-2028)
Total Marks: 75
- Written / Creative (CQ): 40 Marks (7 CQs: 3 Structure/Periodicity/Bonds, 2 Mole/Reactions/Energy, 2 Acid-Base/Metals/Organic)
- Short Questions (SQ): 10 Marks (7 SQs given, answer 5, each 2 marks)
- Multiple Choice (MCQ): 25 Marks (19 regular MCQs including 6 multiple-completion + 2 SMCQs with 3 sub-questions each = 25 marks)
Strictly adheres to NCTB SSC Chemistry syllabus, proper Bengali chemistry terms, chemfig/chemical formulas, and question_template_objective.xlsx format.
"""

import os
import openpyxl

def generate_chemistry_paper():
    template_path = "/Users/md.rofazhasanrafiu/coding/question_template_objective.xlsx"
    output_path = "/Users/md.rofazhasanrafiu/coding/SSC_Chemistry_Full_Question_Paper_2027_2028.xlsx"

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
    subject = "Chemistry"

    headers = [ws.cell(1, c).value for c in range(1, ws.max_column + 1)]
    col_map = {name: idx + 1 for idx, name in enumerate(headers) if name}

    # =========================================================================
    # 1. 19 MCQs (INCLUDING 6 MULTIPLE-COMPLETION / বহুপদী সমাপ্তিসূচক)
    # =========================================================================
    mcqs = [
        # --- ১ম অধ্যায়: রসায়নের ধারণা ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "রসায়নের ধারণা (ঝুঁকির মাত্রা ও প্রতীক)",
            "Difficulty": "EASY", "Marks": 1,
            "Question Text": "তেজস্ক্রিয় পদার্থের আন্তর্জাতিক সাংকেতিক চিহ্নটিকে কী বলা হয়?",
            "Option A": "ট্রেফয়েল (Trefoil)", "Option B": "অগ্নিশিখা (Flame)", "Option C": "করোসিভ (Corrosive)", "Option D": "বিস্ফোরক (Explosive)",
            "Correct Option": "A", "Correct Answer": "ট্রেফয়েল (Trefoil)",
            "Model Answer": "তেজস্ক্রিয় রশ্মির ক্ষতিকর প্রভাব বোঝাতে আন্তর্জাতিকভাবে 'ট্রেফয়েল' (তিন পাখাবিশিষ্ট চক্র) চিহ্ন ব্যবহৃত হয়।",
            "Teacher Note / Explanation": "গবেষণাগারের নিরাপত্তা ও আন্তর্জাতিক সাংকেতিক চিহ্ন।"
        },

        # --- ২য় অধ্যায়: পদার্থের অবস্থা ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের অবস্থা (ব্যাপনের হার)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একই তাপমাত্রা ও চাপে নিচের কোন গ্যাসটির ব্যাপনের হার সবচেয়ে বেশি?",
            "Option A": "$\\text{CO}_2$", "Option B": "$\\text{NH}_3$", "Option C": "$\\text{SO}_2$", "Option D": "$\\text{HCl}$",
            "Correct Option": "B", "Correct Answer": "$\\text{NH}_3$",
            "Model Answer": "গ্রাহামের ব্যাপন সূত্রানুযায়ী ব্যাপনের হার আণবিক ভরের বর্গমূলের ব্যস্তানুপাতিক ($r \\propto \\frac{1}{\\sqrt{M}}$)। আণবিক ভর: $\\text{NH}_3 = 17, \\text{CO}_2 = 44, \\text{HCl} = 36.5, \\text{SO}_2 = 64$। যেহেতু $\\text{NH}_3$ এর আণবিক ভর সর্বনিম্ন, তাই এর ব্যাপনের হার সর্বাধিক।",
            "Teacher Note / Explanation": "আণবিক ভর কম হলে গ্যাসের ব্যাপন বেগ বেশি হয়।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের অবস্থা (গলনাঙ্ক ও স্ফুটনাঙ্ক)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "পদার্থের অবস্থার পরিবর্তনের ক্ষেত্রে—\ni. উদ্বায়ী পদার্থের ক্ষেত্রে গলনাঙ্ক ও স্ফুটনাঙ্কের পার্থক্য খুব কম হয়\nii. কর্পূর, ন্যাপথালিন ও নিশাদল হলো ঊর্ধ্বপাতিত পদার্থ\niii. চাপ বৃদ্ধি পেলে পানির স্ফুটনাঙ্ক $100^\\circ\\text{C}$ এর চেয়ে বেশি হয়\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Model Answer": "ঊর্ধ্বপাতিত কঠিন পদার্থ সরাসরি বাষ্পে পরিণত হয় এবং চাপ বৃদ্ধিতে স্ফুটনাঙ্ক বাড়ে। তিনটি বিবৃতিই সঠিক।",
            "Teacher Note / Explanation": "অবস্থার পরিবর্তন, ঊর্ধ্বপাতন ও স্ফুটনাঙ্কের ওপর চাপের প্রভাব।"
        },

        # --- ৩য় অধ্যায়: পদার্থের গঠন ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের গঠন (ইলেকট্রন বিন্যাসের ব্যতিক্রম)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "কপার ($\\text{Cu}_{29}$) এর সর্ববহিঃস্থ স্তরের সঠিক ইলেকট্রন বিন্যাস কোনটি?",
            "Option A": "$3d^9 4s^2$", "Option B": "$3d^{10} 4s^1$", "Option C": "$3d^8 4s^2 4p^1$", "Option D": "$3d^{10} 4s^2$",
            "Correct Option": "B", "Correct Answer": "$3d^{10} 4s^1$",
            "Model Answer": "অর্ধপূর্ণ বা পূর্ণ $d$-অরবিটালের অধিক স্থিতিশীলতার জন্য কপারের বিন্যাস $3d^9 4s^2$ না হয়ে $3d^{10} 4s^1$ হয়।",
            "Teacher Note / Explanation": "অরবিটালের পূর্ণ ও অর্ধপূর্ণ অবস্থার সুস্থিতি।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের গঠন (পরমাণুর মডেল)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "বোর পরমাণু মডেলের ক্ষেত্রে—\ni. ইলেকট্রন নির্দিষ্ট বৃত্তাকার স্থায়ী কক্ষপথে আবর্তন করে\nii. ঘূর্ণনরত ইলেকট্রনের কৌণিক ভরবেগ $mvr = \\frac{nh}{2\\pi}$\niii. এটি একাধিক ইলেকট্রনবিশিষ্ট পরমাণুর বর্ণালি নিখুঁতভাবে ব্যাখ্যা করতে পারে\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "A", "Correct Answer": "i ও ii",
            "Model Answer": "বোর মডেল শুধুমাত্র এক ইলেকট্রনবিশিষ্ট আয়ন বা পরমাণুর বর্ণালি ব্যাখ্যা করতে পারে, বহু ইলেকট্রনের নয়। তাই iii ভুল।",
            "Teacher Note / Explanation": "বোর মডেলের প্রস্তাবনা ও সীমাবদ্ধতা।"
        },

        # --- ৪র্থ অধ্যায়: পর্যায় সারণি ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পর্যায় সারণি (আয়নীকরণ শক্তি)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "নিচের কোন মৌলটির প্রথম আয়নীকরণ শক্তির মান সবচেয়ে বেশি?",
            "Option A": "$\\text{Na}$", "Option B": "$\\text{Mg}$", "Option C": "$\\text{P}$", "Option D": "$\\text{Cl}$",
            "Correct Option": "D", "Correct Answer": "$\\text{Cl}$",
            "Model Answer": "একই পর্যায়ে বাম থেকে ডানে পারমাণবিক ব্যাসার্ধ হ্রাস পায় এবং নিউক্লিয়াসের আকর্ষণ বৃদ্ধির কারণে আয়নীকরণ শক্তি বৃদ্ধি পায়। ক্লোরিন ($\text{Cl}$) ডানে অবস্থিত হওয়ায় এর আয়নীকরণ শক্তি সর্বাধিক।",
            "Teacher Note / Explanation": "পর্যায়বৃত্ত ধর্মের ধারাবাহিকতা।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পর্যায় সারণি (মৌলের পর্যায়বৃত্ত ধর্ম)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "পর্যায় সারণির একই গ্রুপে উপর থেকে নিচে নামলে—\ni. পারমাণবিক ব্যাসার্ধ বৃদ্ধি পায়\nii. তড়িৎ ঋণাত্মকতা হ্রাস পায়\niii. ধাতব ধর্ম বৃদ্ধি পায়\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Model Answer": "নতুন শক্তিস্তর যুক্ত হওয়ায় পারমাণবিক ব্যাসার্ধ বাড়ে, ফলে ইলেকট্রন ত্যাগের প্রবণতা (ধাতব ধর্ম) বাড়ে এবং তড়িৎ ঋণাত্মকতা কমে। তিনটিই সঠিক।",
            "Teacher Note / Explanation": "গ্রুপভিত্তিক পর্যায়বৃত্ত পরিবর্তন।"
        },

        # --- ৫ম অধ্যায়: রাসায়নিক বন্ধন ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "রাসায়নিক বন্ধন (মুক্তজোড় ইলেকট্রন)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "পানি ($\\text{H}_2\\text{O}$) অণুতে কয়টি মুক্তজোড় (Lone pair) ইলেকট্রন রয়েছে?",
            "Option A": "১ জোড়া", "Option B": "২ জোড়া", "Option C": "৩ জোড়া", "Option D": "৪ জোড়া",
            "Correct Option": "B", "Correct Answer": "২ জোড়া",
            "Model Answer": "অক্সিজেনের সর্ববহিঃস্থ স্তরে ৬টি ইলেকট্রন থাকে। ২টি ইলেকট্রন হাইড্রোজেনের সাথে বন্ধন গঠন করে এবং বাকি ৪টি ইলেকট্রন (২ জোড়া) মুক্তজোড় হিসেবে থাকে।",
            "Teacher Note / Explanation": "সমযোজী অণুর বন্ধনজোড় ও মুক্তজোড় ইলেকট্রন।"
        },

        # --- ৬ষ্ঠ অধ্যায়: মোলের ধারণা ও রাসায়নিক গণনা ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "মোলের ধারণা (এসটিপিতে মোলার আয়তন)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "প্রমাণ তাপমাত্রা ও চাপে (STP) $8.8\\text{ g } \\text{CO}_2$ গ্যাসের আয়তন কত লিটার?",
            "Option A": "$2.24\\text{ L}$", "Option B": "$4.48\\text{ L}$", "Option C": "$22.4\\text{ L}$", "Option D": "$1.12\\text{ L}$",
            "Correct Option": "B", "Correct Answer": "$4.48\\text{ L}$",
            "Model Answer": "$\\text{CO}_2$ এর মোল সংখ্যা $n = \\frac{8.8}{44} = 0.2\\text{ mol}$। আয়তন $V = n \\times 22.4 = 0.2 \\times 22.4 = 4.48\\text{ L}$।",
            "Teacher Note / Explanation": "মোলার আয়তন $22.4\\text{ L/mol}$ এর ভিত্তিতে হিসাব।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "মোলের ধারণা (দ্রবণের মোলারিটি)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$250\\text{ mL}$ দ্রবণে $5.3\\text{ g } \\text{Na}_2\\text{CO}_3$ দ্রবীভূত থাকলে দ্রবণের মোলারিটি কত? ($\\text{Na}_2\\text{CO}_3 = 106$)",
            "Option A": "$0.1\\text{ M}$", "Option B": "$0.2\\text{ M}$", "Option C": "$0.5\\text{ M}$", "Option D": "$1.0\\text{ M}$",
            "Correct Option": "B", "Correct Answer": "$0.2\\text{ M}$",
            "Model Answer": "$S = \\frac{1000 W}{M V} = \\frac{1000 \\times 5.3}{106 \\times 250} = \\frac{5300}{26500} = 0.2\\text{ M}$।",
            "Teacher Note / Explanation": "মোলারিটি নির্ণয়ের আদর্শ সমীকরণ।"
        },

        # --- ৭ম অধ্যায়: রাসায়নিক বিক্রিয়া ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "রাসায়নিক বিক্রিয়া (জারণ সংখ্যা)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$\\text{K}_2\\text{Cr}_2\\text{O}_7$ যৌগে ক্রোমিয়াম ($\\text{Cr}$) এর জারণ সংখ্যা কত?",
            "Option A": "$+3$", "Option B": "$+6$", "Option C": "$+7$", "Option D": "$+4$",
            "Correct Option": "B", "Correct Answer": "$+6$",
            "Model Answer": "$2(+1) + 2x + 7(-2) = 0 \\implies 2 + 2x - 14 = 0 \\implies 2x = 12 \\implies x = +6$।",
            "Teacher Note / Explanation": "নিরপেক্ষ যৌগে জারণ সংখ্যার বীজগাণিতিক সমষ্টি শূন্য ধরে হিসাব।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "রাসায়নিক বিক্রিয়া (লা-শাতেলিয়ারের নীতি)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "$\\text{N}_2(\\text{g}) + 3\\text{H}_2(\\text{g}) \\rightleftharpoons 2\\text{NH}_3(\\text{g}) + 92\\text{ kJ}$ বিক্রিয়াটিতে অ্যামোনিয়ার উৎপাদন বৃদ্ধির শর্ত—\ni. তাপমাত্রা হ্রাস করা\nii. চাপ বৃদ্ধি করা\niii. বিক্রিয়াস্থল থেকে অ্যামোনিয়া গ্যাস অপসারণ করা\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Model Answer": "তাপোৎপাদী বিক্রিয়ায় তাপমাত্রা কমালে বিক্রিয়া সম্মুখমুখী হয়। বিক্রিয়কের মোল সংখ্যা ($4$) উৎপাদনের ($2$) চেয়ে বেশি হওয়ায় চাপ বাড়ালে সম্মুখমুখী হয়। অ্যামোনিয়া সরালে সাম্যাবস্থা ডানে সরে। তিনটিই সঠিক।",
            "Teacher Note / Explanation": "লা-শাতেলিয়ারের নীতির তিন প্রভাবকের সমন্বয়।"
        },

        # --- ৮ম অধ্যায়: রসায়ন ও শক্তি ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "রসায়ন ও শক্তি (ড্রাইসেলের তড়িৎদ্বার)",
            "Difficulty": "EASY", "Marks": 1,
            "Question Text": "শুষ্ক কোষে (Dry Cell) অ্যানোড হিসেবে নিচের কোনটি ব্যবহৃত হয়?",
            "Option A": "কার্বন দণ্ড", "Option B": "দস্তার ($\\text{Zn}$) চোঙ", "Option C": "কপার পাত", "Option D": "সিসার পাত",
            "Correct Option": "B", "Correct Answer": "দস্তার ($\\text{Zn}$) চোঙ",
            "Model Answer": "ড্রাইসেলে দস্তার তৈরি পাত্রটি জারিত হয়ে ইলেকট্রন ত্যাগ করে, যা অ্যানোড হিসেবে কাজ করে।",
            "Teacher Note / Explanation": "ড্রাইসেলের গঠন ও অ্যানোড।"
        },

        # --- ৯ম অধ্যায়: এসিড-ক্ষারক সমতা ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "এসিড-ক্ষারক সমতা (পিএইচ মান)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$0.001\\text{ M } \\text{HCl}$ দ্রবণের $\\text{pH}$ কত?",
            "Option A": "$1$", "Option B": "$2$", "Option C": "$3$", "Option D": "$4$",
            "Correct Option": "C", "Correct Answer": "$3$",
            "Model Answer": "$[\\text{H}^+] = 0.001 = 10^{-3}\\text{ M}$। $\\text{pH} = -\\log_{10}[\\text{H}^+] = -\\log(10^{-3}) = 3$।",
            "Teacher Note / Explanation": "তীব্র এসিডের মোলার ঘনমাত্রা হতে সরাসরি পিএইচ গণনা।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "এসিড-ক্ষারক সমতা (এসিড বৃষ্টি)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "এসিড বৃষ্টির জন্য মূলত দায়ী কোন গ্যাসদ্বয়?",
            "Option A": "$\\text{CO}$ ও $\\text{CH}_4$", "Option B": "$\\text{SO}_2$ ও $\\text{NO}_2$", "Option C": "$\\text{O}_3$ ও $\\text{CFC}$", "Option D": "$\\text{NH}_3$ ও $\\text{CO}_2$",
            "Correct Option": "B", "Correct Answer": "$\\text{SO}_2$ ও $\\text{NO}_2$",
            "Model Answer": "সালফার ডাইঅক্সাইড ও নাইট্রোজেন ডাইঅক্সাইড বৃষ্টির পানির সাথে বিক্রিয়া করে যথাক্রমে সালফিউরিক ও নাইট্রিক এসিড তৈরি করে।",
            "Teacher Note / Explanation": "পরিবেশ রসায়ন ও এসিড বৃষ্টির কারণ।"
        },

        # --- ১০ম অধ্যায়: খনিজ সম্পদ: ধাতু-অধাতু ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "খনিজ সম্পদ: ধাতু-অধাতু (মরিচার সংকেত)",
            "Difficulty": "EASY", "Marks": 1,
            "Question Text": "লোহায় মরিচা পড়ার সঠিক রাসায়নিক সংকেত কোনটি?",
            "Option A": "$\\text{Fe}_3\\text{O}_4$", "Option B": "$\\text{Fe}_2\\text{O}_3 \\cdot n\\text{H}_2\\text{O}$", "Option C": "$\\text{Fe(OH)}_2$", "Option D": "$\\text{FeSO}_4 \\cdot 7\\text{H}_2\\text{O}$",
            "Correct Option": "B", "Correct Answer": "$\\text{Fe}_2\\text{O}_3 \\cdot n\\text{H}_2\\text{O}$",
            "Model Answer": "মরিচা হলো আর্দ্র ফেরিক অক্সাইড, যার সংকেত $\\text{Fe}_2\\text{O}_3 \\cdot n\\text{H}_2\\text{O}$।",
            "Teacher Note / Explanation": "ধাতু ক্ষয় ও মরিচার রাসায়নিক প্রকৃতি।"
        },

        # --- ১১শ অধ্যায়: খনিজ সম্পদ: জীবাশ্ম ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "খনিজ সম্পদ: জীবাশ্ম (অসম্পৃক্ততার পরীক্ষা)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "ইথিন ($\\text{CH}_2=\\text{CH}_2$) গ্যাসের মধ্যে লাল বর্ণের ব্রোমিন পানি দ্রবণ যোগ করলে—\ni. ব্রোমিনের লাল বর্ণ অপসারিত হয়\nii. ১,২-ডাইব্রোমোইথেন উৎপন্ন হয়\niii. এটি একটি প্রতিস্থাপন বিক্রিয়া\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "A", "Correct Answer": "i ও ii",
            "Model Answer": "অ্যালকিনের দ্বিবন্ধন ভেঙে সংযোজন বিক্রিয়া ঘটে এবং ব্রোমিনের লাল বর্ণ বর্ণহীন হয়। এটি প্রতিস্থাপন নয়, সংযোজন বিক্রিয়া। তাই iii ভুল।",
            "Teacher Note / Explanation": "অসম্পৃক্ততার ব্রোমিন সংযোজন পরীক্ষা।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "খনিজ সম্পদ: জীবাশ্ম (পলিমার)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "টেফলন (Teflon) পলিমারটির মনোমার কোনটি?",
            "Option A": "ভিনাইল ক্লোরাইড", "Option B": "টেট্রাফ্লুরোইথিন", "Option C": "ইথিন", "Option D": "প্রোপিন",
            "Correct Option": "B", "Correct Answer": "টেট্রাফ্লুরোইথিন",
            "Model Answer": "টেট্রাফ্লুরোইথিন ($\text{CF}_2=\text{CF}_2$) এর পলিমারকরণে টেফলন তৈরি হয় যা নন-স্টিক রান্নার পাত্রে ব্যবহৃত হয়।",
            "Teacher Note / Explanation": "গুরুত্বপূর্ণ বাণিজ্যিক পলিমার ও তাদের মনোমার।"
        },

        # ---১২শ অধ্যায়: আমাদের জীবনে রসায়ন ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "আমাদের জীবনে রসায়ন (ভিনেগারের সংযুক্তি)",
            "Difficulty": "EASY", "Marks": 1,
            "Question Text": "ভিনেগার (Vinegar) হলো ইথানয়িক এসিডের কত শতাংশ জলীয় দ্রবণ?",
            "Option A": "$১\% - ২\%$", "Option B": "$৪\% - ১০\%$", "Option C": "$১৫\% - ২০\%$", "Option D": "$৪০\% - ৫০\%$",
            "Correct Option": "B", "Correct Answer": "$৪\% - ১০\%$",
            "Model Answer": "ইথানয়িক এসিডের ৪%–১০% জলীয় দ্রবণকে ভিনেগার বলে যা খাদ্য সংরক্ষক হিসেবে ব্যবহৃত হয়।",
            "Teacher Note / Explanation": "প্রাত্যহিক জীবনের প্রয়োজনীয় রাসায়নিক উপাদান।"
        }
    ]

    # =========================================================================
    # 2. 2 SMCQs (অভিন্ন তথ্যভিত্তিক বহুনির্বাচনী প্রশ্ন) - 3 MCQs each = 6 MCQs
    # =========================================================================
    smcqs = [
        # --- SMCQ 1: মোলের ধারণা ও দ্রবণ (অধ্যায় ০৬) ---
        {
            "Type": "SMCQ", "Class Name": class_name, "Subject": subject, "Topic": "মোলের ধারণা ও দ্রবণ (অভিন্ন তথ্যভিত্তিক)",
            "Difficulty": "HARD", "Marks": 3,
            "Question Text": "উদ্দীপকটি পড় এবং পরবর্তী ৩টি প্রশ্নের উত্তর দাও:\nএকটি পাত্রে $250\\text{ mL}$ পানিতে $10.6\\text{ g } \\text{Na}_2\\text{CO}_3$ দ্রবীভূত করে একটি প্রমাণ দ্রবণ তৈরি করা হলো। $(\\text{Na}=23, \\text{C}=12, \\text{O}=16)$",
            "Teacher Note / Explanation": "আণবিক ভর, মোলারিটি ও অণুর সংখ্যা সংক্রান্ত অভিন্ন তথ্যভিত্তিক প্রশ্নাবলী।",
            # Sub 1
            "Sub 1 Text": "$\\text{Na}_2\\text{CO}_3$ এর আণবিক ভর কত?",
            "Sub 1 Marks": 1,
            "Sub 1 Option A": "106", "Sub 1 Option B": "84", "Sub 1 Option C": "53", "Sub 1 Option D": "142",
            "Sub 1 Correct Option": "A",
            "Sub 1 Model Answer": "আণবিক ভর $= 23 \\times 2 + 12 + 16 \\times 3 = 46 + 12 + 48 = 106$।",
            "Sub 1 Explanation": "সোডিয়াম কার্বনেটের আণবিক ভর গণনা।",
            # Sub 2
            "Sub 2 Text": "প্রস্তুতকৃত দ্রবণটির মোলারিটি কত?",
            "Sub 2 Marks": 1,
            "Sub 2 Option A": "$0.1\\text{ M}$", "Sub 2 Option B": "$0.2\\text{ M}$", "Sub 2 Option C": "$0.4\\text{ M}$", "Sub 2 Option D": "$0.5\\text{ M}$",
            "Sub 2 Correct Option": "C",
            "Sub 2 Model Answer": "$S = \\frac{1000 W}{M V} = \\frac{1000 \\times 10.6}{106 \\times 250} = \\frac{10600}{26500} = 0.4\\text{ M}$।",
            "Sub 2 Explanation": "মোলারিটির সূত্র প্রয়োগ।",
            # Sub 3
            "Sub 3 Text": "উক্ত দ্রবণে মোট কতটি $\\text{Na}_2\\text{CO}_3$ অণু বিদ্যমান?",
            "Sub 3 Marks": 1,
            "Sub 3 Option A": "$6.023 \\times 10^{23}$", "Sub 3 Option B": "$6.023 \\times 10^{22}$", "Sub 3 Option C": "$3.011 \\times 10^{22}$", "Sub 3 Option D": "$1.204 \\times 10^{23}$",
            "Sub 3 Correct Option": "B",
            "Sub 3 Model Answer": "মোল সংখ্যা $n = \\frac{10.6}{106} = 0.1\\text{ mol}$। অণুর সংখ্যা $= 0.1 \\times 6.023 \\times 10^{23} = 6.023 \\times 10^{22}$টি।",
            "Sub 3 Explanation": "অ্যাভোগাড্রো সংখ্যার সাথে মোলের গুণফল।"
        },

        # --- SMCQ 2: হাইড্রোকার্বন ও জৈব রসায়ন (অধ্যায় ১১) ---
        {
            "Type": "SMCQ", "Class Name": class_name, "Subject": subject, "Topic": "হাইড্রোকার্বন ও জৈব যৌগ (অভিন্ন তথ্যভিত্তিক)",
            "Difficulty": "HARD", "Marks": 3,
            "Question Text": "উদ্দীপকটি পড় এবং পরবর্তী ৩টি প্রশ্নের উত্তর দাও:\nএকটি হাইড্রোকার্বন $X$ এর সংকেত $\\text{C}_2\\text{H}_4$। $X$ গ্যাসকে নিকেল চূর্ণের উপস্থিতিতে $180^\\circ\\text{C}-200^\\circ\\text{C}$ তাপমাত্রায় হাইড্রোজেনের সাথে বিক্রিয়া করালে $Y$ উৎপন্ন হয়। আবার $X$ গ্যাসকে উচ্চ চাপে পলিমারকরণ করলে $Z$ উৎপন্ন হয়।",
            "Teacher Note / Explanation": "অ্যালকিন, অ্যালকেন ও পলিমারাইজেশন সম্পর্কিত ধারাবাহিক প্রশ্ন।",
            # Sub 1
            "Sub 1 Text": "$X$ যৌগটির নাম কী?",
            "Sub 1 Marks": 1,
            "Sub 1 Option A": "ইথেন", "Sub 1 Option B": "ইথিন", "Sub 1 Option C": "ইথাইন", "Sub 1 Option D": "মিথেন",
            "Sub 1 Correct Option": "B",
            "Sub 1 Model Answer": "$\\text{C}_n\\text{H}_{2n}$ সাধারণ সংকেত অনুযায়ী $\\text{C}_2\\text{H}_4$ হলো ইথিন (Ethene)।",
            "Sub 1 Explanation": "অ্যালকিনের আণবিক সংকেত।",
            # Sub 2
            "Sub 2 Text": "$Y$ যৌগটির ক্ষেত্রে কোনটি সঠিক?",
            "Sub 2 Marks": 1,
            "Sub 2 Option A": "এটি ব্রোমিন পানির সাথে যুক্ত হয়ে বর্ণহীন করে", "Sub 2 Option B": "এটি একটি সম্পৃক্ত হাইড্রোকার্বন (ইথেন)", "Sub 2 Option C": "এর কার্বন-কার্বন বন্ধন দূরত্ব $0.134\\text{ nm}$", "Sub 2 Option D": "এটি অম্লীয় প্রকৃতির",
            "Sub 2 Correct Option": "B",
            "Sub 2 Model Answer": "$\\text{CH}_2=\\text{CH}_2 + \\text{H}_2 \\xrightarrow{\\text{Ni}, 200^\\circ\\text{C}} \\text{CH}_3-\\text{CH}_3$ (ইথেন, যা সম্পৃক্ত অ্যালকেন)।",
            "Sub 2 Explanation": "অ্যালকিনের হাইড্রোজেনেশন বিক্রিয়া।",
            # Sub 3
            "Sub 3 Text": "পলিমার $Z$ এর নাম কোনটি?",
            "Sub 3 Marks": 1,
            "Sub 3 Option A": "পলিপ্রোপিন", "Sub 3 Option B": "পলিথিন", "Sub 3 Option C": "পিভিসি (PVC)", "Option D": "টেফলন",
            "Sub 3 Correct Option": "B",
            "Sub 3 Model Answer": "ইথিনের পলিমারকরণের ফলে পলিথিন উৎপন্ন হয়।",
            "Sub 3 Explanation": "ইথিনের পলিমারাইজেশন।"
        }
    ]

    # =========================================================================
    # 3. 7 SHORT QUESTIONS (SQ) - Answer 5, each 2 marks = 10 Marks
    # =========================================================================
    sqs = [
        # SQ 1 (অধ্যায় ০২: পদার্থের অবস্থা)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের অবস্থা (ব্যাপনের তুলনা)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$\\text{HCl}$ ও $\\text{NH}_3$ গ্যাসের মধ্যে কোনটির ব্যাপন হার বেশি এবং কেন? সমীকরণসহ ব্যাখ্যা কর।",
            "Model Answer": "গ্রাহামের ব্যাপন সূত্রানুযায়ী ব্যাপনের হার আণবিক ভরের বর্গমূলের ব্যস্তানুপাতিক ($r \\propto \\frac{1}{\\sqrt{M}}$)।\n$\\text{HCl}$ এর আণবিক ভর $= 1 + 35.5 = 36.5$\n$\\text{NH}_3$ এর আণবিক ভর $= 14 + 3(1) = 17$\nযেহেতু অ্যামোনিয়ার আণবিক ভর হাইড্রোক্লোরিক এসিডের চেয়ে কম, তাই অ্যামোনিয়া ($\\text{NH}_3$) গ্যাসের ব্যাপনের হার বেশি।",
            "Teacher Note / Explanation": "আণবিক ভরের ভিত্তিতে ব্যাপনের বৈজ্ঞানিক ব্যাখ্যা।"
        },
        # SQ 2 (অধ্যায় ০৩: পদার্থের গঠন)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের গঠন (ইলেকট্রন বিন্যাসের ব্যতিক্রম)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "ক্রোমিয়াম ($\\text{Cr}_{24}$) এর ইলেকট্রন বিন্যাস সাধারণ নিয়মের ব্যতিক্রম কেন? ব্যাখ্যা কর।",
            "Model Answer": "সাধারণ আউফবাউ নিয়মানুযায়ী ক্রোমিয়ামের ইলেকট্রন বিন্যাস $3d^4 4s^2$ হওয়ার কথা ছিল। কিন্তু কোয়ান্টাম বলবিদ্যা অনুযায়ী সমশক্তিসম্পন্ন অরবিটালসমূহ অর্ধপূর্ণ ($d^5$) অথবা সম্পূর্ণরূপে পূর্ণ ($d^{10}$) থাকলে পরমাণু সবচেয়ে বেশি সুস্থিতি অর্জন করে। তাই $4s$ থেকে একটি ইলেকট্রন $3d$ এ গিয়ে অর্ধপূর্ণ হয়ে ক্রোমিয়ামের সঠিক বিন্যাস হয়: $1s^2 2s^2 2p^6 3s^2 3p^6 3d^5 4s^1$।",
            "Teacher Note / Explanation": "অরবিটালের অর্ধপূর্ণ সুস্থিতির ব্যাখ্যা।"
        },
        # SQ 3 (অধ্যায় ০৪: পর্যায় সারণি)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "পর্যায় সারণি (পারমাণবিক ব্যাসার্ধ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "পর্যায় সারণির একই গ্রুপে উপর থেকে নিচে নামলে পারমাণবিক ব্যাসার্ধ বৃদ্ধি পায় কেন?",
            "Model Answer": "একই গ্রুপে উপর থেকে নিচে নামলে পরমাণুতে একটি করে নতুন প্রধান শক্তিস্তর (কক্ষপথ) যুক্ত হয়। নতুন শক্তিস্তর যুক্ত হওয়ার কারণে নিউক্লিয়াস থেকে সর্ববহিঃস্থ স্তরের ইলেকট্রনের দূরত্ব বৃদ্ধি পায়। নিউক্লিয়াসের ধনাত্মক চার্জ বাড়লেও নতুন স্তরের দূরত্বের প্রভাব অনেক বেশি কার্যকর থাকে। ফলে বহিস্থ স্তরের প্রতি আকর্ষণ কমে যায় এবং পারমাণবিক ব্যাসার্ধ বৃদ্ধি পায়।",
            "Teacher Note / Explanation": "নতুন কক্ষপথ যুক্ত হওয়া ও স্ক্রিনিং প্রভাবের সঠিক ব্যাখ্যা।"
        },
        # SQ 4 (অধ্যায় ০৫: রাসায়নিক বন্ধন)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "রাসায়নিক বন্ধন (পোলারিটি)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "পানি ($\\text{H}_2\\text{O}$) একটি পোলার সমযোজী যৌগ কেন? ব্যাখ্যা কর।",
            "Model Answer": "সমযোজী যৌগে যুক্ত দুটি পরমাণুর তড়িৎ ঋণাত্মকতার পার্থক্য $0.5$ থেকে $1.9$ এর মধ্যে হলে অণুটি পোলার হয়। পানিতে অক্সিজেনের তড়িৎ ঋণাত্মকতা $3.5$ এবং হাইড্রোজেনের $2.1$, যাদের পার্থক্য $3.5 - 2.1 = 1.4$। এই পার্থক্যের কারণে বন্ধনজোড় ইলেকট্রন অক্সিজেনের দিকে অধিক আকৃষ্ট হয়ে অক্সিজেন আংশিক ঋণাত্মক ($\\delta^-$) এবং হাইড্রোজেন আংশিক ধনাত্মক ($\\delta^+$) প্রান্তে পরিণত হয়। ফলে পানি একটি পোলার সমযোজী যৌগ।",
            "Teacher Note / Explanation": "তড়িৎ ঋণাত্মকতার পার্থক্যের আলোকে পোলারিটি প্রতিপাদন।"
        },
        # SQ 5 (অধ্যায় ০৭: রাসায়নিক বিক্রিয়া)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "রাসায়নিক বিক্রিয়া (জারণ-বিজারণ যুগপৎ ঘটে)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$\\text{Na} + \\frac{1}{2}\\text{Cl}_2 \\rightarrow \\text{NaCl}$ বিক্রিয়াটিতে জারণ ও বিজারণ যুগপৎ ঘটেছে—ব্যাখ্যা কর।",
            "Model Answer": "এখানে সোডিয়াম পরমাণু একটি ইলেকট্রন ত্যাগ করে জারিত হয়: $\\text{Na} - e^- \\rightarrow \\text{Na}^+$ (জারণ অর্ধ-বিক্রিয়া)।\nঅপরদিকে ক্লোরিন পরমাণু সেই ইলেকট্রন গ্রহণ করে বিজারিত হয়: $\\frac{1}{2}\\text{Cl}_2 + e^- \\rightarrow \\text{Cl}^-$ (বিজারণ অর্ধ-বিক্রিয়া)।\nযেহেতু ইলেকট্রন ত্যাগ ছাড়া ইলেকট্রন গ্রহণ অসম্ভব, তাই বিক্রিয়াটিতে জারণ ও বিজারণ একই সাথে (যুগপৎ) ঘটেছে।",
            "Teacher Note / Explanation": "ইলেকট্রনীয় মতবাদের আলোকে জারণ-বিজারণের যুগপৎ প্রমাণ।"
        },
        # SQ 6 (অধ্যায় ০৯: এসিড-ক্ষারক সমতা)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "এসিড-ক্ষারক সমতা (নিরপেক্ষ পানির পিএইচ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$25^\\circ\\text{C}$ তাপমাত্রায় বিশুদ্ধ পানির $\\text{pH} = 7$ হয় কেন? গাণিতিকভাবে ব্যাখ্যা কর।",
            "Model Answer": "বিশুদ্ধ পানি অতি সামান্য মাত্রায় আয়নিত হয়: $\\text{H}_2\\text{O} \\rightleftharpoons \\text{H}^+ + \\text{OH}^-$।\n$25^\\circ\\text{C}$ তাপমাত্রায় পানির আয়নদ্বয়ের মোলার ঘনমাত্রা সমান থাকে: $[\\text{H}^+] = [\\text{OH}^-] = 10^{-7}\\text{ mol/L}$।\n$\\text{pH}$ এর সংজ্ঞানুসারে:\n$\\text{pH} = -\\log_{10}[\\text{H}^+] = -\\log_{10}(10^{-7}) = -(-7) = 7$।\nহাইড্রোজেন আয়ন ও হাইড্রোক্সাইড আয়নের ঘনমাত্রা সমান হওয়ায় পানি নিরপেক্ষ এবং এর $\\text{pH} = 7$ হয়।",
            "Teacher Note / Explanation": "পানির আয়নীয় গুণফল ও পিএইচ সূত্রের প্রয়োগ।"
        },
        # SQ 7 (অধ্যায় ১১: খনিজ সম্পদ: জীবাশ্ম)
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "খনিজ সম্পদ: জীবাশ্ম (অসম্পৃক্ততার সনাক্তকরণ)",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "ব্রোমিন দ্রবণ পরীক্ষা দ্বারা কীভাবে ইথেন ও ইথিনের মধ্যে পার্থক্য করবে? রাসায়নিক সমীকরণ দাও।",
            "Model Answer": "ইথিন ($\\text{CH}_2=\\text{CH}_2$) অসম্পৃক্ত হওয়ায় লাল বর্ণের ব্রোমিন পানির সাথে সংযোজন বিক্রিয়া ঘটিয়ে ব্রোমিনের লাল বর্ণ দূর করে এবং বর্ণহীন ১,২-ডাইব্রোমোইথেন তৈরি করে:\n$\\text{CH}_2=\\text{CH}_2 + \\text{Br}_2 \\text{ (লাল)} \\rightarrow \\text{CH}_2\\text{Br}-\\text{CH}_2\\text{Br} \\text{ (বর্ণহীন)}$।\nপক্ষান্তরে ইথেন ($\\text{CH}_3-\\text{CH}_3$) সম্পৃক্ত হওয়ায় সাধারণ অবস্থায় ব্রোমিন পানির সাথে কোনো বিক্রিয়া করে না এবং লাল বর্ণ অপরিবর্তিত থাকে।",
            "Teacher Note / Explanation": "ব্রোমিন সংযোজনের মাধ্যমে সম্পৃক্ত ও অসম্পৃক্ত হাইড্রোকার্বনের পার্থক্য সনাক্তকরণ।"
        }
    ]

    # =========================================================================
    # 4. 7 CREATIVE QUESTIONS (CQ) - 3+2+2 Structure
    # 3 from Section A (Structure, Periodic Table, Bonds), 2 from Section B (Mole, Reactions, Energy), 2 from Section C (Acids, Metals, Fossils)
    # Total marks 40 (Answer 5 * 8 = 40 or standard 10 marks per CQ with Sub 1=2, Sub 2=4, Sub 3=4)
    # =========================================================================
    cqs = [
        # --- ক-বিভাগ: পদার্থের গঠন, পর্যায় সারণি ও বন্ধন (প্রশ্ন ১: পদার্থের গঠন ও আইসোটোপ) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "পদার্থের গঠন (আইসোটোপ ও ইলেকট্রন বিন্যাস)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের পরমাণুর মডেল চিত্রটি লক্ষ্য কর:\n##PRESET:atom##\nউদ্দীপক: প্রকৃতিতে ক্লোরিনের দুটি স্থায়ী আইসোটোপ $^{35}\\text{Cl}$ এবং $^{37}\\text{Cl}$ বিদ্যমান, যাদের পর্যাপ্ততার শতকরা পরিমাণ যথাক্রমে $75\\%$ এবং $25\\%$। অপর একটি মৌল $X$-এর ইলেকট্রন বিন্যাস: $1s^2\\, 2s^2\\, 2p^6\\, 3s^2\\, 3p^5$।",
            "Teacher Note / Explanation": "৩য় অধ্যায় (পদার্থের গঠন) থেকে আইসোটোপের শতকরা পরিমাণ হতে আপেক্ষিক পারমাণবিক ভর ও ইলেকট্রন বিন্যাস সংক্রান্ত সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "আইসোটোপ কাকে বলে? হাইড্রোজেনের যে আইসোটোপে কোনো নিউট্রন নেই তার নাম লিখ।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "যেসব পরমাণুর প্রোটন সংখ্যা সমান কিন্তু ভর সংখ্যা ভিন্ন, তাদেরকে পরস্পরের আইসোটোপ বলে।\nহাইড্রোজেনের যে আইসোটোপে কোনো নিউট্রন নেই তার নাম প্রোটিয়াম ($^1_1\\text{H}$)।",
            "Sub 1 Explanation": "আইসোটোপের নির্ভুল সংজ্ঞা ও উদাহরণ।",
            # খ
            "Sub 2 Text": "উদ্দীপকের তথ্যের আলোকে ক্লোরিনের আপেক্ষিক পারমাণবিক ভর গাণিতিকভাবে নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "আমরা জানি, আপেক্ষিক পারমাণবিক ভর $= \\frac{\\sum (\\text{আইসোটোপের ভর} \\times \\text{শতকরা পরিমাণ})}{100}$\n$\\text{Cl}$ এর আপেক্ষিক পারমাণবিক ভর $= \\frac{35 \\times 75 + 37 \\times 25}{100}$\n$= \\frac{2625 + 925}{100} = \\frac{3550}{100} = 35.5$।\nঅতএব ক্লোরিনের আপেক্ষিক পারমাণবিক ভর $35.5$।",
            "Sub 2 Explanation": "আইসোটোপের শতকরা উপস্থিতির ভিত্তিতে পারমাণবিক ভর গণনা।",
            # গ
            "Sub 3 Text": "বোর মডেল অনুসারে $X$ মৌলটির শক্তিস্তর ও উপশক্তিস্তরে ইলেকট্রন ধারণক্ষমতা ($2n^2$) এবং আউফবাউ নীতি মেনে ইলেকট্রন প্রবেশের ক্রম চিত্রসহ ব্যাখ্যা কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "$X$ মৌলটির মোট ইলেকট্রন সংখ্যা $= 2 + 2 + 6 + 2 + 5 = 17$, অর্থাৎ মৌলটি ক্লোরিন ($\\text{Cl}_{17}$)।\n(১) প্রধান শক্তিস্তরে ইলেকট্রন ধারণক্ষমতা $2n^2$:\n- ১ম স্তর ($n=1$, K-শেল): $2(1)^2 = 2$টি ইলেকট্রন ($1s^2$)।\n- ২য় স্তর ($n=2$, L-শেল): $2(2)^2 = 8$টি ইলেকট্রন ($2s^2 2p^6$)।\n- ৩য় স্তর ($n=3$, M-শেল): সর্বোচ্চ $2(3)^2 = 18$টি ধারণ করতে পারলেও অবশিষ্ট ৭টি ইলেকট্রন রয়েছে ($3s^2 3p^5$)।\n(২) আউফবাউ নীতি: ইলেকট্রন নিম্ন শক্তিস্তর পূর্ণ করে ক্রমান্বয়ে উচ্চ শক্তিস্তরে প্রবেশ করে। শক্তির ক্রম ($n+l$ এর মান):\n- $1s (1+0=1) < 2s (2+0=2) < 2p (2+1=3) < 3s (3+0=3) < 3p (3+1=4)$।\nএখানে $2p$ ও $3s$ উভয়ের $(n+l)=3$ হলেও যার $n$ কম ($2p$) তাতে আগে ইলেকট্রন প্রবেশ করে। বোরের কক্ষপথীয় চিত্রানুসারে নিউক্লিয়াসের বাইরে যথাক্রমে ২, ৮, ৭ বিন্যাসে ৩টি বৃত্তাকার কক্ষপথে ইলেকট্রন পরিভ্রমণ করে।",
            "Sub 3 Explanation": "শক্তিস্তরে ইলেকট্রন বণ্টন, আউফবাউ নীতি ও বোর মডেলের সমন্বয়।"
        },

        # --- ক-বিভাগ: পদার্থের গঠন, পর্যায় সারণি ও বন্ধন (প্রশ্ন ২: পর্যায় সারণি ও পর্যায়বৃত্ত ধর্ম) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "পর্যায় সারণি (আয়নীকরণ শক্তি ও পারমাণবিক আকার)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "উদ্দীপক: পর্যায় সারণির ৩য় পর্যায়ের কয়েকটি মৌলের প্রতীকী পরিচিতি দেওয়া হলো:\n$A(Z=11)$, $B(Z=12)$, $C(Z=15)$, $D(Z=17)$।\n(এখানে $A, B, C, D$ প্রচলিত কোনো মৌলের প্রতীক নয়)।",
            "Teacher Note / Explanation": "৪র্থ অধ্যায় (পর্যায় সারণি) থেকে পর্যায়বৃত্ত ধর্ম—পারমাণবিক ব্যাসার্ধ ও আয়নীকরণ শক্তির ব্যতিক্রমি বিশ্লেষণ।",
            # ক
            "Sub 1 Text": "আধুনিক পর্যায় সূত্রটি বিবৃত কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "মৌলসমূহের ভৌত ও রাসায়নিক ধর্মাবলি তাদের পারমাণবিক সংখ্যা অনুসারে পর্যায়ক্রমে আবর্তিত হয়।",
            "Sub 1 Explanation": "আধুনিক পর্যায় সূত্রের সঠিক বিবৃতি।",
            # খ
            "Sub 2 Text": "উদ্দীপকের $A, B, D$ মৌল তিনটির পারমাণবিক আকারের সঠিক ক্রম ব্যাখ্যা কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "মৌলসমূহের পরিচিতি: $A=\\text{Na}(11), B=\\text{Mg}(12), D=\\text{Cl}(17)$। এরা সবাই ৩য় পর্যায়ের মৌল।\nআমরা জানি, একই পর্যায়ে বাম থেকে ডানে গেলে নতুন কোনো শক্তিস্তর যুক্ত হয় না, কিন্তু পারমাণবিক সংখ্যা (নিউক্লিয়াসের প্রোটন সংখ্যা) ১ করে বৃদ্ধি পায়।\nনিউক্লিয়াসের ধনাত্মক চার্জ বৃদ্ধির ফলে বহিঃস্থ স্তরের ইলেকট্রনের প্রতি আকর্ষণ বৃদ্ধি পায়, ফলে কক্ষপথগুলো ভেতরের দিকে সংকুচিত হয়ে পারমাণবিক ব্যাসার্ধ হ্রাস পায়।\nযেহেতু পারমাণবিক সংখ্যা $\\text{Na}(11) < \\text{Mg}(12) < \\text{Cl}(17)$, তাই আকার হ্রাসের ক্রম:\n$\\text{Na} > \\text{Mg} > \\text{Cl}$ বা $A > B > D$।",
            "Sub 2 Explanation": "একই পর্যায়ে পারমাণবিক ব্যাসার্ধ হ্রাসের বৈজ্ঞানিক কারণ।",
            # গ
            "Sub 3 Text": "$A, B, C$ মৌলগুলোর প্রথম আয়নীকরণ শক্তির পরিবর্তন স্বাভাবিক পর্যায়বৃত্ত নিয়মে ঘটে কি? $B$ ও $C$ মৌলের ইলেকট্রন বিন্যাসের আলোকে ব্যাখ্যা কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "মৌলত্রয় হলো $A=\\text{Na}, B=\\text{Mg}, C=\\text{P}$।\nসাধারণ নিয়মানুযায়ী ৩য় পর্যায়ে বাম থেকে ডানে আয়নীকরণ শক্তি বৃদ্ধি পাওয়ার কথা:\n$\\text{Na} < \\text{Mg} < \\text{Al} < \\text{Si} < \\text{P}$।\nএখানে $B (\\text{Mg})$ ও $C (\\text{P})$ এর ইলেকট্রন বিন্যাস লক্ষ্য করি:\n$\\text{Mg}(12): 1s^2 2s^2 2p^6 3s^2$\n$\\text{P}(15): 1s^2 2s^2 2p^6 3s^2 3p^3$\nম্যাগনেসিয়ামের সর্ববহিঃস্থ $3s$ অরবিটাল সম্পূর্ণ পূর্ণ ($s^2$), যা অতিরিক্ত সুস্থিত। ফলে এর থেকে ইলেকট্রন অপসারণে বেশি শক্তির প্রয়োজন হয় (এমনকি এর পরবর্তী মৌল অ্যালুমিনিয়ামের চেয়েও বেশি)।\nআবার ফসফরাসের সর্ববহিঃস্থ $3p$ উপস্তর অর্ধপূর্ণ ($p^3$), যা হুন্ডের নিয়মানুসারে অতিরিক্ত সুস্থিত। ফলে ফসফরাস থেকে ইলেকট্রন অপসারণেও বেশি শক্তির প্রয়োজন হয়।\nসুতরাং আয়নীকরণ শক্তির ক্রম $\\text{Na} < \\text{Mg} < \\text{P}$, তবে ম্যাগনেসিয়াম ও ফসফরাসের বিশেষ স্থিতিশীলতার কারণে তাদের আয়নীকরণ শক্তি স্বাভাবিকের চেয়ে বেশি দৃঢ় হয়।",
            "Sub 3 Explanation": "অরবিটালের সুস্থিতি (পূর্ণ $s^2$ ও অর্ধপূর্ণ $p^3$) দ্বারা আয়নীকরণ শক্তির বিশদ ব্যাখ্যা।"
        },

        # --- ক-বিভাগ: পদার্থের গঠন, পর্যায় সারণি ও বন্ধন (প্রশ্ন ৩: রাসায়নিক বন্ধন ও বৈশিষ্ট্য) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "রাসায়নিক বন্ধন (আয়নিক ও সমযোজী বন্ধন)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের মিথেন অণুর গঠন লক্ষ্য কর:\n##PRESET:methane##\nউদ্দীপক: দুটি যৌগ $P$ এবং $Q$। $P$ যৌগটি সোডিয়াম ও ক্লোরিন দ্বারা গঠিত $(\\text{NaCl})$ এবং $Q$ যৌগটি কার্বন ও হাইড্রোজেন দ্বারা গঠিত $(\\text{CH}_4)$।",
            "Teacher Note / Explanation": "৫ম অধ্যায় (রাসায়নিক বন্ধন) থেকে আয়নিক ও সমযোজী বন্ধন গঠন প্রক্রিয়া এবং তাদের ভৌত বৈশিষ্ট্যের তুলনামূলক সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "যোজ্যতা ইলেকট্রন (Valence Electron) কাকে বলে?",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "কোনো পরমাণুর সর্ববহিঃস্থ প্রধান শক্তিস্তরে বিদ্যমান মোট ইলেকট্রন সংখ্যাকে ওই মৌলের যোজ্যতা ইলেকট্রন বলে।",
            "Sub 1 Explanation": "যোজ্যতা ইলেকট্রনের সংজ্ঞা।",
            # খ
            "Sub 2 Text": "ইলেকট্রন ডট ডায়াগ্রামের সাহায্যে $P$ যৌগে আয়নিক বন্ধন এবং $Q$ যৌগে সমযোজী বন্ধন গঠন প্রক্রিয়া ব্যাখ্যা কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "(১) $\\text{NaCl}$ এ আয়নিক বন্ধন:\nসোডিয়াম ($\\text{Na}: 2, 8, 1$) তার সর্ববহিঃস্থ ১টি ইলেকট্রন ত্যাগ করে স্থিতিশীল নিয়ন বিন্যাস অর্জন করে: $\\text{Na} \\rightarrow \\text{Na}^+ + e^-$।\nক্লোরিন ($\\text{Cl}: 2, 8, 7$) সেই ইলেকট্রন গ্রহণ করে আর্গন বিন্যাস লাভ করে: $\\text{Cl} + e^- \\rightarrow \\text{Cl}^-$।\nবিপরীতধর্মী $\\text{Na}^+$ ও $\\text{Cl}^-$ আয়ন স্থির তড়িৎ আকর্ষণ বল দ্বারা যুক্ত হয়ে আয়নিক বন্ধন $\\text{NaCl}$ গঠন করে।\n(২) $\\text{CH}_4$ এ সমযোজী বন্ধন:\nকার্বনের যোজ্যতা স্তরে ৪টি ইলেকট্রন থাকে। অষ্টক পূর্ণ করতে কার্বন ৪টি হাইড্রোজেন পরমাণুর সাথে ১টি করে মোট ৪ জোড়া ইলেকট্রন শেয়ার করে ৪টি সমযোজী একক বন্ধন ($\text{C}-\text{H}$) গঠন করে।",
            "Sub 2 Explanation": "ইলেকট্রন আদান-প্রদান ও শেয়ারিংয়ের মাধ্যমে বন্ধন গঠনের ব্যাখ্যা।",
            # গ
            "Sub 3 Text": "গলনাঙ্ক, স্ফুটনাঙ্ক এবং পানিতে দ্রবণীয়তা ও বিদ্যুৎ পরিবাহিতার ক্ষেত্রে $P$ ও $Q$ যৌগের ভিন্ন আচরণের কারণ তুলনামূলক বিশ্লেষণ কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "(১) গলনাঙ্ক ও স্ফুটনাঙ্ক:\n$P$ ($\\text{NaCl}$) একটি আয়নিক যৌগ, যেখানে ধনাত্মক ও ঋণাত্মক আয়নসমূহ শক্তিশালী স্থির তড়িৎ আকর্ষণ বল দ্বারা ত্রিমাত্রিক স্ফটিক জালিকা তৈরি করে। এই বন্ধন ভাঙতে প্রচুর তাপের প্রয়োজন হওয়ায় এর গলনাঙ্ক ($801^\\circ\\text{C}$) ও স্ফুটনাঙ্ক অনেক বেশি।\nঅপরদিকে $Q$ ($\\text{CH}_4$) অপোলার সমযোজী যৌগ, যার অণুগুলোর মধ্যে দুর্বল ভ্যান ডার ওয়ালস বল কাজ করে। তাই এর গলনাঙ্ক ও স্ফুটনাঙ্ক অত্যন্ত কম (কক্ষ তাপমাত্রায় গ্যাসীয়)।\n(২) দ্রবণীয়তা ও বিদ্যুৎ পরিবাহিতা:\nপানি একটি পোলার দ্রাবক। $\\text{NaCl}$ পানিতে দ্রবীভূত হয়ে মুক্ত $\\text{Na}^+$ ও $\\text{Cl}^-$ আয়ন তৈরি করে, ফলে পানিতে দ্রবীভূত হয় এবং গলিত বা দ্রবীভূত অবস্থায় মুক্ত আয়ন দ্বারা বিদ্যুৎ পরিবহন করে।\nকিন্তু $\\text{CH}_4$ অপোলার হওয়ায় পানিতে দ্রবীভূত হয় না এবং এতে কোনো মুক্ত আয়ন বা ইলেকট্রন না থাকায় বিদ্যুৎ অপরিবাহী।",
            "Sub 3 Explanation": "আয়নিক ও সমযোজী যৌগের ভৌত ধর্মের তুলনামূলক বৈজ্ঞানিক বিশ্লেষণ।"
        },

        # --- খ-বিভাগ: মোলের ধারণা, বিক্রিয়া ও শক্তি (প্রশ্ন ৪: মোলের ধারণা ও লিমিটিং বিক্রিয়ক) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "মোলের ধারণা ও রাসায়নিক গণনা (লিমিটিং বিক্রিয়ক)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "উদ্দীপক: একটি পাত্রে $5.4\\text{ g } \\text{Al}$ গুঁড়ার সাথে $40.0\\text{ g } \\text{Fe}_2\\text{O}_3$ মিশ্রিত করে উত্তপ্ত করা হলো। সংঘটিত বিক্রিয়াটি নিম্নরূপ:\n$2\\text{Al} + \\text{Fe}_2\\text{O}_3 \\xrightarrow{\\Delta} \\text{Al}_2\\text{O}_3 + 2\\text{Fe}$\n$(\\text{Al} = 27, \\text{Fe} = 56, \\text{O} = 16)$।",
            "Teacher Note / Explanation": "৬ষ্ঠ অধ্যায় (মোলের ধারণা ও রাসায়নিক গণনা) থেকে থার্মিট বিক্রিয়ায় লিমিটিং বিক্রিয়ক ও উৎপাদের পরিমাণ নির্ণয় সংক্রান্ত সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "মোলার দ্রবণ কাকে বলে? মোলার দ্রবণের মাত্রা কত?",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "নির্দিষ্ট তাপমাত্রায় $1\\text{ L}$ দ্রবণে যদি $1\\text{ mol}$ দ্রব দ্রবীভূত থাকে, তবে সেই দ্রবণকে মোলার দ্রবণ বলে।\nমোলার দ্রবণের মাত্রা হলো $1\\text{ M}$ (১ মোলার)।",
            "Sub 1 Explanation": "মোলার দ্রবণের স্পষ্ট সংজ্ঞা ও মাত্রা।",
            # খ
            "Sub 2 Text": "উদ্দীপকের বিক্রিয়াটিতে লিমিটিং বিক্রিয়ক কোনটি? গাণিতিকভাবে শনাক্ত কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "বিক্রিয়কদ্বয়ের মোলার ভর:\n$2\\text{Al} = 2 \\times 27 = 54\\text{ g}$\n$\\text{Fe}_2\\text{O}_3 = 2 \\times 56 + 3 \\times 16 = 112 + 48 = 160\\text{ g}$\nসমীকরণ মতে, $54\\text{ g } \\text{Al}$ বিক্রিয়া করে $160\\text{ g } \\text{Fe}_2\\text{O}_3$ এর সাথে।\n$\\therefore 5.4\\text{ g } \\text{Al}$ বিক্রিয়া করে $= \\frac{160 \\times 5.4}{54} = 16.0\\text{ g } \\text{Fe}_2\\text{O}_3$ এর সাথে।\nকিন্তু পাত্রে $\\text{Fe}_2\\text{O}_3$ উপস্থিত আছে $40.0\\text{ g}$, যা প্রয়োজনীয় $16.0\\text{ g}$ এর চেয়ে বেশি।\nযেহেতু বিক্রিয়ায় অ্যালুমিনিয়াম ($\\text{Al}$) সম্পূর্ণ শেষ হয়ে যায় এবং আয়রন অক্সাইড অবশিষ্ট থাকে, সুতরাং অ্যালুমিনিয়াম ($\\text{Al}$) হলো লিমিটিং বিক্রিয়ক।",
            "Sub 2 Explanation": "রাসায়নিক সমীকরণের মোলার অনুপাত হতে লিমিটিং বিক্রিয়ক নির্ণয়।",
            # গ
            "Sub 3 Text": "বিক্রিয়া শেষে পাত্রে কোন বিক্রিয়ক কতটুকু অবশিষ্ট থাকবে এবং তাত্ত্বিকভাবে কত গ্রাম আয়রন ($\\text{Fe}$) উৎপাদিত হবে?",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "(১) উদ্বৃত্ত বিক্রিয়কের পরিমাণ:\nবিক্রিয়া শেষে $\\text{Fe}_2\\text{O}_3$ অবশিষ্ট থাকবে $= 40.0\\text{ g} - 16.0\\text{ g} = 24.0\\text{ g}$।\n(২) উৎপাদিত আয়রনের ভর:\nবিক্রিয়ায় $2\\text{Fe} = 2 \\times 56 = 112\\text{ g}$ আয়রন উৎপন্ন হয়।\nসমীকরণ মতে,\n$54\\text{ g } \\text{Al}$ হতে আয়রন উৎপন্ন হয় $112\\text{ g}$।\n$\\therefore 5.4\\text{ g } \\text{Al}$ হতে আয়রন উৎপন্ন হয় $= \\frac{112 \\times 5.4}{54} = 11.2\\text{ g}$।\nঅতএব বিক্রিয়া শেষে পাত্রে $24.0\\text{ g } \\text{Fe}_2\\text{O}_3$ অবশিষ্ট থাকবে এবং $11.2\\text{ g}$ আয়রন উৎপাদিত হবে।",
            "Sub 3 Explanation": "উদ্বৃত্ত বিক্রিয়কের পরিমাণ ও উৎপাদের তাত্ত্বিক পরিমাণ নির্ণয়।"
        },

        # --- খ-বিভাগ: মোলের ধারণা, বিক্রিয়া ও শক্তি (প্রশ্ন ৫: বন্ধন শক্তি ও লা-শাতেলিয়ার) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "রসায়ন ও শক্তি (বন্ধন শক্তি ও লা-শাতেলিয়ারের নীতি)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "উদ্দীপক: অ্যামোনিয়া উৎপাদনের একটি উভমুখী বিক্রিয়া নিম্নরূপ:\n$\\text{N}_2(\\text{g}) + 3\\text{H}_2(\\text{g}) \\rightleftharpoons 2\\text{NH}_3(\\text{g}) + 92\\text{ kJ}$\nকয়েকটি বন্ধন শক্তি দেওয়া হলো:\n$\\text{N}\\equiv\\text{N} = 946\\text{ kJ/mol}$, $\\text{H}-\\text{H} = 436\\text{ kJ/mol}$, $\\text{N}-\\text{H} = 391\\text{ kJ/mol}$।",
            "Teacher Note / Explanation": "৭ম ও ৮ম অধ্যায় (রাসায়নিক বিক্রিয়া ও বন্ধন শক্তি) থেকে বিক্রিয়া তাপ $\\Delta H$ ও লা-শাতেলিয়ারের নীতি সমন্বিত প্রশ্ন।",
            # ক
            "Sub 1 Text": "তাপোৎপাদী বিক্রিয়া কাকে বলে? এই বিক্রিয়ায় $\\Delta H$ এর চিহ্ন কী হয়?",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "যে রাসায়নিক বিক্রিয়ায় তাপ উৎপন্ন হয়, তাকে তাপোৎপাদী বিক্রিয়া বলে।\nতাপোৎপাদী বিক্রিয়ায় বিক্রিয়া তাপ $\\Delta H$ ঋণাত্মক ($-$) হয়।",
            "Sub 1 Explanation": "তাপোৎপাদী বিক্রিয়া ও ডেল্টা এইচ এর চিহ্ন।",
            # খ
            "Sub 2 Text": "উদ্দীপকের বন্ধন শক্তিসমূহ ব্যবহার করে বিক্রিয়াটিতে বিক্রিয়া তাপ ($\\Delta H$) নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "গাঠনিক সমীকরণ: $(\\text{N}\\equiv\\text{N}) + 3(\\text{H}-\\text{H}) \\rightarrow 2[\\text{N}-\\text{H}\\text{ বন্ধন } 3টি] = 6(\\text{N}-\\text{H})$\n(১) বিক্রিয়কের বন্ধন ভাঙতে প্রয়োজনীয় মোট শক্তি ($B_1$):\n$B_1 = 1 \\times (\\text{N}\\equiv\\text{N}) + 3 \\times (\\text{H}-\\text{H})$\n$= 946 + 3(436) = 946 + 1308 = 2254\\text{ kJ}$।\n(২) উৎপাদের বন্ধন গড়তে নির্গত মোট শক্তি ($B_2$):\n$B_2 = 6 \\times (\\text{N}-\\text{H}) = 6 \\times 391 = 2346\\text{ kJ}$।\nবিক্রিয়া তাপ $\\Delta H = B_1 - B_2 = 2254 - 2346 = -92\\text{ kJ}$।\nযেহেতু $\\Delta H = -92\\text{ kJ/mol}$, সুতরাং বিক্রিয়াটি তাপোৎপাদী এবং উদ্দীপকের সমীকরণের সাথে সম্পূর্ণ সঙ্গতিপূর্ণ।",
            "Sub 2 Explanation": "বন্ধন শক্তি সূত্র $\\Delta H = B_1 - B_2$ প্রয়োগ করে মান নির্ণয়।",
            # গ
            "Sub 3 Text": "লা-শাতেলিয়ারের নীতি প্রয়োগ করে অ্যামোনিয়ার সর্বোচ্চ উৎপাদন নিশ্চিত করতে তাপমাত্রা, চাপ ও প্রভাবকের ভূমিকা বিশ্লেষণ কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "(১) তাপমাত্রার প্রভাব: বিক্রিয়াটি তাপোৎপাদী ($\\Delta H = -92\\text{ kJ}$)। লা-শাতেলিয়ারের নীতি অনুযায়ী তাপমাত্রা হ্রাস করলে বিক্রিয়া সম্মুখমুখী হয়ে উৎপাদন বাড়বে। তবে তাপমাত্রা অতি কম হলে বিক্রিয়ার গতি অত্যন্ত কমে যায়, তাই সর্বোচ্চ উৎপাদনের জন্য অনুকূল তাপমাত্রা $450^\\circ\\text{C}-550^\\circ\\text{C}$ রাখা হয়।\n(২) চাপের প্রভাব: বিক্রিয়কের মোট মোল সংখ্যা $1 + 3 = 4$ এবং উৎপাদের মোল সংখ্যা $2$। যেহেতু বিক্রিয়ায় আয়তন হ্রাস পায়, লা-শাতেলিয়ারের নীতি অনুযায়ী চাপ বৃদ্ধি করলে সাম্যাবস্থা যেদিকে মোল সংখ্যা কম সেদিকে সরে যায়। তাই উচ্চ চাপ ($200\\text{ atm}$) প্রয়োগে অ্যামোনিয়ার উৎপাদন উল্লেখযোগ্যভাবে বৃদ্ধি পায়।\n(৩) প্রভাবক: বিক্রিয়ার গতি দ্রুত করতে আয়রন চূর্ণ ($\text{Fe}$) প্রভাবক এবং মলিবডেনাম ($\text{Mo}$) প্রভাবক সহায়ক হিসেবে ব্যবহৃত হয়।",
            "Sub 3 Explanation": "লা-শাতেলিয়ারের নীতি অনুযায়ী শিল্পোৎপাদনে নিয়ামকসমূহের ভারসাম্যপূর্ণ বিশ্লেষণ।"
        },

        # --- গ-বিভাগ: এসিড-ক্ষারক ও জীবাশ্ম/জৈব রসায়ন (প্রশ্ন ৬: এসিড-ক্ষারক ও টাইট্রেশন - WITH TITRATION DIAGRAM) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "এসিড-ক্ষারক সমতা (প্রশমন বিক্রিয়া ও টাইট্রেশন)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের টাইট্রেশন চিত্রটি লক্ষ্য কর:\n##PRESET:titration##\nউদ্দীপক: পাত্র $A$-তে $50\\text{ mL } 0.1\\text{ M } \\text{H}_2\\text{SO}_4$ দ্রবণ রয়েছে। পাত্র $B$-তে $100\\text{ mL } 0.1\\text{ M } \\text{NaOH}$ দ্রবণ প্রস্তুত করা হলো।",
            "Teacher Note / Explanation": "৯ম অধ্যায় (এসিড-ক্ষারক সমতা) থেকে টাইট্রেশন ও দ্রবণ মিশ্রণের প্রকৃতি এবং পিএইচ বিশ্লেষণ।",
            # ক
            "Sub 1 Text": "টাইট্রেশন (Titration) কাকে বলে? উপযুক্ত নির্দেশকের একটি উদাহরণ দাও।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "উপযুক্ত নির্দেশকের উপস্থিতিতে একটি প্রমাণ দ্রবণের জানা আয়তনের সাহায্যে অন্য একটি অজানা ঘনমাত্রার দ্রবণের ঘনমাত্রা নির্ণয়ের পদ্ধতিকে টাইট্রেশন বলে।\nএকটি প্রচলিত নির্দেশক হলো ফেনলফথ্যালিন (Phenolphthalein)।",
            "Sub 1 Explanation": "টাইট্রেশনের সংজ্ঞা ও নির্দেশকের নাম।",
            # খ
            "Sub 2 Text": "পাত্র $A$-এর এসিড দ্রবণটিকে সম্পূর্ণরূপে প্রশমিত করতে পাত্র $B$-এর কত মিলিলিটার ক্ষার দ্রবণ প্রয়োজন হবে নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "প্রশমন বিক্রিয়া:\n$\\text{H}_2\\text{SO}_4 + 2\\text{NaOH} \\rightarrow \\text{Na}_2\\text{SO}_4 + 2\\text{H}_2\\text{O}$\nসমীকরণ হতে পাই, এসিডের মোল সংখ্যা $n_A = 1$, ক্ষারের মোল সংখ্যা $n_B = 2$।\nটাইট্রেশনের সমীকরণ: $\\frac{V_A S_A}{n_A} = \\frac{V_B S_B}{n_B}$\nএখানে $V_A = 50\\text{ mL}, S_A = 0.1\\text{ M}, S_B = 0.1\\text{ M}, n_A = 1, n_B = 2$।\n$\\implies \\frac{50 \\times 0.1}{1} = \\frac{V_B \\times 0.1}{2}$\n$\\implies 5 = 0.05 V_B \\implies V_B = \\frac{5}{0.05} = 100\\text{ mL}$।\nঅতএব এসিড দ্রবণটিকে সম্পূর্ণরূপে প্রশমিত করতে ঠিক $100\\text{ mL } \\text{NaOH}$ দ্রবণ প্রয়োজন।",
            "Sub 2 Explanation": "টাইট্রেশনের মৌলিক সমীকরণ প্রয়োগ করে প্রয়োজনীয় আয়তন নির্ণয়।",
            # গ
            "Sub 3 Text": "পাত্র $A$ ও পাত্র $B$-এর সম্পূর্ণ দ্রবণ দুটিকে একত্রে মিশ্রিত করলে মিশ্রণের প্রকৃতি কেমন হবে এবং মিশ্রণের $\\text{pH}$ এর মান কত হবে? গাণিতিক ব্যাখ্যা দাও।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "পাত্র $A$ এ বিদ্যমান $\\text{H}_2\\text{SO}_4$ এর মোল সংখ্যা $n = V_A \\times S_A = 0.050\\text{ L} \\times 0.1\\text{ M} = 0.005\\text{ mol}$।\nপাত্র $B$ এ বিদ্যমান $\\text{NaOH}$ এর মোল সংখ্যা $n = V_B \\times S_B = 0.100\\text{ L} \\times 0.1\\text{ M} = 0.010\\text{ mol}$।\nবিক্রিয়া অনুযায়ী:\n$1\\text{ mol } \\text{H}_2\\text{SO}_4 \\equiv 2\\text{ mol } \\text{NaOH}$\n$\\therefore 0.005\\text{ mol } \\text{H}_2\\text{SO}_4 \\equiv 2 \\times 0.005 = 0.010\\text{ mol } \\text{NaOH}$।\nদেখা যাচ্ছে যে, এসিড ও ক্ষার উভয়েই বিক্রিয়ায় সম্পূর্ণভাবে নিঃশেষিত হয়ে নিরপেক্ষ লবণ ($\\text{Na}_2\\text{SO}_4$) এবং পানি উৎপন্ন করে।\nপাত্রে কোনো উদ্বৃত্ত এসিড বা ক্ষার থাকে না।\nযেহেতু তীব্র এসিড ও তীব্র ক্ষারের পূর্ণ প্রশমন ঘটেছে এবং উৎপন্ন লবণ নিরপেক্ষ, সুতরাং $25^\\circ\\text{C}$ তাপমাত্রায় মিশ্রণটির প্রকৃতি সম্পূর্ণরূপে নিরপেক্ষ হবে এবং এর $\\text{pH} = 7$ হবে।",
            "Sub 3 Explanation": "মোল সংখ্যার সমতা হতে পূর্ণ প্রশমন নিশ্চিতকরণ ও নিরপেক্ষ পিএইচ ব্যাখ্যা।"
        },

        # --- গ-বিভাগ: এসিড-ক্ষারক ও জীবাশ্ম/জৈব রসায়ন (প্রশ্ন ৭: জৈব রসায়ন ও রূপান্তর - WITH ETHANOL DIAGRAM) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "খনিজ সম্পদ: জীবাশ্ম (জৈব যৌগের রূপান্তর ও পলিমার)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "নিচের ইথানল অণুর গঠন লক্ষ্য কর:\n##PRESET:ethanol##\nউদ্দীপক: নিচের রাসায়নিক রূপান্তর প্রবাহটি লক্ষ্য কর:\n$A \\xrightarrow[\\Delta]{+\\text{alc. KOH}} B \\xrightarrow{+\\text{H}_2\\text{O} / \\text{H}_3\\text{PO}_4} C \\xrightarrow{[O]} D \\xrightarrow{[O]} E$\nযেখানে $A$ হলো ব্রোমোইথেন ($\\text{CH}_3-\\text{CH}_2-\\text{Br}$), $B$ একটি অসম্পৃক্ত হাইড্রোকার্বন এবং $E$ হলো ইথানয়িক এসিড।",
            "Teacher Note / Explanation": "১১শ অধ্যায় (খনিজ সম্পদ: জীবাশ্ম) থেকে অ্যালকাইল হ্যালাইড থেকে অ্যালকিন, অ্যালকোহল, অ্যালডিহাইড ও জৈব এসিডের ধারাবাহিক রূপান্তর।",
            # ক
            "Sub 1 Text": "কার্যকরী মূলক (Functional Group) কাকে বলে? অ্যালকোহল ও কার্বক্সিলিক এসিডের কার্যকরী মূলকের সংকেত লিখ।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "যেসব পরমাণু বা মূলক কোনো জৈব যৌগের অণুতে উপস্থিত থেকে তার প্রকৃতি ও সমস্ত রাসায়নিক ধর্ম নির্ধারণ করে, তাদেরকে কার্যকরী মূলক বলে।\nঅ্যালকোহলের কার্যকরী মূলক: $-\\text{OH}$ (হাইড্রক্সিল মূলক)\nকার্বক্সিলিক এসিডের কার্যকরী মূলক: $-\\text{COOH}$ (কার্বক্সিল মূলক)।",
            "Sub 1 Explanation": "কার্যকরী মূলকের সংজ্ঞা ও সংকেত।",
            # খ
            "Sub 2 Text": "$B$ যৌগটির অসম্পৃক্ততা সনাক্তকরণে ব্রোমিন দ্রবণ পরীক্ষা ও বেয়ার পরীক্ষা ($\\text{KMnO}_4$) সমীকরণসহ লিখ।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "ব্রোমোইথেনকে অ্যালকোহলীয় পটাশিয়াম হাইড্রোক্সাইডসহ উত্তপ্ত করলে ডিহাইড্রোহ্যালোজেনেশন বিক্রিয়ায় ইথিন উৎপন্ন হয়: $B = \\text{CH}_2=\\text{CH}_2$।\nঅসম্পৃক্ততা সনাক্তকরণ:\n(১) ব্রোমিন দ্রবণ পরীক্ষা:\nইথিনের মধ্যে লাল বর্ণের ব্রোমিন পানি যোগ করলে সংযোজন বিক্রিয়ায় ১,২-ডাইব্রোমোইথেন তৈরি হয় এবং লাল বর্ণ দূরীভূত হয়:\n$\\text{CH}_2=\\text{CH}_2 + \\text{Br}_2 \\rightarrow \\text{CH}_2\\text{Br}-\\text{CH}_2\\text{Br}$ (বর্ণহীন)।\n(২) বেয়ার পরীক্ষা:\nইথিনের মধ্যে ক্ষারীয় $\\text{KMnO}_4$ দ্রবণ যোগ করলে জারিত হয়ে ইথিলিন গ্লাইকল উৎপন্ন হয় এবং পটাসিয়াম পারম্যাঙ্গানেটের গোলাপী/বেগুনী বর্ণ দূর হয়:\n$\\text{CH}_2=\\text{CH}_2 + [O] + \\text{H}_2\\text{O} \\xrightarrow{\\text{KMnO}_4 + \\text{KOH}} \\text{CH}_2\\text{OH}-\\text{CH}_2\\text{OH}$ (ইথিলিন গ্লাইকল)।\nউভয় পরীক্ষা দ্বারা $B$ যৌগে দ্বিবন্ধনের উপস্থিতি নিশ্চিতভাবে প্রমাণিত হয়।",
            "Sub 2 Explanation": "অ্যালকিনের দ্বিবন্ধন সনাক্তকরণের দুটি আদর্শ পরীক্ষার নির্ভুল সমীকরণ।",
            # গ
            "Sub 3 Text": "$B$ যৌগ হতে পলিথিন তৈরির বিক্রিয়া কৌশল এবং $C$ থেকে $E$ যৌগের রূপান্তর প্রক্রিয়া উপযুক্ত সমীকরণসহ বিশ্লেষণ কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "(১) পলিথিন উৎপাদন:\nঅল্প পরিমাণ অক্সিজেনের উপস্থিতিতে $1000\\text{ atm}$ চাপে ও $200^\\circ\\text{C}$ তাপমাত্রায় ইথিনকে ($B$) উত্তপ্ত করলে পলিমারকরণ বিক্রিয়ায় পলিথিন উৎপন্ন হয়:\n$n(\\text{CH}_2=\\text{CH}_2) \\xrightarrow[1000\\text{ atm}, 200^\\circ\\text{C}]{\\text{O}_2} -(-\\text{CH}_2-\\text{CH}_2-)_n-$ (পলিথিন)।\n(২) $C$ থেকে $E$ এর রূপান্তর:\nইথিন পানির সাথে ফসফরিক এসিডের উপস্থিতিতে বিক্রিয়া করে ইথানল ($C$) গঠন করে:\n$\\text{CH}_2=\\text{CH}_2 + \\text{H}_2\\text{O} \\xrightarrow{\\text{H}_3\\text{PO}_4, 300^\\circ\\text{C}, 60\\text{ atm}} \\text{CH}_3-\\text{CH}_2-\\text{OH}$ (ইথানল, $C$)\nইথানলকে অম্লীয় পটাশিয়াম ডাইক্রোমেট ($\\text{K}_2\\text{Cr}_2\\text{O}_7 + \\text{H}_2\\text{SO}_4$) দ্বারা জারিত করলে প্রথমে ইথান্যাল ($D$) উৎপন্ন হয়:\n$\\text{CH}_3\\text{CH}_2\\text{OH} + [O] \\xrightarrow{\\text{K}_2\\text{Cr}_2\\text{O}_7 + \\text{H}_2\\text{SO}_4} \\text{CH}_3\\text{CHO} + \\text{H}_2\\text{O}$ (ইথান্যাল, $D$)\nইথান্যাল পুনরায় জারিত হয়ে ইথানয়িক এসিড ($E$) উৎপন্ন করে:\n$\\text{CH}_3\\text{CHO} + [O] \\xrightarrow{\\text{K}_2\\text{Cr}_2\\text{O}_7 + \\text{H}_2\\text{SO}_4} \\text{CH}_3\\text{COOH}$ (ইথানয়িক এসিড, $E$)।",
            "Sub 3 Explanation": "সংযোজন পলিমারাইজেশন ও জৈব জারণের ধারাবাহিক সমীকরণ বিশ্লেষণ।"
        }
    ]

    all_questions = mcqs + smcqs + sqs + cqs

    for q_idx, q in enumerate(all_questions, start=2):
        for field, val in q.items():
            if field in col_map:
                ws.cell(row=q_idx, column=col_map[field], value=val)

    wb.save(output_path)
    print(f"✅ Generated SSC Chemistry Question Paper workbook with:")
    print(f"   - {len(mcqs)} standard MCQs")
    print(f"   - {len(smcqs)} SMCQs ({len(smcqs) * 3} sub-questions)")
    print(f"   - Total MCQ Marks: {len(mcqs) + len(smcqs) * 3} Marks")
    print(f"   - {len(sqs)} SQs (Total {len(sqs) * 2} Marks, answer 5 for 10 Marks)")
    print(f"   - {len(cqs)} CQs ({len(cqs)} * 10 Marks = {len(cqs) * 10} Marks, answer 5 for 40 Marks)")
    print(f"   Total rows in Template sheet: {ws.max_row - 1}")
    print(f"Saved at: {output_path}")

if __name__ == "__main__":
    generate_chemistry_paper()
