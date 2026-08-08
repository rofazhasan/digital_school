import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT } from '../lib/omr/geometry-template';
import { solveHomography, transformPoint, CornerQuad } from '../lib/omr/perspective-warp';
import { detectCornerMarkers } from '../lib/omr/marker-detector';
import { DigitBubbleReader } from '../lib/omr/digit-bubble-reader';
import { QuestionClassifier } from '../lib/omr/question-classifier';
import { evaluateImageQuality } from '../lib/omr/quality-engine';
import { generateGroundTruth, renderSyntheticCanvasBuffer, evaluateBenchmarkAccuracy } from '../lib/omr/lab-generator';

async function runAllTests() {
  console.log('=== RUNNING OMR ENGINE V2 VERIFICATION TESTS ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${title}`);
      process.exitCode = 1;
    }
  }

  // Test 1: Geometry Template Generator
  const geometry = generateTemplateGeometry('C_11_12', 1);
  assert(geometry.templateId.includes('C_11_12'), 'Template ID contains C_11_12');
  assert(geometry.canonical.width === CANONICAL_WIDTH && geometry.canonical.height === CANONICAL_HEIGHT, 'Canonical dimensions 2480x3508');
  assert(geometry.markers.length === 4, '4 Corner markers defined');
  assert(geometry.roll.cells.length === 60, '60 Roll number cells generated');
  assert(geometry.registration.cells.length === 70, '70 Registration number cells generated');
  assert(geometry.answers.cells.length === 400, '400 Answer option cells generated');

  // Test 2: Homography Matrix & Transformation
  const srcQuad: CornerQuad = {
    tl: { x: 10, y: 10 },
    tr: { x: 100, y: 10 },
    br: { x: 100, y: 100 },
    bl: { x: 10, y: 100 }
  };
  const dstQuad: CornerQuad = {
    tl: { x: 0, y: 0 },
    tr: { x: 200, y: 0 },
    br: { x: 200, y: 200 },
    bl: { x: 0, y: 200 }
  };
  const H = solveHomography(srcQuad, dstQuad);
  const projTL = transformPoint(srcQuad.tl, H);
  const projBR = transformPoint(srcQuad.br, H);
  assert(Math.round(projTL.x) === 0 && Math.round(projTL.y) === 0, 'Homography projects TL correctly to (0,0)');
  assert(Math.round(projBR.x) === 200 && Math.round(projBR.y) === 200, 'Homography projects BR correctly to (200,200)');

  // Test 3: Corner Marker Detection
  const gt = generateGroundTruth(101);
  const canvas = renderSyntheticCanvasBuffer(gt);
  const detection = detectCornerMarkers(canvas.data, canvas.width, canvas.height);
  assert(detection.isValid === true, 'Corner marker detection returns valid quad');
  assert(detection.confidence > 0.70, 'Corner marker detection confidence > 70%');

  // Test 4: Digit Bubble Reader (Roll & Registration)
  const rollRes = DigitBubbleReader.readMatrix(
    canvas.data,
    CANONICAL_WIDTH,
    CANONICAL_HEIGHT,
    geometry.roll.columns,
    geometry.roll.cells
  );
  assert(rollRes.value === gt.rollNumber, `Extracted Roll (${rollRes.value}) matches Ground Truth (${gt.rollNumber})`);
  assert(rollRes.isComplete === true, 'Roll number extraction complete');

  const regRes = DigitBubbleReader.readMatrix(
    canvas.data,
    CANONICAL_WIDTH,
    CANONICAL_HEIGHT,
    geometry.registration.columns,
    geometry.registration.cells
  );
  assert(regRes.value === gt.registrationNo, `Extracted Registration (${regRes.value}) matches Ground Truth (${gt.registrationNo})`);
  assert(regRes.isComplete === true, 'Registration number extraction complete');

  // Test 5: Question Classifier (100 MCQs)
  const ansRes = QuestionClassifier.classifyQuestions(
    canvas.data,
    CANONICAL_WIDTH,
    CANONICAL_HEIGHT,
    geometry.answers.questionCount,
    geometry.answers.cells
  );
  assert(ansRes.details.length === 100, 'Question classifier evaluated 100 questions');

  const benchmark = evaluateBenchmarkAccuracy(gt, rollRes.value, regRes.value, ansRes.answers);
  assert(benchmark.questionAccuracy >= 99.0, `Question accuracy ${benchmark.questionAccuracy.toFixed(2)}% >= 99%`);
  assert(benchmark.bubbleAccuracy >= 99.0, `Overall bubble accuracy ${benchmark.bubbleAccuracy.toFixed(2)}% >= 99%`);

  // Test 6: Quality Evaluation Engine
  const quality = evaluateImageQuality(canvas.data, canvas.width, canvas.height, 1.0);
  assert(quality.brightnessScore > 0 && quality.contrastScore > 0, 'Quality evaluation computes valid brightness and contrast');

  console.log(`\n=== SUMMARY: ${passed} / ${total} TESTS PASSED ===`);
}

runAllTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
