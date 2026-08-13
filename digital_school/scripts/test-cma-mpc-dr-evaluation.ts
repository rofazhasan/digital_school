import { evaluateCMAQuestion } from '../lib/evaluation/cmaEvaluation';
import { evaluateMPCQuestion } from '../lib/evaluation/mpcEvaluation';
import { evaluateDRQuestion } from '../lib/evaluation/drEvaluation';

function runTests() {
  console.log("=== RUNNING CMA / MPC / DR EVALUATION TEST SUITE ===");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // --- 1. CMA TESTS ---
  console.log("\n--- Testing CMA (Constructed Multi-Answer) ---");

  const cmaQ = {
    id: "q-cma-1",
    marks: 4,
    parts: [
      { id: "p1", label: "a", prompt: "Velocity", fieldType: "decimal", expectedAnswer: 17.32, tolerance: 0.05, unit: "m/s", marks: 2 },
      { id: "p2", label: "b", prompt: "Time of flight", fieldType: "decimal", expectedAnswer: 2.04, tolerance: 0.02, unit: "s", marks: 2 }
    ]
  };

  // Test CMA 1: All correct within tolerance
  const cmaRes1 = evaluateCMAQuestion(cmaQ as any, { p1: "17.34", p2: "2.05" });
  assert(cmaRes1.score === 4 && cmaRes1.isCorrect, "CMA-1: All correct within tolerance");

  // Test CMA 2: Partial credit (one correct, one outside tolerance)
  const cmaRes2 = evaluateCMAQuestion(cmaQ as any, { p1: "17.34", p2: "2.50" });
  assert(cmaRes2.score === 2 && !cmaRes2.isCorrect, "CMA-2: Partial credit for 1 of 2 correct parts");

  // Test CMA 3: Unanswered
  const cmaRes3 = evaluateCMAQuestion(cmaQ as any, {});
  assert(cmaRes3.score === 0, "CMA-3: Empty answer receives 0 marks");

  // --- 2. MPC TESTS (Multi-Step Problem Chain with EPH) ---
  console.log("\n--- Testing MPC (Multi-Step Problem Chain with EPH) ---");

  const mpcQ = {
    id: "q-mpc-1",
    marks: 6,
    scenario: "A car accelerates uniformly from rest.",
    stages: [
      { id: "s1", stageTitle: "Calculate acceleration a", expectedAnswer: 5, tolerance: 0.01, marks: 2 },
      { id: "s2", stageTitle: "Calculate velocity v = a * t (t = 4s)", expectedAnswer: 20, tolerance: 0.01, formula: "prev * 4", dependsOnStageId: "s1", marks: 2 },
      { id: "s3", stageTitle: "Calculate kinetic energy EK = 0.5 * m * v^2 (m = 1000kg)", expectedAnswer: 200000, tolerance: 10, formula: "0.5 * 1000 * (prev)^2", dependsOnStageId: "s2", marks: 2 }
    ]
  };

  // Test MPC 1: All correct
  const mpcRes1 = evaluateMPCQuestion(mpcQ as any, { s1: 5, s2: 20, s3: 200000 });
  assert(mpcRes1.score === 6 && mpcRes1.isCorrect, "MPC-1: All stages correct");

  // Test MPC 2: Carried-forward Error (EPH)
  // Student makes calculation error in s1 (a = 4 instead of 5)
  // But correctly calculates s2 = 4 * 4 = 16 and s3 = 0.5 * 1000 * 16^2 = 128000
  const mpcRes2 = evaluateMPCQuestion(mpcQ as any, { s1: 4, s2: 16, s3: 128000 });
  assert(
    mpcRes2.stageResults["s1"].earned === 0 &&
    mpcRes2.stageResults["s2"].isCorrectWithPropagatedError &&
    mpcRes2.stageResults["s3"].isCorrectWithPropagatedError &&
    mpcRes2.score === 4,
    "MPC-2: Error Propagation Handling (EPH) awards method credit for downstream steps"
  );

  // Test MPC 3: Independent error in downstream step
  const mpcRes3 = evaluateMPCQuestion(mpcQ as any, { s1: 5, s2: 20, s3: 9999 });
  assert(mpcRes3.score === 4 && !mpcRes3.stageResults["s3"].isCorrectDirectly, "MPC-3: Independent error in downstream step receives 0 for that stage");

  // --- 3. DR TESTS (Diagnostic Reasoning Matrix) ---
  console.log("\n--- Testing DR (Diagnostic Reasoning Matrix) ---");

  const drQ = {
    id: "q-dr-1",
    marks: 3,
    expectedAnswer: "Increase",
    reasonOptions: [
      { id: "r1", text: "Pressure increases as temperature rises at constant volume (Gay-Lussac's Law)", isCorrect: true },
      { id: "r2", text: "Volume decreases causing higher collision rate", isCorrect: false },
      { id: "r3", text: "Number of molecules increases", isCorrect: false }
    ],
    confidenceTracking: true
  };

  // Test DR 1: Correct Answer + Correct Reason + High Confidence -> MASTERY
  const drRes1 = evaluateDRQuestion(drQ as any, { answer: "Increase", reasonId: "r1", confidence: "Certain" });
  assert(drRes1.diagnosticTag === "MASTERY" && drRes1.score === 3, "DR-1: Correct Answer + Reason = MASTERY");

  // Test DR 2: Correct Answer + Incorrect Reason + High Confidence -> MISCONCEPTION / GUESS
  const drRes2 = evaluateDRQuestion(drQ as any, { answer: "Increase", reasonId: "r2", confidence: "Certain" });
  assert(drRes2.diagnosticTag === "MISCONCEPTION" || drRes2.diagnosticTag === "GUESS", "DR-2: Correct Answer + Wrong Reason = MISCONCEPTION/GUESS");

  // Test DR 3: Incorrect Answer + Correct Reason -> EXECUTION_SLIP
  const drRes3 = evaluateDRQuestion(drQ as any, { answer: "Decrease", reasonId: "r1", confidence: "Probably" });
  assert(drRes3.diagnosticTag === "EXECUTION_SLIP", "DR-3: Wrong Answer + Correct Reason = EXECUTION_SLIP");

  // Test DR 4: Incorrect Answer + Incorrect Reason -> KNOWLEDGE_GAP / STRONG_MISCONCEPTION
  const drRes4 = evaluateDRQuestion(drQ as any, { answer: "Decrease", reasonId: "r2", confidence: "Certain" });
  assert(drRes4.diagnosticTag === "KNOWLEDGE_GAP" || drRes4.diagnosticTag === "STRONG_MISCONCEPTION", "DR-4: Wrong Answer + Wrong Reason = KNOWLEDGE_GAP");

  // Test DR 5: Correct Answer + Correct Reason + Low Confidence -> FRAGILE_MASTERY
  const drRes5 = evaluateDRQuestion(drQ as any, { answer: "Increase", reasonId: "r1", confidence: "Unsure" });
  assert(drRes5.diagnosticTag === "FRAGILE_MASTERY", "DR-5: Correct Answer + Low Confidence = FRAGILE_MASTERY");

  console.log(`\n=== TEST SUMMARY: ${passed} / ${total} PASSED ===`);
  if (passed === total) {
    console.log("SUCCESS: All CMA, MPC, and DR evaluation tests passed cleanly!");
  } else {
    process.exit(1);
  }
}

runTests();
