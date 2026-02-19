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
}

const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ'];

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

const Header = ({ examInfo, type, qrData, marks, time }: {
  examInfo: any,
  type: 'objective' | 'cqsq',
  qrData: any,
  marks: string | number,
  time: number | string
}) => (
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
      {/* বিষয়: removed as per request */}
      <span><strong>শ্রেণি:</strong> {toBengaliNumerals(examInfo.class)}</span>
      <span><strong>তারিখ:</strong> {toBengaliNumerals(examInfo.date)}</span>
      {examInfo.set && <span><strong>সেট:</strong> {examInfo.set}</span>}
      <span><strong>সময়:</strong> {typeof time === 'number' ? formatBengaliDuration(time) : toBengaliNumerals(time)}</span>
      <span><strong>পূর্ণমান:</strong> {toBengaliNumerals(marks)}</span>
    </div>
  </header>
);

// Main QuestionPaper component (forwardRef for printing)
const QuestionPaper = forwardRef<HTMLDivElement, QuestionPaperProps>(
  ({ examInfo, questions, qrData, fontSize, cqSqFontSize, forcePageBreak }, ref) => {
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
      ...(questions.mtf || []).map(q => ({ ...q, type: (q.type || 'MTF').toUpperCase() }))
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

    return (
      <div
        ref={ref}
        className="question-paper-container bg-white relative overflow-hidden"
        style={{
          fontFamily: "'ExamFont', 'Noto Serif Bengali', Georgia, serif",
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
          />

          {/* Special Instruction Box */}
          <div className="instruction-box">
            <p><strong>বিশেষ দ্রষ্টব্য:</strong> সরবরাহকৃত বহুনির্বাচনি অভীক্ষার উত্তরপত্রে প্রশ্নের ক্রমিক নম্বরের বিপরীতে প্রদত্ত বর্ণসংবলিত বৃত্তসমূহ হতে সঠিক/সর্বোৎকৃষ্ট বল পয়েন্ট কলম দ্বারা সম্পূর্ণ ভরাট করো। প্রশ্নপত্রের ডান পাশের সংখ্যা প্রশ্নের পূর্ণমান জ্ঞাপন করে।{examInfo.mcqNegativeMarking && Number(examInfo.mcqNegativeMarking) > 0 && (<span className="font-semibold"> প্রতিটি ভুল উত্তরের জন্য {toBengaliNumerals(examInfo.mcqNegativeMarking)}% নম্বর কাটা যাবে।</span>)}</p>
          </div>
        </div>

        {/* Main Content */}
        <main>
          {/* MCQ Section */}
          {allObjective.length > 0 && (
            <div style={{ fontSize: fontSize ? `${fontSize}%` : '100%' }}>

              <div className="mcq-container">
                {allObjective.map((q: any, idx) => {
                  const qNum = toBengaliNumerals(idx + 1);

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
                            {q.type?.toUpperCase() === 'MC' && <div className="text-blue-700 font-bold mb-1">[সকল সঠিক উত্তর নির্বাচন করো]</div>}
                            <div className={`mt-1 ${gridClass}`}>
                              {(q.options || []).map((opt: any, oidx: number) => (
                                <div key={oidx} className="option-item flex items-start gap-0.5" style={{ minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                  {q.type?.toUpperCase() === 'MC' && <span className="flex-shrink-0">☐</span>}
                                  <span className="mcq-option-label flex-shrink-0">{MCQ_LABELS[oidx]}</span>
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
                              <span className="font-bold">উত্তর:</span>
                              <div className="border border-black w-12 h-8 flex items-center justify-center font-bold"></div>
                            </div>
                          </div>
                          <span className="ml-4 font-bold">[{toBengaliNumerals(q.marks || 1)}]</span>
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
                            <strong>নিশ্চয়তা (Assertion):</strong> <UniversalMathJax inline>{q.assertion}</UniversalMathJax>
                            <br />
                            <span className="ml-6"><strong>কারণ (Reason):</strong> <UniversalMathJax inline>{q.reason}</UniversalMathJax></span>
                          </div>
                          <span className="ml-4 font-bold">[{toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                        <div className="ml-6 grid grid-cols-1 gap-1 border-l-2 border-gray-200 pl-3">
                          <div>ক. Assertion ও Reason উভয়ই সত্য এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা।</div>
                          <div>খ. Assertion ও Reason উভয়ই সত্য কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়।</div>
                          <div>গ. Assertion সত্য কিন্তু Reason মিথ্যা।</div>
                          <div>ঘ. Assertion মিথ্যা কিন্তু Reason সত্য।</div>
                          <div>ঙ. Assertion ও Reason উভয়ই মিথ্যা।</div>
                        </div>
                      </div>
                    );
                  }

                  if (q.type?.toUpperCase() === 'MTF') {
                    return (
                      <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold">{qNum}. বাম স্তম্ভের সাথে ডান স্তম্ভ মিল কর:</span>
                          <span className="ml-4 font-bold">[{toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border border-black p-2 ml-6">
                          <div className="border-r border-black pr-2">
                            <p className="font-bold text-center border-b border-black mb-1">স্তম্ভ ক</p>
                            {(q.leftColumn || []).map((item: any, i: number) => (
                              <div key={i} className="flex gap-1">
                                <span className="font-bold">{toBengaliNumerals(i + 1)}.</span>
                                <UniversalMathJax inline>{item.text}</UniversalMathJax>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="font-bold text-center border-b border-black mb-1">স্তম্ভ খ</p>
                            {(q.rightColumn || []).map((item: any, i: number) => (
                              <div key={i} className="flex gap-1">
                                <span className="font-bold">{String.fromCharCode(65 + i)}.</span>
                                <UniversalMathJax inline>{item.text}</UniversalMathJax>
                              </div>
                            ))}
                          </div>
                        </div>
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
                  marks={examInfo.totalMarks || cqSqTotalMarks}
                  time={examInfo.cqSqTime || 0}
                />
              )}
              {cqs.length > 0 && (
                <>
                  <div
                    className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 mt-6 cq-section section-break"
                  >
                    <div className="flex flex-col">
                      <h3>সৃজনশীল প্রশ্ন (CQ)</h3>
                    </div>
                    <div className="text-right">
                      <div>সর্বোচ্চ নম্বর: {toBengaliNumerals(cqRequiredMarks)}</div>
                      {cqRequired > 0 && (
                        <div className="">(মোট {toBengaliNumerals(cqRequired)} টি উত্তর করতে হবে)</div>
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
                          <div className="font-semibold text-blue-800 dark:text-blue-400 mb-2 border-l-4 border-blue-500 pl-3 bg-blue-50 dark:bg-blue-900/20 py-2">
                            {subsection.name || ` Subsection ${toBengaliNumerals(subIdx + 1)}`}
                            {subsectionRequired > 0 && (
                              <span className="font-normal text-gray-600 dark:text-gray-400 ml-2">
                                (কমপক্ষে {toBengaliNumerals(subsectionRequired)} টি উত্তর করতে হবে)
                              </span>
                            )}
                          </div>

                          {/* Questions in this subsection */}
                          <div className="ml-4">
                            {subsectionQuestions.map((q, idx) => (
                              <div key={idx} className="mb-3 text-left cq-question">
                                <div className="flex items-start">
                                  <span className="font-bold mr-2">{toBengaliNumerals(subsection.startIndex + idx)}.</span>
                                  <div className="flex-1">
                                    <Text>{`${q.questionText} [${toBengaliNumerals(q.marks || 1)}]`}</Text>
                                    {q.subQuestions && Array.isArray(q.subQuestions) && (
                                      <ul className="list-inside mt-1 ml-4">
                                        {q.subQuestions.map((sub, sidx) => (
                                          <li key={sidx} className="ml-4 flex items-start">
                                            <span className="font-bold mr-1">{BENGALI_SUB_LABELS[sidx] || String.fromCharCode(0x0995 + sidx)}.</span>
                                            <span className="flex-1">
                                              <Text>
                                                {`${sub.question || sub.questionText || sub.text || sub}${sub.marks ? ` [${toBengaliNumerals(sub.marks)}]` : ''}`}
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
                            <span className="font-bold mr-2">{toBengaliNumerals(idx + 1)}.</span>
                            <div className="flex-1">
                              <Text>{`${q.questionText} [${toBengaliNumerals(q.marks || 1)}]`}</Text>
                              {q.subQuestions && Array.isArray(q.subQuestions) && (
                                <ul className="list-inside mt-1 ml-4">
                                  {q.subQuestions.map((sub, sidx) => (
                                    <li key={sidx} className="ml-4 flex items-start">
                                      <span className="font-bold mr-1">{BENGALI_SUB_LABELS[sidx] || String.fromCharCode(0x0995 + sidx)}.</span>
                                      <span className="flex-1">
                                        <Text>
                                          {`${sub.question || sub.questionText || sub.text || sub}${sub.marks ? ` [${toBengaliNumerals(sub.marks)}]` : ''}`}
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
                    <h3>সংক্ষিপ্ত প্রশ্ন (SQ)</h3>
                    <div className="text-right">
                      <div>সর্বোচ্চ নম্বর: {toBengaliNumerals(sqRequiredMarks)}</div>
                      {sqRequired > 0 && (
                        <div className="">(মোট {toBengaliNumerals(sqRequired)} টি উত্তর করতে হবে)</div>
                      )}
                    </div>
                  </div>
                  <div>
                    {sqs.map((q, idx) => (
                      <div key={idx} className="mb-3 text-left sq-question">
                        <div className="flex items-start">
                          <span className="font-bold mr-2">{toBengaliNumerals(cqs.length + idx + 1)}.</span>
                          <div className="flex-1">
                            <Text>{`${q.questionText} [${toBengaliNumerals(q.marks || '?')}]`}</Text>
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
                    <h3>রচনামূলক ও ব্যাকরণ প্রশ্ন (Descriptive &amp; Grammar)</h3>
                    <div className="text-right">
                      <div>মোট নম্বর: {toBengaliNumerals(descMarks)}</div>
                    </div>
                  </div>
                  <div>
                    {descriptives.map((q, idx) => {
                      const questionBaseNum = cqs.length + sqs.length + idx + 1;
                      return (
                        <div key={idx} className="mb-4 text-left descriptive-question break-inside-avoid">
                          <div className="flex items-start">
                            <span className="font-bold mr-2">{toBengaliNumerals(questionBaseNum)}.</span>
                            <div className="flex-1">
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

                                    {part.subType === 'fill_in' && (
                                      <div className="space-y-2">
                                        {(part.fillType === 'gap_passage' || !part.fillType) && part.passage && (
                                          <div className="leading-relaxed">
                                            <UniversalMathJax dynamic>
                                              {part.passage.split('___').map((segment: string, sIdx: number, array: any[]) => (
                                                <React.Fragment key={sIdx}>
                                                  {segment}
                                                  {sIdx < array.length - 1 && (
                                                    <span className="font-bold underline px-1">({toBengaliNumerals(sIdx + 1)}) _______</span>
                                                  )}
                                                </React.Fragment>
                                              ))}
                                            </UniversalMathJax>
                                          </div>
                                        )}
                                        {part.fillType && part.fillType !== 'gap_passage' && (
                                          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                            {(part.items || []).map((item: string, iIdx: number) => (
                                              <div key={iIdx} className="flex items-start gap-1">
                                                <span className="font-bold">{String.fromCharCode(97 + iIdx)}.</span>
                                                <UniversalMathJax inline dynamic>{item}</UniversalMathJax>
                                                <span className="border-b border-black w-20 ml-auto mr-4"></span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {part.subType === 'comprehension' && (
                                      <div className="space-y-2">
                                        {part.stem && (
                                          <div className="p-3 bg-gray-50 border border-gray-300 rounded mb-3">
                                            <UniversalMathJax dynamic>{part.stem}</UniversalMathJax>
                                          </div>
                                        )}
                                        {part.stemImage && <img src={part.stemImage} alt="Stem" className="max-h-48 mx-auto mb-3" />}

                                        {(!part.answerType || part.answerType === 'qa') && (
                                          <div className="space-y-2">
                                            {(part.questions || []).map((quest: string, qIdx: number) => (
                                              <div key={qIdx} className="flex items-start gap-2">
                                                <span className="font-bold">{toBengaliNumerals(qIdx + 1)}.</span>
                                                <UniversalMathJax dynamic>{quest}</UniversalMathJax>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {part.answerType === 'stem_mcq' && (
                                          <div className="grid grid-cols-2 gap-4">
                                            {(part.stemQuestions || []).map((sq: any, sqIdx: number) => (
                                              <div key={sqIdx} className="mb-2">
                                                <div className="font-medium mb-1">{toBengaliNumerals(sqIdx + 1)}. {sq.question}</div>
                                                <div className="grid grid-cols-2 text-[10px] gap-1 ml-4">
                                                  {(sq.options || []).map((opt: string, oIdx: number) => (
                                                    <div key={oIdx}>({MCQ_LABELS[oIdx]}) {opt}</div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
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
                                  <div className="text-right font-bold text-xs mt-1">[{toBengaliNumerals(part.marks)}]</div>
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
            <p className="font-bold">পরীক্ষকের স্বাক্ষর</p>
          </div>
          <div className="signature-block">
            <div className="signature-line"></div>
            <p className="font-bold">প্রধান শিক্ষকের স্বাক্ষর</p>
          </div>
        </div>
      </div>
    );
  }
);

QuestionPaper.displayName = 'QuestionPaper';
export default QuestionPaper;
