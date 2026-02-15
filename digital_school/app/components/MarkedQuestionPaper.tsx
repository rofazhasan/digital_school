import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJaxContext } from 'better-react-mathjax';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import Latex from 'react-latex';
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { cleanupMath } from '@/lib/utils';
import { toBengaliNumerals } from "@/utils/numeralConverter";

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
    pairs?: { left: string; right: string }[];
    leftColumn?: { id: string; text: string }[];
    rightColumn?: { id: string; text: string }[];
    matches?: Record<string, string>;
}

interface INT {
    id: string;
    q: string;
    marks: number;
    answer: number | string;
    correctAnswer?: number | string;
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

        const getAROptionText = (opt: number) => {
            const arOptions = [
                "Assertion (A) and Reason (R) are true and (R) is the correct explanation of (A)",
                "Assertion (A) and Reason (R) are true but (R) is NOT the correct explanation of (A)",
                "Assertion (A) is true but Reason (R) is false",
                "Assertion (A) is false but Reason (R) is true"
            ];
            return arOptions[opt - 1] || `Option ${opt}`;
        };

        const getMCQMark = (q: MCQ, userAnswer: any) => {
            if (!userAnswer) return 0;
            const correctText = q.correct || q.options?.find(opt => opt.isCorrect)?.text;
            const isCorrect = String(userAnswer) === String(correctText);
            if (isCorrect) return q.marks || 1;
            return -((q.marks || 1) * negativeRate);
        };

        const getMCMark = (q: MCQ, userAnswer: any) => {
            if (!userAnswer || !userAnswer.selectedOptions || userAnswer.selectedOptions.length === 0) return 0;
            const selected = userAnswer.selectedOptions;

            // Try to get corrects from options or fallback to correct array
            let corrects = (q.options || []).map((o: any, i: number) => o.isCorrect ? i : -1).filter((i: number) => i !== -1);

            // Fallback if options don't have isCorrect but q.correct exists (array of indices)
            if (corrects.length === 0 && Array.isArray(q.correct)) {
                corrects = q.correct.map(Number);
            }

            const totalCorrect = corrects.length;
            if (totalCorrect === 0) return 0;

            const correctSelected = selected.filter((idx: number) => corrects.includes(idx)).length;
            const wrongSelected = selected.filter((idx: number) => !corrects.includes(idx)).length;

            const marks = q.marks || 1;
            const partialMark = (correctSelected / totalCorrect) * marks;
            const penalty = wrongSelected * negativeRate * marks;

            return Math.max(-marks, partialMark - penalty);
        };

        const getARMark = (q: AR, userAnswer: any) => {
            if (!userAnswer || userAnswer.selectedOption === undefined) return 0;
            const selected = Number(userAnswer.selectedOption);
            const correct = Number(q.correct || 0);
            if (selected === correct) return q.marks || 1;
            return -((q.marks || 1) * negativeRate);
        };

        const getINTMark = (q: INT, userAnswer: any) => {
            const val = userAnswer?.answer !== undefined ? userAnswer.answer : userAnswer;
            if (val === undefined || val === null || val === '') return 0;
            const isCorrect = String(val) === String(q.answer);
            if (isCorrect) return q.marks || 1;
            return -((q.marks || 1) * negativeRate);
        };

        const getMTFMark = (q: MTF, userAnswer: any) => {
            try {
                const matches = Array.isArray(userAnswer?.matches) ? userAnswer.matches : (Array.isArray(userAnswer) ? userAnswer : []);

                // 1. New Schema (left/right columns + matches)
                if (q.leftColumn && q.rightColumn) {
                    const stdMatches = userAnswer || {};
                    let score = 0;
                    const totalPairs = q.leftColumn.length;
                    if (totalPairs === 0) return 0;
                    const marksPerPair = (q.marks || 1) / totalPairs;

                    // Normalize student answer check
                    if (!Array.isArray(stdMatches.matches)) {
                        q.leftColumn.forEach((leftItem: any) => {
                            const studentRightId = stdMatches[leftItem.id];
                            // Use correctMatches from q if available, fallback to finding pairs logic if structure implies it
                            const correctMatches = (q.matches || {});
                            const correctRightId = correctMatches[leftItem.id];

                            if (studentRightId && correctRightId && studentRightId === correctRightId) {
                                score += marksPerPair;
                            }
                        });
                        return Number(score.toFixed(2));
                    }
                }

                // 2. Legacy Schema (pairs)
                if (!matches || matches.length === 0) return 0;
                const pairs = q.pairs || [];
                if (pairs.length === 0) return 0;

                let legacyCorrectCount = 0;
                matches.forEach((m: any) => {
                    const leftPart = pairs[m.leftIndex]?.left;
                    const rightPart = pairs[m.rightIndex]?.right;
                    const actualRight = pairs.find(p => p.left === leftPart)?.right;
                    if (rightPart === actualRight) legacyCorrectCount++;
                });

                return Number(((legacyCorrectCount / pairs.length) * (q.marks || 1)).toFixed(2));
            } catch (e) {
                console.error("Error in getMTFMark:", e);
                return 0;
            }
        };
        const formatMark = (m: number) => {
            return Number(m).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
        };

        const MarkDisplay = ({ earned, total }: { earned: number, total: number }) => {
            const colorClass = earned > 0 ? "text-green-700 font-black" : (earned < 0 ? "text-red-700 font-black" : "text-gray-500 font-bold");
            return (
                <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded border border-current bg-white/80 text-[10px] ${colorClass} shadow-sm z-10`}>
                    {earned > 0 ? '+' : ''}{formatMark(earned)}/{total}
                </div>
            );
        };

        // Calculate total deducted marks for header display
        let totalDeducted = 0;
        [...mcqs, ...(questions.mc || []), ...(questions.ar || []), ...(questions.int || [])].forEach(q => {
            const ans = submission.answers[q.id || ''];
            let m = 0;
            if ((q as any).type === 'MCQ') m = getMCQMark(q as MCQ, ans);
            else if ((q as any).type === 'MC') m = getMCMark(q as MCQ, ans);
            else if ((q as any).type === 'AR') m = getARMark(q as AR, ans);
            else if ((q as any).type === 'INT') m = getINTMark(q as INT, ans);

            if (m < 0) totalDeducted += Math.abs(m);
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

                                            const selectedAny = q.type === 'MC' ? (ans?.selectedOptions?.length > 0) : (ans !== undefined && ans !== null && ans !== '');
                                            const m = q.type === 'MC' ? getMCMark(q, ans) : getMCQMark(q, ans);

                                            // Explanation Rendering (Shared Logic for MCQ)
                                            return (
                                                <div key={q.id || idx}>
                                                    <div className={`p-3 rounded border ${selectedAny ? (m > 0 ? (m === q.marks ? 'bg-green-50' : 'bg-yellow-50') : 'bg-red-50') : 'bg-gray-50'} break-inside-avoid shadow-sm relative`}>
                                                        <MarkDisplay earned={m} total={q.marks || 1} />
                                                        <div className="flex items-start mb-2">
                                                            <span className="font-bold mr-2 text-sm">{qNum}.</span>
                                                            <div className="flex-1 font-bold text-sm"><Text>{q.q}</Text></div>
                                                        </div>

                                                        {/* Options Grid */}
                                                        <div className="ml-6 mt-1">
                                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                                {(q.options || []).map((opt: any, oidx: number) => {
                                                                    const isCorrectOpt = opt.isCorrect || (q.correct && q.correct.includes(oidx));
                                                                    const isSelected = ans?.selectedOptions?.includes(oidx);

                                                                    let optClass = "text-gray-600";
                                                                    if (isSelected && isCorrectOpt) {
                                                                        optClass = "text-green-700 font-bold bg-green-100";
                                                                    } else if (isSelected && !isCorrectOpt) {
                                                                        optClass = "text-red-600 font-bold line-through decoration-red-500";
                                                                    } else if (isCorrectOpt) {
                                                                        optClass = "text-green-700 font-bold italic underline decoration-green-500";
                                                                    }

                                                                    return (
                                                                        <div key={oidx} className={`flex items-center gap-1 px-1 rounded ${optClass}`}>
                                                                            <span className="font-bold">{MCQ_LABELS[oidx]}.</span>
                                                                            <Text>{opt.text}</Text>
                                                                            {isSelected && (isCorrectOpt ? <CheckCircle className="w-3 h-3 ml-1 inline text-green-600" /> : <XCircle className="w-3 h-3 ml-1 inline text-red-600" />)}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Explanation */}
                                                    {(q as any).explanation && (
                                                        <div className="mt-1 ml-6 p-2 bg-yellow-50 rounded border border-yellow-200 text-xs break-inside-avoid">
                                                            <div className="font-bold text-yellow-800 mb-1 flex items-center gap-1">
                                                                <span className="bg-yellow-100 px-1 rounded text-[10px]">Explanation</span>
                                                            </div>
                                                            <div className="text-gray-700 pl-2 border-l-2 border-yellow-200">
                                                                <Text>{(q as any).explanation}</Text>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // AR Rendering
                                        if (q.type === 'AR') {
                                            const selectedOption = Number(ans?.selectedOption || 0);
                                            const correctOption = Number(q.correct || 0);
                                            const isCorrect = selectedOption === correctOption;

                                            const qMark = getARMark(q, ans);

                                            return (
                                                <div key={q.id || idx} className="break-inside-avoid col-span-full">
                                                    <div className={`p-4 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : (selectedOption ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200')} shadow-sm relative`}>
                                                        <MarkDisplay earned={qMark} total={q.marks || 1} />
                                                        <div className="flex items-start mb-4">
                                                            <span className="font-bold mr-2 text-sm">{qNum}.</span>
                                                            <div className="flex-1 space-y-3">
                                                                {/* Assertion & Reason Boxes */}
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    <div className="p-2 bg-indigo-50 border-l-4 border-indigo-500 rounded-r">
                                                                        <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Assertion (A)</div>
                                                                        <div className="text-sm font-medium"><Text>{q.assertion}</Text></div>
                                                                    </div>
                                                                    <div className="p-2 bg-purple-50 border-l-4 border-purple-500 rounded-r">
                                                                        <div className="text-[10px] font-bold text-purple-600 uppercase mb-1">Reason (R)</div>
                                                                        <div className="text-sm font-medium"><Text>{q.reason}</Text></div>
                                                                    </div>
                                                                </div>

                                                                {/* Options List */}
                                                                <div className="space-y-1">
                                                                    {[
                                                                        "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা",
                                                                        "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়",
                                                                        "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা",
                                                                        "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক",
                                                                        "Assertion (A) ও Reason (R) উভয়ই মিথ্যা"
                                                                    ].map((optText, i) => {
                                                                        const optionId = i + 1;
                                                                        const isSelected = selectedOption === optionId;
                                                                        const isOptionCorrect = correctOption === optionId;

                                                                        let bgClass = "bg-white border-gray-200";
                                                                        if (isOptionCorrect) bgClass = "bg-green-50 border-green-500 ring-1 ring-green-500";
                                                                        if (isSelected && !isOptionCorrect) bgClass = "bg-red-50 border-red-500 ring-1 ring-red-500";
                                                                        if (isSelected && isOptionCorrect) bgClass = "bg-green-100 border-green-600 ring-2 ring-green-600";

                                                                        return (
                                                                            <div key={i} className={`p-2 rounded border flex items-center gap-2 text-xs ${bgClass}`}>
                                                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${isSelected || isOptionCorrect ? 'bg-white border-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                                                                                    {optionId}
                                                                                </div>
                                                                                <div className={`flex-1 ${isOptionCorrect ? 'font-bold text-green-800' : isSelected ? 'text-red-800' : 'text-gray-700'}`}>
                                                                                    {optText}
                                                                                </div>
                                                                                {isOptionCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                                                                                {isSelected && !isOptionCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Explanation */}
                                                    {(q as any).explanation && (
                                                        <div className="mt-1 ml-6 p-2 bg-yellow-50 rounded border border-yellow-200 text-xs">
                                                            <div className="font-bold text-yellow-800 mb-1 flex items-center gap-1">
                                                                <span className="bg-yellow-100 px-1 rounded text-[10px]">Explanation</span>
                                                            </div>
                                                            <div className="text-gray-700 pl-2 border-l-2 border-yellow-200">
                                                                <Text>{(q as any).explanation}</Text>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // MTF Rendering
                                        if (q.type === 'MTF') {
                                            const normalizedMatches = Array.isArray(ans?.matches) ? ans.matches : (Array.isArray(ans) ? ans : []);
                                            const qMark = getMTFMark(q, ans);

                                            return (
                                                <div key={q.id || idx} className="break-inside-avoid col-span-full">
                                                    <div className="p-4 rounded border border-gray-200 bg-white shadow-sm relative">
                                                        <MarkDisplay earned={qMark} total={q.marks || 1} />
                                                        <div className="font-bold mb-3 text-sm">{idx + 1}. <Text>{q.q}</Text></div>

                                                        {/* MTF Content: Columns + Table */}
                                                        <div className="space-y-6">
                                                            {/* Columns Display */}
                                                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-2 rounded border border-dashed border-gray-200">
                                                                <div className="space-y-2">
                                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1 mb-2">Column A</div>
                                                                    {(q.leftColumn || []).map((item: any, i: number) => (
                                                                        <div key={i} className="p-2 bg-white border rounded text-xs min-h-[36px] flex items-center shadow-sm">
                                                                            <span className="font-bold mr-2 w-5 h-5 flex items-center justify-center bg-gray-100 rounded-full text-[10px] text-gray-600">{i + 1}</span>
                                                                            <Text>{item.text}</Text>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1 mb-2">Column B</div>
                                                                    {(q.rightColumn || []).map((item: any, i: number) => (
                                                                        <div key={i} className="p-2 bg-white border rounded text-xs min-h-[36px] flex items-center shadow-sm">
                                                                            <span className="font-bold mr-2 w-5 h-5 flex items-center justify-center bg-gray-100 rounded-full text-[10px] text-gray-600">{String.fromCharCode(65 + i)}</span>
                                                                            <Text>{item.text}</Text>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Match Analysis Table */}
                                                            <div>
                                                                <div className="text-[10px] font-bold text-indigo-600 uppercase mb-2 flex items-center gap-1">
                                                                    <span>Match Analysis</span>
                                                                    <div className="h-px bg-indigo-100 flex-1"></div>
                                                                </div>
                                                                <div className="rounded border border-gray-200 overflow-hidden">
                                                                    <table className="w-full text-xs">
                                                                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                                                            <tr>
                                                                                <th className="p-2 text-left w-1/3 border-r border-gray-100">Item (Left)</th>
                                                                                <th className="p-2 text-left w-1/3 border-r border-gray-100">Your Match</th>
                                                                                <th className="p-2 text-left w-1/3">Correct Match</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-100">
                                                                            {(q.leftColumn || []).map((lCol: any, cidx: number) => {
                                                                                const correctMatches = (q.matches || {});

                                                                                // Normalize student answer (array vs object)
                                                                                let studentRightId = null;
                                                                                const studentMatches = normalizedMatches || [];

                                                                                if (Array.isArray(studentMatches)) {
                                                                                    const match = studentMatches.find((m: any) => m.leftIndex === cidx || m.leftId === lCol.id);
                                                                                    if (match) studentRightId = match.rightId || q.rightColumn?.[match.rightIndex]?.id;
                                                                                } else {
                                                                                    // Object based matches
                                                                                    studentRightId = (ans?.matches || ans)?.[lCol.id];
                                                                                }

                                                                                // Fallback for simple ID-to-ID if structured columns are missing (Legacy)
                                                                                if (!studentRightId && q.pairs) {
                                                                                    // ... (legacy logic if needed, but we rely on new schema mostly here)
                                                                                }

                                                                                const correctRightId = correctMatches[lCol.id];
                                                                                const rightItem = q.rightColumn?.find((r: any) => r.id === studentRightId);
                                                                                const studentRightIdx = q.rightColumn?.findIndex((r: any) => r.id === studentRightId);

                                                                                const correctRightItem = q.rightColumn?.find((r: any) => r.id === correctRightId);
                                                                                const correctRightIdx = q.rightColumn?.findIndex((r: any) => r.id === correctRightId);

                                                                                const isMatchCorrect = studentRightId === correctRightId && !!studentRightId;
                                                                                const isUnanswered = !studentRightId;

                                                                                // Visual labels
                                                                                const vlLeft = toBengaliNumerals(cidx + 1);
                                                                                const vStudentRight = studentRightIdx !== -1 && studentRightIdx !== undefined ? String.fromCharCode(65 + studentRightIdx) : null;
                                                                                const vCorrectRight = correctRightIdx !== -1 && correctRightIdx !== undefined ? String.fromCharCode(65 + correctRightIdx) : null;

                                                                                return (
                                                                                    <tr key={cidx} className={isMatchCorrect ? "bg-green-50/30" : (isUnanswered ? "bg-white" : "bg-red-50/30")}>
                                                                                        <td className="p-2 border-r border-gray-100 font-medium">
                                                                                            <div className="flex items-center gap-1">
                                                                                                <span className="font-bold text-gray-400 shrink-0">{vlLeft}.</span>
                                                                                                <Text>{lCol.text}</Text>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="p-2 border-r border-gray-100">
                                                                                            {isUnanswered ? <span className="text-gray-400 italic text-[10px]">No match</span> : (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    {isMatchCorrect ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
                                                                                                    <span className={isMatchCorrect ? "text-green-700 font-bold flex items-center gap-1" : "text-red-700 font-bold flex items-center gap-1"}>
                                                                                                        {vStudentRight && <span className="font-bold shrink-0">{vStudentRight}.</span>}
                                                                                                        {rightItem ? <Text>{rightItem.text}</Text> : "Unknown"}
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="p-2 text-green-700 font-bold">
                                                                                            <div className="flex items-center gap-1">
                                                                                                {vCorrectRight && <span className="font-bold shrink-0">{vCorrectRight}.</span>}
                                                                                                {correctRightItem ? <Text>{correctRightItem.text}</Text> : "-"}
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Explanation */}
                                                    {(q as any).explanation && (
                                                        <div className="mt-1 ml-6 p-2 bg-yellow-50 rounded border border-yellow-200 text-xs">
                                                            <div className="font-bold text-yellow-800 mb-1 flex items-center gap-1">
                                                                <span className="bg-yellow-100 px-1 rounded text-[10px]">Explanation</span>
                                                            </div>
                                                            <div className="text-gray-700 pl-2 border-l-2 border-yellow-200">
                                                                <Text>{(q as any).explanation}</Text>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // INT Rendering
                                        if (q.type === 'INT') {
                                            const studentVal = ans?.answer !== undefined ? ans.answer : ans;
                                            const isCorrect = String(studentVal) === String(q.answer);
                                            const qMark = getINTMark(q, ans);

                                            return (
                                                <div key={q.id || idx} className="break-inside-avoid">
                                                    <div className={`p-4 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : (studentVal ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200')} shadow-sm relative`}>
                                                        <MarkDisplay earned={qMark} total={q.marks || 1} />
                                                        <span className="font-bold mr-2 text-sm">{qNum}.</span>
                                                        <div className="font-bold text-sm mb-3 inline-block"><Text>{q.q}</Text></div>

                                                        {/* Comparison Box */}
                                                        <div className="flex bg-white rounded border border-gray-200 overflow-hidden">
                                                            <div className={`w-1.5 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                            <div className="flex-1 grid grid-cols-2 divide-x divide-gray-100">
                                                                <div className="p-2">
                                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Answer</div>
                                                                    <div className={`text-xl font-black ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                                                        {studentVal ?? <span className="text-gray-300 text-sm italic">Empty</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="p-2">
                                                                    <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Correct Key</div>
                                                                    <div className="text-xl font-black text-green-700">
                                                                        {q.correctAnswer || q.answer}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Explanation */}
                                                    {(q as any).explanation && (
                                                        <div className="mt-1 ml-6 p-2 bg-yellow-50 rounded border border-yellow-200 text-xs">
                                                            <div className="font-bold text-yellow-800 mb-1 flex items-center gap-1">
                                                                <span className="bg-yellow-100 px-1 rounded text-[10px]">Explanation</span>
                                                            </div>
                                                            <div className="text-gray-700 pl-2 border-l-2 border-yellow-200">
                                                                <Text>{(q as any).explanation}</Text>
                                                            </div>
                                                        </div>
                                                    )}
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
