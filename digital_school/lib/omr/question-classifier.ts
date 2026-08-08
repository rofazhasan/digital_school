/**
 * 100 MCQ Question Classification Engine
 * 
 * Evaluates option bubbles A, B, C, D (Bengali ক, খ, গ, ঘ) for each of the 100 questions.
 * Produces tri-state classification: ONE_SELECTED, BLANK, MULTIPLE_SELECTED, AMBIGUOUS.
 */

import { CellROI } from './geometry-template';
import { classifyBubbleROI, BubbleAnalysisResult } from './bengali-subtraction-classifier';

export type QuestionStatus = 'ONE_SELECTED' | 'BLANK' | 'MULTIPLE_SELECTED' | 'AMBIGUOUS';

export interface QuestionAnalysisDetail {
  qNo: number;
  status: QuestionStatus;
  selectedOption: string | null;
  confidence: number;
  optionScores: Record<string, { netInkScore: number; fillRatio: number; status: string }>;
}

export interface QuestionClassifierResult {
  answers: Record<number, string>; // Map of qNo -> "A"|"B"|"C"|"D"|null
  details: QuestionAnalysisDetail[];
  overallConfidence: number;
  stats: {
    oneSelectedCount: number;
    blankCount: number;
    multipleCount: number;
    ambiguousCount: number;
  };
}

export class QuestionClassifier {
  /**
   * Classifies all questions in the answer grid.
   */
  public static classifyQuestions(
    canonicalData: Uint8Array | Uint8ClampedArray,
    canonicalWidth: number,
    canonicalHeight: number,
    totalQuestions: number,
    answerCells: CellROI[]
  ): QuestionClassifierResult {
    const answers: Record<number, string> = {};
    const details: QuestionAnalysisDetail[] = [];

    let totalConf = 0;
    let oneSelectedCount = 0;
    let blankCount = 0;
    let multipleCount = 0;
    let ambiguousCount = 0;

    for (let qNo = 1; qNo <= totalQuestions; qNo++) {
      const qCells = answerCells
        .filter(c => c.qNo === qNo)
        .sort((a, b) => a.optionLabel.localeCompare(b.optionLabel));

      const evaluations: { option: string; result: BubbleAnalysisResult }[] = qCells.map(cell => ({
        option: cell.optionLabel,
        result: classifyBubbleROI(canonicalData, canonicalWidth, canonicalHeight, cell)
      }));

      // Sort options by net ink score descending
      const sorted = [...evaluations].sort((a, b) => b.result.netInkScore - a.result.netInkScore);

      const top = sorted[0];
      const second = sorted[1];

      let qStatus: QuestionStatus = 'BLANK';
      let selectedOption: string | null = null;
      let qConfidence = 1.0;

      const optionScores: Record<string, { netInkScore: number; fillRatio: number; status: string }> = {};
      evaluations.forEach(e => {
        optionScores[e.option] = {
          netInkScore: e.result.netInkScore,
          fillRatio: e.result.fillRatio,
          status: e.result.status
        };
      });

      if (top.result.netInkScore >= 0.28 && top.result.fillRatio >= 0.35) {
        if (second && second.result.netInkScore >= 0.26 && second.result.fillRatio >= 0.32) {
          // Multiple options filled
          qStatus = 'MULTIPLE_SELECTED';
          selectedOption = null;
          qConfidence = 0.2;
          multipleCount++;
        } else {
          const margin = second ? top.result.netInkScore - second.result.netInkScore : top.result.netInkScore;
          if (margin >= 0.10) {
            qStatus = 'ONE_SELECTED';
            selectedOption = top.option;
            qConfidence = Math.min(1.0, 0.75 + margin * 1.2);
            oneSelectedCount++;
            answers[qNo] = top.option;
          } else {
            qStatus = 'AMBIGUOUS';
            selectedOption = top.option; // Provide best candidate but flag ambiguous
            qConfidence = 0.5;
            ambiguousCount++;
          }
        }
      } else {
        qStatus = 'BLANK';
        selectedOption = null;
        qConfidence = 0.95;
        blankCount++;
      }

      totalConf += qConfidence;

      details.push({
        qNo,
        status: qStatus,
        selectedOption,
        confidence: qConfidence,
        optionScores
      });
    }

    const overallConfidence = totalQuestions > 0 ? totalConf / totalQuestions : 0;

    return {
      answers,
      details,
      overallConfidence,
      stats: {
        oneSelectedCount,
        blankCount,
        multipleCount,
        ambiguousCount
      }
    };
  }
}
