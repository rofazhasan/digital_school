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
  Star,
  Layers,
  Sparkles,
  Search,
  Zap,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { nativeShare } from '@/lib/native/interaction';
import { Capacitor } from "@capacitor/core";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MathJaxContext } from "better-react-mathjax";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath, renderDynamicExplanation, cn } from "@/lib/utils";
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import MarkedQuestionPaper from '@/app/components/MarkedQuestionPaper';
import { toBengaliNumerals, toBengaliAlphabets } from '@/utils/numeralConverter';
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";

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

  const handleShare = async () => {
    if (!result) return;
    const shareTitle = `My Result: ${result.exam.name}`;
    const shareText = `I scored ${result.result?.total || result.submission.score} in ${result.exam.name} on Examify!`;
    const shareUrl = window.location.href;
    await nativeShare(shareTitle, shareText, shareUrl);
  };
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

      // Fix "Tainted Canvas" security error by allowing CORS
      originalImg.crossOrigin = "anonymous";
      annotationImg.crossOrigin = "anonymous";

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

  const handleImageZoom = async (originalUrl: string, title: string, annotationData?: any) => {
    setZoomedImageTitle(title);
    setShowZoomModal(true);
    setAnnotatedImageFailed(false);
    setOriginalImageFallback(originalUrl);

    if (annotationData && annotationData.imageData) {
      try {
        const combined = await combineImageWithAnnotations(originalUrl, annotationData.imageData);
        setZoomedImage(combined);
      } catch (err) {
        console.error("Failed to combine image with annotations", err);
        setZoomedImage(originalUrl);
        setAnnotatedImageFailed(true);
      }
    } else {
      setZoomedImage(originalUrl);
    }
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

  // Calculate marks breakdown
  const mcqQuestions = result.questions?.filter((q: Question) => q.type?.toUpperCase() === 'MCQ') || [];
  const mcQuestions = result.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'mc') || [];
  const arQuestions = result.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'ar') || [];
  const mtfQuestions = result.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'mtf') || [];
  const intQuestions = result.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'int' || (q.type || "").toLowerCase() === 'numeric') || [];
  const cqQuestions = result.questions?.filter((q: Question) => q.type?.toUpperCase() === 'CQ') || [];
  const sqQuestions = result.questions?.filter((q: Question) => q.type?.toUpperCase() === 'SQ') || [];
  const objectiveQuestions = [...mcqQuestions, ...mcQuestions, ...arQuestions, ...mtfQuestions, ...intQuestions];

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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="hidden sm:inline ml-2">Share</span>
                  </Button>

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

                <h1 className="text-5xl md:text-7xl lg:text-9xl font-black leading-[0.85] tracking-tighter break-words">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2 p-4 sm:p-6 rounded-[2rem] bg-slate-50/80 dark:bg-slate-800/50 border border-white shadow-inner dark:border-slate-700/30 overflow-hidden">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Student Name</label>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white break-words">{result.student.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 p-4 sm:p-6 rounded-[2rem] bg-indigo-50/80 dark:bg-indigo-950/30 border border-white dark:border-indigo-900/30 text-center shadow-inner overflow-hidden">
                        <label className="text-[10px] uppercase tracking-widest font-black text-indigo-400 dark:text-indigo-600">Roll</label>
                        <div className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-400 break-words">{result.student.roll}</div>
                      </div>
                      <div className="space-y-2 p-4 sm:p-6 rounded-[2rem] bg-purple-50/80 dark:bg-purple-950/30 border border-white dark:border-purple-900/30 text-center shadow-inner overflow-hidden">
                        <label className="text-[10px] uppercase tracking-widest font-black text-purple-400 dark:text-purple-600">Class</label>
                        <div className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-400 break-words">{result.student.class}</div>
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
                          return <span className="flex items-baseline flex-wrap justify-center"><span className="text-xl sm:text-3xl">{minutes}</span><span className="text-[10px] ml-0.5 uppercase opacity-60">m</span> <span className="text-xl sm:text-3xl ml-1">{seconds}</span><span className="text-[10px] ml-0.5 uppercase opacity-60">s</span></span>;
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
                              {result.result?.cqMarks}
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
                              {result.result?.sqMarks}
                              <span className="text-sm sm:text-lg font-bold text-slate-400 ml-1">/{totalSqMarks}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="sm:col-span-1 p-4 sm:p-6 rounded-[2rem] bg-indigo-600 shadow-xl shadow-indigo-600/20 border-b-4 border-indigo-800 text-white flex flex-col justify-between overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Total Aggregate</p>
                        <div className="mt-2 text-center sm:text-left">
                          <div className="text-3xl sm:text-5xl font-black flex items-baseline justify-center sm:justify-start flex-wrap leading-none">
                            {result.result?.total}
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
                                const answered = result.questions.filter(q => q.studentAnswer && q.studentAnswer !== 'No answer provided').length;
                                const correct = result.questions.filter(q => q.isCorrect).length;
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
                        const objectiveTypes = ['MCQ', 'MC', 'AR', 'MTF', 'INT', 'NUMERIC', 'SMCQ'];
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

                                    {/* SMCQ Specific Rendering */}
                                    {type === 'SMCQ' && (
                                      <div className="mb-8 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                        <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-[2.5rem] border border-indigo-500/20 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
                                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Layers className="h-20 w-20 text-indigo-500" />
                                          </div>
                                          <div className="relative z-10">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-500/30">
                                              <Sparkles className="h-3 w-3" /> Scenario Context
                                            </div>
                                            <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                                              <UniversalMathJax dynamic>{cleanupMath(question.questionText)}</UniversalMathJax>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-10 pl-2 md:pl-10 border-l-4 border-dashed border-indigo-500/20">
                                          {(question.subQuestions || []).map((subQ: any, subIdx: number) => (
                                            <div key={subIdx} className="relative space-y-6 group">
                                              {/* connector dot */}
                                              <div className="absolute -left-12 top-2 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-indigo-500 shadow-lg shadow-indigo-500/50 z-10" />

                                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                                <div className="flex-1 space-y-3">
                                                  <div className="flex items-center gap-3">
                                                    <span className="text-2xl font-black text-indigo-600/30 dark:text-indigo-400/20 italic tabular-nums">
                                                      PART {String(subIdx + 1).padStart(2, '0')}
                                                    </span>
                                                    <Badge variant="outline" className="rounded-full px-3 py-0.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[10px] uppercase font-black tracking-tighter text-slate-500">
                                                      {subQ.marks} Point{subQ.marks !== 1 ? 's' : ''}
                                                    </Badge>
                                                  </div>
                                                  <div className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-snug">
                                                    <UniversalMathJax inline dynamic>{cleanupMath(subQ.text || subQ.questionText || "")}</UniversalMathJax>
                                                  </div>
                                                </div>

                                                {subQ.studentAnswer && (
                                                  <div className={cn(
                                                    "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border whitespace-nowrap",
                                                    subQ.isCorrect
                                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                      : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                                  )}>
                                                    {subQ.isCorrect ? "Perfectly Correct" : "Incorrect Response"}
                                                  </div>
                                                )}
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(subQ.options || []).map((opt: any, oi: number) => {
                                                  const optText = typeof opt === 'object' ? opt.text : opt;
                                                  const isSelected = String(subQ.studentAnswer) === String(optText);
                                                  const isCorrectOpt = (opt.isCorrect || (subQ.correctAnswer !== undefined && (String(subQ.correctAnswer) === String(optText) || Number(subQ.correctAnswer) === oi)));

                                                  let style = "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-400 opacity-60 grayscale-[0.5]";
                                                  let icon = null;

                                                  if (isSelected && isCorrectOpt) {
                                                    style = "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10 grayscale-0 scale-[1.02]";
                                                    icon = <CheckCircle className="h-4 w-4 text-emerald-600" />;
                                                  } else if (isSelected && !isCorrectOpt) {
                                                    style = "border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/10 grayscale-0";
                                                    icon = <XCircle className="h-4 w-4 text-rose-600" />;
                                                  } else if (!isSelected && isCorrectOpt) {
                                                    style = "border-emerald-500/40 bg-emerald-500/5 text-emerald-700/80 border-dashed grayscale-0";
                                                    icon = <CheckCircle className="h-4 w-4 text-emerald-400" />;
                                                  }

                                                  return (
                                                    <div key={oi} className={`relative p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 ${style}`}>
                                                      <span className={cn(
                                                        "w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black shadow-sm transition-colors",
                                                        isSelected ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                      )}>
                                                        {String.fromCharCode(0x0995 + oi)}
                                                      </span>
                                                      <span className="flex-1 text-sm font-bold tracking-tight">
                                                        <UniversalMathJax inline dynamic>{cleanupMath(optText)}</UniversalMathJax>
                                                      </span>
                                                      <div className="flex-shrink-0">{icon}</div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

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
                                      <div className="mb-4 overflow-x-auto max-w-full scrollbar-thin">
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
                                                <span className="flex-1 font-medium text-base leading-relaxed break-words overflow-x-auto max-w-full scrollbar-thin">
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
                                      <div className="mt-4 p-4 bg-yellow-500/10 dark:bg-yellow-500/5 rounded-lg border border-yellow-500/20 dark:border-yellow-500/10">
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
                      {(() => {
                        const filteredQuestions = result.questions.filter(q => {
                          if (q.type?.toUpperCase() !== 'CQ') return false;
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
                          <div id="creative-questions-section">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <h3 className="text-xl sm:text-2xl font-bold text-foreground">Creative Questions (CQ)</h3>
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-none text-[10px] sm:text-xs">
                                {filteredQuestions.length} Questions
                              </Badge>
                            </div>
                            <div className="space-y-6">
                              {paginatedQuestions.map((question, index) => {
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
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-none">CQ</Badge>
                                        <span className="text-sm text-muted-foreground font-bold italic">Question {globalIndex + 1}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={isCorrect ? 'default' : 'destructive'} className="text-sm px-2 py-0.5">
                                          {Number(question.awardedMarks).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}/{question.marks}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="mb-4">
                                      <div className="text-lg font-medium text-foreground">
                                        <UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax>
                                      </div>
                                    </div>

                                    <div className="mb-4">
                                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Your Answer:</h4>
                                      {hasAnswer ? (
                                        <div className="p-3 rounded-lg border-2 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10">
                                          <p className="text-gray-700 dark:text-gray-300">{question.studentAnswer}</p>
                                        </div>
                                      ) : (
                                        <div className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/10">
                                          <p className="text-gray-500 dark:text-gray-400 italic">No answer provided</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Student Answer Images */}
                                    {question.studentAnswerImages && question.studentAnswerImages.length > 0 && (
                                      <div className="mb-4">
                                        <h4 className="font-medium text-foreground mb-2">Your Uploaded Images:</h4>
                                        <div className="p-3 rounded-lg border-2 border-emerald-500/20 bg-emerald-500/5">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {question.studentAnswerImages.map((imageUrl: string, imgIdx: number) => (
                                              <div
                                                key={imgIdx}
                                                className="relative group cursor-pointer"
                                                onClick={() => {
                                                  const annotation = question.allDrawings?.find(d => d.imageIndex === imgIdx);
                                                  handleImageZoom(imageUrl, `Question ${index + 1} Image ${imgIdx + 1}`, annotation);
                                                }}
                                              >
                                                <img src={imageUrl} alt={`Img ${imgIdx + 1}`} crossOrigin="anonymous" className="w-full h-32 object-contain rounded-lg border-2 border-green-500/30 bg-muted/50" />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Sub-questions breakdown for CQ */}
                                    {(question.subQuestions || question.sub_questions) && (question.subQuestions || question.sub_questions || []).length > 0 && (
                                      <div className="space-y-4 mt-4 ps-4 border-s-2 border-indigo-500/20">
                                        {(question.subQuestions || question.sub_questions || []).map((subQ: any, subIdx: number) => (
                                          <div key={subIdx} className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/5 border border-indigo-100 dark:border-indigo-900/20">
                                            <div className="flex items-start gap-2">
                                              <span className="shrink-0 font-bold text-indigo-600 dark:text-indigo-400">{subIdx + 1}.</span>
                                              <div className="text-sm font-medium">
                                                <UniversalMathJax inline dynamic>{cleanupMath(subQ.text || subQ.questionText || subQ.question)}</UniversalMathJax>
                                              </div>
                                              <Badge variant="outline" className="ms-auto shrink-0 text-[10px]">{subQ.marks} Marks</Badge>
                                            </div>

                                            {/* Sub-question Text Answer */}
                                            {subQ.studentAnswer ? (
                                              <div className="mt-2 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm text-sm">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Written Response
                                                </div>
                                                <div className="text-foreground whitespace-pre-wrap">{subQ.studentAnswer}</div>
                                              </div>
                                            ) : (
                                              <div className="mt-2 text-[10px] text-slate-400 italic ps-4">No text response provided.</div>
                                            )}

                                            {/* Sub-question Uploaded Images */}
                                            {subQ.studentImages && subQ.studentImages.length > 0 && (
                                              <div className="mt-3 ps-4">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Visual Evidence
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                  {subQ.studentImages.map((imageUrl: string, imgIdx: number) => {
                                                    const annotation = question.allDrawings?.find(d =>
                                                      d.originalImagePath === imageUrl || (d.imageIndex === imgIdx && (question.type === 'CQ' || question.type === 'SQ'))
                                                    );
                                                    return (
                                                      <div
                                                        key={imgIdx}
                                                        className="relative group cursor-pointer aspect-video rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md hover:shadow-xl transition-all"
                                                        onClick={() => {
                                                          handleImageZoom(imageUrl, `Question ${index + 1} Part ${subIdx + 1} Image ${imgIdx + 1}`, annotation);
                                                        }}
                                                      >
                                                        <img src={imageUrl} alt={`Sub-Img ${imgIdx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        {annotation && (
                                                          <div className="absolute top-2 right-2">
                                                            <div className="bg-emerald-500 rounded-full p-1 shadow-lg ring-2 ring-white animate-pulse">
                                                              <Zap className="h-3 w-3 text-white fill-white" />
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Explanation Section */}
                                    {(question.explanation || (question as any).explanationImage) && (
                                      <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                        <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                                          <Star className="h-4 w-4" /> Explanation
                                        </div>
                                        <div className="text-sm text-foreground/90 pl-6">
                                          <UniversalMathJax inline dynamic>{cleanupMath(question.explanation)}</UniversalMathJax>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentPage(curr => Math.max(1, curr - 1));
                                    document.getElementById('creative-questions-section')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  disabled={currentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                </Button>
                                <span className="text-sm mx-4">Page {currentPage} of {totalPages}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentPage(curr => Math.min(totalPages, curr + 1));
                                    document.getElementById('creative-questions-section')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  disabled={currentPage === totalPages}
                                >
                                  Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* SQ Section */}
                      {(() => {
                        const filteredQuestions = result.questions.filter(q => {
                          if (q.type?.toUpperCase() !== 'SQ') return false;
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

                        return (
                          <div id="short-questions-section">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-amber-500/10 dark:bg-amber-500/20 rounded-full flex items-center justify-center">
                                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <h3 className="text-xl sm:text-2xl font-bold text-foreground">Short Questions (SQ)</h3>
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none text-[10px] sm:text-xs">
                                {filteredQuestions.length} Questions
                              </Badge>
                            </div>
                            <div className="space-y-6">
                              {filteredQuestions.map((question, index) => {
                                const isCorrect = question.awardedMarks === question.marks && question.marks > 0;
                                return (
                                  <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="border rounded-lg p-6 bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20"
                                  >
                                    <div className="flex items-center justify-between mb-4">
                                      <Badge className="bg-yellow-100 text-yellow-800">SQ</Badge>
                                      <Badge variant="outline">{question.awardedMarks}/{question.marks}</Badge>
                                    </div>
                                    <div className="mb-4">
                                      <UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax>
                                    </div>
                                    {question.studentAnswer && (
                                      <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-900/50 shadow-inner">
                                        <p className="text-sm font-medium leading-relaxed">{question.studentAnswer}</p>
                                      </div>
                                    )}

                                    {/* SQ Student Images and Annotations */}
                                    {question.studentAnswerImages && question.studentAnswerImages.length > 0 && (
                                      <div className="mt-6">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                          {question.studentAnswerImages.map((imageUrl: string, imgIdx: number) => {
                                            const annotation = question.allDrawings?.find(d => d.imageIndex === imgIdx);

                                            return (
                                              <div
                                                key={imgIdx}
                                                className="relative group cursor-pointer aspect-video rounded-[2rem] overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 scale-100 hover:scale-[1.05] z-10"
                                                onClick={() => {
                                                  const annotation = question.allDrawings?.find(d => d.imageIndex === imgIdx);
                                                  handleImageZoom(imageUrl, `Short Question ${index + 1} - Image ${imgIdx + 1}`, annotation);
                                                }}
                                              >
                                                <img
                                                  src={imageUrl}
                                                  alt={`Response ${imgIdx + 1}`}
                                                  crossOrigin="anonymous"
                                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Page {imgIdx + 1}</span>
                                                </div>
                                                {annotation && (
                                                  <div className="absolute top-3 right-3">
                                                    <Badge className="bg-emerald-600/90 backdrop-blur-md text-white border-none shadow-lg flex items-center gap-1 py-1 px-3 rounded-full animate-bounce">
                                                      <Zap className="w-3 h-3 fill-white" /> Annotated
                                                    </Badge>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {question.modelAnswer && (
                                      <div className="mt-4 p-3 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900">
                                        <p className="text-xs font-bold text-green-600 mb-1">Model Answer:</p>
                                        <UniversalMathJax inline dynamic>{cleanupMath(question.modelAnswer)}</UniversalMathJax>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
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
      </div>

      {/* Modals and Print Utility */}
      {result && (
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
            <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex items-center justify-center p-2">
              <DialogHeader className="sr-only">
                <DialogTitle>{zoomedImageTitle}</DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-foreground truncate max-w-[70%]">
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

          {/* Hidden Print Component */}
          <div style={{ display: 'none' }}>
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
          </div>
        </>
      )}
    </MathJaxContext>
  );
}