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
                    {/* MC Section */}
                    {(questions.mc || []).length > 0 && (
                        <>
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-6">
                                <h3>বহুনির্বাচনি প্রশ্ন (Multiple Correct)</h3>
                                <div className="text-right">
                                    <span>Marks: {questions.mc.length > 0 ? 'Checked' : '0'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                {questions.mc.map((q, idx) => {
                                    const ans = submission.answers[q.id || ''] || {};
                                    const selectedIndices = ans.selectedOptions || [];
                                    const correctIndices = q.options?.map((o, i) => o.isCorrect ? i : -1).filter(i => i !== -1) || [];
                                    const isFullyCorrect = selectedIndices.length === correctIndices.length && selectedIndices.every((v: number) => correctIndices.includes(v));

                                    return (
                                        <div key={idx} className={`mb-2 p-2 rounded border ${isFullyCorrect ? 'bg-green-50 border-green-200' :
                                            selectedIndices.length > 0 ? 'bg-red-50 border-red-200' : 'border-dashed border-gray-300'
                                            } break-inside-avoid relative`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start flex-1 min-w-0">
                                                    <span className="font-bold mr-2 text-sm">{idx + 1}.</span>
                                                    <div className="flex-1 text-sm overflow-hidden">
                                                        <Text>{`${q.q}`}</Text>
                                                        <div className="mt-1 flex flex-wrap gap-2">
                                                            {(q.options || []).map((opt, oidx) => {
                                                                const isSelected = selectedIndices.includes(oidx);
                                                                const isCorrectOption = opt.isCorrect;

                                                                let optionClass = "bg-gray-50 border-gray-200 text-gray-700";
                                                                if (isSelected) {
                                                                    optionClass = isCorrectOption ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600";
                                                                } else if (isCorrectOption) {
                                                                    optionClass = "bg-green-100 text-green-900 border-green-300 ring-1 ring-green-400";
                                                                }

                                                                return (
                                                                    <span key={oidx} className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${optionClass}`}>
                                                                        <span className="font-bold mr-1">{MCQ_LABELS[oidx]}.</span>
                                                                        <Text>{opt.text}</Text>
                                                                        {isSelected && (isCorrectOption ? <CheckCircle className="inline w-3 h-3 ml-1" /> : <XCircle className="inline w-3 h-3 ml-1" />)}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* AR Section */}
                    {(questions.ar || []).length > 0 && (
                        <>
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-6">
                                <h3>Assertion-Reason (AR)</h3>
                            </div>

                            <div className="space-y-4">
                                {questions.ar.map((q, idx) => {
                                    const ans = submission.answers[q.id || ''] || {};
                                    const selectedOption = Number(ans.selectedOption || 0);
                                    const correctOption = Number(q.correct || 0);
                                    const isCorrect = selectedOption === correctOption;

                                    return (
                                        <div key={idx} className={`p-4 rounded border ${isCorrect ? 'bg-green-50' : 'bg-red-50'} break-inside-avoid shadow-sm`}>
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="font-bold">Q{idx + 1}. AR Question</span>
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-white border">{isCorrect ? 'Correct' : 'Incorrect'}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                <div className="p-2 bg-indigo-50 rounded border border-indigo-100">
                                                    <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Assertion (A)</div>
                                                    <div className="text-sm"><Text>{q.assertion}</Text></div>
                                                </div>
                                                <div className="p-2 bg-purple-50 rounded border border-purple-100">
                                                    <div className="text-[10px] font-bold text-purple-600 uppercase mb-1">Reason (R)</div>
                                                    <div className="text-sm"><Text>{q.reason}</Text></div>
                                                </div>
                                            </div>
                                            <div className="text-xs">
                                                <span className="font-bold">Your Selection:</span> Option {selectedOption || 'N/A'}
                                                <span className="mx-2">|</span>
                                                <span className="font-bold">Correct:</span> Option {correctOption}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* MTF Section */}
                    {(questions.mtf || []).length > 0 && (
                        <>
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-6">
                                <h3>Match the Following (MTF)</h3>
                            </div>

                            <div className="space-y-4">
                                {questions.mtf.map((q, idx) => {
                                    const ans = submission.answers[q.id] || {};
                                    const studentMatches = ans.matches || ans;
                                    let normalizedMatches: any[] = [];
                                    if (Array.isArray(studentMatches)) {
                                        normalizedMatches = studentMatches;
                                    } else if (studentMatches && typeof studentMatches === 'object' && studentMatches.matches) {
                                        normalizedMatches = studentMatches.matches;
                                    } else if (studentMatches && typeof studentMatches === 'object' && !studentMatches.matches) {
                                        Object.entries(studentMatches).forEach(([leftId, rightId]) => {
                                            const leftIndex = q.leftColumn?.findIndex((l: any) => l.id === leftId);
                                            const rightIndex = q.rightColumn?.findIndex((r: any) => r.id === rightId);
                                            if (leftIndex !== -1 && rightIndex !== -1) {
                                                normalizedMatches.push({ leftIndex, rightIndex });
                                            }
                                        });
                                    }

                                    return (
                                        <div key={idx} className="p-4 rounded border border-gray-200 bg-white break-inside-avoid">
                                            <div className="font-bold mb-2">{idx + 1}. <Text>{q.q}</Text></div>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {q.pairs.map((p, pidx) => (
                                                    <div key={pidx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs border border-gray-100">
                                                        <div className="font-medium"><Text>{p.left}</Text></div>
                                                        <div className="px-2">→</div>
                                                        <div className="font-medium text-blue-700"><Text>{p.right}</Text></div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 text-[10px] text-gray-500 bg-blue-50 p-2 rounded">
                                                <strong>Student Matchings:</strong> {normalizedMatches.length > 0 ? normalizedMatches.map((m: any) => `${m.leftIndex + 1}→${m.rightIndex + 1}`).join(', ') : 'No matches made'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* INT Section */}
                    {(questions.int || []).length > 0 && (
                        <>
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-6">
                                <h3>Integer/Numeric Questions</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {questions.int.map((q, idx) => {
                                    const ans = submission.answers[q.id] || {};
                                    const studentVal = ans.answer;
                                    const isCorrect = Number(studentVal) === Number(q.answer);

                                    return (
                                        <div key={idx} className={`p-4 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} break-inside-avoid shadow-sm`}>
                                            <div className="font-bold text-sm mb-1">{idx + 1}. <Text>{q.q}</Text></div>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="text-xs"><span className="font-bold">Your Val:</span> {studentVal ?? 'N/A'}</div>
                                                <div className="text-xs"><span className="font-bold">Correct:</span> {q.answer}</div>
                                                {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
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
