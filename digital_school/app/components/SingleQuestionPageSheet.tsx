import React from 'react';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from '@/lib/utils';
import { toBengaliNumerals } from '@/utils/numeralConverter';
import { BeautifulChart } from "@/app/components/BeautifulChart";

interface SingleQuestionPageSheetProps {
  sheetInfo: {
    title: string;
    schoolName?: string;
    schoolAddress?: string;
    class?: string;
    subject?: string;
    date?: string;
    duration?: string;
    totalMarks?: string;
  };
  questions: any[];
  showAnswers?: boolean;
  fontSize?: number;
  language?: 'bn' | 'en';
  showStudentHeader?: boolean;
  watermarkText?: string;
  paperSize?: 'a4' | 'legal' | 'letter';
}

const MCQ_LABELS_BN = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const MCQ_LABELS_EN = ['A', 'B', 'C', 'D', 'E', 'F'];
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ'];
const ENGLISH_SUB_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'];

const MathText = ({ children }: { children: string }) => (
  <span className="whitespace-pre-wrap">
    <UniversalMathJax inline dynamic>
      {cleanupMath(children || "")}
    </UniversalMathJax>
  </span>
);

const QUESTION_TYPE_LABELS_BN: Record<string, string> = {
  MCQ: "বহুনির্বাচনী",
  MC: "বহুপদী বহুনির্বাচনী",
  CQ: "সৃজনশীল",
  SQ: "সংক্ষিপ্ত প্রশ্ন",
  AR: "দৃঢ়োক্তি-কারণ",
  MTF: "মিলকরণ",
  INT: "পূর্ণসংখ্যার উত্তর",
  SMCQ: "উদ্দীপক বহুনির্বাচনী",
  DESCRIPTIVE: "বর্ণনামূলক"
};

const QUESTION_TYPE_LABELS_EN: Record<string, string> = {
  MCQ: "Multiple Choice",
  MC: "Multiple Choice (MC)",
  CQ: "Comprehension (CQ)",
  SQ: "Short Answer",
  AR: "Assertion-Reason",
  MTF: "Matching",
  INT: "Integer Answer",
  SMCQ: "Stem MCQ",
  DESCRIPTIVE: "Descriptive"
};

const getArOptions = (question: any, isBn: boolean) => [
  { text: isBn ? 'Assertion ও Reason উভয়ই সত্য এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা।' : 'Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.', isCorrect: question.correctOption === 0 },
  { text: isBn ? 'Assertion ও Reason উভয়ই সত্য কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়।' : 'Both Assertion and Reason are true, but Reason is not the correct explanation of Assertion.', isCorrect: question.correctOption === 1 },
  { text: isBn ? 'Assertion সত্য কিন্তু Reason মিথ্যা।' : 'Assertion is true but Reason is false.', isCorrect: question.correctOption === 2 },
  { text: isBn ? 'Assertion মিথ্যা কিন্তু Reason সত্য।' : 'Assertion is false but Reason is true.', isCorrect: question.correctOption === 3 },
  { text: isBn ? 'Assertion ও Reason উভয়ই মিথ্যা।' : 'Both Assertion and Reason are false.', isCorrect: question.correctOption === 4 },
];

export default function SingleQuestionPageSheet({
  sheetInfo,
  questions = [],
  showAnswers = false,
  fontSize = 100,
  language = 'bn',
  showStudentHeader = false,
  watermarkText = "",
  paperSize = 'a4'
}: SingleQuestionPageSheetProps) {
  const isBn = language === 'bn';
  const mcqLabels = isBn ? MCQ_LABELS_BN : MCQ_LABELS_EN;
  const subLabels = isBn ? BENGALI_SUB_LABELS : ENGLISH_SUB_LABELS;

  const fontScaleStyle = {
    fontSize: `${(fontSize / 100) * 1.05}rem`,
    lineHeight: 1.6
  };

  const pageMinHeight = paperSize === 'legal' ? 'min-h-[355mm]' : paperSize === 'letter' ? 'min-h-[279mm]' : 'min-h-[297mm]';

  return (
    <div className="w-full text-black print:text-black">
      {questions.map((question: any, idx: number) => {
        const qNum = isBn ? toBengaliNumerals(idx + 1) : (idx + 1).toString();
        const questionMarks = question.customMarks !== undefined ? question.customMarks : (question.marks || (question.type === 'CQ' ? 10 : 1));
        const marksStr = isBn ? toBengaliNumerals(questionMarks) : questionMarks.toString();
        
        const qTypeKey = (question.type || '').toUpperCase();
        const typeLabel = isBn 
          ? (QUESTION_TYPE_LABELS_BN[qTypeKey] || question.type || '')
          : (QUESTION_TYPE_LABELS_EN[qTypeKey] || question.type || '');

        const rawOptions = question.options || [];
        const optionsList = (qTypeKey === 'AR' && (!rawOptions || rawOptions.length < 2))
          ? getArOptions(question, isBn)
          : rawOptions;

        return (
          <div
            key={question.id || `single-q-${idx}`}
            className={`w-full ${pageMinHeight} p-8 md:p-12 bg-white border border-gray-200 print:border-none print:p-6 mb-8 print:mb-0 relative flex flex-col justify-between overflow-hidden`}
            style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
          >
            {/* WATERMARK OVERLAY */}
            {watermarkText && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.06] print:opacity-[0.08] select-none">
                <span className="text-6xl md:text-8xl font-black uppercase tracking-widest text-black -rotate-45 text-center leading-tight">
                  {watermarkText}
                </span>
              </div>
            )}

            {/* Top Sheet Header Banner */}
            <div className="relative z-10">
              <div className="border-b-2 border-black pb-4 mb-4 text-center">
                {sheetInfo.schoolName && (
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-1">
                    {sheetInfo.schoolName}
                  </h1>
                )}
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 print:text-black mb-2">
                  {sheetInfo.title || (isBn ? "প্রশ্ন শীট" : "Question Sheet")}
                </h2>

                <div className="flex flex-wrap justify-between items-center text-xs md:text-sm font-medium text-gray-700 print:text-black px-2 mt-2">
                  <span>
                    <strong>{isBn ? "শ্রেণি: " : "Class: "}</strong>
                    {sheetInfo.class || "—"}
                  </span>
                  <span>
                    <strong>{isBn ? "বিষয়: " : "Subject: "}</strong>
                    {sheetInfo.subject || "—"}
                  </span>
                  <span>
                    <strong>{isBn ? "প্রশ্ন: " : "Question: "}</strong>
                    {qNum} / {isBn ? toBengaliNumerals(questions.length) : questions.length}
                  </span>
                  <span>
                    <strong>{isBn ? "পূর্ণমান: " : "Marks: "}</strong>
                    {marksStr}
                  </span>
                </div>
              </div>

              {/* STUDENT EXAM HEADER BLOCK (If Enabled) */}
              {showStudentHeader && (
                <div className="border border-black rounded-lg p-3 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold print:text-black">
                  <div className="border-b border-dashed border-gray-400 pb-1">
                    <span className="text-gray-500 print:text-black">{isBn ? "পরীক্ষার্থীর নাম: " : "Name: "}</span>
                  </div>
                  <div className="border-b border-dashed border-gray-400 pb-1">
                    <span className="text-gray-500 print:text-black">{isBn ? "রোল / আইডি: " : "Roll / ID: "}</span>
                  </div>
                  <div className="border-b border-dashed border-gray-400 pb-1">
                    <span className="text-gray-500 print:text-black">{isBn ? "শাখা / সেকশন: " : "Section: "}</span>
                  </div>
                  <div className="border-b border-dashed border-gray-400 pb-1">
                    <span className="text-gray-500 print:text-black">{isBn ? "তারিখ: " : "Date: "}</span>
                    {sheetInfo.date || ""}
                  </div>
                </div>
              )}

              {/* TEACHER CUSTOM NOTE PER QUESTION */}
              {question.customNote && (
                <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-xs text-amber-900 print:bg-gray-100 print:border-black font-medium">
                  <strong>💡 {isBn ? "বিশেষ নির্দেশাবলি: " : "Note: "}</strong> {question.customNote}
                </div>
              )}

              {/* Main Question Body */}
              <div className="space-y-6" style={fontScaleStyle}>
                {/* Question Header & Main Text */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                    <span className="font-bold text-lg md:text-xl bg-black text-white px-3 py-1 rounded-md print:bg-black print:text-white">
                      {isBn ? `প্রশ্ন ${qNum}` : `Q${qNum}`}
                    </span>
                    {typeLabel && (
                      <span className="font-bold text-xs uppercase bg-gray-100 text-gray-900 border border-gray-400 px-2.5 py-1 rounded print:border-black print:bg-gray-100 print:text-black">
                        {typeLabel}
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-base md:text-lg flex-1 leading-relaxed pt-0.5">
                    <MathText>{question.questionText || question.q || ""}</MathText>
                  </div>
                  <span className="text-sm font-semibold border border-black px-2.5 py-1 rounded shrink-0">
                    [{marksStr} {isBn ? "নম্বর" : "Marks"}]
                  </span>
                </div>

                {/* Assertion & Reason (AR Type) */}
                {question.type === 'AR' && (
                  <div className="ml-6 space-y-2 p-4 bg-gray-50 border border-gray-200 rounded-lg print:bg-transparent print:border-gray-400">
                    {question.assertion && (
                      <p className="font-medium">
                        <strong>{isBn ? "নিশ্চিতক্তি (Assertion): " : "Assertion: "}</strong>
                        <MathText>{question.assertion}</MathText>
                      </p>
                    )}
                    {question.reason && (
                      <p className="font-medium">
                        <strong>{isBn ? "কারণ (Reason): " : "Reason: "}</strong>
                        <MathText>{question.reason}</MathText>
                      </p>
                    )}
                  </div>
                )}

                {/* Options List (MCQ / AR / SMCQ) */}
                {optionsList.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 mt-4">
                    {optionsList.map((opt: any, optIdx: number) => {
                      const optLabel = mcqLabels[optIdx] || `${optIdx + 1}`;
                      const isCorrect = opt.isCorrect || question.correctOption === optIdx;

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                            showAnswers && isCorrect
                              ? 'bg-green-50 border-green-500 font-semibold print:bg-gray-100 print:border-black'
                              : 'border-gray-200 print:border-gray-300'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${
                            showAnswers && isCorrect
                              ? 'bg-green-600 text-white border-green-600 print:bg-black print:text-white'
                              : 'bg-gray-100 text-gray-800 border-gray-300 print:bg-white print:text-black'
                          }`}>
                            {optLabel}
                          </span>
                          <span className="flex-1 text-sm md:text-base">
                            <MathText>{typeof opt === 'string' ? opt : opt.text || ""}</MathText>
                          </span>
                          {showAnswers && isCorrect && (
                            <span className="text-xs font-bold text-green-700 print:text-black uppercase shrink-0">
                              ✓ {isBn ? "সঠিক উত্তর" : "Correct"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sub Questions (CQ / Descriptive) */}
                {(question.subQuestions || question.sub_questions || question.parts) && (
                  <div className="space-y-4 pl-4 mt-6">
                    {(question.subQuestions || question.sub_questions || question.parts).map((sub: any, subIdx: number) => {
                      const subLabel = subLabels[subIdx] || `${subIdx + 1}`;
                      const subMarks = sub.marks ? (isBn ? toBengaliNumerals(sub.marks) : sub.marks) : '';

                      return (
                        <div key={subIdx} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 print:bg-white print:border-gray-300 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="font-semibold text-base">
                              <span className="inline-block font-bold mr-2 text-indigo-700 print:text-black">
                                ({subLabel})
                              </span>
                              <MathText>{sub.question || sub.questionText || ""}</MathText>
                            </div>
                            {subMarks && (
                              <span className="text-xs font-bold border px-2 py-0.5 rounded bg-white print:bg-transparent shrink-0">
                                {subMarks} {isBn ? "মার্কস" : "marks"}
                              </span>
                            )}
                          </div>

                          {/* Descriptive Fill-in Word Box */}
                          {sub.wordBox && Array.isArray(sub.wordBox) && sub.wordBox.length > 0 && (
                            <div className="p-3 border border-gray-300 rounded bg-white my-2">
                              <p className="text-xs font-bold text-gray-600 mb-1">Word Box:</p>
                              <div className="flex flex-wrap gap-2 text-sm">
                                {sub.wordBox.map((w: string, wi: number) => (
                                  <span key={wi} className="px-2 py-0.5 border rounded bg-gray-100 font-semibold">{w}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Descriptive Table Sub-type */}
                          {sub.tableHeaders && Array.isArray(sub.tableHeaders) && (
                            <div className="my-2 overflow-x-auto">
                              <table className="min-w-full border-collapse border border-gray-300 text-xs">
                                <thead>
                                  <tr className="bg-gray-100">
                                    {sub.tableHeaders.map((h: string, hi: number) => (
                                      <th key={hi} className="border border-gray-300 px-3 py-1 text-left font-bold">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                {sub.tableRows && Array.isArray(sub.tableRows) && (
                                  <tbody>
                                    {sub.tableRows.map((row: string[], ri: number) => (
                                      <tr key={ri}>
                                        {row.map((cell: string, ci: number) => (
                                          <td key={ci} className="border border-gray-300 px-3 py-1"><MathText>{cell}</MathText></td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                )}
                              </table>
                            </div>
                          )}

                          {/* Interpreting Graph Chart Component */}
                          {sub.chartConfig && (
                            <div className="my-3 p-3 border rounded bg-white">
                              <BeautifulChart
                                type={sub.chartConfig.type || 'bar'}
                                title={sub.chartConfig.xAxisLabel ? `${sub.chartConfig.xAxisLabel} vs ${sub.chartConfig.yAxisLabel || ''}` : 'Graph'}
                                data={sub.chartConfig.data?.map((d: any) => ({
                                  label: typeof d === 'string' ? d : d.label || String(d.x || ''),
                                  value: typeof d === 'number' ? d : Number(d.value || d.y || 0)
                                })) || []}
                                isPrint={true}
                              />
                            </div>
                          )}

                          {/* Sub Question Model Answer if showAnswers is true */}
                          {showAnswers && (sub.modelAnswer || sub.explanation) && (
                            <div className="mt-3 pt-3 border-t border-dashed border-gray-300 text-sm bg-green-50/60 p-3 rounded print:bg-gray-100">
                              <p className="font-bold text-green-800 print:text-black mb-1">
                                💡 {isBn ? "উত্তর / সমাধান:" : "Answer / Solution:"}
                              </p>
                              <div className="text-gray-800 print:text-black leading-relaxed">
                                <MathText>{sub.modelAnswer || sub.explanation}</MathText>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Matching Columns (MTF Type) */}
                {question.type === 'MTF' && question.leftColumn && question.rightColumn && (
                  <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg my-4">
                    <div>
                      <h4 className="font-bold text-sm border-b pb-1 mb-2">{isBn ? "কলাম A" : "Column A"}</h4>
                      {question.leftColumn.map((item: any, i: number) => (
                        <div key={i} className="text-sm py-1">
                          <strong>({i + 1})</strong> <MathText>{item.text}</MathText>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm border-b pb-1 mb-2">{isBn ? "কলাম B" : "Column B"}</h4>
                      {question.rightColumn.map((item: any, i: number) => (
                        <div key={i} className="text-sm py-1">
                          <strong>({mcqLabels[i] || i + 1})</strong> <MathText>{item.text}</MathText>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Image if any */}
                {question.images && question.images.length > 0 && (
                  <div className="flex flex-wrap gap-4 justify-center my-4">
                    {question.images.map((img: string, i: number) => (
                      <img key={i} src={img} alt="Question Diagram" className="max-h-64 object-contain rounded border border-gray-300" />
                    ))}
                  </div>
                )}
              </div>

              {/* SOLUTION OR WORKSPACE AREA */}
              <div className="mt-8">
                {showAnswers ? (
                  /* Solution Box when showAnswers is TRUE */
                  <div className="p-6 border-2 border-green-600 rounded-xl bg-green-50/50 print:bg-white print:border-black space-y-3">
                    <div className="flex items-center gap-2 font-bold text-base md:text-lg text-green-900 print:text-black border-b border-green-200 print:border-black pb-2">
                      <span>💡</span>
                      <span>{isBn ? "মডেল উত্তর ও ব্যাখ্যা (Model Answer & Solution):" : "Model Answer & Detailed Solution:"}</span>
                    </div>

                    {question.modelAnswer && (
                      <div className="text-gray-900 print:text-black text-sm md:text-base leading-relaxed">
                        <strong className="block text-xs uppercase font-bold text-green-700 print:text-black mb-1">
                          {isBn ? "উত্তর:" : "Answer:"}
                        </strong>
                        <MathText>{question.modelAnswer}</MathText>
                      </div>
                    )}

                    {question.explanation && (
                      <div className="text-gray-900 print:text-black text-sm md:text-base leading-relaxed pt-2 border-t border-green-200 print:border-gray-300">
                        <strong className="block text-xs uppercase font-bold text-green-700 print:text-black mb-1">
                          {isBn ? "বিস্তারিত ব্যাখ্যা:" : "Detailed Explanation:"}
                        </strong>
                        <MathText>{question.explanation}</MathText>
                      </div>
                    )}

                    {!question.modelAnswer && !question.explanation && (
                      <p className="text-sm text-gray-500 italic">
                        {isBn ? "এই প্রশ্নের কোন অতিরিক্ত ব্যাখ্যা প্রদান করা হয়নি।" : "No explicit detailed explanation provided for this question."}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Student Solution / Workspace Box when showAnswers is FALSE */
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 print:bg-white print:border-gray-400 min-h-[300px] flex flex-col justify-start">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400 print:text-gray-600 uppercase border-b border-dashed border-gray-300 pb-2 mb-4">
                      <span>✍️ {isBn ? "শিক্ষার্থীর সমাধান স্থান (Workspace for Solution)" : "Workspace for Solution"}</span>
                      <span>{isBn ? "পৃষ্ঠা ১" : "Page 1"}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-gray-300 print:text-gray-200 text-sm select-none">
                      {isBn ? "[ এখানে উত্তর লেখার জন্য স্থান বরাদ্দ আছে ]" : "[ Allocated space for solving question ]"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Page Footer */}
            <div className="relative z-10 border-t border-gray-300 pt-3 text-xs text-gray-500 print:text-gray-700 flex justify-between items-center mt-6">
              <span>{sheetInfo.title}</span>
              <span>{isBn ? "পৃষ্ঠা " : "Page "}{qNum} / {isBn ? toBengaliNumerals(questions.length) : questions.length}</span>
              <span>{isBn ? "রফাজ একাডেমি ওয়ার্ল্ড ক্লাস শীট মেকার" : "Rofaz Academy Sheet Maker"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
