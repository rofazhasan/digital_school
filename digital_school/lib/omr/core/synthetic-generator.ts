/**
 * Synthetic OMR Sheet Generator & Regression Simulator
 * 
 * Programmatically renders canonical (2480x3508) or distorted OMR sheets
 * with precise ground truth for automated accuracy benchmarking.
 */

import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT } from '../geometry-template';

export interface SyntheticSheetOptions {
  roll?: string;
  registration?: string;
  answers?: Record<number, string>; // { 1: 'B', 2: 'A', ... }
  blurRadius?: number;
  noiseAmount?: number;
  glareIntensity?: number;
  smudgeQuestions?: Array<{ questionNo: number; smudgedOption: string; darkOption: string }>;
  ambiguousQuestions?: Array<{ questionNo: number; opt1: string; opt2: string }>;
  multipleMarkQuestions?: Array<{ questionNo: number; options: string[] }>;
}

export class SyntheticOMRGenerator {
  /**
   * Generates an RGBA buffer representing a high-resolution OMR sheet.
   */
  public static generateSheet(options: SyntheticSheetOptions = {}): {
    buffer: Uint8ClampedArray;
    width: number;
    height: number;
    groundTruth: {
      roll: string;
      registration: string;
      answers: Record<number, string>;
    };
  } {
    const width = CANONICAL_WIDTH;
    const height = CANONICAL_HEIGHT;
    const buffer = new Uint8ClampedArray(width * height * 4);

    // Initialize with crisp white paper background
    for (let i = 0; i < buffer.length; i += 4) {
      buffer[i] = 252;     // R
      buffer[i + 1] = 252; // G
      buffer[i + 2] = 250; // B
      buffer[i + 3] = 255; // Alpha
    }

    const geometry = generateTemplateGeometry('C_11_12', 1);

    // Helper: Fill circle with ink darkness (0 = pure black, 255 = paper white)
    const fillCircle = (cx: number, cy: number, radius: number, darkness: number) => {
      const minX = Math.max(0, Math.round(cx - radius));
      const maxX = Math.min(width - 1, Math.round(cx + radius));
      const minY = Math.max(0, Math.round(cy - radius));
      const maxY = Math.min(height - 1, Math.round(cy + radius));

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const distSq = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          if (distSq <= radius * radius) {
            const idx = (y * width + x) * 4;
            // Apply darkness
            buffer[idx] = Math.min(buffer[idx], darkness);
            buffer[idx + 1] = Math.min(buffer[idx + 1], darkness);
            buffer[idx + 2] = Math.min(buffer[idx + 2], darkness);
          }
        }
      }
    };

    // Helper: Draw circle ring border
    const drawRing = (cx: number, cy: number, radius: number, thickness: number = 2) => {
      const minX = Math.max(0, Math.round(cx - radius - thickness));
      const maxX = Math.min(width - 1, Math.round(cx + radius + thickness));
      const minY = Math.max(0, Math.round(cy - radius - thickness));
      const maxY = Math.min(height - 1, Math.round(cy + radius + thickness));

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
          if (Math.abs(dist - radius) <= thickness) {
            const idx = (y * width + x) * 4;
            buffer[idx] = 60;
            buffer[idx + 1] = 60;
            buffer[idx + 2] = 60;
          }
        }
      }
    };

    // Helper: Draw solid rectangle
    const drawRect = (rx: number, ry: number, rw: number, rh: number, darkness: number = 10) => {
      const minX = Math.max(0, Math.round(rx));
      const maxX = Math.min(width - 1, Math.round(rx + rw));
      const minY = Math.max(0, Math.round(ry));
      const maxY = Math.min(height - 1, Math.round(ry + rh));

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = (y * width + x) * 4;
          buffer[idx] = darkness;
          buffer[idx + 1] = darkness;
          buffer[idx + 2] = darkness;
        }
      }
    };

    // 1. Draw 4 Corner Registration Markers
    geometry.markers.forEach(m => {
      drawRect(m.x, m.y, m.width, m.height, 10);
    });

    // 2. Draw Simulated QR Code Box
    if (geometry.qr) {
      drawRect(geometry.qr.x, geometry.qr.y, geometry.qr.width, geometry.qr.height, 20);
    }

    // 3. Render Roll Matrix (Default '307418')
    const targetRoll = options.roll || '307418';
    geometry.roll.cells.forEach(cell => {
      drawRing(cell.center.x, cell.center.y, cell.radius);
      const digitStr = targetRoll[cell.column];
      if (digitStr !== undefined && parseInt(digitStr, 10) === cell.digit) {
        fillCircle(cell.center.x, cell.center.y, cell.radius * 0.85, 25); // Deeply filled ink
      }
    });

    // 4. Render Registration Matrix (Default '7890123')
    const targetReg = options.registration || '7890123';
    geometry.registration.cells.forEach(cell => {
      drawRing(cell.center.x, cell.center.y, cell.radius);
      const digitStr = targetReg[cell.column];
      if (digitStr !== undefined && parseInt(digitStr, 10) === cell.digit) {
        fillCircle(cell.center.x, cell.center.y, cell.radius * 0.85, 25);
      }
    });

    // 5. Render 100-Question Answer Grid
    const groundTruthAnswers: Record<number, string> = {};
    const defaultPattern = ['A', 'B', 'C', 'D'];

    // Build answer map
    for (let q = 1; q <= 100; q++) {
      groundTruthAnswers[q] = options.answers?.[q] || defaultPattern[(q - 1) % 4];
    }

    geometry.answers.cells.forEach(cell => {
      const qNo = cell.qNo || 1;
      drawRing(cell.center.x, cell.center.y, cell.radius);

      const targetOpt = groundTruthAnswers[qNo];

      // Check for smudges (erased mark vs solid mark)
      const isSmudged = options.smudgeQuestions?.find(s => s.questionNo === qNo);
      if (isSmudged) {
        if (cell.optionLabel === isSmudged.darkOption) {
          fillCircle(cell.center.x, cell.center.y, cell.radius * 0.85, 30); // Deep fill (88%)
        } else if (cell.optionLabel === isSmudged.smudgedOption) {
          fillCircle(cell.center.x, cell.center.y, cell.radius * 0.85, 195); // Light smudge (22%)
        }
        return;
      }

      // Check for close ambiguous marks (e.g. 48% vs 51%)
      const isAmbiguous = options.ambiguousQuestions?.find(a => a.questionNo === qNo);
      if (isAmbiguous) {
        if (cell.optionLabel === isAmbiguous.opt1) {
          fillCircle(cell.center.x, cell.center.y, cell.radius * 0.85, 130); // ~49%
        } else if (cell.optionLabel === isAmbiguous.opt2) {
          fillCircle(cell.center.x, cell.center.y, cell.radius * 0.85, 125); // ~51%
        }
        return;
      }

      // Regular mark
      if (cell.optionLabel === targetOpt) {
        fillCircle(cell.center.x, cell.center.y, cell.radius * 0.85, 30); // Deep fill
      }
    });

    return {
      buffer,
      width,
      height,
      groundTruth: {
        roll: targetRoll,
        registration: targetReg,
        answers: groundTruthAnswers
      }
    };
  }
}
