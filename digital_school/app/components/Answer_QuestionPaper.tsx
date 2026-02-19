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
      <span><strong>শ্রেণি:</strong> {toBengaliNumerals(examInfo.class)}</span>
      <span><strong>তারিখ:</strong> {toBengaliNumerals(examInfo.date)}</span>
      {examInfo.set && <span><strong>সেট:</strong> {examInfo.set}</span>}
      <span><strong>সময়:</strong> {typeof time === 'number' ? formatBengaliDuration(time) : toBengaliNumerals(time)}</span>
      <span><strong>পূর্ণমান:</strong> {toBengaliNumerals(marks)}</span>
    </div>

    <div className="mt-4 text-center">
      <div className="inline-block text-xl font-bold text-red-600 border-2 border-red-600 px-4 py-1 rounded shadow-sm">
        {type === 'objective' ? 'বহুনির্বাচনি উত্তরপত্র (Objective Answers)' : 'সৃজনশীল উত্তরপত্র (CQ/SQ Answers)'}
      </div>
    </div>
  </header>
);

// Main AnswerQuestionPaper component (forwardRef for printing)
const AnswerQuestionPaper = forwardRef<HTMLDivElement, AnswerQuestionPaperProps>(
  ({ examInfo, questions, qrData, fontSize, cqSqFontSize, forcePageBreak }, ref) => {
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
          fontFamily: 'SolaimanLipi, Times New Roman, serif',
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
        </div>

        {/* Main Content */}
        <main>
          {/* MCQ Section */}
          {allObjective.length > 0 && (
            <div style={{ fontSize: fontSize ? `${fontSize}%` : '100%' }}>
              {/* MCQ Header - only once */}
              <div className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 break-inside-avoid mcq-header">
                <h3>বহুনির্বাচনি প্রশ্নের উত্তর (Objective Answers)</h3>
                <div className="text-right">
                  <div>মোট নম্বর: {toBengaliNumerals(objectiveTotal)}</div>
                  {examInfo.mcqNegativeMarking && Number(examInfo.mcqNegativeMarking) > 0 ? (
                    <div className="text-red-600">(ভুল উত্তরের জন্য {toBengaliNumerals(examInfo.mcqNegativeMarking)}% নম্বর কর্তন করা হবে)</div>
                  ) : null}
                </div>
              </div>

              <div className="mcq-container">
                {allObjective.map((q: any, idx) => {
                  const qNum = toBengaliNumerals(idx + 1);

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
                                  <Text>{`${MCQ_LABELS[oidx]}. ${opt.text}`}</Text>
                                </div>
                              ))}
                            </div>
                            <div className="mb-1">
                              <span className="text-gray-600 font-medium">[{toBengaliNumerals(q.marks || 1)} নম্বর]</span>
                            </div>
                            <div className="bg-red-50 p-1 border-l-4 border-red-600 inline-block mb-1">
                              <span className="text-red-700 font-bold">
                                উত্তর: {q.type === 'MCQ' ? normalizeAnswer(q.correctAnswer) : (q.options || []).filter((o: any) => o.isCorrect).map((o: any, i: number) => MCQ_LABELS[q.options.indexOf(o)]).join(', ')}
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
                          <span className="ml-4 font-bold">[{toBengaliNumerals(q.marks || 1)}]</span>
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
                            <span className="font-semibold">(A):</span> <UniversalMathJax inline>{q.assertion}</UniversalMathJax>
                            <br />
                            <span className="font-semibold ml-5">(R):</span> <UniversalMathJax inline>{q.reason}</UniversalMathJax>
                          </div>
                          <span className="ml-4 font-bold">[{toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                        <div className="mt-2 ml-6 border-2 border-green-600 bg-green-50 rounded p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-700">সঠিক বিকল্প:</span>
                            <span className="font-bold text-green-800">{toBengaliNumerals(q.correctOption)}</span>
                            <span className="text-green-600">
                              ({q.correctOption === 1 ? 'A ও R সত্য, R হলো A এর সঠিক ব্যাখ্যা' :
                                q.correctOption === 2 ? 'A ও R সত্য, R হলো A এর সঠিক ব্যাখ্যা নয়' :
                                  q.correctOption === 3 ? 'A সত্য, R মিথ্যা' :
                                    q.correctOption === 4 ? 'A মিথ্যা, R সত্য' : 'উভয়ই মিথ্যা'})
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
                          <span className="font-bold">{qNum}. স্তম্ভদ্বয় মিল করো:</span>
                          <span className="font-bold">[{toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {((q.leftColumn || []) as any[]).map((leftItem: any, lIdx: number) => {
                            const rightId = (q.matches || {})[leftItem.id];
                            const rightIdx = (q.rightColumn || []).findIndex((r: any) => r.id === rightId);
                            const rightItem = (q.rightColumn || [])[rightIdx];

                            // Visual labels
                            const vLeftLabel = toBengaliNumerals(lIdx + 1);
                            const vRightLabel = rightIdx !== -1 ? String.fromCharCode(65 + rightIdx) : '?';

                            return (
                              <div key={lIdx} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                                <span className="font-bold text-green-700">{vLeftLabel}.</span>
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
                />
              )}
              {cqs.length > 0 && (
                <>
                  <div
                    className="flex justify-between items-center font-bold mb-2 border-b border-dotted border-black pb-1 mt-6 cq-section section-break"
                  >
                    <h3>সৃজনশীল প্রশ্নের উত্তর (CQ Answers)</h3>
                    <div className="text-right">
                      <div>সর্বোচ্চ নম্বর: {toBengaliNumerals(cqRequiredMarks)}</div>
                      {cqRequired > 0 && (
                        <div className="">(যেকোনো {toBengaliNumerals(cqRequired)} টি উত্তর করতে হবে)</div>
                      )}
                    </div>
                  </div>
                  <div>
                    {cqs.map((q, idx) => (
                      <div key={idx} className="mb-3 text-left cq-question">
                        <div className="flex items-start">
                          <span className="font-bold mr-2">{toBengaliNumerals(idx + 1)}.</span>
                          <div className="flex-1">
                            <div className="text-red-600 font-bold mb-2">
                              উত্তর:
                            </div>
                            {q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0 ? (
                              <ul className="list-inside mt-1 ml-4">
                                {q.subQuestions.map((sub, sidx) => (
                                  <li key={sidx} className="ml-4 flex items-start mb-2">
                                    <span className="font-bold mr-1">{BENGALI_SUB_LABELS[sidx] || String.fromCharCode(0x0995 + sidx)}.</span>
                                    <span className="flex-1">
                                      <div className="mb-1">
                                        <span className="">[{toBengaliNumerals(sub.marks || '?')} নম্বর]</span>
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
                                <Text>{q.modelAnswer || 'উত্তর প্রদান করা হয়নি।'}</Text>
                              </div>
                            )}
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
                    <h3>রচনামূলক ও ব্যাকরণ প্রশ্নের উত্তর (Descriptive & Grammar Answers)</h3>
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
                              <div className="text-red-600 font-bold mb-2">উত্তর:</div>

                              {(q.subQuestions || []).map((part: any, pIdx: number) => (
                                <div key={pIdx} className="mb-3">
                                  {part.label && <div className="font-bold text-sm mb-1 underline">{part.label}:</div>}

                                  <div className="bg-gray-50 p-3 rounded border border-gray-200 shadow-sm leading-relaxed text-sm">
                                    {part.subType === 'writing' && (
                                      <div>
                                        <div className="font-bold text-xs text-blue-700 mb-1">নমুনা উত্তর (Sample Answer):</div>
                                        <UniversalMathJax dynamic>{part.modelAnswer || 'নমুনা উত্তর প্রদান করা হয়নি।'}</UniversalMathJax>
                                      </div>
                                    )}

                                    {part.subType === 'fill_in' && (
                                      <div>
                                        <div className="font-bold text-xs text-blue-700 mb-1">শূন্যস্থান পূরণ (Fill-in Answers):</div>
                                        {part.fillType === 'gap_passage' || !part.fillType ? (
                                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                            {(part.answers || []).map((ans: string, aIdx: number) => (
                                              <div key={aIdx} className="flex gap-1">
                                                <span className="font-bold">({toBengaliNumerals(aIdx + 1)})</span>
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
                                        <div className="font-bold text-xs text-blue-700 mb-1">বোধগম্যতা (Comprehension Answers):</div>
                                        {(!part.answerType || part.answerType === 'qa') ? (
                                          <div className="space-y-2">
                                            {(part.answers || []).map((ans: string, aIdx: number) => (
                                              <div key={aIdx} className="flex items-start gap-2">
                                                <span className="font-bold text-xs">{toBengaliNumerals(aIdx + 1)}.</span>
                                                <UniversalMathJax dynamic>{ans}</UniversalMathJax>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-2 gap-2">
                                            {(part.stemAnswers || []).map((ans: string, aIdx: number) => (
                                              <div key={aIdx} className="flex gap-2">
                                                <span className="font-bold">{toBengaliNumerals(aIdx + 1)}.</span>
                                                <span className="font-bold text-red-600">{normalizeAnswer(ans)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {part.subType === 'table' && (
                                      <div>
                                        <div className="font-bold text-xs text-blue-700 mb-1">টেবিল উত্তর (Table Answers):</div>
                                        <div className="space-y-1">
                                          {(part.tableAnswers || []).map((row: string[], rIdx: number) => (
                                            <div key={rIdx} className="flex gap-2 border-b border-gray-100 pb-1">
                                              <span className="font-bold text-[10px] text-gray-500 min-w-[50px]">সারি {toBengaliNumerals(rIdx + 1)}:</span>
                                              <div className="flex flex-wrap gap-x-4">
                                                {row.map((cell, cIdx) => (
                                                  <span key={cIdx} className="text-xs">
                                                    <span className="text-gray-400 mr-1">{toBengaliNumerals(cIdx + 1)}.</span> {cell}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right font-bold text-xs mt-1">[{toBengaliNumerals(part.marks)} নম্বর]</div>
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
                    <h3>সংক্ষিপ্ত প্রশ্নের উত্তর (SQ Answers)</h3>
                    <div className="text-right">
                      <div>সর্বোচ্চ নম্বর: {toBengaliNumerals(sqRequiredMarks)}</div>
                      {sqRequired > 0 && (
                        <div className="">(যেকোনো {toBengaliNumerals(sqRequired)} টি উত্তর করতে হবে)</div>
                      )}
                    </div>
                  </div>
                  <div>
                    {sqs.map((q, idx) => (
                      <div key={idx} className="mb-3 text-left sq-question">
                        <div className="flex items-start">
                          <span className="font-bold mr-2">{toBengaliNumerals(cqs.length + idx + 1)}.</span>
                          <div className="flex-1">
                            <div className="text-red-600 font-bold mb-2">উত্তর:</div>
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