import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJaxContext } from 'better-react-mathjax';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import Latex from 'react-latex';
import { cleanupMath } from '@/lib/utils';
import { toBengaliNumerals } from '@/utils/numeralConverter';


// --- TYPES ---
interface MCQ {
  q: string;
  options: { text: string }[];
  marks?: number;
}
interface MC {
  q: string;
  options: { text: string; isCorrect?: boolean }[];
  marks?: number;
}
interface INT {
  q: string;
  marks?: number;
  modelAnswer?: string;
}
interface CQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
  subQuestions?: any[];
}
interface AR {
  assertion: string;
  reason: string;
  correctOption?: number;
  marks?: number;
}
interface SQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
}
interface MTF {
  leftColumn: { id: string; text: string }[];
  rightColumn: { id: string; text: string }[];
  matches: Record<string, string>;
  marks?: number;
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
  };
  qrData: any;
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

// Main QuestionPaper component (forwardRef for printing)
const QuestionPaper = forwardRef<HTMLDivElement, QuestionPaperProps>(
  ({ examInfo, questions, qrData }, ref) => {
    const mcqs = questions.mcq || [];
    const mcs = questions.mc || [];
    const ints = questions.int || [];
    const ars = questions.ar || [];
    const cqs = questions.cq || [];
    const sqs = questions.sq || [];

    const allObjective = [
      ...(mcqs.map(q => ({ ...q, type: 'MCQ' }))),
      ...(mcs.map(q => ({ ...q, type: 'MC' }))),
      ...(ints.map(q => ({ ...q, type: 'INT' }))),
      ...(ars.map(q => ({ ...q, type: 'AR' }))),
      ...(questions.mtf || []).map(q => ({ ...q, type: 'MTF' }))
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

    return (
      <div ref={ref} className="question-paper-container bg-white relative overflow-hidden" style={{ fontFamily: 'SolaimanLipi, Times New Roman, serif' }}>
        <div className="watermark print-only">{examInfo.schoolName}</div>

        {/* Header */}
        <header className="text-center mb-6 relative border-b-4 border-black pb-4">
          <div className="absolute top-0 right-0 qr-container">
            <QRCode value={JSON.stringify(qrData)} size={64} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{examInfo.schoolName}</h1>
          <p className="text-base text-gray-700 mb-2">{examInfo.schoolAddress}</p>
          <div className="inline-block border-y-2 border-black py-1 px-8 my-2">
            <h2 className="text-2xl font-bold uppercase">{examInfo.title}</h2>
          </div>
          <div className="text-base flex flex-row justify-center gap-x-6 flex-wrap mt-2 font-medium">
            <span><strong>বিষয়:</strong> {examInfo.subject}</span>
            <span><strong>শ্রেণি:</strong> {toBengaliNumerals(examInfo.class)}</span>
            {examInfo.set && <span><strong>সেট:</strong> {examInfo.set}</span>}
            <span><strong>তারিখ:</strong> {toBengaliNumerals(examInfo.date)}</span>
            {examInfo.duration && <span><strong>সময়:</strong> {toBengaliNumerals(examInfo.duration)}</span>}
            {examInfo.totalMarks && <span><strong>পূর্ণমান:</strong> {toBengaliNumerals(examInfo.totalMarks)}</span>}
          </div>
        </header>

        {/* Instruction Box */}
        <div className="instruction-box">
          <h4 className="font-bold border-b border-black mb-1 pb-1">সাধারণ নির্দেশাবলী:</h4>
          <ul className="list-disc ml-5 text-sm">
            <li>প্রশ্নপত্রের ডান পাশের সংখ্যা প্রশ্নের পূর্ণমান জ্ঞাপন করে।</li>
            <li>প্রতিটি প্রশ্নের উত্তর স্পষ্ট অক্ষরে লিখতে হবে।</li>
            <li>বহুনির্বাচনি প্রশ্নের ক্ষেত্রে প্রতিটি প্রশ্নের একটি মাত্র সঠিক উত্তর থাকবে।</li>
          </ul>
        </div>

        {/* Main Content */}
        <main>
          {/* MCQ Section */}
          {allObjective.length > 0 && (
            <>
              {/* MCQ Header - only once */}
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 break-inside-avoid mcq-header">
                <h3>বহুনির্বাচনি প্রশ্ন (Objective Questions)</h3>
                <div className="text-right">
                  <div>মোট নম্বর: {toBengaliNumerals(objectiveTotal)}</div>
                  {examInfo.mcqNegativeMarking && Number(examInfo.mcqNegativeMarking) > 0 ? (
                    <div className="text-red-600 text-sm">(ভুল উত্তরের জন্য {toBengaliNumerals(examInfo.mcqNegativeMarking)}% নম্বর কর্তন করা হবে)</div>
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
                      <div key={idx} className="mb-4 text-left question-block break-inside-avoid">
                        <div className="flex items-start">
                          <span className="font-bold mr-2 text-base">
                            {qNum}.{q.type === 'MC' ? '*' : ''}
                          </span>
                          <div className="flex-1 text-base">
                            <Text>{`${q.q || q.questionText || ''} [${toBengaliNumerals(q.marks || 1)}]`}</Text>
                            {q.type === 'MC' && <div className="text-[10px] text-blue-700 font-bold mb-1">[সকল সঠিক উত্তর নির্বাচন করো]</div>}
                            <div className={`mt-1 question-options ${gridClass}`}>
                              {(q.options || []).map((opt: any, oidx: number) => (
                                <div key={oidx} className="option-item flex items-start gap-1">
                                  {q.type === 'MC' && <span className="text-xs">☐</span>}
                                  <Text>{`${MCQ_LABELS[oidx]}. ${opt.text}`}</Text>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (q.type === 'INT') {
                    return (
                      <div key={idx} className="mb-4 text-left question-block break-inside-avoid">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-bold">{qNum}. </span>
                            <UniversalMathJax inline>{q.q || q.questionText || ''}</UniversalMathJax>
                            <div className="mt-2 ml-6 flex items-center gap-2">
                              <span className="text-sm font-bold">উত্তর:</span>
                              <div className="border border-black w-12 h-8 flex items-center justify-center font-bold"></div>
                            </div>
                          </div>
                          <span className="ml-4 font-bold">[{toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                      </div>
                    );
                  }

                  if (q.type === 'AR') {
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
                        <div className="ml-6 grid grid-cols-1 gap-1 text-sm border-l-2 border-gray-200 pl-3">
                          <div>ক. Assertion ও Reason উভয়ই সত্য এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা।</div>
                          <div>খ. Assertion ও Reason উভয়ই সত্য কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়।</div>
                          <div>গ. Assertion সত্য কিন্তু Reason মিথ্যা।</div>
                          <div>ঘ. Assertion মিথ্যা কিন্তু Reason সত্য।</div>
                          <div>ঙ. Assertion ও Reason উভয়ই মিথ্যা।</div>
                        </div>
                      </div>
                    );
                  }

                  if (q.type === 'MTF') {
                    return (
                      <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold">{qNum}. বাম স্তম্ভের সাথে ডান স্তম্ভ মিল কর:</span>
                          <span className="ml-4 font-bold">[{toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border border-black p-2 ml-6">
                          <div className="border-r border-black pr-2">
                            <p className="font-bold text-center border-b border-black text-xs mb-1">স্তম্ভ ক</p>
                            {(q.leftColumn || []).map((item: any, i: number) => (
                              <div key={i} className="text-xs flex gap-1">
                                <span className="font-bold">{toBengaliNumerals(i + 1)}.</span>
                                <UniversalMathJax inline>{item.text}</UniversalMathJax>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="font-bold text-center border-b border-black text-xs mb-1">স্তম্ভ খ</p>
                            {(q.rightColumn || []).map((item: any, i: number) => (
                              <div key={i} className="text-xs flex gap-1">
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
            </>
          )}

          {/* CQ Section */}
          {cqs.length > 0 && (
            <>
              <div
                className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 mt-6 cq-section section-break"
              >
                <h3>সৃজনশীল প্রশ্ন (CQ)</h3>
                <div className="text-right">
                  <div>সর্বোচ্চ নম্বর: {toBengaliNumerals(cqRequiredMarks)}</div>
                  {cqRequired > 0 && (
                    <div className="text-sm">(মোট {toBengaliNumerals(cqRequired)} টি উত্তর করতে হবে)</div>
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
                      <div className="font-semibold text-base text-blue-800 dark:text-blue-400 mb-2 border-l-4 border-blue-500 pl-3 bg-blue-50 dark:bg-blue-900/20 py-2">
                        {subsection.name || ` Subsection ${toBengaliNumerals(subIdx + 1)}`}
                        {subsectionRequired > 0 && (
                          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
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
              <div
                className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 mt-6 sq-section section-break"
              >
                <h3>সংক্ষিপ্ত প্রশ্ন (SQ)</h3>
                <div className="text-right">
                  <div>সর্বোচ্চ নম্বর: {toBengaliNumerals(sqRequiredMarks)}</div>
                  {sqRequired > 0 && (
                    <div className="text-sm">(মোট {toBengaliNumerals(sqRequired)} টি উত্তর করতে হবে)</div>
                  )}
                </div>
              </div>
              <div>
                {sqs.map((q, idx) => (
                  <div key={idx} className="mb-3 text-left sq-question">
                    <div className="flex items-start">
                      <span className="font-bold mr-2">{toBengaliNumerals(idx + 1)}.</span>
                      <div className="flex-1">
                        <Text>{`${q.questionText} [${toBengaliNumerals(q.marks || '?')}]`}</Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
