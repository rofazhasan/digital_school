import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJaxContext } from 'better-react-mathjax';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import Latex from 'react-latex';
import { cleanupMath } from '@/lib/utils';
import { toBengaliNumerals, formatBengaliDuration, toRoman } from '@/utils/numeralConverter';
import { BeautifulChart } from "@/app/components/BeautifulChart";


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
  subject?: string;
}
interface AR {
  assertion: string;
  reason: string;
  correctOption?: number;
  marks?: number;
  type?: string;
  subject?: string;
}
interface SQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
  type?: string;
  subject?: string;
}
interface MTF {
  leftColumn: { id: string; text: string }[];
  rightColumn: { id: string; text: string }[];
  matches: Record<string, string>;
  marks?: number;
  type?: string;
  subject?: string;
}
interface DESCRIPTIVE {
  id: string;
  type: string;
  marks: number;
  subQuestions: any[];
  questionText?: string;
  subject?: string;
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
    subjectType?: 'SS' | 'MS';
    requiredOptionalCount?: number;
    subjectsConfig?: any;
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
    cma?: any[];
    mpc?: any[];
    sra?: any[];
    dr?: any[];
    allObjective?: any[];
  };
  qrData: any;
  fontSize?: number;
  cqSqFontSize?: number;
  forcePageBreak?: boolean;
  language?: 'bn' | 'en';
  hideOMR?: boolean;
  showDate?: boolean;
  hideInstitute?: boolean;
  hideHeader?: boolean;
  hideSignature?: boolean;
  startQuestionIndex?: number;
  startCqIndex?: number;
  startSqIndex?: number;
  pageNumberLabel?: string;
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
  <span className="whitespace-pre-wrap">
    <UniversalMathJax inline dynamic>
      {cleanupMath((children || "").replace(/\|\|/g, '\n'))}
    </UniversalMathJax>
  </span>
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

// Helper to detect specific variant or compound subject configurations (e.g., "Only Biology", "Bio + Math", "(25 Qs)")
const isSpecificVariantSubject = (name: string): boolean => {
  return /[\+&]|(\b(and|plus|with|only)\b)|(\b\d+\s*qs\b)|\(|\)/i.test(name);
};

// Bilingual subject alias matching helper with compound-safe protection
const matchSubject = (questionSubject: string | undefined | null, targetSubjectName: string): boolean => {
  if (!questionSubject || !targetSubjectName) return false;
  const qClean = questionSubject.trim().toLowerCase();
  const tClean = targetSubjectName.trim().toLowerCase();
  if (qClean === tClean) return true;

  const qAlpha = qClean.replace(/[^a-z0-9\u0980-\u09FF]/g, '');
  const tAlpha = tClean.replace(/[^a-z0-9\u0980-\u09FF]/g, '');
  if (qAlpha && qAlpha === tAlpha) return true;

  const qIsVariant = isSpecificVariantSubject(qClean);
  const tIsVariant = isSpecificVariantSubject(tClean);
  if (qIsVariant || tIsVariant) {
    if (qIsVariant !== tIsVariant) return false;
    return qAlpha === tAlpha;
  }

  const aliases: Record<string, string[]> = {
    'physics': ['পদার্থবিজ্ঞান', 'পদার্থ', 'phy', 'physics 1st', 'physics 2nd'],
    'chemistry': ['রসায়ন', 'রসায়ন', 'chem', 'chemistry 1st', 'chemistry 2nd'],
    'higher mathematics': ['উচ্চতর গণিত', 'higher math', 'higher mathematics', 'h math', 'h.math', 'math 1st', 'math 2nd'],
    'mathematics': ['গণিত', 'math', 'maths', 'সাধারণ গণিত', 'general math'],
    'biology': ['জীববিজ্ঞান', 'জীব', 'bio', 'biology 1st', 'biology 2nd'],
    'bangla': ['বাংলা', 'bengali', 'bangla 1st', 'bangla 2nd'],
    'english': ['ইংরেজি', 'ইংরেজী', 'eng', 'english 1st', 'english 2nd'],
    'ict': ['তথ্য ও যোগাযোগ প্রযুক্তি', 'আইসিটি', 'information and communication technology'],
  };

  for (const [key, list] of Object.entries(aliases)) {
    const isTarget = tClean === key || list.some(a => tClean === a || tClean.includes(a));
    const isQuestion = qClean === key || list.some(a => qClean === a || qClean.includes(a));
    if (isTarget && isQuestion) return true;
  }

  return false;
};

// --- Dynamic Option Grid Layout Calculator ---
// Dynamically optimizes space: 1 line (4-col) for short, 2 lines (2-col) for moderate, 4 lines (1-col) for sentences.
// Scales thresholds dynamically as font size becomes smaller to maximize page space.
export const getOptionsGridClass = (options: any[], fontSize?: number): string => {
  if (!options || options.length === 0) return "options-grid-2";
  const numFontSize = Number(fontSize) || 100;
  const fontFactor = 100 / Math.max(65, numFontSize);

  const lengths = options.map((opt: any) => (typeof opt === 'string' ? opt : opt.text || opt || '').length);
  const maxOptLen = Math.max(...lengths, 0);
  const totalOptLen = lengths.reduce((sum: number, len: number) => sum + len, 0);
  const count = options.length;

  // 2 options: True/False, Yes/No, etc.
  if (count <= 2) {
    return maxOptLen <= Math.round(28 * fontFactor) ? "options-grid-2" : "options-grid-1";
  }

  // 4 options standard MCQ: can fit in 1 single horizontal row (4 columns across)
  const maxT4 = Math.round(11 * fontFactor);
  const totalT4 = Math.round(42 * fontFactor);
  if (count === 4 && maxOptLen <= maxT4 && totalOptLen <= totalT4) {
    return "options-grid-4"; // 1 line
  }

  // Moderate options: can fit in 2 lines (2 rows x 2 columns)
  const maxT2 = Math.round(32 * fontFactor);
  const totalT2 = Math.round(120 * fontFactor);
  if (maxOptLen <= maxT2 && totalOptLen <= totalT2) {
    return "options-grid-2"; // 2 lines
  }

  // Truly long sentences: 4 lines (1 column per line)
  return "options-grid-1"; // 4 lines
};

// Prestigious Print Section Header for Multi-Subject (MS) Exams
const MSSubjectHeader = ({
  subject,
  isEn,
  questionRangeText,
  optionalInstruction,
  isContinued
}: {
  subject: {
    name: string;
    sectionLetter?: string;
    sectionBengali?: string;
    isMandatory?: boolean;
    totalMarks?: number;
  };
  isEn: boolean;
  questionRangeText?: string;
  optionalInstruction?: string;
  isContinued?: boolean;
}) => {
  return (
    <div className="ms-subject-header my-1 break-inside-avoid border-y border-black bg-gray-100/90 py-0.5 px-2 text-black">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs sm:text-sm font-black tracking-tight uppercase">
            {isEn
              ? `SUBJECT: ${subject.name}${isContinued ? ' (CONTINUED)' : ''}`
              : `বিষয়: ${subject.name}${isContinued ? ' (চলমান)' : ''}`}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
          <span className={`px-1.5 py-0.2 rounded-xs border font-extrabold uppercase tracking-wide ${
            subject.isMandatory
              ? 'border-black bg-white text-black'
              : 'border-black bg-black text-white'
          }`}>
            {subject.isMandatory
              ? (isEn ? 'COMPULSORY' : 'আবশ্যক বিষয়')
              : (isEn ? 'OPTIONAL' : 'ঐচ্ছিক বিষয়')}
          </span>
          {questionRangeText && (
            <span className="bg-white border border-black/40 px-1.5 py-0.2 rounded-xs text-[10px] font-semibold">
              {questionRangeText}
            </span>
          )}
          {subject.totalMarks && subject.totalMarks > 0 ? (
            <span className="font-extrabold text-[10px]">
              [{isEn ? `Full Marks: ${subject.totalMarks}` : `পূর্ণমান: ${toBengaliNumerals(subject.totalMarks)}`}]
            </span>
          ) : null}
        </div>
      </div>
      {!subject.isMandatory && optionalInstruction && (
        <div className="mt-0.5 text-[9.5px] font-semibold italic text-gray-800 border-t border-black/20 pt-0.5 flex items-center gap-1">
          <span>*</span>
          <span>{optionalInstruction}</span>
        </div>
      )}
    </div>
  );
};

const Header = ({ examInfo, type, qrData, marks, time, banglaWord, showDate, lang = 'bn', hideInstitute }: {
  examInfo: any,
  type: 'objective' | 'cqsq',
  qrData: any,
  marks: string | number,
  time: number | string,
  banglaWord?: string,
  showDate?: boolean,
  lang?: 'bn' | 'en',
  hideInstitute?: boolean
}) => {
  const isHEn = lang === 'en';
  const isExamMS = examInfo.subjectType ? examInfo.subjectType === 'MS' : Boolean(
    examInfo.subjectsConfig && ((examInfo.subjectsConfig as any)?.subjects || []).length > 0
  );
  return (
    <header className="mb-1.5 relative border-b-2 border-black pb-1 text-black">
      {!hideInstitute && (
        <div className="flex items-center justify-between gap-2">
          {/* Logo Spacer to balance QR */}
          <div className="w-12" />

          {/* Middle Section: School Info */}
          <div className="flex-1 text-center">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mb-0 leading-tight">
              {examInfo.schoolName || 'শিক্ষা প্রতিষ্ঠানের নাম'}
            </h1>
            <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
              {examInfo.schoolAddress || 'প্রতিষ্ঠানের ঠিকানা'}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="w-12 h-12 flex items-center justify-end">
            <div className="p-0.5 border border-black bg-white shadow-xs">
              <QRCode value={JSON.stringify(qrData)} size={42} />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center my-0.5">
        <div className="inline-block border-y border-black py-0.5 px-6 bg-gray-50/50">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wide leading-none">{examInfo.title}</h2>
        </div>
      </div>

      <div className="text-xs flex flex-row justify-center gap-x-4 gap-y-0.5 flex-wrap mt-0.5 font-semibold border-t border-black/30 pt-0.5">
        <span><strong>{isHEn ? 'Class' : 'শ্রেণি'}:</strong> {isHEn ? examInfo.class : toBengaliNumerals(examInfo.class)}</span>
        <span>
          <strong>{isHEn ? 'Subject' : 'বিষয়'}:</strong>{' '}
          {isExamMS
            ? (isHEn ? 'Multi-Subject Examination' : 'বহু-বিষয়ক পরীক্ষা')
            : (examInfo.subject || (isHEn ? 'General' : 'সাধারণ'))}
        </span>
        {showDate !== false && (
          <span><strong>{isHEn ? 'Date' : 'তারিখ'}:</strong> {isHEn ? examInfo.date : toBengaliNumerals(examInfo.date)}</span>
        )}
        {examInfo.set && (() => {
          const rawSet = String(examInfo.set).trim();
          const cleanSet = rawSet.replace(/\b([A-Za-z0-9]+)\s+\1\b/gi, '$1').trim();
          const displaySet = cleanSet.includes('(') ? cleanSet : (banglaWord ? `${cleanSet}(${banglaWord})` : cleanSet);
          return (
            <span>
              <strong>{isHEn ? 'Set' : 'সেট'}:</strong> {displaySet}
            </span>
          );
        })()}
        <span><strong>{isHEn ? 'Time' : 'সময়'}:</strong> {typeof time === 'number' ? formatBengaliDuration(time) : (isHEn ? time : toBengaliNumerals(String(time)))}</span>
        <span><strong>{isHEn ? 'Full Marks' : 'পূর্ণমান'}:</strong> {isHEn ? marks : toBengaliNumerals(marks)}</span>
      </div>
    </header>
  );
};

// Main QuestionPaper component (forwardRef for printing)
const QuestionPaper = forwardRef<HTMLDivElement, QuestionPaperProps>(
  ({
    examInfo, questions, qrData, fontSize, cqSqFontSize, forcePageBreak, language, hideOMR, showDate, hideInstitute = false,
    hideHeader = false, hideSignature = false, startQuestionIndex = 1, startCqIndex = 1, startSqIndex = 1, pageNumberLabel
  }, ref) => {
    const lang = language || 'bn';
    const isEn = lang === 'en';
    const mcqs = questions.mcq || [];
    const mcs = questions.mc || [];
    const ints = questions.int || [];
    const ars = questions.ar || [];
    const cqs = questions.cq || [];
    const sqs = questions.sq || [];
    const descriptives = questions.descriptive || [];
    const cmas = questions.cma || [];
    const mpcs = questions.mpc || [];

    const allObjective = questions.allObjective && questions.allObjective.length > 0
      ? questions.allObjective
      : [
        ...(mcqs.map(q => ({ ...q, type: (q.type || 'MCQ').toUpperCase() }))),
        ...(mcs.map(q => ({ ...q, type: (q.type || 'MC').toUpperCase() }))),
        ...(ints.map(q => ({ ...q, type: (q.type || 'INT').toUpperCase() }))),
        ...(ars.map(q => ({ ...q, type: (q.type || 'AR').toUpperCase() }))),
        ...(questions.mtf || []).map(q => ({ ...q, type: (q.type || 'MTF').toUpperCase() })),
        ...(questions.smcq || []).map(q => ({ ...q, type: 'SMCQ' })),
        ...(cmas.map(q => ({ ...q, type: 'CMA' }))),
        ...(mpcs.map(q => ({ ...q, type: 'MPC' })))
      ];

    const objectiveTotal = allObjective.reduce((sum, q) => {
      if (q.type?.toUpperCase() === 'SMCQ') {
        const subMarks = (q.subQuestions || []).reduce((s: number, sq: any) => s + (sq.marks || 1), 0);
        return sum + subMarks;
      }
      return sum + (q.marks || 1);
    }, 0);

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

    const parsedSubjectsConfig = React.useMemo(() => {
      let cfg: any = null;
      if (examInfo.subjectsConfig) {
        if (typeof examInfo.subjectsConfig === 'string') {
          try {
            cfg = JSON.parse(examInfo.subjectsConfig);
          } catch {
            cfg = null;
          }
        } else {
          cfg = { ...examInfo.subjectsConfig };
        }
      }
      if (cfg && (cfg.requiredOptionalCount === undefined || cfg.requiredOptionalCount === null) && (examInfo as any)?.requiredOptionalCount !== undefined) {
        cfg.requiredOptionalCount = (examInfo as any).requiredOptionalCount;
      }
      return cfg;
    }, [examInfo.subjectsConfig, (examInfo as any)?.requiredOptionalCount]);

    const isMS = Boolean(
      examInfo.subjectType ? examInfo.subjectType === 'MS' : (
        parsedSubjectsConfig && Array.isArray(parsedSubjectsConfig.subjects) && parsedSubjectsConfig.subjects.length > 0
      )
    );

    const configuredSubjects = React.useMemo(() => {
      if (!isMS) return [];
      const rawList: any[] = parsedSubjectsConfig?.subjects || [];
      let baseList: any[] = [];
      if (rawList.length > 0) {
        baseList = rawList.map((s: any) => ({
          name: s.name,
          isMandatory: s.isMandatory !== false && s.isOptional !== true,
          totalMarks: Number(s.totalMarks) || 0
        }));
      } else {
        const discovered: string[] = [];
        allObjective.forEach((q: any) => {
          const sub = q.subject || q.subjectName;
          if (sub && !discovered.some(d => matchSubject(sub, d))) {
            discovered.push(sub);
          }
        });
        baseList = discovered.map(name => ({
          name,
          isMandatory: true,
          totalMarks: 0
        }));
      }

      // Group: all compulsory (mandatory) first, followed by all optional
      const mandatories = baseList.filter(s => s.isMandatory);
      const optionals = baseList.filter(s => !s.isMandatory);
      const sorted = [...mandatories, ...optionals];

      return sorted.map((s, idx) => ({
        ...s,
        sectionLetter: String.fromCharCode(65 + idx),
        sectionBengali: ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'][idx] || String(idx + 1),
        divisionType: s.isMandatory ? ('compulsory' as const) : ('optional' as const)
      }));
    }, [isMS, parsedSubjectsConfig, allObjective]);

    const mandatoryMarks = React.useMemo(() => {
      return configuredSubjects
        .filter(s => s.isMandatory)
        .reduce((sum, s) => sum + s.totalMarks, 0);
    }, [configuredSubjects]);

    const optionalSubjectsList = React.useMemo(() => {
      return configuredSubjects.filter(s => !s.isMandatory);
    }, [configuredSubjects]);

    const singleOptionalMarks = React.useMemo(() => {
      return optionalSubjectsList.length > 0 ? optionalSubjectsList[0].totalMarks : 0;
    }, [optionalSubjectsList]);

    const orderedObjective = React.useMemo(() => {
      if (!isMS || configuredSubjects.length === 0) {
        return allObjective;
      }
      const result: any[] = [];
      const assigned = new Set<string>();

      // Group into subjects ensuring NO question is assigned twice
      configuredSubjects.forEach(sub => {
        // 1. Exact match first (highest precedence)
        const exactMatches = allObjective.filter((q: any) => {
          const qId = q.id || `${q.type}_${q.q || q.questionText}`;
          if (assigned.has(qId)) return false;
          const qSub = (q.subject || q.subjectName || '').trim().toLowerCase();
          return qSub === sub.name.trim().toLowerCase();
        });
        exactMatches.forEach((q: any) => {
          const qId = q.id || `${q.type}_${q.q || q.questionText}`;
          assigned.add(qId);
          result.push({
            ...q,
            _canonicalSubject: sub.name,
            _subConfig: sub
          });
        });

        // 2. Compound-safe alias match for remaining questions
        const aliasMatches = allObjective.filter((q: any) => {
          const qId = q.id || `${q.type}_${q.q || q.questionText}`;
          if (assigned.has(qId)) return false;
          return matchSubject(q.subject || q.subjectName, sub.name);
        });
        aliasMatches.forEach((q: any) => {
          const qId = q.id || `${q.type}_${q.q || q.questionText}`;
          assigned.add(qId);
          result.push({
            ...q,
            _canonicalSubject: sub.name,
            _subConfig: sub
          });
        });
      });

      // Remaining unassigned questions
      allObjective.filter((q: any) => !assigned.has(q.id || `${q.type}_${q.q || q.questionText}`)).forEach((q: any) => {
        result.push({
          ...q,
          _canonicalSubject: q.subject || (isEn ? 'General' : 'সাধারণ'),
          _subConfig: {
            name: q.subject || (isEn ? 'General' : 'সাধারণ'),
            isMandatory: true,
            totalMarks: 0
          }
        });
      });

      return result;
    }, [isMS, configuredSubjects, allObjective, isEn]);

    const subjectQuestionRanges = React.useMemo(() => {
      if (!isMS) return new Map<string, string>();
      const counts = new Map<string, number>();

      orderedObjective.forEach((q: any) => {
        const qSub = q._canonicalSubject || '';
        const qCount = q.type?.toUpperCase() === 'SMCQ' ? (q.subQuestions?.length || 1) : 1;
        counts.set(qSub, (counts.get(qSub) || 0) + qCount);
      });

      const ranges = new Map<string, string>();
      counts.forEach((total, subName) => {
        ranges.set(
          subName,
          isEn
            ? `Questions: 1 - ${total} (Total: ${total})`
            : `প্রশ্ন: ১ - ${toBengaliNumerals(total)} (মোট ${toBengaliNumerals(total)}টি প্রশ্ন)`
        );
      });

      return ranges;
    }, [isMS, orderedObjective, isEn]);

    return (
      <div
        ref={ref}
        className="question-paper-container bg-white relative overflow-hidden"
        style={{
          fontFamily: isEn ? "'Bookman Old Style', 'Georgia', serif" : "'ExamFont', 'Noto Serif Bengali', Georgia, serif",
          fontSize: fontSize ? `${fontSize}%` : '100%'
        }}
      >
        {!hideInstitute && examInfo.schoolName && <div className="watermark print-only">{examInfo.schoolName}</div>}

        <div style={{ fontSize: fontSize ? `${fontSize}%` : '100%' }}>
          {!hideHeader ? (
            <Header
              examInfo={examInfo}
              type="objective"
              qrData={qrData}
              marks={isMS ? (Number(examInfo.totalMarks) || (mandatoryMarks + ((parsedSubjectsConfig?.requiredOptionalCount || 1) * singleOptionalMarks)) || 100) : (forcePageBreak ? objectiveTotal : grandTotalMarks)}
              time={forcePageBreak ? (examInfo.objectiveTime || 0) : totalTimeMinutes}
              banglaWord={examInfo.set ? pickBanglaWord((examInfo.id || '') + examInfo.set, 0, lang) : undefined}
              showDate={showDate}
              lang={lang}
              hideInstitute={hideInstitute}
            />
          ) : (
            pageNumberLabel ? (
              <div className="flex justify-between items-center text-xs font-bold border-b border-black pb-1 mb-2 text-gray-700">
                <span>{!hideInstitute ? (examInfo.schoolName || '') : ''}</span>
                <span>{examInfo.title} {examInfo.set ? `(${isEn ? 'Set' : 'সেট'}: ${examInfo.set})` : ''}</span>
                <span className="border border-black px-1.5 py-0.5 rounded text-[10px] bg-gray-50">{pageNumberLabel}</span>
              </div>
            ) : null
          )}

          {/* Special Instruction Box */}
          {!hideHeader && (
            <div className="instruction-box">
            {isMS && (parsedSubjectsConfig || configuredSubjects.length > 0) ? (
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center justify-between border-b border-black/20 pb-0.5 flex-wrap gap-1">
                  <span className="font-black text-xs uppercase tracking-wide">
                    {isEn ? 'EXAMINATION GUIDELINES' : 'পরীক্ষার নির্দেশাবলী'}
                  </span>
                  <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.2 rounded-xs">
                    {isEn ? `Subjects: ${configuredSubjects.length}` : `মোট বিষয়: ${toBengaliNumerals(configuredSubjects.length)}টি`}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] pt-0.5 leading-snug">
                  <div>
                    <strong>{isEn ? '1. Mandatory:' : '১. আবশ্যক বিষয়:'}</strong>{' '}
                    {(parsedSubjectsConfig?.mandatoryCount || 0) > 0
                      ? (isEn
                        ? `All ${parsedSubjectsConfig.mandatoryCount} mandatory subject(s) must be answered.`
                        : `সকল ${toBengaliNumerals(parsedSubjectsConfig.mandatoryCount)}টি আবশ্যক বিষয়ের উত্তর দিতে হবে।`)
                      : (isEn ? 'All subjects must be answered.' : 'সকল নির্ধারিত বিষয়ের উত্তর দিতে হবে।')}
                  </div>
                  <div>
                    <strong>{isEn ? '2. Optional:' : '২. ঐচ্ছিক বিষয়:'}</strong>{' '}
                    {(parsedSubjectsConfig?.optionalCount || 0) > 0
                      ? (isEn
                        ? `Answer any ${parsedSubjectsConfig.requiredOptionalCount || 1} out of ${parsedSubjectsConfig.optionalCount} optional subject(s).`
                        : `মোট ${toBengaliNumerals(parsedSubjectsConfig.optionalCount)}টি ঐচ্ছিকের মধ্যে যেকোনো ${toBengaliNumerals(parsedSubjectsConfig.requiredOptionalCount || 1)}টি বিষয়ের উত্তর করতে হবে।`)
                      : (isEn ? 'No optional subjects.' : 'কোনো ঐচ্ছিক বিষয় নেই।')}
                  </div>
                  {Number(examInfo.mcqNegativeMarking) > 0 && (
                    <div className="sm:col-span-2 font-bold text-black text-[10.5px]">
                      <strong>{isEn ? '3. Negative Marking:' : '৩. ভুল উত্তরের কর্তন:'}</strong>{' '}
                      {isEn
                        ? `Negative marking of ${examInfo.mcqNegativeMarking}% will be deducted for each incorrect answer.`
                        : `প্রতিটি ভুল উত্তরের জন্য প্রাপ্ত নম্বর হতে ${toBengaliNumerals(examInfo.mcqNegativeMarking)}% নম্বর কাটা যাবে।`}
                    </div>
                  )}
                </div>
              </div>
            ) : hideOMR ? (
              <p className="text-[11px] leading-snug m-0">
                <strong>{isEn ? 'Instructions:' : 'বিশেষ দ্রষ্টব্য:'}</strong>{' '}
                {isEn
                  ? 'Answer the following questions carefully. Figures in the right margin indicate marks.'
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
              <p className="text-[11px] leading-snug m-0">
                <strong>{isEn ? 'Instructions:' : 'বিশেষ দ্রষ্টব্য:'}</strong>{' '}
                {isEn
                  ? 'Fill in the corresponding circles on the provided MCQ answer sheet with a black ballpoint pen. Figures in right margin indicate full marks.'
                  : 'উত্তরপত্রে প্রশ্নের ক্রমিক নম্বরের বিপরীতে প্রদত্ত বৃত্তসমূহ সঠিক বল পয়েন্ট কলম দ্বারা সম্পূর্ণ ভরাট করো। ডান পাশের সংখ্যা পূর্ণমান নির্দেশ করে।'}
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
          )}
        </div>

        {/* Main Content */}
        <main>
          {/* MCQ Section */}
          {allObjective.length > 0 && (
            <div style={{ fontSize: fontSize ? `${fontSize}%` : '100%' }}>

              <div className="mcq-container">
                {(() => {
                  let globalCounter = startQuestionIndex || 1;
                  let subjectCounter = startQuestionIndex || 1;
                  let lastSubject = '';

                  return orderedObjective.map((q: any, idx) => {
                    const isNewSubject = isMS && (idx === 0 || q._canonicalSubject !== lastSubject);
                    if (isNewSubject) {
                      lastSubject = q._canonicalSubject;
                      // Respect startQuestionIndex when continuing a subject across pages
                      subjectCounter = (idx === 0 && startQuestionIndex) ? startQuestionIndex : 1;
                    }

                    const startNum = isMS ? subjectCounter : globalCounter;
                    const qCount = q.type?.toUpperCase() === 'SMCQ' ? (q.subQuestions?.length || 0) : 1;
                    subjectCounter += qCount;
                    globalCounter += qCount;

                    const qNum = isEn ? String(startNum) : toBengaliNumerals(startNum);

                    const matchedSub = q._subConfig || configuredSubjects.find((s: any) => matchSubject(q.subject, s.name));
                    const prevSub = idx > 0 ? orderedObjective[idx - 1]?._subConfig : null;
                    const showDivisionA = isMS && !hideHeader && idx === 0 && matchedSub?.isMandatory;
                    const showDivisionB = isMS && matchedSub && !matchedSub.isMandatory && (idx === 0 ? (!hideHeader && (matchedSub.sectionLetter === 'A' || !prevSub)) : prevSub?.isMandatory);
                    const showSubjectHeader = isMS && isNewSubject;

                    const renderQuestionContent = () => {

                    if (q.type?.toUpperCase() === 'MCQ' || q.type?.toUpperCase() === 'MC') {
                      // Column count based on max single option length (Bengali chars ~2x wider)
                      // 4-col: all options very short (≤4 chars) - single syllable words
                      // 2-col: options up to 15 chars - most standard MCQ options
                      // 1-col: options longer than 15 chars - phrases/sentences
                      // Dynamic grid layout: 1 line (4-col), 2 lines (2-col), or 4 lines (1-col)
                      const gridClass = getOptionsGridClass(q.options || [], fontSize);

                      return (
                        <div key={idx} className="mb-1.5 sm:mb-2 text-left question-block break-inside-avoid">
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
                        <div key={idx} className="mb-1.5 sm:mb-2 text-left question-block break-inside-avoid">
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
                        <div key={idx} className="mb-2 text-left question-block break-inside-avoid">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 space-y-1">
                              <span className="font-bold">{qNum}. </span>
                              <strong>{isEn ? 'Assertion:' : 'নিশ্চয়তা (Assertion):'}</strong> <UniversalMathJax inline>{q.assertion}</UniversalMathJax>
                              <br />
                              <span className="ml-6"><strong>{isEn ? 'Reason:' : 'কারণ (Reason):'}</strong> <UniversalMathJax inline>{q.reason}</UniversalMathJax></span>
                            </div>
                            <span className="ml-4 font-bold">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                          </div>
                          <div className="ml-6 grid grid-cols-2 gap-x-6 gap-y-2">
                            {((q.options && q.options.length >= 2)
                              ? q.options.map((opt: any, oidx: number) => ({
                                  label: isEn ? MCQ_LABELS_EN[oidx] : MCQ_LABELS_BN[oidx],
                                  text: typeof opt === 'string' ? opt : opt.text || ''
                                }))
                              : [
                                  { label: isEn ? 'a' : 'ক', text: isEn ? 'Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.' : 'Assertion ও Reason উভয়ই সত্য এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা।' },
                                  { label: isEn ? 'b' : 'খ', text: isEn ? 'Both Assertion and Reason are true, but Reason is not the correct explanation of Assertion.' : 'Assertion ও Reason উভয়ই সত্য কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়।' },
                                  { label: isEn ? 'c' : 'গ', text: isEn ? 'Assertion is true but Reason is false.' : 'Assertion সত্য কিন্তু Reason মিথ্যা।' },
                                  { label: isEn ? 'd' : 'ঘ', text: isEn ? 'Assertion is false but Reason is true.' : 'Assertion মিথ্যা কিন্তু Reason সত্য।' },
                                  { label: isEn ? 'e' : 'ঙ', text: isEn ? 'Both Assertion and Reason are false.' : 'Assertion ও Reason উভয়ই মিথ্যা।' }
                                ]
                            ).map((opt: any, oidx: number) => (
                              <div key={oidx} className="option-item flex items-start gap-1">
                                <span className={`mcq-option-label flex-shrink-0 ${isEn && !hideOMR ? 'nazrul-omr-font' : ''}`}>{opt.label}</span>
                                <span className="flex-1 text-[11px] leading-tight"><Text>{opt.text}</Text></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (q.type?.toUpperCase() === 'MTF') {
                      const mtfQuestionTitle = q.questionText || q.text || q.question || q.q || (isEn ? 'Match the left column with the right column:' : 'বাম স্তম্ভের সাথে ডান স্তম্ভ মিল কর:');
                      return (
                        <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                          <div className="flex justify-between items-end mb-1 border-b border-black/10 pb-0.5">
                            <span className="font-bold text-sm">
                              {qNum}. <UniversalMathJax inline dynamic>{cleanupMath(mtfQuestionTitle)}</UniversalMathJax>
                            </span>
                            <span className="ml-4 font-bold text-xs">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 border border-black p-2 ml-6">
                            <div className="border-r border-black pr-2">
                              <p className="font-bold text-center border-b border-black mb-1">{isEn ? 'Column A' : 'স্তম্ভ ক'}</p>
                              {(q.leftColumn || []).map((item: any, i: number) => {
                                const itemText = typeof item === 'string' ? item : (item?.text || item?.content || item?.value || '');
                                return (
                                  <div key={i} className="flex gap-1 items-start my-1">
                                    <span className="font-bold shrink-0">{toBengaliNumerals(i + 1)}.</span>
                                    <div className="flex-1">
                                      <UniversalMathJax inline dynamic>{cleanupMath(itemText)}</UniversalMathJax>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div>
                              <p className="font-bold text-center border-b border-black mb-1">{isEn ? 'Column B' : 'স্তম্ভ খ'}</p>
                              {(q.rightColumn || []).map((item: any, i: number) => {
                                const itemText = typeof item === 'string' ? item : (item?.text || item?.content || item?.value || '');
                                return (
                                  <div key={i} className="flex gap-1 items-start my-1">
                                    <span className="font-bold shrink-0">{String.fromCharCode(65 + i)}.</span>
                                    <div className="flex-1">
                                      <UniversalMathJax inline dynamic>{cleanupMath(itemText)}</UniversalMathJax>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (q.type?.toUpperCase() === 'SMCQ') {
                      const endNum = (isMS ? subjectCounter : globalCounter) - 1;
                      const rangeStr = startNum === endNum ? qNum : (isEn ? `${startNum}-${endNum}` : `${toBengaliNumerals(startNum)}-${toBengaliNumerals(endNum)}`);
                      return (
                        <div key={idx} className="mb-2 question-block break-inside-avoid">
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

                              const gridClass = getOptionsGridClass(sub.options || [], fontSize);

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

                    if (q.type?.toUpperCase() === 'CMA') {
                      const parts = q.parts || q.cmaParts || q.subQuestions || [];
                      return (
                        <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                          <div className="flex justify-between items-end mb-2 border-b border-black/10 pb-0.5">
                            <span className="font-bold text-sm">{qNum}. <UniversalMathJax inline dynamic>{cleanupMath(q.questionText || q.text || '')}</UniversalMathJax></span>
                            <span className="ml-4 font-bold text-xs">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 border border-black/30 p-3 rounded ml-4 bg-gray-50/50">
                            {parts.map((part: any, pIdx: number) => (
                              <div key={pIdx} className="flex items-center gap-2 border-b border-dashed border-gray-300 pb-1">
                                <span className="font-semibold text-xs"><UniversalMathJax inline dynamic>{cleanupMath(part.label || part.prompt || part.text || `Part ${pIdx+1}`)}</UniversalMathJax>:</span>
                                <span className="inline-block min-w-[120px] border border-black/40 bg-white h-6 rounded px-2 text-xs"></span>
                                {part.unit && <span className="text-[10px] text-gray-500">({part.unit})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (q.type?.toUpperCase() === 'MPC') {
                      const stages = q.stages || q.mpcStages || q.subQuestions || [];
                      return (
                        <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                          <div className="flex justify-between items-end mb-2 border-b border-black/10 pb-0.5">
                            <span className="font-bold text-sm">{qNum}. <UniversalMathJax inline dynamic>{cleanupMath(q.questionText || q.text || (isEn ? 'Multi-Step Problem Chain' : 'বহু-ধাপী সমস্যা শৃঙ্খল'))}</UniversalMathJax></span>
                            <span className="ml-4 font-bold text-xs">[{isEn ? (q.marks || 1) : toBengaliNumerals(q.marks || 1)}]</span>
                          </div>
                          {q.scenario && q.scenario !== q.questionText && (
                            <div className="p-2 border-l-2 border-black bg-gray-50 italic text-xs mb-3 ml-4">
                              <UniversalMathJax inline dynamic>{cleanupMath(q.scenario)}</UniversalMathJax>
                            </div>
                          )}
                          <div className="space-y-3 ml-4">
                            {stages.map((stage: any, sIdx: number) => (
                              <div key={sIdx} className="p-2 border border-black/30 rounded text-xs flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-indigo-700 mr-2">Stage {sIdx+1}:</span>
                                  <span><UniversalMathJax inline dynamic>{cleanupMath(stage.stageTitle || stage.prompt || stage.text || stage.question || '')}</UniversalMathJax></span>
                                </div>
                                <div className="border border-black/40 bg-white min-w-[140px] h-6 rounded px-2 flex items-center text-[10px] text-gray-400">
                                  {isEn ? 'Answer space...' : 'উত্তর লিখুন...'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  };

                    return (
                      <React.Fragment key={idx}>
                        {showDivisionA && (
                          <div className="ms-division-banner my-1 py-1 px-2.5 bg-black text-white font-black text-xs uppercase tracking-wider flex items-center justify-between rounded-xs shadow-xs break-inside-avoid">
                            <span>{isEn ? 'PART - A: COMPULSORY SUBJECTS (MANDATORY)' : 'ক-বিভাগ: আবশ্যিক বিষয়সমূহ (সকল বিষয়ের উত্তর প্রদান বাধ্যতামূলক)'}</span>
                            <span className="text-[10px] bg-white text-black px-1.5 py-0.2 font-bold rounded-xs">
                              {isEn ? `Full Marks: ${mandatoryMarks}` : `পূর্ণমান: ${toBengaliNumerals(mandatoryMarks)}`}
                            </span>
                          </div>
                        )}
                        {showDivisionB && (
                          <div className="ms-division-banner my-1.5 py-1 px-2.5 bg-neutral-900 text-white font-black text-xs uppercase tracking-wider flex items-center justify-between rounded-xs border border-black shadow-xs break-inside-avoid">
                            <span>
                              {isEn 
                                ? `PART - B: OPTIONAL SUBJECTS (Answer any ${parsedSubjectsConfig?.requiredOptionalCount || 1} out of ${parsedSubjectsConfig?.optionalCount || optionalSubjectsList.length || 1})` 
                                : `খ-বিভাগ: ঐচ্ছিক বিষয়সমূহ (মোট ${toBengaliNumerals(parsedSubjectsConfig?.optionalCount || optionalSubjectsList.length || 1)}টি বিষয়ের মধ্যে যেকোনো ${toBengaliNumerals(parsedSubjectsConfig?.requiredOptionalCount || 1)}টি বিষয়ের উত্তর দাও)`}
                            </span>
                            <span className="text-[10px] bg-white text-black px-1.5 py-0.2 font-bold rounded-xs">
                              {isEn ? `Marks: ${singleOptionalMarks}` : `পূর্ণমান: ${toBengaliNumerals(singleOptionalMarks)}`}
                            </span>
                          </div>
                        )}
                        {showSubjectHeader && matchedSub && (
                          <MSSubjectHeader
                            subject={matchedSub}
                            isEn={isEn}
                            isContinued={idx === 0 && Boolean(startQuestionIndex && startQuestionIndex > 1)}
                            questionRangeText={(() => {
                              if (idx === 0 && startQuestionIndex && startQuestionIndex > 1) {
                                const subQsThisPage = orderedObjective.filter((qObj: any) => (qObj._canonicalSubject || qObj.subject) === q._canonicalSubject).length;
                                const endQNum = startQuestionIndex + subQsThisPage - 1;
                                return isEn
                                  ? `Questions: ${startQuestionIndex} - ${endQNum} (Cont.)`
                                  : `প্রশ্ন: ${toBengaliNumerals(startQuestionIndex)} - ${toBengaliNumerals(endQNum)} (চলমান)`;
                              }
                              return subjectQuestionRanges.get(q._canonicalSubject);
                            })()}
                            optionalInstruction={
                              !matchedSub.isMandatory && parsedSubjectsConfig?.requiredOptionalCount
                                ? (isEn
                                  ? `Answer any ${parsedSubjectsConfig.requiredOptionalCount} optional subject(s) out of ${parsedSubjectsConfig.optionalCount || optionalSubjectsList.length || 1}. Do not answer more than permitted.`
                                  : `মোট ${toBengaliNumerals(parsedSubjectsConfig.optionalCount || optionalSubjectsList.length || 1)}টি ঐচ্ছিক বিষয়ের মধ্যে যেকোনো ${toBengaliNumerals(parsedSubjectsConfig.requiredOptionalCount || 1)}টি বিষয়ের উত্তর করতে হবে। অনুমোদিত সংখ্যার চেয়ে বেশি বিষয়ের উত্তর গ্রহণযোগ্য নয়।`)
                                : undefined
                            }
                          />
                        )}
                        {renderQuestionContent()}
                      </React.Fragment>
                    );
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
                  hideInstitute={hideInstitute}
                />
              )}
              {cqs.length > 0 && (
                <>
                  <div
                    className="flex justify-between items-center font-bold mb-1.5 border-b border-dotted border-black pb-0.5 mt-2 cq-section section-break"
                  >
                    <div className="flex flex-col">
                      <h3>{isEn ? 'Creative Questions (CQ)' : 'সৃজনশীল প্রশ্ন (CQ)'}</h3>
                    </div>
                    <div className="text-right">
                      {Number(cqRequiredMarks) > 0 && (
                        <div>{isEn ? 'Max Marks' : 'সর্বোচ্চ নম্বর'}: {isEn ? cqRequiredMarks : toBengaliNumerals(cqRequiredMarks)}</div>
                      )}
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
                      {cqs.map((q, idx) => {
                        const showCqSubjectHeader = isMS && q.subject && (idx === 0 || cqs[idx - 1]?.subject !== q.subject);
                        const matchedCqSub = q.subject ? (configuredSubjects.find((s: any) => matchSubject(q.subject, s.name)) || { name: q.subject, isMandatory: true, totalMarks: 0 }) : null;
                        return (
                          <React.Fragment key={idx}>
                            {showCqSubjectHeader && matchedCqSub && (
                              <MSSubjectHeader
                                subject={matchedCqSub}
                                isEn={isEn}
                              />
                            )}
                            <div className="mb-3 text-left cq-question">
                              <div className="flex items-start">
                                <span className="font-bold mr-2">{isEn ? ((startCqIndex || 1) + idx) : toBengaliNumerals((startCqIndex || 1) + idx)}.</span>
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
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* SQ Section */}
              {sqs.length > 0 && (
                <>
                  <div className="flex justify-between items-center font-bold mb-1.5 border-b border-dotted border-black pb-0.5 mt-2 sq-section section-break">
                    <h3>{isEn ? 'Short Questions (SQ)' : 'সংক্ষিপ্ত প্রশ্ন (SQ)'}</h3>
                    <div className="text-right">
                      {Number(sqRequiredMarks) > 0 && (
                        <div>{isEn ? 'Max Marks' : 'সর্বোচ্চ নম্বর'}: {isEn ? sqRequiredMarks : toBengaliNumerals(sqRequiredMarks)}</div>
                      )}
                      {sqRequired > 0 && (
                        <div className="">(মোট {toBengaliNumerals(sqRequired)} টি উত্তর করতে হবে)</div>
                      )}
                    </div>
                  </div>
                  <div>
                    {sqs.map((q, idx) => {
                      const showSqSubjectHeader = isMS && q.subject && (idx === 0 || sqs[idx - 1]?.subject !== q.subject);
                      const matchedSqSub = q.subject ? (configuredSubjects.find((s: any) => matchSubject(q.subject, s.name)) || { name: q.subject, isMandatory: true, totalMarks: 0 }) : null;
                      return (
                        <React.Fragment key={idx}>
                          {showSqSubjectHeader && matchedSqSub && (
                            <MSSubjectHeader
                              subject={matchedSqSub}
                              isEn={isEn}
                            />
                          )}
                          <div className="mb-3 text-left sq-question">
                            <div className="flex items-start">
                              <span className="font-bold mr-2">{isEn ? ((startSqIndex || 1) + idx) : toBengaliNumerals((startSqIndex || 1) + idx)}.</span>
                              <div className="flex-1">
                                <Text>{`${q.questionText} [${isEn ? (q.marks || '?') : toBengaliNumerals(q.marks || '?')}]`}</Text>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </>
              )}

              {/* DESCRIPTIVE Section */}
              {descriptives.length > 0 && (
                <>
                  <div className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 mt-6 desc-section section-break">
                    <h3>{isEn ? 'Descriptive & Grammar Questions' : 'রচনামূলক ও ব্যাকরণ প্রশ্ন (Descriptive & Grammar)'}</h3>
                    <div className="text-right">
                      {Number(descMarks) > 0 && (
                        <div>{isEn ? 'Total Marks' : 'মোট নম্বর'}: {isEn ? descMarks : toBengaliNumerals(descMarks)}</div>
                      )}
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
                              <div className="whitespace-pre-wrap mb-3 font-bold text-gray-900 border-l-[3px] border-black pl-3 py-1">
                                <UniversalMathJax dynamic>{(q.questionText || "").replace(/\|\|/g, '\n')}</UniversalMathJax>
                              </div>
                              {/* Render each sub-part of the descriptive question */}
                              <div className="space-y-4">
                                {((q as any).subQuestions || (q as any).sub_questions || (q as any).parts || []).map((part: any, pIdx: number) => (
                                  <div key={pIdx} className="border border-black/10 rounded-md p-3 bg-gray-50/10 break-inside-avoid shadow-sm">
                                    {part.label && <div className="font-bold text-sm mb-1 underline text-gray-700">{part.label}:</div>}
                                    
                                    {/* Instructions Rendering */}
                                    {(part.instructions || part.instruction)?.trim() && (
                                      <div className="p-3 border-l-2 border-slate-900 bg-slate-100/50 mb-4 text-[10px] leading-relaxed italic text-slate-700 rounded-r shadow-sm">
                                        <span className="font-black uppercase not-italic mr-2 text-slate-900 pr-2 border-r border-slate-300">Instructions:</span>
                                        <UniversalMathJax dynamic>{part.instructions || part.instruction}</UniversalMathJax>
                                      </div>
                                    )}
                                    {(part.text || part.questionText) && (
                                      <div className="font-medium mb-2 leading-relaxed whitespace-pre-wrap">
                                        <UniversalMathJax dynamic>{(part.text || part.questionText || "").replace(/\|\|/g, '\n')}</UniversalMathJax>
                                      </div>
                                    )}

                                    <div className="text-sm">
                                      {part.subType === 'writing' && (
                                        <div className="space-y-2">
                                          {part.sourceText && (
                                            <div className="p-3 bg-gray-50/50 border border-gray-200 rounded-lg italic text-xs mb-3 whitespace-pre-wrap leading-relaxed shadow-sm">
                                              <UniversalMathJax dynamic>{part.sourceText.replace(/\|\|/g, '\n')}</UniversalMathJax>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500/80 italic mb-2">
                                            <div className="h-[1px] flex-1 bg-gray-200"></div>
                                            <span>
                                              {isEn ? 'Write your response below' : 'নিচে তোমার উত্তর লেখো'}
                                            </span>
                                            <div className="h-[1px] flex-1 bg-gray-200"></div>
                                          </div>
                                        </div>
                                      )}

                                      {part.subType === 'fill_in' && (
                                        <div className="space-y-3 mt-3">
                                          {/* Word Box for fill_in questions - improved detection and styling */}
                                          {(() => {
                                            const wordsData = part.wordBox || part.words || part.options || part.wordList;
                                            if (!wordsData) return null;
                                            
                                            const words = Array.isArray(wordsData) 
                                              ? wordsData.map(w => typeof w === 'object' ? (w.text || w.word || '') : w)
                                              : (typeof wordsData === 'string' ? wordsData.split(/[|]|,\s*/) : []);
                                            
                                            if (words.length === 0) return null;

                                            return (
                                              <div className="mb-6 p-5 border-2 border-black rounded-lg bg-white relative print:bg-transparent shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-4 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                                                  {isEn ? 'Vocabulary Box' : 'শব্দসমূহ'}
                                                </div>
                                                <div className="text-[10px] font-semibold mb-4 text-center text-slate-600 italic">
                                                  {isEn ? 'Complete the following text using suitable words from the box below' : 'নিচের বক্স থেকে সঠিক শব্দ নিয়ে শূন্যস্থান পূরণ করো'}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-2">
                                                  {words.filter(Boolean).map((word: string, wIdx: number) => (
                                                    <div key={wIdx} className="px-4 py-1.5 border border-slate-400 rounded-md font-bold text-sm bg-white min-w-[70px] text-center hover:bg-slate-50 transition-colors">
                                                      <UniversalMathJax inline>{word}</UniversalMathJax>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          
                                          {(part.fillType === 'gap_passage' || !part.fillType) && part.passage && (
                                            <div className="leading-relaxed whitespace-pre-wrap">
                                              <UniversalMathJax dynamic>
                                                {part.passage.replace(/\|\|/g, '\n').split('___').map((segment: string, sIdx: number, array: any[]) => (
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

                                      {part.subType === 'short_answer' && (
                                        <div className="space-y-4 mt-2">
                                          {(part.questions || []).map((quest: string, qi: number) => (
                                            <div key={qi} className="flex gap-2">
                                              <span className="font-bold min-w-[20px]">{isEn ? String.fromCharCode(97 + qi) : (BENGALI_SUB_LABELS[qi] || String.fromCharCode(0x0995 + qi))})</span>
                                              <div className="flex-1">
                                                <UniversalMathJax dynamic>{quest}</UniversalMathJax>
                                                <div className="border-b border-dotted border-gray-400 w-full mt-6 h-1"></div>
                                                <div className="border-b border-dotted border-gray-400 w-full mt-2 h-1"></div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {part.subType === 'error_correction' && (
                                        <div className="space-y-2 mt-2">
                                          {(part.sentences || []).map((s: string, si: number) => (
                                            <div key={si} className="flex gap-2">
                                              <span className="font-bold min-w-[20px]">{isEn ? String.fromCharCode(97 + si) : BENGALI_SUB_LABELS[si]})</span>
                                              <div className="flex-1">
                                                <UniversalMathJax dynamic>{s}</UniversalMathJax>
                                                <div className="border-b border-dotted border-gray-400 w-full mt-4 h-1"></div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {part.subType === 'comprehension' && (
                                        <div className="space-y-3">
                                          {(part.passage || part.stemPassage) && (
                                            <div className="p-5 bg-white border-2 border-slate-200 border-l-[6px] border-l-slate-800 rounded-r-xl mb-6 text-[13px] leading-relaxed whitespace-pre-wrap shadow-[2px_2px_10px_rgba(0,0,0,0.02)]">
                                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-[-5px]">Stem Passage Content</div>
                                              <UniversalMathJax dynamic>{(part.passage || part.stemPassage || "").replace(/\|\|/g, '\n')}</UniversalMathJax>
                                            </div>
                                          )}
                                          {(part.stemImage || part.imageUrl) && <img src={part.stemImage || part.imageUrl} alt="Stem" className="max-h-64 mx-auto mb-4 rounded border shadow-sm" />}

                                          {(!part.answerType || part.answerType === 'qa') && (
                                            <div className="grid grid-cols-1 gap-2 ml-4">
                                              {(part.questions || []).map((quest: any, qIdx: number) => (
                                                <div key={qIdx} className="flex flex-col gap-1">
                                                   <div className="flex items-start gap-2">
                                                      <span className="font-bold">{isEn ? String.fromCharCode(97 + qIdx) : BENGALI_SUB_LABELS[qIdx]}.</span>
                                                      <UniversalMathJax dynamic>{typeof quest === 'string' ? quest.replace(/\|\|/g, '\n') : (quest.text || "").replace(/\|\|/g, '\n')}</UniversalMathJax>
                                                   </div>
                                                   <div className="border-b border-dotted border-gray-400 w-full mt-4 h-1 ml-6"></div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                       {part.subType === 'comprehension_mcq' && (
                                         <div className="space-y-4">
                                           {(part.stemPassage || part.passage) && (
                                             <div className="p-5 bg-white border-2 border-slate-200 border-l-[6px] border-l-slate-800 rounded-r-xl mb-6 text-[13px] leading-relaxed whitespace-pre-wrap shadow-[2px_2px_10px_rgba(0,0,0,0.02)]">
                                               <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-[-5px]">Stem Passage Content</div>
                                               <UniversalMathJax dynamic>{(part.stemPassage || part.passage || "").replace(/\|\|/g, '\n')}</UniversalMathJax>
                                             </div>
                                           )}
                                           {(part.stemImage || part.imageUrl) && <img src={part.stemImage || part.imageUrl} alt="Stem" className="max-h-64 mx-auto mb-4 rounded border shadow-sm" />}

                                           <div className="grid grid-cols-2 gap-x-4 gap-y-6 ml-4">
                                             {(part.subQuestions || part.questions || []).map((sq: any, sqi: number) => (
                                               <div key={sqi} className="flex flex-col gap-2">
                                                 <div className="flex items-start gap-2">
                                                   <span className="font-bold underline">({isEn ? (sqi + 1) : toBengaliNumerals(sqi + 1)})</span>
                                                   <div className="font-semibold text-sm">
                                                     <UniversalMathJax dynamic>{sq.questionText || sq.text || sq.question}</UniversalMathJax>
                                                   </div>
                                                 </div>
                                                 <div className="grid grid-cols-2 gap-x-2 gap-y-1 ml-6">
                                                   {(sq.options || []).map((opt: any, oidx: number) => (
                                                     <div key={oidx} className="flex items-center gap-2 text-xs py-1 px-2 border border-slate-100 rounded bg-slate-50/30">
                                                       <span className="font-black text-slate-900 border-r border-slate-300 pr-1.5 mr-0.5 min-w-[24px]">
                                                         {isEn ? MCQ_LABELS_EN[oidx] : MCQ_LABELS_BN[oidx]}
                                                       </span>
                                                       <UniversalMathJax inline>{typeof opt === 'string' ? opt : opt.text}</UniversalMathJax>
                                                     </div>
                                                   ))}
                                                 </div>
                                               </div>
                                             ))}
                                           </div>
                                         </div>
                                       )}

                                      {part.subType === 'true_false' && (
                                        <div className="space-y-2 mt-2 ml-4">
                                          {(part.statements || []).map((stmt: string, sIdx: number) => (
                                            <div key={sIdx} className="flex gap-2 items-start text-sm">
                                              <span className="font-bold shrink-0">{isEn ? (sIdx + 1) : toBengaliNumerals(sIdx + 1)}.</span>
                                              <div className="flex-1 whitespace-pre-wrap leading-relaxed"><UniversalMathJax dynamic>{stmt}</UniversalMathJax></div>
                                              <span className="w-16 h-6 border border-gray-400 shrink-0 inline-block bg-white ml-2"></span>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {part.subType === 'flowchart' && (
                                        <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap">
                                          {(part.items || []).map((item: string, iIdx: number) => (
                                            <div key={iIdx} className="flex items-center gap-3">
                                              <div className="w-40 h-24 border-2 border-slate-400 rounded flex items-center justify-center p-2 text-center shadow-sm relative text-xs whitespace-pre-wrap bg-white">
                                                {iIdx === 0 ? (
                                                  <UniversalMathJax dynamic>{item}</UniversalMathJax>
                                                ) : (
                                                  <div className="h-full w-full"></div> // Empty box for student
                                                )}
                                                <div className="absolute top-1 left-2 text-[8px] font-bold text-slate-500">{iIdx + 1}</div>
                                              </div>
                                              {iIdx < (part.items?.length || 0) - 1 && (
                                                <span className="text-slate-400 font-bold hidden md:inline-block">→</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {part.subType === 'label_diagram' && (
                                        <div className="mt-4 flex flex-col items-center">
                                          {part.imageUrl && (
                                            <div className="relative border rounded inline-block max-w-[80%] bg-white p-2 shadow-sm mb-4">
                                              <img src={part.imageUrl} alt="Diagram" className="max-h-64 object-contain" />
                                              {(part.labels || []).map((lbl: any, lIdx: number) => (
                                                <div key={lIdx} className="absolute w-4 h-4 bg-red-600 text-white flex items-center justify-center rounded-full text-[8px] font-bold shadow-sm" style={{ top: `${lbl.y}%`, left: `${lbl.x}%`, transform: 'translate(-50%, -50%)' }}>
                                                  {lIdx + 1}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 w-full px-4">
                                            {(part.labels || []).map((_: any, lIdx: number) => (
                                              <div key={lIdx} className="flex gap-2 items-end">
                                                <span className="font-bold text-sm shrink-0">{lIdx + 1}.</span>
                                                <div className="border-b border-black flex-1 h-5"></div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {(part.subType === 'matching' || part.subType === 'mtf') && (
                                        <div className="mt-3 ml-4">
                                          {(part.questionText || part.text) && (
                                            <div className="mb-2 font-medium">
                                              <UniversalMathJax dynamic>{part.questionText || part.text}</UniversalMathJax>
                                            </div>
                                          )}
                                          <div 
                                            className="grid gap-0 border-2 border-slate-800 max-w-4xl mx-auto rounded overflow-hidden"
                                            style={{ gridTemplateColumns: `repeat(${[part.leftColumn, part.rightColumn, part.columnC, part.columnD].filter(c => Array.isArray(c) && c.length > 0).length}, 1fr)` }}
                                          >
                                            {/* Headers */}
                                            <div className="border-r border-b border-slate-800 p-2 bg-slate-100 font-bold text-center text-[10px] uppercase tracking-wider">Column A</div>
                                            <div className="border-r border-b border-slate-800 p-2 bg-slate-100 font-bold text-center text-[10px] uppercase last:border-r-0 tracking-wider">Column B</div>
                                            {Array.isArray(part.columnC) && part.columnC.length > 0 && <div className="border-r border-b border-slate-800 p-2 bg-slate-100 font-bold text-center text-[10px] uppercase last:border-r-0 tracking-wider">Column C</div>}
                                            {Array.isArray(part.columnD) && part.columnD.length > 0 && <div className="border-b border-slate-800 p-2 bg-slate-100 font-bold text-center text-[10px] uppercase tracking-wider">Column D</div>}

                                            {/* Rows */}
                                            {(() => {
                                              const left = part.leftColumn || [];
                                              const right = part.rightColumn || [];
                                              const colC = part.columnC || [];
                                              const colD = part.columnD || [];
                                              const rows = Math.max(left.length, right.length, colC.length, colD.length);
                                              const res = [];
                                              for (let i = 0; i < rows; i++) {
                                                res.push(
                                                  <React.Fragment key={i}>
                                                    <div className="border-r border-b border-slate-300 p-2 flex items-start gap-1 bg-white last:border-b-0 text-[11px]">
                                                      <span className="font-black text-slate-500 w-5 shrink-0">({isEn ? (i + 1) : toBengaliNumerals(i + 1)})</span>
                                                      <span className="flex-1"><UniversalMathJax inline dynamic>{left[i]?.text || ""}</UniversalMathJax></span>
                                                    </div>
                                                    <div className="border-r border-b border-slate-300 p-2 flex items-start gap-1 bg-white last:border-b-0 last:border-r-0 text-[11px]">
                                                      <span className="font-black text-slate-500 w-5 shrink-0">({isEn ? String.fromCharCode(65 + i) : (BENGALI_SUB_LABELS[i] || toBengaliNumerals(i + 1))})</span>
                                                      <span className="flex-1"><UniversalMathJax inline dynamic>{right[i]?.text || ""}</UniversalMathJax></span>
                                                    </div>
                                                    {colC.length > 0 && (
                                                        <div className="border-r border-b border-slate-300 p-2 flex items-start gap-1 bg-white last:border-b-0 last:border-r-0 text-[11px]">
                                                            <span className="font-black text-slate-500 w-5 shrink-0">({toRoman(i + 1)})</span>
                                                            <span className="flex-1"><UniversalMathJax inline dynamic>{colC[i]?.text || colC[i] || ""}</UniversalMathJax></span>
                                                        </div>
                                                    )}
                                                    {colD.length > 0 && (
                                                        <div className="border-b border-slate-300 p-2 flex items-start gap-1 bg-white last:border-b-0 text-[11px]">
                                                            <span className="font-black text-slate-500 w-5 shrink-0">({String.fromCharCode(97 + i)})</span>
                                                            <span className="flex-1"><UniversalMathJax inline dynamic>{colD[i]?.text || colD[i] || ""}</UniversalMathJax></span>
                                                        </div>
                                                    )}
                                                  </React.Fragment>
                                                );
                                              }
                                              return res;
                                            })()}
                                          </div>
                                        </div>
                                      )}

                                      {part.subType === 'rearranging' && (
                                        <div className="mt-3 ml-4 bg-gray-50/50 border-2 border-dashed border-gray-300 p-4 rounded-xl">
                                          <div className="grid grid-cols-1 gap-2">
                                            {(part.items || []).map((item: string, iIdx: number) => (
                                              <div key={iIdx} className="flex items-start gap-3 bg-white/60 p-2 rounded-lg shadow-sm border border-gray-100">
                                                <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                                                  {isEn ? String.fromCharCode(97 + iIdx) : BENGALI_SUB_LABELS[iIdx]}
                                                </div>
                                                <div className="pt-1 flex-1 leading-relaxed"><UniversalMathJax dynamic>{item}</UniversalMathJax></div>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="mt-4 border border-slate-400 h-10 w-full rounded flex items-center justify-center text-xs font-bold text-slate-500 bg-white">
                                            Answer Sequence: ____________________________________________________
                                          </div>
                                        </div>
                                      )}

                                      {part.subType === 'table' && (
                                        <div className="mt-2 overflow-x-auto">
                                          <table className="w-full border-collapse border border-black text-xs">
                                            <thead>
                                              <tr>
                                                {(part.tableHeaders || []).map((h: string, hi: number) => (
                                                  <th key={hi} className="border border-black p-2 bg-gray-100 font-bold uppercase tracking-tighter">{h}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {(part.tableRows || []).map((row: string[], ri: number) => (
                                                <tr key={ri}>
                                                  {row.map((cell: any, ci: number) => (
                                                    <td key={ci} className="border border-black p-2 text-center font-medium bg-white">
                                                      {cell === '___' ? '____________' : cell}
                                                    </td>
                                                  ))}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}

                                      {part.subType === 'interpreting_graph' && (
                                        <div className="mt-4 mb-4">
                                          {part.chartConfig && (
                                            <div className="max-w-2xl mx-auto border border-black/10 p-4 rounded-xl bg-white shadow-sm">
                                              <BeautifulChart
                                                type={part.chartConfig.type}
                                                data={(part.chartConfig.labels || []).map((l: string, i: number) => ({
                                                  label: l,
                                                  value: part.chartConfig.data?.[i] || 0
                                                }))}
                                                xAxisLabel={part.chartConfig.xAxisLabel}
                                                yAxisLabel={part.chartConfig.yAxisLabel}
                                                isPrint={true}
                                              />
                                            </div>
                                          )}
                                          <div className="mt-6 space-y-4">
                                            {[1, 2, 3].map(li => (
                                              <div key={li} className="border-b border-dotted border-gray-400 h-1 w-full"></div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="text-right font-black text-[10px] uppercase tracking-widest mt-2 border-t border-black/5 pt-1">
                                      {isEn ? `[Marks: ${part.marks}]` : `[নম্বর: ${toBengaliNumerals(part.marks)}]`}
                                    </div>
                                  </div>
                                ))}
                              </div>
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
      </div>
    );
  }
);

QuestionPaper.displayName = 'QuestionPaper';
export default QuestionPaper;
