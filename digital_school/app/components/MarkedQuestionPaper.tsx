import React, { forwardRef } from "react";
import QRCode from "react-qr-code";
import { MathJax } from 'better-react-mathjax';
import Latex from 'react-latex';
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";

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
    subQuestions?: any[];
}
interface SQ {
    id?: string;
    questionText: string;
    marks?: number;
    modelAnswer?: string;
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
    submission: StudentSubmission;
    rank?: number;
    totalStudents?: number;
    qrData: any;
}

const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ'];
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ'];

const Text = ({ children }: { children: string }) => (
    <Latex>{children}</Latex>
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

        const getObtainedMark = (q: MCQ, status: string, marks: number) => {
            if (status === 'correct') return marks;
            if (status === 'incorrect') return -(marks * negativeRate);
            return 0;
        };

        // Calculate total deducted marks
        let totalDeducted = 0;
        mcqs.forEach(q => {
            const ans = submission.answers[q.id || ''];
            const status = getMCQStatus(q, ans);
            if (status === 'incorrect') {
                totalDeducted += (q.marks || 1) * negativeRate;
            }
        });

        return (
            <div ref={ref} className="question-paper-container bg-white p-8 rounded-lg shadow-lg" style={{ fontFamily: 'SolaimanLipi, Times New Roman, serif' }}>
                {/* Header */}
                <header className="text-center mb-6 relative border-b-2 border-black pb-4">
                    <div className="absolute top-0 right-0 hidden print:block">
                        <QRCode value={JSON.stringify(qrData)} size={64} />
                    </div>
                    <h1 className="text-2xl font-bold">{examInfo.schoolName}</h1>
                    <p className="text-sm">{examInfo.schoolAddress}</p>
                    <h2 className="mt-2 text-xl font-bold">{examInfo.title}</h2>

                    <div className="mt-4 border-2 border-gray-800 p-3 rounded-md bg-gray-50 print:bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-left">
                            <p><strong>Name:</strong> {submission.student.name}</p>
                            <p><strong>ID/Roll:</strong> {submission.student.roll}</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold border-2 border-black rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-1">
                                {submission.result?.total || 0}
                            </div>
                            <p className="text-sm font-bold">Total Score</p>
                        </div>
                        <div className="text-right">
                            <p><strong>Rank:</strong> {rank ? `${rank}${getOrdinal(rank)}` : 'N/A'}</p>
                            {totalDeducted > 0 && (
                                <p className="text-red-600 text-sm">
                                    (-{totalDeducted.toFixed(2)} for negative marking)
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="text-sm flex flex-row justify-center gap-x-3 flex-wrap mt-2">
                        <span><strong>বিষয়:</strong> {examInfo.subject}</span>
                        <span><strong>শ্রেণি:</strong> {examInfo.class}</span>
                        {examInfo.set && <span><strong>সেট:</strong> {examInfo.set}</span>}
                        <span><strong>তারিখ:</strong> {examInfo.date}</span>
                    </div>
                </header>

                {/* Main Content */}
                <main>
                    {/* MCQ Section */}
                    {mcqs.length > 0 && (
                        <>
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1">
                                <h3>বহুনির্বাচনি প্রশ্ন (MCQ)</h3>
                                <div className="text-right">
                                    <span>Marks: {submission.result?.mcqMarks || 0} / {mcqTotal}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                {mcqs.map((q, idx) => {
                                    const ans = submission.answers[q.id || ''];
                                    const status = getMCQStatus(q, ans);
                                    const mark = getObtainedMark(q, status, q.marks || 1);

                                    return (
                                        <div key={idx} className={`mb-2 p-2 rounded border ${status === 'correct' ? 'bg-green-50 border-green-200' :
                                                status === 'incorrect' ? 'bg-red-50 border-red-200' : 'border-transparent'
                                            } break-inside-avoid`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start flex-1">
                                                    <span className="font-bold mr-2 text-sm">{idx + 1}.</span>
                                                    <div className="flex-1 text-sm">
                                                        <Text>{`${q.q}`}</Text>
                                                        <div className="mt-1 flex flex-wrap gap-2">
                                                            {(q.options || []).map((opt, oidx) => {
                                                                const isSelected = ans === opt.text;
                                                                const isCorrectOption = opt.isCorrect;

                                                                let optionClass = "";
                                                                if (isSelected) {
                                                                    optionClass = isCorrectOption ? "bg-green-600 text-white" : "bg-red-600 text-white";
                                                                } else if (isCorrectOption && status === 'incorrect') {
                                                                    optionClass = "bg-green-100 text-green-800 border-green-300 border"; // Show correct answer if wrong
                                                                }

                                                                return (
                                                                    <span key={oidx} className={`inline-block px-2 py-0.5 rounded text-xs ${optionClass}`}>
                                                                        <span className="font-bold mr-1">{MCQ_LABELS[oidx]}.</span>
                                                                        <Text>{opt.text}</Text>
                                                                        {isSelected && (isCorrectOption ? <CheckCircle className="inline w-3 h-3 ml-1" /> : <XCircle className="inline w-3 h-3 ml-1" />)}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-sm ml-2 whitespace-nowrap">
                                                    {mark > 0 ? `+${mark}` : mark < 0 ? `${mark}` : '0'}
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
                            <div className="flex justify-between items-center font-bold mb-4 text-lg border-b border-dotted border-black pb-1 mt-8 break-before-page">
                                <h3>সৃজনশীল প্রশ্ন (CQ)</h3>
                                <div className="text-right">
                                    <span>Marks: {submission.result?.cqMarks || 0} / {cqRequiredMarks}</span>
                                </div>
                            </div>

                            <div>
                                {cqs.map((q, idx) => {
                                    // Logic to find obtained marks for this specific CQ question
                                    // The submission.answers usually stores marks with key `${id}_marks`
                                    const obtainedMark = submission.answers[`${q.id}_marks`];

                                    return (
                                        <div key={idx} className="mb-6 border-b border-gray-200 pb-4 break-inside-avoid">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-lg flex gap-2">
                                                    <span>{idx + 1}.</span>
                                                    <Text>{q.questionText}</Text>
                                                </div>
                                                <div className="bg-gray-100 px-3 py-1 rounded text-sm font-bold whitespace-nowrap">
                                                    {obtainedMark !== undefined ? obtainedMark : '-'} / {q.marks || 10}
                                                </div>
                                            </div>

                                            {/* Subquestions & Answers */}
                                            {q.subQuestions && q.subQuestions.map((sub: any, sidx: number) => {
                                                const subAnswer = submission.answers[sub.id]; // Logic depends on how answers are stored
                                                // Actually, for written exams, usually only the total mark for the CQ is stored, or sub-marks.
                                                // Assuming we don't have granular sub-question answers/marks in this data structure easily without complex mapping.
                                                // We'll just list subquestions.
                                                return (
                                                    <div key={sidx} className="ml-6 mt-2 text-sm text-gray-600">
                                                        <span className="font-bold mr-1">{BENGALI_SUB_LABELS[sidx]}.</span>
                                                        <Text>{sub.questionText || sub.question || sub.text}</Text>
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
                                    const obtainedMark = submission.answers[`${q.id}_marks`];
                                    const answer = submission.answers[q.id];

                                    return (
                                        <div key={idx} className="mb-4 p-3 border rounded bg-gray-50 break-inside-avoid">
                                            <div className="flex justify-between mb-2">
                                                <div className="font-medium text-sm">
                                                    <span className="font-bold mr-2">{idx + 1}.</span>
                                                    <Text>{q.questionText}</Text>
                                                </div>
                                                <div className="font-bold text-sm bg-white px-2 py-1 rounded border">
                                                    {obtainedMark !== undefined ? obtainedMark : '-'} / {q.marks}
                                                </div>
                                            </div>

                                            {answer && (
                                                <div className="ml-6 p-2 bg-white rounded border border-gray-200 text-sm">
                                                    <div className="text-xs text-gray-500 mb-1">Student Answer:</div>
                                                    <div className="font-medium text-blue-800">
                                                        <Text>{String(answer)}</Text>
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
