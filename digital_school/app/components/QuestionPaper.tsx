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

    // Calculate total marks for all questions
    const mcqTotal = mcqs.reduce((sum, q) => sum + (q.marks || 1), 0);
    const mcTotal = mcs.reduce((sum, q) => sum + (q.marks || 1), 0);
    const intTotal = ints.reduce((sum, q) => sum + (q.marks || 1), 0);
    const arTotal = ars.reduce((sum, q) => sum + (q.marks || 1), 0);
    const cqTotal = cqs.reduce((sum, q) => sum + (q.marks || 0), 0);
    const sqTotal = sqs.reduce((sum, q) => sum + (q.marks || 0), 0);

    // Calculate highest possible marks for required questions
    const cqRequired = examInfo.cqRequiredQuestions || 0;
    const sqRequired = examInfo.sqRequiredQuestions || 0;

    // Sort questions by marks (highest first) and calculate required marks
    const cqSorted = [...cqs].sort((a, b) => (b.marks || 0) - (a.marks || 0));
    const sqSorted = [...sqs].sort((a, b) => (b.marks || 0) - (a.marks || 0));

    const cqRequiredMarks = cqSorted.slice(0, cqRequired).reduce((sum, q) => sum + (q.marks || 0), 0);
    const sqRequiredMarks = sqSorted.slice(0, sqRequired).reduce((sum, q) => sum + (q.marks || 0), 0);

    // Calculate MCQ pagination based on rules
    const getMCQPages = () => {
      if (mcqs.length <= 10) {
        // Single column, single page
        return [{ questions: mcqs, isTwoColumn: false } as const];
      } else {
        // Two columns, multiple pages - 9 questions per column (18 per page)
        const pages: Array<{ left: MCQ[]; right: MCQ[]; isTwoColumn: true }> = [];
        let remaining = [...mcqs];

        while (remaining.length > 0) {
          if (remaining.length <= 18) {
            // Last page: distribute remaining questions
            const leftCount = Math.ceil(remaining.length / 2);
            pages.push({
              left: remaining.slice(0, leftCount),
              right: remaining.slice(leftCount),
              isTwoColumn: true
            });
            break;
          } else {
            // Full page: 9+9 distribution
            pages.push({
              left: remaining.slice(0, 9),
              right: remaining.slice(9, 18),
              isTwoColumn: true
            });
            remaining = remaining.slice(18);
          }
        }
        return pages;
      }
    };

    const mcqPages = getMCQPages();

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
          {mcqs.length > 0 && (
            <>
              {/* MCQ Header - only once */}
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 break-inside-avoid mcq-header">
                <h3>বহুনির্বাচনি প্রশ্ন (MCQ)</h3>
                <div className="text-right">
                  <div>মোট নম্বর: {mcqTotal}</div>
                  {examInfo.mcqNegativeMarking && Number(examInfo.mcqNegativeMarking) > 0 ? (
                    <div className="text-red-600 text-sm">(প্রতিটি ভুল উত্তরের জন্য {examInfo.mcqNegativeMarking}% নম্বর কর্তন করা হবে)</div>
                  ) : null}
                </div>
              </div>

              <div className="mcq-container">
                {mcqs.map((q, idx) => {
                  // Dynamic column calculation based on option length
                  const totalOptionsLength = (q.options || []).reduce((acc, opt) => acc + (opt.text || '').length, 0);
                  let gridClass = "options-grid-4"; // Default for short options
                  if (totalOptionsLength > 60) gridClass = "options-grid-1";
                  else if (totalOptionsLength > 30) gridClass = "options-grid-2";

                  return (
                    <div key={idx} className="mb-4 text-left question-block">
                      <div className="flex items-start">
                        <span className="font-bold mr-2 text-base">{toBengaliNumerals(idx + 1)}.</span>
                        <div className="flex-1 text-base">
                          <Text>{`${q.q} [${toBengaliNumerals(q.marks || 1)}]`}</Text>
                          <div className={`mt-1 question-options ${gridClass}`}>
                            {(q.options || []).map((opt: any, oidx: number) => (
                              <div key={oidx} className="option-item">
                                <Text>{`${MCQ_LABELS[oidx]}. ${opt.text}`}</Text>
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

          {/* MC (Multiple Correct) Section */}
          {mcs.length > 0 && (
            <>
              {/* MC Header */}
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 break-inside-avoid mcq-header mt-6">
                <h3>বহুনির্বাচনি প্রশ্ন - একাধিক সঠিক (MC)</h3>
                <div className="text-right">
                  <div>মোট নম্বর: {toBengaliNumerals(mcTotal)}</div>
                  {examInfo.mcqNegativeMarking && Number(examInfo.mcqNegativeMarking) > 0 ? (
                    <div className="text-red-600 text-sm">(প্রতিটি ভুল উত্তরের জন্য {toBengaliNumerals(examInfo.mcqNegativeMarking)}% নম্বর কর্তন করা হবে)</div>
                  ) : null}
                  <div className="text-blue-600 text-sm">(সকল সঠিক উত্তর নির্বাচন করতে হবে)</div>
                </div>
              </div>

              <div className="mcq-container">
                {mcs.map((q, idx) => {
                  // Dynamic column calculation based on option length
                  const totalOptionsLength = (q.options || []).reduce((acc, opt) => acc + (opt.text || '').length, 0);
                  let gridClass = "options-grid-4"; // Default for short options
                  if (totalOptionsLength > 60) gridClass = "options-grid-1";
                  else if (totalOptionsLength > 30) gridClass = "options-grid-2";

                  return (
                    <div key={idx} className="mb-4 text-left question-block">
                      <div className="flex items-start">
                        <span className="font-bold mr-2 text-base">{toBengaliNumerals(idx + 1)}.</span>
                        <div className="flex-1 text-base">
                          <Text>{`${q.q} [${toBengaliNumerals(q.marks || 1)}]`}</Text>
                          <div className={`mt-1 question-options ${gridClass}`}>
                            {(q.options || []).map((opt: any, oidx: number) => (
                              <div key={oidx} className="option-item flex items-start gap-1">
                                <span>☐</span>
                                <Text>{`${MCQ_LABELS[oidx]}. ${opt.text}`}</Text>
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

          {/* INT (Integer Type) Section */}
          {ints.length > 0 && (
            <>
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 break-inside-avoid mcq-header mt-6">
                <h3>সংখ্যাসূচক প্রশ্ন (INT)</h3>
                <div className="text-right">
                  <div>মোট নম্বর: {toBengaliNumerals(intTotal)}</div>
                </div>
              </div>
              <div className="space-y-4">
                {ints.map((q, idx) => {
                  const qNum = idx + 1;
                  return (
                    <div key={idx} className="break-inside-avoid">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-bold">{toBengaliNumerals(qNum)}. </span>
                          <UniversalMathJax inline>{q.q}</UniversalMathJax>
                        </div>
                        <span className="ml-4 font-bold">{toBengaliNumerals(q.marks || 1)}</span>
                      </div>
                      {/* Answer box */}
                      <div className="mt-2 ml-6 border-2 border-gray-400 rounded p-3 min-h-[40px] bg-gray-50">
                        <span className="text-sm text-gray-500">উত্তর: _________________</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* AR (Assertion-Reason) Section */}
          {ars.length > 0 && (
            <>
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 break-inside-avoid mcq-header mt-6">
                <h3>নিশ্চয়তা-কারণ প্রশ্ন (AR)</h3>
                <div className="text-right">
                  <div>মোট নম্বর: {toBengaliNumerals(arTotal)}</div>
                </div>
              </div>
              <div className="mb-4 text-sm bg-gray-50 p-3 border border-gray-300 rounded break-inside-avoid">
                <p className="font-bold mb-1 underline">নির্দেশনা:</p>
                <p className="mb-2">প্রতিটি প্রশ্নে দুটি বিবৃতি দেওয়া আছে - নিশ্চয়তা (A) এবং কারণ (R)। নিচের বিকল্পগুলো থেকে সঠিকটি নির্বাচন করো:</p>
                <div className="grid grid-cols-1 gap-1">
                  <div>১. A এবং R উভয়ই সত্য এবং R হল A এর সঠিক ব্যাখ্যা।</div>
                  <div>২. A এবং R উভয়ই সত্য কিন্তু R হল A এর সঠিক ব্যাখ্যা নয়।</div>
                  <div>৩. A সত্য কিন্তু R মিথ্যা।</div>
                  <div>৪. A মিথ্যা কিন্তু R সত্য।</div>
                  <div>৫. A এবং R উভয়ই মিথ্যা।</div>
                </div>
              </div>
              <div className="space-y-6">
                {ars.map((q, idx) => {
                  const qNum = idx + 1;
                  return (
                    <div key={idx} className="break-inside-avoid">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="font-bold whitespace-nowrap">{toBengaliNumerals(qNum)}.</span>
                            <div>
                              <div className="mb-2"><strong>নিশ্চয়তা (A):</strong> <UniversalMathJax inline>{q.assertion}</UniversalMathJax></div>
                              <div><strong>কারণ (R):</strong> <UniversalMathJax inline>{q.reason}</UniversalMathJax></div>
                            </div>
                          </div>
                        </div>
                        <span className="ml-4 font-bold">{toBengaliNumerals(q.marks || 1)}</span>
                      </div>
                      <div className="mt-3 ml-8 flex gap-4">
                        {[1, 2, 3, 4, 5].map(opt => (
                          <div key={opt} className="flex items-center gap-1 border border-gray-400 px-2 py-1 rounded text-xs">
                            <span className="font-bold">{toBengaliNumerals(opt)}</span>
                            <div className="w-3 h-3 rounded-full border border-black"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
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

          {/* MTF Section */}
          {questions.mtf && questions.mtf.length > 0 && (
            <div className="section mt-6">
              <h2 className="section-title text-lg font-bold border-b-2 border-black pb-1 mb-4 flex justify-between items-center">
                <span>বাম স্তম্ভের সাথে ডান স্তম্ভ মিল করে লেখ:</span>
                {questions.mtf.some(q => q.marks) && (
                  <span className="text-sm font-normal">
                    [মান: {toBengaliNumerals(questions.mtf.reduce((acc, q) => acc + (q.marks || 0), 0))}]
                  </span>
                )}
              </h2>
              {questions.mtf.map((q, qIndex) => (
                <div key={qIndex} className="question mb-6 avoid-break">
                  <div className="grid grid-cols-2 gap-8 border border-black p-4 mt-2">
                    {/* Left Column */}
                    <div className="space-y-2 border-r border-black pr-4">
                      <p className="font-bold text-center border-b border-black pb-1 mb-2">Column A (বাম স্তম্ভ)</p>
                      {q.leftColumn.map((item, i) => (
                        <div key={item.id} className="flex gap-2 text-sm leading-relaxed">
                          <span className="font-bold">{toBengaliNumerals(i + 1)}.</span>
                          <UniversalMathJax>{item.text}</UniversalMathJax>
                        </div>
                      ))}
                    </div>
                    {/* Right Column */}
                    <div className="space-y-2">
                      <p className="font-bold text-center border-b border-black pb-1 mb-2">Column B (ডান স্তম্ভ)</p>
                      {q.rightColumn.map((item, i) => (
                        <div key={item.id} className="flex gap-2 text-sm leading-relaxed">
                          <span className="font-bold">{item.id}.</span>
                          <UniversalMathJax>{item.text}</UniversalMathJax>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
