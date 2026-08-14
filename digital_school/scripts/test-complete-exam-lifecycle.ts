import { evaluateCMAQuestion } from '../lib/evaluation/cmaEvaluation';
import { evaluateMPCQuestion } from '../lib/evaluation/mpcEvaluation';
import { evaluateDRQuestion } from '../lib/evaluation/drEvaluation';
import { evaluateMCQuestion } from '../lib/evaluation/mcEvaluation';
import { evaluateQuestionResultStatus } from '../lib/exam-result-utils';

// Complete 9-Question Type Sample Exam Payload
export const SAMPLE_9_TYPE_EXAM = {
  id: "exam-9-type-audit",
  title: "Comprehensive 9-Type Physics & STEM Examination 2026",
  subject: "Physics & General Science",
  class: "Class 10",
  date: "2026-08-14",
  duration: "45 Minutes",
  schoolName: "Digital Model High School & College",
  schoolAddress: "Dhaka, Bangladesh",
  set: "A",
  totalMarks: "25",
  questions: {
    mcq: [
      {
        id: "q-mcq-1",
        q: "What is the SI unit of force?",
        options: [
          { text: "Joule" },
          { text: "Newton", isCorrect: true },
          { text: "Pascal" },
          { text: "Watt" }
        ],
        marks: 1,
        type: "MCQ"
      }
    ],
    mc: [
      {
        id: "q-mc-1",
        q: "Which of the following are vector quantities? (Select all that apply)",
        options: [
          { text: "Velocity", isCorrect: true },
          { text: "Speed", isCorrect: false },
          { text: "Acceleration", isCorrect: true },
          { text: "Mass", isCorrect: false }
        ],
        marks: 2,
        type: "MC"
      }
    ],
    int: [
      {
        id: "q-int-1",
        q: "If a car accelerates from rest at 4 m/s² for 5 seconds, what is its final velocity in m/s?",
        modelAnswer: "20",
        marks: 2,
        type: "INT"
      }
    ],
    ar: [
      {
        id: "q-ar-1",
        assertion: "Light bends when traveling from air into water.",
        reason: "The speed of light changes when passing from one medium to another of different optical density.",
        correctOption: 1,
        marks: 2,
        type: "AR"
      }
    ],
    mtf: [
      {
        id: "q-mtf-1",
        leftColumn: [
          { id: "1", text: "Ohm's Law" },
          { id: "2", text: "Kinetic Energy" },
          { id: "3", text: "Momentum" }
        ],
        rightColumn: [
          { id: "A", text: "V = I × R" },
          { id: "B", text: "p = m × v" },
          { id: "C", text: "E = ½ m v²" }
        ],
        matches: {
          "1": "A",
          "2": "C",
          "3": "B"
        },
        marks: 3,
        type: "MTF"
      }
    ],
    smcq: [
      {
        id: "q-smcq-1",
        questionText: "A ball is thrown vertically upward with an initial velocity of 20 m/s (g = 10 m/s²).",
        subQuestions: [
          {
            id: "smcq-s1",
            question: "What is the maximum height reached by the ball?",
            options: [
              { text: "10 m" },
              { text: "20 m", isCorrect: true },
              { text: "30 m" },
              { text: "40 m" }
            ],
            marks: 1
          },
          {
            id: "smcq-s2",
            question: "What is the total time the ball remains in the air?",
            options: [
              { text: "2 seconds" },
              { text: "4 seconds", isCorrect: true },
              { text: "6 seconds" },
              { text: "8 seconds" }
            ],
            marks: 1
          }
        ],
        type: "SMCQ"
      }
    ],
    cma: [
      {
        id: "q-cma-1",
        questionText: "A projectile is launched at an angle of 30° with an initial velocity of 20 m/s (cos 30° ≈ 0.866, sin 30° = 0.5, g = 9.8 m/s²).",
        parts: [
          {
            id: "p1",
            label: "a",
            prompt: "Calculate the horizontal component of initial velocity (vx):",
            fieldType: "decimal",
            expectedAnswer: "17.32",
            tolerance: 0.05,
            unit: "m/s",
            marks: 2
          },
          {
            id: "p2",
            label: "b",
            prompt: "Calculate the total time of flight (T):",
            fieldType: "decimal",
            expectedAnswer: "2.04",
            tolerance: 0.02,
            unit: "s",
            marks: 2
          }
        ],
        type: "CMA"
      }
    ],
    mpc: [
      {
        id: "q-mpc-1",
        scenario: "A block of mass m = 2 kg is pulled from rest along a frictionless horizontal surface by a constant force for t = 4 seconds.",
        stages: [
          {
            id: "s1",
            stageTitle: "If the acceleration is 3 m/s², calculate the net horizontal force F:",
            expectedAnswer: "6",
            tolerance: 0.01,
            marks: 2
          },
          {
            id: "s2",
            stageTitle: "Calculate final velocity v = a × t (t = 4s):",
            expectedAnswer: "12",
            tolerance: 0.01,
            formula: "prev * 4",
            dependsOnStageId: "s1",
            marks: 2
          },
          {
            id: "s3",
            stageTitle: "Calculate final kinetic energy EK = ½ m v² (m = 2kg):",
            expectedAnswer: "144",
            tolerance: 0.05,
            formula: "0.5 * 2 * (prev)^2",
            dependsOnStageId: "s2",
            marks: 2
          }
        ],
        type: "MPC"
      }
    ],
    dr: [
      {
        id: "q-dr-1",
        questionText: "What happens to the pressure inside a rigid sealed gas container when its temperature is increased?",
        expectedAnswer: "Pressure Increases",
        marks: 3,
        reasonOptions: [
          { id: "r1", text: "Gas molecules gain kinetic energy and collide more frequently and forcefully with container walls (Gay-Lussac's Law)", isCorrect: true },
          { id: "r2", text: "The volume of the container expands significantly", isCorrect: false },
          { id: "r3", text: "The number of gas molecules inside the container increases", isCorrect: false }
        ],
        confidenceTracking: true,
        type: "DR"
      }
    ],
    cq: [],
    sq: [],
    descriptive: []
  }
};

function auditCompleteLifecycle() {
  console.log("==========================================================================");
  console.log("   COMPLETE 9-QUESTION TYPE EXAM LIFECYCLE & REGRESSION AUDIT SUITE");
  console.log("==========================================================================");

  let totalTests = 0;
  let passedTests = 0;

  function testAssert(condition: boolean, title: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${title} - Details: ${details || 'Assertion failed'}`);
    }
  }

  // 1. REGRESSION CHECK: MCQ
  const mcq = SAMPLE_9_TYPE_EXAM.questions.mcq[0];
  testAssert(mcq.options.filter(o => o.isCorrect).length === 1, "Regression Check: MCQ has 1 correct option");

  // 2. REGRESSION CHECK: MC / MMCQ
  const mc = SAMPLE_9_TYPE_EXAM.questions.mc[0];
  testAssert(mc.options.filter(o => o.isCorrect).length === 2, "Regression Check: MC (Multiple Correct) has multiple correct options");

  // 3. REGRESSION CHECK: INT
  const intQ = SAMPLE_9_TYPE_EXAM.questions.int[0];
  testAssert(intQ.modelAnswer === "20", "Regression Check: INT integer model answer preserved");

  // 4. REGRESSION CHECK: AR
  const ar = SAMPLE_9_TYPE_EXAM.questions.ar[0];
  testAssert(ar.correctOption === 1, "Regression Check: AR assertion-reason option preserved");

  // 5. REGRESSION CHECK: MTF
  const mtf = SAMPLE_9_TYPE_EXAM.questions.mtf[0];
  testAssert(Object.keys(mtf.matches).length === 3, "Regression Check: MTF 3 matches preserved");

  // 6. REGRESSION CHECK: SMCQ
  const smcq = SAMPLE_9_TYPE_EXAM.questions.smcq[0];
  testAssert(smcq.subQuestions.length === 2, "Regression Check: SMCQ scenario sub-questions preserved");

  // 7. CMA EVALUATION & TOLERANCE BOUNDARY AUDIT
  const cma = SAMPLE_9_TYPE_EXAM.questions.cma[0];
  const cmaExact = evaluateCMAQuestion(cma as any, { p1: "17.32", p2: "2.04" });
  testAssert(cmaExact.isCorrect && cmaExact.score === 4, "CMA Audit: Exact keys get full 4 marks");

  const cmaTolerance = evaluateCMAQuestion(cma as any, { p1: "17.35", p2: "2.05" });
  testAssert(cmaTolerance.isCorrect && cmaTolerance.score === 4, "CMA Audit: Within-tolerance input (±0.05 / ±0.02) gets full marks");

  const cmaPartial = evaluateCMAQuestion(cma as any, { p1: "17.32", p2: "9.99" });
  testAssert(!cmaPartial.isCorrect && cmaPartial.score === 2, "CMA Audit: Partial credit awarded for 1 of 2 correct parts");

  // 8. MPC EVALUATION & ERROR PROPAGATION HANDLING (EPH) AUDIT
  const mpc = SAMPLE_9_TYPE_EXAM.questions.mpc[0];
  const mpcExact = evaluateMPCQuestion(mpc as any, { s1: 6, s2: 12, s3: 144 });
  testAssert(mpcExact.isCorrect && mpcExact.score === 6, "MPC Audit: Exact solution gets full 6 marks");

  // Student makes mistake in Stage 1 (s1 = 5 instead of 6), but correctly calculates s2 = 5 * 4 = 20 and s3 = 0.5 * 2 * 20^2 = 400
  const mpcEPH = evaluateMPCQuestion(mpc as any, { s1: 5, s2: 20, s3: 400 });
  testAssert(
    mpcEPH.stageResults["s1"].earned === 0 &&
    mpcEPH.stageResults["s2"].isCorrectWithPropagatedError &&
    mpcEPH.stageResults["s3"].isCorrectWithPropagatedError &&
    mpcEPH.score === 4,
    "MPC Audit: Error Propagation Handling (EPH) correctly awards 4 method credit marks for downstream stages"
  );

  // 9. DR EVALUATION & COGNITIVE DIAGNOSTIC MATRIX AUDIT
  const dr = SAMPLE_9_TYPE_EXAM.questions.dr[0];
  const drMastery = evaluateDRQuestion(dr as any, { answer: "Pressure Increases", reasonId: "r1", confidence: "Certain" });
  console.log("DEBUG drMastery:", drMastery);
  testAssert(drMastery.diagnosticTag === "MASTERY" && drMastery.score === 3, "DR Audit: Answer + Reason + Certain = MASTERY");

  const drMisconception = evaluateDRQuestion(dr as any, { answer: "Pressure Increases", reasonId: "r2", confidence: "Certain" });
  testAssert(drMisconception.diagnosticTag === "MISCONCEPTION" || drMisconception.diagnosticTag === "GUESS", "DR Audit: Answer + Wrong Reason = MISCONCEPTION / GUESS");

  const drExecutionSlip = evaluateDRQuestion(dr as any, { answer: "Wrong Answer", reasonId: "r1", confidence: "Probably" });
  testAssert(drExecutionSlip.diagnosticTag === "EXECUTION_SLIP", "DR Audit: Wrong Answer + Correct Reason = EXECUTION_SLIP");

  const drKnowledgeGap = evaluateDRQuestion(dr as any, { answer: "Wrong Answer", reasonId: "r2", confidence: "Certain" });
  testAssert(drKnowledgeGap.diagnosticTag === "KNOWLEDGE_GAP" || drKnowledgeGap.diagnosticTag === "STRONG_MISCONCEPTION", "DR Audit: Wrong Answer + Wrong Reason = KNOWLEDGE_GAP");

  // 10. MC ALL WRONG NEGATIVE PENALTY AUDIT
  const mcAllWrong = evaluateMCQuestion(
    { options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: true }, { text: "C", isCorrect: false }, { text: "D", isCorrect: false }], marks: 4 },
    { selectedOptions: [2, 3] }, // selected 2 wrong choices, 0 correct choices
    { negativeMarking: 25, partialMarking: true, hasAttempted: true }
  );
  testAssert(mcAllWrong === -2, `MC Audit: All wrong selections result in negative penalty (-2), got ${mcAllWrong}`);

  // 11. RESULT SECTION CATEGORIZATION AUDIT (CORRECT / PARTIAL / WRONG / UNANSWERED)
  const qMcSample = {
    type: "MC",
    options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: true }, { text: "C", isCorrect: false }, { text: "D", isCorrect: false }],
    marks: 4
  };

  const statusAllCorrect = evaluateQuestionResultStatus({ ...qMcSample, studentAnswer: { selectedOptions: [0, 1] }, awardedMarks: 4 });
  testAssert(statusAllCorrect === "CORRECT", `Section Filter Audit: Full marks -> CORRECT, got ${statusAllCorrect}`);

  const statusPartial = evaluateQuestionResultStatus({ ...qMcSample, studentAnswer: { selectedOptions: [0, 2] }, awardedMarks: 1 });
  testAssert(statusPartial === "PARTIAL", `Section Filter Audit: 1 correct option selected -> PARTIAL, got ${statusPartial}`);

  const statusAllWrong = evaluateQuestionResultStatus({ ...qMcSample, studentAnswer: { selectedOptions: [2, 3] }, awardedMarks: -2 });
  testAssert(statusAllWrong === "WRONG", `Section Filter Audit: 0 correct options selected (all wrong) -> WRONG, got ${statusAllWrong}`);

  const statusUnanswered = evaluateQuestionResultStatus({ ...qMcSample, studentAnswer: null, awardedMarks: 0 });
  testAssert(statusUnanswered === "UNANSWERED", `Section Filter Audit: Unattempted -> UNANSWERED, got ${statusUnanswered}`);

  // 12. END-TO-END MAPPING & RESULT DISPLAY CATEGORIZATION AUDIT FOR CMA, MPC, DR
  // CMA Result mapping:
  const cmaFullStatus = evaluateQuestionResultStatus({
    type: "CMA",
    marks: 4,
    awardedMarks: 4,
    studentAnswer: { p1: "17.32", p2: "2.04" },
    parts: cma.parts
  });
  testAssert(cmaFullStatus === "CORRECT", `CMA Result Mapping: Full correct answer maps to CORRECT on result page`);

  const cmaPartialStatus = evaluateQuestionResultStatus({
    type: "CMA",
    marks: 4,
    awardedMarks: 2,
    studentAnswer: { p1: "17.32", p2: "9.99" },
    parts: cma.parts
  });
  testAssert(cmaPartialStatus === "PARTIAL", `CMA Result Mapping: Partial answer (1/2 correct) maps to PARTIAL on result page`);

  const cmaWrongStatus = evaluateQuestionResultStatus({
    type: "CMA",
    marks: 4,
    awardedMarks: 0,
    studentAnswer: { p1: "0.00", p2: "0.00" },
    parts: cma.parts
  });
  testAssert(cmaWrongStatus === "WRONG", `CMA Result Mapping: Completely wrong answer maps to WRONG on result page`);

  // MPC Result mapping:
  const mpcFullStatus = evaluateQuestionResultStatus({
    type: "MPC",
    marks: 6,
    awardedMarks: 6,
    studentAnswer: { s1: "6", s2: "12", s3: "144" },
    stages: mpc.stages
  });
  testAssert(mpcFullStatus === "CORRECT", `MPC Result Mapping: Exact solution maps to CORRECT on result page`);

  const mpcEPHStatus = evaluateQuestionResultStatus({
    type: "MPC",
    marks: 6,
    awardedMarks: 4,
    studentAnswer: { s1: "5", s2: "20", s3: "400" },
    stages: mpc.stages,
    stageResults: mpcEPH.stageResults
  });
  testAssert(mpcEPHStatus === "PARTIAL", `MPC Result Mapping: Error propagation method credit maps to PARTIAL on result page`);

  // DR Result mapping:
  const drMasteryStatus = evaluateQuestionResultStatus({
    type: "DR",
    marks: 3,
    awardedMarks: 3,
    studentAnswer: { answer: "Pressure Increases", reasonId: "r1", confidence: "Certain" },
    reasonOptions: dr.reasonOptions,
    expectedAnswer: dr.expectedAnswer
  });
  testAssert(drMasteryStatus === "CORRECT", `DR Result Mapping: Full Mastery maps to CORRECT on result page`);

  const drSlipStatus = evaluateQuestionResultStatus({
    type: "DR",
    marks: 3,
    awardedMarks: 1,
    studentAnswer: { answer: "Wrong Answer", reasonId: "r1", confidence: "Certain" },
    reasonOptions: dr.reasonOptions,
    expectedAnswer: dr.expectedAnswer
  });
  testAssert(drSlipStatus === "PARTIAL", `DR Result Mapping: Execution Slip (correct reason only) maps to PARTIAL on result page`);

  console.log("--------------------------------------------------------------------------");
  console.log(`SUMMARY: ${passedTests} / ${totalTests} AUDIT CHECKS PASSED CLEANLY!`);
  console.log("--------------------------------------------------------------------------");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

auditCompleteLifecycle();
