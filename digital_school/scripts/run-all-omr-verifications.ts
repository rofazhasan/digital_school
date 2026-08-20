/**
 * ROFAZ ACADEMY — MASTER OMR PRODUCTION VERIFICATION & CERTIFICATION SUITE
 * 
 * Executes exhaustive end-to-end tests across the entire physical-to-digital pipeline.
 * Measures statistical metrics (TP, TN, FP, FN, Precision, Recall, Accuracy, FAR, FRR).
 */

import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT, CellROI, BENGALI_DIGITS } from '../lib/omr/geometry-template';
import { classifyBubbleROI } from '../lib/omr/bengali-subtraction-classifier';
import { DigitBubbleReader } from '../lib/omr/digit-bubble-reader';
import { StudentIdentityResolver } from '../lib/omr/student-identity-resolver';
import { CanonicalQuestionSet } from '../lib/omr/exam-set-resolver';
import { PhysicalResponseMapper, PhysicalAnswerEntry } from '../lib/omr/physical-response-mapper';
import { OMRSubmissionAdapter, OMRScanResult } from '../lib/omr/omr-submission-adapter';
import { evaluateSubmission } from '../lib/exam-logic';

interface TestStats {
  tp: number; // Correctly identified filled bubble
  tn: number; // Correctly identified blank bubble
  fp: number; // Blank incorrectly marked as filled (FALSE ACCEPTANCE)
  fn: number; // Filled bubble missed (FALSE REJECTION)
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  latencies: number[];
}

const stats: TestStats = {
  tp: 0,
  tn: 0,
  fp: 0,
  fn: 0,
  totalAssertions: 0,
  passedAssertions: 0,
  failedAssertions: 0,
  latencies: []
};

function assert(condition: boolean, message: string) {
  stats.totalAssertions++;
  if (condition) {
    stats.passedAssertions++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    stats.failedAssertions++;
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

async function runMasterSuite() {
  console.log('================================================================');
  console.log('  ROFAZ ACADEMY — MASTER OMR PRODUCTION CERTIFICATION SUITE');
  console.log('================================================================\n');

  const startTime = Date.now();

  // -------------------------------------------------------------
  // SUITE 1: Template Geometry & Versioning
  // -------------------------------------------------------------
  console.log('--- 1. TEMPLATE GEOMETRY & BOUNDARY VERIFICATION ---');
  const template = generateTemplateGeometry('C_11_12');
  assert(template.canonical.width === CANONICAL_WIDTH && template.canonical.height === CANONICAL_HEIGHT, 'Canonical resolution 2480x3508');
  assert(template.markers.length === 4, '4 Corner markers positioned');
  assert(template.roll.cells.length === 60, 'Roll grid: 6 columns x 10 digits = 60 cells');
  assert(template.registration.cells.length === 70, 'Reg grid: 7 columns x 10 digits = 70 cells');
  assert(template.answers.cells.length === 400, 'Answer grid: 100 questions x 4 options = 400 cells');

  // Verify non-overlapping boundaries
  let allInside = true;
  for (const cell of [...template.roll.cells, ...template.registration.cells, ...template.answers.cells]) {
    if (cell.bounds.x < 0 || cell.bounds.y < 0 || cell.bounds.x + cell.bounds.width > CANONICAL_WIDTH || cell.bounds.y + cell.bounds.height > CANONICAL_HEIGHT) {
      allInside = false;
      break;
    }
  }
  assert(allInside, 'All semantic bubble cells strictly within physical canvas boundaries');

  // -------------------------------------------------------------
  // SUITE 2: Synthetic Bubble Matrix & Classifier Testing
  // -------------------------------------------------------------
  console.log('\n--- 2. BUBBLE INK CLASSIFICATION & VARIANT CONDITIONS ---');
  const dummyCell: CellROI = {
    id: 'test_ans_1_A',
    type: 'ANSWER',
    qNo: 1,
    optionLabel: 'A',
    center: { x: 50, y: 50 },
    radius: 20,
    bounds: { x: 30, y: 30, width: 40, height: 40 },
    printedChar: 'A'
  };
  const W = 100, H = 100;

  function makeBuffer(fn: (x: number, y: number, cx: number, cy: number, r: number) => number): Uint8ClampedArray {
    const data = new Uint8ClampedArray(W * H * 4);
    const cx = dummyCell.center.x;
    const cy = dummyCell.center.y;
    const r = dummyCell.radius;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const v = fn(x, y, cx, cy, r);
        const idx = (y * W + x) * 4;
        data[idx] = v; data[idx + 1] = v; data[idx + 2] = v; data[idx + 3] = 255;
      }
    }
    return data;
  }

  // 2.1 Blank bubble
  const blankBuf = makeBuffer((x, y, cx, cy, r) => Math.abs(Math.hypot(x - cx, y - cy) - r) <= 2 ? 50 : 255);
  const blankRes = classifyBubbleROI(blankBuf, W, H, dummyCell);
  assert(blankRes.status === 'EMPTY', 'Empty/Blank bubble classified as EMPTY');
  if (blankRes.status === 'EMPTY') stats.tn++; else stats.fp++;

  // 2.2 Dark filled bubble
  const darkBuf = makeBuffer((x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) <= r ? 20 : 255);
  const darkRes = classifyBubbleROI(darkBuf, W, H, dummyCell);
  assert(darkRes.status === 'FILLED', 'Dark pencil/pen mark classified as FILLED');
  if (darkRes.status === 'FILLED') stats.tp++; else stats.fn++;

  // 2.3 Medium filled bubble (HB pencil)
  const medBuf = makeBuffer((x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) <= r * 0.9 ? 70 : 255);
  const medRes = classifyBubbleROI(medBuf, W, H, dummyCell);
  assert(medRes.status === 'FILLED', 'Medium fill mark classified as FILLED');
  if (medRes.status === 'FILLED') stats.tp++; else stats.fn++;

  // 2.4 Erased mark (residual faint smudging)
  const eraseBuf = makeBuffer((x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) <= r ? 210 : 255);
  const eraseRes = classifyBubbleROI(eraseBuf, W, H, dummyCell);
  assert(eraseRes.status === 'EMPTY', 'Erased graphite smudge classified as EMPTY');
  if (eraseRes.status === 'EMPTY') stats.tn++; else stats.fp++;

  // 2.5 Stray outside mark
  const outBuf = makeBuffer((x, y, cx, cy, r) => {
    const d = Math.hypot(x - cx, y - cy);
    return (d > r + 5 && d < r + 15) ? 20 : 255;
  });
  const outRes = classifyBubbleROI(outBuf, W, H, dummyCell);
  assert(outRes.status === 'EMPTY', 'Stray mark outside bubble border classified as EMPTY');
  if (outRes.status === 'EMPTY') stats.tn++; else stats.fp++;

  // -------------------------------------------------------------
  // SUITE 3: Roll & Registration Matrix Verification
  // -------------------------------------------------------------
  console.log('\n--- 3. ROLL & REGISTRATION DIGIT EXTRACTION ---');
  function createTestDigitCells(numCols: number, type: 'ROLL' | 'REG'): CellROI[] {
    const cells: CellROI[] = [];
    for (let col = 0; col < numCols; col++) {
      for (let digit = 0; digit <= 9; digit++) {
        const cx = 10 + col * 30 + 12;
        const cy = 10 + digit * 30 + 12;
        cells.push({
          id: `${type}_c${col}_r${digit}`,
          type,
          colIndex: col,
          rowIndex: digit,
          optionLabel: digit.toString(),
          center: { x: cx, y: cy },
          radius: 10,
          bounds: { x: 10 + col * 30, y: 10 + digit * 30, width: 25, height: 25 },
          printedChar: BENGALI_DIGITS[digit] || digit.toString()
        });
      }
    }
    return cells;
  }

  function renderDigitsBuffer(cells: CellROI[], targetDigits: number[], width: number, height: number): Uint8ClampedArray {
    const data = new Uint8ClampedArray(width * height * 4);
    data.fill(255);
    cells.forEach(cell => {
      const col = cell.colIndex ?? 0;
      const row = cell.rowIndex ?? 0;
      const isTarget = targetDigits[col] === row;
      const cx = cell.center.x;
      const cy = cell.center.y;
      const r = cell.radius;
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(height - 1, Math.ceil(cy + r)); y++) {
        for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(width - 1, Math.ceil(cx + r)); x++) {
          const d = Math.hypot(x - cx, y - cy);
          const idx = (y * width + x) * 4;
          if (isTarget && d <= r) {
            data[idx] = 15; data[idx + 1] = 15; data[idx + 2] = 15;
          } else if (Math.abs(d - r) <= 1.5) {
            data[idx] = 60; data[idx + 1] = 60; data[idx + 2] = 60;
          }
        }
      }
    });
    return data;
  }

  const rollCells = createTestDigitCells(6, 'ROLL');
  const rollTarget = [3, 0, 7, 4, 1, 8];
  const rollBuf = renderDigitsBuffer(rollCells, rollTarget, 200, 350);
  const rollRes = DigitBubbleReader.readMatrix(rollBuf, 200, 350, 6, rollCells);
  assert(rollRes.value === '307418' && rollRes.isComplete, 'Roll number extracted: "307418" (100% match)');

  // All zeros and all nines
  const zerosBuf = renderDigitsBuffer(rollCells, [0, 0, 0, 0, 0, 0], 200, 350);
  const zerosRes = DigitBubbleReader.readMatrix(zerosBuf, 200, 350, 6, rollCells);
  assert(zerosRes.value === '000000', 'Edge case: All zeros Roll "000000"');

  const ninesBuf = renderDigitsBuffer(rollCells, [9, 9, 9, 9, 9, 9], 200, 350);
  const ninesRes = DigitBubbleReader.readMatrix(ninesBuf, 200, 350, 6, rollCells);
  assert(ninesRes.value === '999999', 'Edge case: All nines Roll "999999"');

  // 7-digit Registration Number
  const regCells = createTestDigitCells(7, 'REG');
  const regTarget = [7, 8, 9, 0, 1, 2, 3];
  const regBuf = renderDigitsBuffer(regCells, regTarget, 250, 350);
  const regRes = DigitBubbleReader.readMatrix(regBuf, 250, 350, 7, regCells);
  assert(regRes.value === '7890123' && regRes.isComplete, 'Registration number extracted: "7890123"');

  // -------------------------------------------------------------
  // SUITE 4: Identity Resolution & Security Isolation
  // -------------------------------------------------------------
  console.log('\n--- 4. STUDENT IDENTITY RESOLUTION & SECURITY ---');
  const mockDb = {
    students: [
      {
        id: 'std_science_101',
        roll: '307418',
        registrationNo: '7890123',
        classId: 'class_hsc_science',
        sectionId: 'sec_alpha',
        user: { name: 'Fahim Morshed' }
      }
    ],
    exams: [
      {
        id: 'exam_physics_final',
        classId: 'class_hsc_science',
        sectionId: 'sec_alpha'
      }
    ],
    examSets: []
  };

  const validIdentity = await StudentIdentityResolver.resolve({
    qr: { examId: 'exam_physics_final', classId: 'class_hsc_science', sectionId: 'sec_alpha' },
    roll: '307418',
    registration: '7890123'
  }, mockDb);

  assert(validIdentity.success && validIdentity.studentId === 'std_science_101', 'Resolved exact student: Fahim Morshed (ID: std_science_101)');

  // Tampered QR Security Check
  const tamperedQR = await StudentIdentityResolver.resolve({
    qr: { examId: 'exam_physics_final', classId: 'class_commerce_different', sectionId: 'sec_beta' },
    roll: '307418'
  }, mockDb);
  assert(!tamperedQR.success && !tamperedQR.studentId, 'Security Gate: Rejects student not enrolled in exam target class/section');

  // -------------------------------------------------------------
  // SUITE 5: Question Mapping & Canonical Online Isomorphism
  // -------------------------------------------------------------
  console.log('\n--- 5. QUESTION MAPPING & ONLINE EVALUATOR ISOMORPHISM ---');
  const canonicalQuestions: CanonicalQuestionSet = {
    examSetId: 'set_physics_a',
    setCode: 'A',
    questions: [
      { id: 'q_phy_01', questionNo: 1, type: 'MCQ', marks: 1.0, options: [{ text: '10 m/s', isCorrect: false }, { text: '20 m/s', isCorrect: true }, { text: '30 m/s', isCorrect: false }, { text: '40 m/s', isCorrect: false }], correctAnswer: 'B' },
      { id: 'q_phy_02', questionNo: 2, type: 'MCQ', marks: 1.0, options: [{ text: 'Vector', isCorrect: true }, { text: 'Scalar', isCorrect: false }, { text: 'Tensor', isCorrect: false }, { text: 'None', isCorrect: false }], correctAnswer: 'A' },
      { id: 'q_phy_03', questionNo: 3, type: 'MCQ', marks: 1.0, options: [{ text: 'Joule', isCorrect: false }, { text: 'Watt', isCorrect: true }, { text: 'Newton', isCorrect: false }, { text: 'Pascal', isCorrect: false }], correctAnswer: 'B' },
      { id: 'q_phy_04', questionNo: 4, type: 'MCQ', marks: 1.0, options: [{ text: 'Alpha', isCorrect: false }, { text: 'Beta', isCorrect: false }, { text: 'Gamma', isCorrect: true }, { text: 'X-ray', isCorrect: false }], correctAnswer: 'C' },
      { id: 'q_phy_05', questionNo: 5, type: 'MCQ', marks: 1.0, options: [{ text: 'Solid', isCorrect: true }, { text: 'Liquid', isCorrect: false }, { text: 'Gas', isCorrect: false }, { text: 'Plasma', isCorrect: false }], correctAnswer: 'A' }
    ]
  };

  // Student physical marks: Q1: B (Correct), Q2: B (Wrong), Q3: B (Correct), Q4: Blank (Skipped), Q5: A (Correct)
  const physicalAnswers: PhysicalAnswerEntry[] = [
    { questionNo: 1, selectedOption: 'B', confidence: 0.95 },
    { questionNo: 2, selectedOption: 'B', confidence: 0.92 },
    { questionNo: 3, selectedOption: 'B', confidence: 0.94 },
    { questionNo: 4, selectedOption: null, confidence: 1.0, status: 'BLANK' },
    { questionNo: 5, selectedOption: 'A', confidence: 0.96 }
  ];

  const mapResult = PhysicalResponseMapper.mapResponses(canonicalQuestions, physicalAnswers);
  assert(mapResult.validationStatus === 'VALID', 'PhysicalResponseMapper mapped responses with 0 errors');
  assert(mapResult.canonicalAnswers['q_phy_01'] === 'B', 'Mapped Q1 -> q_phy_01: "B"');
  assert(mapResult.canonicalAnswers['q_phy_02'] === 'B', 'Mapped Q2 -> q_phy_02: "B"');

  // Submit Adapter
  const scanInput: OMRScanResult = {
    scanId: 'scan_uuid_001_prod',
    qrPayload: { examId: 'exam_physics_final', examSetId: 'set_physics_a', classId: 'class_hsc_science' },
    roll: '307418',
    registration: '7890123',
    physicalAnswers,
    confidence: 0.97
  };

  const adapted = await OMRSubmissionAdapter.adapt(scanInput, {
    preResolvedSet: canonicalQuestions,
    mockDb
  });

  assert(adapted.success && adapted.canonicalSubmission !== undefined, 'OMRSubmissionAdapter produced canonical online payload');

  // Authoritative Scorer Simulation (3 Correct @ +1.0 = 3.0, 1 Wrong @ 0.25 neg = -0.25, 1 Blank @ 0 = 0.0 => Total 2.75 / 5.0)
  const examMock = {
    id: 'exam_physics_final',
    totalMarks: 5.0,
    passMarks: 2.0,
    mcqNegativeMarking: 25.0,
    cqRequiredQuestions: 0,
    sqRequiredQuestions: 0
  };

  const evalResult = await evaluateSubmission(
    {
      id: 'sub_test_001',
      studentId: 'std_science_101',
      examId: 'exam_physics_final',
      examSetId: 'set_physics_a',
      answers: adapted.canonicalSubmission!.answers
    } as any,
    examMock as any,
    [{ id: 'set_physics_a', questionsJson: canonicalQuestions.questions }] as any,
    false // don't write to DB during mock run
  );

  assert(evalResult.totalScore === 2.75, `Authoritative evaluation calculated exact score: ${evalResult.totalScore} / 5.0`);
  assert(evalResult.grade === 'B', `Grade accurately assigned: ${evalResult.grade} (55%)`);

  // -------------------------------------------------------------
  // SUITE 6: Batch Performance & Latency Measurements
  // -------------------------------------------------------------
  console.log('\n--- 6. BATCH PERFORMANCE & LATENCY MEASUREMENTS ---');
  const BATCH_SIZE = 100;
  const batchStart = Date.now();

  for (let i = 0; i < BATCH_SIZE; i++) {
    const t0 = performance.now();
    const sampleAnswers = canonicalQuestions.questions.map((q, idx) => ({
      questionNo: idx + 1,
      selectedOption: ['A', 'B', 'C', 'D'][idx % 4],
      confidence: 0.98
    }));
    PhysicalResponseMapper.mapResponses(canonicalQuestions, sampleAnswers);
    const t1 = performance.now();
    stats.latencies.push(t1 - t0);
  }

  const batchDuration = Date.now() - batchStart;
  const avgLatency = stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length;
  const worstLatency = Math.max(...stats.latencies);

  assert(avgLatency < 5.0, `Average mapping latency per sheet: ${avgLatency.toFixed(3)} ms (< 5ms SLA)`);
  assert(worstLatency < 20.0, `Worst latency per sheet: ${worstLatency.toFixed(3)} ms (< 20ms SLA)`);
  assert(batchDuration < 500, `100 sheet batch simulated in ${batchDuration} ms`);

  // -------------------------------------------------------------
  // STATISTICAL METRICS SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('  STATISTICAL ACCURACY & QUALITY AUDIT SUMMARY');
  console.log('================================================================');

  const accuracy = ((stats.tp + stats.tn) / (stats.tp + stats.tn + stats.fp + stats.fn)) * 100;
  const precision = (stats.tp / (stats.tp + stats.fp)) * 100;
  const recall = (stats.tp / (stats.tp + stats.fn)) * 100;
  const far = stats.fp / (stats.fp + stats.tn); // False Acceptance Rate
  const frr = stats.fn / (stats.tp + stats.fn); // False Rejection Rate

  console.log(`  • True Positives (TP):     ${stats.tp}`);
  console.log(`  • True Negatives (TN):     ${stats.tn}`);
  console.log(`  • False Positives (FP):    ${stats.fp}`);
  console.log(`  • False Negatives (FN):    ${stats.fn}`);
  console.log(`  • Empirical Accuracy:      ${accuracy.toFixed(2)}%`);
  console.log(`  • Precision:               ${precision.toFixed(2)}%`);
  console.log(`  • Recall:                  ${recall.toFixed(2)}%`);
  console.log(`  • False Acceptance (FAR):  ${(far * 100).toFixed(4)}%`);
  console.log(`  • False Rejection (FRR):   ${(frr * 100).toFixed(4)}%`);
  console.log(`  • Total Assertions:        ${stats.totalAssertions}`);
  console.log(`  • Total Passed:            ${stats.passedAssertions} / ${stats.totalAssertions}`);
  console.log(`  • Total Failed:            ${stats.failedAssertions}`);
  console.log(`  • Execution Time:          ${Date.now() - startTime} ms`);
  console.log('================================================================\n');

  if (stats.failedAssertions > 0) {
    process.exit(1);
  }
}

runMasterSuite().catch(err => {
  console.error('[MasterVerificationSuite] Fatal Error:', err);
  process.exit(1);
});
