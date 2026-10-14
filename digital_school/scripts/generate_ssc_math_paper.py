import openpyxl
import os

def generate_perfect_ssc_math_paper():
    template_path = '/Users/md.rofazhasanrafiu/coding/question_template_objective.xlsx'
    out_path = '/Users/md.rofazhasanrafiu/coding/SSC_Math_Full_Question_Paper_2027_2028.xlsx'

    wb = openpyxl.load_workbook(template_path)
    ws = wb['Template']

    # Remove reference sheets so only question template and instructions remain
    if 'Valid Classes Reference' in wb.sheetnames:
        del wb['Valid Classes Reference']

    # Clear existing rows except header
    while ws.max_row > 1:
        ws.delete_rows(2)

    class_name = '10A - 1'
    subject = 'সাধারণ গণিত'

    def add_row(data_dict):
        headers = [ws.cell(1, c).value for c in range(1, 121)]
        row_vals = []
        for h in headers:
            row_vals.append(data_dict.get(h, ''))
        ws.append(row_vals)

    # =========================================================================
    # PART 1: 24 MCQs (Balanced across chapters, 7 Bohupodi Somaptisuchok)
    # No artificial jargon, authentic textbook standards
    # =========================================================================

    mcqs = [
        # --- ক-বিভাগ: বীজগণিত (৭টি) ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বাস্তব সংখ্যা",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "নিচের কোনটি অমূলদ সংখ্যা?",
            "Option A": "$\\sqrt{\\frac{9}{16}}$", "Option B": "$\\sqrt{0.\\dot{4}}$", "Option C": "$\\sqrt{5}$", "Option D": "$\\sqrt{49}$",
            "Correct Option": "C", "Correct Answer": "$\\sqrt{5}$",
            "Teacher Note / Explanation": "$\\sqrt{5}$ একটি পূর্ণবর্গ সংখ্যার বর্গমূল নয়, ফলে এটি অসীম অনাবৃত্ত দশমিক ভগ্নাংশ বা অমূলদ সংখ্যা।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সেট ও ফাংশন",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$A = \\{x \\in \\mathbb{N} : x^2 - 5x + 6 = 0\\}$ হলে, সেট $A$ এর শক্তি সেট $P(A)$ এর উপাদান সংখ্যা কতটি?",
            "Option A": "2", "Option B": "4", "Option C": "8", "Option D": "16",
            "Correct Option": "B", "Correct Answer": "4",
            "Teacher Note / Explanation": "$x^2 - 5x + 6 = 0 \\implies x=2,3$। উপাদান সংখ্যা $n=2$। অতএব $P(A)$ এর উপাদান সংখ্যা $2^n = 2^2 = 4$।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বীজগাণিতিক রাশি",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "$x + \\frac{1}{x} = \\sqrt{3}$ হলে, $x^6 + 1$ এর মান কত?",
            "Option A": "-1", "Option B": "0", "Option C": "1", "Option D": "$\\sqrt{3}$",
            "Correct Option": "B", "Correct Answer": "0",
            "Teacher Note / Explanation": "$x^3 + \\frac{1}{x^3} = (\\sqrt{3})^3 - 3\\sqrt{3} = 0 \\implies \\frac{x^6 + 1}{x^3} = 0 \\implies x^6 + 1 = 0$।"
        },
        {
            # বহুপদী সমাপ্তিসূচক ১
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সূচক ও লগারিদম",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "সূচক ও লগারিদমের নিয়মানুসারে—\ni. $a^0 = 1$ ($a \\neq 0$)\nii. $\\log_a (M+N) = \\log_a M + \\log_a N$\niii. $\\log_a M^r = r \\log_a M$\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "B", "Correct Answer": "i ও iii",
            "Teacher Note / Explanation": "$\\log_a(MN) = \\log_a M + \\log_a N$ কিন্তু যোগফলের ক্ষেত্রে লগ পৃথক করা যায় না। অতএব ii ভুল এবং i ও iii সঠিক।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "একচলক সমীকরণ",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$\\sqrt{2x - 3} + 3 = 2$ সমীকরণটির সমাধান সেট কোনটি?",
            "Option A": "$\\{1\\}$", "Option B": "$\\{-1\\}$", "Option C": "$\\{\\frac{1}{2}\\}$", "Option D": "$\\emptyset$",
            "Correct Option": "D", "Correct Answer": "$\\emptyset$",
            "Teacher Note / Explanation": "$\\sqrt{2x-3} = -1$। বাস্তব সংখ্যার ধনাত্মক বর্গমূল ঋণাত্মক হতে পারে না, ফলে সমীকরণটির কোনো বাস্তব সমাধান নেই।"
        },
        {
            # বহুপদী সমাপ্তিসূচক ২
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বীজগাণিতিক অনুপাত ও সমানুপাত",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$a : b = c : d$ হলে—\ni. $\\frac{a+b}{b} = \\frac{c+d}{d}$ (যোজন)\nii. $\\frac{a-b}{b} = \\frac{c-d}{d}$ (বিয়োজন)\niii. $ad = bc$\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Teacher Note / Explanation": "অনুপাতের মৌলিক নিয়মাবলি অনুসারে তিনটি উক্তিই সঠিক।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সসীম ধারা",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$5 + 8 + 11 + 14 + \\dots$ সমান্তর ধারাটির কোন পদ $302$?",
            "Option A": "98-তম", "Option B": "99-তম", "Option C": "100-তম", "Option D": "101-তম",
            "Correct Option": "C", "Correct Answer": "100-তম",
            "Teacher Note / Explanation": "$a = 5, d = 3$। $5 + (n-1)3 = 302 \\implies 3n + 2 = 302 \\implies n = 100$।"
        },

        # --- খ-বিভাগ: জ্যামিতি (৬টি) ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "রেখা ও কোণ",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি সমকোণী ত্রিভুজের সূক্ষ্মকোণদ্বয়ের অনুপাত $2 : 3$ হলে, ক্ষুদ্রতম কোণটির মান কত?",
            "Option A": "$18^\\circ$", "Option B": "$36^\\circ$", "Option C": "$54^\\circ$", "Option D": "$72^\\circ$",
            "Correct Option": "B", "Correct Answer": "$36^\\circ$",
            "Teacher Note / Explanation": "সূক্ষ্মকোণদ্বয়ের সমষ্টি $90^\\circ$। $2x + 3x = 90^\\circ \\implies 5x = 90^\\circ \\implies x = 18^\\circ$। ক্ষুদ্রতম কোণ $= 2 \\times 18^\\circ = 36^\\circ$।"
        },
        {
            # বহুপদী সমাপ্তিসূচক ৩
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বৃত্তের উপপাদ্য",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "বৃত্তের ক্ষেত্রে—\ni. অর্ধবৃত্তস্থ কোণ এক সমকোণ\nii. একই চাপের উপর দণ্ডায়মান কেন্দ্রস্থ কোণ বৃত্তস্থ কোণের দ্বিগুণ\niii. বৃত্তের সকল সমান জ্যা কেন্দ্র থেকে সমদূরবর্তী\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Teacher Note / Explanation": "পাঠ্যবইয়ের উপপাদ্য ২০, ২১ ও ২৩ অনুসারে তিনটি উক্তিই যথার্থ।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "ব্যবহারিক জ্যামিতি",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি নির্দিষ্ট চতুর্ভুজ অঙ্কন করার জন্য অনন্যভাবে কতটি স্বতন্ত্র উপাত্ত প্রয়োজন?",
            "Option A": "3 টি", "Option B": "4 টি", "Option C": "5 টি", "Option D": "6 টি",
            "Correct Option": "C", "Correct Answer": "5 টি",
            "Teacher Note / Explanation": "যেকোনো নির্দিষ্ট চতুর্ভুজ অঙ্কন করার জন্য ৫টি স্বতন্ত্র উপাত্ত প্রয়োজন।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "বৃত্তের স্পর্শক",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "##GEO:circle-tangent[O=O,P=P,T=T,r=6,t=8][size:small]##\nচিত্রে $O$ কেন্দ্রবিশিষ্ট বৃত্তের ব্যাসার্ধ $OT = 6\\text{ cm}$ এবং স্পর্শক $PT = 8\\text{ cm}$ হলে, কেন্দ্র থেকে বহিঃস্থ বিন্দু $P$ এর দূরত্ব $OP$ কত সে.মি.?",
            "Option A": "9 cm", "Option B": "10 cm", "Option C": "12 cm", "Option D": "14 cm",
            "Correct Option": "B", "Correct Answer": "10 cm",
            "Teacher Note / Explanation": "স্পর্শবিন্দুগামী ব্যাসার্ধ স্পর্শকের উপর লম্ব ($OT \\perp PT$)। সমকোণী $\\triangle OTP$ এ পিথাগোরাসের সূত্র মতে: $OP = \\sqrt{OT^2 + PT^2} = \\sqrt{6^2 + 8^2} = 10\\text{ cm}$।"
        },
        {
            # বহুপদী সমাপ্তিসূচক ৪
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "ক্ষেত্রফল ও পিথাগোরাস",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "কোনো ত্রিভুজের বাহুত্রয়ের দৈর্ঘ্য $a, b, c$ যেখানে $c$ বৃহত্তম বাহু।\ni. $a^2 + b^2 = c^2$ হলে ত্রিভুজটি সমকোণী\nii. $a^2 + b^2 > c^2$ হলে ত্রিভুজটি সূক্ষ্মকোণী\niii. $a^2 + b^2 < c^2$ হলে ত্রিভুজটি স্থূলকোণী\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Teacher Note / Explanation": "পিথাগোরাসের উপপাদ্যের বিস্তার অনুযায়ী তিনটি সম্পর্কই সত্য।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "অনুপাত ও সদৃশতা",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "দুটি সদৃশ ত্রিভুজের অনুরূপ বাহুদ্বয়ের অনুপাত $3 : 4$ হলে, তাদের ক্ষেত্রফলের অনুপাত কত?",
            "Option A": "$3 : 4$", "Option B": "$\\sqrt{3} : 2$", "Option C": "$9 : 16$", "Option D": "$27 : 64$",
            "Correct Option": "C", "Correct Answer": "$9 : 16$",
            "Teacher Note / Explanation": "সদৃশ ত্রিভুজদ্বয়ের ক্ষেত্রফলের অনুপাত অনুরূপ বাহুগুলোর বর্গের অনুপাতের সমান ($3^2 : 4^2 = 9 : 16$)।"
        },

        # --- গ-বিভাগ: ত্রিকোণমিতি ও পরিমিতি (৭টি) ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিকোণমিতিক অনুপাত",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$\\tan \\theta = \\frac{3}{4}$ এবং $\\theta$ সূক্ষ্মকোণ হলে, $\\cos \\theta$ এর মান কত?",
            "Option A": "$\\frac{3}{5}$", "Option B": "$\\frac{4}{5}$", "Option C": "$\\frac{5}{4}$", "Option D": "$\\frac{4}{3}$",
            "Correct Option": "B", "Correct Answer": "$\\frac{4}{5}$",
            "Teacher Note / Explanation": "অতিভুজ $= \\sqrt{3^2 + 4^2} = 5$। অতএব $\\cos \\theta = \\frac{\\text{ভূমি}}{\\text{অতিভুজ}} = \\frac{4}{5}$।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিকোণমিতিক অভেদাবলি",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "$\\sec \\theta + \\tan \\theta = \\frac{5}{2}$ হলে, $\\sec \\theta - \\tan \\theta$ এর মান কত?",
            "Option A": "$\\frac{5}{2}$", "Option B": "$\\frac{2}{5}$", "Option C": "$-\\frac{2}{5}$", "Option D": "$1$",
            "Correct Option": "B", "Correct Answer": "$\\frac{2}{5}$",
            "Teacher Note / Explanation": "$\\sec^2 \\theta - \\tan^2 \\theta = 1 \\implies \\sec \\theta - \\tan \\theta = \\frac{1}{\\sec \\theta + \\tan \\theta} = \\frac{2}{5}$।"
        },
        {
            # বহুপদী সমাপ্তিসূচক ৫
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "দূরত্ব ও উচ্চতা",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "দূরত্ব ও উচ্চতার ক্ষেত্রে—\ni. ভূ-রেখার সমান্তরাল রেখার উপরে কোনো বিন্দু ভূ-রেখার সাথে যে কোণ উৎপন্ন করে তাকে উন্নতি কোণ বলে\nii. ভূ-রেখার নিচে কোনো বিন্দু ভূ-রেখার সাথে যে কোণ উৎপন্ন করে তাকে অবনতি কোণ বলে\niii. $30^\\circ$ কোণ অঙ্কনের ক্ষেত্রে ভূমি < লম্ব হয়\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "A", "Correct Answer": "i ও ii",
            "Teacher Note / Explanation": "$30^\\circ$ কোণ অঙ্কনে ভূমি > লম্ব হয়। সুতরাং iii ভুল, i ও ii সঠিক।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "দূরত্ব ও উন্নতি কোণ",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "একটি খুঁটির দৈর্ঘ্য ও তার ছায়ার দৈর্ঘ্যের অনুপাত $1 : \\sqrt{3}$ হলে, সূর্যের উন্নতি কোণ কত?",
            "Option A": "$30^\\circ$", "Option B": "$45^\\circ$", "Option C": "$60^\\circ$", "Option D": "$90^\\circ$",
            "Correct Option": "A", "Correct Answer": "$30^\\circ$",
            "Teacher Note / Explanation": "$\\tan \\theta = \\frac{1}{\\sqrt{3}} = \\tan 30^\\circ \\implies \\theta = 30^\\circ$।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পরিমিতি (ক্ষেত্রফল)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি সমবাহু ত্রিভুজের বাহুর দৈর্ঘ্য $4\\text{ cm}$ হলে, এর ক্ষেত্রফল কত বর্গ সে.মি.?",
            "Option A": "$4\\sqrt{3}$", "Option B": "$8\\sqrt{3}$", "Option C": "$12$", "Option D": "$16\\sqrt{3}$",
            "Correct Option": "A", "Correct Answer": "$4\\sqrt{3}$",
            "Teacher Note / Explanation": "ক্ষেত্রফল $= \\frac{\\sqrt{3}}{4} a^2 = \\frac{\\sqrt{3}}{4} \\times 4^2 = 4\\sqrt{3}\\text{ cm}^2$।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পরিমিতি (বৃত্ত)",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "একটি চাকার ব্যাসার্ধ $14\\text{ cm}$ হলে, একবার পূর্ণ আবর্তনে চাকাটি কত দূরত্ব অতিক্রম করবে? ($\\pi \\approx \\frac{22}{7}$)",
            "Option A": "44 cm", "Option B": "88 cm", "Option C": "154 cm", "Option D": "616 cm",
            "Correct Option": "B", "Correct Answer": "88 cm",
            "Teacher Note / Explanation": "একবার আবর্তনে অতিক্রান্ত দূরত্ব পরিধির সমান $= 2\\pi r = 2 \\times \\frac{22}{7} \\times 14 = 88\\text{ cm}$।"
        },
        {
            # বহুপদী সমাপ্তিসূচক ৬
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পরিমিতি (ঘনবস্তু)",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "একটি সমবৃত্তভূমিক বেলনের ভূমির ব্যাসার্ধ $r$ এবং উচ্চতা $h$ হলে—\ni. ভূমির ক্ষেত্রফল $= \\pi r^2$\nii. বক্রপৃষ্ঠের ক্ষেত্রফল $= 2\\pi rh$\niii. সমগ্রতলের ক্ষেত্রফল $= 2\\pi r(r + h)$\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Teacher Note / Explanation": "পাঠ্যবইয়ের ১৬.৪ অনুশীলনী অনুযায়ী বেলনের তিনটি সূত্রই সঠিক।"
        },

        # --- ঘ-বিভাগ: পরিসংখ্যান (৪টি) ---
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "কেন্দ্রীয় প্রবণতা",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "$8, 12, 10, 15, 7, 14, 11$ উপাত্তগুলোর মধ্যক কত?",
            "Option A": "10", "Option B": "11", "Option C": "12", "Option D": "14",
            "Correct Option": "B", "Correct Answer": "11",
            "Teacher Note / Explanation": "উপাত্তগুলোকে ক্রমানুসারে সাজালে: $7, 8, 10, 11, 12, 14, 15$। চতুর্থ পদ হলো ১১।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "প্রচুরক",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "প্রচুরক নির্ণয়ের সূত্র $L + \\left(\\frac{f_1}{f_1 + f_2}\\right) \\times h$ এ $f_1$ দ্বারা কী বোঝায়?",
            "Option A": "প্রচুরক শ্রেণির গণসংখ্যা",
            "Option B": "প্রচুরক শ্রেণির গণসংখ্যা ও তার পূর্ববর্তী শ্রেণির গণসংখ্যার পার্থক্য",
            "Option C": "প্রচুরক শ্রেণির গণসংখ্যা ও তার পরবর্তী শ্রেণির গণসংখ্যার পার্থক্য",
            "Option D": "পূর্ববর্তী শ্রেণির যোজিত গণসংখ্যা",
            "Correct Option": "B", "Correct Answer": "প্রচুরক শ্রেণির গণসংখ্যা ও তার পূর্ববর্তী শ্রেণির গণসংখ্যার পার্থক্য",
            "Teacher Note / Explanation": "সংজ্ঞানুসারে $f_1 = f_m - f_{m-1}$ অর্থাৎ প্রচুরক শ্রেণির গণসংখ্যা ও পূর্ববর্তী শ্রেণির গণসংখ্যার বিয়োগফল।"
        },
        {
            # বহুপদী সমাপ্তিসূচক ৭
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "পরিসংখ্যান ও লেখচিত্র",
            "Difficulty": "HARD", "Marks": 1,
            "Question Text": "পরিসংখ্যানের ক্ষেত্রে—\ni. কেন্দ্রীয় প্রবণতার পরিমাপ ৩টি (গড়, মধ্যক, প্রচুরক)\nii. অজিভ রেখা অঙ্কনে $Y$-অক্ষে যোজিত গণসংখ্যা বসানো হয়\niii. আয়তলেখ অঙ্কনে অবিচ্ছিন্ন শ্রেণিসীমা ব্যবহৃত হয়\n\nনিচের কোনটি সঠিক?",
            "Option A": "i ও ii", "Option B": "i ও iii", "Option C": "ii ও iii", "Option D": "i, ii ও iii",
            "Correct Option": "D", "Correct Answer": "i, ii ও iii",
            "Teacher Note / Explanation": "পরিসংখ্যানের তাত্ত্বিক সংজ্ঞানুযায়ী তিনটি উক্তিই সত্য।"
        },
        {
            "Type": "MCQ", "Class Name": class_name, "Subject": subject, "Topic": "সংক্ষিপ্ত পদ্ধতির গড়",
            "Difficulty": "MEDIUM", "Marks": 1,
            "Question Text": "সংক্ষিপ্ত পদ্ধতিতে গড় নির্ণয়ের সূত্রে বিচ্যুতির মান $u_i$ এর সূত্র কোনটি?",
            "Option A": "$u_i = \\frac{x_i - a}{h}$", "Option B": "$u_i = \\frac{x_i + a}{h}$", "Option C": "$u_i = (x_i - a)h$", "Option D": "$u_i = \\frac{a - x_i}{h}$",
            "Correct Option": "A", "Correct Answer": "$u_i = \\frac{x_i - a}{h}$",
            "Teacher Note / Explanation": "যেখানে $x_i$ মধ্যমান, $a$ আনুমানিক গড় এবং $h$ শ্রেণিব্যাপ্তি।"
        }
    ]

    for m in mcqs:
        add_row(m)

    # =========================================================================
    # PART 2: 2 SMCQs (অভিন্ন তথ্যভিত্তিক বহুনির্বাচনী প্রশ্ন) - 3 MCQs each
    # Use HTML tables for tabular statistics
    # =========================================================================

    smcqs = [
        {
            "Type": "SMCQ", "Class Name": class_name, "Subject": subject, "Topic": "জ্যামিতি ও বৃত্ত",
            "Difficulty": "HARD", "Marks": 3,
            "Question Text": "নিচের চিত্র ও তথ্যের আলোকে ২৫, ২৬ ও ২৭ নং প্রশ্নের উত্তর দাও:\n##GEO:right-triangle[A=A,B=B,C=C,a=3,b=4,hyp=5,unit=cm,style=handdrawn][size:small]##\nচিত্রে $\\triangle ABC$ এ $\\angle B = 90^\\circ$, $AB = 4\\text{ cm}$ এবং $BC = 3\\text{ cm}$।",
            "Teacher Note / Explanation": "সমকোণী ত্রিভুজের পিথাগোরাস ও ত্রিকোণমিতিক অনুপাতের সমন্বিত প্রশ্ন।",
            # Sub 1
            "Sub 1 Text": "অতিভুজ $AC$ এর দৈর্ঘ্য কত সে.মি.?",
            "Sub 1 Marks": 1,
            "Sub 1 Option A": "4.5 cm", "Sub 1 Option B": "5 cm", "Sub 1 Option C": "6 cm", "Sub 1 Option D": "7 cm",
            "Sub 1 Correct Option": "B", "Sub 1 Model Answer": "5 cm",
            "Sub 1 Explanation": "$AC = \\sqrt{4^2 + 3^2} = 5\\text{ cm}$।",
            # Sub 2
            "Sub 2 Text": "$\\sin C$ এর মান নিচের কোনটি?",
            "Sub 2 Marks": 1,
            "Sub 2 Option A": "$\\frac{3}{5}$", "Sub 2 Option B": "$\\frac{4}{5}$", "Sub 2 Option C": "$\\frac{3}{4}$", "Sub 2 Option D": "$\\frac{4}{3}$",
            "Sub 2 Correct Option": "B", "Sub 2 Model Answer": "$\\frac{4}{5}$",
            "Sub 2 Explanation": "$\\sin C = \\frac{AB}{AC} = \\frac{4}{5}$।",
            # Sub 3
            "Sub 3 Text": "$\\triangle ABC$ এর ক্ষেত্রফল কত বর্গ সে.মি.?",
            "Sub 3 Marks": 1,
            "Sub 3 Option A": "$6\\text{ cm}^2$", "Sub 3 Option B": "$10\\text{ cm}^2$", "Sub 3 Option C": "$12\\text{ cm}^2$", "Sub 3 Option D": "$20\\text{ cm}^2$",
            "Sub 3 Correct Option": "A", "Sub 3 Model Answer": "$6\\text{ cm}^2$",
            "Sub 3 Explanation": "ক্ষেত্রফল $= \\frac{1}{2} \\times 3 \\times 4 = 6\\text{ cm}^2$।"
        },
        {
            "Type": "SMCQ", "Class Name": class_name, "Subject": subject, "Topic": "পরিসংখ্যান সারণি",
            "Difficulty": "MEDIUM", "Marks": 3,
            "Question Text": "নিচের সারণির আলোকে ২৮, ২৯ ও ৩০ নং প্রশ্নের উত্তর দাও:\n<table border=\"1\" style=\"border-collapse: collapse; text-align: center; width: 100%;\">\n  <thead>\n    <tr style=\"background-color: #f1f5f9;\">\n      <th style=\"padding: 5px;\">শ্রেণিব্যাপ্তি</th>\n      <th style=\"padding: 5px;\">৩০–৩৯</th>\n      <th style=\"padding: 5px;\">৪০–৪৯</th>\n      <th style=\"padding: 5px;\">৫০–৫৯</th>\n      <th style=\"padding: 5px;\">৬০–৬৯</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style=\"padding: 5px; font-weight: bold;\">গণসংখ্যা</td>\n      <td style=\"padding: 5px;\">৫</td>\n      <td style=\"padding: 5px;\">১০</td>\n      <td style=\"padding: 5px;\">১৫</td>\n      <td style=\"padding: 5px;\">১০</td>\n    </tr>\n  </tbody>\n</table>",
            "Teacher Note / Explanation": "গণসংখ্যা সারণি ভিত্তিক কেন্দ্রীয় প্রবণতা নির্ণয়।",
            # Sub 1
            "Sub 1 Text": "প্রচুরক শ্রেণি কোনটি?",
            "Sub 1 Marks": 1,
            "Sub 1 Option A": "৩০–৩৯", "Sub 1 Option B": "৪০–৪৯", "Sub 1 Option C": "৫০–৫৯", "Sub 1 Option D": "৬০–৬৯",
            "Sub 1 Correct Option": "C", "Sub 1 Model Answer": "৫০–৫৯",
            "Sub 1 Explanation": "সর্বোচ্চ গণসংখ্যা ১৫ অবস্থিত ৫০–৫৯ শ্রেণিতে।",
            # Sub 2
            "Sub 2 Text": "মোট গণসংখ্যা $N$ হলে, মধ্যক শ্রেণির অবস্থান কোন শ্রেণিতে?",
            "Sub 2 Marks": 1,
            "Sub 2 Option A": "৩০–৩৯", "Sub 2 Option B": "৪০–৪৯", "Sub 2 Option C": "৫০–৫৯", "Sub 2 Option D": "৬০–৬৯",
            "Sub 2 Correct Option": "C", "Sub 2 Model Answer": "৫০–৫৯",
            "Sub 2 Explanation": "$N = 40 \\implies N/2 = 20$। ক্রমযোজিত গণসংখ্যা: ৫, ১৫, ৩০, ৪০। ২০-তম মান ৫০–৫৯ শ্রেণিতে বিদ্যমান।",
            # Sub 3
            "Sub 3 Text": "মধ্যক শ্রেণির নিম্নসীমা কত?",
            "Sub 3 Marks": 1,
            "Sub 3 Option A": "৩০", "Sub 3 Option B": "৪০", "Sub 3 Option C": "৫০", "Sub 3 Option D": "৬০",
            "Sub 3 Correct Option": "C", "Sub 3 Model Answer": "৫০",
            "Sub 3 Explanation": "মধ্যক শ্রেণি ৫০–৫৯ এর নিম্নসীমা $L = ৫০$।"
        }
    ]

    for s in smcqs:
        add_row(s)

    # =========================================================================
    # PART 3: 15 Short Questions (SQ) - 2 Marks Each
    # Direct prompts without redundant prefixes
    # =========================================================================

    sqs = [
        # --- ক-বিভাগ: বীজগণিত (৪টি) ---
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "বাস্তব সংখ্যা",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$0.3\\dot{2}$ কে সাধারণ ভগ্নাংশে প্রকাশ কর।",
            "Model Answer": "$0.3\\dot{2} = \\frac{32 - 3}{90} = \\frac{29}{90}$।",
            "Teacher Note / Explanation": "পৌনঃপুনিক দশমিককে সাধারণ ভগ্নাংশে রূপান্তর: $\\frac{32-3}{90} = \\frac{29}{90}$।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "বীজগাণিতিক রাশি",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$a + b = \\sqrt{7}$ এবং $a - b = \\sqrt{5}$ হলে, $4ab$ এর মান নির্ণয় কর।",
            "Model Answer": "$4ab = (a+b)^2 - (a-b)^2 = (\\sqrt{7})^2 - (\\sqrt{5})^2 = 7 - 5 = 2$।",
            "Teacher Note / Explanation": "আমরা জানি $4ab = (a+b)^2 - (a-b)^2 = 7 - 5 = 2$।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "লগারিদম",
            "Difficulty": "HARD", "Marks": 2,
            "Question Text": "$\\log_x 324 = 4$ হলে, ভিত্তি $x$ এর মান কত?",
            "Model Answer": "$x^4 = 324 = (3\\sqrt{2})^4 \\implies x = 3\\sqrt{2}$।",
            "Teacher Note / Explanation": "$324 = 81 \\times 4 = 3^4 \\times (\\sqrt{2})^4 = (3\\sqrt{2})^4$। অতএব $x = 3\\sqrt{2}$।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "গুণোত্তর ধারা",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "$2 - 4 + 8 - 16 + \\dots$ ধারাটির অষ্টম পদ নির্ণয় কর।",
            "Model Answer": "প্রথম পদ $a = 2$, সাধারণ অনুপাত $q = \\frac{-4}{2} = -2$। অষ্টম পদ $= aq^{8-1} = 2 \\times (-2)^7 = 2 \\times (-128) = -256$।",
            "Teacher Note / Explanation": "$n$-তম পদের সূত্র $a q^{n-1}$ এ মান বসিয়ে পাই $-256$।"
        },

        # --- খ-বিভাগ: জ্যামিতি (৪টি) ---
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "বৃত্ত ও জ্যা",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "##GEO:circle-chord[r=5,d=4,unit=cm][size:small]##\n$10\\text{ cm}$ ব্যাসবিশিষ্ট বৃত্তের কেন্দ্র থেকে একটি জ্যা-এর লম্ব দূরত্ব $4\\text{ cm}$ হলে, জ্যা-টির দৈর্ঘ্য কত?",
            "Model Answer": "ব্যাসার্ধ $r = \\frac{10}{2} = 5\\text{ cm}$। অর্ধ-জ্যা $= \\sqrt{5^2 - 4^2} = \\sqrt{25 - 16} = 3\\text{ cm}$। সুতরাং সম্পূর্ণ জ্যা-এর দৈর্ঘ্য $= 2 \\times 3 = 6\\text{ cm}$।",
            "Teacher Note / Explanation": "কেন্দ্র থেকে জ্যা-এর উপর অঙ্কিত লম্ব জ্যা-টিকে সমদ্বিখণ্ডিত করে।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিভুজ ও মধ্যমা",
            "Difficulty": "HARD", "Marks": 2,
            "Question Text": "কোনো ত্রিভুজের বাহুগুলোর দৈর্ঘ্য $5\\text{ cm}, 12\\text{ cm}$ ও $13\\text{ cm}$ হলে, বৃহত্তম বাহুর বিপরীত শীর্ষ থেকে অঙ্কিত মধ্যমার দৈর্ঘ্য কত?",
            "Model Answer": "যেহেতু $5^2 + 12^2 = 25 + 144 = 169 = 13^2$, তাই ত্রিভুজটি সমকোণী এবং বৃহত্তম বাহু $13\\text{ cm}$ অতিভুজ। সমকোণী ত্রিভুজের অতিভুজের উপর মধ্যমা অতিভুজের অর্ধেক $= \\frac{13}{2} = 6.5\\text{ cm}$।",
            "Teacher Note / Explanation": "সমকোণী ত্রিভুজের অতিভুজের মধ্যবিন্দু তার পরিকেন্দ্র, তাই মধ্যমা $= \\frac{\\text{অতিভুজ}}{2}$।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "বৃত্তস্থ চতুর্ভুজ",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "একটি বৃত্তস্থ চতুর্ভুজ $ABCD$ এ $\\angle A = 75^\\circ$ হলে, এর বিপরীত কোণ $\\angle C$ এর মান কত ডিগ্রি?",
            "Model Answer": "বৃত্তস্থ চতুর্ভুজের বিপরীত কোণদ্বয়ের সমষ্টি $180^\\circ$। অতএব $\\angle C = 180^\\circ - 75^\\circ = 105^\\circ$।",
            "Teacher Note / Explanation": "বৃত্তস্থ চতুর্ভুজের যেকোনো বিপরীত কোণদ্বয় পরস্পর সম্পূরক।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "সামান্তরিকের ক্ষেত্রফল",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "##GEO:parallelogram[b=10,h=6,unit=cm][size:small]##\nএকটি সামান্তরিকের ভূমি $10\\text{ cm}$ এবং উচ্চতা $6\\text{ cm}$ হলে, এর ক্ষেত্রফল কত বর্গ সে.মি.?",
            "Model Answer": "সামান্তরিকের ক্ষেত্রফল $= \\text{ভূমি} \\times \\text{উচ্চতা} = 10 \\times 6 = 60\\text{ cm}^2$।",
            "Teacher Note / Explanation": "ক্ষেত্রফল $= b \\times h = 60\\text{ cm}^2$।"
        },

        # --- গ-বিভাগ: ত্রিকোণমিতি ও পরিমিতি (৪টি) ---
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিকোণমিতিক মান",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "মান নির্ণয় কর: $\\frac{1 - \\tan^2 30^\\circ}{1 + \\tan^2 30^\\circ}$।",
            "Model Answer": "$\\tan 30^\\circ = \\frac{1}{\\sqrt{3}}$। অতএব $\\frac{1 - \\frac{1}{3}}{1 + \\frac{1}{3}} = \\frac{2/3}{4/3} = \\frac{2}{4} = \\frac{1}{2}$।",
            "Teacher Note / Explanation": "মান বসিয়ে সরলীকরণ করা হয়েছে।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিকোণমিতিক সমীকরণ",
            "Difficulty": "HARD", "Marks": 2,
            "Question Text": "$\\cos (A - B) = 1$ এবং $2\\sin (A + B) = \\sqrt{3}$ হলে, সূক্ষ্মকোণ $A$ ও $B$ এর মান নির্ণয় কর।",
            "Model Answer": "$\\cos(A-B) = \\cos 0^\\circ \\implies A - B = 0^\\circ$ বা $A = B$। আবার $\\sin(A+B) = \\frac{\\sqrt{3}}{2} = \\sin 60^\\circ \\implies A + B = 60^\\circ$। সুতরাং $2A = 60^\\circ \\implies A = 30^\\circ$ এবং $B = 30^\\circ$।",
            "Teacher Note / Explanation": "উভয় সমীকরণ সমাধান করে $A = 30^\\circ, B = 30^\\circ$।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "রম্বসের ক্ষেত্রফল",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "একটি রম্বসের কর্ণদ্বয়ের দৈর্ঘ্য যথাক্রমে $12\\text{ cm}$ এবং $16\\text{ cm}$ হলে, এর ক্ষেত্রফল কত?",
            "Model Answer": "রম্বসের ক্ষেত্রফল $= \\frac{1}{2} \\times d_1 \\times d_2 = \\frac{1}{2} \\times 12 \\times 16 = 96\\text{ cm}^2$।",
            "Teacher Note / Explanation": "রম্বসের ক্ষেত্রফল কর্ণদ্বয়ের গুণফলের অর্ধেক।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "ঘনকের সমগ্রতল ও কর্ণ",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "##GEO:cube[s=5,unit=cm][size:small]##\nএকটি ঘনকের এক ধারের দৈর্ঘ্য $5\\text{ cm}$ হলে, এর সমগ্রতলের ক্ষেত্রফল ও কর্ণের দৈর্ঘ্য কত?",
            "Model Answer": "সমগ্রতলের ক্ষেত্রফল $= 6a^2 = 6 \\times 5^2 = 150\\text{ cm}^2$। কর্ণের দৈর্ঘ্য $= \\sqrt{3}a = 5\\sqrt{3}\\text{ cm} \\approx 8.66\\text{ cm}$।",
            "Teacher Note / Explanation": "ঘনকের সমগ্রতলের ক্ষেত্রফল $6a^2$ এবং কর্ণ $\\sqrt{3}a$।"
        },

        # --- ঘ-বিভাগ: পরিসংখ্যান (৩টি) ---
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "পরিসর ও শ্রেণিসংখ্যা",
            "Difficulty": "EASY", "Marks": 2,
            "Question Text": "কোনো উপাত্তের সর্বোচ্চ সংখ্যা ৮৫ এবং সর্বনিম্ন সংখ্যা ৩৫ হলে, শ্রেণিব্যাপ্তি ৫ ধরে শ্রেণিসংখ্যা কত হবে?",
            "Model Answer": "পরিসর $= (\\text{সর্বোচ্চ} - \\text{সর্বনিম্ন}) + ১ = (৮৫ - ৩৫) + ১ = ৫১$। শ্রেণিসংখ্যা $= \\frac{৫১}{৫} = ১০.২ \\approx ১১$ টি।",
            "Teacher Note / Explanation": "শ্রেণিসংখ্যা সর্বদাই পরবর্তী পূর্ণসংখ্যায় গ্রহণ করতে হয়।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "মধ্যক সূত্র",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "মোট গণসংখ্যা $N = 60$ হলে মধ্যক শ্রেণির অবস্থান নির্ণয়ের শর্ত এবং মধ্যক নির্ণয়ের সূত্রটি লিখ।",
            "Model Answer": "$\\frac{N}{2} = 30$। যে শ্রেণিতে ৩০-তম ক্রমযোজিত গণসংখ্যা থাকে সেটি মধ্যক শ্রেণি। সূত্র: $\\text{মধ্যক} = L + \\left(\\frac{N/2 - F_c}{f_m}\\right) \\times h$।",
            "Teacher Note / Explanation": "যেখানে $L$ নিম্নসীমা, $F_c$ পূর্ববর্তী শ্রেণির যোজিত গণসংখ্যা, $f_m$ মধ্যক শ্রেণির গণসংখ্যা এবং $h$ শ্রেণিব্যাপ্তি।"
        },
        {
            "Type": "SQ", "Class Name": class_name, "Subject": subject, "Topic": "অবিচ্ছিন্ন শ্রেণিসীমা",
            "Difficulty": "MEDIUM", "Marks": 2,
            "Question Text": "বিচ্ছিন্ন শ্রেণিব্যাপ্তি $21 - 30, 31 - 40$ এর অবিচ্ছিন্ন শ্রেণিসীমা কীভাবে তৈরি করা হয় তা লিখ।",
            "Model Answer": "প্রতিটি শ্রেণির নিম্নসীমা থেকে $0.5$ বিয়োগ এবং উচ্চসীমার সাথে $0.5$ যোগ করে অবিচ্ছিন্ন শ্রেণিসীমা তৈরি করা হয়। যথা: $20.5 - 30.5$ এবং $30.5 - 40.5$।",
            "Teacher Note / Explanation": "আয়তলেখ অঙ্কনের জন্য অবিচ্ছিন্ন শ্রেণিসীমা অপরিহার্য।"
        }
    ]

    for sq in sqs:
        add_row(sq)

    # =========================================================================
    # PART 4: 8 Creative Questions (CQ) - 10 Marks Each
    # 2 Questions per section. Fully aligned to Board standard:
    # - Algebra: Chapter 11 & 3, Chapter 4 & 13 (authentic board problems)
    # - Geometry: 1 Construction (সম্পাদ্য - Ch 7), 1 Theorem (উপপাদ্য - Ch 8)
    # - Trig & Mensuration: Ch 9 & 10 (broken tree), Ch 16 (garden & cylinder)
    # - Statistics: HTML tables for frequency distributions
    # No redundant labels in Sub X Text.
    # =========================================================================

    cqs = [
        # --- ক-বিভাগ: বীজগণিত (প্রশ্ন ১) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "বীজগাণিতিক রাশি ও সমানুপাত",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "$x = \\frac{\\sqrt{2a+3b} + \\sqrt{2a-3b}}{\\sqrt{2a+3b} - \\sqrt{2a-3b}}$ এবং $p^2 - 2\\sqrt{6}p + 1 = 0$ দুটি বীজগাণিতিক সম্পর্ক।",
            "Teacher Note / Explanation": "১১শ অধ্যায় (অনুপাত ও সমানুপাত) এবং ৩য় অধ্যায়ের সমন্বয়ে বোর্ড স্ট্যান্ডার্ড প্রশ্ন।",
            # ক
            "Sub 1 Text": "$x^4 + x^2 + 1$ কে উৎপাদকে বিশ্লেষণ কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "$x^4 + x^2 + 1 = (x^2 + 1)^2 - x^2 = (x^2 + x + 1)(x^2 - x + 1)$।",
            "Sub 1 Explanation": "বর্গের অন্তর সূত্রে প্রকাশ করে উৎপাদকে বিশ্লেষণ।",
            # খ
            "Sub 2 Text": "প্রথম সম্পর্কটি হতে প্রমাণ কর যে, $3bx^2 - 4ax + 3b = 0$।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "যোজন-বিয়োজন করে পাই,\n$\\frac{x+1}{x-1} = \\frac{2\\sqrt{2a+3b}}{2\\sqrt{2a-3b}} = \\frac{\\sqrt{2a+3b}}{\\sqrt{2a-3b}}$\nউভয়পক্ষকে বর্গ করে পাই,\n$\\frac{(x+1)^2}{(x-1)^2} = \\frac{2a+3b}{2a-3b} \\implies \\frac{x^2+2x+1}{x^2-2x+1} = \\frac{2a+3b}{2a-3b}$\nপুনরায় যোজন-বিয়োজন করে পাই,\n$\\frac{2(x^2+1)}{4x} = \\frac{4a}{6b} \\implies \\frac{x^2+1}{2x} = \\frac{2a}{3b}$\n$\\implies 3b(x^2+1) = 4ax \\implies 3bx^2 - 4ax + 3b = 0$ (প্রমাণিত)।",
            "Sub 2 Explanation": "ধারাবাহিক যোজন-বিয়োজন ও বর্গের মাধ্যমে সমীকরণ প্রতিপাদন।",
            # গ
            "Sub 3 Text": "দ্বিতীয় সম্পর্কটি হতে $p^3 + \\frac{1}{p^3}$ এর মান নির্ণয় কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "$p^2 - 2\\sqrt{6}p + 1 = 0 \\implies p^2 + 1 = 2\\sqrt{6}p$\nউভয়পক্ষকে $p$ দ্বারা ভাগ করে পাই, $p + \\frac{1}{p} = 2\\sqrt{6}$।\nএখন, $p^3 + \\frac{1}{p^3} = (p + \\frac{1}{p})^3 - 3(p + \\frac{1}{p})$\n$= (2\\sqrt{6})^3 - 3(2\\sqrt{6}) = 48\\sqrt{6} - 6\\sqrt{6} = 42\\sqrt{6}$।",
            "Sub 3 Explanation": "ঘনের সূত্রে মান বসিয়ে ফলাফল নির্ণয়।"
        },

        # --- ক-বিভাগ: বীজগণিত (প্রশ্ন ২) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "সূচক, লগারিদম ও সসীম ধারা",
            "Difficulty": "MEDIUM", "Marks": 10,
            "Question Text": "$P = \\left(\\frac{x^p}{x^q}\\right)^{p+q}$, $Q = \\left(\\frac{x^q}{x^r}\\right)^{q+r}$, $R = \\left(\\frac{x^r}{x^p}\\right)^{r+p}$ এবং একটি সমান্তর ধারার ১২-তম পদ ৭৭।",
            "Teacher Note / Explanation": "৪র্থ অধ্যায় (সূচক-লগ) এবং ১৩শ অধ্যায়ের (সসীম ধারা) জনপ্রিয় বোর্ড প্রশ্ন।",
            # ক
            "Sub 1 Text": "$\\log_{\\sqrt{3}} 81$ এর মান নির্ণয় কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "$\\log_{\\sqrt{3}} 81 = \\log_{\\sqrt{3}} 3^4 = \\log_{\\sqrt{3}} (\\sqrt{3})^8 = 8\\log_{\\sqrt{3}} \\sqrt{3} = 8 \\times 1 = 8$।",
            "Sub 1 Explanation": "ভিত্তি ও আর্গুমেন্ট সমান করে লগের মান নির্ণয়।",
            # খ
            "Sub 2 Text": "প্রমাণ কর যে, $P \\cdot Q \\cdot R = 1$।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "$P = (x^{p-q})^{p+q} = x^{p^2 - q^2}$\n$Q = (x^{q-r})^{q+r} = x^{q^2 - r^2}$\n$R = (x^{r-p})^{r+p} = x^{r^2 - p^2}$\nবামপক্ষ $= P \\cdot Q \\cdot R = x^{(p^2 - q^2) + (q^2 - r^2) + (r^2 - p^2)} = x^0 = 1 = $ ডানপক্ষ (প্রমাণিত)।",
            "Sub 2 Explanation": "সূচকের যোগ বিধির মাধ্যমে প্রমাণ।",
            # গ
            "Sub 3 Text": "সমান্তর ধারাটির প্রথম ২৩টি পদের সমষ্টি নির্ণয় কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "ধরি প্রথম পদ $a$ এবং সাধারণ অন্তর $d$।\n১২-তম পদ $a + (12 - 1)d = 77 \\implies a + 11d = 77$।\nপ্রথম ২৩টি পদের সমষ্টি $S_{23} = \\frac{23}{2} [2a + (23 - 1)d] = \\frac{23}{2} [2a + 22d] = \\frac{23}{2} \\times 2(a + 11d) = 23(a + 11d)$।\nমান বসিয়ে পাই, $S_{23} = 23 \\times 77 = 1771$।",
            "Sub 3 Explanation": "সমষ্টির সূত্রে মান বসিয়ে উত্তর ১৭৭১।"
        },

        # --- খ-বিভাগ: জ্যামিতি (প্রশ্ন ৩: সম্পাদ্য / অঙ্কন - অধ্যায় ৭) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "ব্যবহারিক জ্যামিতি (সম্পাদ্য)",
            "Difficulty": "MEDIUM", "Marks": 10,
            "Question Text": "একটি ত্রিভুজের ভূমি $a = 6\\text{ cm}$, ভূমি সংলগ্ন একটি কোণ $\\angle x = 60^\\circ$ এবং অপর দুই বাহুর অন্তর $d = 2\\text{ cm}$।",
            "Teacher Note / Explanation": "৭ম অধ্যায় (ব্যবহারিক জ্যামিতি) থেকে আবশ্যকীয় সম্পাদ্য অঙ্কন ও বিবরণ।",
            # ক
            "Sub 1 Text": "রুলার ও কম্পাসের সাহায্যে (চাঁদা ছাড়া) $\\angle x = 60^\\circ$ কোণটি অঙ্কন কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "যেকোনো রশ্মির প্রান্তবিন্দুকে কেন্দ্র করে যেকোনো ব্যাসার্ধ নিয়ে একটি বৃত্তচাপ আঁকি। একই ব্যাসার্ধ নিয়ে ঐ বৃত্তচাপের ছেদবিন্দু থেকে অপর একটি বৃত্তচাপ আঁকি। ছেদবিন্দু যোগ করলে উৎপন্ন কোণটি $60^\\circ$ হবে।",
            "Sub 1 Explanation": "কম্পাসের সাহায্যে আদর্শ ৬০ ডিগ্রি কোণ অঙ্কন।",
            # খ
            "Sub 2 Text": "বিবরণসহ ত্রিভুজটি অঙ্কন কর। (অঙ্কনের চিহ্ন ও বিবরণ আবশ্যক)",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "অঙ্কন:\n১. যেকোনো রশ্মি $BE$ থেকে ভূমি $BC = a = 6\\text{ cm}$ কেটে নিই।\n২. $B$ বিন্দুতে $\\angle x$ এর সমান করে $\\angle CBF = 60^\\circ$ আঁকি।\n৩. $BF$ রশ্মি থেকে অন্তর $d = 2\\text{ cm}$ এর সমান করে $BD$ কেটে নিই।\n৪. $C, D$ যোগ করি।\n৫. $CD$ রেখাংশের যে পাশে $B$ বিন্দু আছে, সেই পাশে $C$ বিন্দুতে $\\angle BDC$ এর সমান করে $\\angle DCA$ আঁকি। $CA$ রশ্মি $BF$ রশ্মিকে $A$ বিন্দুতে ছেদ করে।\nতাহলে $\\triangle ABC$-ই উদ্দিষ্ট ত্রিভুজ।",
            "Sub 2 Explanation": "সম্পাদ্য ২ এর প্রমাণভিত্তিক যথাযথ অঙ্কন ও বিবরণ।",
            # গ
            "Sub 3 Text": "এমন একটি রম্বস অঙ্কন কর যার একটি কোণ $\\angle x = 60^\\circ$ এবং একটি কর্ণ $a = 6\\text{ cm}$ এর সমান।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "যেহেতু রম্বসের একটি কোণ $60^\\circ$ এবং কর্ণ কোণকে সমদ্বিখণ্ডিত করে, তাই কর্ণের উভয় প্রান্তে কোণ হবে $30^\\circ$।\n১. $BD = a = 6\\text{ cm}$ রেখাংশ নিই।\n২. $BD$ এর উভয় পাশে $B$ ও $D$ বিন্দুতে $30^\\circ$ কোণ আঁকি।\n৩. রশ্মিগুলো পরস্পর $A$ ও $C$ বিন্দুতে ছেদ করে।\nতাহলে $ABCD$-ই উদ্দিষ্ট রম্বস। (অথবা সমবাহু ত্রিভুজদ্বয় সংযুক্ত করে অঙ্কন করা যায়)।",
            "Sub 3 Explanation": "রম্বসের কোণ ও কর্ণের ধর্মের সাহায্যে অঙ্কন।"
        },

        # --- খ-বিভাগ: জ্যামিতি (প্রশ্ন ৪: উপপাদ্য ও প্রমাণ - অধ্যায় ৮) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "বৃত্ত ও স্পর্শক উপপাদ্য",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "##GEO:circle-two-tangents[O=O,P=P,A=A,B=B,r=5][size:medium]##\nচিত্রে $O$ কেন্দ্রবিশিষ্ট বৃত্তের বহিঃস্থ বিন্দু $P$ থেকে বৃত্তে $PA$ ও $PB$ দুটি স্পর্শক টানা হলো যেখানে $A$ ও $B$ দুটি স্পর্শবিন্দু।",
            "Teacher Note / Explanation": "৮ম অধ্যায় (বৃত্ত) থেকে স্পর্শক সম্পর্কিত সর্বাধিক গুরুত্বপূর্ণ বোর্ড উপপাদ্য।",
            # ক
            "Sub 1 Text": "বৃত্তের স্পর্শবিন্দুগামী ব্যাসার্ধ ও স্পর্শকের মধ্যকার কোণ কত ডিগ্রি তা সংক্ষিপ্ত কারণসহ লিখ।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "বৃত্তের যেকোনো বিন্দুতে অঙ্কিত স্পর্শক স্পর্শবিন্দুগামী ব্যাসার্ধের উপর লম্ব। সুতরাং তাদের মধ্যকার কোণ এক সমকোণ বা $90^\\circ$।",
            "Sub 1 Explanation": "উপপাদ্য ২৯ এর সাধারণ প্রতিজ্ঞা।",
            # খ
            "Sub 2 Text": "জ্যামিতিক যুক্তি দ্বারা প্রমাণ কর যে, $PA = PB$।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "প্রমাণ:\n$O, A$; $O, B$ এবং $O, P$ যোগ করি।\nযেহেতু $PA$ ও $PB$ স্পর্শক এবং $OA, OB$ স্পর্শবিন্দুগামী ব্যাসার্ধ, সেহেতু $OA \\perp PA$ এবং $OB \\perp PB$।\nঅতএব $\\triangle PAO$ এবং $\\triangle PBO$ উভয়ই সমকোণী ত্রিভুজ।\nএখন সমকোণী ত্রিভুজদ্বয়ের মধ্যে:\nসাধারণ অতিভুজ $OP = OP$\nএবং ব্যাসার্ধ $OA = OB$ (একই বৃত্তের ব্যাসার্ধ)।\nসুতরাং অতিভুজ-বাহু সর্বসমতা উপপাদ্য অনুসারে, $\\triangle PAO \\cong \\triangle PBO$।\nঅতএব, $PA = PB$ (প্রমাণিত)।",
            "Sub 2 Explanation": "সমকোণী ত্রিভুজের সর্বসমতা প্রমাণের মাধ্যমে বাহুদ্বয়ের সমতা প্রতিষ্ঠা।",
            # গ
            "Sub 3 Text": "প্রমাণ কর যে, $OP$ রেখাংশ স্পর্শ জ্যা $AB$ এর লম্ব দ্বিখণ্ডক।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "ধরি $OP$ ও $AB$ রেখাংশ পরস্পর $M$ বিন্দুতে ছেদ করে।\n(খ) হতে পাই $\\triangle PAO \\cong \\triangle PBO \\implies \\angle APO = \\angle BPO$।\nএখন $\\triangle PAM$ এবং $\\triangle PBM$ এর মধ্যে:\n$PA = PB$, $\\angle APM = \\angle BPM$ এবং $PM$ সাধারণ বাহু।\n$\\therefore \\triangle PAM \\cong \\triangle PBM$।\nফলে $AM = BM$ এবং $\\angle PMA = \\angle PMB$।\nযেহেতু কোণদ্বয় রৈখিক যুগল কোণ এবং সমান, তাই প্রত্যেকের মান $90^\\circ$।\nঅতএব $PM \\perp AB$ তথা $OP \\perp AB$ এবং $AM = BM$।\nসুতরাং $OP$ রেখাংশ স্পর্শ জ্যা $AB$ এর লম্ব দ্বিখণ্ডক (প্রমাণিত)।",
            "Sub 3 Explanation": "রৈখিক যুগল কোণ ও সর্বসমতার সাহায্যে লম্ব দ্বিখণ্ডক প্রমাণ।"
        },

        # --- গ-বিভাগ: ত্রিকোণমিতি ও পরিমিতি (প্রশ্ন ৫: ত্রিকোণমিতি ও দূরত্ব-উচ্চতা) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "ত্রিকোণমিতিক অনুপাত ও দূরত্ব-উচ্চতা",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "$A = \\sin \\theta$, $B = \\cos \\theta$ এবং একটি গাছ ঝড়ে এমনভাবে ভেঙে গেল যে, তার অবিচ্ছিন্ন ভাঙা অংশ দণ্ডায়মান অংশের সাথে $30^\\circ$ কোণ উৎপন্ন করে গাছের গোড়া থেকে $15\\sqrt{3}\\text{ মিটার}$ দূরে মাটি স্পর্শ করে।",
            "Teacher Note / Explanation": "৯ম ও ১০ম অধ্যায়ের সমন্বিত আসল বোর্ড প্রশ্ন (ভাঙা গাছের উচ্চতা ও ত্রিকোণমিতিক অভেদ)।",
            # ক
            "Sub 1 Text": "$\\cot \\theta = \\frac{3}{4}$ হলে, $\\sec \\theta$ এর মান নির্ণয় কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "$\\tan \\theta = \\frac{4}{3}$। আমরা জানি, $\\sec^2 \\theta = 1 + \\tan^2 \\theta = 1 + \\frac{16}{9} = \\frac{25}{9}$।\n$\\therefore \\sec \\theta = \\sqrt{\\frac{25}{9}} = \\frac{5}{3}$।",
            "Sub 1 Explanation": "ত্রিকোণমিতিক অভেদ ব্যবহার করে মান নির্ণয়।",
            # খ
            "Sub 2 Text": "প্রমাণ কর যে, $\\frac{A}{1 - B} + \\frac{1 - B}{A} = 2\\csc \\theta$।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "বামপক্ষ $= \\frac{\\sin \\theta}{1 - \\cos \\theta} + \\frac{1 - \\cos \\theta}{\\sin \\theta}$\n$= \\frac{\\sin^2 \\theta + (1 - \\cos \\theta)^2}{(1 - \\cos \\theta)\\sin \\theta}$\n$= \\frac{\\sin^2 \\theta + 1 - 2\\cos \\theta + \\cos^2 \\theta}{(1 - \\cos \\theta)\\sin \\theta}$\n$= \\frac{(\\sin^2 \\theta + \\cos^2 \\theta) + 1 - 2\\cos \\theta}{(1 - \\cos \\theta)\\sin \\theta} = \\frac{1 + 1 - 2\\cos \\theta}{(1 - \\cos \\theta)\\sin \\theta}$\n$= \\frac{2(1 - \\cos \\theta)}{(1 - \\cos \\theta)\\sin \\theta} = \\frac{2}{\\sin \\theta} = 2\\csc \\theta = $ ডানপক্ষ (প্রমাণিত)।",
            "Sub 2 Explanation": "ল.সা.গু ও মৌলিক অভেদাবলির নিখুঁত প্রমাণ।",
            # গ
            "Sub 3 Text": "গাছটির সম্পূর্ণ উচ্চতা নির্ণয় কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "ধরি গাছটির দণ্ডায়মান অংশ $BC = h$ মিটার, গোড়া থেকে মাটি স্পর্শের বিন্দু $A$, যেখানে $AB = 15\\sqrt{3}\\text{ m}$।\nভাঙা অংশ $AC = x$ মিটার এবং উৎপন্ন কোণ $\\angle BCA = 30^\\circ$।\nসমকোণী $\\triangle ABC$ এ:\n$\\tan 30^\\circ = \\frac{\\text{বিপরীত বাহু}}{\\text{সন্নিহিত বাহু}} = \\frac{AB}{BC} \\implies \\frac{1}{\\sqrt{3}} = \\frac{15\\sqrt{3}}{h} \\implies h = 15\\sqrt{3} \\times \\sqrt{3} = 45\\text{ m}$।\nআবার, $\\sin 30^\\circ = \\frac{AB}{AC} \\implies \\frac{1}{2} = \\frac{15\\sqrt{3}}{x} \\implies x = 30\\sqrt{3} \\approx 51.96\\text{ m}$।\nঅতএব গাছটির সম্পূর্ণ উচ্চতা $= h + x = 45 + 30\\sqrt{3} = 45 + 51.96 = 96.96\\text{ মিটার}$।",
            "Sub 3 Explanation": "দণ্ডায়মান ও ভাঙা উভয় অংশ বের করে মোট উচ্চতা নির্ণয়।"
        },

        # --- গ-বিভাগ: ত্রিকোণমিতি ও পরিমিতি (প্রশ্ন ৬: রম্বস ও আয়তক্ষেত্রের ক্ষেত্রফল) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "পরিমিতি (রম্বস ও আয়তক্ষেত্র)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "একটি রম্বসের পরিসীমা $180\\text{ মিটার}$ এবং ক্ষুদ্রতম কর্ণের দৈর্ঘ্য $54\\text{ মিটার}$। অপর একটি আয়তাকার ক্ষেত্রের দৈর্ঘ্য প্রস্থের $1.5$ গুণ এবং ক্ষেত্রফল উক্ত রম্বসের ক্ষেত্রফলের সমান।",
            "Teacher Note / Explanation": "১৬শ অধ্যায় (পরিমিতি - ১৬.১ ও ১৬.২) থেকে রম্বস ও আয়তক্ষেত্রের আন্তঃসম্পর্ক ও বাস্তবভিত্তিক পরিমিতি সৃজনশীল প্রশ্ন।",
            # ক
            "Sub 1 Text": "একটি সমবাহু ত্রিভুজের প্রত্যেক বাহুর দৈর্ঘ্য $6\\text{ মিটার}$ হলে এর ক্ষেত্রফল নির্ণয় কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "সমবাহু ত্রিভুজের বাহুর দৈর্ঘ্য $a = 6\\text{ m}$ হলে,\nক্ষেত্রফল $= \\frac{\\sqrt{3}}{4} a^2 = \\frac{\\sqrt{3}}{4} \\times 6^2 = \\frac{\\sqrt{3}}{4} \\times 36 = 9\\sqrt{3} \\approx 15.588\\text{ বর্গমিটার}$।",
            "Sub 1 Explanation": "সমবাহু ত্রিভুজের ক্ষেত্রফলের সূত্রের সঠিক প্রয়োগ।",
            # খ
            "Sub 2 Text": "রম্বসটির অপর কর্ণের দৈর্ঘ্য ও ক্ষেত্রফল নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "দেওয়া আছে, রম্বসের পরিসীমা $= 180\\text{ m}$।\nপ্রতিটি বাহুর দৈর্ঘ্য $a = \\frac{180}{4} = 45\\text{ m}$।\nক্ষুদ্রতম কর্ণের দৈর্ঘ্য $d_1 = 54\\text{ m}$।\nআমরা জানি, রম্বসের কর্ণদ্বয় পরস্পরকে সমকোণে সমদ্বিখণ্ডিত করে।\nএকটি কর্ণের অর্ধাংশ $= \\frac{54}{2} = 27\\text{ m}$।\nকর্ণদ্বয়ের ছেদবিন্দুতে উৎপন্ন সমকোণী ত্রিভুজ হতে পিথাগোরাসের উপপাদ্য অনুযায়ী,\nঅপর কর্ণের অর্ধাংশ $= \\sqrt{a^2 - 27^2} = \\sqrt{45^2 - 27^2} = \\sqrt{2025 - 729} = \\sqrt{1296} = 36\\text{ m}$।\nসুতরাং অপর কর্ণের দৈর্ঘ্য $d_2 = 2 \\times 36 = 72\\text{ মিটার}$।\nরম্বসটির ক্ষেত্রফল $= \\frac{1}{2} \\times d_1 \\times d_2 = \\frac{1}{2} \\times 54 \\times 72 = 1,944\\text{ বর্গমিটার}$।",
            "Sub 2 Explanation": "রম্বসের কর্ণদ্বয়ের সমকোণে সমদ্বিখণ্ডন বৈশিষ্ট্য ও ক্ষেত্রফল নির্ণয়।",
            # গ
            "Sub 3 Text": "আয়তাকার ক্ষেত্রটির পরিসীমা নির্ণয় কর এবং প্রতি মিটার ৫০ টাকা দরে এর চারদিকে বেড়া দিতে মোট কত খরচ হবে?",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "ধরি, আয়তাকার ক্ষেত্রটির প্রস্থ $= x\\text{ মিটার}$।\nসুতরাং দৈর্ঘ্য $= 1.5x\\text{ মিটার}$।\nআয়তাকার ক্ষেত্রের ক্ষেত্রফল $= 1.5x \\times x = 1.5x^2\\text{ বর্গমিটার}$।\nশর্তমতে, আয়তক্ষেত্রের ক্ষেত্রফল $=$ রম্বসের ক্ষেত্রফল\n$\\implies 1.5x^2 = 1944$\n$\\implies x^2 = \\frac{1944}{1.5} = 1296$\n$\\implies x = \\sqrt{1296} = 36\\text{ মিটার}$।\nঅতএব, প্রস্থ $= 36\\text{ মিটার}$ এবং দৈর্ঘ্য $= 1.5 \\times 36 = 54\\text{ মিটার}$।\nক্ষেত্রটির পরিসীমা $= 2(\\text{দৈর্ঘ্য} + \\text{প্রস্থ}) = 2(54 + 36) = 2 \\times 90 = 180\\text{ মিটার}$।\nপ্রতি মিটার ৫০ টাকা দরে বেড়া দেওয়ার মোট খরচ $= 180 \\times 50 = 9,000\\text{ টাকা}$।",
            "Sub 3 Explanation": "বীজগাণিতিক সমীকরণ গঠন, আয়তক্ষেত্রের বাহু ও পরিসীমা নির্ণয় এবং মোট ব্যয় হিসাব।"
        },

        # --- ঘ-বিভাগ: পরিসংখ্যান (প্রশ্ন ৭: সংক্ষিপ্ত গড় ও মধ্যক) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "সংক্ষিপ্ত গড় ও মধ্যক (পরিসংখ্যান)",
            "Difficulty": "MEDIUM", "Marks": 10,
            "Question Text": "দশম শ্রেণির ৬০ জন শিক্ষার্থীর গণিত বিষয়ের প্রাপ্ত নম্বরের গণসংখ্যা নিবেশন সারণি দেওয়া হলো:\n<table border=\"1\" style=\"border-collapse: collapse; text-align: center; width: 100%;\">\n  <thead>\n    <tr style=\"background-color: #f1f5f9;\">\n      <th style=\"padding: 5px;\">শ্রেণিব্যাপ্তি</th>\n      <th style=\"padding: 5px;\">৩১–৪০</th>\n      <th style=\"padding: 5px;\">৪১–৫০</th>\n      <th style=\"padding: 5px;\">৫১–৬০</th>\n      <th style=\"padding: 5px;\">৬১–৭০</th>\n      <th style=\"padding: 5px;\">৭১–৮০</th>\n      <th style=\"padding: 5px;\">৮১–৯০</th>\n      <th style=\"padding: 5px;\">৯১–১০০</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style=\"padding: 5px; font-weight: bold;\">গণসংখ্যা</td>\n      <td style=\"padding: 5px;\">৪</td>\n      <td style=\"padding: 5px;\">৮</td>\n      <td style=\"padding: 5px;\">১২</td>\n      <td style=\"padding: 5px;\">১৬</td>\n      <td style=\"padding: 5px;\">১০</td>\n      <td style=\"padding: 5px;\">৭</td>\n      <td style=\"padding: 5px;\">৩</td>\n    </tr>\n  </tbody>\n</table>",
            "Teacher Note / Explanation": "১৭শ অধ্যায় (পরিসংখ্যান) থেকে সংক্ষিপ্ত পদ্ধতির গড় ও মধ্যকের গাণিতিক বিশ্লেষণ।",
            # ক
            "Sub 1 Text": "মধ্যক শ্রেণির মধ্যমান নির্ণয় কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "মোট গণসংখ্যা $N = 60$। $\\frac{N}{2} = 30$। ক্রমযোজিত গণসংখ্যা: ৪, ১২, ২৪, ৪০, ৫০, ৫৭, ৬০। ৩০-তম মানটি ৬১–৭০ শ্রেণিতে অবস্থিত। সুতরাং মধ্যক শ্রেণি ৬১–৭০।\nমধ্যমান $= \\frac{61 + 70}{2} = 65.5$।",
            "Sub 1 Explanation": "ক্রমযোজিত গণসংখ্যা হিসাব করে শ্রেণি শনাক্তকরণ।",
            # খ
            "Sub 2 Text": "সারণি হতে সংক্ষিপ্ত পদ্ধতিতে গড় নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "শ্রেণিব্যাপ্তি $h = 10$। আনুমানিক গড় $a = 65.5$ (৬১–৭০ শ্রেণির মধ্যমান, যেখানে বিচ্যুতি $u_i = 0$)।\n$\\sum f_i u_i = 4(-3) + 8(-2) + 12(-1) + 16(0) + 10(1) + 7(2) + 3(3) = (-40) + 33 = -7$।\nগড় $\\bar{x} = a + \\left(\\frac{\\sum f_i u_i}{N}\\right) \\times h = 65.5 + \\left(\\frac{-7}{60}\\right) \\times 10 = 65.5 - 1.17 = 64.33$।",
            "Sub 2 Explanation": "সংক্ষিপ্ত গড় সূত্রের নির্ভুল প্রয়োগ।",
            # গ
            "Sub 3 Text": "প্রদত্ত উপাত্তের মধ্যক নির্ণয় কর।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "মধ্যক শ্রেণি ৬১–৭০।\nনিম্নসীমা $L = 61$, $N/2 = 30$, পূর্ববর্তী শ্রেণির যোজিত গণসংখ্যা $F_c = 24$, মধ্যক শ্রেণির গণসংখ্যা $f_m = 16$, শ্রেণিব্যাপ্তি $h = 10$।\nমধ্যক $= L + \\left(\\frac{N/2 - F_c}{f_m}\\right) \\times h = 61 + \\left(\\frac{30 - 24}{16}\\right) \\times 10 = 61 + 3.75 = 64.75$।",
            "Sub 3 Explanation": "মধ্যক সূত্রের প্রতিটি উপাদানের সঠিক মান ও হিসাব।"
        },

        # --- ঘ-বিভাগ: পরিসংখ্যান (প্রশ্ন ৮: প্রচুরক ও আয়তলেখ) ---
        {
            "Type": "CQ", "Class Name": class_name, "Subject": subject, "Topic": "প্রচুরক ও আয়তলেখ (পরিসংখ্যান)",
            "Difficulty": "HARD", "Marks": 10,
            "Question Text": "৫০ জন শিক্ষার্থীর ওজনের (কেজি) গণসংখ্যা নিবেশন সারণি দেওয়া হলো:\n<table border=\"1\" style=\"border-collapse: collapse; text-align: center; width: 100%;\">\n  <thead>\n    <tr style=\"background-color: #f1f5f9;\">\n      <th style=\"padding: 5px;\">ওজন (কেজি)</th>\n      <th style=\"padding: 5px;\">৪৫–৪৯</th>\n      <th style=\"padding: 5px;\">৫০–৫৪</th>\n      <th style=\"padding: 5px;\">৫৫–৫৯</th>\n      <th style=\"padding: 5px;\">৬০–৬৪</th>\n      <th style=\"padding: 5px;\">৬৫–৬৯</th>\n      <th style=\"padding: 5px;\">৭০–৭৪</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style=\"padding: 5px; font-weight: bold;\">গণসংখ্যা</td>\n      <td style=\"padding: 5px;\">৪</td>\n      <td style=\"padding: 5px;\">৮</td>\n      <td style=\"padding: 5px;\">১৫</td>\n      <td style=\"padding: 5px;\">১২</td>\n      <td style=\"padding: 5px;\">৭</td>\n      <td style=\"padding: 5px;\">৪</td>\n    </tr>\n  </tbody>\n</table>",
            "Teacher Note / Explanation": "প্রচুরক ও অবিচ্ছিন্ন শ্রেণিসীমার আয়তলেখ সম্পর্কিত বোর্ড প্রশ্ন।",
            # ক
            "Sub 1 Text": "প্রচুরক শ্রেণির পূর্ববর্তী ও পরবর্তী শ্রেণির গণসংখ্যার পার্থক্য ($f_1$ ও $f_2$) নির্ণয় কর।",
            "Sub 1 Marks": 2,
            "Sub 1 Model Answer": "সর্বোচ্চ গণসংখ্যা ১৫ অবস্থিত ৫৫–৫৯ শ্রেণিতে। সুতরাং প্রচুরক শ্রেণি ৫৫–৫৯।\n$f_1 = 15 - 8 = 7$ এবং $f_2 = 15 - 12 = 3$।",
            "Sub 1 Explanation": "$f_1$ ও $f_2$ এর সংজ্ঞানুযায়ী বিয়োগফল।",
            # খ
            "Sub 2 Text": "উপাত্তগুলোর প্রচুরক নির্ণয় কর।",
            "Sub 2 Marks": 4,
            "Sub 2 Model Answer": "প্রচুরক শ্রেণি ৫৫–৫৯।\nনিম্নসীমা $L = 55$, $f_1 = 7$, $f_2 = 3$, শ্রেণিব্যাপ্তি $h = 5$।\nপ্রচুরক $= L + \\left(\\frac{f_1}{f_1 + f_2}\\right) \\times h = 55 + \\left(\\frac{7}{7 + 3}\\right) \\times 5 = 55 + \\left(\\frac{7}{10}\\right) \\times 5 = 55 + 3.5 = 58.5\\text{ কেজি}$।",
            "Sub 2 Explanation": "প্রচুরক সূত্র প্রয়োগ করে ওজন নির্ণয়।",
            # গ
            "Sub 3 Text": "প্রদত্ত উপাত্তের অবিচ্ছিন্ন শ্রেণিসীমা তৈরি করে আয়তলেখ অঙ্কনের বিবরণ দাও।",
            "Sub 3 Marks": 4,
            "Sub 3 Model Answer": "অবিচ্ছিন্ন শ্রেণিসীমা:\n৪৪.৫ – ৪৯.৫ (গণসংখ্যা ৪)\n৪৯.৫ – ৫৪.৫ (গণসংখ্যা ৮)\n৫৪.৫ – ৫৯.৫ (গণসংখ্যা ১৫)\n৫৯.৫ – ৬৪.৫ (গণসংখ্যা ১২)\n৬৪.৫ – ৬৯.৫ (গণসংখ্যা ৭)\n৬৯.৫ – ৭৪.৫ (গণসংখ্যা ৪)\nবিবরণ: ছক কাগজের $X$-অক্ষে প্রতি ১ ঘরকে ১ একক ধরে অবিচ্ছিন্ন শ্রেণিসীমা এবং $Y$-অক্ষে প্রতি ১ ঘরকে ১ একক ধরে গণসংখ্যা নিয়ে আয়তলেখ অঙ্কন করা হয়। মূলবিন্দু থেকে ৪৪.৫ পর্যন্ত পূর্ববর্তী ঘরগুলো বোঝাতে ভাঙা চিহ্ন ব্যবহার করা হয়।",
            "Sub 3 Explanation": "অবিচ্ছিন্ন শ্রেণিসীমা ছক ও আয়তলেখ অঙ্কনের সঠিক বিবরণ।"
        }
    ]

    for cq in cqs:
        add_row(cq)

    wb.save(out_path)
    print(f"✅ Generated upgraded SSC question paper workbook with {len(mcqs)} MCQs, {len(smcqs)} SMCQs, {len(sqs)} SQs, and {len(cqs)} CQs.")
    print(f"File saved at: {out_path}")

if __name__ == '__main__':
    generate_perfect_ssc_math_paper()
