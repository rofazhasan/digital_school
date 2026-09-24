import assert from 'assert';
import { evaluateSubmission } from '../lib/exam-logic';

// 1. Mock DB functions inside prisma
global.prisma = {
  examStudentMap: { findFirst: async () => null, findUnique: async () => null },
  examSet: { findUnique: async () => null, findFirst: async () => null, findMany: async () => [] },
  examSubmission: { update: async () => ({}) },
  result: { upsert: async () => ({}), findUnique: async () => null }
} as any;

console.log("=== RUNNING MS EVALUATION & DISQUALIFICATION TEST SUITE ===\n");

// MS Exam with 3 mandatory subjects (Physics, Chemistry, ICT) and 3 optional choices (Only Biology, Only Higher Math, Bio+Math)
const msExam = {
  id: "ms-exam-01",
  subjectType: "MS",
  totalMarks: 100,
  mcqNegativeMarking: 20, // 20% negative marking (on 1.25 marks = 0.25 deduction)
  requiredOptionalCount: 1,
  subjectsConfig: {
    subjects: [
      { name: "Physics", totalMarks: 31.25, isMandatory: true },
      { name: "Chemistry", totalMarks: 31.25, isMandatory: true },
      { name: "ICT", totalMarks: 6.25, isMandatory: true },
      { name: "Only Biology (25 Qs)", totalMarks: 31.25, isMandatory: false },
      { name: "Only Higher Math (25 Qs)", totalMarks: 31.25, isMandatory: false },
      { name: "Bio (12 Qs) + H.Math (13 Qs)", totalMarks: 31.25, isMandatory: false }
    ],
    mandatoryCount: 3,
    optionalCount: 3,
    requiredOptionalCount: 1
  }
};

const questionsList = [
  // Physics (Mandatory)
  { id: "p1", type: "MCQ", marks: 1.25, subject: "Physics", options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] },
  { id: "p2", type: "MCQ", marks: 1.25, subject: "Physics", options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] },
  // Chemistry (Mandatory)
  { id: "c1", type: "MCQ", marks: 1.25, subject: "Chemistry", options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] },
  // Only Biology (Optional)
  { id: "b1", type: "MCQ", marks: 1.25, subject: "Only Biology (25 Qs)", options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] },
  // Only Higher Math (Optional)
  { id: "m1", type: "MCQ", marks: 1.25, subject: "Only Higher Math (25 Qs)", options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] },
];

const examSet = {
  id: "set-01",
  examId: "ms-exam-01",
  questionsJson: JSON.stringify(questionsList)
};

async function testScenario1_NegativeMarkingDeduction() {
  console.log("Test 1: Negative Marking Deduction within Allowed Optional Subjects...");
  // Student answers:
  // Physics p1: WRONG (chose B, -0.25)
  // Physics p2: WRONG (chose B, -0.25)
  // Chemistry c1: WRONG (chose B, -0.25)
  // Only Higher Math m1: CORRECT (chose A, +1.25)
  // Only 1 optional subject attempted ("Only Higher Math (25 Qs)") -> Allowed!
  // Net score: 1.25 - 0.25 - 0.25 - 0.25 = 0.50
  const submission = {
    id: "sub-01",
    studentId: "student-01",
    examId: "ms-exam-01",
    examSetId: "set-01",
    answers: {
      p1: 1, // wrong
      p2: 1, // wrong
      c1: 1, // wrong
      m1: 0  // correct
    }
  };

  const res = await evaluateSubmission(submission as any, msExam as any, [examSet] as any, false);

  assert.strictEqual(res.isDisqualified, false, "Student must not be disqualified");
  assert.strictEqual(res.totalScore, 0.50, "Total score must deduct negative marking and equal 0.50");
  assert.strictEqual(res.mcqMarks, 0.50, "MCQ marks must equal 0.50");
  console.log("✅ Test 1 Passed: Deductions accurately subtract from totalScore and mcqMarks.\n");
}

async function testScenario2_DisqualificationOnExceedingOptional() {
  console.log("Test 2: Disqualification when Answering More than Allowed Optional Subjects...");
  // Student answers:
  // Physics p1: WRONG (-0.25)
  // Chemistry c1: WRONG (-0.25)
  // Only Biology b1: WRONG (-0.25) -> Optional subject 1 attempted
  // Only Higher Math m1: CORRECT (+1.25) -> Optional subject 2 attempted
  // Attempted 2 optional subjects, allowed is 1!
  // MUST BE DISQUALIFIED!
  const submission = {
    id: "sub-02",
    studentId: "student-02",
    examId: "ms-exam-01",
    examSetId: "set-01",
    answers: {
      p1: 1,
      c1: 1,
      b1: 1,
      m1: 0
    }
  };

  const res = await evaluateSubmission(submission as any, msExam as any, [examSet] as any, false);

  assert.strictEqual(res.isDisqualified, true, "Student MUST be disqualified for attempting 2 optional subjects");
  assert.strictEqual(res.totalScore, 0, "Total score must be 0 when disqualified");
  assert.strictEqual(res.mcqMarks, 0, "MCQ marks must be 0 when disqualified");
  assert.strictEqual(res.grade, "F (Disqualified)", "Grade must be F (Disqualified)");
  console.log("✅ Test 2 Passed: Student is strictly disqualified and awarded zero marks.\n");
}

async function testScenario3_SingleSubjectExamUntouched() {
  console.log("Test 3: Single Subject (SS) Exam Preservation...");
  const ssExam = {
    id: "ss-exam-01",
    subjectType: "SS",
    totalMarks: 50,
    mcqNegativeMarking: 25,
  };

  const ssQuestions = [
    { id: "sq1", type: "MCQ", marks: 2, options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] },
    { id: "sq2", type: "MCQ", marks: 2, options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] }
  ];

  const ssExamSet = {
    id: "ss-set-01",
    examId: "ss-exam-01",
    questionsJson: JSON.stringify(ssQuestions)
  };

  // 1 correct (+2), 1 wrong (-0.5) -> Net 1.5
  const submission = {
    id: "sub-ss",
    studentId: "student-ss",
    examId: "ss-exam-01",
    examSetId: "ss-set-01",
    answers: { sq1: 0, sq2: 1 }
  };

  const res = await evaluateSubmission(submission as any, ssExam as any, [ssExamSet] as any, false);

  assert.strictEqual(res.totalScore, 1.5, "SS exam evaluation must remain unchanged at 1.5");
  assert.strictEqual(res.mcqMarks, 1.5, "SS MCQ marks must be 1.5");
  console.log("✅ Test 3 Passed: Single Subject exam evaluation is 100% backward compatible.\n");
}

async function runAll() {
  await testScenario1_NegativeMarkingDeduction();
  await testScenario2_DisqualificationOnExceedingOptional();
  await testScenario3_SingleSubjectExamUntouched();
  console.log("🎉 ALL MS EVALUATION & DISQUALIFICATION TESTS PASSED SUCCESSFULLY!");
}

runAll().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
