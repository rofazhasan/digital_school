"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  FileText,
  CheckCircle,
  XCircle,
  PenTool,
  Save,
  ArrowLeft,
  ArrowRight,
  Star,
  MessageSquare,
  Download,
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eraser,
  Undo,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Trophy,
  LayoutDashboard,
  Activity,
  Video,
  MonitorPlay,
  Maximize2,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { MathJax, MathJaxContext } from "better-react-mathjax";

interface LiveStudent {
  id: string;
  studentName: string;
  roll: string;
  className: string;
  section: string;
  status: string;
  progress: number;
  answered: number;
  totalQuestions: number;
  score: number;
  maxScore: number;
  lastActive: string;
  answers: Record<string, any>;
}

interface LiveExamStats {
  examName: string;
  totalStudents: number;
  activeStudents: number;
  submittedStudents: number;
  liveData: LiveStudent[];
  questionsBySet: Record<string, any[]>;
  defaultQuestions: any[];
}

interface StudentSubmission {
  id: string;
  student: {
    id: string;
    name: string;
    roll: string;
    registrationNo: string;
  };
  answers: Record<string, any>;
  submittedAt: string;
  totalMarks: number;
  earnedMarks: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  evaluatorNotes?: string;
  result?: {
    mcqMarks: number;
    cqMarks: number;
    sqMarks: number;
    total: number;
  };
}

interface Question {
  id: string;
  type: 'mcq' | 'cq' | 'sq';
  text: string;
  marks: number;
  correct?: any;
  options?: any[];
  explanation?: string;
  subQuestions?: any[];
  modelAnswer?: string;
}

interface Exam {
  id: string;
  name: string;
  description: string;
  totalMarks: number;
  questions: Question[];
  submissions: StudentSubmission[];
}

const mathJaxConfig = {
  loader: { load: ["[tex]/ams"] },
  tex: {
    packages: { '[+]': ['ams'] },
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
  },
};

export default function ExamEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [exam, setExam] = useState<Exam | null>(null);

  // Tabs State
  const [activeTab, setActiveTab] = useState("evaluation");

  // Live Monitor State
  const [liveStats, setLiveStats] = useState<LiveExamStats | null>(null);
  const [selectedLiveStudent, setSelectedLiveStudent] = useState<LiveStudent | null>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'all' | 'mcq' | 'cq' | 'sq'>('all');
  const [showDrawingTool, setShowDrawingTool] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [drawingMode, setDrawingMode] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [drawingColor, setDrawingColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [isSuperUser, setIsSuperUser] = useState(false);
  const [showReviewRequests, setShowReviewRequests] = useState(false);
  const [reviewRequests, setReviewRequests] = useState<any[]>([]);
  const [showReviewAlert, setShowReviewAlert] = useState(false);
  const [newReviewCount, setNewReviewCount] = useState(0);
  const [reviewResponse, setReviewResponse] = useState('');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);

  useEffect(() => {
    // Get user role from custom JWT token
    const getUserRole = async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setIsSuperUser(userData.user.role === "SUPER_USER");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    getUserRole();
  }, []);

  useEffect(() => {
    fetchExamData();
    fetchReviewRequests();

    // Set up periodic checking for new review requests
    const interval = setInterval(() => {
      checkForNewReviews();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [id]);


  // Live Monitor Polling
  const fetchLiveStats = async () => {
    try {
      const response = await fetch(`/api/exams/${id}/live-monitor`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLiveStats(data);
      }
    } catch (error) {
      console.error("Error fetching live stats:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'live') {
      fetchLiveStats();
      const interval = setInterval(fetchLiveStats, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab, id]);

  const renderLiveMonitor = () => {
    if (!liveStats) return <div className="p-8 text-center">Loading Live Data...</div>;

    const { liveData, activeStudents, submittedStudents, totalStudents } = liveStats;

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Active Students</p>
                <p className="text-2xl font-bold text-blue-900">{activeStudents}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500 opacity-50" />
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Submitted</p>
                <p className="text-2xl font-bold text-green-900">{submittedStudents}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Total Enrolled</p>
                <p className="text-2xl font-bold text-purple-900">{totalStudents}</p>
              </div>
              <LayoutDashboard className="h-8 w-8 text-purple-500 opacity-50" />
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500 animate-pulse" />
            Live Monitoring
          </h3>
          <Button variant="outline" size="sm" onClick={fetchLiveStats}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>

        {/* Student Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {liveData.map(student => (
            <Card
              key={student.id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/20 ${student.status === 'IN_PROGRESS' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'}`}
              onClick={() => {
                setSelectedLiveStudent(student);
                setIsLiveModalOpen(true);
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900 truncate">{student.studentName}</p>
                    <p className="text-xs text-gray-500">Roll: {student.roll} • {student.className} {student.section}</p>
                  </div>
                  {student.status === 'IN_PROGRESS' ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] animate-pulse">Running</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px]">Submitted</Badge>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Progress</span>
                    <span>{student.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1 text-gray-600">
                    <CheckSquare className="w-3 h-3" />
                    {student.answered} / {student.totalQuestions}
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-primary">
                    <Trophy className="w-3 h-3" />
                    Score: {student.score}
                  </div>
                </div>

                <div className="text-[10px] text-right text-gray-400">
                  Active: {new Date(student.lastActive).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed View Modal */}
        <Dialog open={isLiveModalOpen} onOpenChange={setIsLiveModalOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Live Status: {selectedLiveStudent?.studentName}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Summary Header */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Current Score</p>
                  <p className="text-xl font-bold text-primary">{selectedLiveStudent?.score} / {selectedLiveStudent?.maxScore}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="text-xl font-bold">{selectedLiveStudent?.progress}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Answered</p>
                  <p className="text-xl font-bold">{selectedLiveStudent?.answered} / {selectedLiveStudent?.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge>{selectedLiveStudent?.status}</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Question Analysis</h4>
                {selectedLiveStudent && liveStats?.questionsBySet && liveStats.defaultQuestions && (() => {
                  const relevantQuestions = liveStats.defaultQuestions;

                  return relevantQuestions.map((q: any, idx: number) => {
                    const ans = selectedLiveStudent.answers[q.id];
                    const hasAnswer = ans !== undefined && ans !== null && ans !== "";

                    return (
                      <Card key={q.id} className={`border ${hasAnswer ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200'}`}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div className="flex-grow space-y-2">
                              <div className="prose prose-sm max-w-none">
                                <MathJax>{q.text}</MathJax>
                              </div>

                              {hasAnswer ? (
                                <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                                  <p className="text-xs font-semibold text-gray-500 mb-1">Student Answer:</p>
                                  <div className="text-sm font-medium text-blue-800">
                                    <MathJax>{String(ans)}</MathJax>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2 text-xs text-gray-400 italic">Not answered yet</div>
                              )}

                              {/* Show options if MCQ */}
                              {q.type === 'mcq' && q.options && (
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {q.options.map((opt: any, i: number) => {
                                    const isSelected = hasAnswer && String(ans) === (opt.text || String(opt));
                                    const isCorrect = opt.isCorrect;
                                    return (
                                      <div key={i} className={`text-xs p-2 rounded border ${isSelected ? 'bg-blue-100 border-blue-300' :
                                        isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                        }`}>
                                        <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                                        <MathJax inline>{opt.text || String(opt)}</MathJax>
                                        {isCorrect && <CheckCircle className="inline w-3 h-3 ml-2 text-green-600" />}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="text-xs font-bold text-gray-500">{q.marks} Marks</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };




  const fetchExamData = async (targetStudentId?: string) => {
    try {
      const url = targetStudentId
        ? `/api/exams/evaluations/${id}?studentId=${targetStudentId}`
        : `/api/exams/evaluations/${id}`;

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Frontend received exam data:', {
          submissionsCount: data.submissions?.length,
          firstSubmission: data.submissions?.[0] ? {
            id: data.submissions[0].id,
            hasResult: !!data.submissions[0].result,
            mcqMarks: data.submissions[0].result?.mcqMarks,
            total: data.submissions[0].result?.total
          } : null
        });
        setExam(data);
      } else {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        toast.error("Failed to fetch exam data");
      }
    } catch (error) {
      console.error("Error fetching exam data:", error);
      toast.error("Failed to fetch exam data");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewRequests = async () => {
    try {
      const response = await fetch(`/api/exams/evaluations/${id}/review-requests`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReviewRequests(data.reviewRequests || []);
      }
    } catch (error) {
      console.error("Error fetching review requests:", error);
    }
  };

  const checkForNewReviews = async () => {
    try {
      const response = await fetch(`/api/exams/evaluations/${id}/review-requests`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newReviews = data.reviewRequests?.filter((r: any) => r.status === 'PENDING') || [];

        if (newReviews.length > newReviewCount) {
          setNewReviewCount(newReviews.length);
          setShowReviewAlert(true);
          toast.info(`New review request${newReviews.length > 1 ? 's' : ''} received!`, {
            action: {
              label: 'View',
              onClick: () => setShowReviewRequests(true)
            }
          });
        }
      }
    } catch (error) {
      console.error("Error checking for new reviews:", error);
    }
  };

  const respondToReview = async (reviewId: string, response: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      // Find the review request to get student info
      const reviewRequest = reviewRequests.find(r => r.id === reviewId);
      if (!reviewRequest) {
        toast.error('Review request not found');
        return;
      }

      const res = await fetch(`/api/exams/evaluations/${id}/review-requests/${reviewId}/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response,
          status
        })
      });

      if (res.ok) {
        if (status === 'APPROVED') {
          // If approved, automatically submit the student's evaluation
          const submitRes = await fetch(`/api/exams/evaluations/${id}/submit-student`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: reviewRequest.studentId
            })
          });

          if (submitRes.ok) {
            toast.success(`Review approved and student evaluation submitted successfully`);
          } else {
            toast.success(`Review approved but failed to submit student evaluation`);
          }
        } else {
          // If rejected, marks remain unchanged
          toast.success(`Review rejected. Original marks maintained.`);
        }

        setShowResponseDialog(false);
        setSelectedReview(null);
        setReviewResponse('');
        fetchReviewRequests();

        // Refresh exam data to show updated status
        fetchExamData();
      } else {
        toast.error('Failed to respond to review');
      }
    } catch (error) {
      console.error('Error responding to review:', error);
      toast.error('Failed to respond to review');
    }
  };

  // Get filtered questions based on type
  const filteredQuestions = exam?.questions.filter(q =>
    questionTypeFilter === 'all' || q.type === questionTypeFilter
  ) || [];



  const currentStudent = exam?.submissions[currentStudentIndex];
  const currentQuestion = filteredQuestions[currentQuestionIndex];

  // Use exam's total marks from the database
  const totalMarks = exam?.totalMarks || 0;

  // Try to get answer with different possible formats
  let currentAnswer = currentStudent?.answers[currentQuestion?.id || ''];
  if (!currentAnswer && currentQuestion?.id) {
    // Try with _images suffix
    currentAnswer = currentStudent?.answers[`${currentQuestion.id}_images`];
  }

  const getMCQScore = (question: Question, answer: any) => {
    if (question.type !== 'mcq' || !answer) return 0;

    const userAnswer = answer;

    // First check if student answer matches any option marked as correct
    if (question.options && Array.isArray(question.options)) {
      const correctOption = question.options.find((opt: any) => opt.isCorrect);
      if (correctOption && userAnswer === correctOption.text) {
        return question.marks;
      }
    }

    // Fallback: Check if there's a direct correctAnswer field
    const correctAnswer = question.correct;
    if (correctAnswer) {
      // Handle different correct answer formats
      if (typeof correctAnswer === 'number') {
        return userAnswer === correctAnswer ? question.marks : 0;
      } else if (typeof correctAnswer === 'object' && correctAnswer !== null) {
        return userAnswer === correctAnswer.text ? question.marks : 0;
      } else if (Array.isArray(correctAnswer)) {
        // Handle array format (e.g., ["answer1", "answer2"])
        return correctAnswer.includes(userAnswer) ? question.marks : 0;
      } else {
        return userAnswer === String(correctAnswer) ? question.marks : 0;
      }
    }

    return 0;
  };

  // Check if evaluator can edit marks for current student
  const canEditMarks = () => {
    if (!currentStudent) return false;

    // Super users can always edit marks
    if (isSuperUser) return true;

    // Check if student has a review request
    const studentReview = reviewRequests.find(r => r.studentId === currentStudent.student.id);
    const hasReviewRequest = studentReview && (studentReview.status === 'PENDING' || studentReview.status === 'UNDER_REVIEW');

    // For evaluators, can edit marks only when:
    // 1. Status is PENDING or IN_PROGRESS, OR
    // 2. There's a review request (PENDING or UNDER_REVIEW)
    if (currentStudent.status === 'COMPLETED') {
      // If completed, only allow editing if there's a review request
      return hasReviewRequest;
    }

    // For PENDING or IN_PROGRESS status, always allow editing
    return currentStudent.status === 'PENDING' || currentStudent.status === 'IN_PROGRESS';
  };

  // Check if student evaluation can be submitted
  const canSubmitStudent = () => {
    if (!currentStudent) return false;

    // Super users can always submit
    if (isSuperUser) return true;

    // Evaluators can submit if status is not COMPLETED
    return currentStudent.status !== 'COMPLETED';
  };

  // Check if all evaluations can be submitted
  const canSubmitAll = () => {
    if (!exam) return false;

    // Super users can always submit all
    if (isSuperUser) return true;

    // Evaluators can submit all if any student is not completed
    return exam.submissions.some(submission => submission.status !== 'COMPLETED');
  };

  const updateMarks = async (questionId: string, marks: number) => {
    if (!currentStudent || !currentQuestion) return;

    // Check if evaluator can edit marks
    if (!canEditMarks()) {
      toast.error("Cannot edit marks. Student evaluation is already submitted or no review request exists.");
      return;
    }

    if (marks > currentQuestion.marks) {
      toast.error(`Cannot give more than ${currentQuestion.marks} marks`);
      return;
    }

    try {
      const response = await fetch(`/api/exams/evaluations/${id}/grade`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudent.student.id,
          questionId,
          marks,
          notes: currentStudent.evaluatorNotes || ''
        })
      });

      if (response.ok) {
        toast.success("Marks updated successfully");

        // Update local state immediately for better UX
        if (exam && currentStudent) {
          const updatedExam = { ...exam };
          const studentIndex = updatedExam.submissions.findIndex(s => s.student.id === currentStudent.student.id);
          if (studentIndex !== -1) {
            updatedExam.submissions[studentIndex] = {
              ...updatedExam.submissions[studentIndex],
              answers: {
                ...updatedExam.submissions[studentIndex].answers,
                [`${questionId}_marks`]: marks
              }
            };
            setExam(updatedExam);
          }
        }

        // Check if this student has a pending review request and mark it as under review
        const studentReview = reviewRequests.find(r => r.studentId === currentStudent.student.id);
        if (studentReview && studentReview.status === 'PENDING') {
          try {
            await fetch(`/api/exams/evaluations/${id}/review-requests/${studentReview.id}/mark-under-review`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
            fetchReviewRequests(); // Refresh review requests
          } catch (error) {
            console.error('Error marking review as under review:', error);
          }
        }

        // Also refresh data from server to ensure consistency
        fetchExamData(currentStudent.student.id);
      } else {
        toast.error("Failed to update marks");
      }
    } catch (error) {
      console.error("Error updating marks:", error);
      toast.error("Failed to update marks");
    }
  };

  const updateNotes = async (notes: string) => {
    if (!currentStudent) return;

    try {
      const response = await fetch(`/api/exams/evaluations/${id}/notes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudent.student.id,
          notes
        })
      });

      if (response.ok) {
        toast.success("Notes updated successfully");
        fetchExamData(currentStudent.student.id); // Refresh data with current student
      } else {
        toast.error("Failed to update notes");
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    }
  };

  const submitStudentEvaluation = async () => {
    console.log('Submit student evaluation called for:', currentStudent?.student.name);
    if (!currentStudent) return;

    // Check if can submit student evaluation
    if (!canSubmitStudent()) {
      toast.error("Cannot submit student evaluation. Student evaluation is already completed.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/exams/evaluations/${id}/submit-student`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudent.student.id
        })
      });

      console.log('Submit response status:', response.status);
      if (response.ok) {
        toast.success("Student evaluation submitted successfully");
        fetchExamData(currentStudent.student.id); // Refresh data with current student
      } else {
        const errorText = await response.text();
        console.error('Submit error:', errorText);
        toast.error("Failed to submit student evaluation");
      }
    } catch (error) {
      console.error("Error submitting student evaluation:", error);
      toast.error("Failed to submit student evaluation");
    } finally {
      setSaving(false);
    }
  };

  const submitAllEvaluations = async () => {
    if (!exam) return;

    // Check if can submit all evaluations
    if (!canSubmitAll()) {
      toast.error("Cannot submit all evaluations. All student evaluations are already completed.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/exams/evaluations/${id}/submit-all`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast.success("All evaluations submitted successfully");
        fetchExamData(); // Refresh all data
      } else {
        toast.error("Failed to submit all evaluations");
      }
    } catch (error) {
      console.error("Error submitting all evaluations:", error);
      toast.error("Failed to submit all evaluations");
    } finally {
      setSaving(false);
    }
  };

  const releaseResults = async () => {
    if (!exam) return;

    // Check if there are any pending review requests
    const pendingReviews = reviewRequests.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW');
    if (pendingReviews.length > 0) {
      const shouldContinue = confirm(
        `There are ${pendingReviews.length} pending review request${pendingReviews.length > 1 ? 's' : ''}. ` +
        'Releasing results will close all pending reviews. Do you want to continue?'
      );
      if (!shouldContinue) return;
    }

    try {
      const response = await fetch(`/api/exams/evaluations/release-results`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: id })
      });

      if (response.ok) {
        toast.success("Results released successfully");
        fetchExamData(); // Refresh data
        fetchReviewRequests(); // Refresh review requests
      } else {
        toast.error("Failed to release results");
      }
    } catch (error) {
      console.error("Error releasing results:", error);
      toast.error("Failed to release results");
    }
  };

  // Drawing tool functions
  const initCanvas = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;

    ctx.scale(zoom, zoom);

    // Load existing drawing if available
    if (currentStudent && currentQuestion) {
      try {
        const response = await fetch(
          `/api/exams/evaluations/${id}/get-drawing?studentId=${currentStudent.student.id}&questionId=${currentQuestion.id}&imageIndex=${currentImageIndex}`,
          {
            credentials: 'include'
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.drawing && data.drawing.imageData) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
            };
            img.src = data.drawing.imageData;
          }
        }
      } catch (error) {
        console.error('Error loading existing drawing:', error);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Set drawing properties
    if (drawingMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = drawingMode === 'highlighter' ? drawingColor + '80' : drawingColor;
      ctx.globalAlpha = drawingMode === 'highlighter' ? 0.5 : 1;
    }
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (drawingMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2; // Eraser is bigger
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = drawingMode === 'highlighter' ? drawingColor + '80' : drawingColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Keyboard shortcuts for drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDrawingTool) {
        if (e.key === 'Escape') {
          setIsDrawing(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDrawingTool]);

  const saveDrawing = async () => {
    if (!canvasRef.current || !currentStudent || !currentQuestion || !currentImage || !imageRef.current) return;

    try {
      const canvas = canvasRef.current;

      // Get the annotation data from the canvas as PNG
      const annotationData = canvas.toDataURL('image/png');

      const response = await fetch(`/api/exams/evaluations/${id}/save-drawing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId: currentStudent.student.id,
          questionId: currentQuestion.id,
          imageData: annotationData,
          originalImagePath: currentImage,
          imageIndex: currentImageIndex
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save drawing');
      }

      toast.success("Drawing saved successfully");
      setShowDrawingTool(false);
    } catch (error) {
      console.error('Error saving drawing:', error);
      toast.error("Failed to save drawing");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading evaluation...</div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="text-red-600 text-lg">Exam not found</div>
          <div className="text-sm text-gray-500 mt-2">ID: {id}</div>
        </div>
      </div>
    );
  }

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 lg:p-6">
          {/* Review Alert Banner */}
          {showReviewAlert && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      New Review Request{newReviewCount > 1 ? 's' : ''} Received!
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {newReviewCount} student{newReviewCount > 1 ? 's have' : ' has'} requested a review of their exam results.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReviewAlert(false)}
                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowReviewAlert(false);
                      setShowReviewRequests(true);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    View Reviews
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.name}</h1>
                <p className="text-gray-600">{exam.description}</p>

                {/* Permission and Status Summary */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={
                    isSuperUser ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }>
                    {isSuperUser ? '👑 Super User' : '👨‍🏫 Evaluator'}
                  </Badge>

                  <Badge className="bg-gray-100 text-gray-800">
                    📊 {exam.submissions.length} Students
                  </Badge>

                  <Badge className="bg-gray-100 text-gray-800">
                    ✅ {exam.submissions.filter(s => s.status === 'COMPLETED').length} Completed
                  </Badge>

                  <Badge className="bg-gray-100 text-gray-800">
                    ⏳ {exam.submissions.filter(s => s.status !== 'COMPLETED').length} Pending
                  </Badge>

                  {reviewRequests.filter(r => r.status === 'PENDING').length > 0 && (
                    <Badge className="bg-red-100 text-red-800">
                      📝 {reviewRequests.filter(r => r.status === 'PENDING').length} Review Requests
                    </Badge>
                  )}
                </div>
              </div>

              {/* Debug Info */}
              <div className="text-xs text-gray-500">
                <div>Questions: {exam.questions?.length || 0}</div>
                <div>Submissions: {exam.submissions?.length || 0}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.history.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReviewRequests(true)}
                  className={`relative ${reviewRequests.filter(r => r.status === 'PENDING').length > 0
                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'}`}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Review Requests ({reviewRequests.filter(r => r.status === 'PENDING').length})
                  {reviewRequests.filter(r => r.status === 'PENDING').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {reviewRequests.filter(r => r.status === 'PENDING').length}
                    </span>
                  )}
                </Button>
                {isSuperUser && (
                  <Button
                    onClick={releaseResults}
                    className="bg-green-600 hover:bg-green-700"
                    title="Release results to make them visible to students"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Release Results
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border mb-4 inline-flex">
              <TabsTrigger value="evaluation" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Evaluation</TabsTrigger>
              <TabsTrigger value="live" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 flex items-center gap-2">
                <Video className="w-4 h-4 ml-1 mr-1 animate-pulse text-red-500" /> Live Monitor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              {renderLiveMonitor()}
            </TabsContent>

            <TabsContent value="evaluation">
              {/* Student Navigation */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newIndex = Math.max(0, currentStudentIndex - 1);
                        setCurrentStudentIndex(newIndex);
                        // Refetch exam data with the new student's questions
                        if (exam?.submissions[newIndex]) {
                          fetchExamData(exam.submissions[newIndex].student.id);
                        }
                      }}
                      disabled={currentStudentIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="text-center">
                      <div className="font-semibold">
                        {currentStudent?.student.name} ({currentStudent?.student.roll})
                      </div>
                      <div className="text-sm text-gray-600">
                        Student {currentStudentIndex + 1} of {exam.submissions.length}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        const newIndex = Math.min(exam.submissions.length - 1, currentStudentIndex + 1);
                        setCurrentStudentIndex(newIndex);
                        // Refetch exam data with the new student's questions
                        if (exam?.submissions[newIndex]) {
                          fetchExamData(exam.submissions[newIndex].student.id);
                        }
                      }}
                      disabled={currentStudentIndex === exam.submissions.length - 1}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => currentStudent && window.open(`/exams/evaluations/${id}/print/${currentStudent.student.id}`, '_blank')}
                      disabled={!currentStudent}
                      title="Print student script with marks"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Script
                    </Button>

                    <Button
                      onClick={submitStudentEvaluation}
                      disabled={saving || !canSubmitStudent()}
                      className={`${canSubmitStudent()
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                        }`}
                      title={
                        !canSubmitStudent()
                          ? "Student evaluation is already completed"
                          : "Submit this student's evaluation"
                      }
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Submit Student
                      {currentStudent?.status === 'COMPLETED' && (
                        <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                          ✓ Completed
                        </Badge>
                      )}
                    </Button>

                    <Button
                      onClick={submitAllEvaluations}
                      disabled={saving || !canSubmitAll()}
                      className={`${canSubmitAll()
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                        }`}
                      title={
                        !canSubmitAll()
                          ? "All student evaluations are already completed"
                          : "Submit all student evaluations"
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit All
                      {exam && exam.submissions.every(s => s.status === 'COMPLETED') && (
                        <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                          ✓ All Completed
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Question Type Filter */}
              <div className="mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Filter by type:</span>
                  <div className="flex gap-2">
                    {(['all', 'mcq', 'cq', 'sq'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={questionTypeFilter === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setQuestionTypeFilter(type);
                          setCurrentQuestionIndex(0); // Reset to first question when filtering
                        }}
                        className="capitalize"
                      >
                        {type === 'all' ? 'All' : type.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {filteredQuestions.length} of {exam.questions.length} questions
                  </div>
                </div>
              </div>

              {/* Marks Summary */}
              {currentStudent && (
                <div className="mb-4">
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">Marks Summary</h3>
                        <div className="text-sm text-gray-600">
                          Total: {totalMarks} marks
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                        {/* MCQ Marks */}
                        <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">MCQ</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {(() => {
                                const dbMcqMarks = currentStudent.result?.mcqMarks;
                                const calculatedMcqMarks = exam.questions
                                  .filter(q => q.type === 'mcq')
                                  .reduce((total, q) => total + getMCQScore(q, currentStudent.answers[q.id]), 0);

                                console.log('🔍 MCQ Marks Debug:', {
                                  studentId: currentStudent.student.id,
                                  dbMcqMarks,
                                  calculatedMcqMarks,
                                  hasResult: !!currentStudent.result,
                                  finalValue: dbMcqMarks || calculatedMcqMarks
                                });

                                return dbMcqMarks || calculatedMcqMarks;
                              })()}
                            </div>
                            <div className="text-xs text-blue-600">
                              / {exam.questions.filter(q => q.type === 'mcq').reduce((total, q) => total + q.marks, 0)}
                            </div>
                          </div>
                        </div>

                        {/* CQ Marks */}
                        <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">CQ</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {currentStudent.result?.cqMarks ||
                                exam.questions
                                  .filter(q => q.type === 'cq')
                                  .reduce((total, q) => total + (currentStudent.answers[`${q.id}_marks`] || 0), 0)}
                            </div>
                            <div className="text-xs text-green-600">
                              / {exam.questions.filter(q => q.type === 'cq').reduce((total, q) => total + q.marks, 0)}
                            </div>
                          </div>
                        </div>

                        {/* SQ Marks */}
                        <div className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">SQ</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-600">
                              {currentStudent.result?.sqMarks ||
                                exam.questions
                                  .filter(q => q.type === 'sq')
                                  .reduce((total, q) => total + (currentStudent.answers[`${q.id}_marks`] || 0), 0)}
                            </div>
                            <div className="text-xs text-yellow-600">
                              / {exam.questions.filter(q => q.type === 'sq').reduce((total, q) => total + q.marks, 0)}
                            </div>
                          </div>
                        </div>

                        {/* Total Score */}
                        <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg border-2 border-purple-200">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-800">Total</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              {currentStudent.result?.total ||
                                (exam.questions
                                  .filter(q => q.type === 'mcq')
                                  .reduce((total, q) => total + getMCQScore(q, currentStudent.answers[q.id]), 0) +
                                  exam.questions
                                    .filter(q => q.type === 'cq')
                                    .reduce((total, q) => total + (currentStudent.answers[`${q.id}_marks`] || 0), 0) +
                                  exam.questions
                                    .filter(q => q.type === 'sq')
                                    .reduce((total, q) => total + (currentStudent.answers[`${q.id}_marks`] || 0), 0))}
                            </div>
                            <div className="text-xs text-purple-600">
                              / {totalMarks}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Question Navigation */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous Question
                    </Button>

                    <div className="text-sm text-gray-600">
                      Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(Math.min(filteredQuestions.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === filteredQuestions.length - 1}
                    >
                      Next Question
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>



              {filteredQuestions.length > 0 ? (
                currentStudent && (
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 h-full">
                    {/* Student Info - Compact Sidebar */}
                    <div className="xl:col-span-1">
                      <Card className="sticky top-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-4 w-4" />
                            Student Info
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <label className="text-xs font-medium text-gray-500">Name</label>
                              <div className="font-semibold truncate">{currentStudent.student.name}</div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Roll</label>
                              <div className="font-semibold">{currentStudent.student.roll}</div>
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs font-medium text-gray-500">Registration</label>
                              <div className="font-semibold text-xs">{currentStudent.student.registrationNo}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <Badge className={
                                currentStudent.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  currentStudent.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                              }>
                                {currentStudent.status}
                              </Badge>

                              {/* Mark Editing Status */}
                              <Badge className={
                                canEditMarks() ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }>
                                {canEditMarks() ? '✏️ Marks Editable' : '🔒 Marks Locked'}
                              </Badge>



                              {/* Review Request Indicator */}
                              {(() => {
                                const studentReview = reviewRequests.find(r => r.studentId === currentStudent.student.id);
                                if (studentReview) {
                                  return (
                                    <Badge className={
                                      studentReview.status === 'PENDING' ? 'bg-red-100 text-red-800' :
                                        studentReview.status === 'UNDER_REVIEW' ? 'bg-orange-100 text-orange-800' :
                                          studentReview.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                    }>
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Review {studentReview.status.replace('_', ' ')}
                                    </Badge>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Marks</div>
                              <div className="font-bold text-lg">
                                {currentStudent.earnedMarks} / {totalMarks}
                              </div>
                              {currentStudent.result && (
                                <div className="text-xs text-blue-600">
                                  MCQ: {currentStudent.result.mcqMarks || 0} | CQ: {currentStudent.result.cqMarks || 0} | SQ: {currentStudent.result.sqMarks || 0}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-600">Evaluator Notes</label>
                            <Textarea
                              value={currentStudent.evaluatorNotes || ''}
                              onChange={(e) => updateNotes(e.target.value)}
                              placeholder="Add notes about this student's performance..."
                              rows={4}
                              disabled={!canEditMarks()}
                            />

                            {/* Review Period Notice */}
                            {(() => {
                              const studentReview = reviewRequests.find(r => r.studentId === currentStudent.student.id);
                              if (studentReview) {
                                if (studentReview.status === 'UNDER_REVIEW') {
                                  return (
                                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                                      <div className="font-medium">⚠️ Review Period Active</div>
                                      <div>You can edit marks during review. Super admin must release results again after changes.</div>
                                    </div>
                                  );
                                } else if (studentReview.status === 'PENDING') {
                                  return (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                      <div className="font-medium">📝 Review Request Pending</div>
                                      <div>Student has requested a review. You can edit marks and respond to the request.</div>
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Question Evaluation */}
                    <div className="xl:col-span-3">
                      <Card className="h-full flex flex-col">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentQuestionIndex(Math.min(filteredQuestions.length - 1, currentQuestionIndex + 1))}
                                disabled={currentQuestionIndex === filteredQuestions.length - 1}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                          {currentQuestion && (
                            <div className="space-y-6">
                              {/* Question */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={
                                    currentQuestion.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                                      currentQuestion.type === 'cq' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                  }>
                                    {currentQuestion.type.toUpperCase()}
                                  </Badge>
                                  <div className="text-sm text-gray-600">
                                    {currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
                                  </div>
                                </div>
                                <div className="text-lg mb-4">
                                  <MathJax key={currentQuestion.id} dynamic>{currentQuestion.text}</MathJax>
                                </div>

                                {/* Subquestions */}
                                {currentQuestion.subQuestions && Array.isArray(currentQuestion.subQuestions) && currentQuestion.subQuestions.length > 0 && (
                                  <div className="mt-4 space-y-3">
                                    <h5 className="font-medium text-gray-700">Sub-questions:</h5>
                                    {currentQuestion.subQuestions.map((subQ: any, idx: number) => (
                                      <div key={idx} className="pl-4 border-l-2 border-gray-200">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-medium text-gray-600">
                                            (a{String.fromCharCode(97 + idx)}) {subQ.questionText || subQ.text || subQ.question || ''}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {subQ.marks || 1} mark{subQ.marks > 1 ? 's' : ''}
                                          </span>
                                        </div>
                                        {subQ.modelAnswer && (
                                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                            <strong>Model Answer:</strong> {subQ.modelAnswer}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Student Answer */}
                              <div>
                                <h4 className="font-semibold mb-2">Student Answer:</h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  {currentQuestion.type === 'mcq' ? (
                                    <div>
                                      {currentAnswer ? (
                                        <div className="flex items-center gap-2">
                                          {getMCQScore(currentQuestion, currentAnswer) > 0 ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                          ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                          )}
                                          <span className="text-lg"><MathJax inline>{currentAnswer}</MathJax></span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-500">No answer provided</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      {currentAnswer ? (
                                        <div className="space-y-4">

                                          {/* Text answer */}
                                          {typeof currentAnswer === 'string' && (
                                            <div className="whitespace-pre-wrap"><MathJax>{currentAnswer}</MathJax></div>
                                          )}

                                          {/* Image answers */}
                                          {Array.isArray(currentAnswer) && currentAnswer.length > 0 && (
                                            <div className="space-y-2">
                                              <h5 className="font-medium">Uploaded Images:</h5>

                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {currentAnswer.map((imgObj, idx) => {
                                                  // Handle both string URLs and object with preview
                                                  const imgSrc = typeof imgObj === 'string' ? imgObj : imgObj.preview || imgObj.url || imgObj.src;

                                                  // Check if it's a blob URL (which won't work)
                                                  const isBlobUrl = imgSrc && imgSrc.startsWith('blob:');

                                                  return (
                                                    <div key={idx} className="relative">
                                                      {isBlobUrl ? (
                                                        <div className="w-full h-40 bg-gray-100 rounded border flex items-center justify-center">
                                                          <div className="text-center text-gray-500">
                                                            <div className="text-xs">Image not available</div>
                                                            <div className="text-xs">(Blob URL expired)</div>
                                                          </div>
                                                        </div>
                                                      ) : (
                                                        <img
                                                          src={imgSrc}
                                                          alt={`Answer ${idx + 1}`}
                                                          className="w-full h-40 object-cover rounded border hover:scale-105 transition-transform cursor-pointer"
                                                          onError={(e) => {
                                                            console.error('Image failed to load:', imgSrc);
                                                            e.currentTarget.style.display = 'none';
                                                          }}
                                                        />
                                                      )}
                                                      {!isBlobUrl && (
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          className="absolute top-1 right-1"
                                                          onClick={() => {
                                                            setCurrentImage(imgSrc);
                                                            setCurrentImageIndex(idx);
                                                            setShowDrawingTool(true);
                                                          }}
                                                        >
                                                          <PenTool className="h-3 w-3" />
                                                        </Button>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-500">No answer provided</span>
                                      )}
                                    </div>
                                  )}

                                  {/* Explanation & Correct Answer */}
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    {/* MCQ Options Display */}
                                    {currentQuestion.type === 'mcq' && currentQuestion.options && (
                                      <div className="mb-4">
                                        <h5 className="font-semibold text-gray-700 mb-2">Options:</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {currentQuestion.options.map((opt: any, idx: number) => {
                                            const normalize = (s: string) => String(s).trim().toLowerCase();
                                            const optText = opt.text || String(opt);
                                            const isSelected = currentAnswer && normalize(currentAnswer) === normalize(optText);
                                            const isCorrect = opt.isCorrect;

                                            let bgClass = "bg-white border-gray-200";
                                            if (isCorrect) bgClass = "bg-green-50 border-green-300 ring-1 ring-green-300";
                                            if (isSelected && !isCorrect) bgClass = "bg-red-50 border-red-300 ring-1 ring-red-300";
                                            if (isSelected && isCorrect) bgClass = "bg-green-100 border-green-500 ring-2 ring-green-500";

                                            return (
                                              <div key={idx} className={`p-3 rounded border ${bgClass} flex flex-col gap-2`}>
                                                <div className="flex items-center justify-between w-full">
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-500 w-6">{String.fromCharCode(65 + idx)}.</span>
                                                    <span className={isCorrect ? "font-medium text-green-900" : isSelected ? "text-red-900" : ""}>
                                                      <MathJax inline dynamic>{optText}</MathJax>
                                                    </span>
                                                  </div>
                                                  {isCorrect && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                                  {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                                                </div>

                                                {/* Option Specific Explanation Removed as Redundant */}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Correct Answer (Non-MCQ or if options missing) */}
                                    {(currentQuestion.type !== 'mcq' || !currentQuestion.options) && (currentQuestion.modelAnswer || currentQuestion.correct) && (
                                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                                        <h5 className="font-semibold text-green-800 mb-1 flex items-center gap-2">
                                          <CheckCircle className="h-4 w-4" />
                                          Correct / Model Answer:
                                        </h5>
                                        <div className="text-green-900">
                                          <MathJax key={currentQuestion.id} dynamic>{currentQuestion.modelAnswer || String(currentQuestion.correct)}</MathJax>
                                        </div>
                                      </div>
                                    )}

                                    {/* Explanation */}
                                    {currentQuestion.explanation && (
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                        <h5 className="font-semibold text-blue-800 mb-1 flex items-center gap-2">
                                          <div className="bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold text-blue-800">i</div>
                                          Explanation:
                                        </h5>
                                        <div className="text-blue-900 text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                                          <MathJax key={currentQuestion.id} dynamic>
                                            {currentQuestion.explanation.replace(/^(\*\*Explanation:\*\*|Explanation:)\s*/i, '')}
                                          </MathJax>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Grading */}
                              <div>
                                <h4 className="font-semibold mb-2">Grading:</h4>
                                <div className="flex items-center gap-4">
                                  {currentQuestion.type === 'mcq' ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">Auto-graded:</span>
                                      <Badge className={
                                        getMCQScore(currentQuestion, currentAnswer) > 0
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }>
                                        {getMCQScore(currentQuestion, currentAnswer)} / {currentQuestion.marks}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Marks:</span>
                                        <Input
                                          type="number"
                                          min="0"
                                          max={currentQuestion.marks}
                                          value={currentStudent.answers[`${currentQuestion.id}_marks`] || 0}
                                          onChange={(e) => {
                                            updateMarks(currentQuestion.id, parseInt(e.target.value) || 0);
                                          }}
                                          className="w-20"
                                          disabled={!canEditMarks()}
                                        />
                                        <span className="text-sm text-gray-600">/ {currentQuestion.marks}</span>
                                        {canEditMarks() ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            ✏️ Editable
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                                            🔒 Read Only
                                          </Badge>
                                        )}
                                      </div>

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          if (Array.isArray(currentAnswer) && currentAnswer.length > 0) {
                                            const firstImg = currentAnswer[0];
                                            const imgSrc = typeof firstImg === 'string' ? firstImg : firstImg.preview || firstImg.url || firstImg.src;
                                            setCurrentImage(imgSrc);
                                            setCurrentImageIndex(0);
                                            setShowDrawingTool(true);
                                          }
                                        }}
                                        disabled={!canEditMarks()}
                                        title={
                                          !canEditMarks()
                                            ? "Cannot edit marks. Student evaluation is completed or no review request exists."
                                            : "Draw annotations on student's answer"
                                        }
                                      >
                                        <PenTool className="h-4 w-4 mr-2" />
                                        Draw on Answer
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {/* Review Period Mark Editing Notice */}
                                {(() => {
                                  const studentReview = reviewRequests.find(r => r.studentId === currentStudent.student.id);
                                  if (studentReview && (studentReview.status === 'PENDING' || studentReview.status === 'UNDER_REVIEW')) {
                                    return (
                                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                                        <div className="font-medium">✏️ Mark Editing Enabled</div>
                                        <div>You can edit marks during the review period. Changes will be saved automatically.</div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">No questions found in this exam</div>
                  <p className="text-gray-400 mt-2">
                    This exam doesn't contain any questions that can be evaluated.
                  </p>
                </div>
              )}

              {/* Enhanced Drawing Tool Dialog */}
              <Dialog open={showDrawingTool} onOpenChange={setShowDrawingTool}>
                <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                      <PenTool className="h-5 w-5" />
                      Enhanced Drawing Tool
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Enhanced Toolbar */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                      {/* Drawing Tools */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">Drawing Tools</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={drawingMode === 'pen' ? 'default' : 'outline'}
                            onClick={() => setDrawingMode('pen')}
                            className="flex-1"
                          >
                            <PenTool className="h-4 w-4 mr-1" />
                            Pen
                          </Button>
                          <Button
                            size="sm"
                            variant={drawingMode === 'highlighter' ? 'default' : 'outline'}
                            onClick={() => setDrawingMode('highlighter')}
                            className="flex-1"
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Highlight
                          </Button>
                          <Button
                            size="sm"
                            variant={drawingMode === 'eraser' ? 'default' : 'outline'}
                            onClick={() => setDrawingMode('eraser')}
                            className="flex-1"
                          >
                            <Eraser className="h-4 w-4 mr-1" />
                            Erase
                          </Button>
                        </div>
                      </div>

                      {/* Color Palette */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">Colors</h4>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={drawingColor}
                            onChange={(e) => setDrawingColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                            title="Choose color"
                          />
                          <div className="flex gap-1">
                            {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'].map((color) => (
                              <button
                                key={color}
                                onClick={() => setDrawingColor(color)}
                                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                title={`Select ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Brush Size */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">Brush Size</h4>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-xs font-mono w-8 text-center bg-gray-100 px-1 py-0.5 rounded">
                            {brushSize}
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <div
                            className="rounded-full bg-gray-800"
                            style={{
                              width: brushSize,
                              height: brushSize,
                              backgroundColor: drawingColor
                            }}
                          />
                        </div>
                      </div>

                      {/* Zoom Controls */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">Zoom & View</h4>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                            className="flex-1"
                          >
                            <ZoomOut className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-mono w-12 text-center bg-gray-100 px-2 py-1 rounded">
                            {Math.round(zoom * 100)}%
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                            className="flex-1"
                          >
                            <ZoomIn className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setZoom(1)}
                          className="w-full"
                        >
                          Reset Zoom
                        </Button>
                      </div>

                      {/* Image Navigation */}
                      {(() => {
                        const currentAnswer = currentStudent?.answers[currentQuestion?.id || ''];
                        const imageCount = Array.isArray(currentAnswer) ? currentAnswer.length : 0;

                        if (imageCount > 1) {
                          return (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-gray-700">Image Navigation</h4>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newIndex = Math.max(0, currentImageIndex - 1);
                                    setCurrentImageIndex(newIndex);
                                    const newImg = currentAnswer[newIndex];
                                    const newImgSrc = typeof newImg === 'string' ? newImg : newImg.preview || newImg.url || newImg.src;
                                    setCurrentImage(newImgSrc);
                                    // Clear canvas for new image
                                    setTimeout(() => {
                                      clearCanvas();
                                      initCanvas();
                                    }, 100);
                                  }}
                                  disabled={currentImageIndex === 0}
                                  className="flex-1"
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </Button>
                                <span className="text-xs font-mono w-12 text-center bg-gray-100 px-2 py-1 rounded">
                                  {currentImageIndex + 1}/{imageCount}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newIndex = Math.min(imageCount - 1, currentImageIndex + 1);
                                    setCurrentImageIndex(newIndex);
                                    const newImg = currentAnswer[newIndex];
                                    const newImgSrc = typeof newImg === 'string' ? newImg : newImg.preview || newImg.url || newImg.src;
                                    setCurrentImage(newImgSrc);
                                    // Clear canvas for new image
                                    setTimeout(() => {
                                      clearCanvas();
                                      initCanvas();
                                    }, 100);
                                  }}
                                  disabled={currentImageIndex === imageCount - 1}
                                  className="flex-1"
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs text-gray-600 text-center">
                                Image {currentImageIndex + 1} of {imageCount}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Enhanced Canvas Container */}
                    <div className="flex-1 relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 min-h-0">
                      <div className="relative overflow-auto h-full">
                        <img
                          ref={imageRef}
                          src={currentImage || ''}
                          alt="Student answer"
                          className="max-w-full h-auto"
                          onLoad={initCanvas}
                          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                        />
                        <canvas
                          ref={canvasRef}
                          className="absolute top-0 left-0 cursor-crosshair"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={() => setIsDrawing(false)}
                          onMouseLeave={() => setIsDrawing(false)}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            const touch = e.touches[0];
                            const mouseEvent = new MouseEvent('mousedown', {
                              clientX: touch.clientX,
                              clientY: touch.clientY
                            });
                            startDrawing(mouseEvent as any);
                          }}
                          onTouchMove={(e) => {
                            e.preventDefault();
                            if (isDrawing) {
                              const touch = e.touches[0];
                              const mouseEvent = new MouseEvent('mousemove', {
                                clientX: touch.clientX,
                                clientY: touch.clientY
                              });
                              draw(mouseEvent as any);
                            }
                          }}
                          onTouchEnd={() => setIsDrawing(false)}
                          style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            touchAction: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Enhanced Actions */}
                    <div className="flex-shrink-0 flex justify-between items-center p-3 bg-gray-50 border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={clearCanvas}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Clear All
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Undo functionality (placeholder)
                            console.log('Undo clicked');
                          }}
                          className="flex items-center gap-2"
                        >
                          <Undo className="h-4 w-4" />
                          Undo
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowDrawingTool(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveDrawing} className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Save Drawing
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Review Requests Modal */}
              <Dialog open={showReviewRequests} onOpenChange={setShowReviewRequests}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Student Review Requests
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {reviewRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No review requests found for this exam.
                      </div>
                    ) : (
                      reviewRequests.map((request) => (
                        <Card key={request.id} className="border-l-4 border-yellow-400">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">
                                  {request.student?.name} ({request.student?.roll})
                                </CardTitle>
                                <div className="text-sm text-gray-600">
                                  Requested on: {new Date(request.requestedAt).toLocaleString()}
                                </div>
                              </div>
                              <Badge className={
                                request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' :
                                    request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                      request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                              }>
                                {request.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Student's Comment:</h4>
                              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                {request.studentComment}
                              </div>
                            </div>

                            {request.evaluatorComment && (
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2">Evaluator's Response:</h4>
                                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                                  {request.evaluatorComment}
                                </div>
                              </div>
                            )}

                            {request.status === 'PENDING' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to student's evaluation
                                    const studentIndex = exam?.submissions.findIndex(s => s.student.id === request.studentId);
                                    if (studentIndex !== undefined && studentIndex >= 0) {
                                      setCurrentStudentIndex(studentIndex);
                                      setShowReviewRequests(false);
                                      // Fetch the specific student's data
                                      fetchExamData(request.studentId);
                                    }
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Review & Edit Marks
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReview(request);
                                    setShowResponseDialog(true);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Respond
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => respondToReview(request.id, "Review approved after mark adjustment.", 'APPROVED')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => respondToReview(request.id, "Review request rejected. Original marks maintained.", 'REJECTED')}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {request.status === 'UNDER_REVIEW' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to student's evaluation for mark editing
                                    const studentIndex = exam?.submissions.findIndex(s => s.student.id === request.studentId);
                                    if (studentIndex !== undefined && studentIndex >= 0) {
                                      setCurrentStudentIndex(studentIndex);
                                      setShowReviewRequests(false);
                                      fetchExamData(request.studentId);
                                    }
                                  }}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  <PenTool className="h-4 w-4 mr-2" />
                                  Edit Marks
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => respondToReview(request.id, "Review approved after mark adjustment.", 'APPROVED')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => respondToReview(request.id, "Review request rejected. Original marks maintained.", 'REJECTED')}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Review Response Dialog */}
              <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Respond to Review Request
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {selectedReview && (
                      <>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Student's Request:</h4>
                          <div className="text-sm text-gray-600">
                            {selectedReview.studentComment}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Requested by: {selectedReview.student?.name} ({selectedReview.student?.roll})
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Your Response:
                          </label>
                          <Textarea
                            value={reviewResponse}
                            onChange={(e) => setReviewResponse(e.target.value)}
                            placeholder="Provide your response to the student's review request..."
                            rows={4}
                          />
                          <div className="text-xs text-gray-500 mt-2 space-y-1">
                            <p>• <strong>Approve:</strong> Will automatically submit the student's evaluation with any mark changes you've made</p>
                            <p>• <strong>Reject:</strong> Will keep the original marks unchanged</p>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowResponseDialog(false);
                              setSelectedReview(null);
                              setReviewResponse('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => respondToReview(selectedReview.id, reviewResponse, 'APPROVED')}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!reviewResponse.trim()}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Submit Student
                          </Button>
                          <Button
                            onClick={() => respondToReview(selectedReview.id, reviewResponse, 'REJECTED')}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={!reviewResponse.trim()}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject & Keep Marks
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MathJaxContext>
  );
}
