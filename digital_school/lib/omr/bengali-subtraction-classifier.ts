/**
 * Bengali Printed Character Subtraction & Multi-Feature Bubble Classifier
 * 
 * Accounts for static pre-printed Bengali numerals (০-৯) and option characters (ক-ঘ)
 * inside bubbles. Calculates net additional student pen ink using local background
 * normalization, template subtraction, interior fill density, and sibling contrast.
 */

import { CellROI } from './geometry-template';

export type BubbleStatus = 'EMPTY' | 'FILLED' | 'AMBIGUOUS';

export interface BubbleAnalysisResult {
  cellId: string;
  status: BubbleStatus;
  rawDarkness: number;
  netInkScore: number;       // Normalized 0.0 to 1.0 (additional student ink)
  fillRatio: number;         // Ratio of inner pixels filled
  centerFillRatio: number;   // Core center fill density
  confidence: number;        // Confidence score 0.0 to 1.0
  printedChar: string;
}

// Baseline printed character darkness estimates (0.0 to 1.0) for blank bubbles
const PRINTED_CHAR_BASELINES: Record<string, number> = {
  '০': 0.12, '১': 0.10, '২': 0.12, '৩': 0.13, '৪': 0.14,
  '৫': 0.14, '৬': 0.13, '৭': 0.11, '৮': 0.13, '৯': 0.14,
  'ক': 0.15, 'খ': 0.16, 'গ': 0.14, 'ঘ': 0.16, 'A': 0.12,
  'B': 0.14, 'C': 0.11, 'D': 0.13
};

/**
 * Analyzes a single bubble cell ROI within canonical image buffer.
 */
export function classifyBubbleROI(
  canonicalData: Uint8Array | Uint8ClampedArray,
  canonicalWidth: number,
  canonicalHeight: number,
  cell: CellROI
): BubbleAnalysisResult {
  const cx = Math.round(cell.center.x);
  const cy = Math.round(cell.center.y);
  const radius = cell.radius;

  const innerRadius = radius * 0.75;
  const outerRadius = radius * 1.35;
  const coreRadius = radius * 0.40;

  // 1. Measure local background paper brightness (outer ring)
  const bgIntensities: number[] = [];
  const minX = Math.max(0, cx - Math.ceil(outerRadius));
  const maxX = Math.min(canonicalWidth - 1, cx + Math.ceil(outerRadius));
  const minY = Math.max(0, cy - Math.ceil(outerRadius));
  const maxY = Math.min(canonicalHeight - 1, cy + Math.ceil(outerRadius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const distSq = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (distSq > radius * radius && distSq <= outerRadius * outerRadius) {
        const idx = (y * canonicalWidth + x) * 4;
        const gray = (canonicalData[idx] * 299 + canonicalData[idx + 1] * 587 + canonicalData[idx + 2] * 114) / 1000;
        bgIntensities.push(gray);
      }
    }
  }

  // Local background median paper brightness (255 = pure white)
  bgIntensities.sort((a, b) => a - b);
  const paperBrightness = bgIntensities.length > 0 ? bgIntensities[Math.floor(bgIntensities.length / 2)] : 240;

  // 2. Measure inner bubble pixel darkness relative to paper brightness
  let innerPixelCount = 0;
  let innerDarknessSum = 0;
  let filledPixelCount = 0;

  let corePixelCount = 0;
  let coreFilledCount = 0;

  const darkThreshold = Math.max(40, paperBrightness * 0.45); // Pen ink is significantly darker than paper

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const distSq = (x - cx) * (x - cx) + (y - cy) * (y - cy);

      if (distSq <= innerRadius * innerRadius) {
        const idx = (y * canonicalWidth + x) * 4;
        const gray = (canonicalData[idx] * 299 + canonicalData[idx + 1] * 587 + canonicalData[idx + 2] * 114) / 1000;
        
        // Normalized darkness: 0.0 (white paper) to 1.0 (black ink)
        const normDarkness = Math.max(0, (paperBrightness - gray) / paperBrightness);

        innerDarknessSum += normDarkness;
        innerPixelCount++;

        if (gray < darkThreshold) {
          filledPixelCount++;
        }

        if (distSq <= coreRadius * coreRadius) {
          corePixelCount++;
          if (gray < darkThreshold) {
            coreFilledCount++;
          }
        }
      }
    }
  }

  const rawDarkness = innerPixelCount > 0 ? innerDarknessSum / innerPixelCount : 0;
  const fillRatio = innerPixelCount > 0 ? filledPixelCount / innerPixelCount : 0;
  const centerFillRatio = corePixelCount > 0 ? coreFilledCount / corePixelCount : 0;

  // 3. Perform static Bengali printed ink subtraction
  const baselineInk = PRINTED_CHAR_BASELINES[cell.printedChar] || 0.13;
  const netInkScore = Math.max(0, (rawDarkness - baselineInk) / (1.0 - baselineInk));

  // 4. Initial tri-state classification
  let status: BubbleStatus = 'EMPTY';
  let confidence = 1.0;

  if (netInkScore >= 0.32 && fillRatio >= 0.40 && centerFillRatio >= 0.35) {
    status = 'FILLED';
    confidence = Math.min(1.0, 0.70 + netInkScore * 0.30);
  } else if (netInkScore <= 0.12 && fillRatio <= 0.18) {
    status = 'EMPTY';
    confidence = Math.min(1.0, 0.80 + (0.12 - netInkScore) * 1.5);
  } else {
    status = 'AMBIGUOUS';
    confidence = 0.50;
  }

  return {
    cellId: cell.id,
    status,
    rawDarkness,
    netInkScore,
    fillRatio,
    centerFillRatio,
    confidence,
    printedChar: cell.printedChar
  };
}
