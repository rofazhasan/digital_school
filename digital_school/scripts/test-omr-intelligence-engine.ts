/**
 * Comprehensive Verification & Regression Suite for ROFAZ OMR Intelligence Engine
 * 
 * Verifies:
 * 1. Camera hardware & device capability adaptation.
 * 2. Multi-stage alignment and sub-pixel bubble centroid refinement.
 * 3. Multi-pass bubble fill engine and Top-2 score margin difference.
 * 4. Zero False Guessing (smudge rejection & ambiguity flagging).
 * 5. Programmatic synthetic sheet generation.
 * 6. Audit trail & manual correction provenance tracking.
 * 7. Physical-to-Digital answer isomorphism.
 */

import { CameraService } from '../lib/omr/core/camera-service';
import { AlignmentEngine } from '../lib/omr/core/alignment-engine';
import { BubbleEngine } from '../lib/omr/core/bubble-engine';
import { AuditTrailManager } from '../lib/omr/core/audit-trail';
import { SyntheticOMRGenerator } from '../lib/omr/core/synthetic-generator';
import { PhysicalResponseMapper } from '../lib/omr/physical-response-mapper';
import { CanonicalQuestionSet } from '../lib/omr/exam-set-resolver';

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${testName}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] ${testName}`);
}

async function runSuite() {
  console.log('\n================================================================');
  console.log('  ROFAZ OMR INTELLIGENCE ENGINE — PRODUCTION VERIFICATION SUITE');
  console.log('================================================================\n');

  // Test 1: Camera Service & Device Tier Selection
  const cameraService = new CameraService();
  const tier = cameraService.getDeviceTier();
  assert(
    ['LOW_END', 'MID_RANGE', 'HIGH_END', 'IOS_PREMIUM'].includes(tier.category),
    `CameraService selects valid hardware tier (Got: ${tier.category})`
  );
  assert(
    tier.recommendedLiveWidth >= 480 && tier.recommendedLiveWidth <= 960,
    `CameraService recommends optimal preview width (${tier.recommendedLiveWidth}px)`
  );

  // Test 2: Synthetic Sheet Generator
  const synthetic = SyntheticOMRGenerator.generateSheet({
    roll: '307418',
    registration: '7890123',
    smudgeQuestions: [{ questionNo: 15, smudgedOption: 'A', darkOption: 'C' }],
    ambiguousQuestions: [{ questionNo: 37, opt1: 'A', opt2: 'B' }]
  });

  assert(synthetic.width === 2480 && synthetic.height === 3508, 'Synthetic sheet generated to exact canonical A4 dimensions (2480x3508)');
  assert(synthetic.groundTruth.roll === '307418', 'Synthetic ground truth roll matches 307418');

  // Test 3: Multi-Stage Alignment Engine
  const alignment = AlignmentEngine.performCoarseAlignment(
    synthetic.buffer,
    synthetic.width,
    synthetic.height
  );
  assert(alignment.isAligned === true, 'Coarse alignment detects 4 corner markers successfully');
  assert(alignment.confidence >= 0.80, `Alignment confidence exceeds 80% (Achieved: ${(alignment.confidence * 100).toFixed(1)}%)`);

  // Test 4: Sub-pixel Centroid Refinement
  const bubbleRefinement = AlignmentEngine.refineBubbleCenter(
    synthetic.buffer,
    synthetic.width,
    synthetic.height,
    500,
    1000,
    18,
    3
  );
  assert(bubbleRefinement.localDriftPx <= 3.0, 'Sub-pixel bubble centroid refinement strictly bounded within 3.0px');

  // Test 5: Smudge Rejection (Eraser smudge on A, firm mark on C)
  const q15Options = [
    { label: 'A', x: 260, y: 1500, radius: 18 },
    { label: 'B', x: 320, y: 1500, radius: 18 },
    { label: 'C', x: 380, y: 1500, radius: 18 },
    { label: 'D', x: 440, y: 1500, radius: 18 }
  ];
  // Find actual Q15 geometry coords
  const { generateTemplateGeometry } = await import('../lib/omr/geometry-template');
  const geom = generateTemplateGeometry('C_11_12', 1);
  const q15Cells = geom.answers.cells.filter(c => c.qNo === 15);
  const q15Result = BubbleEngine.evaluateQuestionOptions(
    15,
    q15Cells.map(c => ({ label: c.optionLabel, x: c.center.x, y: c.center.y, radius: c.radius })),
    synthetic.buffer,
    synthetic.width,
    synthetic.height
  );
  assert(q15Result.selectedOption === 'C', `Smudge rejected: Firm mark 'C' chosen over light smudge 'A' (Selected: ${q15Result.selectedOption})`);
  assert(q15Result.status === 'CONFIDENT', `Question 15 classified with high confidence status`);

  // Test 6: Zero Guessing on Ambiguous Question (Q37: A vs B close mark)
  const q37Cells = geom.answers.cells.filter(c => c.qNo === 37);
  const q37Result = BubbleEngine.evaluateQuestionOptions(
    37,
    q37Cells.map(c => ({ label: c.optionLabel, x: c.center.x, y: c.center.y, radius: c.radius })),
    synthetic.buffer,
    synthetic.width,
    synthetic.height
  );
  assert(q37Result.status === 'AMBIGUOUS', `Zero Guessing: Close marks on Q37 safely flagged as AMBIGUOUS (Status: ${q37Result.status})`);
  assert(q37Result.selectedOptions.length === 2, 'Ambiguous result retains both candidate options for review');

  // Test 7: Audit Trail & Provenance Logging
  const testAudit = {
    scanId: 'scan_audit_test_001',
    examId: 'exam_physics_model_05',
    examSetId: 'set_physics_c',
    studentId: 'student_cuid_test_001',
    roll: '307418',
    registration: '7890123',
    templateVersion: '2.0.0',
    engineVersion: 'ROFAZ_OMR_INTELLIGENCE_V2',
    deviceTier: 'HIGH_END',
    timestamp: new Date().toISOString(),
    processingLatencyMs: 38,
    qualityScore: 98,
    confidenceSummary: {
      overall: 0.99,
      markers: 0.98,
      qr: 1.0,
      roll: 1.0,
      registration: 1.0,
      answersAvg: 0.995,
      ambiguousCount: 1,
      multipleCount: 0
    },
    manualCorrections: [
      {
        questionNo: 37,
        originalAnswer: 'A',
        correctedAnswer: 'B',
        changedBy: 'teacher_cuid_01',
        changedAt: new Date().toISOString(),
        reason: 'Confirmed student intended option B after review'
      }
    ],
    validationStatus: 'REVIEWED' as const
  };

  AuditTrailManager.recordScanAudit(testAudit);
  const recentAudits = AuditTrailManager.getRecentAudits(5);
  assert(recentAudits.length > 0, 'Audit record persisted and retrievable');
  assert(recentAudits[0].manualCorrections.length === 1, 'Manual correction provenance entry logged correctly');

  // Test 8: Physical-to-Digital Isomorphism with Canonical ExamSet
  const dummyExamSet: CanonicalQuestionSet = {
    examId: 'exam_physics_model_05',
    examSetId: 'set_physics_c',
    setName: 'Set C',
    questions: Array.from({ length: 100 }, (_, i) => ({
      sequenceNumber: i + 1,
      id: `q_phys_${i + 1}`,
      type: 'MCQ',
      marks: 1,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A'
    }))
  };

  const physicalMapping = PhysicalResponseMapper.mapResponses(
    dummyExamSet,
    Array.from({ length: 100 }, (_, i) => ({
      questionNo: i + 1,
      selectedOption: 'A',
      confidence: 0.99,
      status: 'ONE_SELECTED'
    }))
  );

  assert(physicalMapping.validationStatus === 'VALID', 'Physical response mapper validated 100 responses successfully');
  assert(physicalMapping.mappedCount === 100, 'Mapped count is 100/100');
  assert(physicalMapping.canonicalAnswers['q_phys_1'] === 'A', 'Canonical answer mapped to exact stable question ID q_phys_1');

  console.log('\n================================================================');
  console.log('  ALL 8 / 8 ROFAZ OMR INTELLIGENCE ENGINE TESTS PASSED (100%)');
  console.log('================================================================\n');
}

runSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
