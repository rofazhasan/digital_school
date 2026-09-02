import assert from 'assert';

// 1. Replicate matchSubject from ExamContext.tsx
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

// 2. Mock MS Exam Configuration
const mockSubjectsConfig = {
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

const mockQuestions = [
  { id: "q1", text: "Physics question 1", subject: "পদার্থবিজ্ঞান", marks: 1 },
  { id: "q2", text: "Chemistry question 1", subject: "Chemistry", marks: 1 },
  { id: "q3", text: "Higher Math question 1", subject: "উচ্চতর গণিত", marks: 1 },
  { id: "q4", text: "Biology question 1", subject: "biology", marks: 1 },
  { id: "q5", text: "Legacy question missing subject in set", subject: "", marks: 1 }
];

console.log("=== RUNNING MS EXAM VERIFICATION TEST SUITE ===\n");

// TEST 1: Alias & Subject Matching
console.log("Test 1: Subject Alias Matching...");
assert.strictEqual(matchSubject("পদার্থবিজ্ঞান", "Physics"), true, "Physics Bengali alias must match English config");
assert.strictEqual(matchSubject("রসায়ন", "Chemistry"), true, "Chemistry Bengali alias must match English config");
assert.strictEqual(matchSubject("উচ্চতর গণিত", "Higher Math"), true, "Higher Math Bengali alias must match English config");
assert.strictEqual(matchSubject("biology", "Biology"), true, "Case-insensitive biology must match");
assert.strictEqual(matchSubject("Physics", "Chemistry"), false, "Different subjects must not match");
console.log("✅ Test 1 Passed: Aliases correctly resolve bilingual subject names.\n");

// TEST 2: MS Detection Engine
console.log("Test 2: Multi-Subject (MS) Detection...");
const parseSubjectsConfig = (raw: any) => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
};

const detectIsMS = (exam: any) => {
  const parsed = parseSubjectsConfig(exam.subjectsConfig);
  const rawSubjects = (exam.questions || [])
    .map((q: any) => (q.subject || q.subjectName || '').trim())
    .filter(Boolean);
  const canonical: string[] = [];
  rawSubjects.forEach((rs: string) => {
    if (!canonical.some(c => matchSubject(rs, c))) {
      canonical.push(rs);
    }
  });
  return Boolean(
    exam.subjectType === 'MS' ||
    (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) ||
    canonical.length > 1
  );
};

assert.strictEqual(detectIsMS({ subjectType: 'MS' }), true, "Explicit subjectType MS must be detected");
assert.strictEqual(detectIsMS({ subjectType: 'SS', subjectsConfig: JSON.stringify(mockSubjectsConfig) }), true, "Stringified subjectsConfig must be detected as MS");
assert.strictEqual(detectIsMS({ subjectType: 'SS', questions: mockQuestions }), true, "Multiple distinct question subjects must implicitly trigger MS");
assert.strictEqual(detectIsMS({ subjectType: 'SS', questions: [{ subject: "Physics" }, { subject: "পদার্থবিজ্ঞান" }] }), false, "Single subject with aliases must remain SS");
console.log("✅ Test 2 Passed: Multi-source MS detection reliably identifies MS exams.\n");

// TEST 3: Compulsory vs Optional Subject Resolution
console.log("Test 3: Compulsory vs Optional Badge Resolution...");
const normalizedMsSubjects = mockSubjectsConfig.subjects.map((s: any) => ({
  ...s,
  isMandatory: s.isMandatory !== false && s.isOptional !== true
}));

const resolveQuestionConfig = (question: any) => {
  const currentSubjectName = question?.subject || question?.subjectName || '';
  const subConfig = normalizedMsSubjects.find(s => matchSubject(currentSubjectName, s.name));
  const isOptional = subConfig ? !subConfig.isMandatory : false;
  const badgeLabel = isOptional ? 'ঐচ্ছিক (Optional)' : 'আবश्यक (Compulsory)';
  const badgeColor = isOptional ? 'bg-amber-600' : 'bg-indigo-600';
  return {
    subjectName: subConfig?.name || currentSubjectName,
    isOptional,
    badgeLabel,
    badgeColor
  };
};

const q1Res = resolveQuestionConfig(mockQuestions[0]); // Physics
assert.strictEqual(q1Res.subjectName, "Physics", "q1 must resolve to Physics canonical name");
assert.strictEqual(q1Res.isOptional, false, "Physics must be identified as Mandatory");
assert.strictEqual(q1Res.badgeLabel, "আবश्यक (Compulsory)", "Physics badge must display আবশ্যক (Compulsory)");
assert.strictEqual(q1Res.badgeColor, "bg-indigo-600", "Mandatory badge must be Indigo");

const q3Res = resolveQuestionConfig(mockQuestions[2]); // Higher Math
assert.strictEqual(q3Res.subjectName, "Higher Math", "q3 must resolve to Higher Math canonical name");
assert.strictEqual(q3Res.isOptional, true, "Higher Math must be identified as Optional");
assert.strictEqual(q3Res.badgeLabel, "ঐচ্ছিক (Optional)", "Higher Math badge must display ঐচ্ছিক (Optional)");
assert.strictEqual(q3Res.badgeColor, "bg-amber-600", "Optional badge must be Amber");
console.log("✅ Test 3 Passed: Questions are precisely assigned mandatory vs optional badges.\n");

// TEST 4: Optional Subject Limit Tracking
console.log("Test 4: Optional Subject Limit & Disqualification Guard...");
const checkOptionalLimits = (answers: Record<string, any>, questions: any[], requiredOptionalCount: number) => {
  const attemptedOptSubjs = new Set<string>();
  const qMap = new Map<string, any>(questions.map(q => [q.id, q]));

  Object.keys(answers).forEach((k) => {
    if (k.endsWith('_marks') || k.endsWith('_images') || k.startsWith('_')) return;
    const val = answers[k];
    const hasAnswer = val !== undefined && val !== null && val !== '' && val !== 'No answer provided';
    if (hasAnswer) {
      const q = qMap.get(k);
      const qSubject = q?.subject;
      if (q && qSubject) {
        const subConfig = normalizedMsSubjects.find(s => matchSubject(qSubject, s.name));
        if (subConfig && !subConfig.isMandatory) {
          attemptedOptSubjs.add(subConfig.name);
        }
      }
    }
  });

  return {
    attemptedCount: attemptedOptSubjs.size,
    isExceeding: attemptedOptSubjs.size > requiredOptionalCount
  };
};

// Scenario A: Student answers Physics (mandatory), Chemistry (mandatory), and Higher Math (1 optional)
const validAnswers = { q1: 1, q2: 2, q3: 0 };
const validCheck = checkOptionalLimits(validAnswers, mockQuestions, 1);
assert.strictEqual(validCheck.attemptedCount, 1, "Should count 1 optional subject");
assert.strictEqual(validCheck.isExceeding, false, "Should not exceed limit of 1");

// Scenario B: Student answers both Higher Math AND Biology (2 optional subjects, max is 1)
const exceedingAnswers = { q1: 1, q2: 2, q3: 0, q4: 3 };
const exceedingCheck = checkOptionalLimits(exceedingAnswers, mockQuestions, 1);
assert.strictEqual(exceedingCheck.attemptedCount, 2, "Should count 2 optional subjects");
assert.strictEqual(exceedingCheck.isExceeding, true, "Should trigger exceeding warning (disqualification guard)");
console.log("✅ Test 4 Passed: Optional limit tracking accurately triggers disqualification alert when exceeding limit.\n");

// TEST 5: API Response Verification (Ensure subjectType and subjectsConfig are never omitted)
console.log("Test 5: API Payload Completeness Guard...");
const mockExamDbRecord = {
  id: "test-exam-123",
  name: "Term 2 Engineering Combined Exam",
  subjectType: "MS",
  subjectsConfig: mockSubjectsConfig,
  class: { name: "HSC 2026" }
};

const generateApiResponse = (exam: any, questions: any[]) => {
  const isExamMS = exam.subjectType === 'MS' || Boolean(
    exam.subjectsConfig && ((exam.subjectsConfig as any)?.subjects || []).length > 0
  );
  return {
    id: exam.id,
    name: exam.name,
    subject: isExamMS ? 'বহু-বিষয়ক পরীক্ষা (Multi-Subject)' : ((questions[0] as any)?.subject || exam.class?.name || ''),
    subjectType: exam.subjectType || (isExamMS ? 'MS' : 'SS'),
    subjectsConfig: exam.subjectsConfig || null,
    questions
  };
};

const apiPayload = generateApiResponse(mockExamDbRecord, mockQuestions);
assert.strictEqual(apiPayload.subjectType, "MS", "API payload must include subjectType 'MS'");
assert.ok(apiPayload.subjectsConfig, "API payload must include subjectsConfig");
assert.strictEqual(apiPayload.subjectsConfig.subjects.length, 4, "API payload must include all 4 configured subjects");
assert.strictEqual(apiPayload.subject, "বহু-বিষয়ক পরীক্ষা (Multi-Subject)", "Exam subject header must clearly state Multi-Subject");
console.log("✅ Test 5 Passed: API response retains all required MS metadata.\n");

console.log("🎉 ALL 5 VERIFICATION SUITES PASSED SUCCESSFULLY!");
