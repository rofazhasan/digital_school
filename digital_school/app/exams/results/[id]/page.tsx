/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Trophy,
  Award,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Medal,
  Crown,
  CheckCircle,
  XCircle,
  Minus,
  Download,
  Share2,
  Eye,
  Clock,
  BookOpen,
  User,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckSquare,
  MessageSquare,
  Lock,
  Camera,
  ChevronLeft,
  ChevronRight,
  Star,
  Layers,
  Sparkles,
  Search,
  Zap,
  Calendar,
  Image as ImageIcon,
  Info,
  AlignLeft,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { nativeShare } from '@/lib/native/interaction';
import { Capacitor } from "@capacitor/core";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MathJaxContext } from "better-react-mathjax";
import { BeautifulChart } from "@/app/components/BeautifulChart";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath, renderDynamicExplanation, cn } from "@/lib/utils";
import { hasStudentAnswered, isAnswerCorrect } from "@/lib/exam-result-utils";
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import MarkedQuestionPaper from '@/app/components/MarkedQuestionPaper';
import { toBengaliNumerals, toBengaliAlphabets } from '@/utils/numeralConverter';
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";
import DrawingCanvas from "@/app/components/DrawingCanvas";

// import QRCode from "react-qr-code"; // Unused

interface StudentResult {
  id: string;
  mcqMarks: number;
  cqMarks: number;
  sqMarks: number;
  total: number;
  rank: number;
  grade: string;
  percentage?: number;
  comment?: string;
  isPublished: boolean;
  publishedAt?: string;
  status?: string;
  suspensionReason?: string;
}

interface ExamInfo {
  id: string;
  name: string;
  description: string;
  totalMarks: number;
  allowRetake: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
  createdAt: string;
  subject?: string;
  class?: string;
  set?: string;
  mcqNegativeMarking?: number;
  cqRequiredQuestions?: number;
  sqRequiredQuestions?: number;
}

interface StudentInfo {
  id: string;
  name: string;
  roll: string;
  registrationNo: string;
  class: string;
}

interface SubmissionInfo {
  id: string;
  submittedAt: string;
  startedAt?: string;
  score: number;
  evaluatorNotes?: string;
  evaluatedAt?: string;
  status?: string;
  suspensionReason?: string;
  objectiveStatus?: string;
  objectiveStartedAt?: string;
  objectiveSubmittedAt?: string;
  cqSqStatus?: string;
  cqSqStartedAt?: string;
  cqSqSubmittedAt?: string;
}

interface SubQuestion {
  id: string;
  questionText: string;
  marks: number;
  awardedMarks: number;
  isCorrect: boolean;
  studentAnswer: string | string[] | any;
  studentImages: string[];
  options?: { text: string; isCorrect: boolean; originalIndex?: number }[];
  correctAnswer?: string | number;
  // Advanced Descriptive Fields
  subType?: string;
  items?: any[];
  statements?: string[];
  labels?: any[];
  correctLabels?: string[];
  clues?: string[];
  clueType?: string;
  leftColumn?: any[];
  rightColumn?: any[];
  matches?: Record<string, string>;
  flowchartConfig?: any;
  answer?: string;
  modelAnswer?: string;
}

interface Question {
  id: string;
  type: string;
  questionText: string;
  marks: number;
  awardedMarks: number;
  isCorrect: boolean;
  studentAnswer?: any; // Reverting to any for flexible student answer structures
  studentAnswerImages?: string[];
  drawingData?: {
    imageData: string;
    originalImagePath: string;
  } | null;
  allDrawings?: {
    imageIndex: number;
    imageData: string;
    originalImagePath: string;
    drawingData?: any;
  }[];
  options?: { text: string; isCorrect: boolean; explanation?: string; originalIndex?: number }[];
  modelAnswer?: string;
  explanation?: string;
  subQuestions?: SubQuestion[];
  sub_questions?: SubQuestion[];
  parts?: SubQuestion[];
  feedback?: string;
  images?: string[];
  assertion?: string;
  reason?: string;
  correctOption?: number;
  leftColumn?: string[];
  rightColumn?: string[];
  matches?: Record<string, number>;
}

interface Statistics {
  totalStudents: number;
  averageScore?: number;
  highestScore: number;
  lowestScore: number;
}

interface ReviewRequest {
  id: string;
  status: string;
  studentComment: string;
  evaluatorComment?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewer?: {
    id: string;
    name: string;
  } | null;
}

interface ExamResult {
  exam: ExamInfo;
  student: StudentInfo;
  submission: SubmissionInfo;
  result: StudentResult | null;
  reviewRequest: ReviewRequest | null;
  questions: Question[];
  statistics: Statistics;
}

const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
  },
};

export default function ExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [studentComment, setStudentComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'UNANSWERED'>('ALL');
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedImageTitle, setZoomedImageTitle] = useState('');
  const [activeZoomOriginal, setActiveZoomOriginal] = useState<string | null>(null);
  const [activeZoomImages, setActiveZoomImages] = useState<string[]>([]);
  const [activeZoomIndex, setActiveZoomIndex] = useState(0);
  const [activeZoomQuestion, setActiveZoomQuestion] = useState<Question | null>(null);
  const [activeZoomStrokes, setActiveZoomStrokes] = useState<any[]>([]);
  const [activeZoomTexts, setActiveZoomTexts] = useState<any[]>([]);
  const [annotatedImageFailed, setAnnotatedImageFailed] = useState(false);
  const [originalImageFallback, setOriginalImageFallback] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isApplyingDrawing, setIsApplyingDrawing] = useState(false);

  const handleShare = async () => {
    if (!result) return;
    const shareTitle = `My Result: ${result.exam.name}`;
    const shareText = `I scored ${result.result?.total || result.submission.score} in ${result.exam.name} on Examify!`;
    const shareUrl = window.location.href;
    await nativeShare(shareTitle, shareText, shareUrl);
  };
  const printRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [objectivePage, setObjectivePage] = useState(1);
  const [cqPage, setCqPage] = useState(1);
  const [sqPage, setSqPage] = useState(1);
  const [descriptivePage, setDescriptivePage] = useState(1);

  // Section Constants
  const OBJECTIVE_PER_PAGE = 15;
  const COMPLEX_PER_PAGE = 10;

  // Helper to render advanced descriptive sub-questions content
  const renderSubQuestionContent = (subQ: any, subIdx: number, questionId: string) => {
    const subType = subQ.subType || 'writing';
    const studentAnswer = subQ.studentAnswer;

    const normalize = (s: any) => String(s || '').trim().toLowerCase();

    // Helper for matching answers (stored as string or object)
    const getMatchAns = (leftId: string) => {
      if (typeof studentAnswer === 'object' && studentAnswer !== null) {
        return studentAnswer[leftId];
      }
      return null;
    };

    // Helper for flowchart/gapfill (stored as object mapping keys to strings)
    const getVal = (key: string) => {
      if (typeof studentAnswer === 'object' && studentAnswer !== null) {
        return studentAnswer[key];
      }
      return null;
    };

    switch (subType) {
      case 'flowchart':
        return (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(subQ.items || []).map((item: string, ii: number) => {
              const segments = item.split('___');
              const modelAnswers = (subQ.modelAnswers?.[ii] || '').split('|');
              return (
                <div key={ii} className="p-3 bg-amber-50/10 dark:bg-amber-900/5 rounded-xl border border-amber-200/30 flex flex-col gap-2">
                  <div className="text-[9px] font-black text-amber-600 uppercase flex items-center justify-between">
                    <span>Step {ii + 1}</span>
                    {subQ.style && <Badge variant="outline" className="text-[8px] h-3 px-1 border-amber-200 text-amber-500 uppercase">{subQ.style}</Badge>}
                  </div>
                  {segments.map((seg, si) => (
                    <div key={si} className="flex flex-col gap-1">
                      <div className="text-xs text-muted-foreground font-medium italic whitespace-pre-wrap">
                        <UniversalMathJax inline dynamic>{cleanupMath(seg.replace(/\|\|/g, '\n'))}</UniversalMathJax>
                      </div>
                      {si < segments.length - 1 && (
                        <div className="space-y-1">
                          <div className={cn(
                            "p-2 rounded border text-sm font-bold shadow-sm",
                            normalize(getVal(`flow_${ii}_${si}`)) === normalize(modelAnswers[si])
                              ? "bg-green-50 dark:bg-green-950/20 border-green-200 text-green-700"
                              : "bg-white dark:bg-slate-950 border-amber-200"
                          )}>
                            {getVal(`flow_${ii}_${si}`) || <span className="text-muted-foreground italic opacity-30">Missing</span>}
                          </div>
                          {modelAnswers[si] && (
                            <div className="text-[10px] text-green-600 font-bold px-1 flex items-center gap-1">
                              <ArrowRight className="w-2.5 h-2.5" /> Key: {modelAnswers[si]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );

      case 'fill_in':
        return (
          <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            {(subQ.wordBox || subQ.clues) && (
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="text-[10px] font-black text-slate-400 uppercase w-full mb-1">
                  {subQ.clueType === 'box' ? 'Word Box:' : 'Clues:'}
                </div>
                {(subQ.wordBox || subQ.clues || []).map((clue: string, ci: number) => (
                  <Badge key={ci} variant="outline" className="bg-white dark:bg-slate-950 font-bold border-indigo-100">{clue}</Badge>
                ))}
              </div>
            )}
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {(subQ.passage || subQ.questionText || '').split('___').map((part: string, pi: number, arr: any[]) => {
                const ans = getVal(pi.toString());
                const correct = subQ.answers?.[pi];
                const isCorrect = normalize(ans) === normalize(correct);
                return (
                  <span key={pi}>
                    <UniversalMathJax inline dynamic>{cleanupMath(part.replace(/\|\|/g, '\n'))}</UniversalMathJax>
                    {pi < arr.length - 1 && (
                      <span className="relative group inline-block mx-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded border-b-2 font-bold transition-all",
                          ans ? (isCorrect ? "border-green-400 bg-green-50 text-green-700" : "border-red-400 bg-red-50 text-red-700") : "border-indigo-400 bg-indigo-50 text-indigo-600"
                        )}>
                          {ans || '___'}
                        </span>
                        {correct && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-10">
                            Key: {correct}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        );

      case 'matching':
        const columns = [
          { key: 'leftColumn', title: 'Col A', idPrefix: '' },
          { key: 'rightColumn', title: 'Col B', idPrefix: '' },
          { key: 'columnC', title: 'Col C', idPrefix: '' },
          { key: 'columnD', title: 'Col D', idPrefix: '' }
        ].filter(c => subQ[c.key] && subQ[c.key].length > 0);

        return (
          <div className="mt-3 space-y-4">
            <div className={`grid grid-cols-2 md:grid-cols-${Math.min(4, columns.length)} gap-3`}>
              {columns.map(col => (
                <div key={col.key} className="space-y-2">
                  <div className="text-[10px] font-black text-muted-foreground uppercase opacity-60 px-1">{col.title}</div>
                  <div className="space-y-1.5">
                    {(subQ[col.key] || []).map((item: any, i: number) => (
                      <div key={i} className="p-2 text-[11px] bg-card/50 border border-border/50 rounded-lg flex items-start gap-2 shadow-sm">
                        <Badge variant="secondary" className="h-4 min-w-[16px] rounded bg-muted text-[9px] p-0 flex items-center justify-center font-black">{item.id}</Badge>
                        <div className="flex-1 leading-tight whitespace-pre-wrap"><UniversalMathJax inline dynamic>{cleanupMath(item.text.replace(/\|\|/g, '\n'))}</UniversalMathJax></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/30 overflow-hidden shadow-md bg-white dark:bg-slate-950">
              <div className="p-2 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Matching Correspondence Details
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 divide-x divide-slate-100 dark:divide-slate-800">
                      <th className="p-2.5 text-left font-black text-slate-500 uppercase text-[9px] w-1/3">Reference Item</th>
                      <th className="p-2.5 text-left font-black text-slate-500 uppercase text-[9px] w-1/3">Your Response</th>
                      <th className="p-2.5 text-left font-black text-slate-500 uppercase text-[9px] w-1/3">Correct Answer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* If matches is a Record<string, string>, we map over left elements */}
                    {subQ.leftColumn?.map((l: any, i: number) => {
                      const ans = getMatchAns(l.id);
                      const correct = subQ.matches?.[l.id];
                      const isCorrect = normalize(ans) === normalize(correct);

                      const getItemText = (id: string) => {
                        if (!id) return null;
                        const parts = id.split('-');
                        return parts.map((pid, idx) => {
                          const colKey = ['leftColumn', 'rightColumn', 'columnC', 'columnD'][idx];
                          const item = subQ[colKey]?.find((r: any) => r.id === pid);
                          return item ? (idx > 0 ? ` → ${item.text}` : item.text) : (idx > 0 ? ` → ${pid}` : pid);
                        }).join('');
                      };

                      return (
                        <tr key={i} className={cn("divide-x divide-slate-100 dark:divide-slate-800 transition-colors", isCorrect ? "bg-green-50/20 hover:bg-green-50/40" : "bg-red-50/20 hover:bg-red-50/40")}>
                          <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] mr-2">{l.id}</span>
                            <UniversalMathJax inline>{cleanupMath(l.text.replace(/\|\|/g, '\n'))}</UniversalMathJax>
                          </td>
                          <td className={cn("p-2.5 font-black whitespace-pre-wrap", isCorrect ? "text-green-600" : "text-red-500")}>
                            {ans ? <UniversalMathJax inline>{cleanupMath((getItemText(ans) || ans).replace(/\|\|/g, '\n'))}</UniversalMathJax> : <span className="italic opacity-30">No match</span>}
                          </td>
                          <td className="p-2.5 text-green-600 font-black whitespace-pre-wrap">
                            {correct ? <UniversalMathJax inline>{cleanupMath((getItemText(correct) || correct).replace(/\|\|/g, '\n'))}</UniversalMathJax> : <span className="opacity-30">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(subQ.statements || []).map((stmt: string, i: number) => {
              const ans = getVal(i.toString());
              const correct = subQ.correctAnswers?.[i];
              const isCorrect = normalize(ans) === normalize(correct);
              return (
                <div key={i} className={cn(
                  "p-3 rounded-xl border flex items-start gap-3 transition-colors",
                  isCorrect ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"
                )}>
                  <div className="flex-1 whitespace-pre-wrap leading-relaxed self-center">
                    <UniversalMathJax inline dynamic>{cleanupMath(stmt.replace(/\|\|/g, '\n'))}</UniversalMathJax>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={isCorrect ? "default" : "destructive"} className="text-[9px] h-4 px-1.5 uppercase font-bold">{ans || 'Empty'}</Badge>
                    {correct && <span className="text-[8px] font-black text-green-600">Key: {correct}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'interpreting_graph':
        return (
          <div className="mt-3 space-y-4">
            {subQ.chartConfig && (
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <BeautifulChart
                  type={subQ.chartConfig.type}
                  data={subQ.chartConfig.data}
                  xAxisLabel={subQ.chartConfig.xAxisLabel}
                  yAxisLabel={subQ.chartConfig.yAxisLabel}
                />
              </div>
            )}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Your Interpretation
              </div>
              <div className="text-foreground whitespace-pre-wrap italic font-medium">
                {studentAnswer || <span className="text-muted-foreground/30">No response provided</span>}
              </div>
            </div>
          </div>
        );

      case 'label_diagram':
        return (
          <div className="mt-3 space-y-4">
            {subQ.imageUrl && (
              <div className="relative inline-block border rounded-xl overflow-hidden shadow-sm max-w-full">
                <img src={subQ.imageUrl} alt="Diagram" className="max-h-64 object-contain" loading="lazy" />
                {(subQ.labels || []).map((l: any, i: number) => (
                  <div key={i} className="absolute w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-white" style={{ top: `${l.y}%`, left: `${l.x}%`, transform: 'translate(-50%, -50%)' }}>
                    {i + 1}
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(subQ.labels || []).map((_: any, i: number) => {
                const ans = getVal(i.toString());
                const correct = subQ.correctLabels?.[i];
                const isCorrect = normalize(ans) === normalize(correct);
                return (
                  <div key={i} className={cn("p-2 rounded border flex flex-col", isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                    <div className="text-[9px] font-bold opacity-50">Label {i + 1}</div>
                    <div className="text-xs font-bold">{ans || '___'}</div>
                    {correct && <div className="text-[8px] text-green-600 font-bold">Key: {correct}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        // Standard Writing/Comprehension/Rearranging
        const hasText = studentAnswer && typeof studentAnswer === 'string';
        const hasImages = Array.isArray(subQ.studentImages) && subQ.studentImages.length > 0;

        if (!hasText && !hasImages) return null;

        return (
          <div className="mt-2 space-y-3">
            {hasText && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm text-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Written Response
                </div>
                <div className="text-foreground whitespace-pre-wrap">{studentAnswer}</div>
              </div>
            )}

            {hasImages && (
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2 px-1">
                  <Camera className="w-3 h-3" /> Submitted Images ({subQ.studentImages.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {subQ.studentImages.map((imgUrl: string, imgIdx: number) => {
                    // Check for annotation in allDrawings
                    const annotation = (subQ.allDrawings || []).find((d: any) =>
                      d.originalImagePath === imgUrl || d.imageIndex === imgIdx
                    );
                    const displayUrl = annotation?.imageData || imgUrl;

                    return (
                      <div key={imgIdx} className="relative group cursor-pointer" onClick={() => handleImageZoom(displayUrl, `Sub-question ${subIdx + 1} Image ${imgIdx + 1}`, imgIdx, subQ.studentImages, subQ as unknown as Question)}>
                        <img
                          src={displayUrl}
                          alt={`Submission ${imgIdx + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        {annotation && (
                          <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold shadow-sm">
                            ✓
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1 rounded">
                          {imgIdx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Model Answer Box (Standard CQ Style) */}
            {(subQ.modelAnswer || subQ.answer || subQ.correctAnswer || subQ.q_ans || subQ.ans) && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50/30 border border-emerald-100/50 text-[10px]">
                <p className="font-black uppercase text-emerald-700 mb-2 flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5" /> Model Answer
                </p>
                <div className="bg-white/70 p-2 rounded border border-emerald-100 shadow-sm text-emerald-900 font-bold leading-relaxed whitespace-pre-wrap">
                  <UniversalMathJax dynamic>{cleanupMath(String(subQ.modelAnswer || subQ.answer || subQ.correctAnswer || subQ.q_ans || subQ.ans || "").replace(/\|\|/g, '\n'))}</UniversalMathJax>
                </div>
              </div>
            )}

            {subQ.explanation && (
              <div className="mt-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-[10px] text-blue-800 flex items-start gap-2">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold uppercase block mb-0.5 text-[8px]">Explanation:</span>
                  <UniversalMathJax dynamic>{cleanupMath(subQ.explanation.replace(/\|\|/g, '\n'))}</UniversalMathJax>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  // Main wrapper for descriptive sub-question including model answer/explanation
  const renderDescriptiveSubQuestion = (subQ: any, subIdx: number, questionId: string) => {
    return (
      <div className="mt-4 px-2 space-y-4">
        {/* Specialized Sub-Key Rendering (matching the evaluation standard) */}
        {/* Question Metadata: Label, Instructions, Source, Passage, Graph */}
        <div className="mb-4 space-y-3">
          {(subQ.label || subQ.title || subQ.question) && (
            <div className="text-sm font-black text-gray-800 dark:text-slate-200 leading-tight">
              <UniversalMathJax inline dynamic>{subQ.label || subQ.title || subQ.question}</UniversalMathJax>
            </div>
          )}

          {(subQ.instructions || subQ.instruction) && (
            <div className="text-[10px] italic text-gray-400 bg-gray-50 dark:bg-slate-900/50 p-1.5 rounded border border-gray-100 dark:border-slate-800 flex items-start gap-1.5">
              <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
              <UniversalMathJax dynamic>{subQ.instructions || subQ.instruction}</UniversalMathJax>
            </div>
          )}

          {(subQ.subType === 'writing' || subQ.sub_type === 'writing') && (subQ.sourceText || subQ.source_text) && (
            <div className="p-3 rounded-xl bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 text-xs italic text-blue-900/60 dark:text-blue-300 leading-relaxed">
              <UniversalMathJax dynamic>{subQ.sourceText || subQ.source_text}</UniversalMathJax>
            </div>
          )}

          {(subQ.subType === 'fill_in' || subQ.sub_type === 'fill_in') && subQ.passage && (
            <div className="p-3 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/30 text-sm leading-relaxed text-indigo-900/80 dark:text-indigo-200">
              <UniversalMathJax dynamic>{subQ.passage}</UniversalMathJax>
              {(subQ.wordBox || subQ.word_box) && (subQ.wordBox || subQ.word_box).length > 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-100/30 flex flex-wrap gap-2">
                  {(subQ.wordBox || subQ.word_box).map((w: string, wi: number) => (
                    <span key={wi} className="px-2 py-1 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-md text-[10px] font-bold shadow-sm text-indigo-600 dark:text-indigo-400">{w}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {(subQ.subType === 'interpreting_graph' || subQ.sub_type === 'interpreting_graph') && (subQ.chartConfig || subQ.chart_config) && (
            <div className="p-4 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <BeautifulChart
                type={(subQ.chartConfig || subQ.chart_config).type}
                data={(() => {
                  const cc = subQ.chartConfig || subQ.chart_config;
                  const labels = cc.labels || cc.chartLabels || cc.chart_labels;
                  const data = cc.data || cc.chartData || cc.chart_data;
                  if (Array.isArray(labels) && Array.isArray(data)) {
                    return labels.map((l: string, i: number) => ({ label: l, value: data[i] || 0 }));
                  }
                  return Array.isArray(data) ? data : [];
                })()}
                xAxisLabel={(subQ.chartConfig || subQ.chart_config).xAxisLabel || (subQ.chartConfig || subQ.chart_config).xAxis_label}
                yAxisLabel={(subQ.chartConfig || subQ.chart_config).yAxisLabel || (subQ.chartConfig || subQ.chart_config).yAxis_label}
                isPrint={true}
              />
            </div>
          )}
        </div>

        {subQ.subType === 'interpreting_graph' && (
          <div className="p-3 rounded-xl bg-emerald-50/30 border border-emerald-100/50 text-[10px]">
            <p className="font-black uppercase text-emerald-700 mb-2 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" /> Graph Interpretation Key
            </p>
            <div className="bg-white/70 p-2 rounded border border-emerald-100 shadow-sm text-emerald-900 font-bold leading-relaxed">
              <UniversalMathJax dynamic>{cleanupMath(String(subQ.modelAnswer || subQ.answer || subQ.correctAnswer || subQ.q_ans || subQ.ans || "").replace(/\|\|/g, '\n'))}</UniversalMathJax>
            </div>
          </div>
        )}

        {subQ.subType === 'matching' && (
          <div className="p-3 rounded-xl bg-emerald-50/30 border border-emerald-100/50 text-[10px]">
            <p className="font-black uppercase text-emerald-700 mb-2 flex items-center gap-1">
              <ArrowRight className="w-2.5 h-2.5" /> Pairing Matrix
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {Object.entries((subQ.matches as Record<string, any>) || {}).map(([l, r], mIdx) => (
                <div key={mIdx} className="flex items-center gap-2 bg-white/50 p-1 rounded border border-emerald-50 text-emerald-900 font-medium font-black">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center font-black text-[9px]">{l}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-emerald-300" />
                  <UniversalMathJax inline dynamic>{Array.isArray(r) ? r.join(' → ') : r}</UniversalMathJax>
                </div>
              ))}
            </div>
          </div>
        )}

        {subQ.subType === 'flowchart' && subQ.items && (
          <div className="p-3 rounded-xl bg-emerald-50/30 border border-emerald-100/50 text-[10px]">
            <p className="font-black uppercase text-emerald-700 mb-2 flex items-center gap-1">
              <ArrowRight className="w-2.5 h-2.5" /> Complete Flowchart
            </p>
            <div className="flex flex-wrap items-center gap-2 py-1">
              {subQ.items.map((item: string, ii: number) => (
                <React.Fragment key={ii}>
                  <div className="px-2.5 py-1.5 rounded-lg border bg-white dark:bg-gray-800 text-[10px] font-bold shadow-sm whitespace-pre-wrap text-emerald-900 border-emerald-100">
                    <UniversalMathJax inline dynamic>{item}</UniversalMathJax>
                  </div>
                  {ii < subQ.items.length - 1 && <ArrowRight className="w-3 h-3 text-emerald-300" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {subQ.subType === 'fill_in' && (
          <div className="p-3 rounded-xl bg-emerald-50/30 border border-emerald-100/50 text-[10px]">
            <p className="font-black uppercase text-emerald-700 mb-2 flex items-center gap-1">
              <ArrowRight className="w-2.5 h-2.5" /> Gap-Fill Master Key
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(subQ.answers || subQ.correctAnswers || []).map((ans: string, ai: number) => (
                <div key={ai} className="flex items-center gap-1.5 bg-white/50 p-1 rounded border border-emerald-50 text-emerald-900 font-black">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[8px]">{ai + 1}</span>
                  <UniversalMathJax inline dynamic>{ans}</UniversalMathJax>
                </div>
              ))}
            </div>
          </div>
        )}

        {subQ.subType === 'true_false' && (
          <div className="p-3 rounded-xl bg-emerald-50/30 border border-emerald-100/50 text-[10px]">
            <p className="font-black uppercase text-emerald-700 mb-2 flex items-center gap-1">
              <ArrowRight className="w-2.5 h-2.5" /> True/False Key
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {(subQ.statements || []).map((stmt: string, si: number) => {
                const ans = (subQ.correctAnswers || subQ.answers)?.[si];
                return (
                  <div key={si} className="flex items-center justify-between gap-4 bg-white/50 p-1 rounded border border-emerald-50 text-emerald-900 font-medium">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[8px]">{si + 1}</span>
                      <span className="truncate opacity-75">{stmt}</span>
                    </div>
                    <Badge className="bg-emerald-600 text-white border-0 text-[8px] uppercase font-black px-1.5 h-3.5 leading-none">{String(ans ?? "—")}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {subQ.subType === 'short_answer' && (
          <div className="p-3 rounded-xl bg-emerald-50/30 border border-emerald-100/50 text-[10px]">
            <p className="font-black uppercase text-emerald-700 mb-2 flex items-center gap-1">
              <ArrowRight className="w-2.5 h-2.5" /> Short-Answer Keys
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {(subQ.answers || subQ.modelAnswers || subQ.correctAnswers || []).map((ans: string, ai: number) => (
                <div key={ai} className="bg-white/70 p-1.5 rounded border border-emerald-100 flex items-center gap-3 shadow-sm">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center font-black text-[8px] shrink-0 font-black">{ai + 1}</span>
                  <div className="text-[11px] font-black text-emerald-900 leading-tight">
                    <UniversalMathJax dynamic>{ans}</UniversalMathJax>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subQ.subType === 'error_correction' && (
          <div className="p-3 rounded-xl bg-emerald-50/30 border border-emerald-100/50 text-[10px]">
            <p className="font-black uppercase text-emerald-700 mb-2 flex items-center gap-1">
              <ArrowRight className="w-2.5 h-2.5" /> Error-Correction Keys
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {(subQ.answers || subQ.modelAnswers || subQ.correctAnswers || []).map((ans: string, ai: number) => (
                <div key={ai} className="bg-white/70 p-1.5 rounded border border-emerald-100 flex items-center gap-3 shadow-sm">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center font-black text-[8px] shrink-0 uppercase font-black">{String.fromCharCode(97 + ai)}</span>
                  <div className="text-[11px] font-black text-emerald-900 leading-tight">
                    <UniversalMathJax dynamic>{ans}</UniversalMathJax>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. Specialized Student Response Rendering */}
        {renderSubQuestionContent(subQ, subIdx, questionId)}

        {/* 2. Visual Submission Artifacts (Annotated Pics) */}
        {(subQ.studentImages && subQ.studentImages.length > 0) && (
          <div className="my-6 p-5 rounded-[2rem] bg-slate-900 dark:bg-slate-950 text-white shadow-2xl relative overflow-hidden group/artifact">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/artifact:rotate-12 group-hover/artifact:scale-110 transition-transform">
              <ImageIcon className="w-16 h-16" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submission Artifacts</h5>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Part {subIdx + 1} • Visual Evidence</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-black border-white/20 text-emerald-400">Annotated Artifact</Badge>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {subQ.studentImages.map((imageUrl: string, imgIdx: number) => (
                  <div
                    key={imgIdx}
                    className="aspect-video relative rounded-2xl overflow-hidden border border-white/10 group/img cursor-zoom-in"
                    onClick={() => handleImageZoom(imageUrl, `Submission Review • Part ${subIdx + 1}`, imgIdx, subQ.studentImages, subQ as unknown as Question)}
                  >
                    <img src={imageUrl} alt="Artifact" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/80">View Interaction Fullscreen</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Official Teacher Feedback (Model Answer + Explanation) */}
        {(() => {
          // Broadened extraction logic to catch various backend key variants for SQ, CQ, and Descriptive
          const modelAns = subQ.modelAnswer || subQ.answer || subQ.correctAnswer ||
            (typeof subQ.answers === 'string' ? subQ.answers : null) ||
            subQ.q_ans || subQ.ans || subQ.sub_answer || subQ.model_answer ||
            subQ.correct_answer || (subQ.correctOrder && Array.isArray(subQ.correctOrder) ? subQ.correctOrder.join(', ') : null);

          const modelAnsArray = Array.isArray(subQ.answers) ? subQ.answers :
            (Array.isArray(subQ.modelAnswers) ? subQ.modelAnswers :
              (Array.isArray(subQ.correctAnswers) ? subQ.correctAnswers : null));

          const explanation = subQ.explanation || subQ.sub_explanation || subQ.rationale ||
            subQ.pedagogicalRationale || subQ.explanation_text || subQ.rationale_text;

          const hasExplanation = !!explanation;

          // If no content to show, return null
          if (!hasExplanation && (!modelAns && (!modelAnsArray || modelAnsArray.length === 0))) return null;

          return (
            <div className="mt-6 p-4 md:p-6 rounded-3xl bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] border border-emerald-500/10 dark:border-emerald-500/20 shadow-sm relative overflow-hidden group">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Official Evaluation Copy</h5>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:gap-8">
                  {/* Model Answer Part */}
                  {(modelAns || (modelAnsArray && modelAnsArray.length > 0)) && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" /> Correct Key
                      </p>
                      <div className="pl-4 border-l-2 border-emerald-500/20 max-w-full overflow-x-auto scrollbar-thin">
                        {modelAns && (
                          <div className="text-sm text-emerald-950 dark:text-emerald-50 font-bold leading-relaxed whitespace-pre-wrap break-words">
                            <UniversalMathJax dynamic>{cleanupMath(String(modelAns).replace(/\|\|/g, '\n'))}</UniversalMathJax>
                          </div>
                        )}
                        {modelAnsArray && modelAnsArray.length > 0 && !['matching', 'flowchart', 'interpreting_graph'].includes(subQ.subType) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {modelAnsArray.map((ans: any, ai: number) => (
                              <div key={ai} className="flex gap-2 items-center bg-white/60 dark:bg-slate-900/40 p-2 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30">
                                <span className="font-black text-[9px] bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center shrink-0">{ai + 1}</span>
                                <div className="text-[10px] font-bold text-emerald-900 dark:text-emerald-100"><UniversalMathJax inline dynamic>{cleanupMath(String(ans))}</UniversalMathJax></div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Explanation Part */}
                  {explanation && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                        <Info className="w-3 h-3" /> Pedagogical Rationale
                      </p>
                      <div className="pl-4 border-l-2 border-emerald-500/20 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic max-w-full overflow-x-auto scrollbar-thin break-words">
                        <UniversalMathJax dynamic>{cleanupMath(explanation.replace(/\|\|/g, '\n'))}</UniversalMathJax>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };


  // Print Handler
  // No lint error here anymore
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: result ? `${result.student.name}_${result.exam.name}_Result` : 'Exam_Result',
    onBeforeGetContent: async () => {
      setIsPrinting(true);
      // Wait for MathJax if needed (similar to the other page)
      return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      });
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      triggerHaptic(ImpactStyle.Medium);
    }
  } as any);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
  }, []);

  // Data preparation for MarkedQuestionPaper
  const getPrintData = () => {
    if (!result) return null;

    const questions = {
      mcq: result.questions.filter(q => q.type?.toUpperCase() === 'MCQ').map(q => ({
        id: q.id,
        q: q.questionText,
        options: q.options || [],
        marks: q.marks,
        correct: q.options?.find((o: any) => o.isCorrect)?.text
      })),
      mc: result.questions.filter(q => (q.type || "").toLowerCase() === 'mc').map(q => ({
        id: q.id,
        q: q.questionText,
        options: q.options || [],
        marks: q.marks
      })),
      ar: result.questions.filter(q => (q.type || "").toLowerCase() === 'ar').map(q => ({
        id: q.id,
        assertion: (q as any).assertion || q.questionText,
        reason: (q as any).reason || "",
        marks: q.marks,
        correct: Number((q as any).correct || (q as any).correctOption || 0),
        correctOption: Number((q as any).correctOption || (q as any).correct || 0)
      })),
      mtf: result.questions.filter(q => (q.type || "").toLowerCase() === 'mtf').map(q => ({
        id: q.id,
        q: q.questionText,
        marks: q.marks,
        leftColumn: (q as any).leftColumn || [],
        rightColumn: (q as any).rightColumn || [],
        matches: (q as any).matches || {}
      })),
      int: result.questions.filter(q => (q.type || "").toLowerCase() === 'int' || (q.type || "").toLowerCase() === 'numeric').map(q => ({
        id: q.id,
        q: q.questionText,
        marks: q.marks,
        answer: (q as any).correctAnswer || (q as any).modelAnswer || (q as any).answer || (q as any).correct || 0,
        correctAnswer: (q as any).correctAnswer || (q as any).modelAnswer || (q as any).answer || (q as any).correct || 0,
        modelAnswer: (q as any).modelAnswer || (q as any).correctAnswer || (q as any).answer || (q as any).correct || 0
      })),
      cq: result.questions.filter(q => q.type?.toUpperCase() === 'CQ').map(q => ({
        id: q.id,
        questionText: q.questionText,
        marks: q.marks,
        subQuestions: q.subQuestions || []
      })),
      sq: result.questions.filter(q => q.type?.toUpperCase() === 'SQ').map(q => ({
        id: q.id,
        questionText: q.questionText,
        marks: q.marks,
        modelAnswer: q.modelAnswer
      })),
      smcq: result.questions.filter(q => q.type?.toUpperCase() === 'SMCQ').map(q => ({
        id: q.id,
        questionText: q.questionText,
        marks: q.marks,
        subQuestions: q.subQuestions || []
      })),
      descriptive: result.questions.filter(q => q.type?.toUpperCase() === 'DESCRIPTIVE').map(q => ({
        id: q.id,
        questionText: q.questionText,
        marks: q.marks,
        subQuestions: q.subQuestions || []
      }))
    };

    const answers: Record<string, any> = {};
    result.questions.forEach(q => {
      if (q.studentAnswer) {
        answers[q.id] = q.studentAnswer;
      }
      const type = q.type?.toUpperCase();
      if (type === 'CQ' || type === 'SQ' || type === 'DESCRIPTIVE' || type === 'SMCQ') {
        answers[`${q.id}_marks`] = q.awardedMarks;
      }
    });

    const submission = {
      id: result.submission.id,
      student: {
        name: result.student.name,
        roll: result.student.roll,
        class: result.student.class
      },
      answers: answers,
      result: {
        total: result.submission.score,
        mcqMarks: result.result?.mcqMarks || 0,
        cqMarks: result.result?.cqMarks || 0,
        sqMarks: result.result?.sqMarks || 0
      }
    };

    const examInfo = {
      schoolName: settings?.instituteName || "Digital School",
      schoolAddress: settings?.address || "Dhaka, Bangladesh",
      logoUrl: settings?.logoUrl,
      title: result.exam.name,
      subject: result.exam.subject || "General",
      class: result.exam.class || result.student.class || "N/A",
      date: result.exam.startTime,
      set: result.exam.set || "A",
      totalMarks: result.exam.totalMarks.toString(),
      highestMark: result.statistics.highestScore,
      mcqNegativeMarking: result.exam.mcqNegativeMarking || 0,
      cqRequiredQuestions: result.exam.cqRequiredQuestions,
      sqRequiredQuestions: result.exam.sqRequiredQuestions
    };

    return { questions, submission, examInfo };
  };

  const printData = getPrintData();

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check user role and redirect if admin/teacher
    const checkRoleAndRedirect = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          const role = data.user?.role;
          setUserRole(role);

          if (role === 'ADMIN' || role === 'SUPER_USER' || role === 'TEACHER') {
            toast.info('Redirecting to Evaluation Results...');
            router.push(`/exams/evaluations/${id}/results`);
            return; // Stop further execution
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }

      // Only fetch result if not redirecting
      fetchResult();
      fetchNotifications();
    };

    checkRoleAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showZoomModal) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowZoomModal(false);
        setZoomedImage('');
        setZoomedImageTitle('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showZoomModal]);

  // Reset pagination when filter changes
  useEffect(() => {
    setObjectivePage(1);
    setSqPage(1);
    setCqPage(1);
    setDescriptivePage(1);
  }, [filterStatus]);

  // Function to combine original image with annotations
  const combineImageWithAnnotations = async (originalImageSrc: string, annotationImageSrc: string): Promise<string> => {
    setIsApplyingDrawing(true);
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsApplyingDrawing(false);
        reject(new Error('Could not get canvas context'));
        return;
      }

      const originalImg = new Image();
      const annotationImg = new Image();

      // Fix "Tainted Canvas" security error by allowing CORS
      originalImg.crossOrigin = "anonymous";
      annotationImg.crossOrigin = "anonymous";

      let imagesLoaded = 0;

      const checkBothLoaded = () => {
        imagesLoaded++;
        if (imagesLoaded === 2) {
          try {
            // Set canvas size to match original image
            canvas.width = originalImg.naturalWidth;
            canvas.height = originalImg.naturalHeight;

            // Draw original image first
            ctx.drawImage(originalImg, 0, 0);

            // Draw annotations on top
            ctx.drawImage(annotationImg, 0, 0);

            // Get combined image
            const combinedDataURL = canvas.toDataURL('image/png');
            setIsApplyingDrawing(false);
            resolve(combinedDataURL);
          } catch (err) {
            setIsApplyingDrawing(false);
            reject(err);
          }
        }
      };

      originalImg.onload = checkBothLoaded;
      originalImg.onerror = () => {
        setIsApplyingDrawing(false);
        reject(new Error('Failed to load original image'));
      };

      annotationImg.onload = checkBothLoaded;
      annotationImg.onerror = () => {
        setIsApplyingDrawing(false);
        reject(new Error('Failed to load annotation image'));
      };

      originalImg.src = originalImageSrc;
      annotationImg.src = annotationImageSrc;
    });
  };

  const handleImageZoom = async (imageUrl: string, title: string, index: number, allImages: string[], question: Question) => {
    setActiveZoomImages(allImages);
    setActiveZoomIndex(index);
    setActiveZoomQuestion(question);
    setZoomedImageTitle(title);

    // Robust lookup: Match by index OR by path suffix
    const annotation = question.allDrawings?.find(d =>
      d.imageIndex === index ||
      (imageUrl && d.originalImagePath && (imageUrl.endsWith(d.originalImagePath) || d.originalImagePath.endsWith(imageUrl)))
    );
    setZoomedImage(annotation?.imageData || imageUrl);
    setActiveZoomOriginal(imageUrl || annotation?.originalImagePath || null);

    // PRE-CALCULATE ANNOTATIONS FOR OPTIMIZED RENDERING
    setActiveZoomStrokes(annotation?.drawingData?.strokes || []);
    setActiveZoomTexts(annotation?.drawingData?.texts || []);

    setShowZoomModal(true);
  };

  const handleNextZoomImage = () => {
    if (!activeZoomQuestion || activeZoomImages.length <= 1) return;
    const nextIdx = (activeZoomIndex + 1) % activeZoomImages.length;
    handleImageZoom(activeZoomImages[nextIdx], `Image ${nextIdx + 1}`, nextIdx, activeZoomImages, activeZoomQuestion);
  };

  const handlePrevZoomImage = () => {
    if (!activeZoomQuestion || activeZoomImages.length <= 1) return;
    const prevIdx = (activeZoomIndex - 1 + activeZoomImages.length) % activeZoomImages.length;
    handleImageZoom(activeZoomImages[prevIdx], `Image ${prevIdx + 1}`, prevIdx, activeZoomImages, activeZoomQuestion);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showZoomModal) return;
      if (e.key === 'ArrowRight') {
        handleNextZoomImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevZoomImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showZoomModal, activeZoomIndex, activeZoomImages, activeZoomQuestion]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);

        // Check for review response notifications
        const reviewNotifications = (data.notifications as any[] || []).filter((n: any) =>
          n.type === 'REVIEW_RESPONSE' && n.relatedType === 'result_review'
        ) || [];

        // Only show notification if there are actual review response notifications
        if (reviewNotifications.length > 0) {
          setShowNotification(true);
          toast.success(`You have ${reviewNotifications.length} review response(s)!`);
        } else {
          setShowNotification(false);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exams/results/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch result');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error fetching result:', error);
      setError('Failed to load exam result');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      case 'A': return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
      case 'A-': return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white';
      case 'B+': return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white';
      case 'B': return 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white';
      case 'C': return 'bg-gradient-to-r from-orange-500 to-red-600 text-white';
      case 'D': return 'bg-gradient-to-r from-red-500 to-pink-600 text-white';
      case 'F': return 'bg-gradient-to-r from-gray-500 to-slate-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <Trophy className="h-5 w-5 text-blue-500" />;
  };

  const hasUnevaluatedQuestions = () => {
    if (!result?.questions) return false;

    return result.questions.some((question: Question) => {
      if (question.type?.toUpperCase() === 'CQ' || question.type?.toUpperCase() === 'SQ') {
        // Check if the question has been evaluated (has awarded marks)
        // Only consider unevaluated if student provided an answer but got 0 marks
        const hasStudentAnswer = question.studentAnswer &&
          (typeof question.studentAnswer === 'string' ? question.studentAnswer.trim() !== '' : true) &&
          question.studentAnswer !== 'No answer provided';

        return question.awardedMarks === 0 && question.marks > 0 && hasStudentAnswer;
      }
      return false;
    });
  };

  const hasUnansweredQuestions = () => {
    if (!result?.questions) return false;

    return result.questions.some((question: Question) => {
      if (question.type?.toUpperCase() === 'CQ' || question.type?.toUpperCase() === 'SQ') {
        // Check if student didn't answer the question
        const hasStudentAnswer = question.studentAnswer &&
          (typeof question.studentAnswer === 'string' ? question.studentAnswer.trim() !== '' : true) &&
          question.studentAnswer !== 'No answer provided';

        return question.marks > 0 && !hasStudentAnswer;
      }
      return false;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const downloadResult = async () => {
    if (!result) return;
    setDownloading(true);

    try {
      console.log('Starting PDF generation...');

      // Dynamically import libraries to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Select the element to capture (using the main container class or ID if available, otherwise document.body)
      const element = document.getElementById('exam-result-content') || document.body;
      if (!element) {
        throw new Error("Content element not found");
      }
      console.log('Element found, dimensions:', element.scrollWidth, element.scrollHeight);

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: true, // Enable logging to see issues
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          ignoreElements: (node) => node.classList?.contains('no-print') // Optional: hide buttons
        });

        console.log('Canvas created successfully');
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${result.student.name}_${result.exam.name}_Result.pdf`);
        toast.success('PDF downloaded successfully');
      } catch (canvasError) {
        console.error("html2canvas failed, trying backup:", canvasError);
        // Fallback or retry with lower scale?
        throw canvasError;
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('PDF Generation failed. Opening Print dialog instead...');

      // Fallback to native print
      setTimeout(() => {
        window.print();
      }, 1000);
    } finally {
      setDownloading(false);
    }
  };

  const submitReviewRequest = async () => {
    if (!result || !studentComment.trim()) {
      toast.error('Please provide a comment for review');
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/exams/results/${id}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: studentComment,
          examId: result.exam.id,
          studentId: result.student.id
        })
      });

      if (response.ok) {
        toast.success('Review request submitted successfully');
        setShowReviewModal(false);
        setStudentComment('');
        // Refresh the result data
        fetchResult();
      } else {
        toast.error('Failed to submit review request');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review request');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800">
            <GraduationCap className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>
        <div className="space-y-3 text-center">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Preparing Report</h2>
          <div className="flex items-center gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const reviewNotifications = notifications.filter(n =>
    n.type === 'REVIEW_RESPONSE' && n.relatedType === 'result_review'
  );

  // --- STRICT PRIVACY CHECK START ---
  if (!result || !result.exam || !result.submission) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent shadow-none rounded-[2rem]">
          <CardContent className="p-12 text-center space-y-6">
            <div className="inline-flex p-5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400">
              <Eye className="h-10 w-10 opacity-50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Result Not Found</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">The requested assessment report could not be located or you do not have permission to view it.</p>
            </div>
            <Button asChild className="w-full rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:scale-105 transition-transform">
              <Link href="/student/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result.result && !result.result.isPublished && userRole === 'STUDENT') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="relative z-10 max-w-2xl w-full"
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white dark:border-slate-800 shadow-2xl rounded-[3rem] overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <CardContent className="p-10 sm:p-16 flex flex-col items-center text-center space-y-10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border border-white dark:border-slate-700 shadow-xl group">
                  <Lock className="h-16 w-16 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-500" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800">
                  <Sparkles className="h-3 w-3" /> Status: Evaluation Ongoing
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter">
                  Assessment results <br />
                  <span className="text-blue-600 dark:text-blue-400">are strictly private.</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-md mx-auto leading-relaxed">
                  Your performance in <span className="font-bold text-slate-800 dark:text-slate-200">{result.exam.name}</span> is currently being reviewed by the department.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Submitted</p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-300">
                    {result.submission.submittedAt ? new Date(result.submission.submittedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[10px] uppercase font-black text-blue-400 tracking-widest mb-1">Visibility</p>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-300 italic">Pending Release</p>
                </div>
              </div>

              <div className="space-y-4 w-full">
                <Button asChild className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-500/20 group transition-all duration-300">
                  <Link href="/student/dashboard" className="flex items-center justify-center gap-2">
                    Back to Academic Dashboard
                    <ArrowLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em]">
                  Copyright © 2026 Academic Information System
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }
  // --- STRICT PRIVACY CHECK END ---

  // Calculate marks breakdown
  const mcqQuestions = result.questions?.filter((q: Question) => q.type?.toUpperCase() === 'MCQ') || [];
  const mcQuestions = result.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'mc') || [];
  const arQuestions = result.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'ar') || [];
  const mtfQuestions = result.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'mtf') || [];
  const intQuestions = result.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'int' || (q.type || "").toLowerCase() === 'numeric') || [];
  const smcqQuestions = result.questions?.filter((q: Question) => q.type?.toUpperCase() === 'SMCQ') || [];
  const cqQuestions = result.questions?.filter((q: Question) => q.type?.toUpperCase() === 'CQ' || q.type?.toUpperCase() === 'DESCRIPTIVE') || [];
  const sqQuestions = result.questions?.filter((q: Question) => q.type?.toUpperCase() === 'SQ') || [];
  const objectiveQuestions = [...mcqQuestions, ...mcQuestions, ...arQuestions, ...mtfQuestions, ...intQuestions, ...smcqQuestions];

  // Re-calculate awarded marks on the fly to avoid "zero-score" errors for descriptive/creative parts
  const recalculatedCqMarks = cqQuestions.reduce((sum, q) => sum + (q.awardedMarks || 0), 0);
  const recalculatedSqMarks = sqQuestions.reduce((sum, q) => sum + (q.awardedMarks || 0), 0);

  // Use recalculated values if the provided result.result totals are zero but awarded marks exist
  const effectiveCqMarks = (result.result?.cqMarks || 0) || recalculatedCqMarks;
  const effectiveSqMarks = (result.result?.sqMarks || 0) || recalculatedSqMarks;
  const effectiveTotalMarks = (result.result?.total || 0) || (recalculatedCqMarks + recalculatedSqMarks + (result.result?.mcqMarks || 0));

  /* Fix: Use required counts for marks breakdown if available */
  const cqMarkPerQuestion = cqQuestions[0]?.marks || 10;
  const sqMarkPerQuestion = sqQuestions[0]?.marks || 10;

  const totalObjectiveMarks = objectiveQuestions.reduce((sum: number, q: Question) => sum + q.marks, 0);
  const totalCqMarks = (result.exam.cqRequiredQuestions ? result.exam.cqRequiredQuestions : cqQuestions.length) * cqMarkPerQuestion;
  const totalSqMarks = (result.exam.sqRequiredQuestions ? result.exam.sqRequiredQuestions : sqQuestions.length) * sqMarkPerQuestion;

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground transition-colors duration-500 overflow-x-hidden p-2 sm:p-4 md:p-8">
        {/* Animated Background Elements */}
        {!isMobile && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/10 dark:bg-purple-600/10 rounded-full blur-3xl"
            />
          </div>
        )}

        {Capacitor.isNativePlatform() && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-[100] animate-pulse" />
        )}


        <div className="relative z-10 w-full max-w-7xl 2xl:max-w-[95vw] mx-auto p-4 sm:p-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto">
                <Button asChild variant="outline" size="sm" className="rounded-2xl border-slate-200 dark:border-slate-800 backdrop-blur-md bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300">
                  <Link href="/exams/online">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Exams
                  </Link>
                </Button>
                {userRole && (
                  <Button asChild variant="default" size="sm" className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 border-0">
                    <Link href={
                      userRole === 'STUDENT' ? '/student/dashboard' :
                        userRole === 'TEACHER' ? '/teacher/dashboard' :
                          userRole === 'ADMIN' ? '/admin/dashboard' :
                            userRole === 'SUPER_USER' ? '/super-user/dashboard' :
                              '/dashboard'
                    }>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-auto">
                <div className="backdrop-blur-md bg-white/40 dark:bg-slate-900/40 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex gap-2">
                  {result.result?.isPublished && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrint}
                      disabled={isPrinting}
                      className="rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60"
                    >
                      {isPrinting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : (
                        <Download className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      )}
                      <span className="hidden sm:inline ml-2">Print Script</span>
                    </Button>
                  )}
                  {result.result?.isPublished && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span className="hidden sm:inline ml-2">Share</span>
                    </Button>
                  )}

                </div>
              </div>
            </div>

            <div className="text-center relative mb-16">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center p-2 mb-4"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
                  <div className="relative p-6 rounded-[2.5rem] bg-gradient-to-br from-yellow-400 via-orange-500 to-rose-500 shadow-2xl shadow-orange-500/40 border-b-8 border-orange-700 active:translate-y-2 transition-all">
                    <Trophy className="h-16 w-16 text-white filter drop-shadow-lg" />
                  </div>
                </div>
              </motion.div>

              <div className="max-w-5xl mx-auto space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-blue-500/20"
                >
                  <Sparkles className="h-3 w-3" /> Official Assessment Report
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-8xl font-black leading-[0.85] tracking-tighter break-words">
                  <span className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                    Academic Review.
                  </span>
                </h1>

                <h2 className="text-2xl md:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight break-words uppercase">
                  {result.exam.name}
                </h2>

                <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                  <div className="px-6 py-2 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-slate-800 shadow-xl flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] uppercase font-black text-slate-400 leading-none">Exam Date</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                        {new Date(result.exam.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-2 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-slate-800 shadow-xl flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] uppercase font-black text-slate-400 leading-none">Time Allowance</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                        {result.exam.duration} Minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info Section Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Student Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-800/30 shadow-2xl shadow-slate-200/5 dark:shadow-slate-950/20 rounded-[2.5rem] overflow-hidden group hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-500">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-4 text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <User className="h-6 w-6" />
                    </div>
                    Candidate Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2 p-4 sm:p-6 rounded-[2rem] bg-slate-50/80 dark:bg-slate-800/50 border border-white shadow-inner dark:border-slate-700/30 overflow-hidden">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Student Name</label>
                      <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white break-words">{result.student.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-2 p-4 sm:p-6 rounded-[2rem] bg-indigo-50/80 dark:bg-indigo-950/30 border border-white dark:border-indigo-900/30 text-center shadow-inner overflow-hidden">
                        <label className="text-[10px] uppercase tracking-widest font-black text-indigo-400 dark:text-indigo-600">Roll</label>
                        <div className="text-lg sm:text-2xl font-black text-indigo-900 dark:text-indigo-400 break-words">{result.student.roll}</div>
                      </div>
                      <div className="space-y-2 p-4 sm:p-6 rounded-[2rem] bg-purple-50/80 dark:bg-purple-950/30 border border-white dark:border-purple-900/30 text-center shadow-inner overflow-hidden">
                        <label className="text-[10px] uppercase tracking-widest font-black text-purple-400 dark:text-purple-600">Class</label>
                        <div className="text-lg sm:text-2xl font-black text-purple-900 dark:text-purple-400 break-words">{result.student.class}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Timing Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-800/30 shadow-2xl shadow-slate-200/5 dark:shadow-slate-950/20 rounded-[2.5rem] overflow-hidden group hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-500">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-4 text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <Clock className="h-6 w-6" />
                    </div>
                    Time Metrics & Sections
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-2">
                  {/* Split Section Timings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {result.submission.objectiveStatus && (
                      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Objective</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-indigo-200 text-indigo-600 bg-white dark:bg-slate-900">{result.submission.objectiveStatus}</Badge>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {result.submission.objectiveStartedAt ? new Date(result.submission.objectiveStartedAt).toLocaleTimeString() : '--'} -
                            {result.submission.objectiveSubmittedAt ? new Date(result.submission.objectiveSubmittedAt).toLocaleTimeString() : '--'}
                          </span>
                        </div>
                      </div>
                    )}
                    {result.submission.cqSqStatus && (
                      <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Subjective</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-200 text-emerald-600 bg-white dark:bg-slate-900">{result.submission.cqSqStatus}</Badge>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {result.submission.cqSqStartedAt ? new Date(result.submission.cqSqStartedAt).toLocaleTimeString() : '--'} -
                            {result.submission.cqSqSubmittedAt ? new Date(result.submission.cqSqSubmittedAt).toLocaleTimeString() : '--'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 sm:p-6 rounded-[2rem] bg-slate-50/80 dark:bg-slate-800/50 border border-white dark:border-slate-700/30 flex flex-col items-center justify-center text-center shadow-inner overflow-hidden">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-1">Time Used</label>
                      <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                        {(() => {
                          const objTime = result.submission.objectiveStartedAt && result.submission.objectiveSubmittedAt
                            ? new Date(result.submission.objectiveSubmittedAt).getTime() - new Date(result.submission.objectiveStartedAt).getTime()
                            : 0;
                          const cqTime = result.submission.cqSqStartedAt && result.submission.cqSqSubmittedAt
                            ? new Date(result.submission.cqSqSubmittedAt).getTime() - new Date(result.submission.cqSqStartedAt).getTime()
                            : 0;

                          const totalMs = objTime + cqTime;
                          if (totalMs === 0) return 'N/A';

                          const minutes = Math.floor(totalMs / (1000 * 60));
                          const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
                          return <span className="flex items-baseline flex-wrap justify-center"><span className="text-lg sm:text-3xl">{minutes}</span><span className="text-[9px] sm:text-[10px] ml-0.5 uppercase opacity-60">m</span> <span className="text-lg sm:text-3xl ml-1">{seconds}</span><span className="text-[9px] sm:text-[10px] ml-0.5 uppercase opacity-60">s</span></span>;
                        })()}
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 rounded-[2rem] bg-emerald-50/80 dark:bg-emerald-950/30 border border-white dark:border-emerald-900/30 flex flex-col items-center justify-center text-center shadow-inner overflow-hidden">
                      <label className="text-[10px] uppercase tracking-widest font-black text-emerald-500 dark:text-emerald-700 mb-1">Efficiency Ratio</label>
                      {(() => {
                        const objTime = result.submission.objectiveStartedAt && result.submission.objectiveSubmittedAt
                          ? new Date(result.submission.objectiveSubmittedAt).getTime() - new Date(result.submission.objectiveStartedAt).getTime()
                          : 0;
                        const cqTime = result.submission.cqSqStartedAt && result.submission.cqSqSubmittedAt
                          ? new Date(result.submission.cqSqSubmittedAt).getTime() - new Date(result.submission.cqSqStartedAt).getTime()
                          : 0;

                        const timeTakenMs = objTime + cqTime;
                        const durationMs = result.exam.duration * 60 * 1000;

                        if (timeTakenMs === 0) return <div className="text-lg font-bold text-muted-foreground italic">N/A</div>;
                        const efficiency = Math.max(0, Math.min(100, ((durationMs - timeTakenMs) / durationMs) * 100)).toFixed(0);

                        return (
                          <div className="text-2xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                            {efficiency}<span className="text-sm sm:text-lg opacity-60">%</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="col-span-2 p-4 sm:p-6 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between gap-4 overflow-hidden">
                      <div className="space-y-0.5 min-w-0">
                        <label className="text-[10px] uppercase tracking-widest font-black text-blue-200/80">Submission Deadline Status</label>
                        <div className="text-base md:text-xl font-bold break-words">
                          {(() => {
                            const objTime = result.submission.objectiveStartedAt && result.submission.objectiveSubmittedAt
                              ? new Date(result.submission.objectiveSubmittedAt).getTime() - new Date(result.submission.objectiveStartedAt).getTime()
                              : 0;
                            const cqTime = result.submission.cqSqStartedAt && result.submission.cqSqSubmittedAt
                              ? new Date(result.submission.cqSqSubmittedAt).getTime() - new Date(result.submission.cqSqStartedAt).getTime()
                              : 0;

                            const timeTaken = (objTime + cqTime) / (1000 * 60);
                            return timeTaken <= result.exam.duration ? "Submitted on Time" : "Submitted Late";
                          })()}
                        </div>
                        <div className="text-[10px] text-blue-200/60 font-medium lowercase truncate">
                          at {new Date(result.submission.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                      <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex-shrink-0 flex items-center justify-center border border-white/30 rotate-3">
                        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Result Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            className="mb-12"
          >
            <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800/30 shadow-2xl rounded-[3rem] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-1">
                <div className="bg-white/10 backdrop-blur-md px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/20 border border-white/30 rotate-3 shadow-lg">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight uppercase">Performance Overview</h3>
                      <p className="text-blue-100/80 text-sm font-medium">Consolidated scores and evaluation status</p>
                    </div>
                  </div>
                  {result.result?.isPublished && result.result?.rank && (
                    <div className="flex items-center gap-4 bg-white/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/30 shadow-xl group hover:scale-105 transition-transform duration-500">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest font-black text-blue-100/60 leading-none">Global Rank</p>
                        <p className="text-3xl font-black text-white leading-none mt-1">#{result.result.rank}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-yellow-400 text-orange-700 shadow-lg rotate-6 group-hover:rotate-12 transition-transform">
                        <Crown className="h-6 w-6" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-8 md:p-12">
                {/* Status Alerts */}
                <div className="space-y-4 mb-10">
                  {/* Fix: Hide evaluation banner if results are published */}
                  {!result.result?.isPublished && hasUnevaluatedQuestions() && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                      <div className="p-2 rounded-xl bg-amber-500/20">
                        <Clock className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">EVALUATION IN PROGRESS</p>
                        <p className="text-xs opacity-80">Teacher is reviewing some questions. Your final score will be updated soon.</p>
                      </div>
                    </motion.div>
                  )}
                  {(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
                      <div className="p-2 rounded-xl bg-red-500/20">
                        <XCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold">EXAM SUSPENDED (পরীক্ষা বাতিল)</p>
                        <p className="text-sm opacity-80">{result.result?.suspensionReason || 'Violation of exam rules detected.'}</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {!result.result?.isPublished ? (
                  /* Unpublished State Banner */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900 shadow-inner"
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl relative z-10 border border-indigo-100 dark:border-indigo-900">
                        <Lock className="h-12 w-12 text-indigo-500" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-3">
                      Hang Tight! 🚀
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-8 text-lg">
                      Your answers have been securely submitted. The detailed results and score breakdown will be unlocked as soon as the evaluation is officially published.
                    </p>
                    <div className="flex items-center gap-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-6 py-3 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                      <Clock className="w-4 h-4 animate-spin-slow" /> Awaiting Teacher Publication
                    </div>
                  </motion.div>
                ) : (
                  /* Published Score Breakdown */
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                    {/* Score Breakdown Section */}
                    <div className="xl:col-span-3 space-y-8">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                          Score Breakdown
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {objectiveQuestions.length > 0 && (
                          <div className="p-4 sm:p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-all duration-300 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-2 sm:p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                                <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <Badge variant="outline" className="rounded-full border-blue-200 text-blue-600 bg-blue-50/50 text-[10px] px-2">Objective</Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earned Marks</p>
                              <div className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-baseline flex-wrap">
                                {result.result?.mcqMarks}
                                <span className="text-sm sm:text-lg font-bold text-slate-400 ml-1">/{totalObjectiveMarks}</span>
                              </div>
                              {result.result?.mcqMarks! < 0 && (
                                <p className="text-[8px] sm:text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full inline-block mt-1">Negative Marking Applied</p>
                              )}
                            </div>
                          </div>
                        )}

                        {cqQuestions.length > 0 && (
                          <div className="p-4 sm:p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-all duration-300 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-2 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <Badge variant="outline" className="rounded-full border-emerald-200 text-emerald-600 bg-emerald-50/50 text-[10px] px-2">Creative</Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earned Marks</p>
                              <div className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-baseline flex-wrap">
                                {effectiveCqMarks}
                                <span className="text-sm sm:text-lg font-bold text-slate-400 ml-1">/{totalCqMarks}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {sqQuestions.length > 0 && (
                          <div className="p-4 sm:p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-all duration-300 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-2 sm:p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <Badge variant="outline" className="rounded-full border-amber-200 text-amber-600 bg-amber-50/50 text-[10px] px-2">Short Questions</Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earned Marks</p>
                              <div className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-baseline flex-wrap">
                                {effectiveSqMarks}
                                <span className="text-sm sm:text-lg font-bold text-slate-400 ml-1">/{totalSqMarks}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="sm:col-span-1 p-4 sm:p-6 rounded-[2rem] bg-indigo-600 shadow-xl shadow-indigo-600/20 border-b-4 border-indigo-800 text-white flex flex-col justify-between overflow-hidden">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Total Aggregate</p>
                          <div className="mt-2 text-center sm:text-left">
                            <div className="text-3xl sm:text-5xl font-black flex items-baseline justify-center sm:justify-start flex-wrap leading-none">
                              {effectiveTotalMarks}
                              <span className="text-lg sm:text-xl text-indigo-300 ml-1 sm:ml-2">/{result.exam.totalMarks}</span>
                            </div>
                            {(() => {
                              const negativeTotal = (result.questions || []).reduce((sum, q: any) => {
                                if (q.awardedMarks < 0) return sum + Math.abs(q.awardedMarks);
                                return sum;
                              }, 0);
                              if (negativeTotal > 0) {
                                return (
                                  <p className="text-[10px] font-bold text-indigo-100 bg-white/10 px-2 py-0.5 rounded-full inline-block mt-2 backdrop-blur-sm">
                                    Deducted: {negativeTotal.toFixed(2).replace(/\.00$/, '')}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Section */}
                    <div className="xl:col-span-2 space-y-8">
                      <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-8 bg-purple-600 rounded-full"></div>
                        Final Analysis
                      </h4>

                      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors duration-500"></div>
                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                          <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40 animate-pulse"></div>
                            <div className={`text-5xl sm:text-7xl font-black drop-shadow-2xl ${result.result?.grade === 'A+' ? 'text-yellow-400' :
                              result.result?.grade?.startsWith('A') ? 'text-blue-400' :
                                'text-white'
                              }`}>
                              {result.result?.grade || 'N/A'}
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 mt-2">Overall Grade</p>
                          </div>

                          <div className="w-full space-y-2">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                              <span>Accuracy</span>
                              <span className="text-blue-400">{result.exam.totalMarks > 0 && result.result?.total !== undefined ? ((result.result.total / result.exam.totalMarks) * 100).toFixed(1) : '0.0'}%</span>
                            </div>
                            <Progress
                              value={result.exam.totalMarks > 0 && result.result?.total !== undefined ? (result.result.total / result.exam.totalMarks) * 100 : 0}
                              className="h-3 bg-white/10 rounded-full overflow-hidden"
                            />
                          </div>

                          {result.result?.comment && (
                            <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-sm italic text-slate-300 leading-relaxed font-medium">
                              " {result.result.comment} "
                            </div>
                          )}

                          <div className="flex gap-4 w-full">
                            <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/10">
                              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Accuracy</p>
                              <p className="text-lg font-black">
                                {(() => {
                                  const answered = result.questions.filter(q => hasStudentAnswered(q.type, q.studentAnswer, q.subQuestions || q.sub_questions)).length;
                                  const correct = result.questions.filter(q => isAnswerCorrect(q.awardedMarks, q.marks)).length;
                                  return answered > 0 ? ((correct / answered) * 100).toFixed(0) : '0';
                                })()}%
                              </p>
                            </div>
                            <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/10">
                              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Status</p>
                              <p className={`text-lg font-black ${result.result?.grade === 'F' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {result.result?.grade === 'F' ? 'FAILED' : 'PASSED'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          {/* Statistics Grid - STRICTLY ONLY visible if published */}
          {result.result?.isPublished && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {[
                { label: "Average Score", value: (result.statistics.averageScore || 0).toFixed(1), icon: BarChart3, color: "blue" },
                { label: "Highest Score", value: result.statistics.highestScore, icon: TrendingUp, color: "emerald" },
                { label: "Lowest Score", value: result.statistics.lowestScore, icon: Target, color: "rose" },
                { label: "Total Peers", value: result.statistics.totalStudents, icon: Users, color: "indigo" }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * idx }}
                  className="group relative"
                >
                  <div className={`p-6 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-${stat.color}-500/10 hover:border-${stat.color}-500/30 transition-all duration-500 shadow-xl shadow-${stat.color}-500/5`}>
                    <div className={`absolute top-6 right-6 p-2 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors">{stat.label}</p>
                      <p className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter tabular-nums">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}


          {/* Review Request Section */}
          {
            result.reviewRequest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8"
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-6 w-6" />
                      Review Request Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Status Badge */}
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            result.reviewRequest.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : result.reviewRequest.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          {result.reviewRequest.status === 'PENDING' && '⏳ Pending Review'}
                          {result.reviewRequest.status === 'APPROVED' && '✅ Review Complete'}
                          {result.reviewRequest.status === 'REJECTED' && '❌ Review Rejected'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Requested on {new Date(result.reviewRequest.requestedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Student's Comment */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Your Review Request:
                        </h4>
                        <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                          <p className="text-gray-700">{result.reviewRequest.studentComment}</p>
                        </div>
                      </div>

                      {/* Evaluator's Response */}
                      {result.reviewRequest.evaluatorComment && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Teacher&apos;s Response:
                            {result.reviewRequest.reviewer && (
                              <span className="text-sm text-gray-600">
                                (by {result.reviewRequest.reviewer.name})
                              </span>
                            )}
                          </h4>
                          <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                            <p className="text-gray-700">{result.reviewRequest.evaluatorComment}</p>
                            {result.reviewRequest.reviewedAt && (
                              <div className="mt-2 text-sm text-gray-600">
                                Responded on {new Date(result.reviewRequest.reviewedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pending Status Message */}
                      {result.reviewRequest.status === 'PENDING' && !result.reviewRequest.evaluatorComment && (
                        <div className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">
                              Your review request is being processed. You will be notified when the teacher responds.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          }

          {/* Question Review Section - STRICTLY hidden until published */}
          {
            result.result?.isPublished && result.questions && result.questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-8"
              >
                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-800/30 shadow-2xl rounded-[3rem] overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1">
                    <div className="bg-white/10 backdrop-blur-md px-8 py-6">
                      <CardTitle className="flex items-center gap-4 text-2xl font-black text-white tracking-tight uppercase">
                        <div className="p-3 rounded-2xl bg-white/20 border border-white/30 rotate-3 shadow-lg">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        Question Paper Review
                      </CardTitle>
                    </div>
                  </div>
                  <CardContent className="p-8 md:p-12">
                    {/* Filter Controls (Consolidated for Objective) */}
                    <div className="flex flex-wrap items-center gap-3 mb-12 p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-200/50 dark:border-slate-700/30 backdrop-blur-sm shadow-inner">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mr-2">Filter Objective:</span>
                      {[
                        { id: 'ALL', label: 'All', icon: Layers, color: 'bg-indigo-600 shadow-indigo-500/25' },
                        { id: 'CORRECT', label: 'Correct', icon: CheckCircle, color: 'bg-emerald-600 shadow-emerald-500/25' },
                        { id: 'WRONG', label: 'Wrong', icon: XCircle, color: 'bg-rose-600 shadow-rose-500/25' },
                        { id: 'PARTIAL', label: 'Partial', icon: Activity, color: 'bg-amber-600 shadow-amber-500/25' },
                        { id: 'UNANSWERED', label: 'Blank', icon: Minus, color: 'bg-slate-600 shadow-slate-500/25' }
                      ].map(f => (
                        <Button
                          key={f.id}
                          variant={filterStatus === f.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterStatus(f.id as any); setObjectivePage(1); }}
                          className={cn(
                            "rounded-xl px-6 transition-all duration-300",
                            filterStatus === f.id ? `${f.color} text-white shadow-lg` : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          <f.icon className="h-4 w-4 mr-2" /> {f.label}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-12">
                      {/* 1. OBJECTIVE SECTION (Unified MCQ, MC, MTF, AR, INT, SMCQ) */}
                      {(() => {
                        const objectiveTypes = ['MCQ', 'MC', 'MTF', 'AR', 'INT', 'NUMERIC', 'SMCQ'];
                        const filteredQuestions = (result.questions || []).filter(q => {
                          const type = (q.type || "").toUpperCase();
                          if (!objectiveTypes.includes(type)) return false;

                          const hasAnswer = hasStudentAnswered(type, q.studentAnswer, q.subQuestions || q.sub_questions);
                          const isCorrect = isAnswerCorrect(q.awardedMarks, q.marks);
                          const isPartial = hasAnswer && !isCorrect && Number(q.awardedMarks) > 0;

                          switch (filterStatus as any) {
                            case 'CORRECT': return isCorrect;
                            case 'WRONG': return hasAnswer && !isCorrect && !isPartial;
                            case 'PARTIAL': return isPartial;
                            case 'UNANSWERED': return !hasAnswer;
                            default: return true;
                          }
                        });

                        if (filteredQuestions.length === 0) return null;

                        const pageSize = 8;
                        const totalPages = Math.ceil(filteredQuestions.length / pageSize);
                        const startIndex = (objectivePage - 1) * pageSize;
                        const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

                        return (
                          <div id="objective-questions-section" className="space-y-8 animate-in fade-in duration-700">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredQuestions.length} Items Found</p>
                              </div>
                            </div>

                            <div className="space-y-8">
                              {paginatedQuestions.map((question, index) => {
                                const type = (question.type || "").toUpperCase();
                                const gIdx = startIndex + index;
                                const isCorrect = isAnswerCorrect(question.awardedMarks, question.marks);
                                const hasAns = hasStudentAnswered(type, question.studentAnswer, question.subQuestions || question.sub_questions);
                                const isPartial = hasAns && !isCorrect && Number(question.awardedMarks) > 0;

                                return (
                                  <motion.div
                                    key={question.id}
                                    initial={!isMobile ? { opacity: 0, x: -20 } : { opacity: 0 }}
                                    whileInView={!isMobile ? { opacity: 1, x: 0 } : { opacity: 1 }}
                                    viewport={{ once: true }}
                                    className={cn(
                                      "relative border-2 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 transition-all duration-500",
                                      isCorrect ? "bg-emerald-50/30 border-emerald-100/50 dark:bg-emerald-950/10 dark:border-emerald-900/40" :
                                        isPartial ? "bg-amber-50/30 border-amber-100/50 dark:bg-amber-950/10 dark:border-amber-900/40" :
                                          hasAns ? "bg-rose-50/30 border-rose-100/50 dark:bg-rose-950/10 dark:border-rose-900/40" :
                                            "bg-slate-50/50 border-slate-100 dark:bg-slate-900/20 dark:border-slate-800/40 opacity-60"
                                    )}
                                  >
                                    {/* Question Type & Index Header */}
                                    <div className="flex items-center justify-between gap-4 mb-8">
                                      <div className="flex items-center gap-3">
                                        <Badge className="bg-indigo-600 text-white text-[10px] font-black rounded-xl px-4 py-1.5 uppercase tracking-widest shadow-lg shadow-indigo-500/20">#{gIdx + 1}</Badge>
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                                          {type === 'INT' ? 'INT / NUMERIC' : type}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={isCorrect ? 'default' : 'destructive'} className="text-[10px] font-black italic px-3 py-1 rounded-full shadow-sm">
                                          {Number(question.awardedMarks).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}/{question.marks}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Question Text (for non-SMCQ) */}
                                    {type !== 'SMCQ' && (
                                      <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight mb-8">
                                        <UniversalMathJax dynamic>{cleanupMath(question.questionText || "")}</UniversalMathJax>
                                      </div>
                                    )}

                                    {/* SMCQ Scenario Rendering */}
                                    {type === 'SMCQ' && (
                                      <div className="mb-10 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                        <div className="p-4 md:p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-[2rem] md:rounded-[3rem] border-2 border-indigo-500/20 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
                                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Layers className="h-24 w-24 text-indigo-500" />
                                          </div>
                                          <div className="relative z-10">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-500/30">
                                              <Sparkles className="h-3.5 w-3.5" /> Scenario Context
                                            </div>
                                            <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight max-w-full overflow-x-auto scrollbar-thin">
                                              <UniversalMathJax dynamic>{cleanupMath(question.questionText || (question as any).text || "")}</UniversalMathJax>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-12 pl-4 md:pl-12 border-l-4 border-dashed border-indigo-500/20 dark:border-indigo-500/10">
                                          {(question.subQuestions || question.sub_questions || []).map((subQ: any, subIdx: number) => (
                                            <div key={subIdx} className="relative space-y-8 group">
                                              <div className="absolute -left-[1.65rem] md:-left-[3.15rem] top-2 w-4 h-4 rounded-full bg-white dark:bg-slate-950 border-4 border-indigo-500 shadow-lg shadow-indigo-500/50 z-10" />

                                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                                <div className="flex-1 space-y-4">
                                                  <div className="flex items-center gap-3">
                                                    <span className="text-2xl font-black text-indigo-600/30 dark:text-indigo-400/20 italic tabular-nums">
                                                      PART {String(subIdx + 1).padStart(2, '0')}
                                                    </span>
                                                    <Badge variant="outline" className="rounded-full px-4 py-1 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[10px] uppercase font-black tracking-widest text-slate-500">
                                                      {subQ.marks} MARK{subQ.marks !== 1 ? 'S' : ''}
                                                    </Badge>
                                                  </div>
                                                  <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                                    <UniversalMathJax inline dynamic>{cleanupMath(subQ.text || subQ.questionText || subQ.question || subQ.q || subQ.question_text || "")}</UniversalMathJax>
                                                  </div>
                                                </div>

                                                {(subQ.studentAnswer !== undefined && subQ.studentAnswer !== null && subQ.studentAnswer !== '' && subQ.studentAnswer !== 'No answer provided') && (
                                                  <div className={cn(
                                                    "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border whitespace-nowrap",
                                                    subQ.isCorrect
                                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                      : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                                  )}>
                                                    {subQ.isCorrect ? "Perfect Result" : "Corrected Response"}
                                                  </div>
                                                )}
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(subQ.options || []).map((opt: any, oi: number) => {
                                                  const optText = typeof opt === 'object' ? opt.text : opt;
                                                  const isSel = subQ.studentAnswer !== undefined && subQ.studentAnswer !== null && String(subQ.studentAnswer).trim() === String(optText).trim();
                                                  const isCorOpt = (opt.isCorrect || (subQ.correctAnswer !== undefined && subQ.correctAnswer !== null && (String(subQ.correctAnswer).trim() === String(optText).trim() || Number(subQ.correctAnswer) === oi)));

                                                  let optStyle = "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-400 opacity-60 grayscale-[0.5]";
                                                  let optIcon = null;

                                                  if (isSel && isCorOpt) {
                                                    optStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-50 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10 grayscale-0 scale-[1.02]";
                                                    optIcon = <CheckCircle className="h-4 w-4 text-emerald-600" />;
                                                  } else if (isSel && !isCorOpt) {
                                                    optStyle = "border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-50 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/10 grayscale-0";
                                                    optIcon = <XCircle className="h-4 w-4 text-rose-600" />;
                                                  } else if (!isSel && isCorOpt) {
                                                    optStyle = "border-emerald-500/40 bg-emerald-500/5 text-emerald-700/80 border-dashed grayscale-0";
                                                    optIcon = <CheckCircle className="h-4 w-4 text-emerald-400" />;
                                                  }

                                                  return (
                                                    <div key={oi} className={`relative p-5 rounded-[2rem] border-2 flex items-center gap-5 transition-all duration-300 ${optStyle}`}>
                                                      <span className={cn(
                                                        "w-10 h-10 flex items-center justify-center rounded-2xl text-[11px] font-black shadow-sm transition-colors",
                                                        isSel ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                      )}>
                                                        {String.fromCharCode(0x0995 + oi)}
                                                      </span>
                                                      <span className="flex-1 text-sm font-bold tracking-tight">
                                                        <UniversalMathJax inline dynamic>{cleanupMath(optText)}</UniversalMathJax>
                                                      </span>
                                                      <div className="flex-shrink-0">{optIcon}</div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Result Rendering Logic (MCQ/MC/AR) */}
                                    {(type === 'MCQ' || type === 'MC' || type === 'AR') && (question.options || type === 'AR') ? (
                                      <div className="space-y-4">
                                        {(() => {
                                          let optionsToRender = question.options;
                                          // Handle options for AR specifically if missing
                                          if (type === 'AR' && (!optionsToRender || optionsToRender.length === 0)) {
                                            optionsToRender = [
                                              { text: "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং R হলো A এর সঠিক ব্যাখ্যা", isCorrect: false },
                                              { text: "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু R হলো A এর সঠিক ব্যাখ্যা নয়", isCorrect: false },
                                              { text: "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা", isCorrect: false },
                                              { text: "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক", isCorrect: false },
                                              { text: "Assertion (A) ও Reason (R) উভয়ই মিথ্যা", isCorrect: false }
                                            ];
                                          }

                                          return (optionsToRender || []).map((option, optIndex) => {
                                            const optText = typeof option === 'object' ? option.text : option;
                                            const rawAnswer = question.studentAnswer;

                                            // --- PRECISE isSelected DETECTION ---
                                            let isSelected = false;
                                            if (type === 'MC') {
                                              // MC stores selectedOptions as index array
                                              isSelected = rawAnswer?.selectedOptions?.includes(optIndex) ?? false;
                                            } else if (type === 'AR') {
                                              // AR stores selectedOption as 1-indexed number
                                              isSelected = (rawAnswer?.selectedOption === optIndex + 1) ||
                                                (Number(rawAnswer) === optIndex + 1);
                                            } else {
                                              // MCQ: studentAnswer is the chosen option text (string)
                                              const isTextMatch = typeof rawAnswer === 'string' &&
                                                rawAnswer.trim() !== '' &&
                                                rawAnswer.trim() === String(optText).trim();
                                              // Fallback: if stored as 0-based index number
                                              const isIndexMatch = typeof rawAnswer === 'number' && rawAnswer === optIndex;
                                              isSelected = isTextMatch || isIndexMatch;
                                            }

                                            // --- PRECISE isCorrectOpt DETECTION ---
                                            let isCorrectOpt = false;
                                            if (type === 'MC') {
                                              isCorrectOpt = !!(option as any).isCorrect;
                                            } else if (type === 'AR') {
                                              // AR: correctOption is 1-indexed
                                              const correctIdx = (question as any).correctOption ?? (question as any).correct;
                                              isCorrectOpt = Number(correctIdx) === optIndex + 1;
                                            } else {
                                              // MCQ: first check option.isCorrect flag, then fallback to correctOption index
                                              if ((option as any).isCorrect !== undefined) {
                                                isCorrectOpt = !!(option as any).isCorrect;
                                              } else {
                                                const correctIdx = (question as any).correctOption ?? (question as any).correct ?? (question as any).correctAnswer;
                                                if (correctIdx !== undefined && correctIdx !== null) {
                                                  isCorrectOpt = Number(correctIdx) === optIndex;
                                                }
                                              }
                                            }

                                            let containerStyle = "";
                                            let icon = null;
                                            let labelStyle = "";

                                            if (isSelected && isCorrectOpt) {
                                              // 1. Correct and Selected -> GREEN
                                              containerStyle = "border-green-500 bg-green-500/10 text-foreground shadow-md ring-1 ring-green-500/20 transform scale-[1.01]";
                                              icon = <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 fill-green-500/10" />;
                                              labelStyle = "bg-green-500 text-white";
                                            } else if (isSelected && !isCorrectOpt) {
                                              // 2. Wrong and Selected -> RED
                                              containerStyle = "border-red-500 bg-red-500/10 text-foreground shadow-md ring-1 ring-red-500/20";
                                              icon = <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 fill-red-500/10" />;
                                              labelStyle = "bg-red-500 text-white";
                                            } else if (!isSelected && isCorrectOpt) {
                                              // 3. Correct but NOT Selected -> BLUE/TEAL (Distinct)
                                              containerStyle = "border-teal-500/50 bg-teal-500/5 text-foreground border-dashed ring-1 ring-teal-500/10";
                                              icon = <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0" />;
                                              labelStyle = "bg-teal-500 text-white";
                                            } else {
                                              // 4. Wrong and NOT Selected -> GRAY (Faded)
                                              containerStyle = "border-border bg-card text-muted-foreground opacity-60 hover:opacity-100 transition-opacity";
                                              labelStyle = "bg-muted text-muted-foreground";
                                            }

                                            return (
                                              <div
                                                key={optIndex}
                                                className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${containerStyle}`}
                                              >
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${labelStyle}`}>
                                                  {String.fromCharCode(0x0995 + optIndex)}
                                                </span>
                                                <span className="flex-1 font-medium text-base leading-relaxed break-words overflow-x-auto max-w-full scrollbar-thin">
                                                  <UniversalMathJax inline dynamic>
                                                    {type === 'AR' ? [
                                                      "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং R হলো A এর সঠিক ব্যাখ্যা",
                                                      "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু R হলো A এর সঠিক ব্যাখ্যা নয়",
                                                      "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা",
                                                      "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক",
                                                      "Assertion (A) ও Reason (R) উভয়ই মিথ্যা"
                                                    ][optIndex] : cleanupMath(optText)}
                                                  </UniversalMathJax>
                                                </span>
                                                {icon}
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    ) : (type === 'INT' || type === 'NUMERIC') ? (
                                      <div className="p-4 bg-card rounded-lg border-2 border-primary/20 flex flex-col gap-4">
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-4">
                                            <div className="text-sm font-bold text-gray-600">
                                              Your Answer:
                                              {((question.studentAnswer as any)?.answer !== undefined || (question.studentAnswer !== undefined && question.studentAnswer !== null && question.studentAnswer !== '')) ? (
                                                <span className={`ml-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                  {(question.studentAnswer as any)?.answer !== undefined ? (question.studentAnswer as any).answer : question.studentAnswer}
                                                </span>
                                              ) : (
                                                <span className="ml-2 text-gray-400 italic">Unanswered</span>
                                              )}
                                            </div>
                                            <div className="w-px h-4 bg-gray-200" />
                                            <div className="text-sm font-bold text-indigo-600">
                                              Correct Answer: <span className="ml-2">{(question as any).correctAnswer || (question as any).answer || (question as any).correct || (question as any).modelAnswer}</span>
                                            </div>
                                          </div>
                                          {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600" /> : (question.studentAnswer ? <XCircle className="h-5 w-5 text-red-600" /> : null)}
                                        </div>
                                      </div>
                                    ) : type === 'MTF' ? (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <div className="text-xs font-bold text-muted-foreground uppercase">Column A</div>
                                            {(question as any).leftColumn?.map((item: any, i: number) => (
                                              <div key={i} className="p-2 bg-card border border-border rounded text-sm min-h-[40px] flex items-center">
                                                <span className="font-bold mr-2 text-muted-foreground">{i + 1}.</span>
                                                <UniversalMathJax inline dynamic>{cleanupMath(item.text)}</UniversalMathJax>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="space-y-2">
                                            <div className="text-xs font-bold text-muted-foreground uppercase">Column B</div>
                                            {(question as any).rightColumn?.map((item: any, i: number) => (
                                              <div key={i} className="p-2 bg-card border border-border rounded text-sm min-h-[40px] flex items-center">
                                                <span className="font-bold mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                                                <UniversalMathJax inline dynamic>{cleanupMath(item.text)}</UniversalMathJax>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3 text-center">Match Analysis</div>
                                          <div className="overflow-x-auto rounded-lg border border-indigo-500/20 shadow-sm">
                                            <table className="w-full text-sm min-w-[500px]">
                                              <thead className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                                <tr>
                                                  <th className="p-3 text-left w-1/3">Question (Left)</th>
                                                  <th className="p-3 text-left w-1/3">Your Match</th>
                                                  <th className="p-3 text-left w-1/3">Correct Match</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-indigo-500/10 bg-card">
                                                {(question as any).leftColumn?.map((item: any, lIdx: number) => {
                                                  const correctMatches = (question as any).matches || {};
                                                  const studentMatches = (question.studentAnswer as any)?.matches || (question.studentAnswer as any) || {};

                                                  // Normalize student answer
                                                  let studentRightId = null;
                                                  if (Array.isArray(studentMatches)) {
                                                    const match = studentMatches.find((m: any) => m.leftIndex === lIdx || m.leftId === item.id);
                                                    if (match) studentRightId = match.studentRightId || match.rightId || (question as any).rightColumn?.[match.rightIndex]?.id;
                                                  } else {
                                                    studentRightId = studentMatches[item.id];
                                                  }

                                                  const correctRightId = correctMatches[item.id];
                                                  const isMatchCorrect = studentRightId === correctRightId && !!studentRightId;
                                                  const isUnanswered = !studentRightId;

                                                  const rightItem = (question as any).rightColumn?.find((r: any) => r.id === studentRightId);
                                                  const studentRightIdx = (question as any).rightColumn?.findIndex((r: any) => r.id === studentRightId);

                                                  const correctRightItem = (question as any).rightColumn?.find((r: any) => r.id === correctRightId);
                                                  const correctRightIdx = (question as any).rightColumn?.findIndex((r: any) => r.id === correctRightId);

                                                  // Visual labels
                                                  const vlLeft = toBengaliNumerals(lIdx + 1);
                                                  const vStudentRight = studentRightIdx !== -1 ? String.fromCharCode(65 + studentRightIdx) : null;
                                                  const vCorrectRight = correctRightIdx !== -1 ? String.fromCharCode(65 + correctRightIdx) : null;

                                                  // Row styling
                                                  const rowClass = isMatchCorrect
                                                    ? "bg-green-500/5 dark:bg-green-500/10"
                                                    : isUnanswered
                                                      ? "bg-muted/30 opacity-90"
                                                      : "bg-red-500/5 dark:bg-red-500/10";

                                                  return (
                                                    <tr key={lIdx} className={rowClass}>
                                                      <td className="p-3 border-r border-indigo-500/10 font-medium">
                                                        <div className="flex items-center gap-1">
                                                          <span className="font-bold text-muted-foreground shrink-0">{vlLeft}.</span>
                                                          <UniversalMathJax inline dynamic>{cleanupMath(item.text)}</UniversalMathJax>
                                                        </div>
                                                      </td>
                                                      <td className={`p-3 border-r border-indigo-500/10 ${isMatchCorrect ? 'text-green-600 dark:text-green-400 font-bold' : isUnanswered ? 'text-muted-foreground italic' : 'text-red-600 dark:text-red-400 font-bold'}`}>
                                                        {isUnanswered ? (
                                                          "No selection"
                                                        ) : (
                                                          <div className="flex items-center gap-1">
                                                            {vStudentRight && <span className="font-bold shrink-0">{vStudentRight}.</span>}
                                                            {rightItem ? <UniversalMathJax inline dynamic>{cleanupMath(rightItem.text)}</UniversalMathJax> : "Unknown"}
                                                            {isMatchCorrect ? <CheckCircle className="inline h-4 w-4 ml-1" /> : <XCircle className="inline h-4 w-4 ml-1" />}
                                                          </div>
                                                        )}
                                                      </td>
                                                      <td className="p-3 text-green-600 dark:text-green-400 font-medium">
                                                        <div className="flex items-center gap-1">
                                                          {vCorrectRight && <span className="font-bold shrink-0">{vCorrectRight}.</span>}
                                                          {correctRightItem ? <UniversalMathJax inline dynamic>{cleanupMath(correctRightItem.text)}</UniversalMathJax> : "N/A"}
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
                                    ) : null}

                                    {/* Restoration: Objective Explanation Section */}
                                    {(question.explanation || (question as any).explanationImage) && (
                                      <div className="mt-6 p-5 rounded-3xl bg-amber-500/[0.03] dark:bg-amber-500/[0.05] border border-amber-500/10 dark:border-amber-500/20 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
                                        <div className="relative z-10 space-y-3">
                                          <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                              <Sparkles className="w-3.5 h-3.5" />
                                            </div>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Explanation / ব্যাখ্যা</h5>
                                          </div>
                                          <div className="pl-4 border-l-2 border-amber-500/20">
                                            {question.explanation && (
                                              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                                                <UniversalMathJax dynamic>{cleanupMath(question.explanation.replace(/\|\|/g, '\n'))}</UniversalMathJax>
                                              </div>
                                            )}
                                            {(question as any).explanationImage && (
                                              <div className="mt-4 relative group/expimg cursor-zoom-in max-w-xl" onClick={() => handleImageZoom((question as any).explanationImage, "Explanation Diagram", 0, [(question as any).explanationImage], question as unknown as Question)}>
                                                <img
                                                  src={(question as any).explanationImage}
                                                  alt="Explanation Graphic"
                                                  className="rounded-2xl border border-amber-200/50 shadow-md group-hover/expimg:scale-[1.01] transition-transform duration-500"
                                                  loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover/expimg:bg-black/5 transition-colors rounded-2xl" />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Pagination Controls */}
                            {
                              totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8 p-4 bg-card rounded-lg border border-border shadow-sm text-slate-500">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setObjectivePage(curr => Math.max(1, curr - 1));
                                      document.getElementById('objective-questions-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    disabled={objectivePage === 1}
                                    className="w-24"
                                  >
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                  </Button>
                                  <div className="flex items-center gap-1 mx-4">
                                    <span className="text-sm font-medium">Page <span className="font-bold text-slate-800">{objectivePage}</span> of <span className="font-bold text-slate-800">{totalPages}</span></span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setObjectivePage(curr => Math.min(totalPages, curr + 1));
                                      document.getElementById('objective-questions-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    disabled={objectivePage === totalPages}
                                    className="w-24"
                                  >
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </div>
                              )
                            }
                          </div>
                        );
                      })()}






                      {/* 2. SHORT QUESTIONS SECTION (SQ) */}
                      {(() => {
                        const sqTypes = ['SQ'];
                        const filteredQuestions = (result.questions || []).filter(q => sqTypes.includes((q.type || "").toUpperCase()));
                        if (filteredQuestions.length === 0) return null;

                        const pageSize = 8;
                        const totalPages = Math.ceil(filteredQuestions.length / pageSize);
                        const startIndex = (sqPage - 1) * pageSize;
                        const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

                        return (
                          <div id="sq-section" className="space-y-8 animate-in fade-in duration-700">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner">
                                <Layers className="h-6 w-6 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Short Questions</h3>
                                  <Badge className="bg-amber-600/10 text-amber-600 border-amber-600/20 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Evaluation Required</Badge>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Info className="w-3 h-3" />
                                  Section II • {filteredQuestions.length} Questions (Short Response)
                                </p>
                              </div>
                            </div>

                            <div className="space-y-12">
                              {paginatedQuestions.map((q, idx) => (
                                <motion.div key={q.id} initial={!isMobile ? { opacity: 0, y: 20 } : { opacity: 0 }} whileInView={!isMobile ? { opacity: 1, y: 0 } : { opacity: 1 }} viewport={{ once: true }} className="space-y-6">
                                  <div className="flex items-center gap-4">
                                    <Badge className="bg-amber-600/10 text-amber-600 border-amber-600/20 text-[10px] font-black px-4 py-1.5 rounded-full">SQ #{startIndex + idx + 1}</Badge>
                                    <div className="h-px flex-1 bg-gradient-to-r from-amber-600/20 to-transparent" />
                                    <Badge variant="outline" className="font-black italic">{q.awardedMarks}/{q.marks}</Badge>
                                  </div>

                                  <div className="p-4 md:p-8 bg-amber-50/20 dark:bg-amber-950/20 border-2 border-amber-100 dark:border-amber-900/40 rounded-[2rem] md:rounded-[3rem]">
                                    <div className="text-xl font-bold leading-tight">
                                      <UniversalMathJax dynamic>{cleanupMath(q.questionText || "")}</UniversalMathJax>
                                    </div>
                                  </div>

                                  <div className="pl-6 md:pl-12 border-l-4 border-dashed border-amber-200 dark:border-amber-900/40 space-y-12">
                                    {(q.subQuestions || q.sub_questions || []).length > 0 ? (
                                      (q.subQuestions || q.sub_questions || []).map((subQ: any, subIdx: number) => {
                                        const isObj = ['MCQ', 'MC', 'AR', 'SMCQ'].includes((subQ.type || subQ.subType || "").toUpperCase()) || (subQ.options && subQ.options.length > 0);
                                        return (
                                          <div key={subIdx} className="space-y-6">
                                            <div className="flex items-center gap-3">
                                              <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-[10px] font-black text-amber-700">{subIdx + 1}</div>
                                              <div className="text-lg font-bold"><UniversalMathJax dynamic>{cleanupMath(subQ.text || subQ.questionText || "")}</UniversalMathJax></div>
                                            </div>

                                            {isObj ? (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {(subQ.options || []).map((opt: any, oi: number) => {
                                                  const t = typeof opt === 'object' ? opt.text : opt;
                                                  const isSel = String(subQ.studentAnswer || "").trim() === String(t).trim();
                                                  const isCor = opt.isCorrect || String(subQ.correctAnswer || "").trim() === String(t).trim();
                                                  return (
                                                    <div key={oi} className={cn(
                                                      "p-4 rounded-2xl border-2 flex items-center gap-4 transition-all",
                                                      isSel && isCor ? "bg-emerald-500/10 border-emerald-500/50" :
                                                        isSel && !isCor ? "bg-rose-500/10 border-rose-500/50" :
                                                          !isSel && isCor ? "bg-emerald-500/5 border-emerald-500/20 border-dashed" :
                                                            "bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60"
                                                    )}>
                                                      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-slate-100 dark:bg-slate-800">{String.fromCharCode(0x0995 + oi)}</span>
                                                      <span className="flex-1 text-sm font-bold"><UniversalMathJax inline dynamic>{t}</UniversalMathJax></span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              renderDescriptiveSubQuestion(subQ, subIdx, q.id)
                                            )}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="space-y-6">
                                        {/* Direct Response Rendering for SQ questions without sub-questions */}
                                        {renderDescriptiveSubQuestion(q, 0, q.id)}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>

                            {totalPages > 1 && (
                              <div className="flex items-center justify-between p-6 bg-amber-50/50 dark:bg-slate-900/50 border border-amber-200/50 rounded-3xl mt-12">
                                <Button variant="outline" disabled={sqPage === 1} onClick={() => { setSqPage(p => p - 1); document.getElementById('sq-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-xl px-6 h-11 font-black uppercase tracking-widest text-[10px]"><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
                                <span className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Page {sqPage} of {totalPages}</span>
                                <Button variant="outline" disabled={sqPage === totalPages} onClick={() => { setSqPage(p => p + 1); document.getElementById('sq-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-xl px-6 h-11 font-black uppercase tracking-widest text-[10px]">Next <ChevronRight className="w-4 h-4 ml-2" /></Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 3. CQ SECTION (CREATIVE QUESTIONS) */}
                      {(() => {
                        const filteredQuestions = (result.questions || []).filter(q => q.type?.toUpperCase() === 'CQ');
                        if (filteredQuestions.length === 0) return null;

                        const pageSize = 8;
                        const totalPages = Math.ceil(filteredQuestions.length / pageSize);
                        const startIndex = (cqPage - 1) * pageSize;
                        const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

                        return (
                          <div id="cq-section" className="space-y-8 animate-in fade-in duration-700">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                <FileText className="h-6 w-6 text-emerald-600" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Creative Section (CQ)</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredQuestions.length} Questions</p>
                              </div>
                            </div>

                            <div className="space-y-16">
                              {paginatedQuestions.map((q, idx) => (
                                <motion.div key={q.id} initial={!isMobile ? { opacity: 0, y: 20 } : { opacity: 0 }} whileInView={!isMobile ? { opacity: 1, y: 0 } : { opacity: 1 }} viewport={{ once: true }} className="space-y-8">
                                  <div className="flex items-center gap-4">
                                    <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 text-[10px] font-black px-4 py-1.5 rounded-full">CQ #{startIndex + idx + 1}</Badge>
                                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-600/20 to-transparent" />
                                    <Badge variant="outline" className="font-black italic">{q.awardedMarks}/{q.marks}</Badge>
                                  </div>

                                  <div className="p-6 md:p-10 bg-emerald-50/20 dark:bg-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/40 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl shadow-emerald-500/5 transition-all hover:shadow-emerald-500/10">
                                    <div className="text-xl font-bold leading-tight max-w-full overflow-x-auto scrollbar-thin">
                                      <UniversalMathJax dynamic>{cleanupMath(q.questionText || "")}</UniversalMathJax>
                                    </div>
                                  </div>

                                  <div className="pl-6 md:pl-12 border-l-4 border-dashed border-emerald-200 dark:border-emerald-900/40 space-y-12">
                                    {(q.subQuestions || q.sub_questions || []).map((subQ: any, subIdx: number) => (
                                      <div key={subIdx} className="space-y-6">
                                        <div className="flex items-center gap-3">
                                          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-[10px] font-black text-emerald-700">{subIdx + 1}</div>
                                          <div className="text-lg font-bold"><UniversalMathJax dynamic>{cleanupMath(subQ.text || subQ.questionText || "")}</UniversalMathJax></div>
                                        </div>
                                        {renderDescriptiveSubQuestion(subQ, subIdx, q.id)}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              ))}
                            </div>

                            {totalPages > 1 && (
                              <div className="flex items-center justify-between p-6 bg-emerald-50/50 dark:bg-slate-900/50 border border-emerald-200/50 rounded-3xl mt-12">
                                <Button variant="outline" disabled={cqPage === 1} onClick={() => { setCqPage(p => p - 1); document.getElementById('cq-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-xl px-6 h-11 font-black uppercase tracking-widest text-[10px]"><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
                                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Page {cqPage} of {totalPages}</span>
                                <Button variant="outline" disabled={cqPage === totalPages} onClick={() => { setCqPage(p => p + 1); document.getElementById('cq-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-xl px-6 h-11 font-black uppercase tracking-widest text-[10px]">Next <ChevronRight className="w-4 h-4 ml-2" /></Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 4. DESCRIPTIVE SECTION */}
                      {(() => {
                        const filteredQuestions = (result.questions || []).filter(q => q.type?.toUpperCase() === 'DESCRIPTIVE');
                        if (filteredQuestions.length === 0) return null;

                        const pageSize = 8;
                        const totalPages = Math.ceil(filteredQuestions.length / pageSize);
                        const startIndex = (descriptivePage - 1) * pageSize;
                        const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

                        return (
                          <div id="descriptive-section" className="space-y-8 animate-in fade-in duration-700">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-slate-950/10 dark:bg-white/10 rounded-2xl flex items-center justify-center border border-slate-950/20 dark:border-white/20 shadow-inner">
                                <AlignLeft className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Analysis Section</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredQuestions.length} Items</p>
                              </div>
                            </div>

                            <div className="space-y-12">
                              {paginatedQuestions.map((q, idx) => (
                                <motion.div key={q.id} initial={!isMobile ? { opacity: 0, y: 20 } : { opacity: 0 }} whileInView={!isMobile ? { opacity: 1, y: 0 } : { opacity: 1 }} viewport={{ once: true }} className="space-y-6">
                                  <div className="p-4 md:p-8 bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] md:rounded-[3rem]">
                                    <div className="flex items-center justify-between mb-6">
                                      <Badge className="bg-slate-950 text-white text-[10px] font-black rounded-xl px-4 py-1.5 uppercase tracking-widest">Question #{startIndex + idx + 1}</Badge>
                                      <Badge variant="outline" className="font-black italic">{q.awardedMarks}/{q.marks}</Badge>
                                    </div>
                                    <div className="text-xl font-bold leading-tight mb-6 max-w-full overflow-x-auto scrollbar-thin"><UniversalMathJax dynamic>{cleanupMath(q.questionText || "")}</UniversalMathJax></div>

                                    {q.studentAnswer && (
                                      <div className="p-6 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Primary Analysis Response
                                        </div>
                                        <p className="text-sm font-medium leading-[1.8] text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{q.studentAnswer}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Iterate through Descriptive Sub-Questions */}
                                  {(q.subQuestions || q.sub_questions || []).length > 0 && (
                                    <div className="pl-6 md:pl-12 border-l-4 border-dashed border-slate-200 dark:border-slate-800 space-y-12">
                                      {(q.subQuestions || q.sub_questions || []).map((subQ: any, subIdx: number) => (
                                        <div key={subIdx} className="space-y-4">
                                          <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-slate-950 dark:bg-white flex items-center justify-center text-[10px] font-black text-white dark:text-slate-950">{subIdx + 1}</div>
                                            <div className="text-lg font-bold"><UniversalMathJax dynamic>{cleanupMath(subQ.text || subQ.questionText || "")}</UniversalMathJax></div>
                                          </div>
                                          {renderDescriptiveSubQuestion(subQ, subIdx, q.id)}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {q.studentAnswerImages && q.studentAnswerImages.length > 0 && (
                                    <div className="mt-8 space-y-2">
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2 px-1">
                                        <Camera className="w-3 h-3" /> Root Artifacts ({q.studentAnswerImages.length})
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {q.studentAnswerImages.map((img: string, iIdx: number) => (
                                          <div key={iIdx} className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl cursor-pointer" onClick={() => handleImageZoom(img, `Analysis Evidence ${iIdx + 1}`, iIdx, q.studentAnswerImages || [], q as unknown as Question)}>
                                            <img src={img} className="w-full h-full object-cover transition-transform hover:scale-105" loading="lazy" />
                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>

                            {totalPages > 1 && (
                              <div className="flex items-center justify-between p-6 bg-slate-950/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-3xl mt-12">
                                <Button variant="outline" disabled={descriptivePage === 1} onClick={() => { setDescriptivePage(p => p - 1); document.getElementById('descriptive-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-xl px-6 h-11 font-black uppercase tracking-widest text-[10px]"><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
                                <span className="text-[10px] font-black uppercase tracking-widest">Page {descriptivePage} of {totalPages}</span>
                                <Button variant="outline" disabled={descriptivePage === totalPages} onClick={() => { setDescriptivePage(p => p + 1); document.getElementById('descriptive-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-xl px-6 h-11 font-black uppercase tracking-widest text-[10px]">Next <ChevronRight className="w-4 h-4 ml-2" /></Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row justify-center gap-4 mt-12"
        >
          {result.exam.allowRetake && !(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') && (
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href={`/exams/online/${result.exam.id}`}>
                <BookOpen className="h-5 w-5 mr-2" />
                Retake Exam
              </Link>
            </Button>
          )}
          {result.result?.isPublished && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowReviewModal(true)}
              disabled={(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED')}
              className={`${(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED')
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                }`}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              {(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED')
                ? 'Review Not Available (Suspended)'
                : 'Request Review'
              }
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href="/exams/online">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Exams
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Modals and Print Utility */}
      {
        result && (
          <>
            {/* Review Request Modal */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Request Mark Review
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Explain why you think your marks should be reviewed:
                    </label>
                    <Textarea
                      value={studentComment}
                      onChange={(e) => setStudentComment(e.target.value)}
                      placeholder="Please provide specific details about which questions you think were marked incorrectly and why..."
                      rows={6}
                      className="w-full"
                    />
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200 bg-blue-500/10 dark:bg-blue-500/20 p-3 rounded-lg border border-blue-500/20">
                    <div className="font-bold mb-1">Review Process:</div>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                      <li>Your request will be sent to the teacher/evaluator</li>
                      <li>They will review your submission and comment</li>
                      <li>You&apos;ll be notified when the review is complete</li>
                      <li>Marks may be adjusted if errors are found</li>
                    </ul>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitReviewRequest}
                      disabled={submittingReview || !studentComment.trim()}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review Request'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Zoom Modal */}
            <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
              <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-950/40 backdrop-blur-2xl border-white/10 shadow-2xl rounded-[2.5rem]">
                <DialogHeader className="p-6 border-b border-white/10 flex flex-row items-center justify-between space-y-0">
                  <div className="flex flex-col gap-1">
                    <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Eye className="w-5 h-5 text-indigo-400" />
                      {zoomedImageTitle}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                      Result Explorer <Search className="w-2.5 h-2.5" /> Subjective Detail
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-3">
                    {showComparison && (
                      <div className="bg-white/5 p-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={!annotatedImageFailed ? "secondary" : "ghost"}
                          onClick={() => setAnnotatedImageFailed(false)}
                          className={cn(
                            "rounded-xl px-4 py-1.5 text-xs font-bold transition-all",
                            !annotatedImageFailed ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-600" : "text-white/60 hover:text-white"
                          )}
                        >
                          <Zap className="w-3.5 h-3.5 mr-2 fill-current" /> Teacher Feedback
                        </Button>
                        <Button
                          size="sm"
                          variant={annotatedImageFailed ? "secondary" : "ghost"}
                          onClick={() => setAnnotatedImageFailed(true)}
                          className={cn(
                            "rounded-xl px-4 py-1.5 text-xs font-bold transition-all",
                            annotatedImageFailed ? "bg-slate-700 text-white shadow-lg" : "text-white/60 hover:text-white"
                          )}
                        >
                          <User className="w-3.5 h-3.5 mr-2" /> Original Response
                        </Button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowZoomModal(false);
                        setZoomedImage('');
                        setZoomedImageTitle('');
                        setAnnotatedImageFailed(false);
                        setOriginalImageFallback('');
                      }}
                      className="p-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all border border-white/10 group"
                      aria-label="Close zoom"
                    >
                      <XCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </DialogHeader>

                <div className="flex-1 relative p-0 overflow-hidden bg-slate-950 flex flex-col items-stretch">
                  {isApplyingDrawing ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/60">
                      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                      <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Processing Feedback...</span>
                    </div>
                  ) : (
                    <DrawingCanvas
                      backgroundImage={(activeZoomOriginal || zoomedImage) || ''}
                      readOnly={true}
                      onCancel={() => setShowZoomModal(false)}
                      onNext={handleNextZoomImage}
                      onPrev={handlePrevZoomImage}
                      currentIndex={activeZoomIndex}
                      totalImages={activeZoomImages?.length || 1}
                      initialStrokes={activeZoomStrokes}
                      initialTexts={activeZoomTexts}
                    />
                  )}
                </div>

                <div className="p-6 bg-white/5 border-t border-white/10 backdrop-blur-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <Camera className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider">Submission Quality</div>
                      <div className="text-[10px] text-white/40 flex items-center gap-2">
                        Verified by System <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Exam Reference</div>
                    <div className="text-xs font-mono text-indigo-300">#{id.slice(-8).toUpperCase()}</div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Hidden Print Component - Only mounts when starting to print for performance */}
            {isPrinting && printData && (
              <div style={{ display: 'none' }}>
                <MarkedQuestionPaper
                  ref={printRef}
                  examInfo={printData.examInfo}
                  questions={printData.questions}
                  submission={printData.submission}
                  rank={result.result?.rank}
                  totalStudents={result.statistics.totalStudents}
                  qrData={{
                    id: result.submission.id,
                    student: result.student.name,
                    exam: result.exam.name,
                    score: result.submission.score
                  }}
                />
              </div>
            )}
          </>
        )
      }
    </MathJaxContext >
  );
}