import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJax } from 'better-react-mathjax';

// --- TYPES ---
interface MCQ {
  q: string;
  options: { text: string }[];
  marks?: number;
  correctAnswer?: string; // The correct option (A, B, C, D or ক, খ, গ, ঘ)
  explanation?: string;
}
interface CQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
  subQuestions?: any[];
  subAnswers?: string[]; // Array of answers for sub-questions
}
interface SQ {
  questionText: string;
  marks?: number;
  modelAnswer?: string;
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

const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ'];
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ'];

// Helper to render text with MathJax
const Text = ({ children }: { children: string }) => (
  <MathJax dynamic>{children}</MathJax>
);

// Main AnswerQuestionPaper component (forwardRef for printing)
const AnswerQuestionPaper = forwardRef<HTMLDivElement, AnswerQuestionPaperProps>(
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
      <div ref={ref} className="answer-paper-container bg-white p-8 rounded-lg shadow-lg" style={{ fontFamily: 'SolaimanLipi, Times New Roman, serif' }}>
        {/* Header */}
        <header className="text-center mb-4 relative border-b-2 border-black pb-2">
          <div className="absolute top-0 right-0">
            <QRCode value={JSON.stringify(qrData)} size={64} />
          </div>
          <h1 className="text-2xl font-bold">{examInfo.schoolName}</h1>
          <p className="text-sm">{examInfo.schoolAddress}</p>
          <h2 className="mt-2 text-xl font-bold">{examInfo.title}</h2>
          <div className="text-sm flex flex-row justify-center gap-x-3 flex-wrap">
            <span><strong>বিষয়:</strong> {examInfo.subject}</span>
            <span><strong>শ্রেণি:</strong> {examInfo.class}</span>
            {examInfo.set && <span><strong>সেট:</strong> {examInfo.set}</span>}
            <span><strong>তারিখ:</strong> {examInfo.date}</span>
            {examInfo.duration && <span><strong>সময়:</strong> {examInfo.duration}</span>}
            {examInfo.totalMarks && <span><strong>পূর্ণমান:</strong> {examInfo.totalMarks}</span>}
          </div>
          <div className="mt-2 text-lg font-bold text-red-600 border-t-2 border-red-600 pt-2">
            উত্তরপত্র (Answer Sheet)
          </div>
        </header>

        {/* Main Content */}
        <main>
          {/* MCQ Section */}
          {mcqs.length > 0 && (
            <>
              {/* MCQ Header - only once */}
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 break-inside-avoid mcq-header">
                <h3>বহুনির্বাচনি প্রশ্নের উত্তর (MCQ Answers)</h3>
                <div className="text-right">
                  <div>মোট নম্বর: {mcqTotal}</div>
                  {examInfo.mcqNegativeMarking && examInfo.mcqNegativeMarking > 0 && (
                    <div className="text-red-600 text-sm">(প্রতিটি ভুল উত্তরের জন্য {examInfo.mcqNegativeMarking}% নম্বর কর্তন করা হবে)</div>
                  )}
                </div>
              </div>

              {mcqPages.map((page, pageIdx) => (
                <div key={pageIdx} className="mcq-page">
                  {page.isTwoColumn ? (
                    // Two column layout
                    <div className="grid grid-cols-2 gap-x-8">
                      {/* Left Column */}
                      <div>
                        {(page as { left: MCQ[]; right: MCQ[]; isTwoColumn: true }).left.map((q: MCQ, idx: number) => {
                          const globalIdx = pageIdx === 0 ? idx : (pageIdx * 18) + idx;
                          return (
                            <div key={idx} className="mb-2 text-left question-block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                              <div className="flex items-start">
                                <span className="font-bold mr-2 text-sm">{globalIdx + 1}.</span>
                                <div className="flex-1 text-sm">
                                  <div className="mb-1">
                                    <span className="text-sm text-gray-600">[{q.marks || '?'} নম্বর]</span>
                                  </div>
                                  <span className="text-red-600 font-bold">
                                    উত্তর: {q.correctAnswer || 'ক'}
                                  </span>
                                  {q.explanation && (
                                    <div className="mt-1 text-black text-xs bg-gray-50 p-1 rounded border border-gray-100">
                                      <span className="font-bold">ব্যাখ্যা:</span> <span>{q.explanation.replace(/^(\*\*Explanation:\*\*|Explanation:)\s*/i, '')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column */}
                      <div>
                        {(page as { left: MCQ[]; right: MCQ[]; isTwoColumn: true }).right.map((q: MCQ, idx: number) => {
                          const globalIdx = pageIdx === 0 ? ((page as { left: MCQ[]; right: MCQ[]; isTwoColumn: true }).left.length + idx) : (pageIdx * 18) + (page as { left: MCQ[]; right: MCQ[]; isTwoColumn: true }).left.length + idx;
                          return (
                            <div key={idx} className="mb-2 text-left question-block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                              <div className="flex items-start">
                                <span className="font-bold mr-2 text-sm">{globalIdx + 1}.</span>
                                <div className="flex-1 text-sm">
                                  <div className="mb-1">
                                    <span className="text-sm text-gray-600">[{q.marks || '?'} নম্বর]</span>
                                  </div>
                                  <span className="text-red-600 font-bold">
                                    উত্তর: {q.correctAnswer || 'ক'}
                                  </span>
                                  {q.explanation && (
                                    <div className="mt-1 text-black text-xs bg-gray-50 p-1 rounded border border-gray-100">
                                      <span className="font-bold">ব্যাখ্যা:</span> <span>{q.explanation.replace(/^(\*\*Explanation:\*\*|Explanation:)\s*/i, '')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // Single column layout
                    <div>
                      {(page as { questions: MCQ[]; isTwoColumn: false }).questions.map((q: MCQ, idx: number) => (
                        <div key={idx} className="mb-2 text-left question-block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          <div className="flex items-start">
                            <span className="font-bold mr-2 text-sm">{idx + 1}.</span>
                            <div className="flex-1 text-sm">
                              <div className="mb-1">
                                <span className="text-sm text-gray-600">[{q.marks || '?'} নম্বর]</span>
                              </div>
                              <span className="text-red-600 font-bold">
                                উত্তর: {q.correctAnswer || 'ক'}
                              </span>
                              {q.explanation && (
                                <div className="mt-1 text-black text-xs bg-gray-50 p-1 rounded border border-gray-100">
                                  <span className="font-bold">ব্যাখ্যা:</span> <span>{q.explanation.replace(/^(\*\*Explanation:\*\*|Explanation:)\s*/i, '')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* CQ Section - starts on new page after MCQ */}
          {cqs.length > 0 && (
            <>
              <div
                className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 mt-4 cq-section section-break"
                style={{
                  pageBreakBefore: 'always',
                  breakBefore: 'page',
                  marginTop: '0',
                  paddingTop: '0'
                }}
              >
                <h3>সৃজনশীল প্রশ্নের উত্তর (CQ Answers)</h3>
                <div className="text-right">
                  <div>সর্বোচ্চ নম্বর: {cqRequiredMarks}</div>
                  {cqRequired > 0 && (
                    <div className="text-sm">(যেকোনো {cqRequired} টি উত্তর করতে হবে)</div>
                  )}
                </div>
              </div>
              <div>
                {cqs.map((q, idx) => (
                  <div key={idx} className="mb-3 text-left cq-question">
                    <div className="flex items-start">
                      <span className="font-bold mr-2">{idx + 1}.</span>
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
                                    <span className="text-sm text-gray-600">[{sub.marks || '?'} নম্বর]</span>
                                  </div>
                                  <Text>
                                    {q.subAnswers && q.subAnswers[sidx] ? q.subAnswers[sidx] : 'উত্তর দেওয়া হবে'}
                                  </Text>
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="ml-4">
                            <Text>
                              {q.modelAnswer || 'উত্তর দেওয়া হবে'}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SQ Section - starts on new page after CQ */}
          {sqs.length > 0 && (
            <>
              <div
                className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 mt-4 sq-section section-break"
                style={{
                  pageBreakBefore: 'always',
                  breakBefore: 'page',
                  marginTop: '0',
                  paddingTop: '0'
                }}
              >
                <h3>সংক্ষিপ্ত প্রশ্নের উত্তর (SQ Answers)</h3>
                <div className="text-right">
                  <div>সর্বোচ্চ নম্বর: {sqRequiredMarks}</div>
                  {sqRequired > 0 && (
                    <div className="text-sm">(যেকোনো {sqRequired} টি উত্তর করতে হবে)</div>
                  )}
                </div>
              </div>
              <div>
                {sqs.map((q, idx) => (
                  <div key={idx} className="mb-3 text-left sq-question">
                    <div className="flex items-start">
                      <span className="font-bold mr-2">{idx + 1}.</span>
                      <div className="flex-1">
                        <div className="text-red-600 font-bold mb-2">
                          উত্তর:
                        </div>
                        <div className="ml-4">
                          <div className="mb-1">
                            <span className="text-sm text-gray-600">[{q.marks || '?'} নম্বর]</span>
                          </div>
                          <Text>
                            {q.modelAnswer || 'উত্তর দেওয়া হবে'}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }
);

AnswerQuestionPaper.displayName = 'AnswerQuestionPaper';
export default AnswerQuestionPaper; 