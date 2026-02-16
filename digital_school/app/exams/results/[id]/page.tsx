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
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MathJaxContext } from "better-react-mathjax";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from "@/lib/utils";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showNotification, setShowNotification] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  // const [notificationMessage, setNotificationMessage] = useState(''); // Unused
  const [zoomedImage, setZoomedImage] = useState<string>('');
  const [zoomedImageTitle, setZoomedImageTitle] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'UNANSWERED'>('ALL');
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [annotatedImageFailed, setAnnotatedImageFailed] = useState(false);
  const [originalImageFallback, setOriginalImageFallback] = useState<string>('');
  const [downloading, setDownloading] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your result...</p>
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
      <div id="exam-result-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10"></div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"
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
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl 2xl:max-w-[95vw] mx-auto p-6">
          {/* Notification Banner */}
          {false && reviewNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-orange-800">
                        Review Response Received!
                      </h3>
                      <p className="text-sm text-orange-700">
                        Your teacher has responded to your review request. Check the details below.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotification(false)}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/exams/online">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Exams
                  </Link>
                </Button>
                {userRole && (
                  <Button asChild variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
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
              <div className="flex gap-2">
                {result.result?.isPublished && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    disabled={isPrinting}
                  >
                    {isPrinting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Printing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Print Script
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Your Result
                </h1>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{result.exam.name}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">{result.exam.description}</p>
            </div>
          </motion.div>

          {/* Student Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <div className="text-lg font-semibold">{result.student.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Roll</label>
                    <div className="text-lg">{result.student.roll}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Class</label>
                    <div className="text-lg">{result.student.class}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Exam Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Exam Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Exam Date</label>
                    <div className="text-lg font-semibold">
                      {new Date(result.exam.startTime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <div className="text-lg">{result.exam.duration} minutes</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Time Taken</label>
                    <div className="text-lg">
                      {result.submission.startedAt ? (() => {
                        const startTime = new Date(result.submission.startedAt);
                        const submitTime = new Date(result.submission.submittedAt);
                        const timeDiff = submitTime.getTime() - startTime.getTime();
                        const minutes = Math.floor(timeDiff / (1000 * 60));
                        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                        return `${minutes}m ${seconds}s`;
                      })() : 'Not tracked'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Submission Time</label>
                    <div className="text-lg">
                      {new Date(result.submission.submittedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Marks</label>
                    <div className="text-lg font-semibold">{result.exam.totalMarks}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Time Efficiency</label>
                    <div className="text-lg">
                      {result.submission.startedAt ? (() => {
                        const startTime = new Date(result.submission.startedAt);
                        const submitTime = new Date(result.submission.submittedAt);
                        const timeDiff = submitTime.getTime() - startTime.getTime();
                        const minutesTaken = timeDiff / (1000 * 60);
                        const durationMinutes = result.exam.duration;

                        // Calculate efficiency (Time Saved / Total Duration)
                        const savedMinutes = Math.max(0, durationMinutes - minutesTaken);
                        const efficiency = (savedMinutes / durationMinutes * 100).toFixed(1);

                        return (
                          <div className="flex flex-col">
                            <span className={Number(efficiency) > 0 ? "text-green-600 font-bold" : "text-gray-600"}>
                              {efficiency}% Efficient
                            </span>
                            <span className="text-xs text-gray-500">
                              (Saved {Math.floor(savedMinutes)}m {Math.floor((savedMinutes % 1) * 60)}s)
                            </span>
                          </div>
                        );
                      })() : (
                        <span className="text-gray-400 italic">Data unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Result Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-6 w-6" />
                    Exam Result
                  </div>
                  {result.result && result.result.isPublished && result.result.rank && (
                    <div className="flex items-center gap-2">
                      {getRankIcon(result.result.rank)}
                      <span className="text-lg font-bold">Rank #{result.result.rank}</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              {hasUnevaluatedQuestions() && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        Evaluation in Progress
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Some questions are still being evaluated by your teacher. Your final score will be updated once evaluation is complete.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!hasUnevaluatedQuestions() && hasUnansweredQuestions() && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        Some Questions Unanswered
                      </h4>
                      <p className="text-sm text-blue-700">
                        You left some questions unanswered. These have been marked as 0 points.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Suspended Exam Alert */}
              {(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">
                        🚫 পরীক্ষা বাতিল হয়েছে (Exam Suspended)
                      </h4>
                      <p className="text-sm text-red-700">
                        {result.result?.suspensionReason || result.submission?.suspensionReason || 'Exam suspended due to rule violation'}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        You have received zero marks for this exam.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.result && !result.result.isPublished && result.result.status !== 'SUSPENDED' && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        Results Not Yet Released
                      </h4>
                      <p className="text-sm text-blue-700">
                        Your results are being reviewed by the administration. Final scores will be available once officially released.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <CardContent className="p-6">
                {result.result ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Marks Breakdown */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">Marks Breakdown</h3>

                      <div className="space-y-4">
                        {objectiveQuestions.length > 0 && (
                          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                              <span className="font-medium">Objective Marks</span>
                              {result.result.mcqMarks < 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  Negative Marks Applied
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${result.result.mcqMarks < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                {result.result.mcqMarks}/{totalObjectiveMarks}
                              </div>
                              <div className="text-sm text-gray-500">
                                {totalObjectiveMarks > 0 ? ((result.result.mcqMarks / totalObjectiveMarks) * 100).toFixed(1) : '0.0'}%
                              </div>
                              {result.result.mcqMarks < 0 && (
                                <div className="text-xs text-red-600 font-medium">
                                  Negative marking applied
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {cqQuestions.length > 0 && (
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-green-600" />
                              <span className="font-medium">CQ Marks</span>
                            </div>
                            <div className="text-right">
                              {hasUnevaluatedQuestions() && cqQuestions.some((q: Question) => q.awardedMarks === 0 && q.marks > 0 && q.studentAnswer && q.studentAnswer.trim() !== '' && q.studentAnswer !== 'No answer provided') ? (
                                <>
                                  <div className="text-lg font-bold text-yellow-600">Pending</div>
                                  <div className="text-sm text-gray-500">Awaiting evaluation</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-2xl font-bold text-green-600">
                                    {result.result.cqMarks}/{totalCqMarks}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {totalCqMarks > 0 ? ((result.result.cqMarks / totalCqMarks) * 100).toFixed(1) : '0.0'}%
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {sqQuestions.length > 0 && (
                          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <MessageSquare className="h-5 w-5 text-yellow-600" />
                              <span className="font-medium">SQ Marks</span>
                            </div>
                            <div className="text-right">
                              {hasUnevaluatedQuestions() && sqQuestions.some((q: Question) => q.awardedMarks === 0 && q.marks > 0 && q.studentAnswer && q.studentAnswer.trim() !== '' && q.studentAnswer !== 'No answer provided') ? (
                                <>
                                  <div className="text-lg font-bold text-yellow-600">Pending</div>
                                  <div className="text-sm text-gray-500">Awaiting evaluation</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-2xl font-bold text-yellow-600">
                                    {result.result.sqMarks}/{totalSqMarks}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {totalSqMarks > 0 ? ((result.result.sqMarks / totalSqMarks) * 100).toFixed(1) : '0.0'}%
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                          <div className="flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-purple-600" />
                            <span className="font-medium">Total Score</span>
                            {(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') && (
                              <Badge variant="destructive" className="text-xs">
                                Suspended
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') ? 'text-red-600' : 'text-purple-600'}`}>
                              {(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') ? '0' : result.result.total} / {(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') ? '0' : result.exam.totalMarks}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') ? '0.0' : (result.exam.totalMarks > 0 ? ((result.result.total / result.exam.totalMarks) * 100).toFixed(1) : '0.0')}%
                            </div>
                            {(result.result?.status === 'SUSPENDED' || result.submission?.status === 'SUSPENDED') && (
                              <div className="text-xs text-red-600 font-medium">
                                Exam suspended - zero marks
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Final Score - Only shown after super_user releases marks */}
                        {result.result && result.result.isPublished === true && result.result.status !== 'SUSPENDED' && (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                            <div className="flex items-center gap-3">
                              <Crown className="h-5 w-5 text-green-600" />
                              <span className="font-medium">Final Score</span>
                              <Badge className="bg-green-100 text-green-800 text-xs">Released</Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-green-600">
                                {result.result.total} / {result.exam.totalMarks}
                              </div>
                              <div className="text-sm text-gray-500">
                                {result.exam.totalMarks > 0 ? ((result.result.total / result.exam.totalMarks) * 100).toFixed(1) : '0.0'}%
                              </div>
                              <div className="text-xs text-green-600 font-medium">
                                Released on {result.result.publishedAt ? new Date(result.result.publishedAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Performance Summary */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Summary</h3>

                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700">Grade</span>
                            <Badge className={getGradeColor(result.result.grade)}>
                              {result.result.grade}
                            </Badge>
                          </div>
                          <Progress value={result.exam.totalMarks > 0 ? (result.result.total / result.exam.totalMarks) * 100 : 0} className="h-2" />
                          <div className="text-sm text-gray-600 mt-1">
                            {result.exam.totalMarks > 0 ? ((result.result.total / result.exam.totalMarks) * 100).toFixed(1) : '0.0'}% Complete
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {result.result.isPublished && result.result.rank && (
                            <div className="p-4 bg-blue-50 rounded-lg text-center">
                              <div className="text-2xl font-bold text-blue-600">{result.result.rank}</div>
                              <div className="text-sm text-gray-600">Rank</div>
                            </div>
                          )}
                          <div className="p-4 bg-green-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{result.statistics.totalStudents}</div>
                            <div className="text-sm text-gray-600">Total Students</div>
                          </div>

                          {/* Efficiency Metric */}
                          <div className="p-4 bg-purple-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {(() => {
                                const answered = result.questions.filter(q =>
                                  q.studentAnswer && (typeof q.studentAnswer === 'string' ? q.studentAnswer.trim() !== '' : true) && q.studentAnswer !== 'No answer provided'
                                ).length;
                                const correct = result.questions.filter(q =>
                                  q.awardedMarks === q.marks && q.marks > 0
                                ).length;
                                return answered > 0 ? ((correct / answered) * 100).toFixed(0) + '%' : 'N/A';
                              })()}
                            </div>
                            <div className="text-sm text-gray-600">Efficiency</div>
                          </div>
                        </div>

                        {result.result.comment && (
                          <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium text-gray-800 mb-2">Comments</h4>
                            <p className="text-gray-700">{result.result.comment}</p>
                          </div>
                        )}

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2">Submission Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>Submitted: {new Date(result.submission.submittedAt).toLocaleString()}</div>
                            {result.submission.evaluatedAt && (
                              <div>Evaluated: {new Date(result.submission.evaluatedAt).toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Result Not Available</h3>
                    <p className="text-gray-600">Your result is being processed and will be available soon.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Statistics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="group"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Score</p>
                      <p className="text-3xl font-bold text-gray-900">{(result.statistics.averageScore || 0).toFixed(1)}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="group"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Highest Score</p>
                      <p className="text-3xl font-bold text-gray-900">{result.statistics.highestScore}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="group"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Lowest Score</p>
                      <p className="text-3xl font-bold text-gray-900">{result.statistics.lowestScore}</p>
                    </div>
                    <Target className="h-8 w-8 text-red-500 group-hover:scale-110 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="group"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-3xl font-bold text-gray-900">{result.statistics.totalStudents}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Review Request Section */}
          {result.reviewRequest && (
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
          )}

          {/* Question Review Section */}
          {result.questions && result.questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-8"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    Question Paper Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Filter Controls */}
                  <div className="flex flex-wrap gap-2 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 my-auto mr-2">Filter Questions:</span>
                    <Button
                      variant={filterStatus === 'ALL' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('ALL')}
                      className={filterStatus === 'ALL' ? 'bg-indigo-600' : ''}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === 'CORRECT' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('CORRECT')}
                      className={filterStatus === 'CORRECT' ? 'bg-green-600' : 'text-green-700 border-green-200 hover:bg-green-50'}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Correct
                    </Button>
                    <Button
                      variant={filterStatus === 'WRONG' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('WRONG')}
                      className={filterStatus === 'WRONG' ? 'bg-red-600' : 'text-red-700 border-red-200 hover:bg-red-50'}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Wrong/Partial
                    </Button>
                    <Button
                      variant={filterStatus === 'UNANSWERED' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('UNANSWERED')}
                      className={filterStatus === 'UNANSWERED' ? 'bg-gray-600' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}
                    >
                      <Minus className="h-4 w-4 mr-1" /> Unanswered
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
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Objective Questions (অবজেক্টিভ প্রশ্ন)</h3>
                            <Badge className="bg-blue-100 text-blue-800">
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
                                  className={`border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${isCorrect ? 'bg-green-50/20 border-green-100' : hasAnswer ? 'bg-red-50/20 border-red-100' : 'bg-gray-50 border-gray-200'}`}
                                >
                                  {/* Question Header */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <Badge className="bg-blue-100 text-blue-800">
                                        {type}
                                      </Badge>
                                      <span className="text-sm text-gray-600 font-bold">Question {globalIndex + 1}</span>
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
                                        <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                          <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Assertion (A)</div>
                                          <div className="text-sm">
                                            <UniversalMathJax dynamic>{(question as any).assertion || question.questionText}</UniversalMathJax>
                                          </div>
                                        </div>
                                        <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                                          <div className="text-[10px] font-bold text-purple-600 uppercase mb-1">Reason (R)</div>
                                          <div className="text-sm">
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
                                              isCorrectOpt = Number(correctIndex) === optIndex;
                                            }
                                          } else if (type === 'MC') {
                                            isCorrectOpt = option.isCorrect;
                                          }

                                          let containerStyle = "";
                                          let icon = null;
                                          let labelStyle = "";

                                          if (isSelected && isCorrectOpt) {
                                            // 1. Correct and Selected -> GREEN
                                            containerStyle = "border-green-500 bg-green-50 text-green-900 shadow-md ring-1 ring-green-200 transform scale-[1.01] dark:bg-green-900/20 dark:text-green-100 dark:ring-green-900/40";
                                            icon = <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 fill-green-100 dark:fill-green-900/40" />;
                                            labelStyle = "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200";
                                          } else if (isSelected && !isCorrectOpt) {
                                            // 2. Wrong and Selected -> RED
                                            containerStyle = "border-red-500 bg-red-50 text-red-900 shadow-md ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-100 dark:ring-red-900/40";
                                            icon = <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 fill-red-100 dark:fill-red-900/40" />;
                                            labelStyle = "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200";
                                          } else if (!isSelected && isCorrectOpt) {
                                            // 3. Correct but NOT Selected -> BLUE/TEAL (Distinct)
                                            containerStyle = "border-teal-400 bg-teal-50 text-teal-900 border-dashed ring-1 ring-teal-100 dark:bg-teal-900/20 dark:text-teal-100 dark:ring-teal-900/40";
                                            icon = <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0" />;
                                            labelStyle = "bg-teal-200 text-teal-800 dark:bg-teal-800 dark:text-teal-200";
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
                                    <div className="p-4 bg-white rounded-lg border-2 border-indigo-100 flex flex-col gap-4">
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
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <div className="text-xs font-bold text-gray-400 uppercase">Column A</div>
                                          {(question as any).leftColumn?.map((item: any, i: number) => (
                                            <div key={i} className="p-2 bg-white border rounded text-sm min-h-[40px] flex items-center">
                                              <span className="font-bold mr-2">{i + 1}.</span>
                                              <UniversalMathJax inline>{cleanupMath(item.text)}</UniversalMathJax>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="space-y-2">
                                          <div className="text-xs font-bold text-gray-400 uppercase">Column B</div>
                                          {(question as any).rightColumn?.map((item: any, i: number) => (
                                            <div key={i} className="p-2 bg-white border rounded text-sm min-h-[40px] flex items-center">
                                              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                                              <UniversalMathJax inline>{cleanupMath(item.text)}</UniversalMathJax>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <div className="text-xs font-bold text-indigo-700 uppercase mb-3 text-center">Match Analysis</div>
                                        <div className="overflow-hidden rounded-lg border border-indigo-200">
                                          <table className="w-full text-sm">
                                            <thead className="bg-indigo-100 text-indigo-800">
                                              <tr>
                                                <th className="p-2 text-left w-1/3">Question (Left)</th>
                                                <th className="p-2 text-left w-1/3">Your Match</th>
                                                <th className="p-2 text-left w-1/3">Correct Match</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-indigo-100 bg-white">
                                              {(question as any).leftColumn?.map((item: any, lIdx: number) => {
                                                const correctMatches = (question as any).matches || {};
                                                const studentMatches = (question.studentAnswer as any)?.matches || (question.studentAnswer as any) || {};

                                                // Normalize student answer
                                                let studentRightId = null;
                                                if (Array.isArray(studentMatches)) {
                                                  const match = studentMatches.find((m: any) => m.leftIndex === lIdx || m.leftId === item.id);
                                                  if (match) studentRightId = match.rightId || (question as any).rightColumn?.[match.rightIndex]?.id;
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
                                                  ? "bg-green-50"
                                                  : isUnanswered
                                                    ? "bg-gray-50 opacity-90"
                                                    : "bg-red-50";

                                                return (
                                                  <tr key={lIdx} className={rowClass}>
                                                    <td className="p-2 border-r border-indigo-100 font-medium">
                                                      <div className="flex items-center gap-1">
                                                        <span className="font-bold text-gray-500 shrink-0">{vlLeft}.</span>
                                                        <UniversalMathJax inline dynamic>{cleanupMath(item.text)}</UniversalMathJax>
                                                      </div>
                                                    </td>
                                                    <td className={`p-2 border-r border-indigo-100 ${isMatchCorrect ? 'text-green-700 font-bold' : isUnanswered ? 'text-gray-400 italic' : 'text-red-600 font-bold'}`}>
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
                                                    <td className="p-2 text-green-700 font-medium">
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
                                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-yellow-100 p-1 rounded-full">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-700"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                        </div>
                                        <span className="font-bold text-yellow-800 text-sm">Explanation / ব্যাখ্যা</span>
                                      </div>
                                      <div className="text-sm text-gray-700 pl-8">
                                        <UniversalMathJax inline dynamic>{cleanupMath(question.explanation)}</UniversalMathJax>
                                        {(question as any).explanationImage && (
                                          <img
                                            src={(question as any).explanationImage}
                                            alt="Explanation"
                                            className="mt-2 max-h-60 rounded border border-gray-200"
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
                            <div className="flex items-center justify-center gap-2 mt-8 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
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
                                                className="w-full h-32 object-contain rounded-lg border-2 border-green-300 bg-white transition-transform group-hover:scale-105"
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
                                                className="w-full h-32 object-contain rounded-lg border-2 border-orange-300 bg-white transition-transform group-hover:scale-105"
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
                                          <div key={subIndex} className="p-3 rounded-lg border border-gray-200 bg-white">
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
                                        <div key={idx} className="relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
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
                                                    className="w-full h-32 object-contain rounded-lg border-2 border-green-300 bg-white transition-transform group-hover:scale-105"
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
                                                    className="w-full h-32 object-contain rounded-lg border-2 border-orange-300 bg-white transition-transform group-hover:scale-105"
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
                                          <div key={subIndex} className="p-3 rounded-lg border border-gray-200 bg-white">
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
          )}

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
                      className="max-w-full max-h-full object-contain rounded-lg bg-white shadow-lg"
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
        </div>
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
      </div>
    </MathJaxContext>
  );
}