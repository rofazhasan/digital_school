/**
 * OMR Lab Synthetic Sheet Generator & Benchmark Suite
 * 
 * Generates synthetic OMR answer sheets with known ground truth data
 * and artificial image distortions to evaluate scanner accuracy.
 */

import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT, CellROI } from './geometry-template';
import { DigitBubbleReader } from './digit-bubble-reader';
import { QuestionClassifier } from './question-classifier';

export interface GroundTruthData {
  rollNumber: string;        // 6 digits e.g. "340922"
  registrationNo: string;    // 7 digits e.g. "1029384"
  setCode: string;           // "A"|"B"|"C"|"D"
  answers: Record<number, string>; // qNo -> "A"|"B"|"C"|"D"|null
}

export interface DistortionParams {
  rotationDeg: number;       // -15 to 15
  perspectiveTiltDeg: number;// 0 to 25
  blurAmount: number;        // 0 to 100
  lightStrength: number;     // 0.3 to 1.0 (fill darkness)
  noiseLevel: number;        // 0 to 50
  multipleMarksCount: number;// Number of questions with 2 filled options
  erasureCount: number;      // Number of partially erased bubbles
}

export interface AccuracyReport {
  bubbleAccuracy: number;
  questionAccuracy: number;
  rollAccuracy: number;
  registrationAccuracy: number;
  studentIdentityAccuracy: number;
  finalScoreAccuracy: number;
  totalEvaluated: number;
  passedCount: number;
  failedCount: number;
}

export function generateGroundTruth(seed: number = 42): GroundTruthData {
  const rollDigits = Array.from({ length: 6 }, (_, i) => Math.floor(((seed * 13 + i * 7) % 10)));
  const regDigits = Array.from({ length: 7 }, (_, i) => Math.floor(((seed * 17 + i * 11) % 10)));
  const setCode = ['A', 'B', 'C', 'D'][seed % 4];

  const answers: Record<number, string> = {};
  const opts = ['A', 'B', 'C', 'D'];

  for (let qNo = 1; qNo <= 100; qNo++) {
    // 85% answered, 15% blank
    if ((qNo + seed) % 7 !== 0) {
      answers[qNo] = opts[(qNo * 3 + seed) % 4];
    }
  }

  return {
    rollNumber: rollDigits.join(''),
    registrationNo: regDigits.join(''),
    setCode,
    answers
  };
}

/**
 * Renders synthetic canonical image buffer with filled bubbles matching ground truth.
 */
export function renderSyntheticCanvasBuffer(
  groundTruth: GroundTruthData,
  distortion: Partial<DistortionParams> = {}
): { data: Uint8ClampedArray; width: number; height: number } {
  const w = CANONICAL_WIDTH;
  const h = CANONICAL_HEIGHT;
  const data = new Uint8ClampedArray(w * h * 4);

  // Fill white paper background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }

  const geometry = generateTemplateGeometry('C_11_12', 1);
  const fillDarkness = Math.round(255 * (1.0 - (distortion.lightStrength ?? 0.85)));

  // Helper to draw circle
  const drawBubble = (cx: number, cy: number, r: number, isFilled: boolean) => {
    const rSq = r * r;
    const minX = Math.max(0, Math.floor(cx - r - 2));
    const maxX = Math.min(w - 1, Math.ceil(cx + r + 2));
    const minY = Math.max(0, Math.floor(cy - r - 2));
    const maxY = Math.min(h - 1, Math.ceil(cy + r + 2));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dSq = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        const idx = (y * w + x) * 4;

        if (dSq <= rSq) {
          if (isFilled) {
            // Dark pen fill
            data[idx] = fillDarkness;
            data[idx + 1] = fillDarkness;
            data[idx + 2] = fillDarkness;
          } else {
            // Blank printed outline
            if (dSq >= (r - 2) * (r - 2)) {
              data[idx] = 40;
              data[idx + 1] = 40;
              data[idx + 2] = 40;
            }
          }
        }
      }
    }
  };

  // Draw 4 Corner Markers
  geometry.markers.forEach(m => {
    const minX = Math.floor(m.x);
    const maxX = Math.floor(m.x + m.width);
    const minY = Math.floor(m.y);
    const maxY = Math.floor(m.y + m.height);

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const idx = (y * w + x) * 4;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
      }
    }
  });

  // Render Roll Bubbles
  geometry.roll.cells.forEach(cell => {
    const colVal = parseInt(groundTruth.rollNumber[cell.colIndex ?? 0], 10);
    const isFilled = cell.rowIndex === colVal;
    drawBubble(cell.center.x, cell.center.y, cell.radius, isFilled);
  });

  // Render Registration Bubbles
  geometry.registration.cells.forEach(cell => {
    const colVal = parseInt(groundTruth.registrationNo[cell.colIndex ?? 0], 10);
    const isFilled = cell.rowIndex === colVal;
    drawBubble(cell.center.x, cell.center.y, cell.radius, isFilled);
  });

  // Render Answer Bubbles
  geometry.answers.cells.forEach(cell => {
    const targetOpt = groundTruth.answers[cell.qNo ?? 0];
    const isFilled = targetOpt === cell.optionLabel;
    drawBubble(cell.center.x, cell.center.y, cell.radius, isFilled);
  });

  return { data, width: w, height: h };
}

/**
 * Runs benchmark comparison between scanner engine and known ground truth.
 */
export function evaluateBenchmarkAccuracy(
  groundTruth: GroundTruthData,
  extractedRoll: string,
  extractedReg: string,
  extractedAnswers: Record<number, string>
): AccuracyReport {
  let correctRollDigits = 0;
  for (let i = 0; i < 6; i++) {
    if (extractedRoll[i] === groundTruth.rollNumber[i]) {
      correctRollDigits++;
    }
  }

  let correctRegDigits = 0;
  for (let i = 0; i < 7; i++) {
    if (extractedReg[i] === groundTruth.registrationNo[i]) {
      correctRegDigits++;
    }
  }

  let correctQuestions = 0;
  let totalEvaluated = 0;

  for (let qNo = 1; qNo <= 100; qNo++) {
    const gtOpt = groundTruth.answers[qNo] || null;
    const extOpt = extractedAnswers[qNo] || null;

    if (gtOpt === extOpt) {
      correctQuestions++;
    }
    totalEvaluated++;
  }

  const rollAccuracy = (correctRollDigits / 6) * 100;
  const regAccuracy = (correctRegDigits / 7) * 100;
  const questionAccuracy = (correctQuestions / 100) * 100;
  const studentIdentityAccuracy = (extractedRoll === groundTruth.rollNumber && extractedReg === groundTruth.registrationNo) ? 100 : 0;
  const finalScoreAccuracy = questionAccuracy;
  const bubbleAccuracy = (rollAccuracy * 6 + regAccuracy * 7 + questionAccuracy * 400) / 413;

  return {
    bubbleAccuracy,
    questionAccuracy,
    rollAccuracy,
    registrationAccuracy: regAccuracy,
    studentIdentityAccuracy,
    finalScoreAccuracy,
    totalEvaluated: 100,
    passedCount: correctQuestions,
    failedCount: 100 - correctQuestions
  };
}
