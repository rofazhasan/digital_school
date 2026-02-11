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
interface CQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
  subQuestions?: any[];
}
interface SQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
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
    <UniversalMathJax inline>{cleanupMath(children)}</UniversalMathJax>
  </UniversalMathJax>
);

// Main QuestionPaper component (forwardRef for printing)
const QuestionPaper = forwardRef<HTMLDivElement, QuestionPaperProps>(
  ({ examInfo, questions, qrData }, ref) => {
    const mcqs = questions.mcq || [];
    const cqs = questions.cq || [];
    const sqs = questions.sq || [];

    // Calculate total marks for all questions
    const mcqTotal = mcqs.reduce((sum, q) => sum + (q.marks || 1), 0);
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
      <div ref={ref} className="question-paper-container bg-white p-8 rounded-lg shadow-lg relative overflow-hidden" style={{ fontFamily: 'SolaimanLipi, Times New Roman, serif' }}>
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
