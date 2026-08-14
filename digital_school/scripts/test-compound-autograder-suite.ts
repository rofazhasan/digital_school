import { evaluateCMAQuestion } from '../lib/evaluation/cmaEvaluation';
import { evaluateMPCQuestion, validateMPCDependencies } from '../lib/evaluation/mpcEvaluation';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

console.log("==========================================================================");
console.log("   PRODUCTION-GRADE COMPOUND CMA + MPC AUTOGRADER ENGINE TEST SUITE");
console.log("==========================================================================");

// --------------------------------------------------------------------------
// 1. CMA COMPOUND MULTI-PART QUESTION TESTS (Mixed Child Types & Partial Credit)
// --------------------------------------------------------------------------
const cmaQuestion = {
  id: 'cma_1',
  marks: 6,
  parts: [
    {
      id: 'p1',
      type: 'MCQ',
      marks: 1,
      expectedAnswer: 'Mitochondria',
      options: [
        { id: 'opt1', text: 'Mitochondria', isCorrect: true },
        { id: 'opt2', text: 'Nucleus', isCorrect: false }
      ]
    },
    {
      id: 'p2',
      type: 'INT',
      marks: 2,
      expectedAnswer: '20',
      tolerance: 0.01
    },
    {
      id: 'p3',
      type: 'MC',
      marks: 2,
      options: [
        { id: 'a', text: 'Option A', isCorrect: true },
        { id: 'b', text: 'Option B', isCorrect: true },
        { id: 'c', text: 'Option C', isCorrect: false }
      ]
    },
    {
      id: 'p4',
      type: 'DR',
      marks: 1,
      expectedAnswer: 'NEPHRON',
      acceptedAnswers: ['nephron', 'নেফ্রন']
    }
  ]
};

// Test 1: All parts correct
const allCorrectRes = evaluateCMAQuestion(cmaQuestion, {
  p1: 'Mitochondria',
  p2: '20',
  p3: ['Option A', 'Option B'],
  p4: 'নেফ্রন'
});
assert(allCorrectRes.score === 6, 'CMA: All parts correct awards full 6 marks');
assert(allCorrectRes.isCorrect === true, 'CMA: All parts correct status is true');
assert(allCorrectRes.partResults['p1'].status === 'CORRECT', 'CMA: MCQ child part status is CORRECT');
assert(allCorrectRes.partResults['p2'].status === 'CORRECT', 'CMA: INT child part status is CORRECT');
assert(allCorrectRes.partResults['p3'].status === 'CORRECT', 'CMA: MC child part status is CORRECT');
assert(allCorrectRes.partResults['p4'].status === 'CORRECT', 'CMA: DR child part status is CORRECT');

// Test 2: Partial credit & Unanswered child parts
const partialCmaRes = evaluateCMAQuestion(cmaQuestion, {
  p1: 'Mitochondria', // Correct (1/1)
  p2: '99',           // Incorrect (0/2)
  p3: ['Option A'],   // Partial (1/2)
  p4: ''              // Unanswered (0/1)
});
assert(partialCmaRes.partResults['p1'].status === 'CORRECT', 'CMA Partial: Part 1 is CORRECT');
assert(partialCmaRes.partResults['p2'].status === 'INCORRECT', 'CMA Partial: Part 2 is INCORRECT');
assert(partialCmaRes.partResults['p3'].status === 'PARTIAL', 'CMA Partial: Part 3 is PARTIAL');
assert(partialCmaRes.partResults['p4'].status === 'UNANSWERED', 'CMA Partial: Part 4 is UNANSWERED');
assert(partialCmaRes.score === 2, `CMA Partial: Score is 2/6 (got ${partialCmaRes.score})`);

// --------------------------------------------------------------------------
// 2. MPC MULTI-STEP PROBLEM CHAIN & FOLLOW-THROUGH ERROR PROPAGATION (EPH)
// --------------------------------------------------------------------------
const mpcQuestion = {
  id: 'mpc_physics',
  marks: 6,
  stages: [
    {
      id: 'p1',
      stageTitle: 'Calculate acceleration',
      marks: 2,
      expectedAnswer: '5',
      tolerance: 0.05
    },
    {
      id: 'p2',
      stageTitle: 'Calculate velocity after 4 sec',
      marks: 2,
      expectedAnswer: '20',
      dependsOnStageId: 'p1',
      gradingMode: 'FOLLOW_THROUGH',
      formula: 'p1 * 4',
      tolerance: 0.05
    },
    {
      id: 'p3',
      stageTitle: 'Calculate kinetic energy',
      marks: 2,
      expectedAnswer: '400',
      dependsOnStageId: 'p2',
      gradingMode: 'FOLLOW_THROUGH',
      formula: '0.5 * 2 * p2^2',
      tolerance: 0.05
    }
  ]
};

// Test 3: All stages correct directly
const mpcExactRes = evaluateMPCQuestion(mpcQuestion, {
  p1: '5',
  p2: '20',
  p3: '400'
});
assert(mpcExactRes.score === 6, 'MPC: Exact solution awards full 6 marks');
assert(mpcExactRes.stageResults['p1'].status === 'CORRECT', 'MPC Exact: Stage 1 is CORRECT');
assert(mpcExactRes.stageResults['p2'].status === 'CORRECT', 'MPC Exact: Stage 2 is CORRECT');
assert(mpcExactRes.stageResults['p3'].status === 'CORRECT', 'MPC Exact: Stage 3 is CORRECT');

// Test 4: Follow-Through Error Propagation (P1 Wrong, P2 and P3 Follow-Through Correct)
// Student answers: P1 = 4 (Wrong, expected 5).
// P2 = 4 * 4 = 16.
// P3 = 0.5 * 2 * 16^2 = 256.
const mpcFollowThroughRes = evaluateMPCQuestion(mpcQuestion, {
  p1: '4',   // Wrong (expected 5)
  p2: '16',  // Follow-through correct (4 * 4 = 16)
  p3: '256'  // Follow-through correct (16^2 = 256)
});

assert(mpcFollowThroughRes.stageResults['p1'].status === 'INCORRECT', 'MPC EPH: Stage 1 is INCORRECT');
assert(mpcFollowThroughRes.stageResults['p2'].status === 'FOLLOW_THROUGH_CORRECT', 'MPC EPH: Stage 2 is FOLLOW_THROUGH_CORRECT');
assert(mpcFollowThroughRes.stageResults['p3'].status === 'FOLLOW_THROUGH_CORRECT', 'MPC EPH: Stage 3 is FOLLOW_THROUGH_CORRECT');
assert(mpcFollowThroughRes.score === 4, `MPC EPH: Score is 4/6 method credit (got ${mpcFollowThroughRes.score})`);

// Test 5: Genuinely Wrong Downstream Answer
const mpcDownstreamWrongRes = evaluateMPCQuestion(mpcQuestion, {
  p1: '4',   // Wrong
  p2: '16',  // Follow-through correct
  p3: '999'  // Genuinely wrong answer (neither direct nor follow-through match)
});
assert(mpcDownstreamWrongRes.stageResults['p3'].status === 'INCORRECT', 'MPC EPH: Genuinely wrong downstream answer is marked INCORRECT');
assert(mpcDownstreamWrongRes.score === 2, `MPC EPH: Score is 2/6 (got ${mpcDownstreamWrongRes.score})`);

// --------------------------------------------------------------------------
// 3. CIRCULAR DEPENDENCY VALIDATION (DAG CHECK)
// --------------------------------------------------------------------------
const validStages = [
  { id: 's1', marks: 1, expectedAnswer: '10' },
  { id: 's2', dependsOnStageId: 's1', marks: 1, expectedAnswer: '20' },
  { id: 's3', dependsOnStageId: 's2', marks: 1, expectedAnswer: '30' }
];

const cycleStages = [
  { id: 's1', dependsOnStageId: 's3', marks: 1, expectedAnswer: '10' },
  { id: 's2', dependsOnStageId: 's1', marks: 1, expectedAnswer: '20' },
  { id: 's3', dependsOnStageId: 's2', marks: 1, expectedAnswer: '30' }
];

assert(validateMPCDependencies(validStages).isValid === true, 'DAG Validation: Linear chain s1 -> s2 -> s3 is VALID');
const cycleRes = validateMPCDependencies(cycleStages);
assert(cycleRes.isValid === false, 'DAG Validation: Cycle s1 -> s2 -> s3 -> s1 is REJECTED as INVALID');
assert(!!cycleRes.error?.includes('Circular dependency detected'), 'DAG Validation: Returns clean cycle error message');

console.log("--------------------------------------------------------------------------");
console.log("SUMMARY: ALL COMPOUND CMA + MPC AUTOGRADER TESTS PASSED CLEANLY!");
console.log("--------------------------------------------------------------------------");
