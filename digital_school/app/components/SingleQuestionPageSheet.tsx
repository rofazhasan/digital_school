import React, { useState } from 'react';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from '@/lib/utils';
import { toBengaliNumerals } from '@/utils/numeralConverter';
import { BeautifulChart } from "@/app/components/BeautifulChart";

interface SingleQuestionPageSheetProps {
  sheetInfo: {
    title: string;
    schoolName?: string;
    schoolAddress?: string;
    class?: string;
    subject?: string;
    date?: string;
    duration?: string;
    totalMarks?: string;
  };
  questions: any[];
  showAnswers?: boolean;
  fontSize?: number;
  language?: 'bn' | 'en';
  showStudentHeader?: boolean;
  watermarkText?: string;
  paperSize?: 'a4' | 'legal' | 'letter';
  singleStyle?: 'vertical' | 'split';
}

const MCQ_LABELS_BN = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const MCQ_LABELS_EN = ['A', 'B', 'C', 'D', 'E', 'F'];
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ'];
const ENGLISH_SUB_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'];

const MathText = ({ children }: { children: string }) => (
  <span className="whitespace-pre-wrap">
    <UniversalMathJax inline dynamic>
      {cleanupMath(children || "")}
    </UniversalMathJax>
  </span>
);

const QUESTION_TYPE_LABELS_BN: Record<string, string> = {
  MCQ: "বহুনির্বাচনী",
  MC: "বহুপদী বহুনির্বাচনী",
  CQ: "সৃজনশীল",
  SQ: "সংক্ষিপ্ত প্রশ্ন",
  AR: "দৃঢ়োক্তি-কারণ",
  MTF: "মিলকরণ",
  INT: "পূর্ণসংখ্যার উত্তর",
  SMCQ: "উদ্দীপক বহুনির্বাচনী",
  DESCRIPTIVE: "বর্ণনামূলক"
};

const QUESTION_TYPE_LABELS_EN: Record<string, string> = {
  MCQ: "Multiple Choice",
  MC: "Multiple Choice (MC)",
  CQ: "Comprehension (CQ)",
  SQ: "Short Answer",
  AR: "Assertion-Reason",
  MTF: "Matching",
  INT: "Integer Answer",
  SMCQ: "Stem MCQ",
  DESCRIPTIVE: "Descriptive"
};

const getArOptions = (isBn: boolean) => [
  { text: isBn ? 'Assertion ও Reason উভয়ই সত্য এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা।' : 'Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.', isCorrect: false },
  { text: isBn ? 'Assertion ও Reason উভয়ই সত্য কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়।' : 'Both Assertion and Reason are true, but Reason is not the correct explanation of Assertion.', isCorrect: false },
  { text: isBn ? 'Assertion সত্য কিন্তু Reason মিথ্যা।' : 'Assertion is true but Reason is false.', isCorrect: false },
  { text: isBn ? 'Assertion মিথ্যা কিন্তু Reason সত্য।' : 'Assertion is false but Reason is true.', isCorrect: false },
  { text: isBn ? 'Assertion ও Reason উভয়ই মিথ্যা।' : 'Both Assertion and Reason are false.', isCorrect: false },
];

/**
 * BEST ALGORITHM: Universal Safe Question Normalizer with Robust Model Answer & Explanation Resolver
 * Normalizes all question types (CQ, MCQ, AR, MTF, INT, SQ) into clean structure
 */
export function normalizeQuestionData(q: any) {
  if (!q) {
    return {
      id: '',
      questionText: '',
      type: 'MCQ',
      marks: 1,
      options: [],
      subQuestions: [],
      leftColumn: [],
      rightColumn: [],
      images: [],
      assertion: '',
      reason: '',
      integerAnswer: undefined,
      modelAnswer: '',
      explanation: '',
      correctAnswer: '',
      matches: {}
    };
  }

  // 1. Question Text & Type
  const questionText = q.questionText || q.question || q.q || q.stem || "";
  const type = (q.type || 'MCQ').toUpperCase();

  // 2. Assertion & Reason (AR)
  let assertion = q.assertion || "";
  let reason = q.reason || "";

  // 3. Integer Answer (INT)
  let integerAnswer = q.integerAnswer !== undefined 
    ? q.integerAnswer 
    : (q.correctAnswer !== undefined ? q.correctAnswer : (q.answer !== undefined ? q.answer : q.correctOption));

  // 4. Options
  let options: any[] = [];
  if (Array.isArray(q.options)) {
    options = q.options;
  } else if (typeof q.options === 'string') {
    try {
      const parsed = JSON.parse(q.options);
      if (Array.isArray(parsed)) options = parsed;
      else if (parsed && typeof parsed === 'object') {
        if (parsed.options && Array.isArray(parsed.options)) options = parsed.options;
        if (!assertion && parsed.assertion) assertion = parsed.assertion;
        if (!reason && parsed.reason) reason = parsed.reason;
        if (integerAnswer === undefined && parsed.integerAnswer !== undefined) integerAnswer = parsed.integerAnswer;
      }
    } catch (e) {}
  } else if (q.options && typeof q.options === 'object') {
    if (Array.isArray(q.options.options)) options = q.options.options;
    if (!assertion && q.options.assertion) assertion = q.options.assertion;
    if (!reason && q.options.reason) reason = q.options.reason;
    if (integerAnswer === undefined && q.options.integerAnswer !== undefined) integerAnswer = q.options.integerAnswer;
  } else if (q.optionA || q.optionB || q.optionC || q.optionD) {
    options = [
      { label: 'ক', text: q.optionA, isCorrect: q.correctOption === 0 || q.correctAnswer === 'A' },
      { label: 'খ', text: q.optionB, isCorrect: q.correctOption === 1 || q.correctAnswer === 'B' },
      { label: 'গ', text: q.optionC, isCorrect: q.correctOption === 2 || q.correctAnswer === 'C' },
      { label: 'ঘ', text: q.optionD, isCorrect: q.correctOption === 3 || q.correctAnswer === 'D' },
    ].filter(o => Boolean(o.text));
  }

  // Normalize option objects and ensure isCorrect is resolved accurately
  if (Array.isArray(options) && options.length > 0) {
    let foundIdx = options.findIndex((o: any) => typeof o === 'object' && (o.isCorrect === true || String(o.isCorrect) === 'true'));
    let dbCorrectIdx = foundIdx;
    if (dbCorrectIdx === -1) {
      if (q.correctOption !== undefined && q.correctOption !== null) {
        const num = Number(q.correctOption);
        dbCorrectIdx = num > 0 && num <= options.length ? num - 1 : num;
      } else if (q.correctAnswer) {
        const str = String(q.correctAnswer).trim().toUpperCase();
        const letterMap: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5 };
        if (letterMap[str] !== undefined) dbCorrectIdx = letterMap[str];
        else if (!isNaN(parseInt(str))) dbCorrectIdx = parseInt(str);
      }
    }

    options = options.map((opt: any, idx: number) => {
      const optObj = typeof opt === 'string' ? { text: opt } : { ...opt };
      const isOptCorrect = foundIdx !== -1
        ? idx === foundIdx
        : (dbCorrectIdx >= 0 ? idx === dbCorrectIdx : (optObj.isCorrect === true || String(optObj.isCorrect) === 'true'));
      return {
        ...optObj,
        isCorrect: isOptCorrect
      };
    });
  }


  // 5. Sub-Questions (CQ / Descriptive)
  let subQuestions: any[] = [];
  const rawSub = q.subQuestions || q.sub_questions || q.parts || q.subquestions;
  if (Array.isArray(rawSub)) {
    subQuestions = rawSub.map((sub: any) => {
      const qText = sub.questionText || sub.question || sub.text || "";
      const mAns = sub.modelAnswer || sub.model_answer || sub.answer || sub.solution || sub.correctAnswer || "";
      const exp = sub.explanation || sub.expl || sub.hint || sub.note || "";
      return {
        ...sub,
        questionText: qText,
        question: qText,
        modelAnswer: mAns,
        answer: mAns,
        explanation: exp
      };
    });
  } else if (typeof rawSub === 'string') {
    try {
      const parsed = JSON.parse(rawSub);
      if (Array.isArray(parsed)) {
        subQuestions = parsed.map((sub: any) => {
          const qText = sub.questionText || sub.question || sub.text || "";
          const mAns = sub.modelAnswer || sub.model_answer || sub.answer || sub.solution || sub.correctAnswer || "";
          const exp = sub.explanation || sub.expl || sub.hint || sub.note || "";
          return {
            ...sub,
            questionText: qText,
            question: qText,
            modelAnswer: mAns,
            answer: mAns,
            explanation: exp
          };
        });
      }
    } catch (e) {}
  }

  // 6. Matching Columns (MTF Two Side)
  let leftColumn: any[] = [];
  let rightColumn: any[] = [];
  const rawLeft = q.leftColumn || q.left_column || q.left || (q.options && q.options.leftColumn);
  const rawRight = q.rightColumn || q.right_column || q.right || (q.options && q.options.rightColumn);

  if (Array.isArray(rawLeft)) leftColumn = rawLeft;
  else if (typeof rawLeft === 'string') {
    try { const p = JSON.parse(rawLeft); if (Array.isArray(p)) leftColumn = p; } catch (e) {}
  }

  if (Array.isArray(rawRight)) rightColumn = rawRight;
  else if (typeof rawRight === 'string') {
    try { const p = JSON.parse(rawRight); if (Array.isArray(p)) rightColumn = p; } catch (e) {}
  }

  // 7. Images
  let images: string[] = [];
  if (Array.isArray(q.images)) images = q.images;
  else if (typeof q.images === 'string') {
    try {
      const p = JSON.parse(q.images);
      if (Array.isArray(p)) images = p;
      else if (typeof p === 'string') images = [p];
    } catch (e) {
      if (q.images.startsWith('http') || q.images.startsWith('data:')) images = [q.images];
    }
  }

  // 8. Model Answer & Explanation Resolvers with All Possible Field Aliases
  let modelAnswer = q.modelAnswer || q.model_answer || q.answer || q.solution || q.correctAnswer || q.correctOptionText || "";
  let explanation = q.explanation || q.expl || q.hint || q.note || q.solutionExplanation || "";

  if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
    if (!modelAnswer && q.options.modelAnswer) modelAnswer = q.options.modelAnswer;
    if (!modelAnswer && q.options.answer) modelAnswer = q.options.answer;
    if (!modelAnswer && q.options.solution) modelAnswer = q.options.solution;
    if (!explanation && q.options.explanation) explanation = q.options.explanation;
    if (!explanation && q.options.expl) explanation = q.options.expl;
    if (!explanation && q.options.hint) explanation = q.options.hint;
  }

  // Fallback 1: Auto-generate Model Answer for MCQ / INT / MTF / CQ if empty
  if (!modelAnswer) {
    if (type === 'MCQ' || type === 'MC' || type === 'SMCQ') {
      const correctIdx = options.findIndex((o: any) => o.isCorrect || q.correctOption === options.indexOf(o));
      if (correctIdx !== -1) {
        const labels = ['(ক)', '(খ)', '(গ)', '(ঘ)'];
        const text = typeof options[correctIdx] === 'string' ? options[correctIdx] : (options[correctIdx].text || '');
        modelAnswer = `${labels[correctIdx] || ''} ${text}`.trim();
      } else if (q.correctAnswer) {
        modelAnswer = `উত্তর: ${q.correctAnswer}`;
      }
    } else if (type === 'INT' && integerAnswer !== undefined) {
      modelAnswer = `সঠিক পূর্ণসংখ্যার উত্তর: ${integerAnswer}`;
    } else if (type === 'MTF' && leftColumn.length > 0) {
      const matches = q.matches || {};
      const pairs = leftColumn.map((item: any, i: number) => {
        const rId = matches[item.id];
        const rIdx = rightColumn.findIndex((r: any) => r.id === rId);
        const rLabel = rIdx !== -1 ? String.fromCharCode(65 + rIdx) : '?';
        return `(${i + 1} → ${rLabel})`;
      });
      if (pairs.length > 0) modelAnswer = pairs.join(', ');
    } else if ((type === 'CQ' || type === 'DESCRIPTIVE') && subQuestions.length > 0) {
      const subAns = subQuestions
        .filter((s: any) => Boolean(s.modelAnswer))
        .map((s: any, i: number) => `(${['ক', 'খ', 'গ', 'ঘ'][i] || i + 1}) ${s.modelAnswer}`);
      if (subAns.length > 0) modelAnswer = subAns.join('\n');
    }
  }

  // Fallback 2: Aggregate sub-question explanations into main explanation if main is empty
  if (!explanation && subQuestions.length > 0) {
    const subExpls = subQuestions
      .filter((s: any) => Boolean(s.explanation))
      .map((s: any, i: number) => `(${['ক', 'খ', 'গ', 'ঘ'][i] || i + 1}) ${s.explanation}`);
    if (subExpls.length > 0) explanation = subExpls.join('\n');
  }

  return {
    id: q.id || String(Math.random()),
    questionText,
    type,
    subject: q.subject,
    marks: q.marks || (type === 'CQ' ? 10 : 1),
    customMarks: q.customMarks,
    customNote: q.customNote,
    difficulty: q.difficulty,
    topic: q.topic,
    assertion,
    reason,
    integerAnswer,
    options,
    subQuestions,
    leftColumn,
    rightColumn,
    images,
    modelAnswer,
    explanation,
    correctAnswer: q.correctAnswer || modelAnswer,
    matches: q.matches
  };
}

/**
 * Adaptive Workspace Line Counter Algorithm
 */
const calculateAdaptiveLineCount = (question: any, isSplit: boolean): number => {
  const qTextLen = (question.questionText || question.q || '').length;
  const subCount = (question.subQuestions || question.sub_questions || question.parts || []).length;
  const optCount = (question.options || []).length;

  if (isSplit) {
    return Math.max(14, 22 - Math.floor((qTextLen / 100) + subCount * 2));
  } else {
    return Math.max(10, 18 - Math.floor((qTextLen / 80) + subCount * 2 + optCount));
  }
};

/**
 * Clean Ruled Notebook Workspace Component (Expands to fill 100% height in Landscape mode)
 */
const RuledNotebookWorkspace: React.FC<{ isBn: boolean; lineCount?: number; marksStr: string; title?: string; fullHeight?: boolean }> = ({
  isBn,
  lineCount = 14,
  marksStr,
  title,
  fullHeight = false
}) => {
  const finalLineCount = fullHeight ? Math.max(lineCount, 16) : lineCount;

  return (
    <div className={`w-full border-2 border-indigo-200 dark:border-indigo-800 rounded-xl bg-white shadow-sm overflow-hidden p-4 relative print:border-gray-400 ${fullHeight ? 'h-full flex flex-col justify-between' : ''}`}>
      <div className="flex justify-between items-center border-b pb-2 mb-3 shrink-0">
        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 print:text-black">
          📝 {title || (isBn ? "উত্তর প্রদান ও সমাধানের স্থান" : "Answer & Solution Workspace")}
        </span>
        <span className="text-xs font-bold border border-black px-2.5 py-0.5 rounded bg-gray-50 print:bg-white print:text-black">
          {isBn ? `প্রাপ্ত নম্বর: ______ / ${marksStr}` : `Score: ______ / ${marksStr}`}
        </span>
      </div>

      {/* Ruled Notebook Paper Area with Red Margin (Fills remaining height) */}
      <div className="relative w-full border-l-2 border-red-400/80 pl-4 py-1 flex-1 flex flex-col justify-between min-h-[300px]">
        {Array.from({ length: finalLineCount }).map((_, i) => (
          <div key={i} className="border-b border-blue-200/90 w-full print:border-gray-300 flex-1 my-1.5" />
        ))}
      </div>
    </div>
  );
};

export default function SingleQuestionPageSheet({
  sheetInfo,
  questions = [],
  showAnswers = false,
  fontSize = 100,
  language = 'bn',
  showStudentHeader = false,
  watermarkText = "",
  paperSize = 'a4',
  singleStyle = 'split'
}: SingleQuestionPageSheetProps) {
  const isBn = language === 'bn';
  const mcqLabels = isBn ? MCQ_LABELS_BN : MCQ_LABELS_EN;
  const subLabels = isBn ? BENGALI_SUB_LABELS : ENGLISH_SUB_LABELS;

  // Track extra working pages appended per question ID
  const [extraPages, setExtraPages] = useState<Record<string, number>>({});

  const toggleAddExtraPage = (qId: string) => {
    setExtraPages(prev => ({
      ...prev,
      [qId]: (prev[qId] || 0) + 1
    }));
  };

  const toggleRemoveExtraPage = (qId: string) => {
    setExtraPages(prev => ({
      ...prev,
      [qId]: Math.max(0, (prev[qId] || 0) - 1)
    }));
  };

  // Authentic Bengali Font Family matching QuestionPaper.tsx
  const bengaliFontFamily = "'ExamFont', 'Noto Serif Bengali', Kalpurush, 'Hind Siliguri', Georgia, serif";
  const englishFontFamily = "'Bookman Old Style', 'Georgia', serif";

  const fontScaleStyle = {
    fontFamily: isBn ? bengaliFontFamily : englishFontFamily,
    fontSize: `${(fontSize / 100) * 1.05}rem`,
    lineHeight: 1.6
  };

  const pageMinHeight = singleStyle === 'split' 
    ? 'min-h-[195mm] print:h-[195mm]' 
    : (paperSize === 'legal' ? 'min-h-[345mm]' : paperSize === 'letter' ? 'min-h-[269mm]' : 'min-h-[287mm]');

  return (
    <div 
      className="w-full text-black print:text-black"
      style={{ fontFamily: isBn ? bengaliFontFamily : englishFontFamily }}
    >
      {/* INJECT DYNAMIC PRINT MEDIA STYLES TO AUTO-SET LANDSCAPE PAPER ORIENTATION */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${singleStyle === 'split' ? 'landscape' : 'portrait'};
            margin: 5mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      ` }} />

      {questions.map((rawQuestion: any, idx: number) => {
        // Universal Normalization
        const question = normalizeQuestionData(rawQuestion);
        const qId = question.id || `single-q-${idx}`;
        const qNum = isBn ? toBengaliNumerals(idx + 1) : (idx + 1).toString();
        const questionMarks = question.customMarks !== undefined ? question.customMarks : question.marks;
        const marksStr = isBn ? toBengaliNumerals(questionMarks) : questionMarks.toString();
        
        const qTypeKey = (question.type || '').toUpperCase();
        const typeLabel = isBn 
          ? (QUESTION_TYPE_LABELS_BN[qTypeKey] || question.type || '')
          : (QUESTION_TYPE_LABELS_EN[qTypeKey] || question.type || '');

        const optionsList = (qTypeKey === 'AR' && (!question.options || question.options.length < 2))
          ? getArOptions(isBn)
          : question.options;

        const lineCount = calculateAdaptiveLineCount(question, singleStyle === 'split');
        const numExtraPages = extraPages[qId] || 0;

        return (
          <React.Fragment key={qId}>
            <div
              className={`w-full ${pageMinHeight} p-4 md:p-6 bg-white border border-gray-200 print:border-none print:p-2 mb-8 print:mb-0 relative flex flex-col justify-between overflow-hidden box-border`}
              style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
            >
              {/* WATERMARK OVERLAY */}
              {watermarkText && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.06] print:opacity-[0.08] select-none">
                  <span className="text-6xl md:text-8xl font-black uppercase tracking-widest text-black -rotate-45 text-center leading-tight">
                    {watermarkText}
                  </span>
                </div>
              )}

              {/* Top Sheet Header Banner */}
              <div className="relative z-10 shrink-0">
                <div className="border-b-2 border-black pb-2 mb-3 text-center">
                  {sheetInfo.schoolName && (
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-0.5">
                      {sheetInfo.schoolName}
                    </h1>
                  )}
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800 print:text-black mb-1">
                    {sheetInfo.title || (isBn ? "প্রশ্ন শীট" : "Question Sheet")} {showAnswers ? (isBn ? "(উত্তরপত্র ও সমাধান)" : "(Answer & Solution Key)") : ""}
                  </h2>

                  <div className="flex flex-wrap justify-between items-center text-xs md:text-sm font-medium text-gray-700 print:text-black px-2 mt-1">
                    <span>
                      <strong>{isBn ? "শ্রেণি: " : "Class: "}</strong>
                      {sheetInfo.class || "—"}
                    </span>
                    <span>
                      <strong>{isBn ? "বিষয়: " : "Subject: "}</strong>
                      {sheetInfo.subject || "—"}
                    </span>
                    <span>
                      <strong>{isBn ? "প্রশ্ন: " : "Question: "}</strong>
                      {qNum} / {isBn ? toBengaliNumerals(questions.length) : questions.length}
                    </span>
                    <span>
                      <strong>{isBn ? "পূর্ণমান: " : "Marks: "}</strong>
                      {marksStr}
                    </span>
                  </div>
                </div>

                {/* STUDENT EXAM HEADER BLOCK (If Enabled) */}
                {showStudentHeader && (
                  <div className="border border-black rounded-lg p-2 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-semibold print:text-black">
                    <div className="border-b border-dashed border-gray-400 pb-0.5">
                      <span className="text-gray-500 print:text-black">{isBn ? "পরীক্ষার্থীর নাম: " : "Name: "}</span>
                    </div>
                    <div className="border-b border-dashed border-gray-400 pb-0.5">
                      <span className="text-gray-500 print:text-black">{isBn ? "রোল / আইডি: " : "Roll / ID: "}</span>
                    </div>
                    <div className="border-b border-dashed border-gray-400 pb-0.5">
                      <span className="text-gray-500 print:text-black">{isBn ? "শাখা / সেকশন: " : "Section: "}</span>
                    </div>
                    <div className="border-b border-dashed border-gray-400 pb-0.5">
                      <span className="text-gray-500 print:text-black">{isBn ? "তারিখ: " : "Date: "}</span>
                      {sheetInfo.date || ""}
                    </div>
                  </div>
                )}

                {/* TEACHER CUSTOM NOTE PER QUESTION */}
                {question.customNote && (
                  <div className="mb-3 p-2 bg-amber-50 border-l-4 border-amber-500 rounded text-xs text-amber-900 print:bg-gray-100 print:border-black font-medium">
                    <strong>💡 {isBn ? "বিশেষ নির্দেশাবলি: " : "Note: "}</strong> {question.customNote}
                  </div>
                )}
              </div>

              {/* ------------------- MAIN LAYOUT RENDERER ------------------- */}
              <div className="relative z-10 flex-1 my-2 flex flex-col justify-between">
                {singleStyle === 'split' ? (
                  /* OPTION 2: SIDE-BY-SIDE SPLIT LANDSCAPE VIEW */
                  <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 items-stretch w-full flex-1" style={fontScaleStyle}>
                    
                    {/* LEFT COLUMN: Question & Stem (50% Width) */}
                    <div className="space-y-3 border-r-0 md:border-r print:border-r border-gray-300 md:pr-5 print:pr-5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <span className="font-bold text-base md:text-lg bg-black text-white px-2.5 py-0.5 rounded print:bg-black print:text-white">
                              {isBn ? `প্রশ্ন ${qNum}` : `Q${qNum}`}
                            </span>
                            {typeLabel && (
                              <span className="font-bold text-[11px] uppercase bg-gray-100 text-gray-900 border border-gray-400 px-2 py-0.5 rounded print:border-black print:bg-gray-100 print:text-black">
                                {typeLabel}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold border border-black px-2 py-0.5 rounded ml-auto shrink-0">
                            [{marksStr} {isBn ? "নম্বর" : "Marks"}]
                          </span>
                        </div>

                        {/* Question Text */}
                        <div className="font-medium text-base md:text-lg leading-relaxed pt-1 text-gray-900 print:text-black">
                          <MathText>{question.questionText}</MathText>
                        </div>

                        {/* Assertion & Reason (AR Type) */}
                        {qTypeKey === 'AR' && (question.assertion || question.reason) && (
                          <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs print:bg-transparent print:border-gray-400">
                            {question.assertion && (
                              <p className="font-medium">
                                <strong>{isBn ? "নিশ্চিতক্তি (Assertion): " : "Assertion: "}</strong>
                                <MathText>{question.assertion}</MathText>
                              </p>
                            )}
                            {question.reason && (
                              <p className="font-medium">
                                <strong>{isBn ? "কারণ (Reason): " : "Reason: "}</strong>
                                <MathText>{question.reason}</MathText>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Integer Answer Box (INT Type) */}
                        {qTypeKey === 'INT' && question.integerAnswer !== undefined && question.integerAnswer !== null && (
                          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 print:bg-gray-100 print:border-black">
                            <span>{isBn ? "সঠিক পূর্ণসংখ্যার উত্তর: " : "Integer Answer: "}</span>
                            <span className="font-mono text-sm bg-white border border-indigo-400 px-2 py-0.5 rounded ml-1 print:border-black">
                              {question.integerAnswer}
                            </span>
                          </div>
                        )}

                        {/* Options List (MCQ / MC / AR / SMCQ) */}
                        {optionsList.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {optionsList.map((opt: any, optIdx: number) => {
                              const optLabel = mcqLabels[optIdx] || `${optIdx + 1}`;
                              const isCorrect = opt.isCorrect || rawQuestion.correctOption === optIdx;

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs transition-colors ${
                                    showAnswers && isCorrect
                                      ? 'bg-green-50 border-green-500 font-semibold print:bg-gray-100 print:border-black'
                                      : 'border-gray-200 print:border-gray-300'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                                    showAnswers && isCorrect
                                      ? 'bg-green-600 text-white border-green-600 print:bg-black print:text-white'
                                      : 'bg-gray-100 text-gray-800 border-gray-300 print:bg-white print:text-black'
                                  }`}>
                                    {optLabel}
                                  </span>
                                  <span className="flex-1">
                                    <MathText>{typeof opt === 'string' ? opt : opt.text || ""}</MathText>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Sub Questions (CQ / Descriptive) */}
                        {question.subQuestions && question.subQuestions.length > 0 && (
                          <div className="space-y-2.5 mt-3">
                            {question.subQuestions.map((sub: any, subIdx: number) => {
                              const subLabel = subLabels[subIdx] || `${subIdx + 1}`;
                              const subMarks = sub.marks ? (isBn ? toBengaliNumerals(sub.marks) : sub.marks) : '';

                              return (
                                <div key={subIdx} className="p-2.5 border border-gray-200 rounded-lg bg-gray-50/50 print:bg-white print:border-gray-300 space-y-1.5 text-xs">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="font-semibold text-xs">
                                      <span className="inline-block font-bold mr-1.5 text-indigo-700 print:text-black">
                                        ({subLabel})
                                      </span>
                                      <MathText>{sub.question || sub.questionText || ""}</MathText>
                                    </div>
                                    {subMarks && (
                                      <span className="text-[10px] font-bold border px-1.5 py-0.5 rounded bg-white print:bg-transparent shrink-0">
                                        {subMarks} {isBn ? "মার্কস" : "marks"}
                                      </span>
                                    )}
                                  </div>

                                  {/* Graph / Chart */}
                                  {sub.chartConfig && (
                                    <div className="my-1.5 p-1.5 border rounded bg-white">
                                      <BeautifulChart
                                        type={sub.chartConfig.type || 'bar'}
                                        title={sub.chartConfig.xAxisLabel ? `${sub.chartConfig.xAxisLabel} vs ${sub.chartConfig.yAxisLabel || ''}` : 'Graph'}
                                        data={sub.chartConfig.data?.map((d: any) => ({
                                          label: typeof d === 'string' ? d : d.label || String(d.x || ''),
                                          value: typeof d === 'number' ? d : Number(d.value || d.y || 0)
                                        })) || []}
                                        isPrint={true}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Matching Columns (MTF Two Side Type) */}
                        {qTypeKey === 'MTF' && (question.leftColumn.length > 0 || question.rightColumn.length > 0) && (
                          <div className="grid grid-cols-2 gap-2 border p-3 rounded-lg my-2 text-xs">
                            <div>
                              <h4 className="font-bold border-b pb-1 mb-1">{isBn ? "কলাম A" : "Column A"}</h4>
                              {question.leftColumn.map((item: any, i: number) => (
                                <div key={i} className="py-0.5">
                                  <strong>({i + 1})</strong> <MathText>{typeof item === 'string' ? item : item.text || ""}</MathText>
                                </div>
                              ))}
                            </div>
                            <div>
                              <h4 className="font-bold border-b pb-1 mb-1">{isBn ? "কলাম B" : "Column B"}</h4>
                              {question.rightColumn.map((item: any, i: number) => (
                                <div key={i} className="py-0.5">
                                  <strong>({mcqLabels[i] || i + 1})</strong> <MathText>{typeof item === 'string' ? item : item.text || ""}</MathText>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Question Images */}
                        {question.images && question.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-center my-2">
                            {question.images.map((img: string, i: number) => (
                              <img key={i} src={img} alt="Diagram" className="max-h-40 object-contain rounded border border-gray-300" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Clean Ruled Notebook Workspace OR Solution Key */}
                    <div className="flex flex-col justify-between h-full space-y-3">
                      {showAnswers ? (
                        /* TEACHER SOLUTION & ANSWER KEY VIEW (100% Height Box) */
                        <div className="w-full border-2 border-emerald-600 rounded-xl bg-emerald-50/40 p-4 shadow-sm h-full flex flex-col justify-between overflow-y-auto print:bg-white print:border-black">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-emerald-200 print:border-black pb-2 mb-2">
                              <span className="text-xs font-bold text-emerald-900 print:text-black flex items-center gap-1.5">
                                💡 {isBn ? `প্রশ্ন ${qNum} এর উত্তর ও বিস্তারিত সমাধান` : `Q${qNum} Model Answer & Solution`}
                              </span>
                              <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded print:bg-black">
                                {isBn ? "উত্তরপত্র" : "Answer Key"}
                              </span>
                            </div>

                            {/* Sub-Questions Answers Breakdown (CQ / Descriptive) */}
                            {question.subQuestions && question.subQuestions.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-[11px] font-bold text-emerald-900 print:text-black uppercase">
                                  {isBn ? "উপ-প্রশ্নের উত্তরসমূহ:" : "Sub-Question Answers:"}
                                </h4>
                                {question.subQuestions.map((sub: any, subIdx: number) => {
                                  const subLabel = subLabels[subIdx] || `${subIdx + 1}`;
                                  return (
                                    <div key={subIdx} className="p-2.5 border border-emerald-200 rounded-lg bg-white print:border-gray-400 space-y-1 text-xs">
                                      <div className="font-bold text-xs text-indigo-900 print:text-black flex items-start gap-1">
                                        <span>({subLabel})</span>
                                        <MathText>{sub.questionText || ""}</MathText>
                                      </div>
                                      <div className="text-gray-900 print:text-black pl-3 border-l-2 border-emerald-500">
                                        <strong className="text-[10px] uppercase font-bold text-emerald-800 print:text-black mr-1">
                                          {isBn ? "উত্তর:" : "Answer:"}
                                        </strong>
                                        <MathText>{sub.modelAnswer || (isBn ? "সঠিক সমাধান যুক্ত করা আছে।" : "Solution provided.")}</MathText>
                                      </div>
                                      {sub.explanation && (
                                        <div className="text-gray-800 print:text-black pl-3 border-l-2 border-blue-400 pt-0.5 text-[11px]">
                                          <strong className="text-[10px] uppercase font-bold text-blue-800 print:text-black mr-1">
                                            {isBn ? "ব্যাখ্যা:" : "Explanation:"}
                                          </strong>
                                          <MathText>{sub.explanation}</MathText>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Main Model Answer Block */}
                            {question.modelAnswer && (!question.subQuestions || question.subQuestions.length === 0) && (
                              <div className="p-3 border border-emerald-300 rounded-lg bg-white print:border-black text-xs space-y-1">
                                <strong className="block text-[10px] uppercase font-bold text-emerald-800 print:text-black">
                                  {isBn ? "সঠিক মডেল উত্তর:" : "Model Answer:"}
                                </strong>
                                <MathText>{question.modelAnswer}</MathText>
                              </div>
                            )}

                            {/* Detailed Explanation Block */}
                            {question.explanation && (!question.subQuestions || question.subQuestions.length === 0) && (
                              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/50 print:bg-white print:border-black text-xs space-y-1">
                                <strong className="block text-[10px] uppercase font-bold text-blue-800 print:text-black">
                                  {isBn ? "বিস্তারিত ব্যাখ্যা:" : "Detailed Explanation:"}
                                </strong>
                                <MathText>{question.explanation}</MathText>
                              </div>
                            )}
                          </div>

                          <div className="text-[10px] text-gray-500 print:text-black border-t border-emerald-200 print:border-black pt-1 mt-2 text-right">
                            {isBn ? "রোফাজ একাডেমি (Rofaz Academy) অফিসিয়াল সলিউশন কি" : "Official Solution Key"}
                          </div>
                        </div>
                      ) : (
                        /* STUDENT RULED WORKSPACE VIEW */
                        <div className="flex-1 flex flex-col justify-between h-full space-y-3">
                          <RuledNotebookWorkspace 
                            isBn={isBn} 
                            lineCount={lineCount} 
                            marksStr={marksStr} 
                            title={isBn ? `প্রশ্ন ${qNum} এর উত্তর ও সমাধান স্থান` : `Workspace Q${qNum}`}
                            fullHeight={true}
                          />

                          {/* Controls to Add Extra Working Page */}
                          <div className="flex items-center justify-between text-xs pt-1 print:hidden select-none shrink-0">
                            <span className="text-gray-500 font-medium">
                              {numExtraPages > 0 && (
                                <span className="text-indigo-600 font-bold mr-2">
                                  ✓ {isBn ? `অতিরিক্ত পৃষ্ঠা যুক্ত আছে: ${numExtraPages}টি` : `Extra pages added: ${numExtraPages}`}
                                </span>
                              )}
                            </span>
                            <div className="flex gap-2">
                              {numExtraPages > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleRemoveExtraPage(qId)}
                                  className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition-colors"
                                >
                                  ➖ {isBn ? "পৃষ্ঠা সরান" : "Remove Page"}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleAddExtraPage(qId)}
                                className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold transition-colors flex items-center gap-1"
                              >
                                ➕ {isBn ? "অতিরিক্ত উত্তর পৃষ্ঠা যুক্ত করুন" : "Add Extra Working Page"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* OPTION 1: VERTICAL LAYOUT */
                  <div className="space-y-5 flex-1 flex flex-col justify-between" style={fontScaleStyle}>
                    <div className="space-y-4">
                      {/* Question Header & Main Text */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                          <span className="font-bold text-lg md:text-xl bg-black text-white px-3 py-1 rounded-md print:bg-black print:text-white">
                            {isBn ? `প্রশ্ন ${qNum}` : `Q${qNum}`}
                          </span>
                          {typeLabel && (
                            <span className="font-bold text-xs uppercase bg-gray-100 text-gray-900 border border-gray-400 px-2.5 py-1 rounded print:border-black print:bg-gray-100 print:text-black">
                              {typeLabel}
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-base md:text-lg flex-1 leading-relaxed pt-0.5">
                          <MathText>{question.questionText}</MathText>
                        </div>
                        <span className="text-sm font-semibold border border-black px-2.5 py-1 rounded shrink-0">
                          [{marksStr} {isBn ? "নম্বর" : "Marks"}]
                        </span>
                      </div>

                      {/* Assertion & Reason (AR Type) */}
                      {qTypeKey === 'AR' && (question.assertion || question.reason) && (
                        <div className="ml-6 space-y-2 p-4 bg-gray-50 border border-gray-200 rounded-lg print:bg-transparent print:border-gray-400">
                          {question.assertion && (
                            <p className="font-medium">
                              <strong>{isBn ? "নিশ্চিতক্তি (Assertion): " : "Assertion: "}</strong>
                              <MathText>{question.assertion}</MathText>
                            </p>
                          )}
                          {question.reason && (
                            <p className="font-medium">
                              <strong>{isBn ? "কারণ (Reason): " : "Reason: "}</strong>
                              <MathText>{question.reason}</MathText>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Integer Answer Box (INT Type) */}
                      {qTypeKey === 'INT' && question.integerAnswer !== undefined && question.integerAnswer !== null && (
                        <div className="ml-6 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 print:bg-gray-100 print:border-black">
                          <span>{isBn ? "সঠিক পূর্ণসংখ্যার উত্তর: " : "Integer Answer: "}</span>
                          <span className="font-mono text-sm bg-white border border-indigo-400 px-2 py-0.5 rounded ml-1 print:border-black">
                            {question.integerAnswer}
                          </span>
                        </div>
                      )}

                      {/* Options List */}
                      {optionsList.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 mt-3">
                          {optionsList.map((opt: any, optIdx: number) => {
                            const optLabel = mcqLabels[optIdx] || `${optIdx + 1}`;
                            const isCorrect = opt.isCorrect || rawQuestion.correctOption === optIdx;

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                                  showAnswers && isCorrect
                                    ? 'bg-green-50 border-green-500 font-semibold print:bg-gray-100 print:border-black'
                                    : 'border-gray-200 print:border-gray-300'
                                }`}
                              >
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${
                                  showAnswers && isCorrect
                                    ? 'bg-green-600 text-white border-green-600 print:bg-black print:text-white'
                                    : 'bg-gray-100 text-gray-800 border-gray-300 print:bg-white print:text-black'
                                }`}>
                                  {optLabel}
                                </span>
                                <span className="flex-1 text-sm md:text-base">
                                  <MathText>{typeof opt === 'string' ? opt : opt.text || ""}</MathText>
                                </span>
                                {showAnswers && isCorrect && (
                                  <span className="text-xs font-bold text-green-700 print:text-black uppercase shrink-0">
                                    ✓ {isBn ? "সঠিক উত্তর" : "Correct"}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Sub Questions (CQ / Descriptive) */}
                      {question.subQuestions && question.subQuestions.length > 0 && (
                        <div className="space-y-3 pl-4 mt-4">
                          {question.subQuestions.map((sub: any, subIdx: number) => {
                            const subLabel = subLabels[subIdx] || `${subIdx + 1}`;
                            const subMarks = sub.marks ? (isBn ? toBengaliNumerals(sub.marks) : sub.marks) : '';

                            return (
                              <div key={subIdx} className="p-3.5 border border-gray-200 rounded-lg bg-gray-50/50 print:bg-white print:border-gray-300 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="font-semibold text-base">
                                    <span className="inline-block font-bold mr-2 text-indigo-700 print:text-black">
                                      ({subLabel})
                                    </span>
                                    <MathText>{sub.question || sub.questionText || ""}</MathText>
                                  </div>
                                  {subMarks && (
                                    <span className="text-xs font-bold border px-2 py-0.5 rounded bg-white print:bg-transparent shrink-0">
                                      {subMarks} {isBn ? "মার্কস" : "marks"}
                                    </span>
                                  )}
                                </div>

                                {/* Sub Question Model Answer when showAnswers is true */}
                                {showAnswers && (sub.modelAnswer || sub.explanation) && (
                                  <div className="p-2.5 border-l-4 border-emerald-600 bg-emerald-50/60 print:bg-white print:border-black text-xs space-y-1">
                                    {sub.modelAnswer && (
                                      <div>
                                        <strong className="text-emerald-800 print:text-black font-bold uppercase text-[10px] mr-1">{isBn ? "উত্তর:" : "Answer:"}</strong>
                                        <MathText>{sub.modelAnswer}</MathText>
                                      </div>
                                    )}
                                    {sub.explanation && (
                                      <div className="pt-0.5 text-blue-900 print:text-black">
                                        <strong className="text-blue-800 print:text-black font-bold uppercase text-[10px] mr-1">{isBn ? "ব্যাখ্যা:" : "Explanation:"}</strong>
                                        <MathText>{sub.explanation}</MathText>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Chart */}
                                {sub.chartConfig && (
                                  <div className="my-2 p-2 border rounded bg-white">
                                    <BeautifulChart
                                      type={sub.chartConfig.type || 'bar'}
                                      title={sub.chartConfig.xAxisLabel ? `${sub.chartConfig.xAxisLabel} vs ${sub.chartConfig.yAxisLabel || ''}` : 'Graph'}
                                      data={sub.chartConfig.data?.map((d: any) => ({
                                        label: typeof d === 'string' ? d : d.label || String(d.x || ''),
                                        value: typeof d === 'number' ? d : Number(d.value || d.y || 0)
                                      })) || []}
                                      isPrint={true}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Matching Columns (MTF Two Side Type) */}
                      {qTypeKey === 'MTF' && (question.leftColumn.length > 0 || question.rightColumn.length > 0) && (
                        <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg my-3">
                          <div>
                            <h4 className="font-bold text-sm border-b pb-1 mb-2">{isBn ? "কলাম A" : "Column A"}</h4>
                            {question.leftColumn.map((item: any, i: number) => (
                              <div key={i} className="text-sm py-1">
                                <strong>({i + 1})</strong> <MathText>{typeof item === 'string' ? item : item.text || ""}</MathText>
                              </div>
                            ))}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm border-b pb-1 mb-2">{isBn ? "কলাম B" : "Column B"}</h4>
                            {question.rightColumn.map((item: any, i: number) => (
                              <div key={i} className="text-sm py-1">
                                <strong>({mcqLabels[i] || i + 1})</strong> <MathText>{typeof item === 'string' ? item : item.text || ""}</MathText>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Question Images */}
                      {question.images && question.images.length > 0 && (
                        <div className="flex flex-wrap gap-4 justify-center my-3">
                          {question.images.map((img: string, i: number) => (
                            <img key={i} src={img} alt="Diagram" className="max-h-56 object-contain rounded border border-gray-300" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* BOTTOM WORKSPACE */}
                    <div className="mt-4 space-y-3 flex-1 flex flex-col justify-between">
                      {showAnswers ? (
                        <div className="p-5 border-2 border-green-600 rounded-xl bg-green-50/50 print:bg-white print:border-black space-y-2">
                          <div className="flex items-center gap-2 font-bold text-base md:text-lg text-green-900 print:text-black border-b border-green-200 print:border-black pb-1.5">
                            <span>💡</span>
                            <span>{isBn ? "মডেল উত্তর ও ব্যাখ্যা (Model Answer & Solution):" : "Model Answer & Detailed Solution:"}</span>
                          </div>
                          {question.modelAnswer && (
                            <div className="text-gray-900 print:text-black text-sm md:text-base leading-relaxed">
                              <strong className="block text-xs uppercase font-bold text-green-700 print:text-black mb-1">
                                {isBn ? "উত্তর:" : "Answer:"}
                              </strong>
                              <MathText>{question.modelAnswer}</MathText>
                            </div>
                          )}
                          {question.explanation && (
                            <div className="text-gray-900 print:text-black text-sm md:text-base leading-relaxed pt-1.5 border-t border-green-200 print:border-gray-300">
                              <strong className="block text-xs uppercase font-bold text-green-700 print:text-black mb-1">
                                {isBn ? "বিস্তারিত ব্যাখ্যা:" : "Detailed Explanation:"}
                              </strong>
                              <MathText>{question.explanation}</MathText>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 flex-1 flex flex-col justify-between">
                          <RuledNotebookWorkspace 
                            isBn={isBn} 
                            lineCount={lineCount} 
                            marksStr={marksStr} 
                            title={isBn ? `প্রশ্ন ${qNum} এর উত্তর ও সমাধান স্থান` : `Workspace Q${qNum}`} 
                            fullHeight={true}
                          />
                          
                          {/* Controls to Add Extra Working Page */}
                          <div className="flex items-center justify-between text-xs pt-1 print:hidden select-none shrink-0">
                            <span className="text-gray-500 font-medium">
                              {numExtraPages > 0 && (
                                <span className="text-indigo-600 font-bold mr-2">
                                  ✓ {isBn ? `অতিরিক্ত পৃষ্ঠা যুক্ত আছে: ${numExtraPages}টি` : `Extra pages added: ${numExtraPages}`}
                                </span>
                              )}
                            </span>
                            <div className="flex gap-2">
                              {numExtraPages > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleRemoveExtraPage(qId)}
                                  className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition-colors"
                                >
                                  ➖ {isBn ? "পৃষ্ঠা সরান" : "Remove Page"}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleAddExtraPage(qId)}
                                className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold transition-colors flex items-center gap-1"
                              >
                                ➕ {isBn ? "অতিরিক্ত উত্তর পৃষ্ঠা যুক্ত করুন" : "Add Extra Working Page"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Page Footer */}
              <div className="relative z-10 border-t border-gray-300 pt-2.5 text-xs text-gray-500 print:text-gray-700 flex justify-between items-center mt-3 shrink-0">
                <span>{sheetInfo.title}</span>
                <span>{isBn ? "পৃষ্ঠা " : "Page "}{qNum} / {isBn ? toBengaliNumerals(questions.length) : questions.length}</span>
                <span>{isBn ? "রোফাজ একাডেমি (Rofaz Academy) ওয়ার্ল্ড ক্লাস শীট মেকার" : "Rofaz Academy Sheet Maker"}</span>
              </div>
            </div>

            {/* ------------------- EXTENDED MULTI-PAGE WORKSPACE ENGINE ------------------- */}
            {Array.from({ length: numExtraPages }).map((_, extraIdx) => (
              <div
                key={`${qId}-extra-${extraIdx}`}
                className={`w-full ${pageMinHeight} p-4 md:p-6 bg-white border border-gray-200 print:border-none print:p-2 mb-8 print:mb-0 relative flex flex-col justify-between overflow-hidden box-border`}
                style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
              >
                {/* Header for Extra Page */}
                <div className="border-b-2 border-black pb-2 mb-3 flex justify-between items-center text-xs md:text-sm font-bold text-gray-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-black text-white px-2.5 py-0.5 rounded text-xs">
                      {isBn ? `প্রশ্ন ${qNum}` : `Q${qNum}`}
                    </span>
                    <span>{isBn ? `অতিরিক্ত উত্তর পৃষ্ঠা (${extraIdx + 1})` : `Extended Working Page (${extraIdx + 1})`}</span>
                  </div>
                  <span>{sheetInfo.title}</span>
                </div>

                {/* Extra Full Page Ruled Notebook Workspace */}
                <div className="flex-1 space-y-2 my-2 flex flex-col justify-between">
                  <RuledNotebookWorkspace 
                    isBn={isBn} 
                    lineCount={20} 
                    marksStr={marksStr} 
                    title={isBn ? `প্রশ্ন ${qNum} - অতিরিক্ত উত্তর পৃষ্ঠা (${extraIdx + 1})` : `Q${qNum} - Extended Answer Page ${extraIdx + 1}`} 
                    fullHeight={true}
                  />
                </div>

                {/* Extra Page Footer */}
                <div className="border-t border-gray-300 pt-2.5 text-xs text-gray-500 flex justify-between items-center mt-3 shrink-0">
                  <span>{isBn ? "অতিরিক্ত উত্তর খাতা" : "Extended Answer Sheet"}</span>
                  <span>{isBn ? `প্রশ্ন ${qNum} (পৃষ্ঠা ${extraIdx + 2})` : `Q${qNum} (Page ${extraIdx + 2})`}</span>
                  <span>{isBn ? "রোফাজ একাডেমি (Rofaz Academy)" : "Rofaz Academy"}</span>
                </div>
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
