import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJaxContext } from 'better-react-mathjax';
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import Latex from 'react-latex';
import { CheckCircle, XCircle, MinusCircle, Check, X, BookOpen, Info } from "lucide-react";
import { cleanupMath, renderDynamicExplanation } from '@/lib/utils';
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
        // Advanced Descriptive Fields
        subType?: string;
        studentAnswer?: any;
        studentImages?: string[];
        items?: any[];
        clues?: string[];
        leftColumn?: any[];
        rightColumn?: any[];
        matches?: Record<string, string>;
        statements?: string[];
        labels?: any[];
        clueType?: string;
        wordBox?: string[];
        passage?: string;
        answers?: string[];
    }[];
}
interface SQ {
    id?: string;
    questionText: string;
    marks?: number;
    modelAnswer?: string;
    answer?: string;
    // Advanced Descriptive Fields
    subType?: string;
    studentAnswer?: any;
    studentImages?: string[];
    items?: any[];
    clues?: string[];
    leftColumn?: any[];
    rightColumn?: any[];
    matches?: Record<string, string>;
    correctAnswer?: any;
    explanation?: string;
    clueType?: string;
    wordBox?: string[];
    passage?: string;
    answers?: string[];
}

interface AR {
    id?: string;
    q?: string;
    assertion: string;
    reason: string;
    marks: number;
    correct: number;
    correctOption?: number;
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
    modelAnswer?: number | string;
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
        smcq?: any[];
        descriptive?: CQ[];
    };
    submission: StudentSubmission;
    rank?: number;
    totalStudents?: number;
    qrData: any;
}

const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ'];

const Text = ({ children }: { children: React.ReactNode }) => {
    const content = typeof children === 'string' ? children.replace(/\|\|/g, '\n') : children;
    return (
        <div className="inline-block align-middle max-w-full overflow-x-auto custom-mathjax-wrapper whitespace-pre-wrap break-words">
            <UniversalMathJax inline dynamic>{typeof content === 'string' ? cleanupMath(content) : content}</UniversalMathJax>
        </div>
    );
};

const MarkedQuestionPaper = forwardRef<HTMLDivElement, MarkedQuestionPaperProps>(
    ({ examInfo, questions, submission, rank, totalStudents, qrData }, ref) => {
        // Calculate totals for all objective types
        const mcqs = questions.mcq || [];
        const mcs = questions.mc || [];
        const ars = questions.ar || [];
        const ints = questions.int || [];
        const mtfs = questions.mtf || [];

        const objectiveTotal = [
            ...mcqs, ...mcs, ...ars, ...ints, ...mtfs
        ].reduce((sum, q) => sum + (q.marks || 1), 0);

        const cqs = questions.cq || [];
        const sqs = questions.sq || [];
        const smcqs = questions.smcq || [];
        const descriptives = questions.descriptive || [];
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
            const selected = Number(userAnswer?.selectedOption ?? (typeof userAnswer === 'number' ? userAnswer : 0));
            const correct = Number(q.correct || q.correctOption || 0);
            if (selected === 0 || correct === 0) return 0;
            if (selected === correct) return q.marks || 1;
            return -((q.marks || 1) * negativeRate);
        };

        const getINTMark = (q: INT, userAnswer: any) => {
            const studentValRaw = userAnswer?.answer !== undefined ? userAnswer.answer : userAnswer;
            if (studentValRaw === undefined || studentValRaw === null || studentValRaw === '') return 0;
            const studentVal = parseInt(String(studentValRaw).trim());
            const correctVal = parseInt(String(q.answer || q.correctAnswer || q.modelAnswer || '0').trim());

            if (isNaN(studentVal)) return 0;
            if (studentVal === correctVal) return q.marks || 1;

            return -((q.marks || 1) * negativeRate);
        };

        const getMTFMark = (q: MTF, userAnswer: any) => {
            try {
                // 1. New Schema (left/right columns + matches)
                if (q.leftColumn && q.rightColumn) {
                    const stdMatches = userAnswer || {};
                    let score = 0;
                    const totalPairs = q.leftColumn.length;
                    if (totalPairs === 0) return 0;
                    const marksPerPair = (q.marks || 1) / totalPairs;

                    // Normalize student answer check
                    const matchesObj = stdMatches.matches || stdMatches;
                    q.leftColumn.forEach((leftItem: any) => {
                        const studentRightId = matchesObj[leftItem.id];
                        const correctMatches = (q.matches || {});
                        const correctRightId = correctMatches[leftItem.id];

                        if (studentRightId && correctRightId && studentRightId === correctRightId) {
                            score += marksPerPair;
                        }
                    });
                    return Number(score.toFixed(2));
                }

                // 2. Legacy Schema (pairs)
                const matches = Array.isArray(userAnswer?.matches) ? userAnswer.matches : (Array.isArray(userAnswer) ? userAnswer : []);
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

        const getSMCQMark = (q: any, studentAnswer: any) => {
            if (!q.subQuestions || q.subQuestions.length === 0) return 0;
            let totalObtained = 0;
            q.subQuestions.forEach((sub: any, idx: number) => {
                const subAns = studentAnswer?.[idx] || (typeof studentAnswer === 'object' ? studentAnswer[sub.id] : null);
                if (!subAns) return;
                const correctText = sub.correct || sub.options?.find((opt: any) => opt.isCorrect)?.text;
                if (String(subAns).trim() === String(correctText).trim()) {
                    totalObtained += (sub.marks || 1);
                } else {
                    totalObtained -= ((sub.marks || 1) * negativeRate);
                }
            });
            return totalObtained;
        };

        const formatMark = (m: number) => {
            return Number(m).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
        };

        // Helper to render advanced descriptive sub-questions for Print
        const renderSubQuestionCore = (subQ: any, subIdx: number, questionId: string) => {
            const subType = subQ.subType || 'writing';
            const studentAnswer = subQ.studentAnswer;
            const normalize = (s: any) => String(s || '').trim().toLowerCase();

            const getVal = (key: string) => (typeof studentAnswer === 'object' && studentAnswer !== null) ? studentAnswer[key] : null;

            switch (subType) {
                case 'flowchart':
                    return (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                            {(subQ.items || []).map((item: string, ii: number) => (
                                <div key={ii} className="p-1 border border-slate-200 rounded">
                                    <div className="font-bold text-slate-400 mb-1">Step {ii + 1}</div>
                                    <div className="flex flex-col gap-1">
                                        {item.split('___').map((seg, si, arr) => {
                                            const val = getVal(`flow_${ii}_${si}`) || (typeof studentAnswer === 'string' ? null : studentAnswer?.[`flow_${ii}_${si}`]);
                                            return (
                                                <div key={si}>
                                                    <div className="italic text-slate-500"><Text>{seg}</Text></div>
                                                    {si < arr.length - 1 && (
                                                        <div className="mt-0.5 p-1 border border-indigo-200 rounded font-bold bg-slate-50">
                                                            {val || <span className="text-slate-300">Missing</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );

                case 'fill_in':
                    const isBoxType = subQ.clueType === 'box';
                    const clues = subQ.wordBox || subQ.clues || [];
                    
                    return (
                        <div className="mt-2 p-3 border border-slate-300 rounded bg-slate-50/30 text-[10px] text-left">
                            {clues.length > 0 && (
                                <div className={`mb-3 p-2 ${isBoxType ? 'border-2 border-slate-800 bg-white' : 'border border-dashed border-slate-300'} rounded`}>
                                    <div className="text-[7px] font-black text-slate-500 uppercase mb-1 tracking-widest text-center border-b border-slate-100 pb-1">
                                        {isBoxType ? 'Suitable Word Box' : 'Available Clues'}
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                                        {clues.map((c: string, ci: number) => (
                                            <span key={ci} className="font-bold text-slate-800 px-1 italic">
                                                <UniversalMathJax inline dynamic>{cleanupMath(c)}</UniversalMathJax>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="leading-relaxed text-slate-900">
                                {(subQ.passage || subQ.questionText || "").split('___').map((part: string, pi: number, arr: any[]) => {
                                    const val = getVal(pi.toString()) || (typeof studentAnswer === 'string' ? null : studentAnswer?.[pi]);
                                    const correct = subQ.answers?.[pi];
                                    const isCorrect = normalize(val) === normalize(correct);
                                    
                                    return (
                                        <span key={pi}>
                                            <UniversalMathJax inline dynamic>{cleanupMath(part.replace(/\|\|/g, '\n'))}</UniversalMathJax>
                                            {pi < arr.length - 1 && (
                                                <span className={`mx-1 px-2 border-b-2 font-black ${val ? (isCorrect ? 'border-green-600 text-green-700 bg-green-50/50' : 'border-red-600 text-red-700 bg-red-50/50') : 'border-indigo-500 text-indigo-700 bg-indigo-50/50'} rounded-t-sm`}>
                                                    {val || '__________'}
                                                    {!isCorrect && correct && <span className="ml-1 text-[7px] text-green-700 opacity-70">[{correct}]</span>}
                                                </span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    );

                case 'matching':
                    const cols = [
                        { label: 'Col A', data: subQ.leftColumn },
                        { label: 'Col B', data: subQ.rightColumn },
                        { label: 'Col C', data: subQ.columnC },
                        { label: 'Col D', data: subQ.columnD }
                    ].filter(c => c.data && c.data.length > 0);

                    return (
                        <div className="mt-2 border border-slate-200 rounded overflow-hidden">
                            <table className="w-full text-[8px] border-collapse">
                                <thead className="bg-slate-100 border-b border-slate-200">
                                    <tr>
                                        {cols.map((c, ci) => <th key={ci} className="p-0.5 text-left border-r border-slate-200">{c.label}</th>)}
                                        <th className="p-0.5 text-left bg-indigo-50/30">Student Match</th>
                                        <th className="p-0.5 text-left bg-green-50/30">Correct Key</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subQ.leftColumn?.map((l: any, i: number) => {
                                        const studentMatchStr = typeof studentAnswer === 'string' ? studentAnswer : (studentAnswer?.match || '');
                                        const pairs = studentMatchStr?.split(/[,;]/).map((p: string) => p.trim());
                                        const ansIdStr = pairs?.find((p: string) => p.startsWith(`${l.id}-`));
                                        
                                        const correctIdStr = subQ.matches?.[l.id];
                                        const isCorrect = normalize(ansIdStr) === normalize(correctIdStr);
                                        
                                        const getItemText = (matchStr: string) => {
                                            if (!matchStr) return null;
                                            const parts = matchStr.split('-');
                                            return parts.map((pid, idx) => {
                                                const colKey = ['leftColumn', 'rightColumn', 'columnC', 'columnD'][idx];
                                                const item = subQ[colKey]?.find((r: any) => r.id === pid);
                                                const itemId = item?.id || pid;
                                                return item ? (idx > 0 ? `→${itemId}` : itemId) : itemId;
                                            }).join('');
                                        };

                                        return (
                                            <tr key={i} className={`border-b border-slate-100 ${isCorrect ? 'bg-green-50/10' : 'bg-red-50/10'}`}>
                                                {cols.map((c, ci) => (
                                                    <td key={ci} className="p-0.5 border-r border-slate-200">
                                                        <span className="font-bold text-slate-400 mr-0.5 leading-none">{c.data[i]?.id}.</span>
                                                        <span className="leading-tight"><Text>{c.data[i]?.text || '-'}</Text></span>
                                                    </td>
                                                ))}
                                                <td className={`p-0.5 border-r border-slate-200 font-black leading-tight ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                                    {ansIdStr ? getItemText(ansIdStr) : 'None'}
                                                </td>
                                                <td className="p-0.5 text-green-700 font-black leading-tight">
                                                    {correctIdStr ? getItemText(correctIdStr) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {typeof studentAnswer === 'string' && (
                                <div className="p-1 bg-slate-50 text-[7px] text-slate-400 font-mono italic border-t border-slate-100">
                                    Raw: {studentAnswer}
                                </div>
                            )}
                        </div>
                    );

                case 'table':
                    return (
                        <div className="mt-2 border border-slate-200 rounded overflow-hidden">
                            <table className="w-full text-[8px] border-collapse bg-white">
                                <thead className="bg-slate-100 border-b border-slate-200">
                                    <tr>
                                        {(subQ.tableHeaders || []).map((h: string, hi: number) => (
                                            <th key={hi} className="p-1 text-left border-r border-slate-200"><Text>{h}</Text></th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(subQ.tableRows || []).map((row: string[], ri: number) => (
                                        <tr key={ri} className="border-b border-slate-100">
                                            {(subQ.tableHeaders || []).map((_: string, ci: number) => {
                                                const isBlank = !row[ci] || row[ci] === '___';
                                                const val = getVal(`${ri}_${ci}`);
                                                return (
                                                    <td key={ci} className="p-1 border-r border-slate-200">
                                                        {isBlank ? (
                                                            <span className="font-bold text-indigo-700 bg-indigo-50/50 px-1 py-0.5 rounded border border-indigo-100">{val || '___'}</span>
                                                        ) : (
                                                            <span className="text-slate-600"><Text>{row[ci]}</Text></span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );

                case 'rearranging':
                    const orderAns = getVal('order');
                    return (
                        <div className="mt-2 p-2 border border-slate-200 rounded bg-slate-50 text-[10px] text-left">
                            <div className="font-bold text-slate-500 mb-1">Student Sequence:</div>
                            <div className="font-black text-indigo-700 bg-white p-1 border border-indigo-100 rounded inline-block uppercase tracking-widest">{orderAns || 'None Provided'}</div>
                            {subQ.correctOrder && (
                                <div className="mt-2 font-bold text-slate-500">Correct Sequence: <span className="text-green-600 ml-1">{subQ.correctOrder.join(', ')}</span></div>
                            )}
                        </div>
                    );

                case 'true_false':
                    return (
                        <div className="mt-2 space-y-1">
                            {(subQ.statements || []).map((stmt: string, sIdx: number) => {
                                const ans = getVal(sIdx.toString());
                                const correctAns = subQ.correctAnswers?.[sIdx] ? "True" : "False";
                                const isCorrectStr = normalize(ans) === normalize(correctAns);
                                return (
                                    <div key={sIdx} className="flex justify-between items-center p-1 border border-slate-200 rounded bg-white text-[9px] text-left">
                                        <div className="flex gap-1 flex-1 pr-2">
                                            <span className="font-bold text-slate-400">{sIdx + 1}.</span>
                                            <span className="text-slate-700 leading-snug"><Text>{stmt}</Text></span>
                                        </div>
                                        <div className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] ${isCorrectStr ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} border`}>
                                            {ans || 'Missing'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );

                case 'label_diagram':
                    return (
                        <div className="mt-2 p-2 border border-slate-200 rounded bg-white flex flex-col items-center">
                            {subQ.imageUrl && (
                                <div className="relative border border-slate-200 p-1 mb-2 bg-slate-50 rounded">
                                    <img src={subQ.imageUrl} alt="Diagram" className="max-w-full max-h-32 object-contain mx-auto" style={{ height: '120px' }} />
                                    <div className="absolute inset-0 pointer-events-none">
                                        {(subQ.labels || []).map((l: any, i: number) => (
                                            <div key={i} className="absolute w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center text-[6px] font-black border border-white" style={{ top: `${l.y}%`, left: `${l.x}%`, transform: 'translate(-50%, -50%)' }}>
                                                {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 w-full text-[8px] text-left">
                                {(subQ.labels || []).map((l: any, i: number) => {
                                    const ans = getVal(i.toString());
                                    const isCorrectStr = normalize(ans) === normalize(l.text);
                                    return (
                                        <div key={i} className="flex items-center gap-1 p-1 bg-slate-50 rounded border border-slate-200">
                                            <span className="shrink-0 w-3 h-3 bg-slate-200 rounded-full flex items-center justify-center font-bold text-[6px] text-slate-500">{i + 1}</span>
                                            <span className={`font-bold ${isCorrectStr ? 'text-green-700' : 'text-red-700'}`}>{ans || '___'}</span>
                                            {(!isCorrectStr && l.text) && <span className="text-slate-400"> (Key: {l.text})</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );

                default:
                    return (
                        <div className="space-y-2">
                            {studentAnswer && (
                                <div className="mt-2 p-2 border border-slate-200 rounded bg-white text-xs">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div> Student Response:
                                    </div>
                                    <Text>{typeof studentAnswer === 'string' ? studentAnswer : JSON.stringify(studentAnswer)}</Text>
                                </div>
                            )}

                            {Array.isArray(subQ.studentImages) && subQ.studentImages.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1 p-1 border border-dashed border-slate-200 rounded bg-slate-50/50">
                                    <div className="w-full text-[7px] font-bold text-slate-400 uppercase mb-1">Attachments ({subQ.studentImages.length})</div>
                                    {subQ.studentImages.slice(0, 4).map((imgUrl: string, idx: number) => (
                                        <div key={idx} className="w-12 h-12 border border-slate-200 rounded bg-white overflow-hidden">
                                            <img src={imgUrl} alt="Sub" className="w-full h-full object-cover grayscale opacity-70" />
                                        </div>
                                    ))}
                                    {subQ.studentImages.length > 4 && <div className="text-[7px] flex items-center text-slate-400">+{subQ.studentImages.length - 4} more</div>}
                                </div>
                            )}
                        </div>
                    );
            }
        };

        // Main sub-question renderer with model answer/explanation wrapper
        const renderSubQuestion = (subQ: any, subIdx: number, questionId: string) => {
            return (
                <div className="mb-4 last:mb-0">
                    <div className="flex items-start gap-2 mb-2">
                        <div className="mt-1 w-4 h-4 bg-slate-900 text-white rounded-full flex items-center justify-center text-[8px] font-black shrink-0">
                            {toBengaliNumerals(subIdx + 1)}
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold leading-tight">
                                <UniversalMathJax inline dynamic>{cleanupMath((subQ.text || subQ.question || subQ.questionText || '').replace(/\|\|/g, '\n'))}</UniversalMathJax>
                                <span className="ml-1 text-[8px] text-slate-400 uppercase tracking-tighter">[{subQ.marks || 0}]</span>
                            </div>
                            
                            {renderSubQuestionCore(subQ, subIdx, questionId)}

                            {(subQ.modelAnswer || subQ.answer || subQ.correctAnswer) && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded text-[8px] text-green-800">
                                    <div className="font-bold uppercase flex items-center gap-1 opacity-70 mb-0.5">
                                        <BookOpen className="w-2 h-2" /> Model Answer / Key
                                    </div>
                                    <UniversalMathJax dynamic inline>{cleanupMath((subQ.modelAnswer || subQ.answer || subQ.correctAnswer || '').replace(/\|\|/g, '\n'))}</UniversalMathJax>
                                </div>
                            )}

                            {subQ.explanation && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-[8px] text-blue-800">
                                    <div className="font-bold uppercase flex items-center gap-1 opacity-70 mb-0.5">
                                        <Info className="w-2 h-2" /> Explanation
                                    </div>
                                    <UniversalMathJax dynamic inline>{cleanupMath(subQ.explanation.replace(/\|\|/g, '\n'))}</UniversalMathJax>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
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
        [...mcqs, ...(questions.mc || []), ...(questions.ar || []), ...(questions.int || []), ...(questions.mtf || [])].forEach(q => {
            const ans = submission.answers[q.id || ''];
            let m = 0;
            const type = (q as any).type?.toUpperCase();
            if (type === 'MCQ') m = getMCQMark(q as MCQ, ans);
            else if (type === 'MC') m = getMCMark(q as MCQ, ans);
            else if (type === 'AR') m = getARMark(q as AR, ans);
            else if (type === 'INT') m = getINTMark(q as INT, ans);
            else if (type === 'MTF') m = getMTFMark(q as MTF, ans);

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
            <div ref={ref} className="question-paper-container bg-white text-slate-900 p-4 md:p-8 rounded-lg shadow-lg dark:bg-white dark:text-slate-900 print:shadow-none print:p-0" style={{ fontFamily: 'SolaimanLipi, Times New Roman, serif' }}>
                {/* Header */}
                <header className="text-center mb-10 relative border-b-4 border-slate-900 pb-6">
                    <div className="absolute top-0 right-0 hidden print:block bg-white p-1">
                        <QRCode value={JSON.stringify(qrData)} size={80} />
                    </div>
                    {/* Logo if available */}
                    {examInfo.logoUrl && (
                        <div className="flex justify-center mb-4">
                            <img src={examInfo.logoUrl} alt="Logo" className="h-20 w-auto object-contain" />
                        </div>
                    )}
                    <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight text-slate-900">{examInfo.schoolName}</h1>
                    <p className="text-[10px] md:text-sm font-medium text-slate-600 uppercase tracking-widest mt-1">{examInfo.schoolAddress}</p>

                    <div className="mt-6 inline-block bg-slate-900 text-white px-6 py-1 rounded-full text-sm font-bold uppercase tracking-tighter">
                        {examInfo.title}
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 items-center gap-6 border-2 border-slate-200 p-6 rounded-2xl bg-slate-50/50 print:bg-white relative overflow-hidden">
                        {/* Decorative background element for print */}
                        <div className="absolute top-0 left-0 w-2 h-full bg-slate-900"></div>

                        <div className="text-left space-y-2 md:text-left text-center">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Candidate Name</label>
                                <p className="text-base md:text-lg font-bold text-slate-900">{submission.student.name}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">ID / Roll Number</label>
                                <p className="text-xs md:text-sm font-bold text-slate-600">{submission.student.roll}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center py-2">
                            <div className="relative">
                                <div className="text-2xl md:text-4xl font-black border-[4px] md:border-[6px] border-slate-900 rounded-full w-20 h-20 md:w-28 md:h-28 flex items-center justify-center bg-white shadow-xl z-10 relative">
                                    {Number(submission.result?.total || 0).toFixed(2).replace(/\.00$/, '')}
                                </div>
                                <div className="absolute -bottom-2 bg-slate-900 text-white px-3 md:px-4 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest z-20 whitespace-nowrap">
                                    Total Score
                                </div>
                            </div>
                        </div>

                        <div className="text-center md:text-right space-y-3">
                            <div className="flex flex-col items-center md:items-end">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Performance Summary</label>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-xl md:text-2xl font-black text-slate-900">{Number(submission.result?.total || 0).toFixed(2).replace(/\.00$/, '')}</span>
                                    <span className="text-slate-400 font-bold">/</span>
                                    <span className="text-base md:text-lg font-bold text-slate-500">{examInfo.totalMarks}</span>
                                </div>
                                {totalDeducted > 0 && (
                                    <span className="text-rose-600 font-black text-xs uppercase tracking-tight bg-rose-50 px-2 py-0.5 rounded mt-1 border border-rose-100">
                                        -{totalDeducted.toFixed(2).replace(/\.00$/, '')} Deducted
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-end gap-4">
                                <div className="text-right">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">Ranking</label>
                                    <p className="font-black text-slate-900">{rank ? `${rank}${getOrdinal(rank)}` : 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">Class Highest</label>
                                    <p className="font-black text-slate-900">{examInfo.highestMark ? Number(examInfo.highestMark).toFixed(2).replace(/\.00$/, '') : 'N/A'}</p>
                                </div>
                            </div>
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
                                        <span>Marks: {Number(submission.result?.mcqMarks || 0).toFixed(2).replace(/\.00$/, '')} / {objectiveTotal}</span>
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
                                                        <div className="ml-2 md:ml-6 mt-1">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
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
                                                                <Text>
                                                                    {renderDynamicExplanation(
                                                                        (q as any).explanation,
                                                                        q.options,
                                                                        q.type
                                                                    )}
                                                                </Text>
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
                                                                            <div key={i} className={`flex items-center gap-2 px-1 rounded text-xs ${isOptionCorrect ? 'text-green-700 font-bold bg-green-50' : (isSelected ? 'text-red-700 bg-red-50' : 'text-gray-600')}`}>
                                                                                <span className="font-bold shrink-0">{optionId}.</span>
                                                                                <div className="flex-1">
                                                                                    {optText}
                                                                                </div>
                                                                                {isSelected && (isOptionCorrect ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-600" />)}
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
                                                                <Text>
                                                                    {renderDynamicExplanation(
                                                                        (q as any).explanation,
                                                                        null,
                                                                        q.type
                                                                    )}
                                                                </Text>
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
                                                            <div className="grid grid-cols-2 gap-2 bg-gray-50/50 p-1 rounded border border-dashed border-gray-200">
                                                                <div className="space-y-1">
                                                                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b pb-0.5 mb-1 px-1">Column A</div>
                                                                    {(q.leftColumn || []).map((item: any, i: number) => (
                                                                        <div key={i} className="p-1 px-2 bg-white border rounded text-[10px] flex items-center shadow-sm">
                                                                            <span className="font-bold mr-2 w-4 h-4 flex items-center justify-center bg-gray-100 rounded-full text-[8px] text-gray-600 shrink-0">{i + 1}</span>
                                                                            <div className="flex-1"><Text>{item.text}</Text></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b pb-0.5 mb-1 px-1">Column B</div>
                                                                    {(q.rightColumn || []).map((item: any, i: number) => (
                                                                        <div key={i} className="p-1 px-2 bg-white border rounded text-[10px] flex items-center shadow-sm">
                                                                            <span className="font-bold mr-2 w-4 h-4 flex items-center justify-center bg-gray-100 rounded-full text-[8px] text-gray-600 shrink-0">{String.fromCharCode(65 + i)}</span>
                                                                            <div className="flex-1"><Text>{item.text}</Text></div>
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
                                                                <Text>
                                                                    {renderDynamicExplanation(
                                                                        (q as any).explanation,
                                                                        null,
                                                                        q.type,
                                                                        q.rightColumn
                                                                    )}
                                                                </Text>
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
                                                                <Text>
                                                                    {renderDynamicExplanation(
                                                                        (q as any).explanation,
                                                                        null,
                                                                        q.type
                                                                    )}
                                                                </Text>
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

                                            {q.subQuestions && (
                                                <div className="mt-4 space-y-4">
                                                    {q.subQuestions.map((sub: any, sidx: number) => {
                                                        const subId = sub.id || `sub_${q.id || 'q'}_${sidx}`;
                                                        const studentAnswer = submission.answers[subId] || submission.answers[`${q.id || 'q'}_sub_${sidx}`] || submission.answers[`${q.id || 'q'}_desc_${sidx}_answer`];
                                                        return renderSubQuestion({ ...sub, studentAnswer }, sidx, q.id || 'q');
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* SMCQ Section */}
                    {smcqs.length > 0 && (
                        <>
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-8 break-before-page">
                                <h3>দৃশ্যপট ভিত্তিক প্রশ্ন (SMCQ)</h3>
                                <div className="text-right">
                                    <span>Marks: {smcqs.reduce((sum, q) => sum + getSMCQMark(q, submission.answers[q.id]), 0)} / {smcqs.reduce((sum, q) => sum + (q.marks || 0), 0)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {smcqs.map((q, idx) => {
                                    const studentAnswer = submission.answers[q.id];
                                    const obtainedMark = getSMCQMark(q, studentAnswer);

                                    return (
                                        <div key={idx} className="mb-6 border-b border-gray-200 pb-4 break-inside-avoid">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="font-bold text-lg flex gap-2">
                                                    <span>{idx + 1}.</span>
                                                    <div className="inline-block whitespace-pre-wrap"><Text>{q.questionText}</Text></div>
                                                </div>
                                                <div className="bg-gray-100 px-3 py-1 rounded text-sm font-bold whitespace-nowrap">
                                                    {obtainedMark} / {q.marks}
                                                </div>
                                            </div>

                                            <div className="ml-6 space-y-4">
                                                {q.subQuestions?.map((sub: any, sidx: number) => {
                                                    const subAns = studentAnswer?.[sidx] || (typeof studentAnswer === 'object' ? studentAnswer[sub.id] : null);
                                                    const correctText = sub.correct || sub.options?.find((opt: any) => opt.isCorrect)?.text;
                                                    const isCorrect = String(subAns).trim() === String(correctText).trim();

                                                    return (
                                                        <div key={sidx} className="p-3 border rounded-lg bg-gray-50">
                                                            <div className="font-bold mb-2 flex gap-2">
                                                                <span className="text-gray-500">{BENGALI_SUB_LABELS[sidx]}.</span>
                                                                <div className="inline-block"><Text>{sub.questionText}</Text></div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 ml-6">
                                                                {sub.options?.map((opt: any, oidx: number) => {
                                                                    const isSelected = String(subAns).trim() === String(opt.text).trim();
                                                                    const isOptCorrect = opt.isCorrect || String(opt.text).trim() === String(correctText).trim();
                                                                    
                                                                    let statusClass = "border-gray-200 bg-white";
                                                                    if (isSelected && isOptCorrect) statusClass = "border-green-500 bg-green-50 text-green-700 shadow-sm ring-1 ring-green-500";
                                                                    else if (isSelected && !isOptCorrect) statusClass = "border-red-500 bg-red-50 text-red-700";
                                                                    else if (!isSelected && isOptCorrect) statusClass = "border-green-200 bg-green-50/30 text-green-600";

                                                                    return (
                                                                        <div key={oidx} className={`p-2 border rounded text-xs flex items-center gap-2 ${statusClass}`}>
                                                                            <span className="font-bold opacity-50">{MCQ_LABELS[oidx]}.</span>
                                                                            <div className="flex-1">
                                                                                <Text>{opt.text}</Text>
                                                                            </div>
                                                                            {isSelected && (isOptCorrect ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />)}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            {sub.explanation && (
                                                                <div className="mt-3 ml-6 p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-800">
                                                                    <span className="font-bold mr-1">ব্যাখ্যা:</span>
                                                                    <div className="inline-block"><Text>{sub.explanation}</Text></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Descriptive Section */}
                    {descriptives.length > 0 && (
                        <>
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-8 break-before-page">
                                <h3>বর্ণনামূলক প্রশ্ন (Descriptive)</h3>
                                <div className="text-right">
                                    <span>Marks: {descriptives.reduce((sum, q) => sum + (Number(submission.answers[`${q.id}_marks`]) || 0), 0)} / {descriptives.reduce((sum, q) => sum + (q.marks || 0), 0)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {descriptives.map((q, idx) => {
                                    const obtainedMark = submission.answers[`${q.id}_marks`];
                                    return (
                                        <div key={idx} className="mb-6 border-b border-gray-200 pb-4 break-inside-avoid">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-lg flex gap-2">
                                                    <span>{idx + 1}.</span>
                                                    <div className="inline-block whitespace-pre-wrap"><Text>{q.questionText}</Text></div>
                                                </div>
                                                <div className="bg-gray-100 px-3 py-1 rounded text-sm font-bold whitespace-nowrap">
                                                    {obtainedMark !== undefined ? obtainedMark : 0} / {q.marks || 10}
                                                </div>
                                            </div>

                                            {q.subQuestions && (
                                                <div className="mt-4 space-y-4">
                                                    {q.subQuestions.map((sub: any, sidx: number) => {
                                                        const subId = sub.id || `${q.id || 'q'}_sub_${sidx}`;
                                                        const studentAnswer = submission.answers[subId] || submission.answers[`${q.id || 'q'}_sub_${sidx}`] || submission.answers[`${q.id || 'q'}_desc_${sidx}_answer`];
                                                        return renderSubQuestion({ ...sub, studentAnswer }, sidx, q.id || 'q');
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

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

                                            {q.subType ? (
                                                renderSubQuestion(q, idx, q.id || 'q')
                                            ) : (
                                                <div className="space-y-4">
                                                    {(answer || q.studentAnswer) && (
                                                        <div className="ml-6 p-2 bg-white rounded border border-gray-200 text-sm">
                                                            <div className="text-xs text-gray-500 mb-1">Student Answer:</div>
                                                            <div className="font-medium text-blue-800">
                                                                <div className="inline-block"><Text>{String(answer || q.studentAnswer)}</Text></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {q.studentImages && q.studentImages.length > 0 && (
                                                        <div className="ml-6 mt-2 grid grid-cols-3 gap-2">
                                                            {q.studentImages.map((img: string, ii: number) => (
                                                                <div key={ii} className="relative aspect-video border rounded overflow-hidden">
                                                                    <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                                                    <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[6px] px-1">Img {ii + 1}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {(q.modelAnswer || q.answer || q.correctAnswer) && (
                                                        <div className="ml-6 mt-2 p-2 bg-green-50 rounded border border-green-100 text-sm">
                                                            <div className="text-xs text-green-700 font-bold mb-1 flex items-center gap-1">
                                                                <BookOpen className="w-3 h-3" /> Model Answer / Key
                                                            </div>
                                                            <div className="font-medium text-gray-800">
                                                                <div className="inline-block"><Text>{q.modelAnswer || q.answer || q.correctAnswer}</Text></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {q.explanation && (
                                                        <div className="ml-6 mt-2 p-2 bg-blue-50 rounded border border-blue-100 text-sm">
                                                            <div className="text-xs text-blue-700 font-bold mb-1 flex items-center gap-1">
                                                                <Info className="w-3 h-3" /> Explanation
                                                            </div>
                                                            <div className="font-medium text-gray-800">
                                                                <div className="inline-block"><Text>{q.explanation}</Text></div>
                                                            </div>
                                                        </div>
                                                    )}
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
