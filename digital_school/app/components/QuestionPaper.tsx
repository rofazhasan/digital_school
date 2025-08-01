import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import Latex from 'react-latex';

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

// Helper to chunk an array into N-sized pieces
function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

// Helper to render text with react-latex
const Text = ({ children }: { children: string }) => (
  <Latex>{children}</Latex>
);

// Main QuestionPaper component (forwardRef for printing)
const QuestionPaper = forwardRef<HTMLDivElement, QuestionPaperProps>(
  ({ examInfo, questions, qrData }, ref) => {
    const mcqs = questions.mcq || [];
    const cqs = questions.cq || [];
    const sqs = questions.sq || [];
    
    const mcqTotal = mcqs.reduce((sum, q) => sum + (q.marks || 1), 0);
    const cqTotal = cqs.reduce((sum, q) => sum + (q.marks || 0), 0);
    const sqTotal = sqs.reduce((sum, q) => sum + (q.marks || 0), 0);

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
      <div ref={ref} className="question-paper-container bg-white p-8 rounded-lg shadow-lg font-serif">
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
        </header>

        {/* Main Content */}
        <main>
          {/* MCQ Section */}
          {mcqs.length > 0 && (
            <>
              {/* MCQ Header - only once */}
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 break-inside-avoid">
                <h3>বহুনির্বাচনি প্রশ্ন (MCQ)</h3>
                <span>মোট নম্বর: {mcqTotal}</span>
              </div>
              
              {mcqPages.map((page, pageIdx) => (
                <div key={pageIdx}>
                  {page.isTwoColumn ? (
                    // Two column layout
                    <div className="grid grid-cols-2 gap-x-8">
                      {/* Left Column */}
                      <div>
                        {(page as { left: MCQ[]; right: MCQ[]; isTwoColumn: true }).left.map((q: MCQ, idx: number) => {
                          const globalIdx = pageIdx === 0 ? idx : (pageIdx * 18) + idx;
                          return (
                            <div key={idx} className="mb-2 text-left" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                              <div className="flex items-start">
                                <span className="font-bold mr-2 text-sm">{globalIdx + 1}.</span>
                                <div className="flex-1 text-sm">
                                  <Text>{`${q.q} [${q.marks || 1}]`}</Text>
                                  <div className="mt-1">
                                    {(q.options || []).map((opt: any, oidx: number) => (
                                      <span key={oidx} className="inline-block mr-4 text-xs">
                                        <Text>{`${MCQ_LABELS[oidx]}. ${opt.text}`}</Text>
                                      </span>
                                    ))}
                                  </div>
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
                            <div key={idx} className="mb-2 text-left" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                              <div className="flex items-start">
                                <span className="font-bold mr-2 text-sm">{globalIdx + 1}.</span>
                                <div className="flex-1 text-sm">
                                  <Text>{`${q.q} [${q.marks || 1}]`}</Text>
                                  <div className="mt-1">
                                    {(q.options || []).map((opt: any, oidx: number) => (
                                      <span key={oidx} className="inline-block mr-4 text-xs">
                                        <Text>{`${MCQ_LABELS[oidx]}. ${opt.text}`}</Text>
                                      </span>
                                    ))}
                                  </div>
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
                        <div key={idx} className="mb-2 text-left" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          <div className="flex items-start">
                            <span className="font-bold mr-2 text-sm">{idx + 1}.</span>
                            <div className="flex-1 text-sm">
                              <Text>{`${q.q} [${q.marks || 1}]`}</Text>
                              <div className="mt-1">
                                {(q.options || []).map((opt: any, oidx: number) => (
                                  <span key={oidx} className="inline-block mr-4 text-xs">
                                    <Text>{`${MCQ_LABELS[oidx]}. ${opt.text}`}</Text>
                                  </span>
                                ))}
                              </div>
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

          {/* CQ Section - starts immediately after MCQ */}
          {cqs.length > 0 && (
            <>
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 mt-4">
                <h3>রচনামূলক প্রশ্ন (CQ)</h3>
                <span>মোট নম্বর: {cqTotal}</span>
              </div>
              <div>
                {cqs.map((q, idx) => (
                  <div key={idx} className="mb-3 text-left">
                    <div className="flex items-start">
                      <span className="font-bold mr-2">{idx + 1}.</span>
                      <div className="flex-1">
                        <Text>{`${q.questionText} [${q.marks || 1}]`}</Text>
                        {q.subQuestions && Array.isArray(q.subQuestions) && (
                          <ul className="list-inside mt-1 ml-4">
                            {q.subQuestions.map((sub, sidx) => (
                              <li key={sidx} className="ml-4 flex items-start">
                                <span className="font-bold mr-1">{BENGALI_SUB_LABELS[sidx] || String.fromCharCode(0x0995 + sidx)}.</span>
                                <span className="flex-1">
                                  <Text>
                                    {`${sub.question || sub.questionText || sub.text || sub}${sub.marks ? ` [${sub.marks}]` : ''}`}
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
            </>
          )}

          {/* SQ Section - starts immediately after CQ */}
          {sqs.length > 0 && (
            <>
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 mt-4">
                <h3>সংক্ষিপ্ত প্রশ্ন (SQ)</h3>
                <span>মোট নম্বর: {sqTotal}</span>
              </div>
              <div>
                {sqs.map((q, idx) => (
                  <div key={idx} className="mb-3 text-left">
                    <div className="flex items-start">
                      <span className="font-bold mr-2">{idx + 1}.</span>
                      <div className="flex-1">
                        <Text>{`${q.questionText} [${q.marks || '?'}]`}</Text>
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

QuestionPaper.displayName = 'QuestionPaper';
export default QuestionPaper;
