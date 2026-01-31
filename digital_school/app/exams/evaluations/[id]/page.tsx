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
  Printer,
  Menu,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { cleanupMath } from "@/lib/utils";
import DrawingCanvas from "@/app/components/DrawingCanvas";

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

  // Monitor View State
  const [monitorSearch, setMonitorSearch] = useState("");
  const [monitorFilter, setMonitorFilter] = useState<'all' | 'active' | 'submitted'>('all');
  const [monitorSort, setMonitorSort] = useState<'progress' | 'score' | 'time'>('progress');
  const [monitorViewMode, setMonitorViewMode] = useState<'grid' | 'list'>('grid');

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

  // Annotation State
  const [isAnnotationOpen, setIsAnnotationOpen] = useState(false);
  const [activeAnnotationImage, setActiveAnnotationImage] = useState<string | null>(null);
  const [activeAnnotationOriginal, setActiveAnnotationOriginal] = useState<string | null>(null);
  const [activeAnnotationMeta, setActiveAnnotationMeta] = useState<{ questionId: string; index: number; studentId: string } | null>(null);

  // Store all annotations for the current student: key = "questionId_imageIndex", value = annotated image URL
  const [annotations, setAnnotations] = useState<Record<string, string>>({});

  const openAnnotation = (imageUrl: string, questionId: string, index: number = 0, studentId: string) => {
    console.log("Opening annotation for:", { questionId, index, studentId });

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
        console.log(`[Annotations] Loaded ${Object.keys(annotationMap).length} annotations for student ${studentId}`);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
        <p>Connecting to live exam feed...</p>
      </div>
    );

    const { liveData, activeStudents, submittedStudents, totalStudents } = liveStats;

    // Filter and Sort Logic
    let filteredData = liveData.filter(student => {
      const matchesSearch = student.studentName.toLowerCase().includes(monitorSearch.toLowerCase()) ||
        student.roll.includes(monitorSearch);
      const matchesFilter = monitorFilter === 'all'
        ? true
        : monitorFilter === 'active'
          ? student.status === 'IN_PROGRESS'
          : student.status === 'COMPLETED';
      return matchesSearch && matchesFilter;
    });

    filteredData = filteredData.sort((a, b) => {
      if (monitorSort === 'progress') return b.progress - a.progress;
      if (monitorSort === 'score') return b.score - a.score;
      if (monitorSort === 'time') return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      return 0;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Modern Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-none shadow-md shadow-blue-100/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Now</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-blue-600">{activeStudents}</p>
                  <span className="text-xs text-blue-400 font-medium">students</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-md shadow-green-100/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Submitted</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-600">{submittedStudents}</p>
                  <span className="text-xs text-green-400 font-medium">finished</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-md shadow-purple-100/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-purple-600">
                    {totalStudents > 0 ? Math.round((submittedStudents / totalStudents) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-md shadow-gray-100/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-700">{totalStudents}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Input
                placeholder="Search student..."
                value={monitorSearch}
                onChange={(e) => setMonitorSearch(e.target.value)}
                className="pl-9 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
              <ZoomIn className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>

            <Select value={monitorFilter} onValueChange={(v: any) => setMonitorFilter(v)}>
              <SelectTrigger className="w-[140px] h-10 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Now</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monitorSort} onValueChange={(v: any) => setMonitorSort(v)}>
              <SelectTrigger className="w-[140px] h-10 bg-gray-50 border-gray-200">
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
            <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${monitorViewMode === 'grid' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                onClick={() => setMonitorViewMode('grid')}
              >
                <LayoutDashboard className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${monitorViewMode === 'list' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
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
        {monitorViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredData.map(student => (
              <Card
                key={student.id}
                className={`cursor-pointer group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
                  ${student.status === 'IN_PROGRESS'
                    ? 'border-l-4 border-l-blue-500'
                    : 'border-l-4 border-l-green-500 bg-green-50/10'}`}
                onClick={() => {
                  setSelectedLiveStudent(student);
                  setIsLiveModalOpen(true);
                }}
              >
                <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4 text-gray-400" />
                </div>

                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md
                        ${student.status === 'IN_PROGRESS'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                      {student.studentName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{student.studentName}</p>
                      <p className="text-xs text-gray-500 font-mono">Roll: {student.roll}</p>
                    </div>
                  </div>

                  {/* Stats Grid inside Card */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="text-gray-400 block mb-1">Answered</span>
                      <span className="font-semibold text-gray-700">{student.answered} / {student.totalQuestions}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="text-gray-400 block mb-1">Score</span>
                      <span className="font-semibold text-primary">{student.score}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-500">Progress</span>
                      <span className={student.progress === 100 ? "text-green-600" : "text-blue-600"}>{student.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end
                           ${student.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`}
                        style={{ width: `${student.progress}%` }}
                      >
                        {/* Shimmer effect */}
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex justify-between items-center text-[11px]">
                    <Badge variant="outline" className={`border-none ${student.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {student.status === 'IN_PROGRESS' ? '● In Progress' : '✓ Client-Submitted'}
                    </Badge>
                    <span className="text-gray-400">
                      {new Date(student.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Student</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3">Progress</div>
              <div className="col-span-2 text-center">Score</div>
              <div className="col-span-1">Action</div>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredData.map(student => (
                <div key={student.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                           ${student.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`}>
                      {student.studentName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{student.studentName}</p>
                      <p className="text-xs text-gray-500">Roll: {student.roll} • {student.className}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Badge variant="secondary" className={`${student.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {student.status === 'IN_PROGRESS' ? 'Working' : 'Submitted'}
                    </Badge>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${student.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${student.progress}%` }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{student.progress}%</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-sm font-medium">
                    {student.score}
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedLiveStudent(student); setIsLiveModalOpen(true); }}>
                      <Maximize2 className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


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
                                <MathJax inline>{cleanupMath(q.text)}</MathJax>
                              </div>

                              {hasAnswer ? (
                                <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                                  <p className="text-xs font-semibold text-gray-500 mb-1">Student Answer:</p>
                                  <div className="text-sm font-medium text-blue-800">
                                    <MathJax inline>{cleanupMath(String(ans))}</MathJax>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2 text-xs text-gray-400 italic">Not answered yet</div>
                              )}

                              {/* Show options if MCQ */}
                              {q.type === 'mcq' && q.options && <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt: any, i: number) => {
                                  const isSelected = hasAnswer && String(ans) === (opt.text || String(opt));
                                  const isCorrect = opt.isCorrect;
                                  return (
                                    <div key={i} className={`text-xs p-2 rounded border ${isSelected ? 'bg-blue-100 border-blue-300' :
                                      isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                      }`}>
                                      <div className="flex items-start">
                                        <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                                        <div className="flex-1">
                                          <MathJax inline>{cleanupMath(opt.text || String(opt))}</MathJax>
                                          {opt.image && (
                                            <div className="mt-1">
                                              <img src={opt.image} alt="Option" className="max-h-20 rounded border bg-white object-contain" />
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

  // Fetch annotations when student changes
  useEffect(() => {
    if (currentStudent?.student.id) {
      fetchAnnotations(currentStudent.student.id);
    }
  }, [currentStudent?.student.id]);

  // Helper function to get the correct image URL (annotated if exists, original otherwise)
  const getImageUrl = (originalUrl: string, questionId: string, imageIndex: number) => {
    const key = `${questionId}_${imageIndex}`;
    return annotations[key] || originalUrl;
  };

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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
                                            (a{String.fromCharCode(97 + idx)}) <MathJax inline dynamic>{subQ.questionText || subQ.text || subQ.question || ''}</MathJax>
                                            {subQ.image && (
                                              <div className="mt-1 block">
                                                <img src={subQ.image} alt="Sub-question" className="max-h-24 rounded border bg-white object-contain" />
                                              </div>
                                            )}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {subQ.marks || 1} mark{subQ.marks > 1 ? 's' : ''}
                                          </span>
                                        </div>
                                        {subQ.modelAnswer && (
                                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                            <strong>Model Answer:</strong> <MathJax inline dynamic>{subQ.modelAnswer}</MathJax>
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
                                    <div className="space-y-6">
                                      {/* Main Answer (SQ) or Intro (CQ) */}
                                      {currentAnswer && typeof currentAnswer === 'string' && (
                                        <div>
                                          <div className="text-xs font-semibold text-gray-500 mb-1">Text Answer:</div>
                                          <div className="whitespace-pre-wrap"><MathJax>{currentAnswer}</MathJax></div>
                                        </div>
                                      )}

                                      {/* Main Images (SQ) - Support both single and multiple */}
                                      {(() => {
                                        const singleImage = currentStudent?.answers[`${currentQuestion.id}_image`];
                                        const multipleImages = currentStudent?.answers[`${currentQuestion.id}_images`] || [];
                                        const allImages = singleImage ? [singleImage, ...multipleImages] : multipleImages;

                                        return allImages.length > 0 ? (
                                          <div>
                                            <div className="text-xs font-semibold text-gray-500 mb-1">
                                              Attachments ({allImages.length}):
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                              {allImages.map((imgUrl: string, imgIdx: number) => {
                                                const displayUrl = getImageUrl(imgUrl, currentQuestion.id, imgIdx);
                                                const hasAnnotation = displayUrl !== imgUrl;
                                                return (
                                                  <div key={imgIdx} className="relative inline-block group">
                                                    <img
                                                      src={displayUrl}
                                                      alt={`Answer Attachment ${imgIdx + 1}`}
                                                      crossOrigin="anonymous"
                                                      className="h-32 w-32 rounded border bg-white object-cover cursor-pointer transition-transform hover:scale-105"
                                                      onClick={() => openAnnotation(imgUrl, currentQuestion.id, imgIdx, currentStudent.student.id)}
                                                    />
                                                    <button
                                                      onClick={() => openAnnotation(imgUrl, currentQuestion.id, imgIdx, currentStudent.student.id)}
                                                      className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-indigo-50 text-indigo-600"
                                                    >
                                                      <PenTool className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                                      {imgIdx + 1}/{allImages.length}
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
                                      {currentQuestion.type === 'cq' && currentQuestion.subQuestions && (
                                        <div className="space-y-4 border-t pt-4 mt-2">
                                          <h5 className="font-medium text-gray-700">Sub-question Answers:</h5>
                                          {currentQuestion.subQuestions.map((subQ: any, idx: number) => {
                                            const subKey = `${currentQuestion.id}_sub_${idx}`;
                                            const subText = currentStudent?.answers?.[subKey];
                                            const subImg = currentStudent?.answers?.[`${subKey}_image`];

                                            if (!subText && !subImg) return (
                                              <div key={idx} className="text-sm text-gray-400 italic pl-2 border-l-2 border-transparent">
                                                (Sub-question {idx + 1} not answered)
                                              </div>
                                            );

                                            return (
                                              <div key={idx} className="pl-4 border-l-2 border-indigo-100">
                                                <div className="text-sm font-semibold text-gray-600 mb-1">Sub-question {idx + 1}</div>
                                                <div className="mb-2 text-gray-800"><MathJax dynamic>{subText}</MathJax></div>
                                                {(() => {
                                                  const singleImg = currentStudent?.answers?.[`${subKey}_image`];
                                                  const multipleImgs = currentStudent?.answers?.[`${subKey}_images`] || [];
                                                  const allSubImages = singleImg ? [singleImg, ...multipleImgs] : multipleImgs;

                                                  return allSubImages.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                      {allSubImages.map((imgUrl: string, imgIdx: number) => {
                                                        const questionIndex = idx * 100 + imgIdx;
                                                        const displayUrl = getImageUrl(imgUrl, currentQuestion.id, questionIndex);
                                                        const hasAnnotation = displayUrl !== imgUrl;

                                                        return (
                                                          <div key={imgIdx} className="relative inline-block group">
                                                            <img
                                                              src={displayUrl}
                                                              alt={`Sub ${idx + 1} Image ${imgIdx + 1}`}
                                                              crossOrigin="anonymous"
                                                              className="h-24 w-24 rounded border bg-white object-cover cursor-pointer hover:scale-105 transition-transform"
                                                              onClick={() => openAnnotation(imgUrl, currentQuestion.id, questionIndex, currentStudent.student.id)}
                                                            />
                                                            <button
                                                              onClick={() => openAnnotation(imgUrl, currentQuestion.id, questionIndex, currentStudent.student.id)}
                                                              className="absolute top-1 right-1 bg-white/90 p-1 rounded-full shadow-sm hover:bg-indigo-50 text-indigo-600"
                                                            >
                                                              <PenTool className="w-3 h-3" />
                                                            </button>
                                                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded">
                                                              {imgIdx + 1}/{allSubImages.length}
                                                            </div>
                                                            {hasAnnotation && (
                                                              <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] px-1 py-0.5 rounded-br font-semibold shadow-sm z-10 pointer-events-none">
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
                                                <div className="flex-1">
                                                  <span className={isCorrect ? "font-medium text-green-900" : isSelected ? "text-red-900" : ""}>
                                                    <MathJax inline dynamic>{optText}</MathJax>
                                                  </span>
                                                  {opt.image && (
                                                    <div className="mt-1">
                                                      <img src={opt.image} alt="Option" className="max-h-24 rounded border bg-white object-contain" />
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
          </Tabs >
        </div >
      </div >

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
    </MathJaxContext >
  );
}
