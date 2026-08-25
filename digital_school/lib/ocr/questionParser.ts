/**
 * Multilingual & Mathematical LaTeX Question Parser Engine
 * Converts raw OCR text into structured questions with clean LaTeX equations, options, answers, and tags.
 */

export interface ExtractedOption {
  key: 'A' | 'B' | 'C' | 'D';
  label: string; // e.g. "(ক)" or "(A)"
  text: string;  // option text with inline LaTeX
}

export interface ExtractedQuestion {
  id: string;
  questionNumber: number;
  stem: string;                  // Question text with clean LaTeX ($...$)
  rawText: string;
  options: ExtractedOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | '';
  explanation: string;
  subject: string;
  chapter: string;
  classLevel: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionType: 'MCQ' | 'CQ' | 'INT' | 'SHORT_ANSWER';
  language: 'Bangla' | 'English' | 'Mixed';
  confidence: number;
}

/**
 * Converts Bengali digits to English digits
 */
export function convertBengaliDigitsToEnglish(str: string): string {
  if (!str) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = str;
  bnDigits.forEach((d, i) => {
    res = res.split(d).join(String(i));
  });
  return res;
}

/**
 * Normalizes mathematical expressions and converts to clean LaTeX format.
 */
export function convertTextToLatexEquations(text: string): string {
  if (!text) return '';

  let res = text.trim();

  // 1. Normalize unicode math symbols
  res = res.replace(/[\u2212\u2013\u2014]/g, '-');
  res = res.replace(/[×✕✖]/g, ' \\times ');
  res = res.replace(/[÷]/g, ' \\div ');
  res = res.replace(/[≤⩽]/g, ' \\le ');
  res = res.replace(/[≥⩾]/g, ' \\ge ');
  res = res.replace(/[≠]/g, ' \\neq ');
  res = res.replace(/[≈∼]/g, ' \\approx ');
  res = res.replace(/[±]/g, ' \\pm ');
  res = res.replace(/[√]/g, ' \\sqrt ');
  res = res.replace(/[∞]/g, ' \\infty ');
  res = res.replace(/[π]/g, ' \\pi ');
  res = res.replace(/[θ]/g, ' \\theta ');
  res = res.replace(/[α]/g, ' \\alpha ');
  res = res.replace(/[β]/g, ' \\beta ');
  res = res.replace(/[λ]/g, ' \\lambda ');
  res = res.replace(/[Δ]/g, ' \\Delta ');
  res = res.replace(/[Σ]/g, ' \\sum ');
  res = res.replace(/=>|\\implies|-->|→/g, ' \\implies ');

  // 2. Degrees: 90° -> 90^\circ
  res = res.replace(/(\d+(?:\.\d+)?)\s*°/g, '$1^\\circ');

  // 3. Exponents: x^2, y^3, 10^-3, a^(b+c) -> x^{2}, y^{3}, 10^{-3}, a^{b+c}
  res = res.replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9\-]+)/g, '$1^{$2}');

  // 4. Subscripts: x_1, a_n -> x_{1}, a_{n}
  res = res.replace(/([a-zA-Z])_([a-zA-Z0-9]+)/g, '$1_{$2}');

  // 5. Square roots: sqrt(x+1) or \sqrt (x+1) -> \sqrt{x+1}
  res = res.replace(/\\?sqrt\s*\(([^)]+)\)/gi, '\\sqrt{$1}');
  res = res.replace(/\\?sqrt\s*\{([^}]+)\)/gi, '\\sqrt{$1}');

  // 6. Simple fractions: (a+b)/(c+d) or 1/2 or x/y
  res = res.replace(/\(([a-zA-Z0-9\s\+\-\*\^]+)\)\s*\/\s*\(([a-zA-Z0-9\s\+\-\*\^]+)\)/g, '\\frac{$1}{$2}');
  res = res.replace(/(\b[a-zA-Z0-9]{1,4})\s*\/\s*([a-zA-Z0-9]{1,4}\b)/g, '\\frac{$1}{$2}');

  // 7. Trigonometric / log / calculus: \int, \sin, \cos, \log
  res = res.replace(/(?:\\+)?(sin|cos|tan|cot|sec|cosec|log|ln|lim|int|sum)\b(?!\w)/gi, (m) => {
    const fn = m.replace(/^\\+/, '').toLowerCase();
    return '\\' + fn + ' ';
  });

  // 8. Auto-wrap recognized formula blocks in $...$ if not already wrapped
  if (!res.includes('$')) {
    // If the whole string is an equation like "2x^2 + 5x - 3 = 0" or "\frac{1}{2}"
    const isPureMath = /^([a-zA-Z0-9\s\+\-\*\/\^=_{}\\\(\)\.\,]+)$/.test(res) &&
      (/[\\\{\}\^_\+\-\*\/=]/.test(res) || /\\[a-zA-Z]+/.test(res));

    if (isPureMath && !/^(the|and|is|or|of|in|for)\b/i.test(res)) {
      res = `$${res}$`;
    } else {
      // Inline equation wrapping for parts like "2x^{2} + 5x = 0" or "\frac{1}{2}"
      res = res.replace(/(\\frac\{[^{}]+\}\{[^{}]+\}|\\[a-zA-Z]+(?:\s*\{[^{}]+\})*|[a-zA-Z0-9]+(?:\^[^{}\s]+|\^{[^{}]+}|\_[^{}\s]+|\_{[^{}]+})|[a-zA-Z0-9\(\)\+\-\*\/\^=]{3,}(?:\s*[\+\-\*=]\s*[a-zA-Z0-9\(\)\+\-\*\/\^=]+)+)/g, (match) => {
        if (/^[a-zA-Z]{3,}$/.test(match)) return match; // skip plain words
        return `$${match.trim()}$`;
      });
    }
  }

  // Clean up double dollar signs and malformed spacing
  res = res.replace(/\$\s*\$/g, '');
  res = res.replace(/\$\$+/g, '$');
  res = res.replace(/\$\s+([^\$]+?)\s+\$/g, ' $$1$ ');

  return res.trim();
}

/**
 * Detects the subject hint from question text
 */
export function inferSubjectAndChapter(text: string): { subject: string; chapter: string } {
  const lower = text.toLowerCase();
  
  if (/(\bphysics\b|পদার্থ|ত্বরণ|গতি|বল|মহাকর্ষ|কাজ|শক্তি|ক্ষমতা|তরঙ্গ|শব্দ|আলো|প্রতিসরণ|তড়িৎ|চৌম্বক|ভর|বেগ|নিউটনের)/i.test(lower)) {
    return { subject: 'Physics', chapter: 'General Physics & Mechanics' };
  }
  if (/(\bchemistry\b|রসায়ন|পরমাণু|মৌল|যৌগ|বিক্রিয়া|বন্ধন|এসিড|ক্ষার|লবণ|জারণ|বিজারণ|পর্যায় সারণী|কার্বন)/i.test(lower)) {
    return { subject: 'Chemistry', chapter: 'General Chemistry' };
  }
  if (/(\bmath\b|গণিত|সমীকরণ|বীজগণিত|জ্যামিতি|ত্রিকোণমিতি|ফাংশন|স্থানাঙ্ক|ম্যাট্রিক্স|অন্তরীকরণ|যোগজীকরণ|সেট)/i.test(lower) || /\\[a-zA-Z]+|\^\{|\_\{|\\frac/.test(lower)) {
    return { subject: 'Higher Mathematics', chapter: 'Algebra & Calculus' };
  }
  if (/(\bbiology\b|জীববিজ্ঞান|কোষ|উদ্ভিদ|প্রাণী|ডিএনএ|আরএনএ|জিন|শ্বসন|সালোকসংশ্লেষণ|হৃৎপিণ্ড|রক্ত)/i.test(lower)) {
    return { subject: 'Biology', chapter: 'Cell Biology & Genetics' };
  }
  if (/(\bict\b|কম্পিউটার|বাইনারি|হেক্সা|এইচটিএমএল|ডাটাবেস|সি প্রোগ্রাম|লজিক গেট|নেটওয়ার্ক)/i.test(lower)) {
    return { subject: 'ICT', chapter: 'Information & Logic Systems' };
  }
  if (/(\benglish\b|grammar|preposition|passage|antonym|synonym|tense|voice|narration)/i.test(lower)) {
    return { subject: 'English', chapter: 'English Grammar & Vocabulary' };
  }
  if (/[অ-হ]/.test(lower)) {
    return { subject: 'General Math / Bangla', chapter: 'Standard Curriculum' };
  }

  return { subject: 'General Mathematics', chapter: 'General Topics' };
}

/**
 * Parses raw OCR text block into an array of structured questions.
 */
export function parseRawOcrTextToQuestions(
  ocrText: string,
  options: { defaultClass?: string; defaultSubject?: string } = {}
): ExtractedQuestion[] {
  if (!ocrText || !ocrText.trim()) return [];

  const lines = ocrText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rawBlocks: string[] = [];
  let currentBlock: string[] = [];

  // Question start regex patterns: "১.", "২)", "প্রশ্ন ১:", "(১)", "1.", "2)", "Q1."
  const qStartRegex = /^(?:(?:প্রশ্ন|Q|Question)\s*[:\.]?\s*|(?:\()?)([০-৯\d]+)(?:[\.\)\:\-\/\]]|\s*[\.\)])\s*(.*)/i;

  for (const line of lines) {
    if (qStartRegex.test(line)) {
      if (currentBlock.length > 0) {
        rawBlocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
    }
    currentBlock.push(line);
  }
  if (currentBlock.length > 0) {
    rawBlocks.push(currentBlock.join('\n'));
  }

  if (rawBlocks.length === 0 && lines.length > 0) {
    rawBlocks.push(lines.join('\n'));
  }

  const results: ExtractedQuestion[] = [];

  rawBlocks.forEach((blockText, blockIdx) => {
    const q = parseSingleQuestionBlock(blockText, blockIdx + 1, options);
    if (q) results.push(q);
  });

  return results;
}

/**
 * Parses a single question block string into an ExtractedQuestion
 */
function parseSingleQuestionBlock(
  blockText: string,
  indexFallback: number,
  options: { defaultClass?: string; defaultSubject?: string }
): ExtractedQuestion | null {
  const lines = blockText.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let questionNumber = indexFallback;
  let stemLines: string[] = [];
  let rawOptionCandidates: { key: 'A' | 'B' | 'C' | 'D'; label: string; text: string }[] = [];
  let correctAnswer: 'A' | 'B' | 'C' | 'D' | '' = '';
  let explanation = '';

  // Extract Question Number from line 1
  const firstLine = lines[0];
  const qMatch = firstLine.match(/^(?:(?:প্রশ্ন|Q|Question)\s*[:\.]?\s*|(?:\()?)([০-৯\d]+)(?:[\.\)\:\-\/\]]|\s*[\.\)])\s*(.*)/i);
  if (qMatch) {
    const numStr = convertBengaliDigitsToEnglish(qMatch[1]);
    const parsedNum = parseInt(numStr, 10);
    if (!isNaN(parsedNum)) questionNumber = parsedNum;
    if (qMatch[2] && qMatch[2].trim()) {
      stemLines.push(qMatch[2].trim());
    }
  } else {
    stemLines.push(firstLine);
  }

  const keyMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {
    'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D',
    'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D',
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D',
    '১': 'A', '২': 'B', '৩': 'C', '৪': 'D',
    '1': 'A', '2': 'B', '3': 'C', '4': 'D',
    'i': 'A', 'ii': 'B', 'iii': 'C', 'iv': 'D',
    'I': 'A', 'II': 'B', 'III': 'C', 'IV': 'D',
  };

  // Option detection patterns:
  // (a) Line starting with option marker: "(ক) x = 1/2" or "A. x^3"
  const lineStartOptRegex = /^(?:\(|\b)([কখগঘa-dA-D১-৪1-4])(?:\)|\.|\:|\-)\s*(.*)/;
  // (b) Multi-options on single line: "(ক) x = 1/2  (খ) x = -3"
  const inlineMultiOptRegex = /(?:\(|\b)([কখগঘa-dA-D১-৪1-4])(?:\)|\.|\:|\-)\s*([^(\n]+?)(?=(?:\(|\b)[কখগঘa-dA-D১-৪1-4](?:\)|\.|\:|\-)|\s*$)/g;

  let foundOptions = false;

  for (let i = (qMatch ? 1 : 0); i < lines.length; i++) {
    const line = lines[i];

    // Answer Line: "উত্তর: গ" or "Ans: B" or "Answer: C"
    const ansMatch = line.match(/(?:উত্তর|সঠিক উত্তর|Ans(?:wer)?)\s*[:\.\-]?\s*[\(\[]?([কখগঘa-dA-D১-৪1-4])/i);
    if (ansMatch) {
      const k = keyMap[ansMatch[1]];
      if (k) correctAnswer = k;
      continue;
    }

    // Explanation Line: "ব্যাখ্যা: ..." or "Explanation: ..."
    const expMatch = line.match(/(?:ব্যাখ্যা|সমাধান|Explanation|Solution|Note)\s*[:\.\-]?\s*(.*)/i);
    if (expMatch) {
      explanation = convertTextToLatexEquations(expMatch[1] || '');
      continue;
    }

    // Check single-line option start
    const singleMatch = line.match(lineStartOptRegex);
    if (singleMatch && keyMap[singleMatch[1]]) {
      foundOptions = true;
      const rawKey = singleMatch[1];
      const mappedKey = keyMap[rawKey];
      const optText = convertTextToLatexEquations(singleMatch[2] || '');
      rawOptionCandidates.push({
        key: mappedKey,
        label: `(${rawKey})`,
        text: optText,
      });
      continue;
    }

    // Check inline multi options
    const inlineMatches = Array.from(line.matchAll(inlineMultiOptRegex));
    if (inlineMatches.length > 1 && inlineMatches.every(m => keyMap[m[1]])) {
      foundOptions = true;
      inlineMatches.forEach(m => {
        const rawKey = m[1];
        const mappedKey = keyMap[rawKey];
        const optText = convertTextToLatexEquations(m[2] ? m[2].trim() : '');
        rawOptionCandidates.push({
          key: mappedKey,
          label: `(${rawKey})`,
          text: optText,
        });
      });
      continue;
    }

    if (!foundOptions) {
      stemLines.push(line);
    } else {
      // Append line text to the last option
      if (rawOptionCandidates.length > 0) {
        const last = rawOptionCandidates[rawOptionCandidates.length - 1];
        last.text += ' ' + convertTextToLatexEquations(line);
      }
    }
  }

  // Construct options array
  const finalOptions: ExtractedOption[] = [
    { key: 'A', label: '(A)', text: '' },
    { key: 'B', label: '(B)', text: '' },
    { key: 'C', label: '(C)', text: '' },
    { key: 'D', label: '(D)', text: '' },
  ];

  rawOptionCandidates.forEach((cand) => {
    const target = finalOptions.find((o) => o.key === cand.key);
    if (target) {
      target.label = cand.label;
      target.text = cand.text;
    }
  });

  const fullStem = convertTextToLatexEquations(stemLines.join(' '));
  const hasBengali = /[অ-হ]/.test(fullStem) || /[অ-হ]/.test(blockText);
  const hasEnglish = /[a-zA-Z]/.test(fullStem);
  const language = hasBengali && hasEnglish ? 'Mixed' : hasBengali ? 'Bangla' : 'English';

  const { subject, chapter } = inferSubjectAndChapter(fullStem + ' ' + blockText);

  return {
    id: `EXTRACT_${Date.now()}_${questionNumber}`,
    questionNumber,
    stem: fullStem || `Question ${questionNumber}`,
    rawText: blockText,
    options: finalOptions,
    correctAnswer,
    explanation,
    subject: options.defaultSubject || subject,
    chapter: chapter,
    classLevel: options.defaultClass || 'Class 9-10 / SSC',
    difficulty: 'MEDIUM',
    questionType: finalOptions.some(o => o.text.trim()) ? 'MCQ' : 'SHORT_ANSWER',
    language,
    confidence: 0.98,
  };
}
