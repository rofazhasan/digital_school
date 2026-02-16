import pandas as pd

# Schema definitions based on the provided template
columns = [
    'Type', 'Class Name', 'Subject', 'Topic', 'Difficulty', 'Marks',
    'Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 'Option E',
    'Correct Option', 'Correct Answer', 'Assertion', 'Reason',
    'Left 1', 'Left 2', 'Left 3', 'Left 4', 'Left 5',
    'Right A', 'Right B', 'Right C', 'Right D', 'Right E',
    'Matches', 'Explanation', 'Model Answer',
    'Sub-Question 1 Text', 'Sub-Question 1 Marks', 'Sub-Question 1 Model Answer',
    'Sub-Question 2 Text', 'Sub-Question 2 Marks', 'Sub-Question 2 Model Answer',
    'Sub-Question 3 Text', 'Sub-Question 3 Marks', 'Sub-Question 3 Model Answer',
    'Sub-Question 4 Text', 'Sub-Question 4 Marks', 'Sub-Question 4 Model Answer'
]

# Constants
CLASS_NAME = "10A - 1"
SUBJECT = "Physics"
TOPIC = "Static Electricity (স্থির তড়িৎ) - Advanced CQs"
DIFFICULTY = "HARD"

data = []

# Helper function
def add_row(type_q, marks, question_text, 
            opt_a=None, opt_b=None, opt_c=None, opt_d=None, opt_e=None,
            correct_opt=None, assertion=None, reason=None,
            left1=None, left2=None, left3=None, left4=None, left5=None,
            righta=None, rightb=None, rightc=None, rightd=None, righte=None,
            matches=None, explanation=None, model_answer=None,
            subq1_text=None, subq1_marks=None, subq1_ans=None,
            subq2_text=None, subq2_marks=None, subq2_ans=None,
            subq3_text=None, subq3_marks=None, subq3_ans=None,
            subq4_text=None, subq4_marks=None, subq4_ans=None):
    
    row = {col: "" for col in columns}
    row['Type'] = type_q
    row['Class Name'] = CLASS_NAME
    row['Subject'] = SUBJECT
    row['Topic'] = TOPIC
    row['Difficulty'] = DIFFICULTY
    row['Marks'] = marks
    
    # Common field
    if type_q != "AR" and type_q != "MTF": 
        row['Question Text'] = question_text

    if type_q == "CQ":
        row['Question Text'] = question_text # Stem
        row['Sub-Question 1 Text'] = subq1_text
        row['Sub-Question 1 Marks'] = subq1_marks
        row['Sub-Question 1 Model Answer'] = subq1_ans
        row['Sub-Question 2 Text'] = subq2_text
        row['Sub-Question 2 Marks'] = subq2_marks
        row['Sub-Question 2 Model Answer'] = subq2_ans
        row['Sub-Question 3 Text'] = subq3_text
        row['Sub-Question 3 Marks'] = subq3_marks
        row['Sub-Question 3 Model Answer'] = subq3_ans
        row['Sub-Question 4 Text'] = subq4_text
        row['Sub-Question 4 Marks'] = subq4_marks
        row['Sub-Question 4 Model Answer'] = subq4_ans

    row['Explanation'] = explanation
    data.append(row)

# ==============================================================================
# 10 New Hardcore CQs
# ==============================================================================

# CQ 1: Pendulum Dynamics in Electric Field (বল ও গতির ফিউশন)
add_row("CQ", 10, "2g ভরের একটি পিথ বল (Pith ball) একটি সুতা দিয়ে ঝোলানো আছে। অনুভূমিক তড়িৎ ক্ষেত্র E = 200 N/C প্রয়োগ করায় সুতাটি উলম্বের সাথে 30° কোণ তৈরি করে সাম্যাবস্থায় আসে। (g = 9.8 m/s²)",
        subq1_text="তড়িৎ প্রাবল্য ভেক্টর রাশি না স্কেলার রাশি?", subq1_marks=1, subq1_ans="ভেক্টর রাশি।",
        subq2_text="আহিত পরিবাহীর আধান সর্বদা পৃষ্ঠে থাকে কেন?", subq2_marks=2, subq2_ans="সমধর্মী আধানের বিকর্ষণের কারণে তারা পরস্পর থেকে সর্বোচ্চ দূরত্বে (পৃষ্ঠে) অবস্থান নিতে চায়।",
        subq3_text="বলটিতে আধানের পরিমাণ নির্ণয় করো।", subq3_marks=3, subq3_ans="Tsinθ = qE, Tcosθ = mg ব্যবহার করে q নির্ণয়। q = mg tanθ / E = (0.002*9.8*tan30)/200 C.",
        subq4_text="যদি তড়িৎ ক্ষেত্রের দিক উলম্ব বরাবর উপরের দিকে করা হয় এবং মান দ্বিগুণ করা হয়, তবে সুতার টান কত হবে?", subq4_marks=4, subq4_ans="তখন mg নিচে এবং qE উপরে কাজ করবে। লব্ধি বল ও সুতার টান বিশ্লেষণ করে মন্তব্য করতে হবে।")

# CQ 2: Capacitor with Dielectric (ধারক ও পরাবৈদ্যুতিক মাধ্যম)
add_row("CQ", 10, "একটি সমান্তরাল পাত ধারকের বায়ু মাধ্যমে ধারকত্ব 10μF। ধারকটিকে 100V উৎসের সাথে যুক্ত করে আহিত করা হলো। এরপর উৎস বিচ্ছিন্ন করে পাত দুটির মাঝে কাঁচ (K=6) প্রবেশ করানো হলো।",
        subq1_text="1 ফ্যারাড কাকে বলে?", subq1_marks=1, subq1_ans="কোনো পরিবাহীর বিভব 1V বাড়াতে যদি 1C আধান লাগে, তবে তার ধারকত্বকে 1F বলে।",
        subq2_text="ধারকের সঞ্চিত শক্তি আধানের ওপর কীভাবে নির্ভর করে?", subq2_marks=2, subq2_ans="U = Q²/2C, অর্থাৎ আধানের বর্গের সমানুপাতিক।",
        subq3_text="কাঁচ প্রবেশের পূর্বে ধারকে সঞ্চিত শক্তি নির্ণয় করো।", subq3_marks=3, subq3_ans="U = 0.5 * 10*10^-6 * (100)^2 = 0.05 J.",
        subq4_text="কাঁচ প্রবেশের পর ধারকের বিভব পার্থক্য এবং সঞ্চিত শক্তির কী পরিবর্তন হবে? গাণিতিকভাবে বিশ্লেষণ করো।", subq4_marks=4, subq4_ans="উৎস বিচ্ছিন্ন তাই Q ধ্রুবক। C' = KC = 60μF। V' = Q/C' (কমে যাবে), U' = Q²/2C' (কমে যাবে)।")

# CQ 3: Charge Redistribution (আধান বন্টন ও বিভব)
add_row("CQ", 10, "দুটি গোলক A ও B এর ব্যাসার্ধ যথাক্রমে 5cm এবং 10cm। এদের যথাক্রমে +50C এবং +100C আধান দেওয়া হলো। এরপর গোলক দুটিকে একটি সরু পরিবাহী তার দ্বারা যুক্ত করা হলো।",
        subq1_text="আধান ঘনত্ব কী?", subq1_marks=1, subq1_ans="পরিবাহীর একক ক্ষেত্রফল বা আয়তনে যে পরিমাণ আধান থাকে।",
        subq2_text="বজ্রপাতের সময় দালানের ক্ষতি হয় কেন?", subq2_marks=2, subq2_ans="বিপুল পরিমাণ তড়িৎ শক্তি প্রবাহিত হয়ে তাপ ও যান্ত্রিক কম্পন সৃষ্টি করে।",
        subq3_text="তার দিয়ে যুক্ত করার পূর্বে গোলক দুটির বিভব পার্থক্য নির্ণয় করো।", subq3_marks=3, subq3_ans="Va = k*50/0.05, Vb = k*100/0.10। পার্থক্য বের করতে হবে।",
        subq4_text="যুক্ত করার পর আধানের প্রবাহ কোন দিক থেকে কোন দিকে হবে এবং চূড়ান্ত বিভব কত হবে?", subq4_marks=4, subq4_ans="সাধারণ বিভব V = (Q1+Q2)/(C1+C2) বা Q_total / (R1+R2) অনুপাত (যেহেতু C propto R)। প্রবাহ উচ্চ বিভব থেকে নিম্নে যাবে।")

# CQ 4: Triangle Configuration (ভেক্টর যোজন)
add_row("CQ", 10, "2m বাহুবিশিষ্ট একটি সমবাহু ত্রিভুজ ABC এর A ও B বিন্দুতে যথাক্রমে +10μC এবং -10μC আধান রাখা হলো।",
        subq1_text="কুলম্ব বল কী ধরনের বল?", subq1_marks=1, subq1_ans="এটি একটি কেন্দ্রীয় এবং সংরক্ষণশীল বল।",
        subq2_text="আধান কোয়ান্টায়িত—ব্যাখ্যা করো।", subq2_marks=2, subq2_ans="আধান সবসময় মূল আধান e এর পূর্ণ গুণিতক হয়, ভগ্নাংশ হতে পারে না।",
        subq3_text="C বিন্দুতে তড়িৎ বিভব নির্ণয় করো।", subq3_marks=3, subq3_ans="V = V_A + V_B = k(10μC)/2 + k(-10μC)/2 = 0V।",
        subq4_text="C বিন্দুতে লব্ধি প্রাবল্যের মান ও দিক নির্ণয় করো।", subq4_marks=4, subq4_ans="ভেক্টর যোগের সামান্তরিক সূত্র ব্যবহার করে E_A এবং E_B এর লব্ধি বের করতে হবে। কোণ 120° হবে।")

# CQ 5: Electron Gun (শক্তি ও গতিবেগ)
add_row("CQ", 10, "একটি ইলেকট্রন গান (Electron Gun) থেকে নির্গত ইলেকট্রন স্থির অবস্থা থেকে 2000V বিভব পার্থক্যের মধ্য দিয়ে ত্বরান্বিত হয়ে একটি ধাতব পাতে আঘাত করে। (e = 1.6×10⁻¹⁹ C, m = 9.1×10⁻³¹ kg)",
        subq1_text="eV কিসের একক?", subq1_marks=1, subq1_ans="শক্তির একক।",
        subq2_text="তড়িৎ প্রাবল্য ও বিভবের মধ্যে সম্পর্ক লেখ এবং ব্যাখ্যা করো।", subq2_marks=2, subq2_ans="E = -dV/dr, অর্থাৎ দূরত্বের সাথে বিভবের পরিবর্তনের হারই প্রাবল্য।",
        subq3_text="ইলেকট্রনটি ধাতব পাতে আঘাত করার মুহূর্তের বেগ নির্ণয় করো।", subq3_marks=3, subq3_ans="1/2 mv² = qV সূত্র ব্যবহার করে।",
        subq4_text="যদি বিভব পার্থক্য অর্ধেক করা হয় এবং ইলেকট্রনের পরিবর্তে প্রোটন ব্যবহার করা হয়, তবে গতিশক্তির কী পরিবর্তন হবে?", subq4_marks=4, subq4_ans="K.E = qV। প্রোটন ও ইলেকট্রনের আধান সমান (মান), তাই বিভব অর্ধেক হলে শক্তিও অর্ধেক হবে, ভরের ওপর শক্তি নির্ভর করে না (বেগ করে)।")

# CQ 6: Null Point Complex (নাল পয়েন্ট বিশ্লেষণ)
add_row("CQ", 10, "দুটি বিন্দু আধান +16μC এবং +9μC পরস্পরের থেকে 14cm দূরে অবস্থিত। আধান দুটির মধ্যবর্তী কোনো এক বিন্দুতে একটি তৃতীয় আধান q রাখা হলো।",
        subq1_text="তড়িৎ বলরেখা কাকে বলে?", subq1_marks=1, subq1_ans="তড়িৎ ক্ষেত্রে একটি মুক্ত ধনাত্মক আধান যে পথে গমন করে।",
        subq2_text="দুটি চার্জের মধ্যবর্তী বল কি মাধ্যমের ওপর নির্ভর করে?", subq2_marks=2, subq2_ans="হ্যাঁ, F = 1/(4πε) ..., ε মাধ্যমের ভেদনযোগ্যতা।",
        subq3_text="সংযোগ রেখার কোন বিন্দুতে লব্ধি প্রাবল্য শূন্য হবে?", subq3_marks=3, subq3_ans="x = d / (√(q2/q1) + 1) সূত্র দিয়ে বা E1=E2 করে বের করতে হবে।",
        subq4_text="q আধানটি সাম্যাবস্থায় থাকার জন্য এর মান ও প্রকৃতি কেমন হওয়া উচিত এবং এটি কোন ধরনের সাম্যাবস্থা (সুস্থির না অস্থির)?", subq4_marks=4, subq4_ans="যেহেতু দুই পাশের আধান ফিক্সড, মাঝের আধানের ওপর নেট বল শূন্য। q এর মান যাই হোক বল শূন্য হবে। কিন্তু সুস্থিরতার জন্য q এর প্রকৃতি বিপরীত হতে হতে পারে (Hardcore analysis)।")

# CQ 7: Square Configuration Force (বর্গক্ষেত্রে বল)
add_row("CQ", 10, "ABCD বর্গক্ষেত্রের তিন কোণা A, B, C তে যথাক্রমে +q, +q, -q আধান রাখা আছে। বর্গের বাহু a।",
        subq1_text="বিন্দু আধান কী?", subq1_marks=1, subq1_ans="আহিত বস্তুর আকার দূরত্বের তুলনায় নগণ্য হলে তাকে বিন্দু আধান বলে।",
        subq2_text="সুষম তড়িৎ ক্ষেত্রে একটি ডাইপোল রাখলে কী ঘটে?", subq2_marks=2, subq2_ans="নেট বল শূন্য হয় কিন্তু টর্ক অনুভব করে, ফলে এটি ঘুরতে চায়।",
        subq3_text="D বিন্দুতে তড়িৎ বিভব নির্ণয় করো।", subq3_marks=3, subq3_ans="তিনটি আধানের জন্য বিভবের স্কেলার যোগফল।",
        subq4_text="D বিন্দুতে একটি +q আধান রাখলে সেটি কত বল অনুভব করবে? লব্ধি বলের দিক চিত্রসহ দেখাও।", subq4_marks=4, subq4_ans="তিনটি বলের ভেক্টর যোজন। A ও C এর বল এবং B এর বলের লব্ধি।")

# CQ 8: Surface Charge Density (তলমাত্রিক ঘনত্ব)
add_row("CQ", 10, "64টি ছোট পানির ফোঁটা, যার প্রতিটির ব্যাসার্ধ 1mm এবং আধান 10⁻¹⁰C, মিলে একটি বড় ফোঁটা তৈরি করল।",
        subq1_text="তড়িৎ ফ্লাক্সের একক কী?", subq1_marks=1, subq1_ans="N m² C⁻¹",
        subq2_text="বজ্রনিরোধক দণ্ড তামার তৈরি হয় কেন?", subq2_marks=2, subq2_ans="তামা সুপরিবাহী, তাই এটি দ্রুত আধান মাটিতে প্রবাহিত করে দালানকে রক্ষা করে।",
        subq3_text="বড় ফোঁটার বিভব নির্ণয় করো।", subq3_marks=3, subq3_ans="আয়তন সংরক্ষণশীলতা দিয়ে বড় ব্যাসার্ধ R বের করা (R = 4r)। মোট আধান Q = 64q। তারপর V = kQ/R।",
        subq4_text="ছোট ফোঁটা ও বড় ফোঁটার তলমাত্রিক ঘনত্বের অনুপাত গাণিতিকভাবে বিশ্লেষণ করো।", subq4_marks=4, subq4_ans="σ ∝ Q/R²। অনুপাত বের করে তুলনা করতে হবে।")

# CQ 9: Vertical Electric Field (উলম্ব ক্ষেত্র ও ওজন)
add_row("CQ", 10, "ভূপৃষ্ঠের কাছাকাছি একটি স্থানে উলম্বভাবে নিম্নমুখী সুষম তড়িৎ ক্ষেত্র E বিদ্যমান। এখানে m ভরের এবং -q আধানের একটি কণা ভাসমান অবস্থায় আছে।",
        subq1_text="তড়িৎ দ্বিমেরু কী?", subq1_marks=1, subq1_ans="দুটি সমমানের কিন্তু বিপরীতধর্মী আধান অল্প দূরত্বে থাকলে তাকে তড়িৎ দ্বিমেরু বলে।",
        subq2_text="তড়িৎ বলরেখা পরিবাহীকে লম্বভাবে ছেদ করে কেন?", subq2_marks=2, subq2_ans="কারণ পরিবাহীর পৃষ্ঠ সমবিভব তল, এবং বলরেখা সর্বদা সমবিভব তলের সাথে লম্ব।",
        subq3_text="তড়িৎ ক্ষেত্র E এর মান কত হলে কণাটি স্থির থাকবে? (রাশিমালা নির্ণয় করো)", subq3_marks=3, subq3_ans="ভারসাম্য শর্ত: mg = qE => E = mg/q।",
        subq4_text="যদি কণাটিতে আধানের পরিমাণ দ্বিগুণ করা হয়, তবে কণাটির তাৎক্ষণিক ত্বরণ কত হবে?", subq4_marks=4, subq4_ans="উর্ধ্বমুখী বল 2qE = 2mg। লব্ধি বল F = 2mg - mg = mg (উপরে)। ত্বরণ a = F/m = g (উর্ধ্বমুখী)।")

# CQ 10: Work Done in Field (তড়িৎ ক্ষেত্রে কাজ)
add_row("CQ", 10, "একটি সুষম তড়িৎ ক্ষেত্রে A ও B দুটি বিন্দুর স্থানাঙ্ক যথাক্রমে (0,0) এবং (4,0) মিটার। তড়িৎ প্রাবল্য E = 10 N/C, যা X-অক্ষ বরাবর ক্রিয়াশীল।",
        subq1_text="পরাবৈদ্যুতিক মাধ্যম কী?", subq1_marks=1, subq1_ans="অপরিবাহী পদার্থ যা তড়িৎ ক্ষেত্রের প্রভাবে পোলারায়িত হয়।",
        subq2_text="অসীম দূরত্বে বিভব শূন্য ধরা হয় কেন?", subq2_marks=2, subq2_ans="কারণ অসীমে আকর্ষণ বা বিকর্ষণ বলের প্রভাব থাকে না।",
        subq3_text="একটি 2C আধানকে A থেকে B বিন্দুতে নিতে তড়িৎ বল দ্বারা কৃতকাজ কত?", subq3_marks=3, subq3_ans="W = qEd = 2 * 10 * 4 = 80 J।",
        subq4_text="যদি আধানটিকে (0,0) থেকে (0,3) বিন্দুতে নেওয়া হতো, তবে কৃতকাজের কোনো পরিবর্তন হতো কি? ব্যাখ্যা করো।", subq4_marks=4, subq4_ans="প্রাবল্য X অক্ষ বরাবর, তাই Y অক্ষ বরাবর সরণে (লম্বভাবে) কোনো কাজ হবে না (W=0)। কারণ বল ও সরণ লম্ব।")

# Create DataFrame
df = pd.DataFrame(data)

# Reorder columns
df = df[columns]

# Save to Excel
file_path = "SSC_Physics_Static_Electricity_10_Toughest_CQs.xlsx"
df.to_excel(file_path, index=False)

print("Excel file generated successfully with 10 Toughest CQs.")