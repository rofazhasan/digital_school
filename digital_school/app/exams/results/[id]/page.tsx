'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Star,
  Medal,
  Crown,
  CheckCircle,
  XCircle,
  Minus,
  Download,
  Share2,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  User,
  GraduationCap,
  ArrowLeft,
  FileText,
  CheckSquare,
  MessageSquare,
  Lock,
  ChevronLeft,
  ChevronRight,
  Camera
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
import QRCode from "react-qr-code";

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
  studentAnswer?: string;
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
  const [notificationMessage, setNotificationMessage] = useState('');
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

  // Print Handler
  // @ts-ignore
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
      mcq: result.questions.filter(q => q.type === 'MCQ').map(q => ({
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
      cq: result.questions.filter(q => q.type === 'CQ').map(q => ({
        id: q.id,
        questionText: q.questionText,
        marks: q.marks,
        subQuestions: q.subQuestions || []
      })),
      sq: result.questions.filter(q => q.type === 'SQ').map(q => ({
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
      if (q.type === 'CQ' || q.type === 'SQ') {
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

  // Function to combine original image with annotations
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
      if (question.type === 'CQ' || question.type === 'SQ') {
        // Check if the question has been evaluated (has awarded marks)
        // Only consider unevaluated if student provided an answer but got 0 marks
        const hasStudentAnswer = question.studentAnswer &&
          question.studentAnswer.trim() !== '' &&
          question.studentAnswer !== 'No answer provided';

        return question.awardedMarks === 0 && question.marks > 0 && hasStudentAnswer;
      }
      return false;
    });
  };

  const hasUnansweredQuestions = () => {
    if (!result?.questions) return false;

    return result.questions.some((question: Question) => {
      if (question.type === 'CQ' || question.type === 'SQ') {
        // Check if student didn't answer the question
        const hasStudentAnswer = question.studentAnswer &&
          question.studentAnswer.trim() !== '' &&
          question.studentAnswer !== 'No answer provided';

        return question.marks > 0 && !hasStudentAnswer;
      }
      return false;
    });
  };

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
  const mcqQuestions = result?.questions?.filter((q: Question) => q.type === 'MCQ') || [];
  const mcQuestions = result?.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'mc') || [];
  const arQuestions = result?.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'ar') || [];
  const mtfQuestions = result?.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'mtf') || [];
  const intQuestions = result?.questions?.filter((q: Question) => (q.type || "").toLowerCase() === 'int' || (q.type || "").toLowerCase() === 'numeric') || [];
  const cqQuestions = result?.questions?.filter((q: Question) => q.type === 'CQ') || [];
  const sqQuestions = result?.questions?.filter((q: Question) => q.type === 'SQ') || [];

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
                        const efficiency = ((result.exam.duration - minutesTaken) / result.exam.duration * 100).toFixed(1);
                        return `${efficiency}% remaining`;
                      })() : 'Not available'}
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
                                  q.studentAnswer && q.studentAnswer.trim() !== '' && q.studentAnswer !== 'No answer provided'
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
                          Teacher's Response:
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
                    {/* MCQ Section */}
                    {result.questions.filter(q => {
                      if (q.type !== 'MCQ') return false;
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
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Multiple Choice Questions (MCQ)</h3>
                            <Badge className="bg-blue-100 text-blue-800">
                              {result.questions.filter(q => q.type === 'MCQ').length} Questions
                            </Badge>
                            {result.questions.some(q => q.type === 'MCQ' && q.awardedMarks < 0) && (
                              <Badge variant="destructive" className="text-xs">
                                Negative Marking Applied
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-6">
                            {result.questions
                              .filter(q => {
                                if (q.type !== 'MCQ') return false;
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
                                  className="border rounded-lg p-6 bg-blue-50/50"
                                >
                                  {/* Question Header */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <Badge className="bg-blue-100 text-blue-800">
                                        MCQ
                                      </Badge>
                                      <span className="text-sm text-gray-600">Question {index + 1}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">Marks:</span>
                                      <Badge variant={question.isCorrect ? 'default' : 'destructive'}>
                                        {question.awardedMarks}/{question.marks}
                                      </Badge>
                                      {question.awardedMarks < 0 && (
                                        <Badge variant="destructive" className="text-xs">
                                          Negative
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Question Text */}
                                  <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Question:</h3>
                                    <div className="text-gray-700">
                                      <UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax>
                                    </div>
                                    {question.awardedMarks < 0 && (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Minus className="h-4 w-4 text-red-600" />
                                          <span className="text-sm text-red-700 font-medium">
                                            Negative marks applied for incorrect answer: {question.awardedMarks} marks
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* MCQ Options */}
                                  {question.options && (
                                    <div className="mb-4">
                                      <h4 className="font-medium text-gray-800 mb-2">Options:</h4>
                                      <div className="space-y-2">
                                        {question.options.map((option, optIndex) => {
                                          const isCorrect = option.isCorrect;
                                          const isSelected = question.studentAnswer === option.text;
                                          const isUnanswered = !question.studentAnswer;

                                          return (
                                            <div
                                              key={optIndex}
                                              className={`p-3 rounded-lg border-2 transition-all ${isCorrect && isSelected
                                                ? 'border-green-500 bg-green-50'
                                                : isCorrect && isUnanswered
                                                  ? 'border-blue-500 bg-blue-50' // Different color for correct answer when unanswered
                                                  : isSelected && !isCorrect
                                                    ? 'border-red-500 bg-red-50'
                                                    : isCorrect
                                                      ? 'border-green-500 bg-green-50'
                                                      : 'border-gray-200 bg-white'
                                                }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">{String.fromCharCode(0x0995 + optIndex)}.</span>
                                                <span className={isCorrect && isUnanswered ? 'text-blue-700 font-medium' : ''}>
                                                  <UniversalMathJax inline dynamic>
                                                    {cleanupMath(option.text)}
                                                  </UniversalMathJax>
                                                </span>
                                                {isCorrect && (
                                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                                )}
                                                {isSelected && !isCorrect && (
                                                  <XCircle className="h-4 w-4 text-red-600" />
                                                )}
                                                {isCorrect && isUnanswered && (
                                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    Correct Answer
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Explanation */}
                                  {question.explanation && (
                                    <div className="mb-4">
                                      <h4 className="font-medium text-gray-800 mb-2">Explanation:</h4>
                                      <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50">
                                        <div className="text-gray-700">
                                          <UniversalMathJax inline dynamic>{cleanupMath(question.explanation)}</UniversalMathJax>
                                        </div>
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

                    {/* MC Section */}
                    {result.questions.filter(q => {
                      if ((q.type || "").toLowerCase() !== 'mc') return false;
                      const hasAnswer = q.studentAnswer && (q as any).studentAnswer?.selectedOptions?.length > 0;
                      const isCorrect = q.awardedMarks === q.marks && q.marks > 0;
                      switch (filterStatus) {
                        case 'CORRECT': return isCorrect;
                        case 'WRONG': return hasAnswer && !isCorrect;
                        case 'UNANSWERED': return !hasAnswer;
                        default: return true;
                      }
                    }).length > 0 && (
                        <div className="mt-8 border-t-2 border-indigo-100 pt-8">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <CheckSquare className="h-4 w-4 text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Multiple Correct (MC)</h3>
                          </div>
                          <div className="space-y-6">
                            {result.questions
                              .filter(q => (q.type || "").toLowerCase() === 'mc')
                              .map((question, index) => {
                                const ans = (question as any).studentAnswer || {};
                                const selected = ans.selectedOptions || [];
                                return (
                                  <motion.div key={question.id} className="border rounded-lg p-6 bg-indigo-50/30">
                                    <div className="flex items-center justify-between mb-4">
                                      <Badge className="bg-indigo-100 text-indigo-800">MC</Badge>
                                      <Badge variant={question.awardedMarks === question.marks ? 'default' : 'destructive'}>
                                        {question.awardedMarks}/{question.marks}
                                      </Badge>
                                    </div>
                                    <h4 className="font-semibold mb-2"><UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax></h4>
                                    <div className="space-y-2">
                                      {question.options?.map((opt, oidx) => {
                                        const isSelected = selected.includes(oidx);
                                        const isCorrect = opt.isCorrect;
                                        return (
                                          <div key={oidx} className={`p-2 rounded border flex items-center justify-between ${isSelected ? (isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300') : (isCorrect ? 'bg-green-50 border-green-200 opacity-80' : 'bg-white border-gray-100')}`}>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">{String.fromCharCode(65 + oidx)}</span>
                                              <span className="text-sm"><UniversalMathJax inline dynamic>{cleanupMath(opt.text)}</UniversalMathJax></span>
                                            </div>
                                            {isSelected && (isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />)}
                                            {!isSelected && isCorrect && <CheckCircle className="w-4 h-4 text-green-500/50" />}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                    {/* AR Section */}
                    {result.questions.filter(q => {
                      if ((q.type || "").toLowerCase() !== 'ar') return false;
                      const hasAnswer = (q as any).studentAnswer?.selectedOption !== undefined;
                      const isCorrect = q.awardedMarks === q.marks && q.marks > 0;
                      switch (filterStatus) {
                        case 'CORRECT': return isCorrect;
                        case 'WRONG': return hasAnswer && !isCorrect;
                        case 'UNANSWERED': return !hasAnswer;
                        default: return true;
                      }
                    }).length > 0 && (
                        <div className="mt-8 border-t-2 border-purple-100 pt-8">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Star className="h-4 w-4 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Assertion-Reason (AR)</h3>
                          </div>
                          <div className="space-y-6">
                            {result.questions
                              .filter(q => (q.type || "").toLowerCase() === 'ar')
                              .map((question: any) => {
                                const selected = Number(question.studentAnswer?.selectedOption || 0);
                                const correct = Number(question.correct || question.correctOption || 0);
                                return (
                                  <motion.div key={question.id} className="border rounded-lg p-6 bg-purple-50/30">
                                    <div className="flex justify-between items-start mb-4">
                                      <div className="space-y-2 flex-1">
                                        <div className="p-3 bg-white/50 rounded border border-indigo-100">
                                          <div className="text-[10px] font-bold text-indigo-600 mb-1 leading-none uppercase">ASSERTION</div>
                                          <UniversalMathJax inline dynamic>{cleanupMath(question.assertion || question.questionText)}</UniversalMathJax>
                                        </div>
                                        <div className="p-3 bg-white/50 rounded border border-purple-100">
                                          <div className="text-[10px] font-bold text-purple-600 mb-1 leading-none uppercase">REASON</div>
                                          <UniversalMathJax inline dynamic>{cleanupMath(question.reason)}</UniversalMathJax>
                                        </div>
                                      </div>
                                      <Badge className="ml-4" variant={selected === correct ? 'default' : 'destructive'}>{question.awardedMarks}/{question.marks}</Badge>
                                    </div>
                                    <div className="flex gap-4 text-sm mt-4 p-3 bg-gray-100 rounded font-medium">
                                      <div><span className="text-gray-500 mr-2">Your Ans:</span> Option {selected || 'None'}</div>
                                      <div><span className="text-gray-500 mr-2">Correct Ans:</span> Option {correct}</div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                    {/* MTF Section */}
                    {result.questions.filter(q => {
                      if ((q.type || "").toLowerCase() !== 'mtf') return false;
                      const hasAnswer = (q as any).studentAnswer?.matches?.length > 0;
                      const isCorrect = q.awardedMarks === q.marks && q.marks > 0;
                      switch (filterStatus) {
                        case 'CORRECT': return isCorrect;
                        case 'WRONG': return hasAnswer && !isCorrect;
                        case 'UNANSWERED': return !hasAnswer;
                        default: return true;
                      }
                    }).length > 0 && (
                        <div className="mt-8 border-t-2 border-orange-100 pt-8">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 text-orange-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Match the Following</h3>
                          </div>
                          <div className="space-y-6">
                            {result.questions
                              .filter(q => (q.type || "").toLowerCase() === 'mtf')
                              .map((question: any) => {
                                const ans = question.studentAnswer || {};
                                const studentMatches = ans.matches || ans; // Handle both {matches:[]} and direct map {A:1}
                                let normalizedMatches: any[] = [];
                                if (Array.isArray(studentMatches)) {
                                  normalizedMatches = studentMatches;
                                } else if (studentMatches && typeof studentMatches === 'object' && studentMatches.matches) {
                                  normalizedMatches = studentMatches.matches;
                                } else if (studentMatches && typeof studentMatches === 'object' && !studentMatches.matches) {
                                  // Convert ID-based map to index-based for uniform display
                                  Object.entries(studentMatches).forEach(([leftId, rightId]) => {
                                    const leftIndex = question.leftColumn?.findIndex((l: any) => l.id === leftId);
                                    const rightIndex = question.rightColumn?.findIndex((r: any) => r.id === rightId);
                                    if (leftIndex !== -1 && rightIndex !== -1) {
                                      normalizedMatches.push({ leftIndex, rightIndex });
                                    }
                                  });
                                }

                                return (
                                  <motion.div key={question.id} className="border rounded-lg p-6 bg-orange-50/30">
                                    <div className="flex justify-between items-center mb-4">
                                      <h4 className="font-bold"><UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax></h4>
                                      <Badge variant={question.awardedMarks === question.marks ? 'default' : 'destructive'}>{question.awardedMarks}/{question.marks}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {question.pairs?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-white rounded border">
                                          <span className="text-sm font-medium"><UniversalMathJax inline dynamic>{cleanupMath(p.left)}</UniversalMathJax></span>
                                          <ArrowLeft className="w-4 h-4 rotate-180 text-gray-400" />
                                          <span className="text-sm font-bold text-indigo-600"><UniversalMathJax inline dynamic>{cleanupMath(p.right)}</UniversalMathJax></span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-4 p-2 bg-gray-50 border border-dotted rounded text-xs text-gray-500">
                                      <span className="font-bold mr-2">Your Matching:</span>
                                      {normalizedMatches.length > 0 ? normalizedMatches.map((m: any) => `(${m.leftIndex + 1}→${m.rightIndex + 1})`).join(', ') : 'No matches made'}
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                    {/* Integer Section */}
                    {result.questions.filter(q => {
                      const t = (q.type || "").toLowerCase();
                      if (t !== 'int' && t !== 'numeric') return false;
                      const hasAnswer = (q as any).studentAnswer?.answer !== undefined;
                      const isCorrect = q.awardedMarks === q.marks && q.marks > 0;
                      switch (filterStatus) {
                        case 'CORRECT': return isCorrect;
                        case 'WRONG': return hasAnswer && !isCorrect;
                        case 'UNANSWERED': return !hasAnswer;
                        default: return true;
                      }
                    }).length > 0 && (
                        <div className="mt-8 border-t-2 border-red-100 pt-8">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <Target className="h-4 w-4 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Integer/Numeric</h3>
                          </div>
                          <div className="space-y-6">
                            {result.questions
                              .filter(q => { const t = (q.type || "").toLowerCase(); return t === 'int' || t === 'numeric'; })
                              .map((question: any) => {
                                const std = question.studentAnswer?.answer;
                                const cor = question.correct || question.answer;
                                return (
                                  <motion.div key={question.id} className={`border rounded-lg p-6 ${std === cor ? 'bg-green-50/30' : 'bg-red-50/30'}`}>
                                    <div className="flex justify-between mb-2">
                                      <h4 className="font-semibold"><UniversalMathJax inline dynamic>{cleanupMath(question.questionText)}</UniversalMathJax></h4>
                                      <Badge variant={std === cor ? 'default' : 'destructive'}>{question.awardedMarks}/{question.marks}</Badge>
                                    </div>
                                    <div className="flex gap-8 mt-2 text-sm font-medium">
                                      <div className="p-3 bg-white rounded border flex-1 shadow-sm"><span className="text-gray-500 mr-2 uppercase text-[10px]">Your Answer:</span>{std ?? 'N/A'}</div>
                                      <div className="p-3 bg-green-50 rounded border border-green-200 flex-1 shadow-sm"><span className="text-green-600 mr-2 uppercase text-[10px]">Correct Answer:</span>{cor}</div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                    {/* CQ Section */}
                    {result.questions.filter(q => {
                      if (q.type !== 'CQ') return false;
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
                              {result.questions.filter(q => q.type === 'CQ').length} Questions
                            </Badge>
                          </div>
                          <div className="space-y-6">
                            {result.questions
                              .filter(q => {
                                if (q.type !== 'CQ') return false;
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
                                      <h4 className="font-medium text-gray-800 mb-2">Evaluator's Feedback:</h4>
                                      <div className="p-3 rounded-lg border-2 border-orange-200 bg-orange-50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <MessageSquare className="h-4 w-4 text-orange-600" />
                                          <span className="text-sm font-medium text-orange-800">
                                            Teacher's annotations on your answer
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
                      if (q.type !== 'SQ') return false;
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
                              {result.questions.filter(q => q.type === 'SQ').length} Questions
                            </Badge>
                          </div>
                          <div className="space-y-6">
                            {result.questions
                              .filter(q => {
                                if (q.type !== 'SQ') return false;
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

                                  {question.type === 'CQ' && question.subQuestions ? (
                                    <div className="space-y-8 mt-6">
                                      <h4 className="font-bold text-gray-900 border-b-2 border-indigo-100 pb-3 text-lg">Detailed Answer Breakdown</h4>
                                      {question.subQuestions.map((subQ: any, idx: number) => (
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
                                          <h4 className="font-medium text-gray-800 mb-2">Evaluator's Feedback:</h4>
                                          <div className="p-3 rounded-lg border-2 border-orange-200 bg-orange-50">
                                            <div className="flex items-center gap-2 mb-2">
                                              <MessageSquare className="h-4 w-4 text-orange-600" />
                                              <span className="text-sm font-medium text-orange-800">
                                                Teacher's annotations on your answer
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
                    <li>You'll be notified when the review is complete</li>
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
                      onLoad={(e) => {
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