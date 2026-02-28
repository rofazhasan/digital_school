import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJaxContext } from 'better-react-mathjax';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import Latex from 'react-latex';
import { cleanupMath } from '@/lib/utils';
import { toBengaliNumerals, formatBengaliDuration } from '@/utils/numeralConverter';


// --- TYPES ---
interface MCQ {
  q: string;
  options: { text: string }[];
  marks?: number;
  type?: string;
}
interface MC {
  q: string;
  options: { text: string; isCorrect?: boolean }[];
  marks?: number;
  type?: string;
}
interface INT {
  q: string;
  marks?: number;
  modelAnswer?: string;
  type?: string;
}
interface CQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
  subQuestions?: any[];
  type?: string;
}
interface AR {
  assertion: string;
  reason: string;
  correctOption?: number;
  marks?: number;
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
  type?: string;
}
interface DESCRIPTIVE {
  id: string;
  type: string;
  marks: number;
  subQuestions: any[];
  questionText?: string;
}
interface QuestionPaperProps {
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
    smcq?: any[];
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
const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ']; // runtime overridden below
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ'];
const ENGLISH_SUB_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

// Helper to chunk an array into N-sized pieces
function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

// Helper to render text with diagrams support
const Text = ({ children }: { children: string }) => (
  <UniversalMathJax inline dynamic>
    {cleanupMath(children)}
  </UniversalMathJax>
);


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
  'Pinnacle', 'Summit', 'Apex', 'Acme', 'Zenith', 'Crest', 'Ascent', 'Aura', 'Nimbus', 'Nimble',
  'Stellar', 'Radiant', 'Brilliant', 'Gleaming', 'Splendid', 'Glorious', 'Resplendent', 'Effulgent', 'Bright',
  'Compass', 'Beacon', 'Haven', 'Anchor', 'Voyage', 'Quest', 'Journey', 'Pilgrimage', 'Odyssey', 'Venture'
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
            {examInfo.schoolName || 'শিক্ষা প্রতিষ্ঠানের নাম'}
          </h1>
          <p className="text-sm font-semibold text-gray-800 uppercase tracking-widest">
            {examInfo.schoolAddress || 'প্রতিষ্ঠানের ঠিকানা'}
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
            {banglaWord && <span className="ml-1 text-gray-500">({banglaWord})</span>}
          </span>
        )}
        <span><strong>{isHEn ? 'Time' : 'সময়'}:</strong> {typeof time === 'number' ? formatBengaliDuration(time) : (isHEn ? time : toBengaliNumerals(String(time)))}</span>
        <span><strong>{isHEn ? 'Full Marks' : 'পূর্ণমান'}:</strong> {isHEn ? marks : toBengaliNumerals(marks)}</span>
      </div>
    </header>
  );
};

// Main QuestionPaper component (forwardRef for printing)
const QuestionPaper = forwardRef<HTMLDivElement, QuestionPaperProps>(
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

    const allObjective = [
      ...(mcqs.map(q => ({ ...q, type: (q.type || 'MCQ').toUpperCase() }))),
      ...(mcs.map(q => ({ ...q, type: (q.type || 'MC').toUpperCase() }))),
      ...(ints.map(q => ({ ...q, type: (q.type || 'INT').toUpperCase() }))),
      ...(ars.map(q => ({ ...q, type: (q.type || 'AR').toUpperCase() }))),
      ...(questions.mtf || []).map(q => ({ ...q, type: (q.type || 'MTF').toUpperCase() })),
      ...(questions.smcq || []).map(q => ({ ...q, type: 'SMCQ' }))
    ];

    const mcqTotal = mcqs.reduce((sum, q) => sum + (q.marks || 1), 0);
    const mcTotal = mcs.reduce((sum, q) => sum + (q.marks || 1), 0);
    const intTotal = ints.reduce((sum, q) => sum + (q.marks || 1), 0);
    const arTotal = ars.reduce((sum, q) => sum + (q.marks || 1), 0);
    const mtfTotal = (questions.mtf || []).reduce((sum, q) => sum + (q.marks || 1), 0);

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
    const grandTotalMarks = objectiveTotal + cqSqTotalMarks;

    return (
      <div
        ref={ref}
        className="question-paper-container bg-white relative overflow-hidden"
        style={{
          fontFamily: isEn ? "'Bookman Old Style', 'Georgia', serif" : "'ExamFont', 'Noto Serif Bengali', Georgia, serif",
          fontSize: fontSize ? `${fontSize}%` : '100%'
        }}
      >
        <div className="watermark print-only">{examInfo.schoolName}</div>

        <div style={{ fontSize: fontSize ? `${fontSize}%` : '100%' }}>
          <Header
            examInfo={examInfo}
            type="objective"
            qrData={qrData}
            marks={forcePageBreak ? objectiveTotal : grandTotalMarks}
            time={forcePageBreak ? (examInfo.objectiveTime || 0) : totalTimeMinutes}
            banglaWord={examInfo.set ? pickBanglaWord((examInfo.id || '') + examInfo.set, 0, lang) : undefined}
            showDate={showDate}
            lang={lang}
          />

          {/* Special Instruction Box */}
          <div className="instruction-box">
            {hideOMR ? (
              <p>
                <strong>{isEn ? 'General Instructions:' : 'বিশেষ দ্রষ্টব্য:'}</strong>{' '}
                {isEn
                  ? 'Answer the following questions carefully. The figures in the right margin indicate full marks.'
                  : 'নিচের প্রশ্নগুলোর উত্তর দাও। ডান পাশের সংখ্যা প্রশ্নের পূর্ণমান জ্ঞাপন করে।'}
                {Number(examInfo.mcqNegativeMarking) > 0 && (
                  <span className="font-semibold">
                    {' '}{isEn
                      ? `Negative marking of ${examInfo.mcqNegativeMarking}% for each wrong answer.`
                      : `প্রতিটি ভুল উত্তরের জন্য ${toBengaliNumerals(examInfo.mcqNegativeMarking)}% নম্বর কাটা যাবে।`}
                  </span>
                )}
              </p>
            ) : (
              <p>
                <strong>{isEn ? 'General Instructions:' : 'বিশেষ দ্রষ্টব্য:'}</strong>{' '}
                {isEn
                  ? 'Fill in the corresponding circles on the provided MCQ answer sheet with a black ballpoint pen. Figures in the right margin indicate full marks.'
                  : 'সরবরাহকৃত বহুনির্বাচনি অভীক্ষার উত্তরপত্রে প্রশ্নের ক্রমিক নম্বরের বিপরীতে প্রদত্ত বর্ণসংবলিত বৃত্তসমূহ হতে সঠিক/সর্বোৎকৃষ্ট বল পয়েন্ট কলম দ্বারা সম্পূর্ণ ভরাট করো। প্রশ্নপত্রের ডান পাশের সংখ্যা প্রশ্নের পূর্ণমান জ্ঞাপন করে।'}
                {Number(examInfo.mcqNegativeMarking) > 0 && (
                  <span className="font-semibold">
                    {' '}{isEn
                      ? `Negative marking of ${examInfo.mcqNegativeMarking}% for each wrong answer.`
                      : `প্রতিটি ভুল উত্তরের জন্য ${toBengaliNumerals(examInfo.mcqNegativeMarking)}% নম্বর কাটা যাবে।`}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main>
          {/* MCQ Section */}
          {allObjective.length > 0 && (
            <div style={{ fontSize: fontSize ? `${fontSize}%` : '100%' }}>

              <div className="mcq-container">
                {(() => {
                  let questionCounter = 1;
                  return allObjective.map((q: any, idx) => {
                    const startNum = questionCounter;
                    if (q.type?.toUpperCase() === 'SMCQ') {
                      questionCounter += (q.subQuestions?.length || 0);
                    } else {
                      questionCounter++;
                    }
                    const qNum = isEn ? String(startNum) : toBengaliNumerals(startNum);

                    if (q.type?.toUpperCase() === 'MCQ' || q.type?.toUpperCase() === 'MC') {
                      // Column count based on max single option length (Bengali chars ~2x wider)
                      // 4-col: all options very short (≤4 chars) - single syllable words
                      // 2-col: options up to 15 chars - most standard MCQ options
                      // 1-col: options longer than 15 chars - phrases/sentences
                      const maxOptLen = (q.options || []).reduce((max: number, opt: any) => Math.max(max, (opt.text || '').length), 0);
                      let gridClass = "options-grid-2"; // default: 2-col (standard BD exam format)
                      if (maxOptLen <= 4) gridClass = "options-grid-4";  // very short: 4-col
                      else if (maxOptLen > 15) gridClass = "options-grid-1"; // long phrases: 1-col

                      return (
                        <div key={idx} className="mb-4 text-left question-block break-inside-avoid">
                          <div className="flex items-start">
                            <span className="font-bold mr-2">
                              {qNum}.{q.type?.toUpperCase() === 'MC' ? '*' : ''}
                            </span>
                            <div className="flex-1">
                              <Text>{`${q.q || q.questionText || ''} [${toBengaliNumerals(q.marks || 1)}]`}</Text>
                              {q.type?.toUpperCase() === 'MC' && <div className="text-blue-700 font-bold mb-1">{isEn ? '[Select all correct answers]' : '[সকল সঠিক উত্তর নির্বাচন করো]'}</div>}
                              <div className={`mt-1 ${gridClass}`}>
                                {(q.options || []).map((opt: any, oidx: number) => (
                                  <div key={oidx} className="option-item flex items-start gap-0.5" style={{ minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    {q.type?.toUpperCase() === 'MC' && <span className="flex-shrink-0">☐</span>}
                                    <span className={`mcq-option-label flex-shrink-0 ${isEn && !hideOMR ? 'nazrul-omr-font' : ''}`}>{isEn ? MCQ_LABELS_EN[oidx] : MCQ_LABELS_BN[oidx]}</span>
                                    <span className="flex-1" style={{ minWidth: 0 }}><Text>{opt.text}</Text></span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (q.type?.toUpperCase() === 'INT' || q.type?.toUpperCase() === 'NUMERIC') {
                      return (
                        <div key={idx} className="mb-4 text-left question-block break-inside-avoid">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-bold">{qNum}. </span>
                              <UniversalMathJax inline>{q.q || q.questionText || ''}</UniversalMathJax>
                              <div className="mt-2 ml-6 flex items-center gap-2">
                                <span className="font-bold text-gray-800">{isEn ? 'Answer:' : 'উত্তর:'} </span>
                                <div className="border border-black w-12 h-8 flex items-center justify-center font-bold"></div>
                              </div>
                            </div>
                            <span className="ml-4 font-bold">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                          </div>
                        </div>
                      );
                    }

                    if (q.type?.toUpperCase() === 'AR') {
                      return (
                        <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 space-y-1">
                              <span className="font-bold">{qNum}. </span>
                              <strong>{isEn ? 'Assertion:' : 'নিশ্চয়তা (Assertion):'}</strong> <UniversalMathJax inline>{q.assertion}</UniversalMathJax>
                              <br />
                              <span className="ml-6"><strong>{isEn ? 'Reason:' : 'কারণ (Reason):'}</strong> <UniversalMathJax inline>{q.reason}</UniversalMathJax></span>
                            </div>
                            <span className="ml-4 font-bold">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                          </div>
                          <div className="ml-6 grid grid-cols-1 gap-1 border-l-2 border-gray-200 pl-3">
                            <div>{isEn ? 'a Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.' : 'কAssertion ও Reason উভয়ই সত্য এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা।'}</div>
                            <div>{isEn ? 'b Both Assertion and Reason are true, but Reason is not the correct explanation of Assertion.' : 'খAssertion ও Reason উভয়ই সত্য কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়।'}</div>
                            <div>{isEn ? 'c Assertion is true but Reason is false.' : 'গAssertion সত্য কিন্তু Reason মিথ্যা।'}</div>
                            <div>{isEn ? 'd Assertion is false but Reason is true.' : 'ঘAssertion মিথ্যা কিন্তু Reason সত্য।'}</div>
                            <div>{isEn ? 'e Both Assertion and Reason are false.' : 'ঙAssertion ও Reason উভয়ই মিথ্যা।'}</div>
                          </div>
                        </div>
                      );
                    }

                    if (q.type?.toUpperCase() === 'MTF') {
                      return (
                        <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold">{qNum}. {isEn ? 'Match the left column with the right column:' : 'বাম স্তম্ভের সাথে ডান স্তম্ভ মিল কর:'}</span>
                            <span className="ml-4 font-bold">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 border border-black p-2 ml-6">
                            <div className="border-r border-black pr-2">
                              <p className="font-bold text-center border-b border-black mb-1">{isEn ? 'Column A' : 'স্তম্ভ ক'}</p>
                              {(q.leftColumn || []).map((item: any, i: number) => (
                                <div key={i} className="flex gap-1">
                                  <span className="font-bold">{toBengaliNumerals(i + 1)}</span>
                                  <UniversalMathJax inline>{item.text}</UniversalMathJax>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="font-bold text-center border-b border-black mb-1">{isEn ? 'Column B' : 'স্তম্ভ খ'}</p>
                              {(q.rightColumn || []).map((item: any, i: number) => (
                                <div key={i} className="flex gap-1">
                                  <span className="font-bold">{String.fromCharCode(65 + i)}</span>
                                  <UniversalMathJax inline>{item.text}</UniversalMathJax>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (q.type?.toUpperCase() === 'SMCQ') {
                      const endNum = questionCounter - 1;
                      const rangeStr = startNum === endNum ? qNum : (isEn ? `${startNum}-${endNum}` : `${toBengaliNumerals(startNum)}-${toBengaliNumerals(endNum)}`);
                      return (
                        <div key={idx} className="mb-6 question-block break-inside-avoid">
                          <div className="bg-gray-50 p-2 border-l-4 border-black mb-3 italic text-sm">
                            <p className="font-bold mb-2">
                              {isEn ? `Read the following stem and answer questions ${rangeStr}:` : `নিচের উদ্দীপকটি পড়ো এবং ${rangeStr} নং প্রশ্নের উত্তর দাও:`}
                            </p>
                            <div className="not-italic font-normal">
                              <Text>{q.q || q.questionText || q.stem || ''}</Text>
                              {q.image && (
                                <div className="mt-2 text-center">
                                  <img src={q.image} alt="stem image" className="max-h-48 mx-auto rounded border" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-4">
                            {(q.subQuestions || []).map((sub: any, sIdx: number) => {
                              const subNum = startNum + sIdx;
                              const subNumStr = isEn ? String(subNum) : toBengaliNumerals(subNum);

                              const maxOptLen = (sub.options || []).reduce((max: number, opt: any) => Math.max(max, (typeof opt === 'string' ? opt : opt.text || opt || '').length), 0);
                              let gridClass = "options-grid-2";
                              if (maxOptLen <= 4) gridClass = "options-grid-4";
                              else if (maxOptLen > 15) gridClass = "options-grid-1";

                              return (
                                <div key={sIdx} className="mb-4 text-left break-inside-avoid">
                                  <div className="flex items-start">
                                    <span className="font-bold mr-2">{subNumStr}.</span>
                                    <div className="flex-1">
                                      <Text>{`${sub.questionText || sub.question || sub.text || ''} [${toBengaliNumerals(sub.marks || 1)}]`}</Text>
                                      <div className={`mt-1 ${gridClass}`}>
                                        {(sub.options || []).map((opt: any, oidx: number) => (
                                          <div key={oidx} className="option-item flex items-start gap-0.5">
                                            <span className={`mcq-option-label flex-shrink-0 ${isEn && !hideOMR ? 'nazrul-omr-font' : ''}`}>{isEn ? MCQ_LABELS_EN[oidx] : MCQ_LABELS_BN[oidx]}</span>
                                            <span className="flex-1"><Text>{typeof opt === 'string' ? opt : opt.text}</Text></span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  });
                })()}
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
                  lang={lang}
                />
              )}
              {cqs.length > 0 && (
                <>
                  <div
                    className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 mt-6 cq-section section-break"
                  >
                    <div className="flex flex-col">
                      <h3>{isEn ? 'Creative Questions (CQ)' : 'সৃজনশীল প্রশ্ন (CQ)'}</h3>
                    </div>
                    <div className="text-right">
                      <div>{isEn ? 'Max Marks' : 'সর্বোচ্চ নম্বর'}: {isEn ? cqRequiredMarks : toBengaliNumerals(cqRequiredMarks)}</div>
                      {cqRequired > 0 && (
                        <div className="">{isEn ? `(Answer any ${cqRequired})` : `(মোট ${toBengaliNumerals(cqRequired)} টি উত্তর করতে হবে)`}</div>
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

                          {/* Questions in this subsection */}
                          <div className="ml-4">
                            {subsectionQuestions.map((q, idx) => (
                              <div key={idx} className="mb-3 text-left cq-question">
                                <div className="flex items-start">
                                  <span className="font-bold mr-2">{isEn ? (subsection.startIndex + idx) : toBengaliNumerals(subsection.startIndex + idx)}.</span>
                                  <div className="flex-1">
                                    <Text>{`${q.questionText} [${toBengaliNumerals(q.marks || 1)}]`}</Text>
                                    {q.subQuestions && Array.isArray(q.subQuestions) && (
                                      <ul className="list-inside mt-1 ml-4">
                                        {q.subQuestions.map((sub, sidx) => (
                                          <li key={sidx} className="ml-4 flex items-start">
                                            <span className="font-bold mr-1">{isEn ? (ENGLISH_SUB_LABELS[sidx] || String.fromCharCode(97 + sidx)) : (BENGALI_SUB_LABELS[sidx] || String.fromCharCode(0x0995 + sidx))}.</span>
                                            <span className="flex-1">
                                              <Text>
                                                {`${sub.question || sub.questionText || sub.text || sub}${sub.marks ? ` [${isEn ? sub.marks : toBengaliNumerals(sub.marks)}]` : ''}`}
                                              </Text>
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
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
                              <Text>{`${q.questionText} [${toBengaliNumerals(q.marks || 1)}]`}</Text>
                              {q.subQuestions && Array.isArray(q.subQuestions) && (
                                <ul className="list-inside mt-1 ml-4">
                                  {q.subQuestions.map((sub, sidx) => (
                                    <li key={sidx} className="ml-4 flex items-start">
                                      <span className="font-bold mr-1">{isEn ? (ENGLISH_SUB_LABELS[sidx] || String.fromCharCode(97 + sidx)) : (BENGALI_SUB_LABELS[sidx] || String.fromCharCode(0x0995 + sidx))}.</span>
                                      <span className="flex-1">
                                        <Text>
                                          {`${sub.question || sub.questionText || sub.text || sub}${sub.marks ? ` [${isEn ? sub.marks : toBengaliNumerals(sub.marks)}]` : ''}`}
                                        </Text>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* SQ Section */}
              {sqs.length > 0 && (
                <>
                  <div className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 mt-6 sq-section section-break">
                    <h3>{isEn ? 'Short Questions (SQ)' : 'সংক্ষিপ্ত প্রশ্ন (SQ)'}</h3>
                    <div className="text-right">
                      <div>{isEn ? 'Max Marks' : 'সর্বোচ্চ নম্বর'}: {isEn ? sqRequiredMarks : toBengaliNumerals(sqRequiredMarks)}</div>
                      {sqRequired > 0 && (
                        <div className="">(মোট {toBengaliNumerals(sqRequired)} টি উত্তর করতে হবে)</div>
                      )}
                    </div>
                  </div>
                  <div>
                    {sqs.map((q, idx) => (
                      <div key={idx} className="mb-3 text-left sq-question">
                        <div className="flex items-start">
                          <span className="font-bold mr-2">{isEn ? (idx + 1) : toBengaliNumerals(idx + 1)}.</span>
                          <div className="flex-1">
                            <Text>{`${q.questionText} [${isEn ? (q.marks || '?') : toBengaliNumerals(q.marks || '?')}]`}</Text>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* DESCRIPTIVE Section */}
              {descriptives.length > 0 && (
                <>
                  <div className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 mt-6 desc-section section-break">
                    <h3>{isEn ? 'Descriptive & Grammar Questions' : 'রচনামূলক ও ব্যাকরণ প্রশ্ন (Descriptive & Grammar)'}</h3>
                    <div className="text-right">
                      <div>{isEn ? 'Total Marks' : 'মোট নম্বর'}: {isEn ? descMarks : toBengaliNumerals(descMarks)}</div>
                    </div>
                  </div>
                  <div>
                    {descriptives.map((q, idx) => {
                      const questionBaseNum = (cqs.length || 0) + (sqs.length || 0) + idx + 1;
                      return (
                        <div key={idx} className="mb-4 text-left descriptive-question break-inside-avoid">
                          <div className="flex items-start">
                            <span className="font-bold mr-2 text-lg">{isEn ? questionBaseNum : toBengaliNumerals(questionBaseNum)}.</span>
                            <div className="flex-1">
                              <UniversalMathJax dynamic>{q.questionText || ""}</UniversalMathJax>
                              {/* Render each sub-part of the descriptive question */}
                              {(q.subQuestions || []).map((part: any, pIdx: number) => (
                                <div key={pIdx} className="mb-3">
                                  {part.label && <div className="font-bold text-sm mb-1 underline">{part.label}:</div>}
                                  {part.instructions && <div className="text-xs italic mb-2">{part.instructions}</div>}

                                  <div className="text-sm">
                                    {part.subType === 'writing' && (
                                      <div className="space-y-2">
                                        {part.sourceText && (
                                          <div className="p-2 bg-gray-50 border border-gray-200 rounded italic text-xs mb-2">
                                            <UniversalMathJax dynamic>{part.sourceText}</UniversalMathJax>
                                          </div>
                                        )}
                                        <div className="font-medium text-[10px] text-gray-400 italic">
                                          (Write your response below)
                                        </div>
                                      </div>
                                    )}

                                    {part.subType === 'short_answer' && (
                                      <div className="space-y-3 mt-2">
                                        {(part.questions || []).map((q: string, qi: number) => (
                                          <div key={qi} className="flex gap-2 items-start text-sm">
                                            <span className="font-bold flex-shrink-0">{isEn ? (qi + 1) : toBengaliNumerals(qi + 1)}.</span>
                                            <div className="flex-1 w-full">
                                              <UniversalMathJax dynamic>{q}</UniversalMathJax>
                                              <div className="border-b-2 border-dotted border-gray-400 w-full mt-6 mb-2"></div>
                                              <div className="border-b-2 border-dotted border-gray-400 w-full mb-2"></div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {part.subType === 'error_correction' && (
                                      <div className="space-y-2 mt-2 ml-4">
                                        {(part.sentences || []).map((s: string, si: number) => (
                                          <div key={si} className="flex items-start gap-2 mb-3 max-w-2xl">
                                            <span className="font-bold flex-shrink-0 w-6">({isEn ? String.fromCharCode(97 + si) : BENGALI_SUB_LABELS[si]})</span>
                                            <div className="flex-1">
                                              <UniversalMathJax dynamic>{s}</UniversalMathJax>
                                              <div className="border-b border-black w-full mt-4"></div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {part.subType === 'fill_in' && (
                                      <div className="space-y-2">
                                        {(part.fillType === 'gap_passage' || !part.fillType) && part.passage && (
                                          <div className="leading-relaxed">
                                            <UniversalMathJax dynamic>
                                              {part.passage.split('___').map((segment: string, sIdx: number, array: any[]) => (
                                                <React.Fragment key={sIdx}>
                                                  {segment}
                                                  {sIdx < array.length - 1 && (
                                                    <span className="font-bold underline px-1">({isEn ? (sIdx + 1) : toBengaliNumerals(sIdx + 1)}) _______</span>
                                                  )}
                                                </React.Fragment>
                                              ))}
                                            </UniversalMathJax>
                                          </div>
                                        )}
                                        {part.fillType && part.fillType !== 'gap_passage' && (
                                          <div className="grid grid-cols-2 gap-x-12 gap-y-2 ml-4">
                                            {(part.items || []).map((item: string, iIdx: number) => (
                                              <div key={iIdx} className="flex items-start gap-2 border-b border-gray-100 pb-1">
                                                <span className="font-bold shrink-0">{isEn ? String.fromCharCode(97 + iIdx) : BENGALI_SUB_LABELS[iIdx]}.</span>
                                                <div className="flex-1"><UniversalMathJax dynamic>{item}</UniversalMathJax></div>
                                                <span className="border-b-2 border-black w-24 shrink-0 mt-3 h-0"></span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {part.subType === 'comprehension' && (
                                      <div className="space-y-3">
                                        {part.stemPassage && (
                                          <div className="p-4 bg-gray-50 border-l-4 border-gray-400 rounded-r-lg mb-4 text-sm leading-relaxed whitespace-pre-wrap">
                                            <UniversalMathJax dynamic>{part.stemPassage}</UniversalMathJax>
                                          </div>
                                        )}
                                        {part.stemImage && <img src={part.stemImage} alt="Stem" className="max-h-64 mx-auto mb-4 rounded border shadow-sm" />}

                                        {(!part.answerType || part.answerType === 'qa') && (
                                          <div className="grid grid-cols-1 gap-2 ml-4">
                                            {(part.questions || []).map((quest: string, qIdx: number) => (
                                              <div key={qIdx} className="flex items-start gap-2">
                                                <span className="font-bold">{isEn ? String.fromCharCode(97 + qIdx) : BENGALI_SUB_LABELS[qIdx]}.</span>
                                                <UniversalMathJax dynamic>{quest}</UniversalMathJax>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {part.answerType === 'stem_mcq' && (
                                          <div className="grid grid-cols-2 gap-x-8 gap-y-4 ml-4">
                                            {(part.stemQuestions || []).map((sq: any, sqIdx: number) => (
                                              <div key={sqIdx} className="break-inside-avoid">
                                                <div className="font-bold mb-1">{isEn ? (sqIdx + 1) : toBengaliNumerals(sqIdx + 1)}. {sq.question}</div>
                                                <div className="grid grid-cols-2 text-[10px] gap-2 ml-2">
                                                  {(sq.options || []).map((opt: string, oIdx: number) => (
                                                    <div key={oIdx} className="flex items-center gap-1">
                                                      <span className="font-bold">({isEn ? MCQ_LABELS_EN[oIdx] : MCQ_LABELS_BN[oIdx]})</span>
                                                      <span>{opt}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {(part.subType === 'matching' || part.subType === 'mtf') && (
                                      <div className="mt-3 ml-4">
                                        <div className="grid grid-cols-2 gap-0 border border-black max-w-2xl mx-auto">
                                          {/* Header */}
                                          <div className="border-r border-b border-black p-2 bg-gray-100 font-bold text-center">Column A</div>
                                          <div className="border-b border-black p-2 bg-gray-100 font-bold text-center">Column B</div>

                                          {/* Rows */}
                                          {(() => {
                                            const left = part.leftColumn || [];
                                            const right = part.rightColumn || [];
                                            const rows = Math.max(left.length, right.length);
                                            const res = [];
                                            for (let i = 0; i < rows; i++) {
                                              res.push(
                                                <React.Fragment key={i}>
                                                  <div className="border-r border-b border-black p-2 flex items-start gap-2">
                                                    <span className="font-bold w-6">({isEn ? (i + 1) : toBengaliNumerals(i + 1)})</span>
                                                    <span className="flex-1"><UniversalMathJax inline dynamic>{left[i]?.text || ""}</UniversalMathJax></span>
                                                  </div>
                                                  <div className="border-b border-black p-2 flex items-start gap-2">
                                                    <span className="font-bold w-6">({isEn ? String.fromCharCode(105 + i) : toBengaliNumerals(i + 1)})</span>
                                                    <span className="flex-1"><UniversalMathJax inline dynamic>{right[i]?.text || ""}</UniversalMathJax></span>
                                                  </div>
                                                </React.Fragment>
                                              );
                                            }
                                            return res;
                                          })()}
                                        </div>
                                      </div>
                                    )}

                                    {part.subType === 'rearranging' && (
                                      <div className="mt-3 ml-4 bg-gray-50 border-2 border-dashed border-gray-300 p-4 rounded-xl">
                                        <div className="grid grid-cols-1 gap-2">
                                          {(part.items || []).map((item: string, iIdx: number) => (
                                            <div key={iIdx} className="flex items-start gap-3">
                                              <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center font-bold shadow-sm shrink-0">
                                                {isEn ? String.fromCharCode(97 + iIdx) : BENGALI_SUB_LABELS[iIdx]}
                                              </div>
                                              <div className="pt-1 flex-1 leading-relaxed"><UniversalMathJax dynamic>{item}</UniversalMathJax></div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {part.subType === 'table' && (
                                      <div className="mt-2">
                                        <table className="w-full border-collapse border border-black text-xs">
                                          <thead>
                                            <tr>
                                              {(part.tableHeaders || []).map((h: string, hi: number) => (
                                                <th key={hi} className="border border-black p-1 bg-gray-50">{h}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(part.tableRows || []).map((row: string[], ri: number) => (
                                              <tr key={ri}>
                                                {row.map((cell: any, ci: number) => (
                                                  <td key={ci} className="border border-black p-1 text-center">
                                                    {cell === '___' ? '____________' : cell}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
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
            </div>
          )}
        </main>

        {/* Signature Blocks */}
        <div className="signature-container print-only">
          <div className="signature-block">
            <div className="signature-line"></div>
            <p className="font-bold">{isEn ? "Examiner's Signature" : 'পরীক্ষকের স্বাক্ষর'}</p>
          </div>
          <div className="signature-block">
            <div className="signature-line"></div>
            <p className="font-bold">{isEn ? "Headmaster's Signature" : 'প্রধান শিক্ষকের স্বাক্ষর'}</p>
          </div>
        </div>
      </div>
    );
  }
);

QuestionPaper.displayName = 'QuestionPaper';
export default QuestionPaper;
