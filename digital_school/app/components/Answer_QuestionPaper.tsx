import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJaxContext } from 'better-react-mathjax';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath, renderDynamicExplanation } from '@/lib/utils';
import { toBengaliNumerals, formatBengaliDuration } from '@/utils/numeralConverter';

// --- TYPES ---
interface MCQ {
  q: string;
  options: { text: string }[];
  marks?: number;
  correctAnswer?: string; // The correct option (A, B, C, D or ক, খ, গ, ঘ)
  explanation?: string;
  questionText?: string;
  type?: string;
}
interface MC {
  q: string;
  options: { text: string; isCorrect?: boolean }[];
  marks?: number;
  explanation?: string;
  questionText?: string;
  type?: string;
}
interface INT {
  q: string;
  marks?: number;
  modelAnswer?: string;
  explanation?: string;
  type?: string;
}
interface AR {
  assertion: string;
  reason: string;
  correctOption: number;
  marks?: number;
  explanation?: string;
  questionText?: string;
  type?: string;
}
interface CQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
  subQuestions?: any[];
  subAnswers?: string[]; // Array of answers for sub-questions
  type?: string;
}
interface SQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
  type?: string;
}
interface MTF {
  leftColumn: { id: string; text: string }[];
  rightColumn: { id: string; text: string }[];
  matches: Record<string, string>;
  marks?: number;
  explanation?: string;
  type?: string;
}
interface DESCRIPTIVE {
  id: string;
  type: string;
  marks: number;
  subQuestions: any[];
}
interface AnswerQuestionPaperProps {
  examInfo: {
    schoolName: string;
    schoolAddress: string;
    title: string;
    subject: string;
    class: string;
    date: string;
    set?: string;
    duration?: string;
    schoolLogo?: string;
    objectiveTime?: number;
    cqSqTime?: number;
    totalMarks?: string;
    mcqNegativeMarking?: number;
    cqRequiredQuestions?: number;
    sqRequiredQuestions?: number;
    cqSubsections?: any[];
    id?: string;
  };
  questions: {
    mcq: MCQ[];
    mc: MC[];
    int: INT[];
    ar: AR[];
    mtf: MTF[];
    cq: CQ[];
    sq: SQ[];
    descriptive: DESCRIPTIVE[];
  };
  qrData: any;
  fontSize?: number;
  cqSqFontSize?: number;
  forcePageBreak?: boolean;
  language?: 'bn' | 'en';
  hideOMR?: boolean;
  showDate?: boolean;
}

const MCQ_LABELS_BN = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const MCQ_LABELS_EN = ['A', 'B', 'C', 'D', 'E', 'F'];
const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ'];
const ENGLISH_SUB_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

// 100+ beautiful Bangla words for set label decoration
const BANGLA_BEAUTIFUL_WORDS = [
  'আনন্দ', 'প্রভাত', 'নির্ঝর', 'তারা', 'জ্যোৎস্না', 'ফুলদল', 'শান্তি', 'বুলবুল', 'কোকিল', 'হৃদয়',
  'সুপ্রভাত', 'আজাদ', 'দোয়েল', 'শিশির', 'তুষার', 'ময়ূর', 'দর্পণ', 'স্বপ্ন', 'আশা', 'করুণা',
  'প্রীতি', 'সাহস', 'মাধুর্য', 'বিজয়', 'শক্তি', 'জ্ঞান', 'বিদ্যা', 'মেধা', 'সৌন্দর্য', 'অরুণ',
  'আলো', 'কিরণ', 'সফল', 'দিগন্ত', 'আকাশ', 'নদী', 'সাগর', 'বনানি', 'শরৎ', 'বসন্ত',
  'বর্ষা', 'শীত', 'হেমন্ত', 'গ্রীষ্ম', 'মেঘ', 'বায়ু', 'বাদল', 'দিরাজ', 'উষা', 'ধ্রুবতারা',
  'মাতৃভূমি', 'দেশপ্রেম', 'ধরণী', 'লালন', 'জারিণী', 'সুয়োনা', 'সোনালী', 'রাঙা', 'দামিনী',
  'বিদ্যুৎ', 'তরঙ্গ', 'সহস্রদল', 'পদ্ম', 'ভোর', 'শ্যামল', 'সবুজ', 'রহস্য', 'স্মৃতি',
  'প্রকৃতি', 'বিশ্ব', 'মানবতা', 'সভ্যতা', 'সৃষ্টি', 'অবাক', 'বিস্ময়', 'বর্ণমালা', 'বাঁশি',
  'আরণ্য', 'সুবর্ণ', 'হীরা', 'রত্ন', 'মাণিক', 'প্রবাল', 'স্ফটিক', 'মরকত', 'নীলমণি', 'চন্দ্র',
  'সূর্য', 'সমুদ্র', 'পাহাড়', 'নীলাভ', 'অপার', 'অজস্র', 'বিশাল', 'শুভ্র', 'ধবল', 'চাঁদ',
  'চাঁদনী', 'জোছনা', 'জলধারা', 'ঝরনা', 'ফোঁটা', 'শিশিরবিন্দু', 'শিপ্রা', 'রোশনারা', 'সাততারা',
  'মল্লিকা', 'জুই', 'টগর', 'বাঁধবী', 'ধুতুরা', 'শাপলা', 'নিশিঠা', 'বেলি', 'সিক্ত', 'অঞ্জন',
  'নার্গিস', 'প্রাণ', 'জনম', 'ক্ষণ', 'মুহূর্ত', 'আবেশ', 'উদ্দীপনা', 'বিভোর',
  'নিরন্তর', 'অনন্ত', 'মহাকাশ', 'গগন', 'অম্বর', 'মুক্ত', 'স্বাধীন', 'অবারিত', 'নিষ্পাপ', 'নির্মল'
];

// 100+ beautiful English words for set label decoration
const ENGLISH_BEAUTIFUL_WORDS = [
  'Aurora', 'Serenity', 'Harmony', 'Luminous', 'Celestial', 'Radiance', 'Infinity', 'Cascade', 'Zenith', 'Solace',
  'Elysian', 'Verdant', 'Tranquil', 'Ethereal', 'Solstice', 'Equinox', 'Opaline', 'Iridescent', 'Blossom', 'Zephyr',
  'Horizon', 'Meridian', 'Labyrinth', 'Odyssey', 'Epoch', 'Genesis', 'Phoenix', 'Vortex', 'Solaris', 'Nebula',
  'Vivid', 'Serene', 'Pristine', 'Sublime', 'Vibrant', 'Majestic', 'Eloquent', 'Graceful', 'Opulent', 'Regal',
  'Sapphire', 'Amber', 'Crimson', 'Velvet', 'Ivory', 'Cobalt', 'Scarlet', 'Indigo', 'Topaz', 'Emerald',
  'Willow', 'Meadow', 'Breeze', 'Twilight', 'Ember', 'Thunder', 'Crystal', 'Glacier', 'Torrent', 'Mirage',
  'Victory', 'Triumph', 'Clarity', 'Wisdom', 'Virtue', 'Courage', 'Justice', 'Liberty', 'Legacy', 'Vision',
  'Anthem', 'Symphony', 'Sonnet', 'Lyric', 'Rhapsody', 'Ballad', 'Melody', 'Cadence', 'Rhythm', 'Harmony',
  'Aura', 'Glimmer', 'Echo', 'Haven', 'Quest', 'Spirit', 'Spark', 'Pulse', 'Haven', 'Origin'
];

// Picks a deterministic word from seed string + offset (different per page type)
function pickBanglaWord(seed: string, offset: number = 0, lang: 'bn' | 'en' = 'bn'): string {
  const wordList = lang === 'en' ? ENGLISH_BEAUTIFUL_WORDS : BANGLA_BEAUTIFUL_WORDS;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const idx = (hash + offset * 37) % wordList.length;
  return wordList[idx];
}

const normalizeAnswer = (ans: string | undefined | number) => {
  if (ans === undefined || ans === null) return 'ক';
  const s = String(ans).trim();
  const map: Record<string, string> = {
    'A': 'ক', 'B': 'খ', 'C': 'গ', 'D': 'ঘ', 'E': 'ঙ', 'F': 'চ',
    'a': 'ক', 'b': 'খ', 'c': 'গ', 'd': 'ঘ', 'e': 'ঙ', 'f': 'চ',
    '1': 'ক', '2': 'খ', '3': 'গ', '4': 'ঘ', '5': 'ঙ', '6': 'চ',
    '0': 'ক' // In case of 0-based index
  };
  return map[s] || s;
};

// Helper to render text with MathJax
const Text = ({ children }: { children: string }) => (
  <UniversalMathJax dynamic inline>{cleanupMath(children)}</UniversalMathJax>
);

const Header = ({ examInfo, type, qrData, marks, time, banglaWord, showDate, lang = 'bn' }: {
  examInfo: any,
  type: 'objective' | 'cqsq',
  qrData: any,
  marks: string | number,
  time: number | string,
  banglaWord?: string,
  showDate?: boolean,
  lang?: 'bn' | 'en'
}) => {
  const isHEn = lang === 'en';
  return (
    <header className="mb-6 relative border-b-[3px] border-black pb-4 text-black">
      <div className="flex items-center justify-between gap-4">
        {/* Logo Spacer to balance QR */}
        <div className="w-20" />

        {/* Middle Section: School Info */}
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-black tracking-tight mb-0.5">
            {examInfo.schoolName || (isHEn ? 'School Name' : 'শিক্ষা প্রতিষ্ঠানের নাম')}
          </h1>
          <p className="text-sm font-semibold text-gray-800 uppercase tracking-widest">
            {examInfo.schoolAddress || (isHEn ? 'School Address' : 'প্রতিষ্ঠানের ঠিকানা')}
          </p>
        </div>

        {/* QR Code Section */}
        <div className="w-20 h-20 flex items-center justify-end">
          <div className="p-1 border border-black bg-white shadow-sm">
            <QRCode value={JSON.stringify(qrData)} size={64} />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="inline-block border-y-2 border-black py-1.5 px-10 my-3 bg-gray-50/50">
          <h2 className="text-2xl font-black uppercase tracking-tight">{examInfo.title}</h2>
        </div>
      </div>

      <div className="text-base flex flex-row justify-center gap-x-6 flex-wrap mt-2 font-medium">
        <span><strong>{isHEn ? 'Class' : 'শ্রেণি'}:</strong> {isHEn ? examInfo.class : toBengaliNumerals(examInfo.class)}</span>
        {showDate !== false && (
          <span><strong>{isHEn ? 'Date' : 'তারিখ'}:</strong> {isHEn ? examInfo.date : toBengaliNumerals(examInfo.date)}</span>
        )}
        {examInfo.set && (
          <span>
            <strong>{isHEn ? 'Set' : 'সেট'}:</strong> {examInfo.set}
            {banglaWord && <span className="ml-1 text-gray-700 italic">({banglaWord})</span>}
          </span>
        )}
        <span><strong>{isHEn ? 'Time' : 'সময়'}:</strong> {typeof time === 'number' ? formatBengaliDuration(time) : (isHEn ? time : toBengaliNumerals(String(time)))}</span>
        <span><strong>{isHEn ? 'Full Marks' : 'পূর্ণমান'}:</strong> {isHEn ? marks : toBengaliNumerals(marks)}</span>
      </div>

      <div className="mt-4 text-center">
        <div className="inline-block text-xl font-bold text-red-600 border-2 border-red-600 px-4 py-1 rounded shadow-sm">
          {type === 'objective' ? (isHEn ? 'Objective Answers' : 'বহুনির্বাচনি উত্তরপত্র (Objective Answers)') : (isHEn ? 'CQ/SQ Answers' : 'সৃজনশীল উত্তরপত্র (CQ/SQ Answers)')}
        </div>
      </div>
    </header>
  );
};

// Main AnswerQuestionPaper component (forwardRef for printing)
const AnswerQuestionPaper = forwardRef<HTMLDivElement, AnswerQuestionPaperProps>(
  ({ examInfo, questions, qrData, fontSize, cqSqFontSize, forcePageBreak, language, hideOMR, showDate }, ref) => {
    const lang = language || 'bn';
    const isEn = lang === 'en';
    const mcqs = questions.mcq || [];
    const mcs = questions.mc || [];
    const ints = questions.int || [];
    const ars = questions.ar || [];
    const cqs = questions.cq || [];
    const sqs = questions.sq || [];
    const descriptives = questions.descriptive || [];
    const mtfs = questions.mtf || [];

    const allObjective = [
      ...(mcqs.map(q => ({ ...q, type: (q.type || 'MCQ').toUpperCase() }))),
      ...(mcs.map(q => ({ ...q, type: (q.type || 'MC').toUpperCase() }))),
      ...(ints.map(q => ({ ...q, type: (q.type || 'INT').toUpperCase() }))),
      ...(ars.map(q => ({ ...q, type: (q.type || 'AR').toUpperCase() }))),
      ...(mtfs.map(q => ({ ...q, type: (q.type || 'MTF').toUpperCase() })))
    ];

    const mcqTotal = mcqs.reduce((sum, q) => sum + (q.marks || 1), 0);
    const mcTotal = mcs.reduce((sum, q) => sum + (q.marks || 1), 0);
    const intTotal = ints.reduce((sum, q) => sum + (q.marks || 1), 0);
    const arTotal = ars.reduce((sum, q) => sum + (q.marks || 1), 0);
    const mtfTotal = mtfs.reduce((sum, q) => sum + (q.marks || 1), 0);

    const objectiveTotal = mcqTotal + mcTotal + intTotal + arTotal + mtfTotal;

    // Calculate highest possible marks for required questions
    const cqRequired = examInfo.cqRequiredQuestions || 0;
    const sqRequired = examInfo.sqRequiredQuestions || 0;

    // Sort questions by marks (highest first) and calculate required marks
    const cqSorted = [...cqs].sort((a, b) => (b.marks || 0) - (a.marks || 0));
    const sqSorted = [...sqs].sort((a, b) => (b.marks || 0) - (a.marks || 0));

    const cqRequiredMarks = cqSorted.slice(0, cqRequired).reduce((sum, q) => sum + (q.marks || 0), 0);
    const sqRequiredMarks = sqSorted.slice(0, sqRequired).reduce((sum, q) => sum + (q.marks || 0), 0);

    const totalTimeMinutes = (examInfo.objectiveTime || 0) + (examInfo.cqSqTime || 0);
    const cqRequiredMarksNum = Number(cqRequiredMarks) || 0;
    const sqRequiredMarksNum = Number(sqRequiredMarks) || 0;
    const descMarks = descriptives.reduce((sum, q) => sum + (q.marks || 0), 0);
    const cqSqTotalMarks = cqRequiredMarksNum + sqRequiredMarksNum + descMarks;

    return (
      <div
        ref={ref}
        className="answer-paper-container bg-white relative overflow-hidden"
        style={{
          fontFamily: isEn ? "'Bookman Old Style', 'Georgia', serif" : "'SolaimanLipi', 'Times New Roman', serif",
          fontSize: fontSize ? `${fontSize}%` : '100%'
        }}
      >
        <div className="watermark print-only">{examInfo.schoolName}</div>

        <div style={{ fontSize: fontSize ? `${fontSize}%` : '100%' }}>
          <Header
            examInfo={examInfo}
            type="objective"
            qrData={qrData}
            marks={objectiveTotal}
            time={examInfo.objectiveTime || 0}
            banglaWord={examInfo.set ? pickBanglaWord((examInfo.id || '') + examInfo.set, 0, lang) : undefined}
            showDate={showDate}
            lang={lang}
          />
        </div>

        {/* Main Content */}
        <main>
          {/* MCQ Section */}
          {allObjective.length > 0 && (
            <div style={{ fontSize: fontSize ? `${fontSize}%` : '100%' }}>
              {/* MCQ Header - only once */}
              <div className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 break-inside-avoid mcq-header">
                <h3>{isEn ? 'Objective Answers' : 'বহুনির্বাচনি প্রশ্নের উত্তর (Objective Answers)'}</h3>
                <div className="text-right">
                  <div>{isEn ? 'Total Marks' : 'মোট নম্বর'}: {isEn ? objectiveTotal : toBengaliNumerals(objectiveTotal)}</div>
                  {examInfo.mcqNegativeMarking && Number(examInfo.mcqNegativeMarking) > 0 ? (
                    <div className="text-red-600">({isEn ? `Negative Marking: ${examInfo.mcqNegativeMarking}%` : `ভুল উত্তরের জন্য ${toBengaliNumerals(examInfo.mcqNegativeMarking)}% নম্বর কর্তন করা হবে`})</div>
                  ) : null}
                </div>
              </div>

              <div className="mcq-container">
                {allObjective.map((q: any, idx) => {
                  const qNum = isEn ? (idx + 1) : toBengaliNumerals(idx + 1);

                  if (q.type === 'MCQ' || q.type === 'MC') {
                    const totalOptionsLength = (q.options || []).reduce((acc: number, opt: any) => acc + (opt.text || '').length, 0);
                    let gridClass = "options-grid-4";
                    if (totalOptionsLength > 60) gridClass = "options-grid-1";
                    else if (totalOptionsLength > 30) gridClass = "options-grid-2";

                    return (
                      <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                        <div className="flex items-start">
                          <span className="font-bold mr-2">
                            {qNum}.{q.type === 'MC' ? '*' : ''}
                          </span>
                          <div className="flex-1">
                            <div className="mb-1 text-black">
                              <span className="font-bold text-gray-800">প্রশ্ন: </span>
                              <Text>{q.q || q.questionText || ''}</Text>
                            </div>
                            <div className={`mb-2 ${gridClass} gap-y-1`}>
                              {(q.options || []).map((opt: any, oidx: number) => (
                                <div key={oidx} className={`option-item flex items-start gap-1 ${q.type === 'MC' && opt.isCorrect ? 'bg-green-100 border-2 border-green-500 font-bold text-green-800' : ''}`}>
                                  {q.type === 'MC' && <span>{opt.isCorrect ? '☑' : '☐'}</span>}
                                  <Text>{`${isEn ? MCQ_LABELS_EN[oidx] : MCQ_LABELS_BN[oidx]} ${opt.text}`}</Text>
                                </div>
                              ))}
                            </div>
                            <div className="mb-1">
                              <span className="text-gray-600 font-medium">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)} {isEn ? 'Marks' : 'নম্বর'}]</span>
                            </div>
                            <div className="bg-red-50 p-1 border-l-4 border-red-600 inline-block mb-1">
                              <span className="text-red-700 font-bold">
                                উত্তর: {isEn ? (q.type === 'MCQ' ? (MCQ_LABELS_EN[MCQ_LABELS_BN.indexOf(normalizeAnswer(q.correctAnswer))] || normalizeAnswer(q.correctAnswer)) : (q.options || []).filter((o: any) => o.isCorrect).map((o: any, i: number) => MCQ_LABELS_EN[q.options.indexOf(o)]).join(', ')) : (q.type === 'MCQ' ? normalizeAnswer(q.correctAnswer) : (q.options || []).filter((o: any) => o.isCorrect).map((o: any, i: number) => MCQ_LABELS_BN[q.options.indexOf(o)]).join(', '))}
                              </span>
                            </div>
                            {q.explanation && (
                              <div className="mt-1 text-black bg-gray-50 p-2 rounded border border-gray-200 shadow-sm leading-relaxed">
                                <span className="font-bold text-gray-800">ব্যাখ্যা:</span>{" "}
                                <UniversalMathJax inline dynamic>
                                  {cleanupMath(renderDynamicExplanation(
                                    q.explanation.replace(/^(\*\*Explanation:\*\*|Explanation:)\s*/i, ''),
                                    q.options,
                                    q.type
                                  ))}
                                </UniversalMathJax>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (q.type === 'INT' || q.type === 'NUMERIC') {
                    return (
                      <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-bold">{qNum}. </span>
                            <UniversalMathJax inline>{q.q || q.questionText || ''}</UniversalMathJax>
                          </div>
                          <span className="ml-4 font-bold">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                        <div className="mt-2 ml-6 border-2 border-green-600 bg-green-50 rounded p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-700">সঠিক উত্তর:</span>
                            <span className="font-bold text-green-800">{q.modelAnswer}</span>
                          </div>
                        </div>
                        {q.explanation && (
                          <div className="mt-2 ml-6 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="font-bold text-blue-700 mb-1">ব্যাখ্যা:</p>
                            <div className="text-blue-900">
                              <UniversalMathJax inline dynamic>
                                {cleanupMath(renderDynamicExplanation(
                                  q.explanation,
                                  null,
                                  q.type
                                ))}
                              </UniversalMathJax>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (q.type === 'AR') {
                    return (
                      <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 space-y-1">
                            <span className="font-bold">{qNum}. </span>
                            <span className="font-semibold">{isEn ? '(A):' : '(A):'}</span> <UniversalMathJax inline>{q.assertion}</UniversalMathJax>
                            <br />
                            <span className="font-semibold ml-5">{isEn ? '(R):' : '(R):'}</span> <UniversalMathJax inline>{q.reason}</UniversalMathJax>
                          </div>
                          <span className="ml-4 font-bold">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                        <div className="mt-2 ml-6 border-2 border-green-600 bg-green-50 rounded p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-700">সঠিক বিকল্প:</span>
                            <span className="font-bold text-green-800">{isEn ? q.correctOption : toBengaliNumerals(q.correctOption)}</span>
                            <span className="text-green-600">
                              ({q.correctOption === 1 ? (isEn ? 'A & R are true, R is correct explanation of A' : 'A ও R সত্য, R হলো A এর সঠিক ব্যাখ্যা') :
                                q.correctOption === 2 ? (isEn ? 'A & R are true, R is not correct explanation of A' : 'A ও R সত্য, R হলো A এর সঠিক ব্যাখ্যা নয়') :
                                  q.correctOption === 3 ? (isEn ? 'A is true, R is false' : 'A সত্য, R মিথ্যা') :
                                    q.correctOption === 4 ? (isEn ? 'A is false, R is true' : 'A মিথ্যা, R সত্য') : (isEn ? 'Both are false' : 'উভয়ই মিথ্যা')})
                            </span>
                          </div>
                        </div>
                        {q.explanation && (
                          <div className="mt-2 ml-6 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="font-bold text-blue-700 mb-1">ব্যাখ্যা:</p>
                            <div className="text-blue-900">
                              <UniversalMathJax inline dynamic>
                                {cleanupMath(renderDynamicExplanation(
                                  q.explanation,
                                  null,
                                  q.type
                                ))}
                              </UniversalMathJax>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (q.type === 'MTF') {
                    return (
                      <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold">{qNum}. {isEn ? 'Match the Columns:' : 'স্তম্ভদ্বয় মিল করো:'}</span>
                          <span className="font-bold">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {((q.leftColumn || []) as any[]).map((leftItem: any, lIdx: number) => {
                            const rightId = (q.matches || {})[leftItem.id];
                            const rightIdx = (q.rightColumn || []).findIndex((r: any) => r.id === rightId);
                            const rightItem = (q.rightColumn || [])[rightIdx];

                            // Visual labels
                            const vLeftLabel = isEn ? (lIdx + 1) : toBengaliNumerals(lIdx + 1);
                            const vRightLabel = rightIdx !== -1 ? String.fromCharCode(65 + rightIdx) : '?';

                            return (
                              <div key={lIdx} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                                <span className="font-bold text-green-700">{vLeftLabel}</span>
                                <span>→</span>
                                <span className="text-black font-medium">
                                  (<UniversalMathJax inline>{leftItem?.text || ''}</UniversalMathJax> - <UniversalMathJax inline>{rightItem?.text || ''}</UniversalMathJax>)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <div className="mt-2 ml-6 p-2 bg-blue-50 border border-blue-100 rounded">
                            <span className="font-bold text-blue-700">ব্যাখ্যা:</span>{" "}
                            <UniversalMathJax inline dynamic>
                              {cleanupMath(renderDynamicExplanation(
                                q.explanation,
                                null,
                                q.type,
                                q.rightColumn
                              ))}
                            </UniversalMathJax>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          )}

          {/* CQ/SQ/Descriptive Section */}
          {(cqs.length > 0 || sqs.length > 0 || descriptives.length > 0) && (
            <div style={{
              ...(forcePageBreak ? { pageBreakBefore: 'always' } : {}),
              fontSize: cqSqFontSize ? `${cqSqFontSize}%` : (fontSize ? `${fontSize}%` : '100%')
            }}>
              {forcePageBreak && (
                <Header
                  examInfo={examInfo}
                  type="cqsq"
                  qrData={qrData}
                  marks={cqSqTotalMarks}
                  time={examInfo.cqSqTime || 0}
                  banglaWord={examInfo.set ? pickBanglaWord((examInfo.id || '') + examInfo.set, 1, lang) : undefined}
                  showDate={showDate}
                />
              )}
              {cqs.length > 0 && (
                <>
                  <div
                    className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 mt-6 cq-section section-break"
                  >
                    <h3>{isEn ? 'CQ Answers' : 'সৃজনশীল প্রশ্নের উত্তর (CQ Answers)'}</h3>
                    <div className="text-right">
                      <div>{isEn ? 'Max Marks' : 'সর্বোচ্চ নম্বর'}: {isEn ? cqRequiredMarks : toBengaliNumerals(cqRequiredMarks)}</div>
                      {cqRequired > 0 && (
                        <div className="">{isEn ? `(Answer any ${cqRequired})` : `(যেকোনো ${toBengaliNumerals(cqRequired)} টি উত্তর করতে হবে)`}</div>
                      )}
                    </div>
                  </div>
                  {/* Render CQ questions with subsections if they exist */}
                  {examInfo.cqSubsections && examInfo.cqSubsections.length > 1 ? (
                    // Multiple subsections - render with headers
                    examInfo.cqSubsections.map((subsection: any, subIdx: number) => {
                      const subsectionQuestions = cqs.slice(subsection.startIndex - 1, subsection.endIndex);
                      const subsectionRequired = subsection.requiredQuestions || 0;

                      return (
                        <div key={subIdx} className="mb-4">
                          {/* Subsection header */}
                          <div className="font-semibold text-blue-800 dark:text-blue-400 mb-2 border-l-4 border-blue-500 pl-3 bg-blue-50 dark:bg-blue-900/20 py-2 subsection-header">
                            {subsection.name || ` ${isEn ? 'Subsection' : 'উপ-অনুচ্ছেদ'} ${toBengaliNumerals(subIdx + 1)}`}
                            {subsectionRequired > 0 && (
                              <span className="font-normal text-gray-600 dark:text-gray-400 ml-2">
                                {isEn ? `(Answer at least ${toBengaliNumerals(subsectionRequired)} questions)` : `(কমপক্ষে ${toBengaliNumerals(subsectionRequired)} টি উত্তর করতে হবে)`}
                              </span>
                            )}
                          </div>

                          {/* Answers in this subsection */}
                          <div className="ml-4">
                            {subsectionQuestions.map((q, idx) => (
                              <div key={idx} className="mb-3 text-left cq-question">
                                <div className="flex items-start">
                                  <span className="font-bold mr-2">{isEn ? (subsection.startIndex + idx) : toBengaliNumerals(subsection.startIndex + idx)}.</span>
                                  <div className="flex-1">
                                    <div className="text-red-600 font-bold mb-2">{isEn ? 'Answer:' : 'উত্তর:'}</div>
                                    {q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0 ? (
                                      <ul className="list-inside mt-1 ml-4">
                                        {q.subQuestions.map((sub, sidx) => (
                                          <li key={sidx} className="ml-4 flex items-start mb-2">
                                            <span className="font-bold mr-1">{isEn ? (ENGLISH_SUB_LABELS[sidx] || String.fromCharCode(97 + sidx)) : (BENGALI_SUB_LABELS[sidx] || String.fromCharCode(0x0995 + sidx))}.</span>
                                            <span className="flex-1">
                                              <div className="mb-1">
                                                <span className="">[{isEn ? (sub.marks || '?') : toBengaliNumerals(sub.marks || '?')} {isEn ? 'Marks' : 'নম্বর'}]</span>
                                              </div>
                                              <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-sm leading-relaxed">
                                                <Text>{sub.modelAnswer || sub.answer || sub.text || 'উত্তর প্রদান করা হয়নি।'}</Text>
                                              </div>
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-sm leading-relaxed">
                                        <Text>{q.modelAnswer || (isEn ? 'No answer provided.' : 'উত্তর প্রদান করা হয়নি।')}</Text>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Single subsection or no subsections - render normally
                    <div>
                      {cqs.map((q, idx) => (
                        <div key={idx} className="mb-3 text-left cq-question">
                          <div className="flex items-start">
                            <span className="font-bold mr-2">{isEn ? (idx + 1) : toBengaliNumerals(idx + 1)}.</span>
                            <div className="flex-1">
                              <div className="text-red-600 font-bold mb-2">
                                {isEn ? 'Answer:' : 'উত্তর:'}
                              </div>
                              {q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0 ? (
                                <ul className="list-inside mt-1 ml-4">
                                  {q.subQuestions.map((sub, sidx) => (
                                    <li key={sidx} className="ml-4 flex items-start mb-2">
                                      <span className="font-bold mr-1">{isEn ? (ENGLISH_SUB_LABELS[sidx] || String.fromCharCode(97 + sidx)) : (BENGALI_SUB_LABELS[sidx] || String.fromCharCode(0x0995 + sidx))}.</span>
                                      <span className="flex-1">
                                        <div className="mb-1">
                                          <span className="">[{isEn ? (sub.marks || '?') : toBengaliNumerals(sub.marks || '?')} {isEn ? 'Marks' : 'নম্বর'}]</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-sm leading-relaxed">
                                          <Text>{sub.modelAnswer || sub.answer || sub.text || 'উত্তর প্রদান করা হয়নি।'}</Text>
                                        </div>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-sm leading-relaxed">
                                  <UniversalMathJax inline dynamic>{q.modelAnswer || (isEn ? 'No answer provided.' : 'উত্তর প্রদান করা হয়নি।')}</UniversalMathJax>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* DESCRIPTIVE Section */}
              {descriptives.length > 0 && (
                <>
                  <div className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 mt-6 desc-section section-break">
                    <h3>{isEn ? 'Descriptive & Grammar Answers' : 'রচনামূলক ও ব্যাকরণ প্রশ্নের উত্তর (Descriptive & Grammar Answers)'}</h3>
                    <div className="text-right">
                      <div>{isEn ? 'Total Marks' : 'মোট নম্বর'}: {isEn ? descMarks : toBengaliNumerals(descMarks)}</div>
                    </div>
                  </div>
                  <div>
                    {descriptives.map((q, idx) => {
                      const questionBaseNum = cqs.length + sqs.length + idx + 1;
                      return (
                        <div key={idx} className="mb-4 text-left descriptive-question break-inside-avoid">
                          <div className="flex items-start">
                            <span className="font-bold mr-2 text-lg">{isEn ? questionBaseNum : toBengaliNumerals(questionBaseNum)}.</span>
                            <div className="flex-1">
                              <div className="text-red-600 font-bold mb-2">{isEn ? 'Answer:' : 'উত্তর:'}</div>

                              {(q.subQuestions || []).map((part: any, pIdx: number) => (
                                <div key={pIdx} className="mb-3">
                                  {part.label && <div className="font-bold text-sm mb-1 underline">{part.label}:</div>}

                                  <div className="bg-gray-50 p-3 rounded border border-gray-200 shadow-sm leading-relaxed text-sm">
                                    {part.subType === 'writing' && (
                                      <div>
                                        <div className="font-bold text-xs text-blue-700 mb-1">{isEn ? 'Sample Answer:' : 'নমুনা উত্তর (Sample Answer):'}</div>
                                        <UniversalMathJax dynamic>{part.modelAnswer || (isEn ? 'No sample answer provided.' : 'নমুনা উত্তর প্রদান করা হয়নি।')}</UniversalMathJax>
                                      </div>
                                    )}

                                    {part.subType === 'fill_in' && (
                                      <div>
                                        <div className="font-bold text-xs text-blue-700 mb-1">{isEn ? 'Fill-in Answers:' : 'শূন্যস্থান পূরণ (Fill-in Answers):'}</div>
                                        {part.fillType === 'gap_passage' || !part.fillType ? (
                                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                            {(part.answers || []).map((ans: string, aIdx: number) => (
                                              <div key={aIdx} className="flex gap-1">
                                                <span className="font-bold">({isEn ? (aIdx + 1) : toBengaliNumerals(aIdx + 1)})</span>
                                                <span>{ans}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-2 gap-2">
                                            {(part.answers || []).map((ans: string, aIdx: number) => (
                                              <div key={aIdx} className="flex gap-1">
                                                <span className="font-bold">({String.fromCharCode(97 + aIdx)})</span>
                                                <span>{ans}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {part.subType === 'comprehension' && (
                                      <div>
                                        <div className="font-bold text-xs text-blue-700 mb-1">{isEn ? 'Comprehension Answers:' : 'বোধগম্যতা (Comprehension Answers):'}</div>
                                        {(!part.answerType || part.answerType === 'qa') ? (
                                          <div className="space-y-2">
                                            {(part.answers || []).map((ans: string, aIdx: number) => (
                                              <div key={aIdx} className="flex items-start gap-2">
                                                <span className="font-bold text-xs">{isEn ? (aIdx + 1) : toBengaliNumerals(aIdx + 1)}.</span>
                                                <UniversalMathJax dynamic>{ans}</UniversalMathJax>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-2 gap-2">
                                            {(part.stemAnswers || []).map((ans: string, aIdx: number) => (
                                              <div key={aIdx} className="flex gap-2">
                                                <span className="font-bold">{isEn ? (aIdx + 1) : toBengaliNumerals(aIdx + 1)}.</span>
                                                <span className="font-bold text-red-600">{normalizeAnswer(ans)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {part.subType === 'matching' || part.subType === 'mtf' ? (
                                      <div>
                                        <div className="font-bold text-xs text-blue-700 mb-2">{isEn ? 'Matching Answers:' : 'মিলকরণ উত্তর (Matching Answers):'}</div>
                                        <div className="grid grid-cols-1 gap-2 ml-4">
                                          {Object.entries((part.matches as Record<string, string>) || {}).map(([l, r], mIdx) => (
                                            <div key={mIdx} className="flex gap-2 items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                                              <span className="font-bold w-12 text-center bg-gray-50 rounded">({l})</span>
                                              <span className="text-gray-400">→</span>
                                              <span className="font-bold text-red-600 px-2 min-w-[40px] text-center bg-red-50 rounded">({r})</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : part.subType === 'rearranging' ? (
                                      <div>
                                        <div className="font-bold text-xs text-blue-700 mb-2">{isEn ? 'Rearranging Answer:' : 'পুনঃসাজানো উত্তর (Rearranging Answer):'}</div>
                                        <div className="flex flex-wrap gap-2 ml-4 bg-white p-3 rounded border border-gray-100 shadow-sm">
                                          {(part.correctOrder || []).map((o: string, oIdx: number) => (
                                            <React.Fragment key={oIdx}>
                                              <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">{o}</span>
                                              {oIdx < (part.correctOrder || []).length - 1 && <span className="pt-1 text-gray-300">→</span>}
                                            </React.Fragment>
                                          ))}
                                        </div>
                                      </div>
                                    ) : part.subType === 'table' ? (
                                      <div>
                                        <div className="font-bold text-xs text-blue-700 mb-1">{isEn ? 'Table Answers:' : 'টেবিল উত্তর (Table Answers):'}</div>
                                        <div className="space-y-1">
                                          {(part.tableAnswers || []).map((row: string[], rIdx: number) => (
                                            <div key={rIdx} className="flex gap-2 border-b border-gray-100 pb-1">
                                              <span className="font-bold text-[10px] text-gray-500 min-w-[50px]">{isEn ? 'Row' : 'সারি'} {isEn ? (rIdx + 1) : toBengaliNumerals(rIdx + 1)}:</span>
                                              <div className="flex flex-wrap gap-x-4">
                                                {row.map((cell, cIdx) => (
                                                  <span key={cIdx} className="text-xs">
                                                    <span className="text-gray-400 mr-1">{isEn ? (cIdx + 1) : toBengaliNumerals(cIdx + 1)}.</span> {cell}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                  <div className="text-right font-bold text-xs mt-1">[{isEn ? part.marks : toBengaliNumerals(part.marks)} {isEn ? 'Marks' : 'নম্বর'}]</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* SQ Section */}
              {sqs.length > 0 && (
                <>
                  <div className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 mt-6 sq-section section-break">
                    <h3>{isEn ? 'SQ Answers' : 'সংক্ষিপ্ত প্রশ্নের উত্তর (SQ Answers)'}</h3>
                    <div className="text-right">
                      <div>{isEn ? 'Max Marks' : 'সর্বোচ্চ নম্বর'}: {isEn ? sqRequiredMarks : toBengaliNumerals(sqRequiredMarks)}</div>
                      {sqRequired > 0 && (
                        <div className="">{isEn ? `(Answer any ${sqRequired})` : `(যেকোনো ${toBengaliNumerals(sqRequired)} টি উত্তর করতে হবে)`}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    {sqs.map((q, idx) => (
                      <div key={idx} className="mb-3 text-left sq-question">
                        <div className="flex items-start">
                          <span className="font-bold mr-2">{isEn ? (idx + 1) : toBengaliNumerals(idx + 1)}.</span>
                          <div className="flex-1">
                            <div className="text-red-600 font-bold mb-2">{isEn ? 'Answer:' : 'উত্তর:'}</div>
                            <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-sm leading-relaxed">
                              <Text>{q.modelAnswer || 'উত্তর প্রদান করা হয়নি।'}</Text>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }
);

AnswerQuestionPaper.displayName = 'AnswerQuestionPaper';
export default AnswerQuestionPaper;