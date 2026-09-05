// MCQ Question Evaluation & Disambiguation Logic
// Solves collisions between numeric option texts (e.g. "1", "2") and option indices (0, 1, 2)

export const MCQ_LABELS_BN = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];
export const MCQ_LABELS_EN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

export function normalizeOptions(rawOptions: any): any[] {
  if (Array.isArray(rawOptions)) return rawOptions;
  if (typeof rawOptions === 'string') {
    try {
      const parsed = JSON.parse(rawOptions);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

export function getOptionText(opt: any): string {
  if (opt === undefined || opt === null) return '';
  if (typeof opt === 'object') {
    return String(opt.text ?? opt.value ?? opt.label ?? '').trim();
  }
  return String(opt).trim();
}

/**
 * Accurately determines which option index was selected by the student.
 * 
 * CRITICAL RULE:
 * If userAns matches the text of ANY option in the list, then that option was chosen by text.
 * It MUST NEVER be re-interpreted as a 0-based or 1-based index of another option!
 * (e.g., if options are ["3", "2", "1", "অসংখ্য"] and userAns is "1", the user selected
 * option 2 (text "1"), NOT option 1 (index 1)).
 */
export function findSelectedOptionIndex(options: any[], userAns: any): number {
  if (userAns === undefined || userAns === null || userAns === '' || userAns === 'No answer provided') {
    return -1;
  }

  const clean = (s: any) => String(s !== undefined && s !== null ? s : '').trim().toLowerCase();

  let rawVal = userAns;
  if (typeof rawVal === 'object' && rawVal !== null) {
    rawVal = rawVal.selectedOption ?? rawVal.answer ?? rawVal.value ?? rawVal.text ?? rawVal.option;
  }
  const cleanU = clean(rawVal);
  if (!cleanU) return -1;

  const opts = normalizeOptions(options);
  if (opts.length === 0) return -1;

  // 1. HIGHEST PRIORITY: Exact text match against option text
  for (let i = 0; i < opts.length; i++) {
    const optText = clean(getOptionText(opts[i]));
    if (optText && optText === cleanU) {
      return i;
    }
  }

  // 2. Check Bengali and English label matching ONLY IF no option text matched
  const bnIdx = MCQ_LABELS_BN.indexOf(cleanU);
  if (bnIdx !== -1 && bnIdx < opts.length) {
    return bnIdx;
  }

  const enIdx = MCQ_LABELS_EN.indexOf(cleanU);
  if (enIdx !== -1 && enIdx < opts.length) {
    return enIdx;
  }

  // 3. Numeric index matching ONLY IF no option text matched
  if (typeof rawVal === 'number' && Number.isInteger(rawVal) && rawVal >= 0 && rawVal < opts.length) {
    return rawVal;
  }
  if (/^\d+$/.test(cleanU)) {
    const num = parseInt(cleanU, 10);
    // Prefer 0-based index
    if (num >= 0 && num < opts.length) {
      return num;
    }
  }

  return -1;
}

/**
 * Returns the set of correct option indices (0-based) for a question.
 */
export function getMCQCorrectIndices(options: any[], qObj: any): Set<number> {
  const correctIndices = new Set<number>();
  const correctTexts: string[] = [];
  const opts = normalizeOptions(options);
  const clean = (s: any) => String(s !== undefined && s !== null ? s : '').trim().toLowerCase();

  if (opts.length === 0) return correctIndices;

  // 1. Direct isCorrect on option objects
  opts.forEach((opt: any, idx: number) => {
    const optText = clean(getOptionText(opt));
    if (typeof opt === 'object' && opt?.isCorrect === true) {
      correctIndices.add(idx);
      if (optText) correctTexts.push(optText);
    }
  });

  // 2. modelAnswer (option text match)
  if (qObj?.modelAnswer !== undefined && qObj?.modelAnswer !== null) {
    const mText = clean(qObj.modelAnswer);
    opts.forEach((opt: any, idx: number) => {
      const optText = clean(getOptionText(opt));
      if (optText && optText === mText) {
        correctIndices.add(idx);
        if (!correctTexts.includes(optText)) correctTexts.push(optText);
      }
    });
  }

  // 3. correctOption (explicit index field)
  if (qObj?.correctOption !== undefined && qObj?.correctOption !== null && qObj.correctOption !== '') {
    const cOpt = qObj.correctOption;
    const cNum = typeof cOpt === 'number' ? cOpt : parseInt(String(cOpt).trim(), 10);
    if (!isNaN(cNum)) {
      if (cNum >= 0 && cNum < opts.length) {
        correctIndices.add(cNum);
        const optText = clean(getOptionText(opts[cNum]));
        if (optText && !correctTexts.includes(optText)) correctTexts.push(optText);
      }
    }
  }

  // 4. correct / correctAnswer fields
  const checkAnswerField = (rawField: any) => {
    if (rawField === undefined || rawField === null || rawField === '') return;
    const cleanField = clean(rawField);

    // A. First check if matches any option text directly
    let matchedByText = false;
    opts.forEach((opt: any, idx: number) => {
      const optText = clean(getOptionText(opt));
      if (optText && optText === cleanField) {
        correctIndices.add(idx);
        if (!correctTexts.includes(optText)) correctTexts.push(optText);
        matchedByText = true;
      }
    });

    // If it matched an option text, do not treat it as an index of a different option
    if (matchedByText) return;

    // B. Check labels
    const bnIdx = MCQ_LABELS_BN.indexOf(cleanField);
    if (bnIdx !== -1 && bnIdx < opts.length) {
      correctIndices.add(bnIdx);
      const optText = clean(getOptionText(opts[bnIdx]));
      if (optText && !correctTexts.includes(optText)) correctTexts.push(optText);
      return;
    }

    const enIdx = MCQ_LABELS_EN.indexOf(cleanField);
    if (enIdx !== -1 && enIdx < opts.length) {
      correctIndices.add(enIdx);
      const optText = clean(getOptionText(opts[enIdx]));
      if (optText && !correctTexts.includes(optText)) correctTexts.push(optText);
      return;
    }

    // C. Check index
    if (typeof rawField === 'number' && Number.isInteger(rawField) && rawField >= 0 && rawField < opts.length) {
      correctIndices.add(rawField);
      const optText = clean(getOptionText(opts[rawField]));
      if (optText && !correctTexts.includes(optText)) correctTexts.push(optText);
      return;
    }
    if (/^\d+$/.test(cleanField)) {
      const num = parseInt(cleanField, 10);
      if (num >= 0 && num < opts.length) {
        correctIndices.add(num);
        const optText = clean(getOptionText(opts[num]));
        if (optText && !correctTexts.includes(optText)) correctTexts.push(optText);
      }
    }
  };

  checkAnswerField(qObj?.correct);
  checkAnswerField(qObj?.correctAnswer);

  // 5. Expand identical options (e.g. duplicate options sharing the exact text)
  if (correctTexts.length > 0) {
    opts.forEach((opt: any, idx: number) => {
      const optText = clean(getOptionText(opt));
      if (optText && correctTexts.includes(optText)) {
        correctIndices.add(idx);
      }
    });
  }

  return correctIndices;
}

/**
 * Checks whether the student's answer to an MCQ question is correct.
 */
export function isMCQAnswerCorrect(options: any[], userAns: any, qObj: any): boolean {
  if (userAns === undefined || userAns === null || userAns === '' || userAns === 'No answer provided') {
    return false;
  }

  const selectedIdx = findSelectedOptionIndex(options, userAns);
  if (selectedIdx === -1) {
    return false;
  }

  const correctIndices = getMCQCorrectIndices(options, qObj);
  return correctIndices.has(selectedIdx);
}

/**
 * Evaluates an MCQ question, calculating the score with negative marking support.
 */
export function evaluateMCQQuestion(
  question: any,
  userAnswer: any,
  examSettings?: { mcqNegativeMarking?: number }
): { score: number; isCorrect: boolean; hasAttempted: boolean; selectedIdx: number; correctIndices: Set<number> } {
  const options = normalizeOptions(question?.options);
  const clean = (s: any) => String(s !== undefined && s !== null ? s : '').trim().toLowerCase();

  let rawVal = userAnswer;
  if (typeof rawVal === 'object' && rawVal !== null) {
    rawVal = rawVal.selectedOption ?? rawVal.answer ?? rawVal.value ?? rawVal.text ?? rawVal.option;
  }
  const cleanU = clean(rawVal);
  const hasAttempted = cleanU !== '' && cleanU !== 'no answer provided';

  if (!hasAttempted) {
    return {
      score: 0,
      isCorrect: false,
      hasAttempted: false,
      selectedIdx: -1,
      correctIndices: getMCQCorrectIndices(options, question)
    };
  }

  const selectedIdx = findSelectedOptionIndex(options, rawVal);
  const correctIndices = getMCQCorrectIndices(options, question);
  const isCorrect = selectedIdx !== -1 && correctIndices.has(selectedIdx);

  const marks = Number(question?.marks) || 1;
  let score = 0;

  if (isCorrect) {
    score = marks;
  } else {
    const negPct = examSettings?.mcqNegativeMarking;
    if (negPct && negPct > 0) {
      score = -Math.round(((marks * negPct) / 100) * 100) / 100;
    }
  }

  return {
    score,
    isCorrect,
    hasAttempted: true,
    selectedIdx,
    correctIndices
  };
}
