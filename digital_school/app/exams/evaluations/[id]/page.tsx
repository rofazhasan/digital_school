"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Printer,
  Menu,
  Loader2,
  AlertCircle,
  FileSearch
} from "lucide-react";
import { toast } from "sonner";
import { MathJaxContext } from "better-react-mathjax";
import { cleanupMath, renderDynamicExplanation } from "@/lib/utils";
import DrawingCanvas from "@/app/components/DrawingCanvas";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { toBengaliNumerals } from "@/utils/numeralConverter";
import { triggerHaptic, ImpactStyle, triggerGradingHaptic } from "@/lib/haptics";
import { verifyAdminAction } from "@/lib/native/auth";
import { Capacitor } from "@capacitor/core";
import { ShieldCheck, Battery, Wifi, Scan } from "lucide-react";
import { scanDocument } from "@/lib/native/scanner";


const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const BENGALI_SUB_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ'];

const normalize = (val: any) => String(val || "").trim().toLowerCase();

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
  batteryLevel?: number;
  isOnline?: boolean;
  isFocus?: boolean;
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
  type: 'mcq' | 'cq' | 'sq' | 'mc' | 'ar' | 'mtf' | 'int' | 'numeric' | 'descriptive';
  text: string;
  marks: number;
  correct?: any;
  options?: any[];
  explanation?: string;
  subQuestions?: any[];
  sub_questions?: any[];
  modelAnswer?: string;
  assertion?: string;
  reason?: string;
  questionText?: string;
  correctOption?: number;
  pairs?: any[];
  leftColumn?: any[];
  rightColumn?: any[];
}

interface Exam {
  id: string;
  name: string;
  description: string;
  totalMarks: number;
  mcqNegativeMarking?: number;
  questions: Question[];
  submissions: StudentSubmission[];
}

const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
  }
};

export default function ExamEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Mount tracking
  useEffect(() => {
    window.addEventListener("error", (e) => {
      console.error("[EvaluationPage] Window Error:", e.message);
    });
  }, [id]);

  // Global catch for state initialization errors -- MOVED BELOW HOOKS

  // Tabs State
  const [activeTab, setActiveTab] = useState("evaluation");

  // Live Monitor State
  const [liveStats, setLiveStats] = useState<LiveExamStats | null>(null);
  const [selectedLiveStudent, setSelectedLiveStudent] = useState<LiveStudent | null>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  // Monitor View State
  const [monitorSearch, setMonitorSearch] = useState("");
  const [monitorFilter, setMonitorFilter] = useState<'all' | 'active' | 'submitted'>('all');
  const [monitorSort, setMonitorSort] = useState<'progress' | 'score' | 'time'>('progress');
  const [monitorViewMode, setMonitorViewMode] = useState<'grid' | 'list'>('grid');

  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const handleStudentChange = (idx: number) => {
    setCurrentStudentIndex(idx);
    triggerHaptic(ImpactStyle.Light);
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const handleQuestionChange = (idx: number) => {
    setCurrentQuestionIndex(idx);
    triggerHaptic(ImpactStyle.Light);
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'all' | 'mcq' | 'mc' | 'ar' | 'mtf' | 'int' | 'cq' | 'sq' | 'descriptive'>('all');
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

  // Annotation State
  const [isAnnotationOpen, setIsAnnotationOpen] = useState(false);
  const [activeAnnotationImage, setActiveAnnotationImage] = useState<string | null>(null);
  const [activeAnnotationOriginal, setActiveAnnotationOriginal] = useState<string | null>(null);
  const [activeAnnotationMeta, setActiveAnnotationMeta] = useState<{ questionId: string; index: number; studentId: string } | null>(null);
  const [annotationTarget, setAnnotationTarget] = useState<{ imageUrl: string; questionId: string; index: number; studentId: string } | null>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

  // Store all annotations for the current student: key = "questionId_imageIndex", value = annotated image URL
  const [annotations, setAnnotations] = useState<Record<string, string>>({});

  const openAnnotation = (imageUrl: string, questionId: string, index: number = 0, studentId: string) => {
    // Check if there is an existing annotation for this image
    const key = `${questionId}_${index}`;
    const annotationUrl = annotations[key] || imageUrl;

    // Use annotated image as background if available, otherwise original
    setActiveAnnotationImage(annotationUrl);
    // Store the true original image URL for reference when saving
    setActiveAnnotationOriginal(imageUrl);

    // Important: We still want to track which question/index this belongs to
    setActiveAnnotationMeta({ questionId, index, studentId });
    setIsAnnotationOpen(true);
  };

  const handleScan = async (questionId: string, pIdx?: number) => {
    if (!Capacitor.isNativePlatform()) {
      toast.error("Document scanner is only available on native Android.");
      return;
    }

    const currentStudent = exam?.submissions[currentStudentIndex];
    if (!currentStudent?.student?.id) {
      toast.error("Cannot scan: No student selected or student ID missing.");
      return;
    }

    try {
      const scanResult = await scanDocument();
      if (scanResult) {
        toast.success("Document scanned successfully! Starting upload...");

        // Convert file path to blob for upload
        const response = await fetch(Capacitor.convertFileSrc(scanResult));
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('file', blob, 'scanned_script.jpg');

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const { url } = await uploadRes.json();

        // Save scanned script as an annotation or answer?
        // Let's save it as an annotation for consistency with current flow
        const saveRes = await fetch(`/api/exams/evaluations/${id}/drawing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: currentStudent?.student?.id,
            questionId,
            imageIndex: pIdx ?? 0,
            originalImagePath: url, // The scanned image is the "original" for this annotation
            imageData: url // And also the annotated image initially
          })
        });

        if (saveRes.ok) {
          toast.success("Scanned script uploaded and linked!");
          fetchAnnotations(currentStudent?.student?.id || '');
        } else {
          throw new Error("Failed to save scanned script record.");
        }
      } else {
        toast.info("No document was scanned.");
      }
    } catch (error) {
      console.error("Scan failed:", error);
      toast.error("Failed to scan document");
    }
  };

  const handleSaveAnnotation = async (blob: Blob) => {
    // const currentStudent = exam?.submissions[currentStudentIndex]; -- Removed dependency on current index
    if (!activeAnnotationImage || !activeAnnotationMeta) return;

    if (!activeAnnotationMeta.studentId) {
      toast.error("Critical Error: Missing student ID. Annotation cannot be saved.");
      console.error("Missing studentId in annotation meta:", activeAnnotationMeta);
      return;
    }

    const formData = new FormData();
    formData.append('file', blob, 'annotation.jpg');

    try {
      // 1. Upload image
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // 2. Save record to DB
      const saveRes = await fetch(`/api/exams/evaluations/${id}/drawing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: activeAnnotationMeta.studentId, // Use from meta
          questionId: activeAnnotationMeta.questionId,
          imageIndex: activeAnnotationMeta.index,
          originalImagePath: activeAnnotationOriginal || activeAnnotationImage, // Use true original if available
          imageData: url
        })
      });

      if (!saveRes.ok) throw new Error("Failed to save record");

      // Update local state instead of reloading
      const key = `${activeAnnotationMeta.questionId}_${activeAnnotationMeta.index}`;
      setAnnotations(prev => ({
        ...prev,
        [key]: url
      }));

      setAnnotations(prev => ({
        ...prev,
        [key]: url
      }));

      triggerHaptic(ImpactStyle.Medium);
      toast.success("Annotation saved!");

      setIsAnnotationOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save annotation");
    }
  };

  // Fetch all annotations for the current student
  const fetchAnnotations = async (studentId: string) => {
    try {
      const response = await fetch(
        `/api/exams/evaluations/${id}/get-drawing?studentId=${studentId}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        // data.drawings is an array of { questionId, imageIndex, imageData }
        const annotationMap: Record<string, string> = {};

        if (data.drawings && Array.isArray(data.drawings)) {
          data.drawings.forEach((drawing: any) => {
            const key = `${drawing.questionId}_${drawing.imageIndex}`;
            annotationMap[key] = drawing.imageData;
          });
        }

        setAnnotations(annotationMap);
      }
    } catch (error) {
      console.error('Error fetching annotations:', error);
    }
  };

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
    if (!liveStats) return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
        <p>Connecting to live exam feed...</p>
      </div>
    );

    const { liveData, activeStudents, submittedStudents, totalStudents } = liveStats;

    // Filter and Sort Logic
    let filteredData = (liveData || [])?.filter(student => {
      const matchesSearch = student?.studentName?.toLowerCase()?.includes(monitorSearch?.toLowerCase()) ||
        student?.roll?.includes(monitorSearch);
      const matchesFilter = monitorFilter === 'all'
        ? true
        : monitorFilter === 'active'
          ? student?.status === 'IN_PROGRESS'
          : student?.status === 'COMPLETED'; // API now returns COMPLETED for evaluated students
      return matchesSearch && matchesFilter;
    });

    filteredData = (filteredData || [])?.sort((a, b) => {
      if (monitorSort === 'progress') return (b?.progress || 0) - (a?.progress || 0);
      if (monitorSort === 'score') return (b?.score || 0) - (a?.score || 0);
      if (monitorSort === 'time') return new Date(b?.lastActive || 0).getTime() - new Date(a?.lastActive || 0).getTime();
      return 0;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Modern Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-none shadow-md shadow-primary/5 hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Evaluation</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-blue-600">{activeStudents}</p>
                  <span className="text-xs text-blue-400 font-medium">students</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-none shadow-md shadow-primary/5 hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Evaluated</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-600">{submittedStudents}</p>
                  <span className="text-xs text-green-400 font-medium">completed</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-none shadow-md shadow-primary/5 hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-purple-600">
                    {totalStudents > 0 ? Math.round((submittedStudents / totalStudents) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Candidates</p>
                <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* ... Search ... */}
            <div className="relative w-full md:w-64">
              <Input
                placeholder="Search student..."
                value={monitorSearch}
                onChange={(e) => setMonitorSearch(e.target.value)}
                className="pl-9 h-10 bg-muted/50 border-border focus:bg-card transition-colors"
              />
              <ZoomIn className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            </div>

            <Select value={monitorFilter} onValueChange={(v: any) => setMonitorFilter(v)}>
              <SelectTrigger className="w-[140px] h-10 bg-muted/50 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Now</SelectItem>
                <SelectItem value="submitted">Evaluated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monitorSort} onValueChange={(v: any) => setMonitorSort(v)}>
              <SelectTrigger className="w-[140px] h-10 bg-muted/50 border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="time">Recent Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="bg-muted p-1 rounded-lg flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${monitorViewMode === 'grid' ? 'bg-card shadow text-primary font-bold' : 'text-muted-foreground'}`}
                onClick={() => setMonitorViewMode('grid')}
              >
                <LayoutDashboard className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${monitorViewMode === 'list' ? 'bg-card shadow text-primary font-bold' : 'text-muted-foreground'}`}
                onClick={() => setMonitorViewMode('list')}
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLiveStats} className="h-10 border-blue-200 text-blue-700 hover:bg-blue-50">
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {
          monitorViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredData.map(student => (
                <Card
                  key={student?.id}
                  className={`cursor-pointer group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
                  ${student?.status === 'IN_PROGRESS'
                      ? 'border-l-4 border-l-blue-500'
                      : 'border-l-4 border-l-green-500 bg-green-50/10'}`}
                  onClick={() => {
                    setSelectedLiveStudent(student);
                    setIsLiveModalOpen(true);
                  }}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0
                            ${student?.status === 'IN_PROGRESS'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                          {student?.studentName?.substring(0, 2)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{student?.studentName}</p>
                          <p className="text-xs text-muted-foreground font-mono">Roll: {student?.roll}</p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full shadow-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shrink-0"
                        title="Open Review Session"
                        onClick={(e) => {
                          e.stopPropagation();
                          const questions = liveStats?.defaultQuestions || [];
                          if (!questions.length) return toast.error("No questions found");

                          const sessionData = (questions || [])?.map((q: any) => {
                            const ans = student?.answers ? student?.answers?.[q?.id] : null;
                            let status: 'correct' | 'wrong' | 'unanswered' = 'unanswered';
                            let userIdx = null;

                            if (ans !== undefined && ans !== null) {
                              const correctOpt = q?.options?.find((o: any) => o?.isCorrect);
                              const isCorrect = correctOpt && (
                                (typeof ans === 'number' && q?.options?.[ans]?.text === correctOpt?.text) ||
                                (ans === correctOpt?.text)
                              );
                              status = isCorrect ? 'correct' : 'wrong';
                              if ((q?.type || "").toUpperCase() === 'MCQ' && q?.options) {
                                userIdx = typeof ans === 'number' ? ans : (q?.options?.findIndex((o: any) => o?.text === ans) ?? -1);
                              }
                            }
                            return { ...q, status, userAnswer: userIdx };
                          });

                          const sessionPayload = {
                            questions: sessionData,
                            examName: liveStats?.examName || "Review Session"
                          };
                          localStorage.setItem("review-session-data", JSON.stringify(sessionPayload));
                          toast.success("Opening Review Session...");
                          window.open('/problem-solving/session?mode=review', '_blank');
                        }}
                      >
                        <MonitorPlay className="w-4 h-4 ml-0.5" />
                      </Button>
                    </div>

                    {/* Stats Grid inside Card */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/50 p-2 rounded border border-border">
                        <span className="text-muted-foreground block mb-1">Answered</span>
                        <span className="font-semibold">{student?.answered} / {student?.totalQuestions}</span>
                      </div>
                      <div className="bg-muted/50 p-2 rounded border border-border">
                        <span className="text-muted-foreground block mb-1">Score</span>
                        <span className="font-semibold text-primary">{student?.score}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span className={student?.progress === 100 ? "text-green-600" : "text-blue-600"}>{student?.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end
                           ${student?.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`}
                          style={{ width: `${student?.progress}%` }}
                        >
                          {/* Shimmer effect */}
                          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex justify-between items-center text-[11px]">
                      <Badge variant="outline" className={`border-none ${student?.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'}`}>
                        {student?.status === 'IN_PROGRESS' ? '● Pending' : '✓ Evaluated'}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <Wifi className={`w-3 h-3 ${student?.isOnline !== false ? 'text-emerald-500' : 'text-rose-500'}`} />
                        <Battery className={`w-3 h-3 ${(student?.batteryLevel ?? 100) > 20 ? 'text-emerald-500' : 'text-rose-500'}`} />
                        <ShieldCheck className={`w-3 h-3 ${student?.isFocus !== false ? 'text-blue-500' : 'text-amber-500'}`} />
                      </div>

                      <span className="text-muted-foreground font-medium">
                        {new Date(student?.lastActive || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider divide-border/50">
                <div className="col-span-4">Student</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-3">Progress</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-1">Action</div>
              </div>
              <div className="divide-y divide-border/50">
                {filteredData.map(student => (
                  <div key={student?.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                           ${student?.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`}>
                        {student?.studentName?.substring(0, 2)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{student?.studentName}</p>
                        <p className="text-xs text-muted-foreground">Roll: {student?.roll} • {student?.className}</p>
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <Badge variant="secondary" className={`${student?.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {student?.status === 'IN_PROGRESS' ? 'Pending' : 'Evaluated'}
                      </Badge>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${student?.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${student?.progress}%` }} />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{student?.progress}%</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-sm font-medium">
                      {student?.score}
                    </div>
                    <div className="col-span-1 flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                        title="Open Review Session"
                        onClick={(e) => {
                          e.stopPropagation();
                          const questions = liveStats?.defaultQuestions || [];
                          if (!questions.length) return toast.error("No questions found");

                          const sessionData = (questions || [])?.map((q: any) => {
                            const ans = student?.answers ? student?.answers?.[q?.id] : null;
                            let status: 'correct' | 'wrong' | 'unanswered' = 'unanswered';
                            let userIdx = null;

                            if (ans !== undefined && ans !== null) {
                              const correctOpt = q?.options?.find((o: any) => o?.isCorrect);
                              const isCorrect = correctOpt && (
                                (typeof ans === 'number' && q?.options?.[ans]?.text === correctOpt?.text) ||
                                (ans === correctOpt?.text)
                              );
                              status = isCorrect ? 'correct' : 'wrong';

                              if ((q?.type || "").toUpperCase() === 'MCQ' && q?.options) {
                                userIdx = typeof ans === 'number' ? ans : (q?.options?.findIndex((o: any) => o?.text === ans) ?? -1);
                              }
                            }
                            return { ...q, status, userAnswer: userIdx };
                          });
                          const sessionPayload = {
                            questions: sessionData,
                            examName: liveStats?.examName || "Review Session"
                          };
                          localStorage.setItem("review-session-data", JSON.stringify(sessionPayload));
                          window.open('/problem-solving/session?mode=review', '_blank');
                        }}
                      >
                        <MonitorPlay className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedLiveStudent(student); setIsLiveModalOpen(true); }} className="h-8 w-8 p-0">
                        <Maximize2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }


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
                  <p className="text-xs text-muted-foreground">Current Score</p>
                  <p className="text-xl font-bold text-primary">{selectedLiveStudent?.score} / {selectedLiveStudent?.maxScore}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold">{selectedLiveStudent?.progress}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Answered</p>
                  <p className="text-xl font-bold">{selectedLiveStudent?.answered} / {selectedLiveStudent?.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge>{selectedLiveStudent?.status}</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Question Analysis</h4>
                {selectedLiveStudent && liveStats?.questionsBySet && liveStats.defaultQuestions && (() => {
                  const relevantQuestions = liveStats.defaultQuestions;

                  return (relevantQuestions || [])?.map((q: any, idx: number) => {
                    const ans = selectedLiveStudent.answers[q.id];
                    const hasAnswer = ans !== undefined && ans !== null && ans !== "";

                    return (
                      <Card key={q.id} className={`border ${hasAnswer ? 'border-primary/20 bg-primary/5' : 'border-border'}`}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div className="flex-grow space-y-2">
                              <div className="prose prose-sm max-w-none">
                                <UniversalMathJax inline dynamic key={`q-text-${q.id}`}>{cleanupMath(q.text)}</UniversalMathJax>
                              </div>

                              {hasAnswer ? (
                                <div className="mt-3 p-3 bg-card rounded border border-border">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Student Answer:</p>
                                  <div className="text-sm font-medium text-blue-800">
                                    <UniversalMathJax inline dynamic key={`ans-${q.id}-${ans}`}>{cleanupMath(String(ans))}</UniversalMathJax>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2 text-xs text-muted-foreground/60 italic">Not answered yet</div>
                              )}

                              {/* Show options if MCQ */}
                              {q?.type === 'mcq' && q?.options && <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {(q?.options || [])?.map((opt: any, i: number) => {
                                  const isSelected = hasAnswer && String(ans) === (opt?.text || String(opt));
                                  const isCorrect = opt?.isCorrect;
                                  return (
                                    <div key={i} className={`text-xs p-2 rounded border ${isSelected ? 'bg-blue-100 border-blue-300' :
                                      isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-muted/50'
                                      }`}>
                                      <div className="flex items-start">
                                        <span className="font-bold mr-2">{MCQ_LABELS?.[i]}.</span>
                                        <div className="flex-1">
                                          <UniversalMathJax inline dynamic key={`opt-${i}`}>{cleanupMath(opt?.text || String(opt))}</UniversalMathJax>
                                          {opt?.image && (
                                            <div className="mt-1">
                                              <img src={opt?.image} alt="Option" className="max-h-20 rounded border bg-white object-contain" />
                                            </div>
                                          )}
                                        </div>
                                        {isCorrect && <CheckCircle className="inline w-3 h-3 ml-2 text-green-600 flex-shrink-0" />}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="text-xs font-bold text-gray-500">{q?.marks} Marks</span>
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
        if (targetStudentId && exam && data.submissions && data.submissions.length > 0) {
          // Merge logic: Update only the specific student in the existing list
          setExam(prevExam => {
            if (!prevExam) return data;

            const updatedSubmissions = [...(prevExam?.submissions || [])];
            const studentIndex = (updatedSubmissions?.findIndex(s => s?.student?.id === targetStudentId) ?? -1);

            if (studentIndex !== -1 && updatedSubmissions?.[studentIndex]) {
              const newSubmission = data?.submissions?.[0];
              const existingSubmission = updatedSubmissions[studentIndex];

              // Defensive guard: if the new fetch returned 0 marks but the existing data
              // has valid marks, preserve the existing result to avoid wiping out correct marks.
              const shouldPreserveOldResult =
                (newSubmission?.result?.total === 0 || newSubmission?.result?.total == null) &&
                (existingSubmission?.result?.total ?? 0) > 0;

              updatedSubmissions[studentIndex] = shouldPreserveOldResult
                ? { ...newSubmission, result: existingSubmission?.result }
                : newSubmission;

              return {
                ...prevExam,
                // DO NOT overwrite prevExam.questions here — the full questions list must be preserved.
                submissions: updatedSubmissions
              };
            }
            return data; // Fallback if student not found (shouldn't happen)
          });
        } else {
          // Initial load or full refresh
          setExam(data);
        }
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

  const releaseResults = async () => {
    if (!exam) return;

    // 1. NATIVE BIOMETRIC SECURITY GATE
    const confirmed = await verifyAdminAction("Release Exam Results");
    if (!confirmed) return;

    // 2. Check if there are any pending review requests
    const pendingReviews = reviewRequests.filter(r => r?.status === 'PENDING' || r?.status === 'UNDER_REVIEW');
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
        toast.success("Results released successfully!");
        fetchExamData(); // Refresh data to show updated status
        fetchReviewRequests(); // Refresh review requests
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to release results");
      }
    } catch (error) {
      console.error("Error releasing results:", error);
      toast.error("Failed to release results");
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
        const newReviews = data.reviewRequests?.filter((r: any) => r?.status === 'PENDING') || [];

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

  // Get filtered questions based on type (Case-insensitive)
  const filteredQuestions = exam?.questions?.filter(q =>
    questionTypeFilter === 'all' || q?.type?.toLowerCase() === questionTypeFilter.toLowerCase()
  ) || [];



  const currentStudent = exam?.submissions?.[currentStudentIndex];
  const currentQuestion = filteredQuestions?.[currentQuestionIndex];

  // Ensure currentQuestionIndex is always valid when filteredQuestions changes
  useEffect(() => {
    if ((filteredQuestions?.length || 0) > 0 && currentQuestionIndex >= (filteredQuestions?.length || 0)) {
      setCurrentQuestionIndex((filteredQuestions?.length || 0) - 1);
    }
  }, [filteredQuestions?.length, currentQuestionIndex]);

  // Fetch annotations when student changes
  useEffect(() => {
    if (currentStudent?.student?.id) {
      fetchAnnotations(currentStudent?.student?.id);
    }
  }, [currentStudent?.student?.id]);

  // Keyboard navigation for questions (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore navigation if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowRight') {
        if (currentQuestionIndex < (filteredQuestions?.length || 0) - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, filteredQuestions?.length]);

  // Helper function to get the correct image URL (annotated if exists, original otherwise)
  const getImageUrl = (originalUrl: string, questionId: string, imageIndex: number) => {
    const key = `${questionId}_${imageIndex}`;
    return annotations[key] || originalUrl;
  };

  // Use exam's total marks from the database
  const totalMarks = exam?.totalMarks || 0;

  // Try to get answer with different possible formats
  let currentAnswer = currentStudent?.answers?.[currentQuestion?.id || ''];
  if (!currentAnswer && currentQuestion?.id) {
    // Try with _images suffix
    currentAnswer = currentStudent?.answers?.[`${currentQuestion?.id}_images`];
  }

  const getAutoScore = (question: Question, answer: any) => {
    if (!answer) return 0;
    const type = (question?.type || '').toLowerCase();

    try {
      if (type === 'mcq') {
        const userAnswer = answer;
        let isCorrect = false;
        // Robust check for option-based correct flag
        if (question?.options && Array.isArray(question?.options)) {
          const correctOptIndex = (question?.options?.findIndex((opt: any) => opt?.isCorrect) ?? -1);
          if (correctOptIndex !== -1 && question?.options?.[correctOptIndex]) {
            const correctOpt = question?.options?.[correctOptIndex];
            if (userAnswer === correctOpt?.text || userAnswer === correctOpt?.value || (typeof userAnswer === 'number' && userAnswer === correctOptIndex)) {
              isCorrect = true;
            }
          }
        }
        // Fallback to simple correct answer check
        if (!isCorrect) {
          const correctAnswer = question?.correct;
          if (correctAnswer !== undefined) {
            isCorrect = String(userAnswer || "").trim() === String(correctAnswer || "").trim();
          }
        }
        if (isCorrect) return question?.marks || 0;
        // Apply negative marking for wrong MCQ answers
        const negPct = exam?.mcqNegativeMarking;
        if (negPct && negPct > 0) return -((question?.marks || 0) * negPct) / 100;
        return 0;
      }

      if (type === 'mc') {
        const selected = answer?.selectedOptions || [];
        const corrects = question?.options?.map((o, i) => o?.isCorrect ? i : -1)?.filter(i => i !== -1) || [];
        if (selected?.length === corrects?.length && selected?.every((v: number) => corrects?.includes(v))) return question?.marks || 0;
        // Apply negative marking for wrong MC answers
        const negPct = exam?.mcqNegativeMarking;
        if (negPct && negPct > 0 && selected?.length > 0) return -((question?.marks || 0) * negPct) / 100;
        return 0;
      }

      if (type === 'ar') {
        const selected = Number(answer?.selectedOption);
        const correct = Number(question?.correct || (question as any)?.correctOption || 0);
        if (selected === correct) return question?.marks || 0;
        // Apply negative marking for wrong AR answers
        const negPct = exam?.mcqNegativeMarking;
        if (negPct && negPct > 0) return -((question?.marks || 0) * negPct) / 100;
        return 0;
      }

      if (type === 'int' || type === 'numeric') {
        const studentVal = Number(answer?.answer);
        const correctVal = Number(question?.correct || (question as any)?.answer || 0);
        // Use epsilon for float comparison if needed, currently strict equality
        return !isNaN(studentVal) && !isNaN(correctVal) && studentVal === correctVal ? (question?.marks || 0) : 0;
      }

      if (type === 'mtf') {
        let score = 0;
        const totalPairs = (question as any).leftColumn?.length || (question as any).pairs?.length || 0;
        if (totalPairs === 0) return 0;
        const marksPerPair = (question?.marks || 0) / totalPairs;

        const stdMatches = answer || {};

        // Strategy 1: Check Object-based matches (New Schema: { leftId: rightId })
        // We iterate over the LEFT column and check if the student's mapped value is correct
        if ((question as any)?.leftColumn && (question as any)?.rightColumn && !Array.isArray(stdMatches?.matches)) {
          (question as any)?.leftColumn?.forEach((leftItem: any) => {
            const studentRightId = stdMatches?.[leftItem?.id];
            const correctRightId = (question as any)?.correctMatches?.[leftItem?.id];

            if (studentRightId && correctRightId && studentRightId === correctRightId) {
              score += marksPerPair;
            }
          });
          return Math.floor(score); // Return floor to avoid partial decimals if preferred, or generic rounding
        }

        // Strategy 2: Legacy Array-based matches
        const matches = stdMatches?.matches || [];
        const pairs = (question as any)?.pairs || [];
        if (pairs?.length > 0) {
          matches?.forEach((m: any) => {
            if (pairs?.[m?.leftIndex]?.right === pairs?.[m?.rightIndex]?.right) {
              score += marksPerPair;
            }
          });
          return Math.floor(score);
        }
      }
    } catch (e) {
      console.error("Error in getAutoScore:", e);
      return 0;
    }

    return 0;
  };

  // Check if evaluator can edit marks for current student
  const canEditMarks = () => {
    if (!currentStudent) return false;

    // Super users can always edit marks
    if (isSuperUser) return true;

    // Check if student has a review request
    const studentReview = reviewRequests.find(r => r.studentId === currentStudent?.student?.id);
    const hasReviewRequest = studentReview && (studentReview.status === 'PENDING' || studentReview.status === 'UNDER_REVIEW');

    // For evaluators, can edit marks only when:
    // 1. Status is PENDING or IN_PROGRESS, OR
    // 2. There's a review request (PENDING or UNDER_REVIEW)
    if (currentStudent?.status === 'COMPLETED') {
      // If completed, only allow editing if there's a review request
      return hasReviewRequest;
    }

    // For PENDING or IN_PROGRESS status, always allow editing
    return currentStudent?.status === 'PENDING' || currentStudent?.status === 'IN_PROGRESS';
  };

  // Check if student evaluation can be submitted
  const canSubmitStudent = () => {
    if (!currentStudent) return false;

    // Super users can always submit
    if (isSuperUser) return true;

    // Evaluators can submit if status is not COMPLETED
    return currentStudent?.status !== 'COMPLETED';
  };

  // Check if all evaluations can be submitted
  const canSubmitAll = () => {
    if (!exam) return false;

    // Super users can always submit all
    if (isSuperUser) return true;

    // Evaluators can submit all if any student is not completed
    return exam?.submissions?.some(submission => submission?.status !== 'COMPLETED');
  };

  const updateMarks = async (questionId: string, marks: number, subIndex?: number) => {
    if (!currentStudent || !currentQuestion) return;

    // Check if evaluator can edit marks
    if (!canEditMarks()) {
      toast.error("Cannot edit marks. Student evaluation is already submitted or no review request exists.");
      return;
    }

    const targetQuestion = exam?.questions?.find(q => q.id === questionId);
    const maxMarks = subIndex !== undefined && targetQuestion?.subQuestions?.[subIndex]
      ? targetQuestion.subQuestions[subIndex].marks
      : targetQuestion?.marks || 0;

    if (marks > maxMarks) {
      toast.error(`Cannot give more than ${maxMarks} marks`);
      return;
    }

    const marksKey = subIndex !== undefined ? `${questionId}_sub_${subIndex}_marks` : `${questionId}_marks`;

    // OPTIMISTIC UPDATE: Update UI immediately for instant feedback
    const previousMarks = currentStudent?.answers?.[marksKey] || 0;

    if (exam && currentStudent) {
      const studentIndex = (exam?.submissions?.findIndex(s => s?.student?.id === currentStudent?.student?.id) ?? -1);
      if (studentIndex !== -1) {
        const updatedSubmissions = [...(exam?.submissions || [])];
        if (updatedSubmissions?.[studentIndex]) {
          updatedSubmissions[studentIndex] = {
            ...updatedSubmissions[studentIndex],
            answers: {
              ...updatedSubmissions[studentIndex]?.answers,
              [marksKey]: marks
            }
          };
          setExam({ ...exam, submissions: updatedSubmissions });
        }
      }
    }

    try {
      const response = await fetch(`/api/exams/evaluations/${id}/grade`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudent?.student?.id,
          questionId,
          marks: marksKey.endsWith('_marks') ? marks : marks, // Logic for backend to handle subMarks
          subIndex, // Pass subIndex to backend if needed, though updatedAnswers already contains it
          notes: currentStudent?.evaluatorNotes || ''
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        if (exam && currentStudent) {
          const studentIndex = (exam?.submissions?.findIndex(s => s?.student?.id === currentStudent?.student?.id) ?? -1);
          if (studentIndex !== -1) {
            const revertedSubmissions = [...(exam?.submissions || [])];
            if (revertedSubmissions?.[studentIndex]) {
              revertedSubmissions[studentIndex] = {
                ...revertedSubmissions[studentIndex],
                answers: {
                  ...revertedSubmissions[studentIndex]?.answers,
                  [marksKey]: previousMarks
                }
              };
              setExam({ ...exam, submissions: revertedSubmissions });
            }
          }
        }
        toast.error("Failed to update marks. Please try again.");
        return;
      }

      // Success - no toast to avoid delays, UI already updated optimistically
      if (marks === maxMarks) {
        triggerGradingHaptic('CORRECT');
      } else if (marks === 0) {
        triggerGradingHaptic('WRONG');
      } else {
        triggerGradingHaptic('REVIEW');
      }

      // Check if this student has a pending review request and mark it as under review
      const studentReview = reviewRequests.find(r => r.studentId === currentStudent?.student?.id);
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
      fetchExamData(currentStudent?.student?.id);
    } catch (error) {
      console.error("Error updating marks:", error);

      // Revert optimistic update on error
      if (exam && currentStudent) {
        const studentIndex = (exam?.submissions?.findIndex(s => s?.student?.id === currentStudent?.student?.id) ?? -1);
        if (studentIndex !== -1) {
          const revertedExam = { ...exam };
          const revertedSubmissions = [...(revertedExam?.submissions || [])];
          if (revertedSubmissions?.[studentIndex]) {
            revertedSubmissions[studentIndex] = {
              ...revertedSubmissions[studentIndex],
              answers: {
                ...revertedSubmissions[studentIndex]?.answers,
                [`${questionId}_marks`]: previousMarks
              }
            };
            setExam({ ...revertedExam, submissions: revertedSubmissions });
          }
        }
      }

      toast.error("Failed to update marks. Please try again.");
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
          studentId: currentStudent?.student?.id,
          notes
        })
      });

      if (response.ok) {
        toast.success("Notes updated successfully");
        fetchExamData(currentStudent?.student?.id); // Refresh data with current student
      } else {
        toast.error("Failed to update notes");
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    }
  };

  const submitStudentEvaluation = async () => {

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
          studentId: currentStudent?.student?.id
        })
      });


      if (response.ok) {
        toast.success("Student evaluation submitted successfully");
        fetchExamData(currentStudent?.student?.id); // Refresh data with current student
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

    // NATIVE BIOMETRIC SECURITY GATE
    const confirmed = await verifyAdminAction("Submit All Evaluations");
    if (!confirmed) return;

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

  // Drawing tool functions
  const initCanvas = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;

    ctx.scale(zoom, zoom);

    // Load existing drawing if available
    if (currentStudent && currentQuestion) {
      try {
        const response = await fetch(
          `/api/exams/evaluations/${id}/get-drawing?studentId=${currentStudent?.student?.id}&questionId=${currentQuestion?.id}&imageIndex=${currentImageIndex}`,
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
          studentId: currentStudent?.student?.id,
          questionId: currentQuestion?.id,
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

  try {
    const studentForRender = exam?.submissions?.[currentStudentIndex];
    const questionForRender = filteredQuestions?.[currentQuestionIndex];

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Evaluation Data...</h2>
          <p className="text-muted-foreground max-w-sm text-center">
            Fetching exam details and student submissions for ID: <code className="bg-muted px-1 rounded">{id}</code>
          </p>
          <div className="mt-8 text-xs text-muted-foreground flex gap-4">
            <span>ID: {id ? "✅" : "❌"}</span>
          </div>
        </div>
      );
    }

    if (renderError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-4">Critical Initialization Error</h2>
          <pre className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm mb-6 max-w-2xl overflow-auto border border-destructive/20">
            {renderError}
          </pre>
          <Button onClick={() => window.location.reload()}>
            <RotateCcw className="mr-2 h-4 w-4" /> Hard Refresh
          </Button>
        </div>
      );
    }

    if (!exam) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen container mx-auto p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 text-center">
              <FileSearch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Exam Not Found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't retrieve the data for this evaluation. Please check the ID or your permissions.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  } catch (err: any) {
    console.error("[EvaluationPage] Caught Render Error:", err);
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-10">
        <div className="max-w-xl text-center space-y-4">
          <h1 className="text-3xl font-bold text-red-600">Runtime Crash Prevented</h1>
          <p className="text-red-700 font-mono text-sm bg-white p-4 border border-red-200 rounded">
            {err.message || String(err)}
          </p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
            Recover and Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MathJaxContext config={mathJaxConfig}>
        <>
          <div className="container mx-auto p-4 lg:p-6">
            {/* Review Alert Banner */}
            {showReviewAlert && (
              <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        New Review Request{newReviewCount > 1 ? 's' : ''} Received!
                      </h3>
                      <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80 mt-1">
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
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-foreground mb-2">{exam?.name}</h1>
                  <p className="text-muted-foreground">{exam?.description}</p>

                  {/* Permission and Status Summary */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={
                      isSuperUser ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }>
                      {isSuperUser ? '👑 Super User' : '👨‍🏫 Evaluator'}
                    </Badge>

                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                      📊 {exam?.submissions?.length} Students
                    </Badge>

                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      ✅ {exam?.submissions?.filter(s => s?.status === 'COMPLETED').length} Completed
                    </Badge>

                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                      ⏳ {exam?.submissions?.filter(s => s?.status !== 'COMPLETED').length} Pending
                    </Badge>

                    {reviewRequests.filter(r => r?.status === 'PENDING').length > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        📝 {reviewRequests.filter(r => r?.status === 'PENDING').length} Review Requests
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row xl:items-center gap-4">
                  {/* Debug Info */}
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md hidden md:block">
                    <div>Questions: {exam?.questions?.length || 0}</div>
                    <div>Submissions: {exam?.submissions?.length || 0}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                      className={`relative ${reviewRequests.filter(r => r?.status === 'PENDING').length > 0
                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'}`}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Review Requests ({reviewRequests.filter(r => r?.status === 'PENDING').length})
                      {reviewRequests.filter(r => r?.status === 'PENDING').length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {reviewRequests.filter(r => r?.status === 'PENDING').length}
                        </span>
                      )}
                    </Button>
                    {isSuperUser && (
                      <Button
                        onClick={releaseResults}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        title="Release results to make them visible to students"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Release Results
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted border border-border mb-4 inline-flex">
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
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center justify-center lg:justify-start gap-4 Order-2 lg:order-1">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newIndex = Math.max(0, currentStudentIndex - 1);
                          setCurrentStudentIndex(newIndex);
                          setCurrentQuestionIndex(0); // Reset to first question when switching student
                          // Refetch exam data with the new student's questions
                          if (exam?.submissions?.[newIndex]) {
                            fetchExamData(exam?.submissions?.[newIndex]?.student?.id);
                          }
                        }}
                        disabled={currentStudentIndex === 0}
                        className="h-10 w-10 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
                      >
                        <ArrowLeft className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>

                      <div className="text-center min-w-[120px]">
                        <div className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">
                          {currentStudent?.student?.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Roll: {currentStudent?.student?.roll} • {currentStudentIndex + 1}/{exam?.submissions?.length}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => {
                          const newIndex = Math.min(exam?.submissions?.length - 1, currentStudentIndex + 1);
                          setCurrentStudentIndex(newIndex);
                          setCurrentQuestionIndex(0); // Reset to first question when switching student
                          // Refetch exam data with the new student's questions
                          if (exam?.submissions?.[newIndex]) {
                            fetchExamData(exam?.submissions?.[newIndex]?.student?.id);
                          }
                        }}
                        disabled={currentStudentIndex === exam?.submissions?.length - 1}
                        className="h-10 w-10 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ArrowRight className="h-4 w-4 sm:ml-2" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 order-1 lg:order-2">
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          onClick={() => currentStudent && window.open(`/exams/evaluations/${id}/print/${currentStudent?.student?.id}`, '_blank')}
                          disabled={!currentStudent}
                          title="Print student script with marks"
                          className="flex-1 sm:flex-none"
                        >
                          <Printer className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Print Script</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!currentStudent || !exam) return;

                            const questions = exam?.questions || [];
                            if (!questions.length) return toast.error("No questions found");

                            const sessionData = (questions || [])?.map((q) => {
                              const ans = currentStudent?.answers ? currentStudent?.answers?.[q?.id] : null;
                              let status: 'correct' | 'wrong' | 'unanswered' = 'unanswered';
                              let userIdx = null;

                              if (ans !== undefined && ans !== null) {
                                const correctOpt = q?.options?.find((o: any) => o?.isCorrect);
                                const isCorrect = correctOpt && (
                                  (typeof ans === 'number' && q?.options?.[ans]?.text === correctOpt?.text) ||
                                  (ans === correctOpt?.text)
                                );
                                status = isCorrect ? 'correct' : 'wrong';

                                if (q?.type?.toLowerCase() === 'mcq' && q?.options) {
                                  userIdx = typeof ans === 'number' ? ans : q?.options?.findIndex((o: any) => o?.text === ans);
                                }
                              }

                              // normalize questionText
                              const questionText = (q as any).questionText || q.text || "Question text missing";

                              return {
                                ...q,
                                questionText, // Ensure this exists for the session page
                                status,
                                userAnswer: userIdx,
                                type: (q?.type || "").toUpperCase() === 'MCQ' ? 'MCQ' : q?.type
                              };
                            });

                            // Store as object with Metadata
                            const payload = {
                              examName: exam?.name || "Exam Review",
                              questions: sessionData
                            };

                            localStorage.setItem("review-session-data", JSON.stringify(payload));
                            toast.success("Opening Review Session...");
                            window.open(`/problem-solving/review?id=${id}`, '_blank'); // Targeted dedicated page
                          }}
                          disabled={!currentStudent}
                          title="Open in interactive Problem Solving Session"
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex-1 sm:flex-none"
                        >
                          <MonitorPlay className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Review Session</span>
                        </Button>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          onClick={submitStudentEvaluation}
                          disabled={saving || !canSubmitStudent()}
                          className={`flex-1 sm:flex-none ${canSubmitStudent()
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                          title={
                            !canSubmitStudent()
                              ? "Student evaluation is already completed"
                              : "Submit this student's evaluation"
                          }
                        >
                          <Save className="h-4 w-4 sm:mr-2" />
                          <span>Submit {currentStudent?.status === 'COMPLETED' ? '✓' : 'Student'}</span>
                        </Button>

                        <Button
                          onClick={submitAllEvaluations}
                          disabled={saving || !canSubmitAll()}
                          className={`flex-1 sm:flex-none ${canSubmitAll()
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                          title={
                            !canSubmitAll()
                              ? "All student evaluations are already completed"
                              : "Submit all student evaluations"
                          }
                        >
                          <CheckCircle className="h-4 w-4 sm:mr-2" />
                          <span>Submit All {exam && exam?.submissions?.every(s => s?.status === 'COMPLETED') ? '✓' : ''}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Type Filter */}
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Filter by type:</span>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'mcq', 'mc', 'ar', 'mtf', 'int', 'cq', 'sq', 'descriptive'] as const).map((type) => (
                        <Button
                          key={type}
                          variant={questionTypeFilter === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setQuestionTypeFilter(type);
                            setCurrentQuestionIndex(0); // Reset to first question when filtering
                          }}
                          className="capitalize px-4 flex-1 sm:flex-none"
                        >
                          {type === 'all' ? 'All Questions' : type.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
                    Showing {filteredQuestions.length} of {exam?.questions?.length} questions
                  </div>
                </div>

                {/* Marks Summary */}
                {currentStudent && (
                  <div className="mb-4">
                    <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3 className="text-lg font-semibold text-foreground/90">Marks Summary</h3>
                          <div className="text-sm font-medium text-blue-700 bg-blue-100/50 px-2 py-1 rounded">
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
                                  const dbMcqMarks = currentStudent?.result?.mcqMarks;
                                  const calculatedMcqMarks = exam?.questions
                                    ?.filter(q => ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'].includes(q?.type?.toLowerCase() || ''))
                                    ?.reduce((total, q) => total + getAutoScore(q, currentStudent?.answers?.[q?.id]), 0) ?? 0;

                                  return dbMcqMarks != null ? dbMcqMarks : calculatedMcqMarks;
                                })()}
                              </div>
                              <div className="text-xs text-blue-600">
                                / {exam?.questions?.filter(q => ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'].includes(q?.type?.toLowerCase() || ''))?.reduce((total, q) => total + (q?.marks || 0), 0) || 0}
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
                                {(() => {
                                  if (currentStudent?.result?.cqMarks) return currentStudent?.result.cqMarks;
                                  const allCqScores = exam?.questions
                                    ?.filter(q => q?.type?.toLowerCase() === 'cq')
                                    ?.map(q => currentStudent?.answers?.[`${q?.id}_marks`] || 0) || [];

                                  const req = (exam as any)?.cqRequiredQuestions || allCqScores?.length || 0;
                                  return allCqScores?.sort((a, b) => b - a)?.slice(0, req)?.reduce((s, m) => s + m, 0) || 0;
                                })()}
                              </div>
                              <div className="text-xs text-green-600">
                                / {(() => {
                                  const allCqMarks = exam?.questions
                                    ?.filter(q => q?.type?.toLowerCase() === 'cq')
                                    ?.map(q => q?.marks || 0) || [];
                                  const req = (exam as any)?.cqRequiredQuestions || allCqMarks?.length || 0;
                                  return allCqMarks?.sort((a, b) => b - a)?.slice(0, req)?.reduce((s, m) => s + m, 0) || 0;
                                })()}
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
                                {(() => {
                                  if (currentStudent?.result?.sqMarks) return currentStudent?.result.sqMarks;
                                  const allSqScores = exam?.questions
                                    ?.filter(q => q?.type?.toLowerCase() === 'sq')
                                    ?.map(q => currentStudent?.answers?.[`${q?.id}_marks`] || 0) || [];

                                  const req = (exam as any)?.sqRequiredQuestions || allSqScores?.length || 0;
                                  return allSqScores?.sort((a, b) => b - a)?.slice(0, req)?.reduce((s, m) => s + m, 0) || 0;
                                })()}
                              </div>
                              <div className="text-xs text-yellow-600">
                                / {(() => {
                                  const allSqMarks = exam?.questions
                                    ?.filter(q => q?.type?.toLowerCase() === 'sq')
                                    ?.map(q => q?.marks || 0) || [];
                                  const req = (exam as any)?.sqRequiredQuestions || allSqMarks?.length || 0;
                                  return allSqMarks?.sort((a, b) => b - a)?.slice(0, req)?.reduce((s, m) => s + m, 0) || 0;
                                })()}
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
                                {(() => {
                                  if (currentStudent?.result?.total) return currentStudent?.result.total;

                                  // Recalculate if result not present
                                  const mcq = exam?.questions
                                    ?.filter(q => ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'].includes(q?.type?.toLowerCase() || ''))
                                    ?.reduce((total, q) => total + getAutoScore(q, currentStudent?.answers?.[q?.id]), 0) || 0;

                                  const cqScores = exam?.questions
                                    ?.filter(q => q?.type?.toLowerCase() === 'cq')
                                    ?.map(q => currentStudent?.answers?.[`${q?.id}_marks`] || 0) || [];
                                  const cqReq = (exam as any)?.cqRequiredQuestions || cqScores?.length || 0;
                                  const cq = cqScores?.sort((a, b) => b - a)?.slice(0, cqReq)?.reduce((s, m) => s + m, 0) || 0;

                                  const sqScores = exam?.questions
                                    ?.filter(q => q?.type?.toLowerCase() === 'sq')
                                    ?.map(q => currentStudent?.answers?.[`${q?.id}_marks`] || 0) || [];
                                  const sqReq = (exam as any)?.sqRequiredQuestions || sqScores?.length || 0;
                                  const sq = sqScores?.sort((a, b) => b - a)?.slice(0, sqReq)?.reduce((s, m) => s + m, 0) || 0;

                                  return mcq + cq + sq;
                                })()}
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex-1 sm:flex-none"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                      </Button>

                      <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        Q {filteredQuestions.length > 0 ? currentQuestionIndex + 1 : 0} / {filteredQuestions.length}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(Math.min(filteredQuestions.length - 1, currentQuestionIndex + 1))}
                        disabled={filteredQuestions.length === 0 || currentQuestionIndex >= filteredQuestions.length - 1}
                        className="flex-1 sm:flex-none"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {/* Additional actions if any could go here */}
                  </div>
                </div>



                {filteredQuestions.length > 0 ? (
                  currentStudent ? (
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
                                <label className="text-xs font-medium text-muted-foreground">Name</label>
                                <div className="font-semibold truncate">{currentStudent?.student?.name}</div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">Roll</label>
                                <div className="font-semibold">{currentStudent?.student?.roll}</div>
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Registration</label>
                                <div className="font-semibold text-xs">{currentStudent?.student?.registrationNo}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-1">
                                <Badge className={
                                  currentStudent?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    currentStudent?.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                }>
                                  {currentStudent?.status}
                                </Badge>

                                {/* Mark Editing Status */}
                                <Badge className={
                                  canEditMarks() ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }>
                                  {canEditMarks() ? '✏️ Marks Editable' : '🔒 Marks Locked'}
                                </Badge>



                                {/* Review Request Indicator */}
                                {(() => {
                                  const studentReview = (reviewRequests || [])?.find(r => r?.studentId === currentStudent?.student?.id);
                                  if (studentReview) {
                                    return (
                                      <Badge className={
                                        studentReview?.status === 'PENDING' ? 'bg-red-100 text-red-800' :
                                          studentReview?.status === 'UNDER_REVIEW' ? 'bg-orange-100 text-orange-800' :
                                            studentReview?.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                              'bg-gray-100 text-gray-800'
                                      }>
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        Review {studentReview?.status?.replace('_', ' ') || "Requested"}
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Marks</div>
                                <div className="font-bold text-lg">
                                  {currentStudent?.earnedMarks} / {totalMarks}
                                  {(() => {
                                    // Local calculation for deducted marks
                                    let deducted = 0;
                                    Object.entries(currentStudent?.answers || {}).forEach(([key, val]: [string, any]) => {
                                      // Marks are usually stored as {questionId}_marks: number
                                      // But for objective questions, they are auto-graded.
                                      // In the evaluation view, we mostly show the result.mcqMarks which is net.
                                      // Getting "deducted" precisely requires re-checking all objective answers.
                                    });

                                    // For simplicity in the evaluation header, the user just wants consistency.
                                    // If result exists, we could display it.
                                    return null;
                                  })()}
                                </div>
                                {currentStudent?.result && (
                                  <div className="text-xs space-y-0.5">
                                    <div className="text-blue-600">
                                      MCQ: {currentStudent?.result?.mcqMarks?.toFixed(2) || 0} | CQ: {currentStudent?.result?.cqMarks?.toFixed(2) || 0} | SQ: {currentStudent?.result?.sqMarks?.toFixed(2) || 0}
                                    </div>
                                    {/* Just for consistency with the print page logic */}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-600">Evaluator Notes</label>
                              <Textarea
                                value={currentStudent?.evaluatorNotes || ''}
                                onChange={(e) => updateNotes(e.target.value)}
                                placeholder="Add notes about this student's performance..."
                                rows={4}
                                disabled={!canEditMarks()}
                              />

                              {/* Review Period Notice */}
                              {(() => {
                                const studentReview = (reviewRequests || [])?.find(r => r?.studentId === currentStudent?.student?.id);
                                if (studentReview) {
                                  if (studentReview?.status === 'UNDER_REVIEW') {
                                    return (
                                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                                        <div className="font-medium">⚠️ Review Period Active</div>
                                        <div>You can edit marks during review. Super admin must release results again after changes.</div>
                                      </div>
                                    );
                                  } else if (studentReview?.status === 'PENDING') {
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
                                Question {(filteredQuestions?.length || 0) > 0 ? currentQuestionIndex + 1 : 0} of {filteredQuestions?.length || 0}
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
                                  onClick={() => setCurrentQuestionIndex(Math.min((filteredQuestions?.length || 1) - 1, currentQuestionIndex + 1))}
                                  disabled={(filteredQuestions?.length || 0) === 0 || currentQuestionIndex >= (filteredQuestions?.length || 1) - 1}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col">
                            {currentQuestion ? (
                              <div className="space-y-6">
                                {/* Question */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge className={
                                      currentQuestion?.type?.toLowerCase() === 'mcq' ? 'bg-blue-100 text-blue-800' :
                                        currentQuestion?.type?.toLowerCase() === 'cq' ? 'bg-green-100 text-green-800' :
                                          'bg-yellow-100 text-yellow-800'
                                    }>
                                      {(currentQuestion?.type || "unknown").toUpperCase()}
                                    </Badge>
                                    <div className="flex flex-col items-end gap-1">
                                      <div className="text-sm text-muted-foreground">
                                        {currentQuestion?.marks} mark{currentQuestion?.marks > 1 ? 's' : ''}
                                      </div>
                                      {['cq', 'sq'].includes(currentQuestion?.type?.toLowerCase() || '') && (
                                        <Badge variant="outline" className="text-[10px] font-black bg-indigo-50 text-indigo-700 border-indigo-200">
                                          Awarded: {(() => {
                                            const qId = currentQuestion?.id;
                                            let total = 0;
                                            (currentQuestion?.subQuestions || currentQuestion?.sub_questions || []).forEach((_: any, i: number) => {
                                              total += Number(currentStudent?.answers?.[`${qId}_sub_${i}_marks`] || 0);
                                            });
                                            return total;
                                          })()} / {currentQuestion?.marks}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-base md:text-lg mb-4">
                                    <UniversalMathJax key={currentQuestion?.id} dynamic>{cleanupMath(currentQuestion?.text)}</UniversalMathJax>
                                  </div>

                                  {/* Subquestions */}
                                  {currentQuestion?.subQuestions && Array.isArray(currentQuestion?.subQuestions) && currentQuestion?.subQuestions.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                      <h5 className="font-medium text-muted-foreground">Sub-questions:</h5>
                                      {currentQuestion?.subQuestions?.map((subQ: any, idx: number) => (
                                        <div key={idx} className="pl-4 border-l-2 border-gray-200">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm md:text-base font-medium text-gray-600">
                                              (a{String.fromCharCode(97 + idx)}) <UniversalMathJax inline dynamic>{cleanupMath(subQ?.questionText || subQ?.text || subQ?.question || '')}</UniversalMathJax>
                                              {subQ?.image && (
                                                <div className="mt-1 block">
                                                  <img src={subQ?.image} alt="Sub-question" className="max-h-24 rounded border bg-white object-contain" />
                                                </div>
                                              )}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {subQ?.marks || 1} mark{(subQ?.marks || 1) > 1 ? 's' : ''}
                                            </span>
                                          </div>
                                          {subQ?.modelAnswer && (
                                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                              <strong>Model Answer:</strong> <UniversalMathJax inline dynamic>{cleanupMath(subQ?.modelAnswer)}</UniversalMathJax>
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
                                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                                    {['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'].includes(currentQuestion?.type?.toLowerCase() || '') ? (
                                      <div className="space-y-4">
                                        {currentAnswer ? (
                                          <div className="space-y-3">
                                            {/* Auto-Score Header */}
                                            <div className="flex items-center gap-2 mb-2">
                                              {getAutoScore(currentQuestion, currentAnswer) > 0 ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                              ) : getAutoScore(currentQuestion, currentAnswer) === 0 ? (
                                                <XCircle className="h-5 w-5 text-orange-500" />
                                              ) : (
                                                <XCircle className="h-5 w-5 text-red-600" />
                                              )}
                                              <span className={`font-semibold ${getAutoScore(currentQuestion, currentAnswer) > 0 ? 'text-green-700' : getAutoScore(currentQuestion, currentAnswer) < 0 ? 'text-red-700' : 'text-gray-700'}`}>
                                                Auto-calculated Score: {getAutoScore(currentQuestion, currentAnswer)} / {currentQuestion?.marks}
                                                {getAutoScore(currentQuestion, currentAnswer) < 0 && <span className="ml-2 text-xs font-normal text-red-500">(negative marking applied)</span>}
                                              </span>
                                            </div>

                                            {/* Type Specific Rendering */}
                                            {currentQuestion?.type?.toLowerCase() === 'mcq' && (
                                              <div className="text-base md:text-lg p-2 bg-card rounded border border-border italic">
                                                <UniversalMathJax inline dynamic>{cleanupMath(String(currentAnswer))}</UniversalMathJax>
                                              </div>
                                            )}

                                            {currentQuestion?.type?.toLowerCase() === 'mc' && (
                                              <div className="grid grid-cols-1 gap-2">
                                                {(currentQuestion?.options || []).map((opt: any, idx: number) => {
                                                  const isSelected = currentAnswer?.selectedOptions?.includes(idx);
                                                  const isCorrect = opt?.isCorrect;
                                                  if (!isSelected && !isCorrect) return null;
                                                  return (
                                                    <div key={idx} className={`p-2 rounded border flex items-center justify-between ${isSelected ? (isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20') : 'bg-muted/30 border-border opacity-60'}`}>
                                                      <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-500 w-5">{MCQ_LABELS?.[idx]}.</span>
                                                        <UniversalMathJax inline dynamic>{cleanupMath(opt?.text || String(opt))}</UniversalMathJax>
                                                      </div>
                                                      {isSelected && (isCorrect ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />)}
                                                      {!isSelected && isCorrect && <span className="text-xs font-semibold text-green-600">(Missed)</span>}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {currentQuestion?.type?.toLowerCase() === 'ar' && (
                                              <div className="p-3 bg-card rounded border border-border">
                                                <div className="text-sm font-semibold text-indigo-600 mb-1">Selected Option {currentAnswer?.selectedOption || "N/A"}:</div>
                                                <div className="text-sm text-gray-700 italic">
                                                  {(() => {
                                                    // Use stored options if available (supports shuffling)
                                                    if (currentQuestion?.options && (currentQuestion?.options?.length || 0) > 0) {
                                                      const selectedIdx = Number(currentAnswer?.selectedOption || 0) - 1;
                                                      if (selectedIdx >= 0 && selectedIdx < (currentQuestion?.options?.length || 0)) {
                                                        return <UniversalMathJax inline dynamic>{cleanupMath(currentQuestion?.options?.[selectedIdx]?.text || "")}</UniversalMathJax>;
                                                      }
                                                    }

                                                    // Fallback for legacy data
                                                    const labels = [
                                                      "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা",
                                                      "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়",
                                                      "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা",
                                                      "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক",
                                                      "Assertion (A) ও Reason (R) উভয়ই মিথ্যা"
                                                    ];
                                                    return <UniversalMathJax inline dynamic>{labels?.[Number(currentAnswer?.selectedOption || 0) - 1] || "Unknown Option"}</UniversalMathJax>;
                                                  })()}
                                                </div>
                                              </div>
                                            )}

                                            {currentQuestion?.type?.toLowerCase() === 'mtf' && (
                                              <div className="space-y-2">
                                                <div className="text-sm font-semibold text-gray-600 mb-2">Student Matches:</div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                  {Object.entries(currentAnswer || {})?.map(([leftId, rightId]: [any, any]) => {
                                                    const leftPart = (currentQuestion as any)?.leftColumn?.find((p: any) => p?.id === leftId);
                                                    const rightPart = (currentQuestion as any)?.rightColumn?.find((p: any) => p?.id === rightId);
                                                    const correctMatchId = (currentQuestion as any)?.correctMatches?.[leftId];
                                                    const isMatchCorrect = rightId === correctMatchId;

                                                    return (
                                                      <div key={leftId} className={`p-2 rounded border flex flex-col gap-1 ${isMatchCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                                                          <span>{leftPart?.text || leftId}</span>
                                                          {isMatchCorrect ? <CheckCircle className="h-3 w-3 text-green-600" /> : <XCircle className="h-3 w-3 text-red-600" />}
                                                        </div>
                                                        <div className="text-sm font-medium">
                                                          Matched to: <span className={isMatchCorrect ? 'text-green-700' : 'text-red-700'}>{rightPart?.text || rightId}</span>
                                                        </div>
                                                        {!isMatchCorrect && (
                                                          <div className="text-xs text-gray-500 border-t pt-1 mt-1">
                                                            Correct: {(currentQuestion as any)?.rightColumn?.find((p: any) => p?.id === correctMatchId)?.text || correctMatchId}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                            {(currentQuestion?.type?.toLowerCase() === 'int' || currentQuestion?.type?.toLowerCase() === 'numeric') && (
                                              <div className="text-lg font-bold p-3 bg-card rounded border border-border flex items-center gap-2">
                                                <span>Answer:</span>
                                                <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded">{currentAnswer?.answer}</span>
                                              </div>
                                            )}

                                            {currentQuestion?.type?.toLowerCase() === 'descriptive' && (
                                              <div className="space-y-8">
                                                {(currentQuestion?.subQuestions || []).map((part: any, pIdx: number) => {
                                                  const ansKey = (sub: string | number) => `${currentQuestion.id}_desc_${pIdx}_${sub}`;
                                                  const getAns = (sub: string | number) => currentStudent?.answers?.[ansKey(sub)] ?? '';
                                                  const currentSubMarks = currentStudent?.answers?.[`${currentQuestion.id}_desc_${pIdx}_marks`] || 0;

                                                  return (
                                                    <div key={pIdx} className="relative group">
                                                      {/* Sub-question Header & Gradings */}
                                                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200/50 shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black shadow-md shadow-amber-200">
                                                            {toBengaliNumerals(pIdx + 1)}
                                                          </div>
                                                          <div>
                                                            <div className="text-sm font-black text-amber-800 uppercase tracking-widest">{part.subType?.replace('_', ' ') || "Question"} Part</div>
                                                            <div className="text-xs text-amber-600 font-bold">Allocated: {part.marks} Marks</div>
                                                          </div>
                                                        </div>

                                                        {/* Individual Part Marking */}
                                                        <div className="flex flex-wrap items-center gap-2">
                                                          <div className="text-[10px] font-black text-amber-600/70 uppercase tracking-wider mr-2">Award Marks:</div>
                                                          <div className="flex gap-1.5 p-1 bg-white/60 rounded-lg border border-amber-100 shadow-inner">
                                                            {Array.from({ length: (part.marks || 0) + 1 }, (_, i) => i).map((mark) => (
                                                              <button
                                                                key={mark}
                                                                onClick={() => updateMarks(currentQuestion.id, mark, pIdx)}
                                                                disabled={!canEditMarks()}
                                                                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all ${currentSubMarks === mark
                                                                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-200 scale-110'
                                                                  : 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-100'
                                                                  } ${!canEditMarks() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
                                                              >
                                                                {mark}
                                                              </button>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      {/* Content Grid: Question vs Answer vs Reference */}
                                                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pl-4 border-l-4 border-amber-200/30">

                                                        {/* Left Side: Question & Student Answer */}
                                                        <div className="space-y-4">
                                                          <div className="space-y-2">
                                                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Quest:
                                                            </div>
                                                            <div className="text-sm font-semibold text-gray-800 leading-relaxed bg-blue-50/30 p-3 rounded-lg border border-blue-100/50">
                                                              {part.questionText || "Reference text/question missing in metadata"}
                                                            </div>
                                                          </div>

                                                          <div className="space-y-2">
                                                            <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                                              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div> Student response:
                                                            </div>
                                                            <div className="bg-white p-4 rounded-xl border-2 border-amber-100 shadow-sm min-h-[100px] relative overflow-hidden">
                                                              {Capacitor.isNativePlatform() && (
                                                                <Button
                                                                  size="sm"
                                                                  variant="ghost"
                                                                  className="absolute top-2 right-2 h-7 px-2 text-[10px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                                  onClick={() => handleScan(currentQuestion.id, pIdx)}
                                                                >
                                                                  <Scan className="w-3 h-3 mr-1" />
                                                                  Smart Scan
                                                                </Button>
                                                              )}
                                                              <div className="absolute top-0 right-0 px-2 py-1 bg-amber-50 text-[8px] font-black text-amber-400 uppercase tracking-tighter invisible group-hover:visible transition-all">Verified Entry</div>
                                                              {part.subType === 'writing' && (
                                                                <div className="whitespace-pre-wrap text-sm text-gray-700 italic font-medium">{getAns('ans') || <span className="text-muted-foreground/40">No text provided…</span>}</div>
                                                              )}
                                                              {part.subType === 'fill_in' && (
                                                                <div className="space-y-3">
                                                                  {(part.fillType === 'gap_passage' || !part.fillType) && (
                                                                    <div className="flex flex-wrap gap-4">
                                                                      {(part.passage?.match(/___/g) || []).map((_: any, si: number) => (
                                                                        <div key={si} className="flex items-center bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-100">
                                                                          <span className="text-[10px] font-black text-amber-500 mr-2">{toBengaliNumerals(si + 1)}</span>
                                                                          <span className="text-sm font-bold text-gray-700">{getAns(si) || '___'}</span>
                                                                        </div>
                                                                      ))}
                                                                    </div>
                                                                  )}
                                                                  {part.fillType && part.fillType !== 'gap_passage' && (
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                      {(part.items || []).map((item: any, ii: number) => (
                                                                        <div key={ii} className="flex items-center gap-3 p-2 bg-amber-50/30 rounded border border-amber-100">
                                                                          <span className="text-xs font-black text-amber-400">{ii + 1}.</span>
                                                                          <div className="flex-1">
                                                                            <div className="text-[8px] font-bold text-amber-600/50 uppercase">{item}</div>
                                                                            <div className="text-sm font-bold text-gray-800">{getAns(ii) || '___'}</div>
                                                                          </div>
                                                                        </div>
                                                                      ))}
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              )}
                                                              {part.subType === 'comprehension' && (
                                                                <div className="space-y-4">
                                                                  {(!part.answerType || part.answerType === 'qa') && (part.questions || []).map((q: string, qi: number) => (
                                                                    <div key={qi} className="space-y-1">
                                                                      <div className="text-[10px] font-bold text-amber-800/60">Q{qi + 1}: {q}</div>
                                                                      <div className="text-sm border-l-2 border-amber-400 pl-3 py-1 bg-amber-50/20 italic">{getAns(qi) || 'No response'}</div>
                                                                    </div>
                                                                  ))}
                                                                  {part.answerType === 'stem_mcq' && (part.stemQuestions || []).map((sq: any, sqi: number) => {
                                                                    const ansIdx = getAns(sqi);
                                                                    const isCorrect = String(ansIdx) === String(sq.correct);
                                                                    return (
                                                                      <div key={sqi} className="flex items-center justify-between p-2 bg-muted/30 rounded border text-xs">
                                                                        <span className="font-medium">{sqi + 1}. {sq.question}</span>
                                                                        <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-green-500" : "bg-red-500"}>
                                                                          Selected: {String.fromCharCode(65 + Number(ansIdx)) || 'X'}
                                                                        </Badge>
                                                                      </div>
                                                                    );
                                                                  })}
                                                                </div>
                                                              )}
                                                              {part.subType === 'table' && (
                                                                <div className="overflow-x-auto rounded-lg border border-amber-200">
                                                                  <table className="w-full text-[10px]">
                                                                    <thead className="bg-amber-100/50">
                                                                      <tr>
                                                                        {(part.tableHeaders || []).map((h: string, hi: number) => <th key={hi} className="border-b border-amber-200 p-2 text-left text-amber-800">{h}</th>)}
                                                                      </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                      {(part.tableRows || []).map((row: string[], ri: number) => (
                                                                        <tr key={ri} className="hover:bg-amber-50/30">
                                                                          {(part.tableHeaders || []).map((_: string, ci: number) => {
                                                                            const isBlank = !row[ci] || row[ci] === '___';
                                                                            return (
                                                                              <td key={ci} className="border-b border-amber-100 p-2">
                                                                                {isBlank ? <span className="font-black text-amber-600">{getAns(`${ri}_${ci}`) || '___'}</span> : <span className="text-gray-500">{row[ci]}</span>}
                                                                              </td>
                                                                            );
                                                                          })}
                                                                        </tr>
                                                                      ))}
                                                                    </tbody>
                                                                  </table>
                                                                </div>
                                                              )}
                                                              {part.subType === 'matching' && (
                                                                <div className="grid grid-cols-2 gap-2">
                                                                  {Object.entries((part.matches as Record<string, string>) || {}).map(([l, r], mIdx) => {
                                                                    const studentR = getAns(l);
                                                                    const isCorrect = studentR === r;
                                                                    return (
                                                                      <div key={mIdx} className={`p-2 rounded border flex flex-col gap-0.5 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                                        <div className="text-[8px] font-black text-gray-400 uppercase">{l}</div>
                                                                        <div className="text-xs font-bold">{studentR || <span className="opacity-30">Pending</span>}</div>
                                                                        {!isCorrect && <div className="text-[8px] text-green-600 mt-1 font-black">Ref: {r}</div>}
                                                                      </div>
                                                                    );
                                                                  })}
                                                                </div>
                                                              )}
                                                              {part.subType === 'rearranging' && (
                                                                <div className="flex flex-wrap gap-2">
                                                                  {(getAns('order') as string || "").split(',').filter(Boolean).map((label, oIdx) => (
                                                                    <div key={oIdx} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1.5">
                                                                      <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[8px] shadow-sm">{label}</span>
                                                                      <span>{part.items[label.charCodeAt(0) - 65]}</span>
                                                                    </div>
                                                                  ))}
                                                                </div>
                                                              )}
                                                              {part.subType === 'true_false' && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                  {(part.statements || []).map((stmt: string, sIdx: number) => {
                                                                    const studentAns = getAns(sIdx);
                                                                    const correctAns = part.correct?.[sIdx];
                                                                    const isCorrect = studentAns === correctAns;
                                                                    return (
                                                                      <div key={sIdx} className={`p-3 rounded-lg border-2 flex flex-col gap-1 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                                        <div className="text-[10px] font-black text-gray-400 uppercase">Statement {sIdx + 1}</div>
                                                                        <div className="text-sm font-medium">{stmt}</div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                          <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-green-500" : "bg-red-500"}>
                                                                            {studentAns || 'No response'}
                                                                          </Badge>
                                                                          {!isCorrect && <span className="text-[10px] font-bold text-green-600">Correct: {correctAns}</span>}
                                                                        </div>
                                                                      </div>
                                                                    );
                                                                  })}
                                                                </div>
                                                              )}
                                                              {part.subType === 'label_diagram' && (
                                                                <div className="space-y-4">
                                                                  {part.imageUrl && (
                                                                    <div className="relative inline-block border-2 border-amber-200 rounded-xl overflow-hidden shadow-sm">
                                                                      <img src={part.imageUrl} alt="Diagram" className="max-h-48 rounded-lg" />
                                                                      <div className="absolute inset-0 pointer-events-none">
                                                                        {(part.labels || []).map((l: any, i: number) => (
                                                                          <div key={i} className="absolute w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm" style={{ top: `${l.y}%`, left: `${l.x}%`, transform: 'translate(-50%, -50%)' }}>
                                                                            {i + 1}
                                                                          </div>
                                                                        ))}
                                                                      </div>
                                                                    </div>
                                                                  )}
                                                                  <div className="grid grid-cols-2 gap-2">
                                                                    {(part.labels || []).map((_: any, i: number) => {
                                                                      const ans = getAns(i);
                                                                      const correct = part.correctLabels?.[i];
                                                                      const isCorrect = normalize(ans) === normalize(correct);
                                                                      return (
                                                                        <div key={i} className={`p-2 rounded border flex flex-col gap-0.5 ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                                                          <div className="text-[9px] font-black text-amber-600/50 uppercase">Label {i + 1}</div>
                                                                          <div className="text-xs font-bold">{ans || '___'}</div>
                                                                          {!isCorrect && <div className="text-[8px] text-green-600 font-bold">Key: {correct}</div>}
                                                                        </div>
                                                                      );
                                                                    })}
                                                                  </div>
                                                                </div>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>

                                                        {/* Right Side: Reference/Model Answer */}
                                                        <div className="space-y-4">
                                                          <div className="space-y-2">
                                                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div> Model Verification Key:
                                                            </div>
                                                            <div className="bg-emerald-50/30 p-5 rounded-2xl border-2 border-emerald-100/50 shadow-sm relative overflow-hidden group-hover:border-emerald-200 transition-colors">
                                                              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm">Standard Key</div>
                                                              {part.modelAnswer ? (
                                                                <div className="text-sm font-medium text-emerald-900 leading-relaxed whitespace-pre-wrap">
                                                                  <UniversalMathJax dynamic>{cleanupMath(part.modelAnswer)}</UniversalMathJax>
                                                                </div>
                                                              ) : (
                                                                <div className="flex flex-col items-center justify-center py-6 text-emerald-600/40">
                                                                  <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                                                  <span className="text-[10px] font-black uppercase tracking-tighter">No model answer provided</span>
                                                                </div>
                                                              )}

                                                              {/* Context Hints for Objective Sub-types */}
                                                              {part.subType === 'rearranging' && (
                                                                <div className="mt-4 p-3 bg-white/60 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                                                                  <div className="font-black uppercase text-[8px] mb-2 text-emerald-500">Correct Sequence</div>
                                                                  <div className="flex gap-2">
                                                                    {(part.correctOrder || []).map((label: string, i: number) => (
                                                                      <span key={i} className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">{label}</span>
                                                                    ))}
                                                                  </div>
                                                                </div>
                                                              )}
                                                              {part.subType === 'matching' && (
                                                                <div className="mt-4 p-3 bg-white/60 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                                                                  <div className="font-black uppercase text-[8px] mb-2 text-emerald-500">Correct Pairing Matrix</div>
                                                                  <div className="grid grid-cols-2 gap-2">
                                                                    {Object.entries((part.matches as Record<string, string>) || {}).map(([l, r], mIdx) => (
                                                                      <div key={mIdx} className="bg-emerald-100/50 p-1.5 rounded border border-emerald-200 flex items-center gap-2">
                                                                        <span className="font-black text-emerald-700">{l}:</span>
                                                                        <span className="font-bold">{r}</span>
                                                                      </div>
                                                                    ))}
                                                                  </div>
                                                                </div>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-500 italic">No answer provided by the student</span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-6">
                                        {/* Main Answer (SQ) or Intro (CQ) */}
                                        {currentAnswer && typeof currentAnswer === 'string' && (
                                          <div>
                                            <div className="text-xs font-semibold text-gray-500 mb-1">Text Answer:</div>
                                            <div className="whitespace-pre-wrap text-sm md:text-base"><UniversalMathJax dynamic>{cleanupMath(currentAnswer)}</UniversalMathJax></div>
                                          </div>
                                        )}

                                        {/* Main Images (SQ) - Support both single and multiple */}
                                        {(() => {
                                          const singleImage = currentStudent?.answers?.[`${currentQuestion?.id}_image`];
                                          const multipleImages = currentStudent?.answers?.[`${currentQuestion?.id}_images`] || [];
                                          const allImages = singleImage ? [singleImage, ...(multipleImages || [])] : (multipleImages || []);

                                          return allImages.length > 0 ? (
                                            <div>
                                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                                Attachments ({(allImages?.length || 0)}):
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                {(allImages || [])?.map((imgUrl: string, imgIdx: number) => {
                                                  const displayUrl = getImageUrl(imgUrl, currentQuestion?.id, imgIdx);
                                                  const hasAnnotation = displayUrl !== imgUrl;
                                                  return (
                                                    <div key={imgIdx} className="relative inline-block group">
                                                      <img
                                                        src={displayUrl}
                                                        alt={`Answer Attachment ${imgIdx + 1}`}
                                                        crossOrigin="anonymous"
                                                        className="h-32 w-32 rounded border border-border bg-muted/50 object-cover cursor-pointer transition-transform hover:scale-105"
                                                        onClick={() => openAnnotation(imgUrl, currentQuestion?.id, imgIdx, currentStudent?.student?.id)}
                                                      />
                                                      <button
                                                        onClick={() => openAnnotation(imgUrl, currentQuestion?.id, imgIdx, currentStudent?.student?.id)}
                                                        className="absolute top-2 right-2 bg-background/90 p-1.5 rounded-full shadow-sm hover:bg-muted text-primary"
                                                      >
                                                        <PenTool className="w-4 h-4" />
                                                      </button>
                                                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                                        {imgIdx + 1}/{(allImages?.length || 0)}
                                                      </div>
                                                      {hasAnnotation && (
                                                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold shadow-sm z-10 pointer-events-none">
                                                          ✓
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ) : null;
                                        })()}

                                        {/* CQ Sub-question Answers */}
                                        {(currentQuestion?.type?.toLowerCase() === 'cq' || currentQuestion?.type?.toLowerCase() === 'sq') && (currentQuestion?.subQuestions || currentQuestion?.sub_questions) && (
                                          <div className="space-y-4 border-t pt-4 mt-2">
                                            <h5 className="font-medium text-gray-700">Sub-question Answers:</h5>
                                            {(currentQuestion?.subQuestions || currentQuestion?.sub_questions || []).map((subQ: any, idx: number) => {
                                              const subKey = `${currentQuestion?.id}_sub_${idx}`;
                                              const subText = currentStudent?.answers?.[subKey];
                                              const subImg = currentStudent?.answers?.[`${subKey}_image`];
                                              const subImgs = currentStudent?.answers?.[`${subKey}_images`] || [];

                                              if (!subText && !subImg && (!subImgs || subImgs.length === 0)) return (
                                                <div key={idx} className="text-sm text-gray-400 italic pl-2 border-l-2 border-transparent">
                                                  (Sub-question {idx + 1} not answered)
                                                </div>
                                              );

                                              return (
                                                <div key={idx} className="pl-4 border-l-2 border-indigo-100 space-y-3">
                                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                      <div className="text-sm font-semibold text-indigo-700 mb-1 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Part {toBengaliNumerals(idx + 1)}
                                                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">[{subQ.marks || 0} Marks]</span>
                                                      </div>
                                                      {subQ?.text || subQ?.question || subQ?.questionText ? (
                                                        <div className="text-gray-800 text-sm font-medium leading-relaxed mb-1">
                                                          <UniversalMathJax inline dynamic>{cleanupMath(subQ?.text || subQ?.question || subQ?.questionText)}</UniversalMathJax>
                                                        </div>
                                                      ) : null}
                                                      <div className="mb-2 text-gray-800 text-sm md:text-base bg-white/50 p-2 rounded border border-indigo-50/50">
                                                        <UniversalMathJax dynamic>{cleanupMath(subText || "")}</UniversalMathJax>
                                                      </div>
                                                    </div>

                                                    {/* Inline Marking for CQ Sub-question */}
                                                    <div className="flex flex-wrap items-center gap-2 bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/50 self-start">
                                                      <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mr-1">Grade:</div>
                                                      <div className="flex gap-1">
                                                        {Array.from({ length: (subQ?.marks || 0) + 1 }, (_, i) => i).map((mark) => {
                                                          const marksKey = `${currentQuestion?.id}_sub_${idx}_marks`;
                                                          const isSelected = (currentStudent?.answers?.[marksKey] || 0) === mark;
                                                          return (
                                                            <button
                                                              key={mark}
                                                              onClick={() => updateMarks(currentQuestion?.id, mark, idx)}
                                                              disabled={!canEditMarks()}
                                                              className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-black transition-all ${isSelected
                                                                ? 'bg-indigo-600 text-white shadow-md'
                                                                : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'
                                                                } ${!canEditMarks() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
                                                            >
                                                              {mark}
                                                            </button>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {(() => {
                                                    const singleImg = currentStudent?.answers?.[`${subKey}_image`];
                                                    const multipleImgs = currentStudent?.answers?.[`${subKey}_images`] || [];
                                                    const allSubImages = singleImg ? [singleImg, ...(multipleImgs || [])] : (multipleImgs || []);

                                                    return allSubImages.length > 0 ? (
                                                      <div className="flex flex-wrap gap-2 mt-2 ml-4">
                                                        {(allSubImages || [])?.map((imgUrl: string, imgIdx: number) => {
                                                          const questionIndex = idx * 100 + imgIdx;
                                                          const displayUrl = getImageUrl(imgUrl, currentQuestion?.id, questionIndex);
                                                          const hasAnnotation = displayUrl !== imgUrl;

                                                          return (
                                                            <div key={imgIdx} className="relative inline-block group">
                                                              <img
                                                                src={displayUrl}
                                                                alt={`Sub ${idx + 1} Image ${imgIdx + 1}`}
                                                                crossOrigin="anonymous"
                                                                className="h-20 w-20 rounded border border-border bg-muted/50 object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                onClick={() => openAnnotation(imgUrl, currentQuestion?.id, questionIndex, currentStudent?.student?.id)}
                                                              />
                                                              <button
                                                                onClick={() => openAnnotation(imgUrl, currentQuestion?.id, questionIndex, currentStudent?.student?.id)}
                                                                className="absolute top-1 right-1 bg-background/90 p-1 rounded-full shadow-sm hover:bg-muted text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                              >
                                                                <PenTool className="w-2.5 h-2.5" />
                                                              </button>
                                                              {hasAnnotation && (
                                                                <div className="absolute top-0 left-0 bg-green-500 text-white text-[8px] px-1 py-0.5 rounded-br font-semibold shadow-sm z-10">
                                                                  ✓
                                                                </div>
                                                              )}
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    ) : null;
                                                  })()}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Explanation & Correct Answer */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  {/* MCQ Options Display */}
                                  {currentQuestion?.type?.toLowerCase() === 'mcq' && currentQuestion?.options && (
                                    <div className="mb-4">
                                      <h5 className="font-semibold text-gray-700 mb-2">Options:</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {currentQuestion?.options?.map((opt: any, idx: number) => {
                                          const normalize = (s: string) => String(s || "").trim().toLowerCase();
                                          const optText = opt?.text || String(opt || "");
                                          const isSelected = currentAnswer && normalize(currentAnswer) === normalize(optText);
                                          const isCorrect = opt?.isCorrect;

                                          let bgClass = "bg-card border-border";
                                          if (isCorrect) bgClass = "bg-green-50 border-green-300 ring-1 ring-green-300";
                                          if (isSelected && !isCorrect) bgClass = "bg-red-50 border-red-300 ring-1 ring-red-300";
                                          if (isSelected && isCorrect) bgClass = "bg-green-100 border-green-500 ring-2 ring-green-500";

                                          return (
                                            <div key={idx} className={`p-3 rounded border ${bgClass} flex flex-col gap-2`}>
                                              <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-gray-500 w-6">{MCQ_LABELS?.[idx]}.</span>
                                                  <div className="flex-1">
                                                    <span className={`text-sm md:text-base ${isCorrect ? "font-medium text-green-900" : isSelected ? "text-red-900" : ""}`}>
                                                      <UniversalMathJax dynamic>{cleanupMath(optText)}</UniversalMathJax>
                                                    </span>
                                                    {opt.image && (
                                                      <div className="mt-1">
                                                        <img src={opt.image} alt="Option" className="max-h-24 rounded border border-border bg-muted/50 object-contain" />
                                                      </div>
                                                    )}
                                                  </div>
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

                                  {/* New Question Types Specialized View */}
                                  {(currentQuestion?.type || "").toLowerCase() === 'mc' && (
                                    <div className="mb-4 space-y-3">
                                      <h5 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                                        Multiple Correct (MC) Review:
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {currentQuestion?.options?.map((opt: any, oidx: number) => {
                                          const sel = currentAnswer?.selectedOptions || [];
                                          const isSelected = sel?.includes?.(oidx);
                                          const isCorrect = opt?.isCorrect;
                                          return (
                                            <div key={oidx} className={`p-3 rounded border flex items-center justify-between ${isSelected ? (isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400') : (isCorrect ? 'bg-green-100/50 border-dashed border-green-300 opacity-60' : 'bg-gray-50 border-gray-100')}`}>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold w-5 h-5 rounded-full bg-card flex items-center justify-center border border-border">{MCQ_LABELS?.[oidx]}</span>
                                                <span className="text-sm"><UniversalMathJax dynamic>{cleanupMath(opt?.text)}</UniversalMathJax></span>
                                              </div>
                                              <div className="flex gap-1">
                                                {isSelected && (isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />)}
                                                {!isSelected && isCorrect && <CheckCircle className="w-4 h-4 text-green-400/50" />}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {(currentQuestion?.type || "").toLowerCase() === 'ar' && (
                                    <div className="mb-4 space-y-4">
                                      <h5 className="font-semibold text-purple-700 flex items-center gap-2 border-b pb-2">
                                        <Star className="h-4 w-4" /> Assertion-Reason Analysis:
                                      </h5>

                                      {/* AR Statement Boxes */}
                                      <div className="grid grid-cols-1 gap-3 mb-4">
                                        <div className="p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded-r shadow-sm">
                                          <div className="text-[10px] font-bold text-indigo-600 mb-1 leading-none uppercase tracking-wider">Assertion (A)</div>
                                          <div className="text-gray-900 font-medium">
                                            <UniversalMathJax dynamic>{cleanupMath(currentQuestion?.assertion || currentQuestion?.questionText || "")}</UniversalMathJax>
                                          </div>
                                        </div>
                                        <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded-r shadow-sm">
                                          <div className="text-[10px] font-bold text-purple-600 mb-1 leading-none uppercase tracking-wider">Reason (R)</div>
                                          <div className="text-gray-900 font-medium">
                                            <UniversalMathJax dynamic>{cleanupMath(currentQuestion?.reason || "")}</UniversalMathJax>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Full Options List for AR */}
                                      <div className="space-y-2">
                                        {[
                                          "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং Reason হলো Assertion এর সঠিক ব্যাখ্যা",
                                          "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু Reason হলো Assertion এর সঠিক ব্যাখ্যা নয়",
                                          "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা",
                                          "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক",
                                          "Assertion (A) ও Reason (R) উভয়ই মিথ্যা"
                                        ].map((optText, i) => {
                                          const optionId = i + 1;
                                          const isSelected = Number(currentAnswer?.selectedOption || 0) === optionId;
                                          const isCorrect = Number(currentQuestion?.correct || (currentQuestion as any)?.correctOption || 0) === optionId;

                                          let bgClass = "bg-card border-border hover:bg-accent";
                                          if (isCorrect) bgClass = "bg-green-50 border-green-300 ring-1 ring-green-300 dark:bg-green-900/20 dark:border-green-800 dark:ring-green-900/40";
                                          if (isSelected && !isCorrect) bgClass = "bg-red-50 border-red-300 ring-1 ring-red-300 dark:bg-red-900/20 dark:border-red-800 dark:ring-red-900/40";
                                          if (isSelected && isCorrect) bgClass = "bg-green-100 border-green-500 ring-2 ring-green-500 dark:bg-green-900/40 dark:border-green-600 dark:ring-green-900/60";

                                          return (
                                            <div key={i} className={`p-3 rounded-lg border transition-all flex items-center gap-3 ${bgClass}`}>
                                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${isSelected || isCorrect ? 'bg-card border-border' : 'bg-muted text-muted-foreground'}`}>
                                                {optionId}
                                              </div>
                                              <span className={`text-sm flex-1 ${isCorrect ? 'font-medium text-green-900' : isSelected ? 'text-red-900' : 'text-gray-700'}`}>
                                                {optText}
                                              </span>
                                              {isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                                              {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {(currentQuestion?.type || "").toLowerCase() === 'mtf' && (
                                    <div className="mb-4 space-y-6">
                                      <h5 className="font-semibold text-orange-700 flex items-center gap-2 border-b pb-2">
                                        <Activity className="h-4 w-4" /> Match the Following Grid:
                                      </h5>

                                      {/* 2-Column Grid Layout (Question View) */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Column A</div>
                                          {((currentQuestion as any)?.leftColumn || (currentQuestion as any)?.pairs?.map((p: any, i: number) => ({ id: p?.left, text: p?.left })))?.map((item: any, i: number) => (
                                            <div key={i} className="p-3 bg-card border border-border rounded shadow-sm text-sm min-h-[40px] flex items-center">
                                              <span className="font-bold mr-2 text-gray-500">{i + 1}.</span>
                                              <UniversalMathJax inline>{cleanupMath(item?.text || item?.id || "")}</UniversalMathJax>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="space-y-2">
                                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Column B</div>
                                          {((currentQuestion as any)?.rightColumn || (currentQuestion as any)?.pairs?.map((p: any, i: number) => ({ id: p?.right, text: p?.right })))?.map((item: any, i: number) => (
                                            <div key={i} className="p-3 bg-card border border-border rounded shadow-sm text-sm min-h-[40px] flex items-center">
                                              <span className="font-bold mr-2 text-gray-500">{String.fromCharCode(65 + i)}.</span>
                                              <UniversalMathJax inline>{cleanupMath(item?.text || item?.id || "")}</UniversalMathJax>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Match Analysis Table */}
                                      <div className="overflow-hidden rounded-lg border border-border">
                                        <table className="w-full text-sm">
                                          <thead className="bg-muted text-xs text-muted-foreground font-bold uppercase text-left">
                                            <tr>
                                              <th className="px-3 py-2">Item</th>
                                              <th className="px-3 py-2">Your Match</th>
                                              <th className="px-3 py-2 text-center">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border">
                                            {((currentQuestion as any)?.leftColumn || (currentQuestion as any)?.pairs?.map((p: any, i: number) => ({ id: i, text: p?.left })))?.map((leftItem: any, lIdx: number) => {
                                              // Determine Student's Match
                                              let studentRightText = "Unmatched";
                                              let isCorrect = false;
                                              let studentRightIdx = -1;

                                              // Determine Correct Match for display if wrong
                                              let correctRightText = "";
                                              let correctRightIdx = -1;

                                              if ((currentQuestion as any)?.leftColumn) {
                                                // New Schema
                                                const studentMatches = (currentAnswer as any)?.matches || (currentAnswer as any) || {};
                                                let studentRightId = null;
                                                if (Array.isArray(studentMatches)) {
                                                  const match = studentMatches?.find((m: any) => m?.leftId === leftItem?.id);
                                                  if (match) studentRightId = match?.studentRightId || match?.rightId;
                                                } else {
                                                  studentRightId = studentMatches?.[leftItem?.id];
                                                }

                                                const rightItem = (currentQuestion as any)?.rightColumn?.find((r: any) => r?.id === studentRightId);
                                                studentRightIdx = (currentQuestion as any)?.rightColumn?.findIndex((r: any) => r?.id === studentRightId);
                                                studentRightText = rightItem?.text || (studentRightId ? "Invalid ID" : "Unmatched");

                                                const correctRightId = (currentQuestion as any)?.correctMatches?.[leftItem?.id];
                                                isCorrect = studentRightId === correctRightId;

                                                const correctItem = (currentQuestion as any)?.rightColumn?.find((r: any) => r?.id === correctRightId);
                                                correctRightIdx = (currentQuestion as any)?.rightColumn?.findIndex((r: any) => r?.id === correctRightId);
                                                correctRightText = correctItem?.text || "";

                                              } else {
                                                // Legacy Schema (Pairs)
                                                // Try to find match in array
                                                const pair = (currentQuestion as any)?.pairs?.[lIdx];
                                                studentRightIdx = currentAnswer?.matches?.find((m: any) => m?.leftIndex === lIdx)?.rightIndex;

                                                const rightPair = (currentQuestion as any)?.pairs?.[studentRightIdx];
                                                studentRightText = rightPair?.right || "Unmatched";

                                                isCorrect = pair?.right === rightPair?.right;
                                                correctRightText = pair?.right || "";
                                                // For legacy pairs, correctRightIdx would be lIdx if they were perfectly aligned initially
                                                correctRightIdx = lIdx;
                                              }

                                              // Visual labels
                                              const vlLeft = toBengaliNumerals(lIdx + 1);
                                              const vStudentRight = studentRightIdx !== -1 && studentRightIdx !== undefined ? String.fromCharCode(65 + studentRightIdx) : null;
                                              const vCorrectRight = correctRightIdx !== -1 && correctRightIdx !== undefined ? String.fromCharCode(65 + correctRightIdx) : null;

                                              return (
                                                <tr key={lIdx} className={isCorrect ? "bg-green-50/30" : "bg-red-50/30"}>
                                                  <td className="px-3 py-2 font-medium">
                                                    <div className="flex items-center gap-1">
                                                      <span className="font-bold text-gray-400 shrink-0">{vlLeft}.</span>
                                                      <UniversalMathJax inline>{cleanupMath(leftItem?.text || String(leftItem || ""))}</UniversalMathJax>
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <div className="flex flex-col">
                                                      <span className={isCorrect ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                                                        <div className="flex items-center gap-1">
                                                          {vStudentRight && <span className="font-bold shrink-0">{vStudentRight}.</span>}
                                                          <UniversalMathJax inline>{cleanupMath(studentRightText || "")}</UniversalMathJax>
                                                        </div>
                                                      </span>
                                                      {!isCorrect && (
                                                        <span className="text-xs text-gray-500 mt-0.5">
                                                          Correct: <span className="text-green-600 font-medium flex items-center gap-1">
                                                            {vCorrectRight && <span className="font-bold shrink-0">{vCorrectRight}.</span>}
                                                            <UniversalMathJax inline>{cleanupMath(correctRightText || "")}</UniversalMathJax>
                                                          </span>
                                                        </span>
                                                      )}
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2 text-center">
                                                    {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-red-500 mx-auto" />}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {(['int', 'numeric'].includes((currentQuestion?.type || "").toLowerCase())) && (
                                    <div className="mb-4">
                                      <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Comparison Box */}
                                        <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden shadow-sm flex">
                                          <div className={`w-2 ${Number(currentAnswer?.answer || 0) === Number(currentQuestion?.correct || (currentQuestion as any)?.answer || 0) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                          <div className="flex-1 p-4 grid grid-cols-2 gap-4 divide-x">
                                            <div className="pr-4">
                                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Answer</div>
                                              <div className="text-2xl font-black text-gray-800">
                                                {currentAnswer?.answer ?? <span className="text-gray-300 text-lg italic">Empty</span>}
                                              </div>
                                            </div>
                                            <div className="pl-4">
                                              <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Correct Key</div>
                                              <div className="text-2xl font-black text-green-600">
                                                {currentQuestion?.correct || (currentQuestion as any)?.answer || "N/A"}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Correct Answer (Non-MCQ or if options missing) */}
                                  {(currentQuestion?.type !== 'mcq' || !currentQuestion?.options) && (currentQuestion?.modelAnswer || currentQuestion?.correct) && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                                      <h5 className="font-semibold text-green-800 mb-1 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Correct / Model Answer:
                                      </h5>
                                      <div className="text-green-900 text-sm md:text-base">
                                        <UniversalMathJax key={currentQuestion?.id} dynamic>{cleanupMath(currentQuestion?.modelAnswer || String(currentQuestion?.correct))}</UniversalMathJax>
                                      </div>
                                    </div>
                                  )}

                                  {/* Explanation */}
                                  {currentQuestion?.explanation && (
                                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded">
                                      <h5 className="font-semibold text-blue-800 mb-1 flex items-center gap-2">
                                        <div className="bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold text-blue-800">i</div>
                                        Explanation:
                                      </h5>
                                      <div className="text-blue-900 text-xs md:text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                                        <UniversalMathJax key={currentQuestion?.id} dynamic>
                                          {cleanupMath(renderDynamicExplanation(
                                            currentQuestion?.explanation?.replace(/^(\*\*Explanation:\*\*|Explanation:)\s*/i, '') || "",
                                            currentQuestion?.leftColumn || currentQuestion?.options || [],
                                            currentQuestion?.type || "unknown",
                                            currentQuestion?.rightColumn || []
                                          ))}
                                        </UniversalMathJax>
                                      </div>
                                    </div>
                                  )}
                                </div>



                                {/* Grading */}
                                <div>
                                  <h4 className="font-semibold mb-2">Grading:</h4>
                                  <div className="flex items-center gap-4">
                                    {['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric'].includes(currentQuestion?.type?.toLowerCase() || '') ? (
                                      <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-gray-600">Auto-graded:</span>
                                          <Badge className={
                                            getAutoScore(currentQuestion, currentAnswer) > 0
                                              ? 'bg-green-100 text-green-800'
                                              : getAutoScore(currentQuestion, currentAnswer) < 0
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-orange-100 text-orange-800'
                                          }>
                                            {getAutoScore(currentQuestion, currentAnswer)} / {currentQuestion?.marks}
                                            {getAutoScore(currentQuestion, currentAnswer) < 0 && <span className="ml-1 text-xs opacity-70">(−ve)</span>}
                                          </Badge>
                                        </div>

                                        {/* No manual override for objective types per user request */}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">Quick Global Grade:</span>
                                            <span className="text-xs text-gray-500">/ {currentQuestion?.marks}</span>
                                          </div>
                                          {canEditMarks() ? (
                                            <Badge className="bg-green-100 text-green-800 text-[10px] py-0">✏️ Editable</Badge>
                                          ) : (
                                            <Badge className="bg-gray-100 text-gray-800 text-[10px] py-0">🔒 Locked</Badge>
                                          )}
                                        </div>

                                        {/* Quick-click buttons: Now visible for all manual types as a global override */}
                                        <div className="flex flex-wrap gap-2">
                                          {Array.from({ length: (currentQuestion?.marks || 0) + 1 }, (_, i) => i).map((mark) => {
                                            const currentMarks = currentStudent?.answers?.[`${currentQuestion?.id}_marks`] || 0;
                                            const isSelected = currentMarks === mark;

                                            return (
                                              <button
                                                key={mark}
                                                onClick={() => updateMarks(currentQuestion?.id, mark)}
                                                disabled={!canEditMarks()}
                                                className={`
                                                  px-4 py-2 rounded-lg font-semibold text-sm transition-all
                                                  ${isSelected
                                                    ? 'bg-indigo-600 text-white shadow-md scale-105 ring-2 ring-indigo-300'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                                                  }
                                                  ${!canEditMarks() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                                                  min-w-[3rem]
                                                `}
                                              >
                                                {mark}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {currentQuestion?.subQuestions && currentQuestion.subQuestions.length > 0 && (
                                          <p className="text-[10px] text-gray-400 italic">
                                            * Using these buttons will set a global mark. Individual part marks will still be calculated if provided.
                                          </p>
                                        )}

                                        {/* Current marks display (Sum for descriptive/CQ sub-questions) */}
                                        <div className="flex items-center gap-2 text-sm border-t pt-2 mt-1">
                                          <span className="text-gray-600 font-medium">Final Question Score:</span>
                                          {(() => {
                                            let subTotal = 0;
                                            let hasSubMarks = false;
                                            if (currentQuestion?.subQuestions) {
                                              currentQuestion.subQuestions.forEach((_: any, idx: number) => {
                                                // Check both desc and sub prefixes
                                                const m = (currentStudent?.answers?.[`${currentQuestion.id}_desc_${idx}_marks`] ?? currentStudent?.answers?.[`${currentQuestion.id}_sub_${idx}_marks`]);
                                                if (typeof m === 'number') {
                                                  subTotal += m;
                                                  hasSubMarks = true;
                                                }
                                              });
                                            }

                                            const globalMark = currentStudent?.answers?.[`${currentQuestion?.id}_marks`] || 0;
                                            const finalMarks = hasSubMarks ? subTotal : globalMark;

                                            return (
                                              <div className="flex items-center gap-2">
                                                <Badge className={
                                                  finalMarks === currentQuestion?.marks
                                                    ? 'bg-green-100 text-green-800'
                                                    : finalMarks === 0
                                                      ? 'bg-red-100 text-red-800'
                                                      : 'bg-yellow-100 text-yellow-800'
                                                }>
                                                  {finalMarks} / {currentQuestion?.marks}
                                                </Badge>
                                                {hasSubMarks && globalMark > 0 && (
                                                  <span className="text-[9px] text-gray-400">(Sub-marks prioritize over global {globalMark})</span>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (Array.isArray(currentAnswer) && (currentAnswer?.length || 0) > 0) {
                                        const firstImg = currentAnswer?.[0];
                                        const imgSrc = typeof firstImg === 'string' ? firstImg : (firstImg?.preview || firstImg?.url || firstImg?.src || "");
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
                                    className="mt-4"
                                  >
                                    <PenTool className="h-4 w-4 mr-2" />
                                    Draw on Answer
                                  </Button>

                                  {/* Review Period Mark Editing Notice */}
                                  {(() => {
                                    const studentReview = (reviewRequests || [])?.find(r => r?.studentId === currentStudent?.student?.id);
                                    if (studentReview && (studentReview?.status === 'PENDING' || studentReview?.status === 'UNDER_REVIEW')) {
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
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed border-border opacity-60">
                                <FileSearch className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                                <h3 className="text-lg font-semibold text-foreground/70">Question data unavailable</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                  The question content could not be loaded for the current selection. Try refreshing or selecting a different filter.
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-2xl border border-dashed border-border min-h-[400px]">
                      <User className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                      <h3 className="text-xl font-bold text-foreground/70 tracking-tight">No student selected</h3>
                      <p className="text-muted-foreground text-sm max-w-[250px] text-center mt-2">
                        Please select a student from the sidebar to begin evaluation.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-2xl border border-dashed border-border min-h-[400px]">
                    <FileSearch className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-foreground/70 tracking-tight">No matching questions</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px] text-center mt-2">
                      No questions of type <span className="font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">{questionTypeFilter.toUpperCase()}</span> were found for this exam.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setQuestionTypeFilter('all')} className="mt-6 rounded-xl">
                      Show All Questions
                    </Button>
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
                          const currentAnswer = currentStudent?.answers?.[currentQuestion?.id || ''];
                          const imageCount = (currentAnswer?.length || 0);

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
                                      const newImg = currentAnswer?.[newIndex];
                                      const newImgSrc = typeof newImg === 'string' ? newImg : (newImg?.preview || newImg?.url || newImg?.src || "");
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
                                      const newImg = currentAnswer?.[newIndex];
                                      const newImgSrc = typeof newImg === 'string' ? newImg : (newImg?.preview || newImg?.url || newImg?.src || "");
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
                              const touch = e?.touches?.[0];
                              const mouseEvent = new MouseEvent('mousedown', {
                                clientX: touch?.clientX || 0,
                                clientY: touch?.clientY || 0
                              });
                              startDrawing(mouseEvent as any);
                            }}
                            onTouchMove={(e) => {
                              e.preventDefault();
                              if (isDrawing) {
                                const touch = e?.touches?.[0];
                                const mouseEvent = new MouseEvent('mousemove', {
                                  clientX: touch?.clientX || 0,
                                  clientY: touch?.clientY || 0
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
                      {(reviewRequests || [])?.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No review requests found for this exam.
                        </div>
                      ) : (
                        (reviewRequests || [])?.map((request) => (
                          <Card key={request.id} className="border-l-4 border-yellow-400">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-lg">
                                    {request?.student?.name} ({request?.student?.roll})
                                  </CardTitle>
                                  <div className="text-sm text-gray-600">
                                    Requested on: {new Date(request?.requestedAt || 0).toLocaleString()}
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
                                      const studentIndex = (exam?.submissions?.findIndex(s => s?.student?.id === request.studentId) ?? -1);
                                      if (studentIndex !== -1) {
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
                                      const studentIndex = (exam?.submissions?.findIndex(s => s?.student?.id === request.studentId) ?? -1);
                                      if (studentIndex !== -1) {
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
                              {selectedReview?.studentComment}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Requested by: {selectedReview?.student?.name} ({selectedReview?.student?.roll})
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

          <Dialog open={isAnnotationOpen} onOpenChange={setIsAnnotationOpen}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 border-none bg-transparent shadow-none">
              {activeAnnotationImage && (
                <DrawingCanvas
                  backgroundImage={activeAnnotationImage || ''}
                  onSave={handleSaveAnnotation}
                  onCancel={() => setIsAnnotationOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      </MathJaxContext>
    </div>
  );
}
