"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityTab } from "./ActivityTab";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  Eye,
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  Zap,
  Timer,
  Search,
  RefreshCw,
  Copy,
  Check,
  Award,
  ChevronRight,
  Activity,
  Filter,
  Layers,
  Sparkles,
  SlidersHorizontal,
  X,
  Radio,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { verifyAdminAction } from "@/lib/native/auth";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";
import { copyToClipboard } from "@/lib/native/interaction";

export interface Exam {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  type: string;
  totalMarks: number;
  passMarks?: number;
  isActive: boolean;
  class: {
    id?: string;
    name: string;
    section: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  totalStudents: number;
  submittedStudents: number;
  publishedResults: number;
  evaluationAssignments: Array<{
    id: string;
    status: string;
    evaluator: {
      name: string;
      email: string;
      role: string;
    };
    assignedBy: {
      name: string;
      email: string;
    };
    notes?: string;
  }>;
  status: string;
  timingState?: "live" | "upcoming" | "finished";
  startTimestamp?: number;
  endTimestamp?: number;
  mcqNegativeMarking?: number;
  mcNegativeMarking?: number;
}

interface Evaluator {
  id: string;
  name: string;
  email: string;
  role: string;
  teacherProfile?: {
    department: string;
    subjects: string[];
  };
}

type TimingFilter = "ALL" | "LIVE" | "UPCOMING" | "PASSED";
type SortOption = "priority_asc" | "date_asc" | "date_desc" | "name_asc" | "submissions_desc";

function getExamTiming(exam: Exam): { start: Date; end: Date } {
  let start: Date;
  let end: Date;

  if (exam.startTime && !isNaN(new Date(exam.startTime).getTime())) {
    start = new Date(exam.startTime);
  } else if (exam.date && !isNaN(new Date(exam.date).getTime())) {
    start = new Date(exam.date);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date();
  }

  if (exam.endTime && !isNaN(new Date(exam.endTime).getTime())) {
    end = new Date(exam.endTime);
  } else if (exam.duration && exam.duration > 0 && exam.startTime && !isNaN(new Date(exam.startTime).getTime())) {
    end = new Date(new Date(exam.startTime).getTime() + exam.duration * 60000);
  } else if (exam.date && !isNaN(new Date(exam.date).getTime())) {
    end = new Date(exam.date);
    end.setHours(23, 59, 59, 999);
  } else {
    end = new Date(start.getTime() + 60 * 60000);
  }

  return { start, end };
}

function getExamStatus(exam: Exam, now: Date): "live" | "upcoming" | "finished" {
  const { start, end } = getExamTiming(exam);
  if (now < start) return "upcoming";
  if (now > end) return "finished";
  return "live";
}

function formatTimeRemaining(diffMs: number): string {
  if (diffMs <= 0) return "0s";
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function getLiveCountdown(start: Date, end: Date, now: Date): { text: string; state: "live" | "upcoming" | "ended" } {
  const startDiff = start.getTime() - now.getTime();
  const endDiff = end.getTime() - now.getTime();

  if (now < start) {
    if (startDiff <= 0) return { text: "Starting now", state: "upcoming" };
    return { text: `Starts in ${formatTimeRemaining(startDiff)}`, state: "upcoming" };
  }

  if (now >= start && now <= end) {
    if (endDiff <= 0) return { text: "Ending now", state: "live" };
    return { text: `Ends in ${formatTimeRemaining(endDiff)}`, state: "live" };
  }

  return { text: "Ended", state: "ended" };
}

function formatExamTimingDisplay(start: Date, end: Date) {
  const isSameDay = start.toDateString() === end.toDateString();
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const startTimeStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTimeStr = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isSameDay) {
    return `${dateStr} • ${startTimeStr} – ${endTimeStr}`;
  }
  const endDateStr = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${dateStr} ${startTimeStr} – ${endDateStr} ${endTimeStr}`;
}

export default function EvaluationsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("evaluations_cache_v1");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("evaluations_cache_v1");
        if (cached && JSON.parse(cached).length > 0) return false;
      } catch {}
    }
    return true;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  // Filters
  const [selectedTiming, setSelectedTiming] = useState<TimingFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("priority_asc");
  const [showFilters, setShowFilters] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);

  // Dialog State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Real-time 1s tick for active countdowns and smooth status transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut for search ('/' to focus, 'Escape' to clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search Debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchName);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchName]);

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(ImpactStyle.Light);
    await copyToClipboard(id);
    setCopiedId(id);
    toast.success("Exam ID copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchExams = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent && exams.length === 0) setLoading(true);
      setRefreshing(true);

      const queryParams = new URLSearchParams();
      queryParams.append("limit", "500");

      const response = await fetch(`/api/exams/evaluations?${queryParams.toString()}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        const examList = data.allExams || data.exams || [];
        setExams(examList);
        try {
          sessionStorage.setItem("evaluations_cache_v1", JSON.stringify(examList));
        } catch {}
      } else {
        if (!isSilent) toast.error("Failed to fetch exams");
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      if (!isSilent) toast.error("Failed to fetch exams");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [exams.length]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchEvaluators = async () => {
    try {
      const response = await fetch("/api/evaluators", {
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        const data = await response.json();
        setEvaluators(data || []);
      }
    } catch (error) {
      console.error("Error fetching evaluators:", error);
    }
  };

  // Parallelized 0-second initialization
  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([
        fetchExams(true),
        fetchClasses(),
        (async () => {
          try {
            const response = await fetch("/api/user", {
              credentials: "include",
              headers: { "Content-Type": "application/json" }
            });
            if (response.ok) {
              const userData = await response.json();
              const user = userData.user || userData.data?.user;
              const superUser = user?.role === "SUPER_USER";
              const admin = user?.role === "ADMIN";
              setIsSuperUser(superUser);
              setIsAdmin(admin);
              if (superUser || admin) {
                fetchEvaluators();
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        })()
      ]);
    };

    init();
  }, [fetchExams]);

  const assignEvaluator = async () => {
    if (!selectedExam || !selectedEvaluator) {
      toast.error("Please select an exam and evaluator");
      return;
    }

    try {
      const response = await fetch("/api/exams/evaluations/assign", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam.id,
          evaluatorId: selectedEvaluator,
          notes: assignmentNotes
        })
      });

      if (response.ok) {
        const evalObj = evaluators.find((e) => e.id === selectedEvaluator);

        setExams((prev) =>
          prev.map((exam) => {
            if (exam.id === selectedExam.id) {
              const newAssignment = {
                id: Date.now().toString(),
                status: "PENDING",
                evaluator: {
                  name: evalObj?.name || "Assigned Evaluator",
                  email: evalObj?.email || "",
                  role: evalObj?.role || ""
                },
                assignedBy: { name: "You", email: "" },
                notes: assignmentNotes
              };
              return {
                ...exam,
                status: "PENDING",
                evaluationAssignments: [...(exam.evaluationAssignments || []), newAssignment]
              };
            }
            return exam;
          })
        );

        const data = await response.json();
        toast.success(data.message || "Evaluator assigned successfully");
        setAssignDialogOpen(false);
        setSelectedExam(null);
        setSelectedEvaluator("");
        setAssignmentNotes("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign evaluator");
      }
    } catch (error) {
      console.error("Error assigning evaluator:", error);
      toast.error("Failed to assign evaluator");
    }
  };

  const releaseResults = async (examId: string) => {
    try {
      const confirmed = await verifyAdminAction("Release Exam Results");
      if (!confirmed) return;

      const response = await fetch("/api/exams/evaluations/release-results", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId })
      });

      if (response.ok) {
        setExams((prev) =>
          prev.map((exam) =>
            exam.id === examId ? { ...exam, publishedResults: exam.submittedStudents } : exam
          )
        );

        const data = await response.json();
        toast.success(data.message || "Results published successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to release results");
      }
    } catch (error) {
      console.error("Error releasing results:", error);
      toast.error("Failed to release results");
    }
  };

  // Real-time counts across timing categories and evaluation status
  const stats = useMemo(() => {
    let liveCount = 0;
    let upcomingCount = 0;
    let passedCount = 0;
    let pendingGradingCount = 0;
    let completedCount = 0;

    exams.forEach((exam) => {
      const st = getExamStatus(exam, now);
      if (st === "live") liveCount++;
      else if (st === "upcoming") upcomingCount++;
      else passedCount++;

      if (exam.status === "PENDING" || exam.status === "IN_PROGRESS" || exam.status === "UNASSIGNED") {
        if (exam.submittedStudents > 0 && exam.publishedResults === 0) {
          pendingGradingCount++;
        }
      }
      if (exam.status === "COMPLETED" || exam.status === "APPROVED" || exam.publishedResults > 0) {
        completedCount++;
      }
    });

    return {
      total: exams.length,
      live: liveCount,
      upcoming: upcomingCount,
      passed: passedCount,
      pendingGrading: pendingGradingCount,
      completed: completedCount
    };
  }, [exams, now]);

  // Main Filtering and Exact Sorting
  const filteredAndSortedExams = useMemo(() => {
    let list = exams.filter((exam) => {
      // Search filter
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const matchesName = exam.name?.toLowerCase().includes(q);
        const matchesDesc = exam.description?.toLowerCase().includes(q);
        const matchesClass = exam.class?.name?.toLowerCase().includes(q);
        const matchesSection = exam.class?.section?.toLowerCase().includes(q);
        const matchesCreator = exam.createdBy?.name?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesClass && !matchesSection && !matchesCreator) {
          return false;
        }
      }

      // Class filter
      if (selectedClass !== "ALL") {
        if (exam.class?.id !== selectedClass && (exam as any).classId !== selectedClass) {
          return false;
        }
      }

      // Evaluation Status filter
      if (selectedStatus !== "ALL") {
        if (exam.status !== selectedStatus) {
          return false;
        }
      }

      // Timing filter
      if (selectedTiming !== "ALL") {
        const examTimingState = getExamStatus(exam, now);
        if (selectedTiming === "LIVE" && examTimingState !== "live") return false;
        if (selectedTiming === "UPCOMING" && examTimingState !== "upcoming") return false;
        if (selectedTiming === "PASSED" && examTimingState !== "finished") return false;
      }

      return true;
    });

    // Exact Sorting Specification:
    // 1. Live exams first (Rank 0: ending date not passed, start date reached)
    // 2. Upcoming exams second (Rank 1: start date not reached)
    // 3. Passed / Finished exams last (Rank 2: ending date passed)
    // Within EACH category: Date Ascending order (earliest start first)
    list.sort((a, b) => {
      const timingA = getExamTiming(a);
      const timingB = getExamTiming(b);
      const startA = timingA.start.getTime();
      const startB = timingB.start.getTime();
      const endA = timingA.end.getTime();
      const endB = timingB.end.getTime();

      if (sortOption === "priority_asc") {
        const getRank = (exam: Exam, start: number, end: number) => {
          const nowMs = now.getTime();
          if (nowMs >= start && nowMs <= end) return 0; // Live
          if (nowMs < start) return 1; // Upcoming
          return 2; // Passed / Ended
        };

        const rankA = getRank(a, startA, endA);
        const rankB = getRank(b, startB, endB);

        if (rankA !== rankB) {
          return rankA - rankB; // 0 (Live) -> 1 (Upcoming) -> 2 (Passed)
        }

        // Within same timing bucket: Date Ascending!
        if (startA !== startB) return startA - startB;
        if (endA !== endB) return endA - endB;
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortOption === "date_asc") {
        if (startA !== startB) return startA - startB;
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortOption === "date_desc") {
        if (startA !== startB) return startB - startA;
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortOption === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }

      if (sortOption === "submissions_desc") {
        if (b.submittedStudents !== a.submittedStudents) {
          return b.submittedStudents - a.submittedStudents;
        }
        return startA - startB;
      }

      return startA - startB;
    });

    return list;
  }, [exams, debouncedSearch, selectedClass, selectedStatus, selectedTiming, sortOption, now]);

  // Pagination Slice
  const totalCount = filteredAndSortedExams.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedExams = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredAndSortedExams.slice(startIdx, startIdx + pageSize);
  }, [filteredAndSortedExams, currentPage, pageSize]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Pending",
          className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: <Clock className="h-3.5 w-3.5" />
        };
      case "IN_PROGRESS":
        return {
          label: "In Progress",
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          icon: <AlertCircle className="h-3.5 w-3.5" />
        };
      case "COMPLETED":
        return {
          label: "Completed",
          className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: <CheckCircle className="h-3.5 w-3.5" />
        };
      case "APPROVED":
        return {
          label: "Approved",
          className: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
          icon: <CheckCircle className="h-3.5 w-3.5" />
        };
      case "REJECTED":
        return {
          label: "Rejected",
          className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: <AlertCircle className="h-3.5 w-3.5" />
        };
      case "UNASSIGNED":
      default:
        return {
          label: "Unassigned",
          className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
          icon: <UserCheck className="h-3.5 w-3.5" />
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground pb-20">
      {/* Top Banner / Hero Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Award className="h-5 w-5" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                  Exam Evaluations & Management
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium pl-10 sm:pl-11">
                {isSuperUser
                  ? "Manage, assign evaluators, monitor live exams, and publish student results."
                  : "View assigned exam submissions, grade answer scripts, and track evaluation progress."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchExams(false)}
                disabled={refreshing}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold shadow-xs"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin text-blue-500" : ""}`} />
                Sync
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/exams")}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-semibold shadow-xs"
              >
                <BookOpen className="h-4 w-4 mr-1.5 text-indigo-500" />
                Exams Hub
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-semibold shadow-xs"
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5 text-slate-500" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div
            onClick={() => { setSelectedTiming("ALL"); setCurrentPage(1); }}
            className={`cursor-pointer group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
              selectedTiming === "ALL"
                ? "bg-blue-500/10 border-blue-500/30 shadow-md ring-2 ring-blue-500/20"
                : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Exams</span>
              <Layers className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black">{stats.total}</span>
              <span className="text-[11px] text-muted-foreground font-medium">All recorded</span>
            </div>
          </div>

          <div
            onClick={() => { setSelectedTiming("LIVE"); setCurrentPage(1); }}
            className={`cursor-pointer group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
              selectedTiming === "LIVE"
                ? "bg-emerald-500/10 border-emerald-500/30 shadow-md ring-2 ring-emerald-500/20"
                : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live Now</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.live}</span>
              <span className="text-[11px] text-muted-foreground font-medium">Ongoing</span>
            </div>
          </div>

          <div
            onClick={() => { setSelectedTiming("UPCOMING"); setCurrentPage(1); }}
            className={`cursor-pointer group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
              selectedTiming === "UPCOMING"
                ? "bg-indigo-500/10 border-indigo-500/30 shadow-md ring-2 ring-indigo-500/20"
                : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Upcoming</span>
              <Timer className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats.upcoming}</span>
              <span className="text-[11px] text-muted-foreground font-medium">Scheduled</span>
            </div>
          </div>

          <div
            onClick={() => { setSelectedStatus("PENDING"); setSelectedTiming("ALL"); setCurrentPage(1); }}
            className={`cursor-pointer group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
              selectedStatus === "PENDING"
                ? "bg-amber-500/10 border-amber-500/30 shadow-md ring-2 ring-amber-500/20"
                : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Needs Grading</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{stats.pendingGrading}</span>
              <span className="text-[11px] text-muted-foreground font-medium">Submissions ready</span>
            </div>
          </div>

          <div
            onClick={() => { setSelectedStatus("COMPLETED"); setSelectedTiming("ALL"); setCurrentPage(1); }}
            className={`cursor-pointer group col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
              selectedStatus === "COMPLETED"
                ? "bg-teal-500/10 border-teal-500/30 shadow-md ring-2 ring-teal-500/20"
                : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Completed</span>
              <CheckCircle className="h-4 w-4 text-teal-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">{stats.completed}</span>
              <span className="text-[11px] text-muted-foreground font-medium">Results released</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Manage Exams vs Live Activity) */}
        <Tabs defaultValue="manage" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
            <TabsList className="grid grid-cols-2 w-full sm:w-80 rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/40">
              <TabsTrigger
                value="manage"
                className="rounded-xl font-bold text-xs sm:text-sm shadow-none data-[state=active]:shadow-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 transition-all py-2"
              >
                Manage Exams
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-xl font-bold text-xs sm:text-sm shadow-none data-[state=active]:shadow-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 transition-all py-2 flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Live Activity
              </TabsTrigger>
            </TabsList>

            {isSuperUser && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/20">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                <span>Super User Management Console</span>
              </div>
            )}
          </div>

          <TabsContent value="manage" className="space-y-6 focus-visible:outline-none focus-visible:ring-0 pt-4">
            {/* Control Bar: Timing Pills, Search, Filters */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
              {/* Timing Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Button
                    variant={selectedTiming === "ALL" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedTiming("ALL"); setCurrentPage(1); }}
                    className={`rounded-xl font-bold text-xs h-8 px-3.5 transition-all ${
                      selectedTiming === "ALL"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    All ({stats.total})
                  </Button>
                  <Button
                    variant={selectedTiming === "LIVE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedTiming("LIVE"); setCurrentPage(1); }}
                    className={`rounded-xl font-bold text-xs h-8 px-3.5 transition-all ${
                      selectedTiming === "LIVE"
                        ? "bg-emerald-600 text-white shadow-emerald-600/30 shadow-md"
                        : "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    Live Now ({stats.live})
                  </Button>
                  <Button
                    variant={selectedTiming === "UPCOMING" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedTiming("UPCOMING"); setCurrentPage(1); }}
                    className={`rounded-xl font-bold text-xs h-8 px-3.5 transition-all ${
                      selectedTiming === "UPCOMING"
                        ? "bg-indigo-600 text-white shadow-indigo-600/30 shadow-md"
                        : "text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5 mr-1" />
                    Upcoming ({stats.upcoming})
                  </Button>
                  <Button
                    variant={selectedTiming === "PASSED" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedTiming("PASSED"); setCurrentPage(1); }}
                    className={`rounded-xl font-bold text-xs h-8 px-3.5 transition-all ${
                      selectedTiming === "PASSED"
                        ? "bg-slate-700 text-white shadow-slate-700/30 shadow-md"
                        : "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    Passed / Ended ({stats.passed})
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`rounded-xl font-semibold text-xs h-8 px-3 ${showFilters ? "bg-slate-100 dark:bg-slate-800 text-primary" : "text-muted-foreground"}`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                    Filters {selectedStatus !== "ALL" || selectedClass !== "ALL" ? "(Active)" : ""}
                  </Button>
                </div>
              </div>

              {/* Search & Main Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="relative w-full lg:col-span-2">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search exams by name, description, class, or creator... (Press '/' to focus)"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="pl-10 pr-9 py-2.5 w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-muted-foreground/60"
                  />
                  {searchName && (
                    <button
                      onClick={() => setSearchName("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort selector */}
                <Select value={sortOption} onValueChange={(val: SortOption) => { setSortOption(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm font-medium h-10">
                    <SelectValue placeholder="Sort Order" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="priority_asc">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">✨ Priority:</span> Live → Upcoming → Passed (Date Asc)
                    </SelectItem>
                    <SelectItem value="date_asc">📅 Date: Earliest First</SelectItem>
                    <SelectItem value="date_desc">📅 Date: Latest First</SelectItem>
                    <SelectItem value="submissions_desc">👥 Submissions: Most First</SelectItem>
                    <SelectItem value="name_asc">🔤 Title: A to Z</SelectItem>
                  </SelectContent>
                </Select>

                {/* Class selector */}
                <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm font-medium h-10">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="ALL">All Classes ({classes.length})</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filter Collapse */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">
                        Evaluation Status
                      </label>
                      <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}>
                        <SelectTrigger className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800/80 text-xs font-medium h-9">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="ALL">All Evaluation Statuses</SelectItem>
                          <SelectItem value="PENDING">Pending Evaluation</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                          <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">
                        Page Size
                      </label>
                      <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(parseInt(val)); setCurrentPage(1); }}>
                        <SelectTrigger className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800/80 text-xs font-medium h-9">
                          <SelectValue placeholder="Page Size" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="20">20 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                          <SelectItem value="500">Show All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchName("");
                          setSelectedClass("ALL");
                          setSelectedStatus("ALL");
                          setSelectedTiming("ALL");
                          setSortOption("priority_asc");
                          setCurrentPage(1);
                        }}
                        className="w-full rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-9"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="text-sm font-semibold text-muted-foreground animate-pulse">
                  Loading and sorting evaluations in real-time...
                </div>
              </div>
            )}

            {/* Exam Cards Grid */}
            {!loading && paginatedExams.length > 0 && (
              <div className="space-y-4">
                {paginatedExams.map((exam, index) => {
                  const timing = getExamTiming(exam);
                  const timingStatus = getExamStatus(exam, now);
                  const countdown = getLiveCountdown(timing.start, timing.end, now);
                  const evalBadge = getStatusBadge(exam.status);
                  const submissionPercent = exam.totalStudents > 0
                    ? Math.round((exam.submittedStudents / exam.totalStudents) * 100)
                    : 0;

                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                    >
                      <Card
                        className={`group relative overflow-hidden transition-all duration-300 border rounded-3xl ${
                          timingStatus === "live"
                            ? "bg-gradient-to-br from-white via-emerald-50/20 to-white dark:from-slate-900 dark:via-emerald-950/10 dark:to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/5 hover:border-emerald-500 hover:shadow-xl"
                            : timingStatus === "upcoming"
                            ? "bg-gradient-to-br from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/10 dark:to-slate-900 border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/60 hover:shadow-md"
                            : "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                        }`}
                      >
                        {/* Top Indicator Bar */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-1.5 ${
                            timingStatus === "live"
                              ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-pulse"
                              : timingStatus === "upcoming"
                              ? "bg-gradient-to-r from-indigo-500 to-blue-500"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        />

                        <CardContent className="p-5 sm:p-6 space-y-5">
                          {/* Top Row: Title, ID Copy, and Badges */}
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  className="text-lg sm:text-xl font-black text-foreground tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                  onClick={() => router.push(`/exams/evaluations/${exam.id}`)}
                                >
                                  {exam.name}
                                </h3>

                                <button
                                  onClick={(e) => handleCopyId(exam.id, e)}
                                  title="Click to copy exam ID"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                  {copiedId === exam.id ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                  <span>{exam.id.substring(0, 8)}...</span>
                                </button>
                              </div>

                              {exam.description && (
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                  {exam.description}
                                </p>
                              )}
                            </div>

                            {/* Status Tags */}
                            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                              {/* Timing Tag */}
                              {timingStatus === "live" && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-3 py-1 font-bold text-xs flex items-center gap-1.5 shadow-xs">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                  LIVE • {countdown.text}
                                </Badge>
                              )}

                              {timingStatus === "upcoming" && (
                                <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 px-3 py-1 font-bold text-xs flex items-center gap-1.5">
                                  <Timer className="h-3.5 w-3.5" />
                                  UPCOMING • {countdown.text}
                                </Badge>
                              )}

                              {timingStatus === "finished" && (
                                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 px-2.5 py-1 font-semibold text-xs">
                                  ENDED
                                </Badge>
                              )}

                              {/* Evaluation Status Badge */}
                              <Badge className={`${evalBadge.className} border px-3 py-1 font-bold text-xs flex items-center gap-1.5`}>
                                {evalBadge.icon}
                                {evalBadge.label}
                              </Badge>

                              {/* Type Badge */}
                              <Badge variant="outline" className="text-[11px] font-bold border-slate-200 dark:border-slate-800">
                                {exam.type}
                              </Badge>

                              {/* Super User Active/Inactive */}
                              {isSuperUser && (
                                <Badge
                                  className={
                                    exam.isActive
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200"
                                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200"
                                  }
                                >
                                  {exam.isActive ? "Active" : "Inactive"}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Middle Grid: Metrics & Information */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {/* Timing Info */}
                            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                  Date & Time
                                </span>
                                <span className="text-xs font-bold truncate block" title={formatExamTimingDisplay(timing.start, timing.end)}>
                                  {formatExamTimingDisplay(timing.start, timing.end)}
                                </span>
                              </div>
                            </div>

                            {/* Submissions & Progress */}
                            <div className="flex flex-col justify-center p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                  <Users className="h-3 w-3 text-blue-500" />
                                  Submissions
                                </span>
                                <span className="text-xs font-black text-foreground">
                                  {exam.submittedStudents} / {exam.totalStudents} ({submissionPercent}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    submissionPercent === 100
                                      ? "bg-emerald-500"
                                      : submissionPercent > 0
                                      ? "bg-blue-500"
                                      : "bg-slate-400"
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(4, submissionPercent))}%` }}
                                />
                              </div>
                            </div>

                            {/* Class Info */}
                            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                <LayoutDashboard className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                  Class Details
                                </span>
                                <span className="text-xs font-bold truncate block">
                                  {exam.class?.name || "All Classes"} {exam.class?.section ? `• ${exam.class.section}` : ""}
                                </span>
                              </div>
                            </div>

                            {/* Marks & Results */}
                            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                  Total Marks & Status
                                </span>
                                <span className="text-xs font-bold truncate block">
                                  {exam.totalMarks} Marks {exam.publishedResults > 0 ? `• ${exam.publishedResults} Published` : "• Unreleased"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Results Released Notice */}
                          {exam.publishedResults > 0 && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Results released for {exam.publishedResults} students.</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/exams/results/${exam.id}`)}
                                className="h-7 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 rounded-xl"
                              >
                                View Results Hub <ChevronRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            </div>
                          )}

                          {/* Evaluator Assignments */}
                          {exam.evaluationAssignments && exam.evaluationAssignments.length > 0 && (
                            <div className="bg-slate-50/60 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Assigned Evaluators ({exam.evaluationAssignments.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {exam.evaluationAssignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 px-3 py-1.5 rounded-xl text-xs"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px]">
                                      {assignment.evaluator?.name?.substring(0, 1) || "E"}
                                    </div>
                                    <span className="font-bold text-foreground">{assignment.evaluator?.name}</span>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold">
                                      {assignment.status}
                                    </Badge>
                                    {assignment.notes && (
                                      <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]" title={assignment.notes}>
                                        ({assignment.notes})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Footer */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                              <span>Created by <strong className="text-foreground">{exam.createdBy?.name || "Admin"}</strong></span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                              {/* View / Grade Button */}
                              {(!isAdmin || isSuperUser) && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => router.push(`/exams/evaluations/${exam.id}`)}
                                  className="rounded-xl font-bold text-xs h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95 transition-all flex-1 sm:flex-none"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                                  Evaluate Submissions {exam.submittedStudents > 0 ? `(${exam.submittedStudents})` : ""}
                                </Button>
                              )}

                              {/* Assign Evaluator for SuperUser/Admin */}
                              {(isSuperUser || isAdmin) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedExam(exam);
                                    setAssignDialogOpen(true);
                                  }}
                                  className="rounded-xl font-bold text-xs h-9 px-3.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 active:scale-95 transition-all flex-1 sm:flex-none"
                                >
                                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                  Assign Evaluator
                                </Button>
                              )}

                              {/* Release Results Button */}
                              {(isSuperUser || (exam.evaluationAssignments && exam.evaluationAssignments.some((a: any) => a.status === "COMPLETED"))) &&
                                exam.submittedStudents > 0 &&
                                exam.publishedResults === 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => releaseResults(exam.id)}
                                    className="rounded-xl font-bold text-xs h-9 px-3.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 active:scale-95 transition-all flex-1 sm:flex-none"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Release Results
                                  </Button>
                                )}

                              {/* Live Monitor Jump */}
                              {timingStatus === "live" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/api/exams/${exam.id}/live-monitor`)}
                                  className="rounded-xl font-bold text-xs h-9 px-3.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex-1 sm:flex-none"
                                >
                                  <Radio className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                                  Live Monitor
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Showing <strong className="text-foreground font-bold">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                  <strong className="text-foreground font-bold">{Math.min(currentPage * pageSize, totalCount)}</strong> of{" "}
                  <strong className="text-blue-600 dark:text-blue-400 font-bold">{totalCount}</strong> exams
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded-xl h-9 font-bold text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                        return (
                          <Button
                            key={p}
                            variant={currentPage === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setCurrentPage(p);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={`w-9 h-9 rounded-xl font-bold text-xs ${
                              currentPage === p
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                                : ""
                            }`}
                          >
                            {p}
                          </Button>
                        );
                      }
                      if (p === 2 || p === totalPages - 1) {
                        return (
                          <span key={p} className="px-1 text-slate-400 text-xs">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded-xl h-9 font-bold text-xs"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredAndSortedExams.length === 0 && (
              <div className="text-center py-20 bg-white/60 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-foreground">No matching exams found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                    Try clearing or adjusting your search term, timing status, or class filters.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchName("");
                    setSelectedClass("ALL");
                    setSelectedStatus("ALL");
                    setSelectedTiming("ALL");
                    setCurrentPage(1);
                  }}
                  className="rounded-xl font-bold text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Live Activity Tab */}
          <TabsContent value="activity" className="focus-visible:outline-none focus-visible:ring-0 pt-4">
            <ActivityTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Evaluator Modal */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              Assign Evaluator
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign an evaluator to grade submissions for <strong className="text-foreground">{selectedExam?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Select Evaluator
              </label>
              <Select value={selectedEvaluator} onValueChange={setSelectedEvaluator}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Choose an evaluator" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60">
                  {evaluators.map((evaluator) => (
                    <SelectItem key={evaluator.id} value={evaluator.id}>
                      {evaluator.name} ({evaluator.role}) {evaluator.email ? `• ${evaluator.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Special Instructions / Notes (Optional)
              </label>
              <Textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="E.g., Please evaluate MCQ sections and CQ subsection 2..."
                className="rounded-2xl resize-none text-xs"
                rows={3}
              />
            </div>
            <Button
              onClick={assignEvaluator}
              className="w-full rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 h-11"
            >
              Confirm Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
