import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT } from '../lib/omr/geometry-template';
import { solveHomography, transformPoint, CornerQuad } from '../lib/omr/perspective-warp';
import { detectCornerMarkers } from '../lib/omr/marker-detector';
import { DigitBubbleReader } from '../lib/omr/digit-bubble-reader';
import { QuestionClassifier } from '../lib/omr/question-classifier';
import { evaluateImageQuality } from '../lib/omr/quality-engine';
import { generateGroundTruth, renderSyntheticCanvasBuffer, evaluateBenchmarkAccuracy } from '../lib/omr/lab-generator';

describe('OMR Engine V2 Comprehensive Test Suite', () => {

  test('1. Template Geometry Generator exports valid machine-readable metadata', () => {
    const geometry = generateTemplateGeometry('C_11_12', 1);

    expect(geometry.templateId).toContain('C_11_12');
    expect(geometry.canonical.width).toBe(CANONICAL_WIDTH);
    expect(geometry.canonical.height).toBe(CANONICAL_HEIGHT);
    expect(geometry.markers).toHaveLength(4);
    expect(geometry.roll.columns).toBe(6);
    expect(geometry.roll.rows).toBe(10);
    expect(geometry.roll.cells).toHaveLength(60);
    expect(geometry.registration.columns).toBe(7);
    expect(geometry.registration.rows).toBe(10);
    expect(geometry.registration.cells).toHaveLength(70);
    expect(geometry.answers.questionCount).toBe(100);
    expect(geometry.answers.cells).toHaveLength(400); // 100 Qs x 4 options
  });

  test('2. Homography matrix solver & point transformation', () => {
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
    expect(H).toBeDefined();
    expect(H).toHaveLength(9);

    const projectedTL = transformPoint(srcQuad.tl, H);
    expect(Math.round(projectedTL.x)).toBe(0);
    expect(Math.round(projectedTL.y)).toBe(0);

    const projectedBR = transformPoint(srcQuad.br, H);
    expect(Math.round(projectedBR.x)).toBe(200);
    expect(Math.round(projectedBR.y)).toBe(200);
  });

  test('3. 4-Corner Marker Detector identifies corners on synthetic canvas', () => {
    const gt = generateGroundTruth(101);
    const canvas = renderSyntheticCanvasBuffer(gt);

    const detection = detectCornerMarkers(canvas.data, canvas.width, canvas.height);
    expect(detection.isValid).toBe(true);
    expect(detection.quad).toBeDefined();
    expect(detection.confidence).toBeGreaterThan(0.70);
  });

  test('4. Bengali Subtraction Classifier & DigitBubbleReader extract Roll & Reg accurately', () => {
    const gt = generateGroundTruth(42);
    const canvas = renderSyntheticCanvasBuffer(gt);
    const geometry = generateTemplateGeometry('C_11_12', 1);

    const rollRes = DigitBubbleReader.readMatrix(
      canvas.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.roll.columns,
      geometry.roll.cells
    );

    expect(rollRes.value).toBe(gt.rollNumber);
    expect(rollRes.isComplete).toBe(true);

    const regRes = DigitBubbleReader.readMatrix(
      canvas.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.registration.columns,
      geometry.registration.cells
    );

    expect(regRes.value).toBe(gt.registrationNo);
    expect(regRes.isComplete).toBe(true);
  });

  test('5. QuestionClassifier evaluates 100 MCQs against ground truth accurately', () => {
    const gt = generateGroundTruth(77);
    const canvas = renderSyntheticCanvasBuffer(gt);
    const geometry = generateTemplateGeometry('C_11_12', 1);

    const ansRes = QuestionClassifier.classifyQuestions(
      canvas.data,
      CANONICAL_WIDTH,
      CANONICAL_HEIGHT,
      geometry.answers.questionCount,
      geometry.answers.cells
    );

    expect(ansRes.details).toHaveLength(100);

    const benchmark = evaluateBenchmarkAccuracy(gt, gt.rollNumber, gt.registrationNo, ansRes.answers);
    expect(benchmark.questionAccuracy).toBeGreaterThanOrEqual(99.0);
    expect(benchmark.bubbleAccuracy).toBeGreaterThanOrEqual(99.0);
  });

  test('6. Quality Evaluation engine computes metrics and instructions', () => {
    const gt = generateGroundTruth(1);
    const canvas = renderSyntheticCanvasBuffer(gt);

    const quality = evaluateImageQuality(canvas.data, canvas.width, canvas.height, 1.0);
    expect(quality).toBeDefined();
    expect(quality.brightnessScore).toBeGreaterThan(0);
    expect(quality.contrastScore).toBeGreaterThan(0);
  });
});
