import assert from 'assert';

// Standalone matchSubject helper matching ExamContext.tsx
export const matchSubject = (questionSubject: string | undefined | null, targetSubjectName: string): boolean => {
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

export const parseSubjectsConfig = (raw: any) => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
};

export const detectIsMS = (exam: any) => {
  const parsed = parseSubjectsConfig(exam?.subjectsConfig);
  const rawSubjects = (exam?.questions || [])
    .map((q: any) => (q.subject || q.subjectName || '').trim())
    .filter(Boolean);
  const canonical: string[] = [];
  rawSubjects.forEach((rs: string) => {
    if (!canonical.some(c => matchSubject(rs, c))) {
      canonical.push(rs);
    }
  });
  return Boolean(
    exam?.subjectType === 'MS' ||
    (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) ||
    canonical.length > 1
  );
};

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function shuffleArrayWithSeed<T>(array: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed << 5) - seed + seedStr.charCodeAt(i);
    seed |= 0;
  }
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Prepare questions helper
export function prepareExamQuestions(examProp: any) {
  const origQuestions = examProp.questions || [];
  const seed = examProp.studentId || examProp.submissionId || examProp.id || 'default_seed';
  const isPropMS = detectIsMS(examProp);

  if (!isPropMS) {
    // UNTOUCHED FOR SS
    return examProp.shuffleQuestions !== false 
      ? shuffleArrayWithSeed(origQuestions, seed) 
      : origQuestions;
  }

  // MS: Group questions by subject, shuffle within each subject
  const parsedCfg = parseSubjectsConfig(examProp.subjectsConfig);
  const configuredSubs: any[] = Array.isArray(parsedCfg?.subjects) && parsedCfg.subjects.length > 0
    ? parsedCfg.subjects
    : [];

  const distinctSubNames: string[] = [];
  if (configuredSubs.length > 0) {
    configuredSubs.forEach((s: any) => {
      if (s?.name && !distinctSubNames.some(d => matchSubject(s.name, d))) {
        distinctSubNames.push(s.name);
      }
    });
  } else {
    const rawSubs = origQuestions.map((q: any) => (q.subject || q.subjectName || '').trim()).filter(Boolean);
    rawSubs.forEach((rs: string) => {
      if (!distinctSubNames.some(d => matchSubject(rs, d))) {
        distinctSubNames.push(rs);
      }
    });
  }

  const groupedResult: any[] = [];
  const matchedIds = new Set<string>();

  distinctSubNames.forEach((subName, subIdx) => {
    const subQuestions = origQuestions.filter((q: any) => {
      const qSub = q.subject || q.subjectName || '';
      const matches = matchSubject(qSub, subName);
      if (matches && q.id) matchedIds.add(q.id);
      return matches;
    });

    if (subQuestions.length > 0) {
      const subShuffled = examProp.shuffleQuestions !== false
        ? shuffleArrayWithSeed(subQuestions, `${seed}_sub_${subIdx}_${subName}`)
        : subQuestions;
      groupedResult.push(...subShuffled);
    }
  });

  const remaining = origQuestions.filter((q: any) => q.id && !matchedIds.has(q.id));
  if (remaining.length > 0) {
    const remShuffled = examProp.shuffleQuestions !== false
      ? shuffleArrayWithSeed(remaining, `${seed}_sub_rem`)
      : remaining;
    groupedResult.push(...remShuffled);
  }

  return groupedResult;
}

// Compute fullSortedQuestions
export function getFullSortedQuestions(exam: any, isMS: boolean, msSubjects: any[]) {
  if (!exam.questions) return [];

  if (!isMS) {
    const types = ['mcq', 'mc', 'ar', 'mtf', 'cq', 'sq', 'int', 'numeric', 'descriptive', 'smcq', 'cma', 'mpc'];
    const grouped: any = { mcq: [], mc: [], ar: [], mtf: [], cq: [], sq: [], int: [], numeric: [], descriptive: [], smcq: [], cma: [], mpc: [], other: [] };

    exam.questions.forEach((q: any) => {
      let type = (q.type || q.questionType || '').toLowerCase();
      if (type === 'constructed_multi_answer' || type === 'constructed-multi-answer') type = 'cma';
      if (type === 'multi_step_chain' || type === 'multi-step-chain' || type === 'multi_step_problem_chain') type = 'mpc';
      if (grouped[type]) grouped[type].push(q);
      else grouped.other.push(q);
    });

    return [
      ...grouped.mcq,
      ...grouped.mc,
      ...grouped.ar,
      ...grouped.mtf,
      ...grouped.smcq,
      ...grouped.cma,
      ...grouped.mpc,
      ...grouped.cq,
      ...grouped.sq,
      ...grouped.int,
      ...grouped.numeric,
      ...grouped.descriptive,
      ...grouped.other
    ];
  }

  const result: any[] = [];
  const matchedQIds = new Set<string>();

  msSubjects.forEach((sub: any) => {
    const subQuestions = exam.questions.filter((q: any) => {
      const qSub = q.subject || q.subjectName || '';
      const matches = matchSubject(qSub, sub.name);
      if (matches && q.id) matchedQIds.add(q.id);
      return matches;
    });

    const grouped: any = { mcq: [], mc: [], ar: [], mtf: [], smcq: [], cma: [], mpc: [], cq: [], sq: [], int: [], numeric: [], descriptive: [], other: [] };
    subQuestions.forEach((q: any) => {
      let type = (q.type || q.questionType || '').toLowerCase();
      if (type === 'constructed_multi_answer' || type === 'constructed-multi-answer') type = 'cma';
      if (type === 'multi_step_chain' || type === 'multi-step-chain' || type === 'multi_step_problem_chain') type = 'mpc';
      if (grouped[type]) grouped[type].push(q);
      else grouped.other.push(q);
    });

    result.push(
      ...grouped.mcq,
      ...grouped.mc,
      ...grouped.ar,
      ...grouped.mtf,
      ...grouped.smcq,
      ...grouped.cma,
      ...grouped.mpc,
      ...grouped.cq,
      ...grouped.sq,
      ...grouped.int,
      ...grouped.numeric,
      ...grouped.descriptive,
      ...grouped.other
    );
  });

  const remaining = exam.questions.filter((q: any) => q.id && !matchedQIds.has(q.id));
  if (remaining.length > 0) {
    result.push(...remaining);
  }

  return result;
}

// RUN TESTS
console.log("=== VERIFYING MS EXAM SEQUENTIAL SUBJECT NAVIGATION ===\n");

// Create MS Exam with 4 subjects: 3 questions each
const subjectsConfig = {
  subjects: [
    { name: "Physics", totalMarks: 3, isMandatory: true },
    { name: "Chemistry", totalMarks: 3, isMandatory: true },
    { name: "Higher Math", totalMarks: 3, isMandatory: false },
    { name: "Biology", totalMarks: 3, isMandatory: false }
  ]
};

const rawQuestions = [
  { id: "p1", subject: "পদার্থবিজ্ঞান", type: "mcq", text: "P1" },
  { id: "c1", subject: "রসায়ন", type: "mcq", text: "C1" },
  { id: "m1", subject: "উচ্চতর গণিত", type: "mcq", text: "M1" },
  { id: "b1", subject: "biology", type: "mcq", text: "B1" },
  { id: "p2", subject: "Physics", type: "mcq", text: "P2" },
  { id: "c2", subject: "Chemistry", type: "mcq", text: "C2" },
  { id: "m2", subject: "Higher Math", type: "mcq", text: "M2" },
  { id: "b2", subject: "Biology", type: "mcq", text: "B2" },
  { id: "p3", subject: "পদার্থ", type: "mcq", text: "P3" },
  { id: "c3", subject: "chem", type: "mcq", text: "C3" },
  { id: "m3", subject: "math", type: "mcq", text: "M3" },
  { id: "b3", subject: "bio", type: "mcq", text: "B3" }
];

const mockExam = {
  id: "test-ms-1",
  subjectType: "MS",
  subjectsConfig,
  questions: rawQuestions,
  shuffleQuestions: true
};

const prepared = prepareExamQuestions(mockExam);
const isMS = detectIsMS(mockExam);
const fullSorted = getFullSortedQuestions({ ...mockExam, questions: prepared }, isMS, subjectsConfig.subjects);

console.log("Question sequence in MS Exam:");
fullSorted.forEach((q, idx) => {
  console.log(`[${idx}] ID: ${q.id}, Subject: ${q.subject}`);
});

// Test: Verify Subject Order
console.log("\nVerifying all Physics questions are together:");
const pIndices = fullSorted.map((q, idx) => matchSubject(q.subject, "Physics") ? idx : -1).filter(idx => idx !== -1);
assert.deepStrictEqual(pIndices, [0, 1, 2], "Physics questions must occupy consecutive indices [0, 1, 2]");
console.log("✅ Physics questions are consecutive [0, 1, 2]");

console.log("Verifying all Chemistry questions are together:");
const cIndices = fullSorted.map((q, idx) => matchSubject(q.subject, "Chemistry") ? idx : -1).filter(idx => idx !== -1);
assert.deepStrictEqual(cIndices, [3, 4, 5], "Chemistry questions must occupy consecutive indices [3, 4, 5]");
console.log("✅ Chemistry questions are consecutive [3, 4, 5]");

console.log("Verifying all Higher Math questions are together:");
const mIndices = fullSorted.map((q, idx) => matchSubject(q.subject, "Higher Math") ? idx : -1).filter(idx => idx !== -1);
assert.deepStrictEqual(mIndices, [6, 7, 8], "Higher Math questions must occupy consecutive indices [6, 7, 8]");
console.log("✅ Higher Math questions are consecutive [6, 7, 8]");

console.log("Verifying all Biology questions are together:");
const bIndices = fullSorted.map((q, idx) => matchSubject(q.subject, "Biology") ? idx : -1).filter(idx => idx !== -1);
assert.deepStrictEqual(bIndices, [9, 10, 11], "Biology questions must occupy consecutive indices [9, 10, 11]");
console.log("✅ Biology questions are consecutive [9, 10, 11]");

// Test: Navigation simulation (Next button)
console.log("\nSimulating 'Next' button presses through MS exam:");
let currentIndex = 0;
const totalQuestions = fullSorted.length;

const getSubjectForIndex = (idx: number) => {
  const q = fullSorted[idx];
  for (const s of subjectsConfig.subjects) {
    if (matchSubject(q.subject, s.name)) return s.name;
  }
  return "Unknown";
};

let currentSubject = getSubjectForIndex(0);
assert.strictEqual(currentSubject, "Physics");

const subjectTransitions: { from: string; to: string; atIndex: number }[] = [];

for (let i = 0; i < totalQuestions - 1; i++) {
  const prevSubj = getSubjectForIndex(currentIndex);
  currentIndex += 1;
  const nextSubj = getSubjectForIndex(currentIndex);

  if (prevSubj !== nextSubj) {
    subjectTransitions.push({ from: prevSubj, to: nextSubj, atIndex: currentIndex });
    console.log(`➡️ Subject transition at index ${currentIndex}: ${prevSubj} -> ${nextSubj}`);
  }
}

assert.strictEqual(subjectTransitions.length, 3, "There should be EXACTLY 3 subject transitions (Physics -> Chemistry -> Higher Math -> Biology)");
assert.deepStrictEqual(subjectTransitions, [
  { from: "Physics", to: "Chemistry", atIndex: 3 },
  { from: "Chemistry", to: "Higher Math", atIndex: 6 },
  { from: "Higher Math", to: "Biology", atIndex: 9 }
], "Subject transitions must happen ONLY at the boundary of each subject");

console.log("✅ Simulation verified: Next button stays within current subject until last question, then moves to next subject!");

// SS EXAM TEST: Verify SS is completely untouched
console.log("\nTesting SS Exam (Single Subject):");
const ssExam = {
  id: "test-ss-1",
  subjectType: "SS",
  questions: [
    { id: "ss1", subject: "Math", type: "cq", text: "CQ1" },
    { id: "ss2", subject: "Math", type: "mcq", text: "MCQ1" },
    { id: "ss3", subject: "Math", type: "mcq", text: "MCQ2" }
  ],
  shuffleQuestions: false
};
const ssIsMS = detectIsMS(ssExam);
assert.strictEqual(ssIsMS, false, "SS exam must not be detected as MS");
const ssSorted = getFullSortedQuestions(ssExam, ssIsMS, []);
// In SS exam: MCQs come before CQ as per original fullSortedQuestions logic
assert.strictEqual(ssSorted[0].type, "mcq");
assert.strictEqual(ssSorted[1].type, "mcq");
assert.strictEqual(ssSorted[2].type, "cq");
console.log("✅ SS Exam behavior is completely untouched!");

console.log("\n🎉 ALL VERIFICATION TESTS PASSED!");
