import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJaxContext } from 'better-react-mathjax';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import Latex from 'react-latex';
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { cleanupMath } from '@/lib/utils';

// --- TYPES ---
interface MCQ {
    id?: string;
    q: string;
    options: { text: string; isCorrect?: boolean }[];
    marks?: number;
    correct?: any;
}
interface CQ {
    id?: string;
    questionText: string;
    marks?: number;
    modelAnswer?: string;
    subQuestions?: {
        id?: string;
        questionText?: string;
        question?: string;
        text?: string;
        answer?: string;
        modelAnswer?: string;
        image?: string;
    }[];
}

interface AR {
    id?: string;
    q?: string;
    assertion: string;
    reason: string;
    marks: number;
    correct: number;
}

interface MTF {
    id: string;
    q: string;
    marks: number;
    pairs: { left: string; right: string }[];
    leftColumn?: { id: string; text: string }[];
    rightColumn?: { id: string; text: string }[];
}

interface INT {
    id: string;
    q: string;
    marks: number;
    answer: number | string;
}
interface SQ {
    id?: string;
    questionText: string;
    marks?: number;
    modelAnswer?: string;
    answer?: string;
}

interface StudentSubmission {
    id: string;
    student: {
        name: string;
        roll: string;
        class?: string;
        section?: string;
    };
    answers: Record<string, any>;
    result?: {
        mcqMarks: number;
        cqMarks: number;
        sqMarks: number;
        total: number;
    };
}

interface MarkedQuestionPaperProps {
    examInfo: {
        schoolName: string;
        schoolAddress: string;
        title: string;
        subject: string;
        class: string;
        date: string;
        set?: string;
        duration?: string;
        logoUrl?: string;
        highestMark?: number | string;
        totalMarks?: string;
        mcqNegativeMarking?: number;
        cqRequiredQuestions?: number;
        sqRequiredQuestions?: number;
        cqSubsections?: any[];
    };
    questions: {
        mcq: MCQ[];
        mc: MCQ[];
        ar: AR[];
        mtf: MTF[];
        int: INT[];
        cq: CQ[];
        sq: SQ[];
    };
    submission: StudentSubmission;
    rank?: number;
    totalStudents?: number;
    qrData: any;
}

const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ'];

const Text = ({ children }: { children: React.ReactNode }) => (
    <div className="inline-block align-middle max-w-full overflow-x-auto custom-mathjax-wrapper">
        <UniversalMathJax inline dynamic>{typeof children === 'string' ? cleanupMath(children) : children}</UniversalMathJax>
    </div>
);

const MarkedQuestionPaper = forwardRef<HTMLDivElement, MarkedQuestionPaperProps>(
    ({ examInfo, questions, submission, rank, totalStudents, qrData }, ref) => {
        const mcqs = questions.mcq || [];
        const cqs = questions.cq || [];
        const sqs = questions.sq || [];

        // Calculate totals
        const mcqTotal = mcqs.reduce((sum, q) => sum + (q.marks || 1), 0);
        const cqRequired = examInfo.cqRequiredQuestions || 0;
        const sqRequired = examInfo.sqRequiredQuestions || 0;

        const cqSorted = [...cqs].sort((a, b) => (b.marks || 0) - (a.marks || 0));
        const sqSorted = [...sqs].sort((a, b) => (b.marks || 0) - (a.marks || 0));
        const cqRequiredMarks = cqSorted.slice(0, cqRequired).reduce((sum, q) => sum + (q.marks || 0), 0);
        const sqRequiredMarks = sqSorted.slice(0, sqRequired).reduce((sum, q) => sum + (q.marks || 0), 0);

        // Negative marking calculation helper
        const negativeRate = examInfo.mcqNegativeMarking ? examInfo.mcqNegativeMarking / 100 : 0;

        const getMCQStatus = (q: MCQ, userAnswer: any) => {
            if (!userAnswer) return 'unanswered';

            // Find correct option
            const correctOption = q.options?.find(opt => opt.isCorrect);
            let isCorrect = false;

            if (correctOption) {
                isCorrect = userAnswer === correctOption.text;
            } else if (q.correct) {
                // Fallback to correct field
                isCorrect = String(q.correct) === String(userAnswer);
            }

            return isCorrect ? 'correct' : 'incorrect';
        };

        const getObtainedMarkRaw = (q: MCQ, status: string, marks: number) => {
            if (status === 'correct') return marks;
            if (status === 'incorrect') return -(marks * negativeRate);
            return 0; // Unanswered
        };

        // Calculate total deducted marks
        let totalDeducted = 0;
        [...mcqs, ...(questions.mc || [])].forEach(q => {
            const ans = submission.answers[q.id || ''];
            // For MC, negative marking logic might be different (partial marks etc)
            // For now, simpler check
            if (q.options?.some(o => o.isCorrect)) {
                const status = getMCQStatus(q, ans);
                if (status === 'incorrect') {
                    totalDeducted += (q.marks || 1) * negativeRate;
                }
            }
        });

        // Safe Date Parsing
        const formatDate = (dateStr: string) => {
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return dateStr; // Return as is if invalid
                return date.toLocaleDateString();
            } catch (e) {
                return dateStr;
            }
        };

        return (
            <div ref={ref} className="question-paper-container bg-white p-8 rounded-lg shadow-lg" style={{ fontFamily: 'SolaimanLipi, Times New Roman, serif' }}>
                {/* Header */}
                <header className="text-center mb-6 relative border-b-2 border-black pb-4">
                    <div className="absolute top-0 right-0 hidden print:block">
                        <QRCode value={JSON.stringify(qrData)} size={64} />
                    </div>
                    {/* Logo if available */}
                    {examInfo.logoUrl && (
                        <div className="flex justify-center mb-2">
                            <img src={examInfo.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold">{examInfo.schoolName}</h1>
                    <p className="text-sm">{examInfo.schoolAddress}</p>
                    <h2 className="mt-2 text-xl font-bold">{examInfo.title}</h2>

                    <div className="mt-4 border-2 border-gray-800 p-3 rounded-md bg-gray-50 print:bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-left space-y-1">
                            <p><strong>Name:</strong> {submission.student.name}</p>
                            <p><strong>ID/Roll:</strong> {submission.student.roll}</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold border-2 border-black rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-1">
                                {Number(submission.result?.total || 0).toFixed(2).replace(/\.00$/, '')}
                            </div>
                            <p className="text-sm font-bold">Total Score</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p>
                                <strong>Score:</strong> {Number(submission.result?.total || 0).toFixed(2).replace(/\.00$/, '')} / {examInfo.totalMarks}
                                {totalDeducted > 0 && <span className="text-red-600 font-bold ml-1">(Deducted: -{totalDeducted.toFixed(2).replace(/\.00$/, '')})</span>}
                            </p>
                            <p><strong>Highest:</strong> {examInfo.highestMark ? Number(examInfo.highestMark).toFixed(2).replace(/\.00$/, '') : 'N/A'}</p>
                            <p><strong>Rank:</strong> {rank ? `${rank}${getOrdinal(rank)}` : 'N/A'}</p>
                        </div>
                    </div>

                    <div className="text-sm flex flex-row justify-center gap-x-6 flex-wrap mt-2 bg-gray-100 p-1 rounded print:bg-transparent">
                        <span><strong>বিষয়:</strong> {examInfo.subject}</span>
                        <span><strong>শ্রেণি:</strong> {examInfo.class}</span>
                        {examInfo.set && <span><strong>সেট:</strong> {examInfo.set}</span>}
                        <span><strong>তারিখ:</strong> {formatDate(examInfo.date)}</span>
                    </div>
                </header>

                {/* Main Content */}
                <main>
                    {/* Objective Questions Section */}
                    {(() => {
                        const allObjective = [
                            ...(questions.mcq || []).map(q => ({ ...q, type: 'MCQ' })),
                            ...(questions.mc || []).map(q => ({ ...q, type: 'MC' })),
                            ...(questions.int || []).map(q => ({ ...q, type: 'INT' })),
                            ...(questions.ar || []).map(q => ({ ...q, type: 'AR' })),
                            ...(questions.mtf || []).map(q => ({ ...q, type: 'MTF' }))
                        ];

                        if (allObjective.length === 0) return null;

                        return (
                            <>
                                <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-6">
                                    <h3>বহুনির্বাচনি/অবজেক্টিভ প্রশ্ন (Objective Questions)</h3>
                                    <div className="text-right">
                                        <span>Marks: {Number(submission.result?.mcqMarks || 0).toFixed(2).replace(/\.00$/, '')} / {mcqTotal}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                    {allObjective.map((q: any, idx) => {
                                        const qNum = idx + 1;
                                        const ans = submission.answers[q.id || ''];

                                        // MCQ / MC Rendering
                                        if (q.type === 'MCQ' || q.type === 'MC') {
                                            const selectedIndices = q.type === 'MC' ? (ans?.selectedOptions || []) : [];
                                            const singleSelected = q.type === 'MCQ' ? ans : null;

                                            const correctIndices = (q.options || []).map((o: any, i: number) => o.isCorrect ? i : -1).filter((i: number) => i !== -1);
                                            const correctText = q.correct || q.options?.find((o: any) => o.isCorrect)?.text;

                                            let isCorrect = false;
                                            if (q.type === 'MCQ') {
                                                isCorrect = String(ans) === String(correctText);
                                            } else {
                                                isCorrect = selectedIndices.length === correctIndices.length && selectedIndices.every((v: number) => correctIndices.includes(v));
                                            }

                                            const statusColor = isCorrect ? 'bg-green-50' : (ans ? 'bg-red-50' : 'bg-gray-50');

                                            return (
                                                <div key={q.id || idx} className={`p-2 rounded border ${statusColor} break-inside-avoid relative`}>
                                                    <div className="flex items-start">
                                                        <span className="font-bold mr-2 text-sm">{qNum}.{q.type === 'MC' ? '*' : ''}</span>
                                                        <div className="flex-1 text-sm">
                                                            <Text>{q.q || q.questionText}</Text>
                                                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                                                {(q.options || []).map((opt: any, oidx: number) => {
                                                                    const isSelected = q.type === 'MC' ? selectedIndices.includes(oidx) : String(singleSelected) === String(opt.text);
                                                                    const isCorrectOpt = opt.isCorrect || String(opt.text) === String(correctText);

                                                                    let optClass = "text-gray-700";
                                                                    if (isSelected) {
                                                                        optClass = isCorrectOpt ? "text-green-700 font-bold" : "text-red-700 font-bold line-through";
                                                                    } else if (isCorrectOpt) {
                                                                        optClass = "text-green-700 font-bold italic underline";
                                                                    }

                                                                    return (
                                                                        <div key={oidx} className={`flex items-center gap-1 px-1 rounded ${optClass}`}>
                                                                            <span className="font-bold">{MCQ_LABELS[oidx]}.</span>
                                                                            <Text>{opt.text}</Text>
                                                                            {isSelected && (isCorrectOpt ? <CheckCircle className="w-3 h-3 ml-1 inline" /> : <XCircle className="w-3 h-3 ml-1 inline" />)}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // AR Rendering
                                        if (q.type === 'AR') {
                                            const selectedOption = Number(ans?.selectedOption || 0);
                                            const correctOption = Number(q.correct || 0);
                                            const isCorrect = selectedOption === correctOption;

                                            return (
                                                <div key={q.id || idx} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : (selectedOption ? 'bg-red-50' : 'bg-gray-50')} break-inside-avoid shadow-sm col-span-full`}>
                                                    <div className="flex items-start">
                                                        <span className="font-bold mr-2 text-sm">{qNum}.</span>
                                                        <div className="flex-1">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                                                <div className="p-2 bg-indigo-50/50 rounded border border-indigo-100">
                                                                    <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Assertion (A)</div>
                                                                    <div className="text-sm"><Text>{q.assertion}</Text></div>
                                                                </div>
                                                                <div className="p-2 bg-purple-50/50 rounded border border-purple-100">
                                                                    <div className="text-[10px] font-bold text-purple-600 uppercase mb-1">Reason (R)</div>
                                                                    <div className="text-sm"><Text>{q.reason}</Text></div>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs flex gap-4 mt-2">
                                                                <div className={`${isCorrect ? 'text-green-700' : 'text-red-700'} font-bold`}>
                                                                    Your: Option {selectedOption || 'N/A'}
                                                                </div>
                                                                <div className="text-green-700 font-bold italic">
                                                                    Correct: Option {correctOption}
                                                                </div>
                                                                {!isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                                                                {isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // MTF Rendering
                                        if (q.type === 'MTF') {
                                            const normalizedMatches = Array.isArray(ans?.matches) ? ans.matches : (Array.isArray(ans) ? ans : []);

                                            return (
                                                <div key={q.id || idx} className="p-3 rounded border border-gray-200 bg-white break-inside-avoid col-span-full">
                                                    <div className="font-bold mb-2 text-sm">{idx + 1}. <Text>{q.q}</Text></div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                                        {q.pairs.map((p: any, pidx: number) => (
                                                            <div key={pidx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs border border-gray-100">
                                                                <div className="font-medium"><Text>{p.left}</Text></div>
                                                                <div className="px-2">→</div>
                                                                <div className="font-medium text-blue-700"><Text>{p.right}</Text></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 text-[10px] text-gray-500 bg-blue-50/50 p-2 rounded italic">
                                                        <strong>Student:</strong> {normalizedMatches.length > 0 ? normalizedMatches.map((m: any) => `${m.leftIndex + 1}→${m.rightIndex + 1}`).join(', ') : 'No matches made'}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // INT Rendering
                                        if (q.type === 'INT') {
                                            const studentVal = ans?.answer !== undefined ? ans.answer : ans;
                                            const isCorrect = String(studentVal) === String(q.answer);

                                            return (
                                                <div key={q.id || idx} className={`p-3 rounded border ${isCorrect ? 'bg-green-50' : (studentVal ? 'bg-red-50' : 'bg-gray-50')} break-inside-avoid shadow-sm`}>
                                                    <div className="flex items-start">
                                                        <span className="font-bold mr-2 text-sm">{qNum}.</span>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-sm mb-1"><Text>{q.q}</Text></div>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <div className="text-xs font-bold">
                                                                    Your: <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{studentVal ?? 'N/A'}</span>
                                                                </div>
                                                                <div className="text-xs font-bold text-green-700 italic">Correct: {q.answer}</div>
                                                                {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            </>
                        );
                    })()}

                    {/* CQ Section */}
                    {cqs.length > 0 && (
                        <>
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-8 break-before-page">
                                <h3>সৃজনশীল প্রশ্ন (CQ)</h3>
                                <div className="text-right">
                                    <span>Marks: {submission.result?.cqMarks || 0} / {cqRequiredMarks}</span>
                                </div>
                            </div>

                            <div>
                                {cqs.map((q, idx) => {
                                    const obtainedMark = submission.answers[`${q.id}_marks`];

                                    return (
                                        <div key={idx} className="mb-6 border-b border-gray-200 pb-4 break-inside-avoid">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-lg flex gap-2">
                                                    <span>{idx + 1}.</span>
                                                    <div className="inline-block"><Text>{q.questionText}</Text></div>
                                                </div>
                                                <div className="bg-gray-100 px-3 py-1 rounded text-sm font-bold whitespace-nowrap">
                                                    {obtainedMark !== undefined ? obtainedMark : 0} / {q.marks || 10}
                                                </div>
                                            </div>

                                            {q.subQuestions && q.subQuestions.map((sub: any, sidx: number) => {
                                                const subId = sub.id || `sub_${q.id}_${sidx}`;
                                                return (
                                                    <div key={sidx} className="ml-6 mt-2 text-sm text-gray-600">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex gap-1">
                                                                <span className="font-bold mr-1">{BENGALI_SUB_LABELS[sidx]}.</span>
                                                                <div className="inline-block"><Text>{sub.questionText || sub.question || sub.text}</Text></div>
                                                            </div>

                                                            {/* Model Answer for CQ Sub-question */}
                                                            {(sub.modelAnswer || sub.answer) && (
                                                                <div className="ml-6 p-1.5 bg-green-50 border border-green-100 rounded text-xs">
                                                                    <span className="text-green-700 font-bold mr-1">Model Answer:</span>
                                                                    <div className="inline-block text-gray-800"><Text>{sub.modelAnswer || sub.answer}</Text></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {sub.image && <img src={sub.image} alt="Sub-question" className="mt-1 h-32 w-auto object-contain border rounded bg-white" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* SQ Section */}
                    {sqs.length > 0 && (
                        <>
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-8 break-before-page">
                                <h3>সংক্ষিপ্ত প্রশ্ন (SQ)</h3>
                                <div className="text-right">
                                    <span>Marks: {submission.result?.sqMarks || 0} / {sqRequiredMarks}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {sqs.map((q, idx) => {
                                    const obtainedMark = submission.answers[`${q.id || ''}_marks`];
                                    const answer = submission.answers[q.id || ''];

                                    return (
                                        <div key={idx} className="mb-4 p-3 border rounded bg-gray-50 break-inside-avoid">
                                            <div className="flex justify-between mb-2">
                                                <div className="font-medium text-sm">
                                                    <span className="font-bold mr-2">{idx + 1}.</span>
                                                    <div className="inline-block"><Text>{q.questionText}</Text></div>
                                                </div>
                                                <div className="font-bold text-sm bg-white px-2 py-1 rounded border">
                                                    {obtainedMark !== undefined ? obtainedMark : 0} / {q.marks}
                                                </div>
                                            </div>

                                            {answer && (
                                                <div className="ml-6 p-2 bg-white rounded border border-gray-200 text-sm">
                                                    <div className="text-xs text-gray-500 mb-1">Student Answer:</div>
                                                    <div className="font-medium text-blue-800">
                                                        <div className="inline-block"><Text>{String(answer)}</Text></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Model Answer for SQ */}
                                            {(q.modelAnswer || q.answer) && (
                                                <div className="ml-6 mt-2 p-2 bg-green-50 rounded border border-green-100 text-sm">
                                                    <div className="text-xs text-green-700 font-bold mb-1">Model Answer:</div>
                                                    <div className="font-medium text-gray-800">
                                                        <div className="inline-block"><Text>{q.modelAnswer || q.answer}</Text></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </main>
            </div>
        );
    }
);

function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

MarkedQuestionPaper.displayName = 'MarkedQuestionPaper';
export default MarkedQuestionPaper;
