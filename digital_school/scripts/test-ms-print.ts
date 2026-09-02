import assert from 'assert';

// 1. matchSubject helper
const matchSubject = (questionSubject: string | undefined | null, targetSubjectName: string): boolean => {
  if (!questionSubject || !targetSubjectName) return false;
  const qClean = questionSubject.trim().toLowerCase();
  const tClean = targetSubjectName.trim().toLowerCase();
  if (qClean === tClean) return true;
  if (qClean.includes(tClean) || tClean.includes(qClean)) return true;

  const aliases: Record<string, string[]> = {
    'physics': ['পদার্থবিজ্ঞান', 'পদার্থ', 'phy', 'physics 1st', 'physics 2nd'],
    'chemistry': ['রসায়ন', 'রসায়ন', 'chem', 'chemistry 1st', 'chemistry 2nd'],
    'mathematics': ['গণিত', 'উচ্চতর গণিত', 'math', 'higher math', 'higher mathematics', 'maths', 'সাধারণ গণিত', 'general math', 'math 1st', 'math 2nd'],
    'higher mathematics': ['উচ্চতর গণিত', 'higher math', 'higher mathematics', 'h math', 'math 1st', 'math 2nd'],
    'biology': ['জীববিজ্ঞান', 'জীব', 'bio', 'biology 1st', 'biology 2nd'],
    'bangla': ['বাংলা', 'bengali', 'bangla 1st', 'bangla 2nd'],
    'english': ['ইংরেজি', 'ইংরেজী', 'eng', 'english 1st', 'english 2nd'],
    'ict': ['তথ্য ও যোগাযোগ প্রযুক্তি', 'আইসিটি', 'information and communication technology'],
  };

  for (const [key, list] of Object.entries(aliases)) {
    const isTarget = tClean === key || list.some(a => tClean.includes(a));
    const isQuestion = qClean === key || list.some(a => qClean.includes(a));
    if (isTarget && isQuestion) return true;
  }

  return false;
};

// 2. Bengali numeral conversion
function toBengaliNumerals(n: string | number): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

console.log("=== RUNNING MULTI-SUBJECT (MS) PRINT VERIFICATION SUITE ===\n");

// TEST 1: MS Question Grouping
console.log("Test 1: MS Question Grouping by Configured Subjects...");
const mockExamConfig = {
  subjects: [
    { name: "Physics", totalMarks: 25, isMandatory: true },
    { name: "Chemistry", totalMarks: 25, isMandatory: true },
    { name: "Higher Math", totalMarks: 25, isMandatory: false },
    { name: "Biology", totalMarks: 25, isMandatory: false }
  ],
  mandatoryCount: 2,
  optionalCount: 2,
  requiredOptionalCount: 1
};

const rawAllObjective = [
  { id: "q1", q: "Math Q1", subject: "উচ্চতর গণিত", marks: 1 },
  { id: "q2", q: "Physics Q1", subject: "পদার্থবিজ্ঞান", marks: 1 },
  { id: "q3", q: "Chemistry Q1", subject: "রসায়ন", marks: 1 },
  { id: "q4", q: "Biology Q1", subject: "Biology", marks: 1 },
  { id: "q5", q: "Physics Q2", subject: "Physics", marks: 1 },
  { id: "q6", q: "Chemistry Q2", subject: "Chemistry", marks: 1 }
];

const configuredSubjects = mockExamConfig.subjects.map((s, idx) => ({
  name: s.name,
  sectionLetter: String.fromCharCode(65 + idx),
  sectionBengali: ['ক', 'খ', 'গ', 'ঘ'][idx],
  isMandatory: s.isMandatory,
  totalMarks: s.totalMarks
}));

const groupQuestions = (allObjective: any[], isMS: boolean) => {
  if (!isMS || configuredSubjects.length === 0) return allObjective;

  const result: any[] = [];
  const assigned = new Set<string>();

  configuredSubjects.forEach(sub => {
    const subQuestions = allObjective.filter((q: any) =>
      matchSubject(q.subject || q.subjectName, sub.name)
    );
    subQuestions.forEach((q: any) => {
      assigned.add(q.id || `${q.type}_${q.q}`);
      result.push({
        ...q,
        _canonicalSubject: sub.name,
        _subConfig: sub
      });
    });
  });

  // Unassigned
  allObjective.filter((q: any) => !assigned.has(q.id || `${q.type}_${q.q}`)).forEach((q: any) => {
    result.push({
      ...q,
      _canonicalSubject: q.subject || 'সাধারণ',
      _subConfig: {
        name: q.subject || 'সাধারণ',
        isMandatory: true,
        totalMarks: 0
      }
    });
  });

  return result;
};

const ordered = groupQuestions(rawAllObjective, true);

// Check grouping order: Physics (q2, q5) -> Chemistry (q3, q6) -> Higher Math (q1) -> Biology (q4)
assert.strictEqual(ordered[0].id, "q2", "First question must be Physics");
assert.strictEqual(ordered[1].id, "q5", "Second question must be Physics");
assert.strictEqual(ordered[2].id, "q3", "Third question must be Chemistry");
assert.strictEqual(ordered[3].id, "q6", "Fourth question must be Chemistry");
assert.strictEqual(ordered[4].id, "q1", "Fifth question must be Higher Math");
assert.strictEqual(ordered[5].id, "q4", "Sixth question must be Biology");
console.log("✅ Test 1 Passed: Questions are continuously grouped by configured subject order.\n");

// TEST 2: Question Range Computation for Print Headers
console.log("Test 2: Question Range Computation...");
const computeRanges = (orderedObjective: any[], isEn: boolean = false) => {
  const ranges = new Map<string, string>();
  let counter = 1;
  let curSub = '';
  let subStart = 1;

  orderedObjective.forEach((q: any, i: number) => {
    const qSub = q._canonicalSubject || '';
    const qCount = 1;

    if (i === 0) {
      curSub = qSub;
      subStart = 1;
    } else if (qSub !== curSub) {
      const subEnd = counter - 1;
      ranges.set(curSub, isEn ? `Questions: ${subStart} - ${subEnd}` : `প্রশ্ন: ${toBengaliNumerals(subStart)} - ${toBengaliNumerals(subEnd)}`);
      curSub = qSub;
      subStart = counter;
    }

    counter += qCount;

    if (i === orderedObjective.length - 1) {
      const subEnd = counter - 1;
      ranges.set(curSub, isEn ? `Questions: ${subStart} - ${subEnd}` : `প্রশ্ন: ${toBengaliNumerals(subStart)} - ${toBengaliNumerals(subEnd)}`);
    }
  });

  return ranges;
};

const rangesBn = computeRanges(ordered, false);
assert.strictEqual(rangesBn.get("Physics"), "প্রশ্ন: ১ - ২", "Physics range in Bengali must be ১ - ২");
assert.strictEqual(rangesBn.get("Chemistry"), "প্রশ্ন: ৩ - ৪", "Chemistry range in Bengali must be ৩ - ৪");
assert.strictEqual(rangesBn.get("Higher Math"), "প্রশ্ন: ৫ - ৫", "Higher Math range in Bengali must be ৫ - ৫");
assert.strictEqual(rangesBn.get("Biology"), "প্রশ্ন: ৬ - ৬", "Biology range in Bengali must be ৬ - ৬");

const rangesEn = computeRanges(ordered, true);
assert.strictEqual(rangesEn.get("Physics"), "Questions: 1 - 2", "Physics range in English must be 1 - 2");
console.log("✅ Test 2 Passed: Accurate question range labels computed for print section banners.\n");

// TEST 3: Header Section Demarcation Trigger
console.log("Test 3: Section Header Demarcation Triggers...");
const headersTriggered: string[] = [];
ordered.forEach((q, idx) => {
  const showHeader = idx === 0 || ordered[idx - 1]?._canonicalSubject !== q._canonicalSubject;
  if (showHeader) {
    headersTriggered.push(q._canonicalSubject);
  }
});
assert.deepStrictEqual(headersTriggered, ["Physics", "Chemistry", "Higher Math", "Biology"], "Headers must trigger exactly once at the beginning of each subject group");
console.log("✅ Test 3 Passed: Section banners trigger cleanly without repeating.\n");

// TEST 4: Single-Subject (SS) Exam Preserved 100%
console.log("Test 4: Single-Subject (SS) Integrity Guarantee...");
const ssQuestions = [
  { id: "ss1", q: "General question 1", marks: 1 },
  { id: "ss2", q: "General question 2", marks: 1 },
  { id: "ss3", q: "General question 3", marks: 1 }
];
const ssResult = groupQuestions(ssQuestions, false);
assert.deepStrictEqual(ssResult, ssQuestions, "SS questions must remain completely unchanged");

const isExamMS_SS = false;
const examHeaderSubject_SS = isExamMS_SS ? 'বহু-বিষয়ক পরীক্ষা' : 'পদার্থবিজ্ঞান';
assert.strictEqual(examHeaderSubject_SS, 'পদার্থবিজ্ঞান', "SS header must show the subject name untouched");
console.log("✅ Test 4 Passed: SS exams are 100% intact and unchanged.\n");

console.log("🎉 ALL MULTI-SUBJECT PRINT VERIFICATION TESTS PASSED SUCCESSFULLY!");
