import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJaxContext } from 'better-react-mathjax';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath, renderDynamicExplanation } from '@/lib/utils';
import { toBengaliNumerals } from '@/utils/numeralConverter';

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

// Main AnswerQuestionPaper component (forwardRef for printing)
const AnswerQuestionPaper = forwardRef<HTMLDivElement, AnswerQuestionPaperProps>(
  ({ examInfo, questions, qrData }, ref) => {
    const mcqs = questions.mcq || [];
    const mcs = questions.mc || [];
    const ints = questions.int || [];
    const ars = questions.ar || [];
    const cqs = questions.cq || [];
    const sqs = questions.sq || [];
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

    return (
      <div ref={ref} className="answer-paper-container bg-white relative overflow-hidden" style={{ fontFamily: 'SolaimanLipi, Times New Roman, serif' }}>
        <div className="watermark print-only">{examInfo.schoolName}</div>

        {/* Header */}
        <header className="text-center mb-6 relative border-b-4 border-black pb-4 text-black">
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
          <div className="mt-4 text-xl font-bold text-red-600 border-2 border-red-600 inline-block px-4 py-1 rounded shadow-sm">
            উত্তরপত্র (Answer Sheet)
          </div>
        </header>

        {/* Main Content */}
        <main>
          {/* MCQ Section */}
          {allObjective.length > 0 && (
            <>
              {/* MCQ Header - only once */}
              <div className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 break-inside-avoid mcq-header">
                <h3>বহুনির্বাচনি প্রশ্নের উত্তর (Objective Answers)</h3>
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
                      <div key={idx} className="mb-6 text-left question-block break-inside-avoid">
                        <div className="flex items-start">
                          <span className="font-bold mr-2 text-base">
                            {qNum}.{q.type === 'MC' ? '*' : ''}
                          </span>
                          <div className="flex-1 text-base">
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
                              <span className="text-sm text-gray-600 font-medium">[{toBengaliNumerals(q.marks || 1)} নম্বর]</span>
                            </div>
                            <div className="bg-red-50 p-1 border-l-4 border-red-600 inline-block mb-1">
                              <span className="text-red-700 font-bold">
                                উত্তর: {q.type === 'MCQ' ? normalizeAnswer(q.correctAnswer) : (q.options || []).filter((o: any) => o.isCorrect).map((o: any, i: number) => MCQ_LABELS[q.options.indexOf(o)]).join(', ')}
                              </span>
                            </div>
                            {q.explanation && (
                              <div className="mt-1 text-black text-xs bg-gray-50 p-2 rounded border border-gray-200 shadow-sm leading-relaxed">
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
                            <span className="text-xl font-bold text-green-800">{q.modelAnswer}</span>
                          </div>
                        </div>
                        {q.explanation && (
                          <div className="mt-2 ml-6 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs font-bold text-blue-700 mb-1">ব্যাখ্যা:</p>
                            <div className="text-sm text-blue-900">
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
                            <span className="text-sm font-semibold">(A):</span> <UniversalMathJax inline>{q.assertion}</UniversalMathJax>
                            <br />
                            <span className="text-sm font-semibold ml-5">(R):</span> <UniversalMathJax inline>{q.reason}</UniversalMathJax>
                          </div>
                          <span className="ml-4 font-bold">[{toBengaliNumerals(q.marks || 1)}]</span>
                        </div>
                        <div className="mt-2 ml-6 border-2 border-green-600 bg-green-50 rounded p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-700">সঠিক বিকল্প:</span>
                            <span className="text-xl font-bold text-green-800">{toBengaliNumerals(q.correctOption)}</span>
                            <span className="text-sm text-green-600">
                              ({q.correctOption === 1 ? 'A ও R সত্য, R হলো A এর সঠিক ব্যাখ্যা' :
                                q.correctOption === 2 ? 'A ও R সত্য, R হলো A এর সঠিক ব্যাখ্যা নয়' :
                                  q.correctOption === 3 ? 'A সত্য, R মিথ্যা' :
                                    q.correctOption === 4 ? 'A মিথ্যা, R সত্য' : 'উভয়ই মিথ্যা'})
                            </span>
                          </div>
                        </div>
                        {q.explanation && (
                          <div className="mt-2 ml-6 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs font-bold text-blue-700 mb-1">ব্যাখ্যা:</p>
                            <div className="text-sm text-blue-900">
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
                                <span className="text-sm">→</span>
                                <span className="font-bold text-green-700">{vRightLabel}</span>
                                <span className="text-xs text-gray-600 truncate">
                                  (<UniversalMathJax inline>{leftItem?.text || ''}</UniversalMathJax> - <UniversalMathJax inline>{rightItem?.text || ''}</UniversalMathJax>)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <div className="mt-2 ml-6 p-2 bg-blue-50 border border-blue-100 rounded text-sm">
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
            </>
          )}

          {/* CQ Section */}
          {cqs.length > 0 && (
            <>
              <div
                className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 mt-6 cq-section section-break"
              >
                <h3>সৃজনশীল প্রশ্নের উত্তর (CQ Answers)</h3>
                <div className="text-right">
                  <div>সর্বোচ্চ নম্বর: {toBengaliNumerals(cqRequiredMarks)}</div>
                  {cqRequired > 0 && (
                    <div className="text-sm">(যেকোনো {toBengaliNumerals(cqRequired)} টি উত্তর করতে হবে)</div>
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
                                    <span className="text-sm text-gray-600">[{toBengaliNumerals(sub.marks || '?')} নম্বর]</span>
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

          {/* SQ Section */}
          {sqs.length > 0 && (
            <>
              <div
                className="flex justify-between items-center font-bold mb-2 text-lg border-b border-dotted border-black pb-1 mt-6 sq-section section-break"
              >
                <h3>সংক্ষিপ্ত প্রশ্নের উত্তর (SQ Answers)</h3>
                <div className="text-right">
                  <div>সর্বোচ্চ নম্বর: {toBengaliNumerals(sqRequiredMarks)}</div>
                  {sqRequired > 0 && (
                    <div className="text-sm">(যেকোনো {toBengaliNumerals(sqRequired)} টি উত্তর করতে হবে)</div>
                  )}
                </div>
              </div>
              <div>
                {sqs.map((q, idx) => (
                  <div key={idx} className="mb-3 text-left sq-question">
                    <div className="flex items-start">
                      <span className="font-bold mr-2">{toBengaliNumerals(idx + 1)}.</span>
                      <div className="flex-1">
                        <div className="text-red-600 font-bold mb-2">
                          উত্তর:
                        </div>
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
        </main>
      </div>
    );
  }
);

AnswerQuestionPaper.displayName = 'AnswerQuestionPaper';
export default AnswerQuestionPaper; 