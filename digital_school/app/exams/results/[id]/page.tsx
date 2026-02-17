/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  FileText,
  CheckSquare,
  MessageSquare,
  Lock,
  Camera,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MathJaxContext } from "better-react-mathjax";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath, renderDynamicExplanation } from "@/lib/utils";
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import MarkedQuestionPaper from '@/app/components/MarkedQuestionPaper';
import { toBengaliNumerals } from '@/utils/numeralConverter';
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
}

interface Question {
  id: string;
  type: string;
  questionText: string;
  marks: number;
  awardedMarks: number;
  isCorrect: boolean;
  studentAnswer?: any;
  studentAnswerImages?: string[];
  drawingData?: {
    imageData: string;
    originalImagePath: string;
  } | null;
  allDrawings?: {
    imageIndex: number;
    imageData: string;
    originalImagePath: string;
  }[];
  options?: any[];
  modelAnswer?: string;
  explanation?: string;
  subQuestions?: any[];
  sub_questions?: any[];
  feedback?: string;
  images?: string[];
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
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [studentComment, setStudentComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string>('');
  const [zoomedImageTitle, setZoomedImageTitle] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'UNANSWERED'>('ALL');
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [annotatedImageFailed, setAnnotatedImageFailed] = useState(false);
  const [originalImageFallback, setOriginalImageFallback] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

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
        correct: Number((q as any).correct || (q as any).correctOption || 0)
      })),
      mtf: result.questions.filter(q => (q.type || "").toLowerCase() === 'mtf').map(q => ({
        id: q.id,
        q: q.questionText,
        marks: q.marks,
        pairs: (q as any).pairs || []
      })),
      int: result.questions.filter(q => (q.type || "").toLowerCase() === 'int' || (q.type || "").toLowerCase() === 'numeric').map(q => ({
        id: q.id,
        q: q.questionText,
        marks: q.marks,
        answer: (q as any).answer || (q as any).correct || 0
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
      }))
    };

    const answers: Record<string, any> = {};
    result.questions.forEach(q => {
      if (q.studentAnswer) {
        answers[q.id] = q.studentAnswer;
      }
      if (q.type?.toUpperCase() === 'CQ' || q.type?.toUpperCase() === 'SQ') {
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
    setCurrentPage(1);
  }, [filterStatus]);

  // Function to combine original image with annotations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const combineImageWithAnnotations = async (originalImageSrc: string, annotationImageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const originalImg = new Image();
      const annotationImg = new Image();

      let imagesLoaded = 0;

      const checkBothLoaded = () => {
        imagesLoaded++;
        if (imagesLoaded === 2) {
          // Set canvas size to match original image
          canvas.width = originalImg.naturalWidth;
          canvas.height = originalImg.naturalHeight;

          // Draw original image first
          ctx.drawImage(originalImg, 0, 0);

          // Draw annotations on top
          ctx.drawImage(annotationImg, 0, 0);

          // Get combined image
          const combinedDataURL = canvas.toDataURL('image/png');
          resolve(combinedDataURL);
        }
      };

      originalImg.onload = checkBothLoaded;
      originalImg.onerror = () => reject(new Error('Failed to load original image'));

      annotationImg.onload = checkBothLoaded;
      annotationImg.onerror = () => reject(new Error('Failed to load annotation image'));

      originalImg.src = originalImageSrc;
      annotationImg.src = annotationImageSrc;
    });
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);

        // Check for review response notifications
        const reviewNotifications = data.notifications?.filter((n: any) =>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading your result...</p>
        </motion.div>
      </div>
    );
  }

  // Notification banner for review responses
  const reviewNotifications = notifications.filter(n =>
    n.type === 'REVIEW_RESPONSE' && n.relatedType === 'result_review'
  );

  // Debug: Log notifications to see what's actually there
  console.log('All notifications:', notifications);
  console.log('Review notifications:', reviewNotifications);

  // More detailed debugging
  notifications.forEach((n, index) => {
    console.log(`Notification ${index}:`, {
      id: n.id,
      type: n.type,
      relatedType: n.relatedType,
      title: n.title,
      message: n.message,
      isRead: n.isRead
    });
  });

  // Calculate marks breakdown
  const mcqQuestions = result?.questions?.filter((q: Question) => q.type?.toUpperCase() === 'MCQ') || [];
  const mcQuestions = result?.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'mc') || [];
  const arQuestions = result?.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'ar') || [];
  const mtfQuestions = result?.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'mtf') || [];
  const intQuestions = result?.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'int' || (q.type || "").toLowerCase() === 'numeric') || [];
  const cqQuestions = result?.questions?.filter((q: Question) => q.type?.toUpperCase() === 'CQ') || [];
  const sqQuestions = result?.questions?.filter((q: Question) => q.type?.toUpperCase() === 'SQ') || [];

  const objectiveQuestions = [...mcqQuestions, ...mcQuestions, ...arQuestions, ...mtfQuestions, ...intQuestions];
  const totalObjectiveMarks = objectiveQuestions.reduce((sum: number, q: Question) => sum + q.marks, 0);
  const totalCqMarks = cqQuestions.reduce((sum: number, q: Question) => sum + q.marks, 0);
  const totalSqMarks = sqQuestions.reduce((sum: number, q: Question) => sum + q.marks, 0);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Result Not Found</h2>
          <p className="text-gray-600 mb-4">This exam result is not available yet.</p>
          <Button asChild>
            <Link href="/exams/online">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground transition-colors duration-500 overflow-x-hidden p-0 sm:p-4 md:p-8">
        {/* Animated Background Elements */}
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
                  <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60">
                    <Share2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="hidden sm:inline ml-2">Share</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center p-2 mb-8"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative p-4 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl shadow-orange-500/20 border-b-4 border-orange-600 active:translate-y-1 transition-all">
                    <Trophy className="h-10 w-10 text-white" />
                  </div>
                </div>
              </motion.div>

              <div className="max-w-4xl mx-auto space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent tracking-tighter">
                  Performance Report
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 drop-shadow-sm">
                  {result.exam.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-1">
                    {new Date(result.exam.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Badge>
                  <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <Badge variant="outline" className="rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-1 text-slate-600 dark:text-slate-400 font-medium">
                    {result.exam.duration} Minutes Duration
                  </Badge>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2 p-6 rounded-[2rem] bg-slate-50/80 dark:bg-slate-800/50 border border-white shadow-inner dark:border-slate-700/30">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Student Name</label>
                      <div className="text-2xl font-black text-slate-900 dark:text-white truncate lg:whitespace-normal xl:truncate">{result.student.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 p-6 rounded-[2rem] bg-indigo-50/80 dark:bg-indigo-950/30 border border-white dark:border-indigo-900/30 text-center shadow-inner">
                        <label className="text-[10px] uppercase tracking-widest font-black text-indigo-400 dark:text-indigo-600">Roll</label>
                        <div className="text-2xl font-black text-indigo-900 dark:text-indigo-400">{result.student.roll}</div>
                      </div>
                      <div className="space-y-2 p-6 rounded-[2rem] bg-purple-50/80 dark:bg-purple-950/30 border border-white dark:border-purple-900/30 text-center shadow-inner">
                        <label className="text-[10px] uppercase tracking-widest font-black text-purple-400 dark:text-purple-600">Class</label>
                        <div className="text-2xl font-black text-purple-900 dark:text-purple-400">{result.student.class}</div>
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
                    Time Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-[2rem] bg-slate-50/80 dark:bg-slate-800/50 border border-white dark:border-slate-700/30 flex flex-col items-center justify-center text-center shadow-inner">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-1">Time Used</label>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {result.submission.startedAt ? (() => {
                          const startTime = new Date(result.submission.startedAt);
                          const submitTime = new Date(result.submission.submittedAt);
                          const timeDiff = submitTime.getTime() - startTime.getTime();
                          const minutes = Math.floor(timeDiff / (1000 * 60));
                          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                          return <span className="flex items-baseline"><span className="text-3xl">{minutes}</span><span className="text-xs ml-1 uppercase opacity-60">m</span> <span className="text-3xl ml-2">{seconds}</span><span className="text-xs ml-1 uppercase opacity-60">s</span></span>;
                        })() : 'N/A'}
                      </div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-emerald-50/80 dark:bg-emerald-950/30 border border-white dark:border-emerald-900/30 flex flex-col items-center justify-center text-center shadow-inner">
                      <label className="text-[10px] uppercase tracking-widest font-black text-emerald-500 dark:text-emerald-700 mb-1">Efficiency Ratio</label>
                      {result.submission.startedAt ? (() => {
                        const startTime = new Date(result.submission.startedAt);
                        const submitTime = new Date(result.submission.submittedAt);
                        const timeTakenMs = submitTime.getTime() - startTime.getTime();
                        const durationMs = result.exam.duration * 60 * 1000;

                        // Efficiency based on time saved vs total duration
                        // If they took more time than duration (late), efficiency is 0
                        const efficiency = Math.max(0, Math.min(100, ((durationMs - timeTakenMs) / durationMs) * 100)).toFixed(0);

                        return (
                          <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                            {efficiency}<span className="text-lg opacity-60">%</span>
                          </div>
                        );
                      })() : <div className="text-lg font-bold text-muted-foreground italic">N/A</div>}
                    </div>
                    <div className="col-span-2 p-6 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-[10px] uppercase tracking-widest font-black text-blue-200/80">Submission Deadline Status</label>
                        <div className="text-lg md:text-xl font-bold">
                          {(() => {
                            if (!result.submission.startedAt) return "Status Unknown";
                            const startTime = new Date(result.submission.startedAt);
                            const submitTime = new Date(result.submission.submittedAt);
                            const timeTaken = (submitTime.getTime() - startTime.getTime()) / (1000 * 60);
                            return timeTaken <= result.exam.duration ? "Submitted on Time" : "Submitted Late";
                          })()}
                        </div>
                        <div className="text-xs text-blue-200/60 font-medium lowercase">
                          at {new Date(result.submission.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                      <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 rotate-3">
                        <CheckCircle className="h-8 w-8 text-white" />
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
                  {hasUnevaluatedQuestions() && (
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

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                  {/* Score Breakdown Section */}
                  <div className="xl:col-span-3 space-y-8">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        Score Breakdown
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {objectiveQuestions.length > 0 && (
                        <div className="p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                              <Target className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="rounded-full border-blue-200 text-blue-600 bg-blue-50/50">Objective</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earned Marks</p>
                            <div className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline">
                              {result.result?.mcqMarks}
                              <span className="text-lg font-bold text-slate-400 ml-1">/{totalObjectiveMarks}</span>
                            </div>
                            {result.result?.mcqMarks! < 0 && (
                              <p className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full inline-block mt-1">Negative Marking Applied</p>
                            )}
                          </div>
                        </div>
                      )}

                      {cqQuestions.length > 0 && (
                        <div className="p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                              <FileText className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="rounded-full border-emerald-200 text-emerald-600 bg-emerald-50/50">Creative</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earned Marks</p>
                            <div className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline">
                              {result.result?.cqMarks}
                              <span className="text-lg font-bold text-slate-400 ml-1">/{totalCqMarks}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {sqQuestions.length > 0 && (
                        <div className="p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 hover:shadow-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                              <GraduationCap className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="rounded-full border-amber-200 text-amber-600 bg-amber-50/50">Short Questions</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earned Marks</p>
                            <div className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline">
                              {result.result?.sqMarks}
                              <span className="text-lg font-bold text-slate-400 ml-1">/{totalSqMarks}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="sm:col-span-1 p-6 rounded-[2rem] bg-indigo-600 shadow-xl shadow-indigo-600/20 border-b-4 border-indigo-800 text-white flex flex-col justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Total Aggregate</p>
                        <div className="mt-2">
                          <div className="text-5xl font-black flex items-baseline leading-none">
                            {result.result?.total}
                            <span className="text-xl text-indigo-300 ml-2">/{result.exam.totalMarks}</span>
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
                          <div className={`text-7xl font-black drop-shadow-2xl ${result.result?.grade === 'A+' ? 'text-yellow-400' :
                            result.result?.grade.startsWith('A') ? 'text-blue-400' :
                              'text-white'
                            }`}>
                            {result.result?.grade}
                          </div>
                          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 mt-2">Overall Grade</p>
                        </div>

                        <div className="w-full space-y-2">
                          <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                            <span>Accuracy</span>
                            <span className="text-blue-400">{result.exam.totalMarks > 0 ? ((result.result?.total! / result.exam.totalMarks) * 100).toFixed(1) : '0.0'}%</span>
                          </div>
                          <Progress
                            value={result.exam.totalMarks > 0 ? (result.result?.total! / result.exam.totalMarks) * 100 : 0}
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
                                const answered = result.questions.filter(q => q.studentAnswer && q.studentAnswer !== 'No answer provided').length;
                                const correct = result.questions.filter(q => q.isCorrect).length;
                                return answered > 0 ? ((correct / answered) * 100).toFixed(0) : '0';
                              })()}%
                            </p>
                          </div>
                          <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Status</p>
                            <p className="text-lg font-black text-emerald-400">PASSED</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Statistics Grid */}
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
                transition={{ delay: 0.5 + idx * 0.1 }}
              >
                <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl shadow-slate-200/20 dark:shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400 shadow-inner`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white capitalize">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>


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

          {/* Question Review Section */}
          {
            result.questions && result.questions.length > 0 && (
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
                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center gap-3 mb-12 p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-200/50 dark:border-slate-700/30 backdrop-blur-sm shadow-inner">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mr-2">Filter Results:</span>
                      <Button
                        variant={filterStatus === 'ALL' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('ALL')}
                        className={`rounded-xl px-6 ${filterStatus === 'ALL' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25' : 'border-slate-200 dark:border-slate-800'}`}
                      >
                        All
                      </Button>
                      <Button
                        variant={filterStatus === 'CORRECT' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('CORRECT')}
                        className={`rounded-xl px-6 ${filterStatus === 'CORRECT' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Correct
                      </Button>
                      <Button
                        variant={filterStatus === 'WRONG' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('WRONG')}
                        className={`rounded-xl px-6 ${filterStatus === 'WRONG' ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/25' : 'text-rose-600 border-rose-200 hover:bg-rose-50'}`}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Wrong/Partial
                      </Button>
                      <Button
                        variant={filterStatus === 'UNANSWERED' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('UNANSWERED')}
                        className={`rounded-xl px-6 ${filterStatus === 'UNANSWERED' ? 'bg-slate-600 hover:bg-slate-700 shadow-lg shadow-slate-500/25' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        <Minus className="h-4 w-4 mr-2" /> Unanswered
                      </Button>
                    </div>

                    <div className="space-y-12">
                      {/* Unified Objective Section */}
                      {(() => {
                        const objectiveTypes = ['MCQ', 'MC', 'AR', 'MTF', 'INT', 'NUMERIC'];
                        const filteredQuestions = result.questions.filter(q => {
                          const type = (q.type || "").toUpperCase();
                          if (!objectiveTypes.includes(type)) return false;

                          const hasAnswer = q.studentAnswer && (typeof q.studentAnswer === 'string' ? q.studentAnswer.trim() !== '' : true) && q.studentAnswer !== 'No answer provided';
                          const isCorrect = q.awardedMarks === q.marks && q.marks > 0;

                          switch (filterStatus) {
                            case 'CORRECT': return isCorrect;
                            case 'WRONG': return hasAnswer && !isCorrect;
                            case 'UNANSWERED': return !hasAnswer;
                            default: return true;
                          }
                        });

                        if (filteredQuestions.length === 0) return null;

                        const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
                        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                        const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                        return (
                          <div id="objective-questions-section">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <CheckSquare className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="text-2xl font-bold text-foreground">Objective Questions (অবজেক্টিভ প্রশ্ন)</h3>
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                {filteredQuestions.length} Questions
                              </Badge>
                            </div>
                            <div className="space-y-6">
                              {paginatedQuestions.map((question, index) => {
                                const type = (question.type || "").toUpperCase();
                                const globalIndex = startIndex + index;
                                const isCorrect = question.awardedMarks === question.marks && question.marks > 0;
                                const hasAnswer = question.studentAnswer && (typeof question.studentAnswer === 'string' ? question.studentAnswer.trim() !== '' : true) && question.studentAnswer !== 'No answer provided';

                                return (
                                  <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className={`border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 
                                      ${isCorrect
                                        ? 'bg-green-500/5 border-green-500/20 dark:bg-green-500/10'
                                        : hasAnswer
                                          ? 'bg-red-500/5 border-red-500/20 dark:bg-red-500/10'
                                          : 'bg-muted/30 border-border opacity-90'}`}
                                  >
                                    {/* Question Header */}
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                          {type}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground font-bold italic">Question {globalIndex + 1}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={isCorrect ? 'default' : 'destructive'} className="text-sm px-2 py-0.5">
                                          {Number(question.awardedMarks).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}/{question.marks}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* AR Specific Rendering */}
                                    {type === 'AR' ? (
                                      <div className="mb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                          <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Assertion (A)</div>
                                            <div className="text-sm text-foreground">
                                              <UniversalMathJax dynamic>{(question as any).assertion || question.questionText}</UniversalMathJax>
                                            </div>
                                          </div>
                                          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                            <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">Reason (R)</div>
                                            <div className="text-sm text-foreground">
                                              <UniversalMathJax dynamic>{(question as any).reason || ""}</UniversalMathJax>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : type === 'MTF' ? (
                                      <div className="mb-4">
                                        <div className="text-foreground mb-4 font-medium">
                                          <UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                          {(question as any).pairs?.map((p: any, pidx: number) => (
                                            <div key={pidx} className="flex items-center justify-between p-2 bg-card rounded text-xs border border-border shadow-sm">
                                              <div className="font-medium"><UniversalMathJax dynamic>{p.left}</UniversalMathJax></div>
                                              <div className="px-2">→</div>
                                              <div className="font-medium text-blue-700"><UniversalMathJax dynamic>{p.right}</UniversalMathJax></div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mb-4">
                                        <div className="text-lg font-medium text-foreground">
                                          <UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax>
                                        </div>
                                      </div>
                                    )}

                                    {/* Result Rendering Logic */}
                                    {(type === 'MCQ' || type === 'MC' || type === 'AR') && (question.options || type === 'AR') ? (
                                      <div className="space-y-2">
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
                                            const isSelected =
                                              // Check for object format (e.g. MC, AR)
                                              question.studentAnswer?.selectedOptions?.includes(optIndex) ||
                                              question.studentAnswer?.selectedOption === optIndex ||
                                              // Check for primitive format (e.g. standard MCQ text or index)
                                              question.studentAnswer === option.text ||
                                              question.studentAnswer === optIndex;

                                            // Determine correctness
                                            let isCorrectOpt = false;
                                            if (type === 'MCQ' || type === 'AR') {
                                              const correctIndex = (question as any).correctOption !== undefined ? (question as any).correctOption :
                                                (question as any).correct;
                                              // Handle case where correct is inside options array (legacy)
                                              if (correctIndex === undefined && question.options) {
                                                isCorrectOpt = question.options[optIndex]?.isCorrect;
                                              } else {
                                                const originalIdx = question.options?.[optIndex]?.originalIndex;
                                                if (originalIdx !== undefined) {
                                                  isCorrectOpt = Number(correctIndex) === originalIdx;
                                                } else {
                                                  isCorrectOpt = Number(correctIndex) === optIndex;
                                                }
                                              }
                                            } else if (type === 'MC') {
                                              isCorrectOpt = option.isCorrect;
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
                                                <span className="flex-1 font-medium text-base leading-relaxed break-words">
                                                  <UniversalMathJax inline dynamic>
                                                    {type === 'AR' ? [
                                                      "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং R হলো A এর সঠিক ব্যাখ্যা",
                                                      "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু R হলো A এর সঠিক ব্যাখ্যা নয়",
                                                      "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা",
                                                      "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক",
                                                      "Assertion (A) ও Reason (R) উভয়ই মিথ্যা"
                                                    ][optIndex] : cleanupMath(option.text)}
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
                                              {(question.studentAnswer as any)?.answer !== undefined || (typeof question.studentAnswer === 'string' && question.studentAnswer) ? (
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

                                    {/* Explanation Section - Rendered for ALL types if available */}
                                    {(question.explanation || (question as any).explanationImage) && (
                                      <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="bg-yellow-500/20 p-1.5 rounded-full shadow-inner">
                                            <Star className="text-yellow-600 dark:text-yellow-400 h-4 w-4" />
                                          </div>
                                          <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">Explanation / ব্যাখ্যা</span>
                                        </div>
                                        <div className="text-sm text-foreground/90 pl-8 leading-relaxed">
                                          <UniversalMathJax inline dynamic>
                                            {cleanupMath(renderDynamicExplanation(
                                              question.explanation,
                                              (question as any).leftColumn || question.options,
                                              question.type,
                                              (question as any).rightColumn
                                            ))}
                                          </UniversalMathJax>
                                          {(question as any).explanationImage && (
                                            <img
                                              src={(question as any).explanationImage}
                                              alt="Explanation"
                                              className="mt-3 max-h-72 rounded-lg border border-border shadow-sm object-contain"
                                            />
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-center gap-2 mt-8 p-4 bg-card rounded-lg border border-border shadow-sm">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (currentPage > 1) {
                                      setCurrentPage(curr => curr - 1);
                                      document.getElementById('objective-questions-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }}
                                  disabled={currentPage === 1}
                                  className="w-24"
                                >
                                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                </Button>

                                <div className="flex items-center gap-1 mx-4">
                                  <span className="text-sm font-medium text-gray-600">
                                    Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                                  </span>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (currentPage < totalPages) {
                                      setCurrentPage(curr => curr + 1);
                                      document.getElementById('objective-questions-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }}
                                  disabled={currentPage === totalPages}
                                  className="w-24"
                                >
                                  Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}




                      {/* CQ Section */}
                      {result.questions.filter(q => {
                        if (q.type?.toUpperCase() !== 'CQ') return false;
                        // Filter Logic
                        const hasAnswer = q.studentAnswer && q.studentAnswer.trim() !== '' && q.studentAnswer !== 'No answer provided';
                        const isCorrect = q.awardedMarks === q.marks && q.marks > 0;

                        switch (filterStatus) {
                          case 'CORRECT': return isCorrect;
                          case 'WRONG': return hasAnswer && !isCorrect;
                          case 'UNANSWERED': return !hasAnswer;
                          default: return true;
                        }
                      }).length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <FileText className="h-4 w-4 text-green-600" />
                              </div>
                              <h3 className="text-2xl font-bold text-gray-800">Creative Questions (CQ)</h3>
                              <Badge className="bg-green-100 text-green-800">
                                {result.questions.filter(q => q.type?.toUpperCase() === 'CQ').length} Questions
                              </Badge>
                            </div>
                            <div className="space-y-6">
                              {result.questions
                                .filter(q => {
                                  if (q.type?.toUpperCase() !== 'CQ') return false;
                                  // Filter Logic
                                  const hasAnswer = q.studentAnswer && q.studentAnswer.trim() !== '' && q.studentAnswer !== 'No answer provided';
                                  const isCorrect = q.awardedMarks === q.marks && q.marks > 0;

                                  switch (filterStatus) {
                                    case 'CORRECT': return isCorrect;
                                    case 'WRONG': return hasAnswer && !isCorrect;
                                    case 'UNANSWERED': return !hasAnswer;
                                    default: return true;
                                  }
                                })
                                .map((question, index) => (
                                  <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="border rounded-lg p-6 bg-green-50/50"
                                  >
                                    {/* Question Header */}
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <Badge className="bg-green-100 text-green-800">
                                          CQ
                                        </Badge>
                                        <span className="text-sm text-gray-600">Question {index + 1}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Marks:</span>
                                        <Badge variant="secondary">
                                          {question.awardedMarks}/{question.marks}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Question Text */}
                                    <div className="mb-4">
                                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Question:</h3>
                                      <div className="text-gray-700">
                                        <UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax>
                                      </div>
                                    </div>

                                    {/* Student Answer */}
                                    <div className="mb-4">
                                      <h4 className="font-medium text-gray-800 mb-2">Your Answer:</h4>
                                      {question.studentAnswer ? (
                                        <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
                                          <p className="text-gray-700">{question.studentAnswer}</p>
                                        </div>
                                      ) : (
                                        <div className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50">
                                          <p className="text-gray-500 italic">No answer provided</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Student Answer Images */}
                                    {question.studentAnswerImages && question.studentAnswerImages.length > 0 && (
                                      <div className="mb-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Your Uploaded Images:</h4>
                                        <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Camera className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-800">
                                              Images you uploaded during the exam
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {question.studentAnswerImages.map((imageUrl: string, index: number) => (
                                              <div
                                                key={index}
                                                className="relative group cursor-pointer"
                                                onClick={() => {
                                                  setZoomedImage(imageUrl);
                                                  setZoomedImageTitle(`Your Answer Image ${index + 1}`);
                                                  setShowZoomModal(true);
                                                }}
                                              >
                                                <img
                                                  src={imageUrl}
                                                  alt={`Your answer image ${index + 1}`}
                                                  crossOrigin="anonymous"
                                                  className="w-full h-32 object-contain rounded-lg border-2 border-green-500/30 bg-muted/50 transition-transform group-hover:scale-105"
                                                  onLoad={() => {
                                                    console.log('Student answer image loaded successfully:', imageUrl);
                                                  }}
                                                  onError={(e) => {
                                                    console.error('Student answer image failed to load:', imageUrl);
                                                    // Show error placeholder
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                      const errorDiv = document.createElement('div');
                                                      errorDiv.className = 'w-full h-32 bg-gray-200 rounded-lg border-2 border-green-300 flex items-center justify-center text-gray-500 text-sm';
                                                      errorDiv.innerHTML = `
                                                  <div class="text-center">
                                                    <div class="mb-1">📷</div>
                                                    <div>Image not available</div>
                                                    <div class="text-xs mt-1">URL: ${imageUrl.substring(0, 50)}...</div>
                                                  </div>
                                                `;
                                                      parent.appendChild(errorDiv);
                                                    }
                                                  }}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Evaluator's Drawing Feedback */}
                                    {question.allDrawings && question.allDrawings.length > 0 && (
                                      <div className="mb-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Evaluator&apos;s Feedback:</h4>
                                        <div className="p-3 rounded-lg border-2 border-orange-200 bg-orange-50">
                                          <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare className="h-4 w-4 text-orange-600" />
                                            <span className="text-sm font-medium text-orange-800">
                                              Teacher&apos;s annotations on your answer
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {question.allDrawings.map((drawing, index) => (
                                              <div
                                                key={index}
                                                className="relative group cursor-pointer"
                                                onClick={() => {
                                                  setZoomedImage(drawing.imageData);
                                                  setZoomedImageTitle(`Teacher's Annotations - Image ${drawing.imageIndex + 1}`);
                                                  setShowZoomModal(true);
                                                }}
                                              >
                                                <img
                                                  src={drawing.imageData}
                                                  alt={`Teacher's annotations on answer ${drawing.imageIndex + 1}`}
                                                  crossOrigin="anonymous"
                                                  className="w-full h-32 object-contain rounded-lg border-2 border-orange-500/30 bg-muted/50 transition-transform group-hover:scale-105"
                                                  onError={(e) => {
                                                    console.error('Annotated image failed to load:', drawing.imageData);
                                                    // Show error placeholder
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                      const errorDiv = document.createElement('div');
                                                      errorDiv.className = 'w-full h-32 bg-gray-200 rounded-lg border-2 border-orange-300 flex items-center justify-center text-gray-500 text-sm';
                                                      errorDiv.innerHTML = `
                                                  <div class="text-center">
                                                    <div class="mb-1">📷</div>
                                                    <div>Annotated image not available</div>
                                                  </div>
                                                `;
                                                      parent.appendChild(errorDiv);
                                                    }
                                                  }}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Model Answer */}
                                    {question.modelAnswer && (
                                      <div className="mb-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Model Answer:</h4>
                                        <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
                                          <div className="text-gray-700">
                                            <UniversalMathJax inline dynamic>{cleanupMath(question.modelAnswer)}</UniversalMathJax>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Sub Questions */}
                                    {question.subQuestions && question.subQuestions.length > 0 && (
                                      <div className="mb-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Sub Questions:</h4>
                                        <div className="space-y-2">
                                          {question.subQuestions.map((subQ, subIndex) => (
                                            <div key={subIndex} className="p-3 rounded-lg border border-border bg-card">
                                              <div className="mb-2">
                                                <p className="text-gray-700 font-medium">
                                                  {subQ.questionText || subQ.text || subQ.question || ''}
                                                </p>
                                              </div>
                                              {subQ.modelAnswer && (
                                                <div className="mt-2 p-2 rounded bg-blue-50 border border-blue-200">
                                                  <p className="text-sm text-gray-600 font-medium mb-1">Model Answer:</p>
                                                  <p className="text-gray-700">
                                                    <UniversalMathJax inline dynamic>{cleanupMath(subQ.modelAnswer)}</UniversalMathJax>
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Feedback */}
                                    {question.feedback && (
                                      <div className="mb-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Feedback:</h4>
                                        <div className="p-3 rounded-lg border-2 border-yellow-200 bg-yellow-50">
                                          <p className="text-gray-700">{question.feedback}</p>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                            </div>
                          </div>
                        )}

                      {/* SQ Section */}
                      {result.questions.filter(q => {
                        if (q.type?.toUpperCase() !== 'SQ') return false;
                        // Filter Logic
                        const hasAnswer = q.studentAnswer && q.studentAnswer.trim() !== '' && q.studentAnswer !== 'No answer provided';
                        const isCorrect = q.awardedMarks === q.marks && q.marks > 0;

                        switch (filterStatus) {
                          case 'CORRECT': return isCorrect;
                          case 'WRONG': return hasAnswer && !isCorrect;
                          case 'UNANSWERED': return !hasAnswer;
                          default: return true;
                        }
                      }).length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-yellow-600" />
                              </div>
                              <h3 className="text-2xl font-bold text-gray-800">Short Questions (SQ)</h3>
                              <Badge className="bg-yellow-100 text-yellow-800">
                                {result.questions.filter(q => q.type?.toUpperCase() === 'SQ').length} Questions
                              </Badge>
                            </div>
                            <div className="space-y-6">
                              {result.questions
                                .filter(q => {
                                  if (q.type?.toUpperCase() !== 'SQ') return false;
                                  // Filter Logic
                                  const hasAnswer = q.studentAnswer && q.studentAnswer.trim() !== '' && q.studentAnswer !== 'No answer provided';
                                  const isCorrect = q.awardedMarks === q.marks && q.marks > 0;

                                  switch (filterStatus) {
                                    case 'CORRECT': return isCorrect;
                                    case 'WRONG': return hasAnswer && !isCorrect;
                                    case 'UNANSWERED': return !hasAnswer;
                                    default: return true;
                                  }
                                })
                                .map((question, index) => (
                                  <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="border rounded-lg p-6 bg-yellow-50/50"
                                  >
                                    {/* Question Header */}
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                          SQ
                                        </Badge>
                                        <span className="text-sm text-gray-600">Question {index + 1}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Marks:</span>
                                        <Badge variant="outline">
                                          {question.awardedMarks}/{question.marks}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Question Text */}
                                    <div className="mb-4">
                                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Question:</h3>
                                      <div className="text-gray-700">
                                        <UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax>
                                      </div>
                                    </div>

                                    {(question.type?.toUpperCase() === 'CQ' || question.type?.toUpperCase() === 'SQ') && (question.subQuestions || question.sub_questions) ? (
                                      <div className="space-y-8 mt-6">
                                        <h4 className="font-bold text-gray-900 border-b-2 border-indigo-100 pb-3 text-lg">Detailed Answer Breakdown</h4>
                                        {(question.subQuestions || question.sub_questions || []).map((subQ: any, idx: number) => (
                                          <div key={idx} className="relative rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
                                            {/* Sub-question Header */}
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-start gap-3">
                                              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                                                {idx + 1}
                                              </span>
                                              <div className="flex-grow pt-1">
                                                {subQ.text ? (
                                                  <div className="text-gray-800 font-medium leading-relaxed">
                                                    <UniversalMathJax inline dynamic>{cleanupMath(subQ.text)}</UniversalMathJax>
                                                  </div>
                                                ) : (
                                                  <span className="text-gray-500 italic">Sub-question {idx + 1}</span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="p-4 space-y-4">
                                              {/* Model Answer (Prominent) */}
                                              {(subQ.modelAnswer || subQ.answer) && (
                                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                                  <div className="flex items-center gap-2 mb-2 text-green-800 font-semibold text-sm uppercase tracking-wide">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Model Answer
                                                  </div>
                                                  <div className="text-gray-800 leading-relaxed font-sans">
                                                    <UniversalMathJax inline dynamic>{cleanupMath(subQ.modelAnswer || subQ.answer)}</UniversalMathJax>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Student Answer */}
                                              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                                                <div className="text-blue-800 font-semibold text-sm uppercase tracking-wide mb-2">
                                                  Your Answer
                                                </div>
                                                {subQ.studentAnswer ? (
                                                  <div className="text-gray-800 leading-relaxed font-sans">
                                                    <UniversalMathJax inline dynamic>{cleanupMath(subQ.studentAnswer)}</UniversalMathJax>
                                                  </div>
                                                ) : (
                                                  <p className="text-gray-400 italic text-sm">No text answer provided</p>
                                                )}
                                              </div>

                                              {/* Attachments & Feedback */}
                                              {((subQ.studentImages && subQ.studentImages.length > 0) || (subQ.drawings && subQ.drawings.length > 0)) && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Camera className="w-4 h-4" />
                                                    Attachments & Feedback
                                                  </div>
                                                  <div className="flex flex-wrap gap-4">
                                                    {(() => {
                                                      const images = subQ.studentImages || [];
                                                      return images.length > 0 ? images.map((imgUrl: string, imgK: number) => {
                                                        const globalIdx = idx * 100 + imgK;
                                                        const drawing = subQ.drawings?.find((d: any) => d.imageIndex === globalIdx);
                                                        const displayUrl = drawing ? drawing.imageData : imgUrl;
                                                        const isAnnotated = !!drawing;

                                                        return (
                                                          <div
                                                            key={imgK}
                                                            className="relative group cursor-pointer perspective-1000"
                                                            onClick={() => {
                                                              setZoomedImage(displayUrl);
                                                              setZoomedImageTitle(`Sub-question ${idx + 1} - Image ${imgK + 1}${isAnnotated ? ' (Annotated)' : ''}`);
                                                              setShowZoomModal(true);
                                                            }}
                                                          >
                                                            <div className={`relative rounded-lg overflow-hidden shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105 ${isAnnotated ? 'ring-2 ring-orange-400' : 'ring-1 ring-gray-200'}`}>
                                                              <img
                                                                src={displayUrl}
                                                                alt={`Sub ${idx + 1} Img ${imgK + 1}`}
                                                                className="w-32 h-32 object-cover bg-gray-50"
                                                                loading="lazy"
                                                              />
                                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                                              </div>
                                                              {isAnnotated && (
                                                                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold shadow-sm flex items-center gap-1">
                                                                  <MessageSquare className="w-3 h-3" />
                                                                  Feedback
                                                                </div>
                                                              )}
                                                            </div>
                                                          </div>
                                                        );
                                                      }) : null;
                                                    })()}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <>
                                        {/* Student Answer */}
                                        <div className="mb-4">
                                          <h4 className="font-medium text-gray-800 mb-2">Your Answer:</h4>
                                          {question.studentAnswer ? (
                                            <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
                                              <p className="text-gray-700">{question.studentAnswer}</p>
                                            </div>
                                          ) : (
                                            <div className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50">
                                              <p className="text-gray-500 italic">No answer provided</p>
                                            </div>
                                          )}
                                        </div>

                                        {/* Student Answer Images */}
                                        {question.studentAnswerImages && question.studentAnswerImages.length > 0 && (
                                          <div className="mb-4">
                                            <h4 className="font-medium text-gray-800 mb-2">Your Uploaded Images:</h4>
                                            <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Camera className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-medium text-green-800">
                                                  Images you uploaded during the exam
                                                </span>
                                              </div>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {question.studentAnswerImages.map((imageUrl: string, index: number) => (
                                                  <div
                                                    key={index}
                                                    className="relative group cursor-pointer"
                                                    onClick={() => {
                                                      setZoomedImage(imageUrl);
                                                      setZoomedImageTitle(`Your Answer Image ${index + 1}`);
                                                      setShowZoomModal(true);
                                                    }}
                                                  >
                                                    <img
                                                      src={imageUrl}
                                                      alt={`Your answer image ${index + 1}`}
                                                      className="w-full h-32 object-contain rounded-lg border-2 border-green-500/30 bg-muted/50 transition-transform group-hover:scale-105"
                                                      onError={(e) => {
                                                        console.error('Student answer image failed to load:', imageUrl);
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                          const errorDiv = document.createElement('div');
                                                          errorDiv.className = 'w-full h-32 bg-gray-200 rounded-lg border-2 border-green-300 flex items-center justify-center text-gray-500 text-sm';
                                                          errorDiv.innerHTML = `
                                                      <div class="text-center">
                                                        <div class="mb-1">📷</div>
                                                        <div>Image not available</div>
                                                      </div>
                                                    `;
                                                          parent.appendChild(errorDiv);
                                                        }
                                                      }}
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Evaluator's Drawing Feedback */}
                                        {question.allDrawings && question.allDrawings.length > 0 && (
                                          <div className="mb-4">
                                            <h4 className="font-medium text-gray-800 mb-2">Evaluator&apos;s Feedback:</h4>
                                            <div className="p-3 rounded-lg border-2 border-orange-200 bg-orange-50">
                                              <div className="flex items-center gap-2 mb-2">
                                                <MessageSquare className="h-4 w-4 text-orange-600" />
                                                <span className="text-sm font-medium text-orange-800">
                                                  Teacher&apos;s annotations on your answer
                                                </span>
                                              </div>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {question.allDrawings.map((drawing, index) => (
                                                  <div
                                                    key={index}
                                                    className="relative group cursor-pointer"
                                                    onClick={() => {
                                                      setZoomedImage(drawing.imageData);
                                                      setZoomedImageTitle(`Teacher's Annotations - Image ${drawing.imageIndex + 1}`);
                                                      setShowZoomModal(true);
                                                    }}
                                                  >
                                                    <img
                                                      src={drawing.imageData}
                                                      alt={`Teacher's annotations on answer ${drawing.imageIndex + 1}`}
                                                      className="w-full h-32 object-contain rounded-lg border-2 border-orange-500/30 bg-muted/50 transition-transform group-hover:scale-105"
                                                      onError={(e) => {
                                                        console.error('Annotated image failed to load:', drawing.imageData);
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                          const errorDiv = document.createElement('div');
                                                          errorDiv.className = 'w-full h-32 bg-gray-200 rounded-lg border-2 border-orange-300 flex items-center justify-center text-gray-500 text-sm';
                                                          errorDiv.innerHTML = `
                                                      <div class="text-center">
                                                        <div class="mb-1">📷</div>
                                                        <div>Annotated image not available</div>
                                                      </div>
                                                    `;
                                                          parent.appendChild(errorDiv);
                                                        }
                                                      }}
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}

                                    {/* Model Answer */}
                                    {question.modelAnswer && (
                                      <div className="mb-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Model Answer:</h4>
                                        <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
                                          <div className="text-gray-700">
                                            <UniversalMathJax inline dynamic>{cleanupMath(question.modelAnswer)}</UniversalMathJax>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Sub Questions */}
                                    {question.subQuestions && question.subQuestions.length > 0 && (
                                      <div className="mb-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Sub Questions:</h4>
                                        <div className="space-y-2">
                                          {question.subQuestions.map((subQ, subIndex) => (
                                            <div key={subIndex} className="p-3 rounded-lg border border-border bg-card">
                                              <div className="mb-2">
                                                <p className="text-gray-700 font-medium">
                                                  {subQ.questionText || subQ.text || subQ.question || ''}
                                                </p>
                                              </div>
                                              {subQ.modelAnswer && (
                                                <div className="mt-2 p-2 rounded bg-blue-50 border border-blue-200">
                                                  <p className="text-sm text-gray-600 font-medium mb-1">Model Answer:</p>
                                                  <p className="text-gray-700">
                                                    <UniversalMathJax inline dynamic>{cleanupMath(subQ.modelAnswer)}</UniversalMathJax>
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Feedback */}
                                    {question.feedback && (
                                      <div className="mb-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Feedback:</h4>
                                        <div className="p-3 rounded-lg border-2 border-yellow-200 bg-yellow-50">
                                          <p className="text-gray-700">{question.feedback}</p>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          }

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            {result.exam.allowRetake && !(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') && (
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href={`/exams/online/${result.exam.id}`}>
                  <BookOpen className="h-5 w-5 mr-2" />
                  Retake Exam
                </Link>
              </Button>
            )}
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
            <Button asChild variant="outline" size="lg">
              <Link href="/exams/online">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Exams
              </Link>
            </Button>
          </motion.div>

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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
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
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium mb-1">Review Process:</div>
                  <ul className="list-disc list-inside space-y-1">
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
            <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex items-center justify-center p-2">
              <DialogHeader className="sr-only">
                <DialogTitle>{zoomedImageTitle}</DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 truncate">
                    {annotatedImageFailed ? `${zoomedImageTitle} (Original Image - Annotations Failed)` : zoomedImageTitle}
                  </h3>
                  <button
                    onClick={() => {
                      setShowZoomModal(false);
                      setZoomedImage('');
                      setZoomedImageTitle('');
                      setAnnotatedImageFailed(false);
                      setOriginalImageFallback('');
                    }}
                    className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
                    aria-label="Close zoom"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-center relative">
                  {zoomedImage && (
                    <img
                      src={annotatedImageFailed ? originalImageFallback : zoomedImage}
                      alt={annotatedImageFailed ? `${zoomedImageTitle} (Original Image)` : zoomedImageTitle}
                      className="max-w-full max-h-full object-contain rounded-lg bg-card shadow-lg"
                      onError={(e) => {
                        console.error('Modal image failed to load:', zoomedImage);

                        if (!annotatedImageFailed && originalImageFallback) {
                          // Try original image as fallback
                          setAnnotatedImageFailed(true);
                          e.currentTarget.src = originalImageFallback;
                          e.currentTarget.alt = `${zoomedImageTitle} (Original Image)`;
                        } else {
                          // Both failed, show error
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'flex items-center justify-center w-full h-full bg-gray-100 rounded-lg';
                            errorDiv.innerHTML = `
                            <div class="text-center text-gray-500">
                              <div class="text-4xl mb-2">📷</div>
                              <div class="text-sm">Image failed to load</div>
                              <div class="text-xs mt-1">Please try again</div>
                            </div>
                          `;
                            parent.appendChild(errorDiv);
                          }
                        }
                      }}
                      onLoad={() => {
                        // Image loaded successfully
                      }}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div >
        {/* Hidden Print Component */}
        < div style={{ display: 'none' }}>
          {printData && (
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
          )}
        </div >
      </div >
    </MathJaxContext >
  );
}