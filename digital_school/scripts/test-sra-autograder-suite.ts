import { evaluateSRAQuestion, evaluateLegacyDRAsSRA } from '../lib/evaluation/sraEvaluation';

console.log('=====================================================');
console.log('  SRA (STRUCTURED REASONING ASSEMBLY) AUTOGRADER SUITE');
console.log('=====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`, details ? details : '');
  }
}

// 1. TEST CONSTRUCT: Numeric Tolerance & Units
console.log('--- 1. CONSTRUCT: Numeric Tolerance & Units ---');
const q1 = {
  id: 'q1',
  stem: 'Find gravitational acceleration on Earth surface',
  marks: 4,
  components: [
    {
      id: 'step_1_calc',
      kind: 'CONSTRUCT',
      label: 'Step 1: Calculate g',
      expectedAnswer: '9.81',
      unit: 'm/s^2',
      tolerance: 0.05,
      marks: 2,
      evaluationMode: 'NUMERIC'
    },
    {
      id: 'step_2_unit',
      kind: 'CONSTRUCT',
      label: 'Step 2: String key',
      expectedAnswer: 'GRAVITY',
      marks: 2,
      evaluationMode: 'TEXT'
    }
  ]
};

const res1_perfect = evaluateSRAQuestion(q1 as any, {
  step_1_calc: '9.8',
  step_2_unit: 'gravity'
});
assert(res1_perfect.isCorrect && res1_perfect.score === 4, 'Numeric within tolerance + case-insensitive text match (Score 4/4)', res1_perfect);

const res1_wrong = evaluateSRAQuestion(q1 as any, {
  step_1_calc: '12.5',
  step_2_unit: 'gravity'
});
assert(res1_wrong.score === 2 && !res1_wrong.isCorrect, 'Numeric out of tolerance yields partial score (Score 2/4)', res1_wrong);

// 2. TEST CONSTRUCT: Algebraic & Symbolic Equivalence
console.log('\n--- 2. CONSTRUCT: Algebraic & Symbolic Equivalence ---');
const q2 = {
  id: 'q2',
  stem: 'Kinetic energy formula',
  marks: 3,
  components: [
    {
      id: 'step_1_expr',
      kind: 'CONSTRUCT',
      label: 'Kinetic Energy Formula',
      expectedAnswer: '\\frac{1}{2}mv^2',
      marks: 3,
      evaluationMode: 'EXPRESSION'
    }
  ]
};

const res2_equiv1 = evaluateSRAQuestion(q2 as any, { step_1_expr: '0.5 * m * v^2' });
assert(res2_equiv1.isCorrect && res2_equiv1.score === 3, 'Algebraic equivalence: 0.5 * m * v^2 == \\frac{1}{2}mv^2', res2_equiv1);

const res2_equiv2 = evaluateSRAQuestion(q2 as any, { step_1_expr: '(m*v^2)/2' });
assert(res2_equiv2.isCorrect && res2_equiv2.score === 3, 'Algebraic equivalence: (m*v^2)/2 == \\frac{1}{2}mv^2', res2_equiv2);

// 3. TEST EVIDENCE_SELECT: Single Choice, Multi Choice & Penalties
console.log('\n--- 3. EVIDENCE_SELECT: Single & Multi-Select with Penalties ---');
const q3 = {
  id: 'q3',
  stem: 'Evidence Selection for Newton 3rd Law',
  marks: 4,
  components: [
    {
      id: 'step_1_evidence',
      kind: 'EVIDENCE_SELECT',
      label: 'Select Conservation Principles',
      marks: 4,
      scoring: 'PARTIAL',
      multiSelect: true,
      options: [
        { id: 'opt_1', text: 'Total momentum is conserved', isCorrect: true },
        { id: 'opt_2', text: 'Forces occur in equal and opposite pairs', isCorrect: true },
        { id: 'opt_3', text: 'Energy is always destroyed by friction', isCorrect: false }
      ]
    }
  ]
};

const res3_full = evaluateSRAQuestion(q3 as any, { step_1_evidence: ['opt_1', 'opt_2'] });
assert(res3_full.isCorrect && res3_full.score === 4, 'Multi-select all correct options selected (Score 4/4)', res3_full);

const res3_partial = evaluateSRAQuestion(q3 as any, { step_1_evidence: ['opt_1'] });
assert(res3_partial.score === 2, 'Multi-select partial selection (Score 2/4)', res3_partial);

const q3_penalty = {
  ...q3,
  components: [
    {
      ...q3.components[0],
      scoring: 'PENALTY'
    }
  ]
};
const res3_penalty = evaluateSRAQuestion(q3_penalty as any, { step_1_evidence: ['opt_1', 'opt_3'] });
assert(res3_penalty.score === 0, 'Multi-select with distractor penalty (Score 0/4)', res3_penalty);

// 4. TEST ORDER: Sequence Ordering Autograder
console.log('\n--- 4. ORDER: Sequence Ordering Autograder ---');
const q4 = {
  id: 'q4',
  stem: 'Order the biological mitosis steps',
  marks: 3,
  components: [
    {
      id: 'step_1_order',
      kind: 'ORDER',
      label: 'Arrange in correct sequence',
      marks: 3,
      scoring: 'ALL_OR_NOTHING',
      items: [
        { id: 's1', text: 'Prophase' },
        { id: 's2', text: 'Metaphase' },
        { id: 's3', text: 'Anaphase' }
      ],
      correctOrder: ['s1', 's2', 's3']
    }
  ]
};

const res4_correct = evaluateSRAQuestion(q4 as any, { step_1_order: ['s1', 's2', 's3'] });
assert(res4_correct.isCorrect && res4_correct.score === 3, 'Sequence ordering exact match (Score 3/3)', res4_correct);

const res4_wrong = evaluateSRAQuestion(q4 as any, { step_1_order: ['s2', 's1', 's3'] });
assert(!res4_wrong.isCorrect && res4_wrong.score === 0, 'Sequence ordering incorrect order (Score 0/3)', res4_wrong);

// 5. TEST RELATION: Directed & Undirected Graph Edges
console.log('\n--- 5. RELATION: Graph Edge Relational Matching ---');
const q5 = {
  id: 'q5',
  stem: 'Enzyme substrate reaction relations',
  marks: 2,
  components: [
    {
      id: 'step_1_graph',
      kind: 'RELATION',
      label: 'Link cause and effect',
      marks: 2,
      scoring: 'ALL_OR_NOTHING',
      expectedEdges: [
        { source: 'enzyme', relation: 'catalyzes', target: 'reaction' },
        { source: 'inhibitor', relation: 'blocks', target: 'enzyme' }
      ]
    }
  ]
};

const res5_correct = evaluateSRAQuestion(q5 as any, {
  step_1_graph: [
    { source: 'enzyme', relation: 'catalyzes', target: 'reaction' },
    { source: 'inhibitor', relation: 'blocks', target: 'enzyme' }
  ]
});
assert(res5_correct.isCorrect && res5_correct.score === 2, 'Graph relational edge exact match (Score 2/2)', res5_correct);

// 6. TEST LEGACY DR MIGRATION & ADAPTER
console.log('\n--- 6. LEGACY DR COMPATIBILITY & ADAPTER ---');
const legacyDrQ = {
  id: 'dr_legacy_1',
  questionText: 'What is the powerhouse of the cell?',
  marks: 5,
  modelAnswer: 'MITOCHONDRIA',
  reasonOptions: [
    { id: 'r1', text: 'Mitochondria synthesizes cellular ATP through oxidative phosphorylation', isCorrect: true },
    { id: 'r2', text: 'Mitochondria stores excess starch granules', isCorrect: false }
  ]
};

const legacyRes_correct = evaluateSRAQuestion(legacyDrQ as any, {
  answer: 'mitochondria',
  reason: 'r1',
  confidence: 5
});
assert(legacyRes_correct.isCorrect && legacyRes_correct.score === 5, 'Legacy DR automatic runtime conversion & scoring (Score 5/5)', legacyRes_correct);

const legacyRes_part = evaluateSRAQuestion(legacyDrQ as any, {
  answer: 'mitochondria',
  reason: 'r2'
});
assert(legacyRes_part.score === 2.5, 'Legacy DR partial credit on right answer but wrong reason (Score 2.5/5)', legacyRes_part);

console.log('\n=====================================================');
console.log(`  SRA TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log('=====================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
