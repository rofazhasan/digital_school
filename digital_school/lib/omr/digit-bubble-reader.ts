/**
 * Reusable Digit Bubble Matrix Reader
 * 
 * Used for both Roll Number (6 digits) and Registration Number (7 digits) matrices.
 * Evaluates all 10 known digit bubble ROIs for every column deterministically.
 */

import { CellROI } from './geometry-template';
import { classifyBubbleROI, BubbleAnalysisResult } from './bengali-subtraction-classifier';

export type DigitColumnStatus = 'VALID' | 'BLANK' | 'MULTIPLE' | 'AMBIGUOUS';

export interface DigitColumnResult {
  colIndex: number;
  selectedDigit: string | null;
  status: DigitColumnStatus;
  confidence: number;
  digitScores: { digit: number; netInkScore: number; status: string }[];
}

export interface MatrixReaderResult {
  value: string; // e.g. "123456"
  isComplete: boolean;
  overallConfidence: number;
  columns: DigitColumnResult[];
}

export class DigitBubbleReader {
  /**
   * Reads a digit matrix (e.g. 6x10 Roll or 7x10 Reg) from canonical image buffer.
   */
  public static readMatrix(
    canonicalData: Uint8Array | Uint8ClampedArray,
    canonicalWidth: number,
    canonicalHeight: number,
    numColumns: number,
    cells: CellROI[]
  ): MatrixReaderResult {
    const columns: DigitColumnResult[] = [];
    let totalConf = 0;
    let validCount = 0;
    let extractedChars: string[] = [];

    for (let col = 0; col < numColumns; col++) {
      const colCells = cells
        .filter(c => c.colIndex === col)
        .sort((a, b) => (a.rowIndex ?? 0) - (b.rowIndex ?? 0));

      const evaluations: { digit: number; result: BubbleAnalysisResult }[] = colCells.map(cell => ({
        digit: cell.rowIndex ?? 0,
        result: classifyBubbleROI(canonicalData, canonicalWidth, canonicalHeight, cell)
      }));

      // Sort by net ink score descending
      const sorted = [...evaluations].sort((a, b) => b.result.netInkScore - a.result.netInkScore);

      const top = sorted[0];
      const second = sorted[1];

      let colStatus: DigitColumnStatus = 'BLANK';
      let selectedDigit: string | null = null;
      let colConfidence = 1.0;

      if (top.result.netInkScore >= 0.28 && top.result.fillRatio >= 0.35) {
        if (second && second.result.netInkScore >= 0.26 && second.result.fillRatio >= 0.32) {
          // Multiple bubbles filled in same digit column
          colStatus = 'MULTIPLE';
          selectedDigit = '?';
          colConfidence = 0.2;
        } else {
          // Clear winner
          const margin = second ? top.result.netInkScore - second.result.netInkScore : top.result.netInkScore;
          if (margin >= 0.10) {
            colStatus = 'VALID';
            selectedDigit = top.digit.toString();
            colConfidence = Math.min(1.0, 0.70 + margin * 1.5);
          } else {
            colStatus = 'AMBIGUOUS';
            selectedDigit = top.digit.toString();
            colConfidence = 0.5;
          }
        }
      } else {
        colStatus = 'BLANK';
        selectedDigit = '?';
        colConfidence = 0.1;
      }

      if (colStatus === 'VALID' && selectedDigit !== null) {
        validCount++;
        extractedChars.push(selectedDigit);
      } else {
        extractedChars.push('?');
      }

      totalConf += colConfidence;

      columns.push({
        colIndex: col,
        selectedDigit,
        status: colStatus,
        confidence: colConfidence,
        digitScores: evaluations.map(e => ({
          digit: e.digit,
          netInkScore: e.result.netInkScore,
          status: e.result.status
        }))
      });
    }

    const value = extractedChars.join('');
    const isComplete = validCount === numColumns;
    const overallConfidence = numColumns > 0 ? totalConf / numColumns : 0;

    return {
      value,
      isComplete,
      overallConfidence,
      columns
    };
  }
}
