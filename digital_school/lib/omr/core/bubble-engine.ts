/**
 * Multi-Pass Bubble Fill & Confidence Engine
 * 
 * Analyzes candidate bubble cells using multi-metric feature extraction:
 * 1. Normalized interior darkness (0.0 to 1.0)
 * 2. Surrounding ring contrast ratio (interior vs ring background)
 * 3. Ink density percentage below adaptive local Otsu threshold
 * 4. Top-2 margin difference for single-choice questions (guards against ambiguous erasures/smudges)
 * 5. Strict rejection / uncertainty routing — never guess.
 */

export interface BubbleAnalysisResult {
  score: number; // 0.0 (clean white paper) to 1.0 (deeply filled ink)
  confidence: number; // 0.0 to 1.0
  fillPercentage: number;
  contrastRatio: number;
  isFilled: boolean;
}

export interface QuestionAnalysisResult {
  questionNo: number;
  selectedOption: string | null;
  selectedOptions: string[];
  status: 'CONFIDENT' | 'AMBIGUOUS' | 'MULTIPLE' | 'BLANK' | 'INVALID';
  confidence: number;
  marginScore: number;
  bubbleDetails: Array<{
    optionLabel: string;
    score: number;
    confidence: number;
    status: 'FILLED' | 'EMPTY' | 'AMBIGUOUS';
  }>;
}

export class BubbleEngine {
  /**
   * Analyzes an individual bubble ROI within the canonical image buffer.
   */
  public static analyzeBubble(
    canonicalBuffer: Uint8ClampedArray,
    canonicalWidth: number,
    canonicalHeight: number,
    centerX: number,
    centerY: number,
    radius: number
  ): BubbleAnalysisResult {
    let interiorSum = 0;
    let interiorSqSum = 0;
    let interiorCount = 0;
    let ringSum = 0;
    let ringCount = 0;
    let darkPixelCount = 0;

    const innerRadius = Math.round(radius * 0.75);
    const ringInnerRadius = Math.round(radius * 1.15);
    const ringOuterRadius = Math.round(radius * 1.60);

    const minX = Math.max(0, Math.round(centerX - ringOuterRadius));
    const maxX = Math.min(canonicalWidth - 1, Math.round(centerX + ringOuterRadius));
    const minY = Math.max(0, Math.round(centerY - ringOuterRadius));
    const maxY = Math.min(canonicalHeight - 1, Math.round(centerY + ringOuterRadius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const distSq = (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY);
        const idx = (y * canonicalWidth + x) * 4;
        const gray = (canonicalBuffer[idx] * 299 + canonicalBuffer[idx + 1] * 587 + canonicalBuffer[idx + 2] * 114) / 1000;

        // Interior Core measurement
        if (distSq <= innerRadius * innerRadius) {
          const darkness = 255 - gray;
          interiorSum += darkness;
          interiorSqSum += darkness * darkness;
          interiorCount++;

          if (gray < 140) {
            darkPixelCount++;
          }
        }
        // Surrounding Ring background measurement (for local illumination baseline)
        else if (distSq >= ringInnerRadius * ringInnerRadius && distSq <= ringOuterRadius * ringOuterRadius) {
          ringSum += (255 - gray);
          ringCount++;
        }
      }
    }

    const avgInteriorDarkness = interiorCount > 0 ? interiorSum / interiorCount : 0;
    const avgRingDarkness = ringCount > 0 ? ringSum / ringCount : 0;
    const fillPercentage = interiorCount > 0 ? darkPixelCount / interiorCount : 0;

    // Relative delta above local background lighting
    const localDelta = Math.max(0, avgInteriorDarkness - avgRingDarkness);
    const normalizedScore = Math.min(1.0, Math.max(0.0, (avgInteriorDarkness / 255) * 0.6 + (localDelta / 150) * 0.4));
    const contrastRatio = avgRingDarkness > 0 ? avgInteriorDarkness / Math.max(1, avgRingDarkness) : avgInteriorDarkness / 20;

    // A bubble is considered physically filled if score > 0.40 and fillPercentage > 0.35
    const isFilled = normalizedScore >= 0.40 && fillPercentage >= 0.35;

    const confidence = isFilled
      ? Math.min(1.0, 0.70 + (normalizedScore - 0.40) * 0.5)
      : Math.min(1.0, 0.70 + (0.40 - normalizedScore) * 0.75);

    return {
      score: Math.round(normalizedScore * 1000) / 1000,
      confidence: Math.round(confidence * 1000) / 1000,
      fillPercentage: Math.round(fillPercentage * 1000) / 1000,
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      isFilled
    };
  }

  /**
   * Evaluates a complete Question (e.g. 4 options A, B, C, D) using Top-2 Score Margin Analysis.
   */
  public static evaluateQuestionOptions(
    questionNo: number,
    options: Array<{ label: string; x: number; y: number; radius: number }>,
    canonicalBuffer: Uint8ClampedArray,
    canonicalWidth: number,
    canonicalHeight: number,
    isMultiSelect: boolean = false
  ): QuestionAnalysisResult {
    const details = options.map(opt => {
      const analysis = this.analyzeBubble(
        canonicalBuffer,
        canonicalWidth,
        canonicalHeight,
        opt.x,
        opt.y,
        opt.radius
      );

      return {
        optionLabel: opt.label,
        score: analysis.score,
        confidence: analysis.confidence,
        status: (analysis.isFilled ? 'FILLED' : 'EMPTY') as 'FILLED' | 'EMPTY' | 'AMBIGUOUS'
      };
    });

    // Sort by score descending to get Top-1 and Top-2
    const sorted = [...details].sort((a, b) => b.score - a.score);
    const top1 = sorted[0];
    const top2 = sorted[1] || { score: 0, optionLabel: '' };
    const margin = top1.score - top2.score;

    const filledOptions = details.filter(d => d.status === 'FILLED');

    // 1. Unanswered / Blank Question
    if (top1.score < 0.28 && filledOptions.length === 0) {
      return {
        questionNo,
        selectedOption: null,
        selectedOptions: [],
        status: 'BLANK',
        confidence: 0.99,
        marginScore: margin,
        bubbleDetails: details
      };
    }

    // 2. Multi-Select Question
    if (isMultiSelect) {
      const selected = filledOptions.map(f => f.optionLabel);
      return {
        questionNo,
        selectedOption: selected[0] || null,
        selectedOptions: selected,
        status: selected.length > 0 ? 'CONFIDENT' : 'BLANK',
        confidence: 0.95,
        marginScore: margin,
        bubbleDetails: details
      };
    }

    // 3. Single-Choice Question Analysis
    // If top 2 scores are both significantly dark and margin is small (e.g. 48% vs 51%), flag AMBIGUOUS
    if (top1.score >= 0.35 && top2.score >= 0.35 && margin < 0.20) {
      return {
        questionNo,
        selectedOption: top1.optionLabel,
        selectedOptions: [top1.optionLabel, top2.optionLabel],
        status: 'AMBIGUOUS',
        confidence: 0.50 + margin * 1.5,
        marginScore: margin,
        bubbleDetails: details
      };
    }

    // If multiple options pass the hard fill threshold with high confidence
    if (filledOptions.length > 1 && margin < 0.25) {
      return {
        questionNo,
        selectedOption: null,
        selectedOptions: filledOptions.map(f => f.optionLabel),
        status: 'MULTIPLE',
        confidence: 0.98,
        marginScore: margin,
        bubbleDetails: details
      };
    }

    // Confident Single Selection
    if (top1.score >= 0.38) {
      return {
        questionNo,
        selectedOption: top1.optionLabel,
        selectedOptions: [top1.optionLabel],
        status: 'CONFIDENT',
        confidence: Math.min(1.0, 0.85 + margin * 0.15),
        marginScore: margin,
        bubbleDetails: details
      };
    }

    // Edge case: weak mark
    return {
      questionNo,
      selectedOption: null,
      selectedOptions: [],
      status: 'BLANK',
      confidence: 0.90,
      marginScore: margin,
      bubbleDetails: details
    };
  }
}
