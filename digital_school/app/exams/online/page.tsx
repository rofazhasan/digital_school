"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Calendar,
  Clock,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Play,
  CheckCircle2,
  Timer,
  LayoutGrid,
  ArrowLeft,
  Zap,
  XCircle,
  HourglassIcon,
  SlidersHorizontal,
  Search,
  X,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
} from "lucide-react";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

interface Exam {
  id: string;
  name: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  subject?: string;
  type: string;
  classId?: string;
  isActive?: boolean;
  allowRetake?: boolean;
}

interface Result {
  examId: string;
  total: number;
  grade?: string;
  rank?: number;
  isPublished: boolean;
}

interface ExamSubmission {
  examId: string;
  studentId: string;
  submittedAt?: string;
  score?: number;
  status?: "IN_PROGRESS" | "SUBMITTED";
  objectiveStatus?: string;
  cqSqStatus?: string;
  objectiveStartedAt?: string | Date | null;
  cqSqStartedAt?: string | Date | null;
  objectiveSubmittedAt?: string | Date | null;
  cqSqSubmittedAt?: string | Date | null;
}

type StatusFilter = "all" | "active" | "not_taken" | "upcoming" | "in_progress" | "completed" | "expired_not_taken";
type SortOption = "start_asc" | "end_asc" | "start_desc" | "name_asc";

const STATUS_CONFIGS: Record<StatusFilter, { label: string; icon: React.ElementType; color: string; bg: string; ring: string; dot?: string }> = {
  all: { label: "All Exams", icon: LayoutGrid, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800", ring: "ring-slate-300 dark:ring-slate-600" },
  active: { label: "Live Now", icon: Zap, color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-900/30", ring: "ring-indigo-300 dark:ring-indigo-700", dot: "bg-emerald-500 animate-pulse" },
  not_taken: { label: "Not Taken (Live)", icon: XCircle, color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-900/30", ring: "ring-rose-300 dark:ring-rose-700" },
  upcoming: { label: "Upcoming", icon: Timer, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-900/30", ring: "ring-blue-300 dark:ring-blue-700" },
  in_progress: { label: "In Progress", icon: HourglassIcon, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/30", ring: "ring-amber-300 dark:ring-amber-700" },
  completed: { label: "Taken", icon: CheckCircle2, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/30", ring: "ring-emerald-300 dark:ring-emerald-700" },
  expired_not_taken: { label: "Missed (Expired)", icon: HourglassIcon, color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-900/30", ring: "ring-orange-300 dark:ring-orange-700" },
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "start_asc", label: "Start Date: Earliest First" },
  { value: "end_asc", label: "Ending Soonest" },
  { value: "start_desc", label: "Start Date: Latest First" },
  { value: "name_asc", label: "Exam Title: A to Z" },
];

const CACHE_KEY = "online_exams_portal_cache_v2";

function loadFromLocalCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToLocalCache(data: { user: any; exams: Exam[]; results: Result[]; submissions: ExamSubmission[] }) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, cachedAt: Date.now() }));
  } catch {
    // Ignore quota errors
  }
}

const fetchUser = async () => {
  const res = await fetch("/api/user");
  if (!res.ok) return null;
  return res.json();
};

const fetchExams = async () => {
  const res = await fetch("/api/exams?summary=true&limit=500");
  if (!res.ok) return [];
  const result = await res.json();
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (result.data?.exams && Array.isArray(result.data.exams)) return result.data.exams;
  return [];
};

const fetchResults = async () => {
  try {
    const res = await fetch("/api/results");
    if (!res.ok) return { results: [] };
    const result = await res.json();
    let data = [];
    if (Array.isArray(result)) data = result;
    else if (Array.isArray(result.results)) data = result.results;
    else if (Array.isArray(result.data)) data = result.data;
    return { results: data };
  } catch { return { results: [] }; }
};

const fetchExamSubmissions = async () => {
  try {
    const res = await fetch("/api/exam-submissions?summary=true");
    if (!res.ok) return { submissions: [] };
    const result = await res.json();
    let data = [];
    if (Array.isArray(result)) data = result;
    else if (Array.isArray(result.submissions)) data = result.submissions;
    else if (Array.isArray(result.data)) data = result.data;
    return { submissions: data };
  } catch { return { submissions: [] }; }
};

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

function getExamStatus(exam: Exam, now: Date = new Date()): "upcoming" | "active" | "finished" {
  const { start, end } = getExamTiming(exam);
  if (now < start) return "upcoming";
  if (now > end) return "finished";
  return "active";
}

function getExamStartTimestamp(exam: Exam): number {
  const { start } = getExamTiming(exam);
  return start.getTime();
}

function formatExamDateTime(date: Date) {
  if (isNaN(date.getTime())) return { date: "N/A", time: "N/A", full: "N/A" };
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    date: dateStr,
    time: timeStr,
    full: `${dateStr} at ${timeStr}`,
  };
}

function getDurationText(start: Date, end: Date, durationMinutes?: number): string | null {
  if (durationMinutes && durationMinutes > 0) {
    const hrs = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
    return `${mins} min${mins > 1 ? "s" : ""}`;
  }
  const diffMs = end.getTime() - start.getTime();
  if (diffMs > 0 && diffMs < 86400000 * 30) {
    const totalMinutes = Math.round(diffMs / 60000);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
    return `${mins} min${mins > 1 ? "s" : ""}`;
  }
  return null;
}

function formatTimeRemaining(diffMs: number): string {
  if (diffMs <= 0) return "0s";
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
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

function getPaginationRange(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export default function OnlineExamsPage() {
  const [cached] = useState(() => loadFromLocalCache());
  const [user, setUser] = useState<any>(() => cached?.user || null);
  const [exams, setExams] = useState<Exam[]>(() => cached?.exams || []);
  const [results, setResults] = useState<Result[]>(() => cached?.results || []);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(() => cached?.submissions || []);
  const [loading, setLoading] = useState(() => !cached);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("start_asc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridSectionRef = useRef<HTMLDivElement>(null);

  // Live timer tick every 1000ms for accurate real-time status transitions and countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts: '/' to search, 'Escape' to clear, Arrow Left/Right to paginate
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

  // Reset page to 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, selectedSubject, sortOption, dateFrom, dateTo, search]);

  // Fetch function with Stale-While-Revalidate support
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }

    try {
      const [userRes, examsRes, resultsRes, subsRes] = await Promise.allSettled([
        fetchUser(),
        fetchExams(),
        fetchResults(),
        fetchExamSubmissions(),
      ]);

      const userData = userRes.status === "fulfilled" && userRes.value ? userRes.value.user : null;
      const examsData = examsRes.status === "fulfilled" && examsRes.value ? examsRes.value : [];
      const resultsData = resultsRes.status === "fulfilled" && resultsRes.value ? resultsRes.value.results || [] : [];
      const subsData = subsRes.status === "fulfilled" && subsRes.value ? subsRes.value.submissions || [] : [];

      if (userData) setUser(userData);
      if (examsData) setExams(examsData);
      setResults(resultsData);
      setSubmissions(subsData);

      // Cache for instant loading on subsequent views
      saveToLocalCache({
        user: userData,
        exams: examsData,
        results: resultsData,
        submissions: subsData,
      });
    } catch (e) {
      console.error("Failed to load exams data", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load: revalidate silently in background
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const userClassId = user?.studentProfile?.class?.id || (user?.studentProfile as any)?.classId;
  const studentProfileId = user?.studentProfile?.id;

  const hasInProgress = useCallback((examId: string) => {
    const sub = submissions.find((s) => s.examId === examId && s.studentId === studentProfileId);
    if (!sub) return false;
    if (sub.status === "IN_PROGRESS") return true;
    if (sub.cqSqStatus === "IN_PROGRESS" || sub.objectiveStatus === "IN_PROGRESS") return true;
    // If objective is submitted but CQ/SQ has not been submitted yet:
    if (sub.objectiveStatus === "SUBMITTED" && sub.cqSqStatus !== "SUBMITTED") return true;
    return false;
  }, [submissions, studentProfileId]);

  const hasSubmitted = useCallback((examId: string) => {
    if (hasInProgress(examId)) return false;
    const sub = submissions.find((s) => s.examId === examId && s.studentId === studentProfileId);
    if (sub && sub.status === "SUBMITTED") return true;
    if (results.some((r) => r.examId === examId)) return true;
    return false;
  }, [submissions, results, studentProfileId, hasInProgress]);

  const getResult = useCallback((examId: string) => results.find((r) => r.examId === examId), [results]);

  // Class exams
  const classExams = useMemo(() => {
    if (!userClassId) return [];
    return exams.filter((e) => e.isActive && e.classId && e.classId === userClassId);
  }, [exams, userClassId]);

  // Unique subjects available for this student's class
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    classExams.forEach((e) => {
      if (e.subject && e.subject.trim()) {
        subs.add(e.subject.trim());
      }
    });
    return Array.from(subs);
  }, [classExams]);

  // Real-time counts for all status tabs
  const statusCounts = useMemo(() => {
    let activeCount = 0;
    let notTakenCount = 0;
    let upcomingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let missedCount = 0;

    classExams.forEach((e) => {
      const st = getExamStatus(e, now);
      const submitted = hasSubmitted(e.id);
      const inProg = hasInProgress(e.id);

      if (st === "active") activeCount++;
      if (st === "upcoming") upcomingCount++;
      if (submitted) completedCount++;
      if (inProg && !submitted) inProgressCount++;
      if (!submitted && !inProg && st === "active") notTakenCount++;
      if (!submitted && !inProg && st === "finished") missedCount++;
    });

    return {
      all: classExams.length,
      active: activeCount,
      not_taken: notTakenCount,
      upcoming: upcomingCount,
      in_progress: inProgressCount,
      completed: completedCount,
      expired_not_taken: missedCount,
    };
  }, [classExams, now, hasSubmitted, hasInProgress]);

  // Filter and sort exams
  const filteredExams = useMemo(() => {
    let list = classExams;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q));
    }

    // Subject pill filter
    if (selectedSubject !== "all") {
      list = list.filter((e) => e.subject?.toLowerCase() === selectedSubject.toLowerCase());
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
      list = list.filter((e) => getExamTiming(e).start >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      list = list.filter((e) => getExamTiming(e).start <= to);
    }

    // Status filter
    switch (statusFilter) {
      case "not_taken":
        list = list.filter((e) => !hasSubmitted(e.id) && !hasInProgress(e.id) && getExamStatus(e, now) === "active");
        break;
      case "expired_not_taken":
        list = list.filter((e) => !hasSubmitted(e.id) && !hasInProgress(e.id) && getExamStatus(e, now) === "finished");
        break;
      case "in_progress":
        list = list.filter((e) => hasInProgress(e.id) && !hasSubmitted(e.id));
        break;
      case "completed":
        list = list.filter((e) => hasSubmitted(e.id));
        break;
      case "active":
        list = list.filter((e) => getExamStatus(e, now) === "active");
        break;
      case "upcoming":
        list = list.filter((e) => getExamStatus(e, now) === "upcoming");
        break;
    }

    // Sorting
    return [...list].sort((a, b) => {
      const startA = getExamStartTimestamp(a);
      const startB = getExamStartTimestamp(b);
      const endA = getExamTiming(a).end.getTime();
      const endB = getExamTiming(b).end.getTime();

      switch (sortOption) {
        case "end_asc":
          if (endA !== endB) return endA - endB;
          return startA - startB;
        case "start_desc":
          if (startA !== startB) return startB - startA;
          return endB - endA;
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "start_asc":
        default: {
          // Status priority:
          // 0: Live & Not Given
          // 1: Live & Given (submitted)
          // 2: Upcoming
          // 3: Finished & Given (submitted)
          // 4: Finished & Missed (not submitted)
          const getStatusRank = (exam: Exam) => {
            const st = getExamStatus(exam, now);
            const submitted = hasSubmitted(exam.id);

            if (st === "active") {
              return submitted ? 1 : 0;
            }
            if (st === "upcoming") {
              return 2;
            }
            // st === "finished"
            return submitted ? 3 : 4;
          };

          const rankA = getStatusRank(a);
          const rankB = getStatusRank(b);
          if (rankA !== rankB) return rankA - rankB;

          // Earliest start first (ascending) within each group
          if (startA !== startB) return startA - startB;
          if (endA !== endB) return endA - endB;
          return (a.name || "").localeCompare(b.name || "");
        }
      }
    });
  }, [classExams, statusFilter, selectedSubject, sortOption, dateFrom, dateTo, search, now, hasSubmitted, hasInProgress]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedExams = useMemo(() => {
    return filteredExams.slice(startIndex, endIndex);
  }, [filteredExams, startIndex, endIndex]);

  const paginationRange = useMemo(() => {
    return getPaginationRange(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    gridSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hasActiveFilters = statusFilter !== "all" || selectedSubject !== "all" || dateFrom !== "" || dateTo !== "" || search !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setSelectedSubject("all");
    setSortOption("start_asc");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0f1e] font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnpNMjIgMzR2NmM2IDAgNi02IDYtNmgtNnpNMjIgMjJ2NmM2IDAgNi02IDYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 dark:from-[#0a0f1e] to-transparent" />
        <div className="relative z-10 container mx-auto px-4 pt-6 pb-16 max-w-6xl">
          {/* Top navigation bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Link href="/student/dashboard" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                title="Refresh exams list"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md rounded-full h-9 px-3 text-xs font-semibold gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{isRefreshing ? "Syncing..." : "Refresh"}</span>
              </Button>
              <Link href="/exams/results">
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md rounded-full h-9 px-4 text-xs font-semibold">
                  My Results
                </Button>
              </Link>
              <DarkModeToggle />
            </div>
          </div>

          {/* Title & subtitle */}
          <div className="text-white">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-2"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Online Exams
              </h1>
              {statusCounts.active > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold backdrop-blur-md animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {statusCounts.active} Live
                </span>
              )}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/70 text-base sm:text-lg"
            >
              {user?.studentProfile?.class?.name
                ? `Class: ${user.studentProfile.class.name}${user.studentProfile.class.section ? ` — ${user.studentProfile.class.section}` : ""}`
                : "Student Portal"}
            </motion.p>
          </div>

          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
          >
            {[
              { label: "Total Exams", value: loading ? "—" : statusCounts.all, color: "from-white/20 to-white/10", onClick: () => setStatusFilter("all") },
              { label: "Live Now", value: loading ? "—" : statusCounts.active, color: "from-indigo-400/30 to-indigo-300/10", onClick: () => setStatusFilter("active"), activeGlow: statusCounts.active > 0 },
              { label: "Not Taken (Live)", value: loading ? "—" : statusCounts.not_taken, color: "from-rose-400/30 to-rose-300/10", onClick: () => setStatusFilter("not_taken") },
              { label: "Missed", value: loading ? "—" : statusCounts.expired_not_taken, color: "from-orange-400/30 to-orange-300/10", onClick: () => setStatusFilter("expired_not_taken") },
            ].map((stat) => (
              <button
                key={stat.label}
                onClick={stat.onClick}
                className={`text-left bg-gradient-to-br ${stat.color} backdrop-blur-sm border border-white/10 hover:border-white/30 rounded-2xl p-3 sm:p-4 text-white transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/40`}
              >
                <div className="text-2xl sm:text-3xl font-bold flex items-center justify-between">
                  <span>{stat.value}</span>
                  {stat.activeGlow && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div className="text-white/70 text-xs sm:text-sm font-medium mt-0.5">{stat.label}</div>
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 pb-16 max-w-6xl -mt-4 relative z-10">
        {/* Interactive Filter and Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 mb-6"
        >
          {/* Search + Controls Row */}
          <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exams by name or subject (Press '/' to focus)..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-400 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Sort Selector */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full sm:w-auto appearance-none pl-8 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Toggle Date Filters */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`rounded-xl shrink-0 gap-1.5 h-10 px-3 font-medium text-xs ${showFilters ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300" : ""}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Date Filters</span>
                {(dateFrom || dateTo) && <span className="w-2 h-2 rounded-full bg-indigo-500 ml-0.5" />}
              </Button>

              {/* Clear All Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="rounded-xl shrink-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 gap-1 h-10 px-2.5 text-xs font-medium"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>
          {/* Status Filter Chips with real-time counts */}
          <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 pb-1">
            {(Object.entries(STATUS_CONFIGS) as [StatusFilter, typeof STATUS_CONFIGS[StatusFilter]][]).map(([key, cfg]) => {
              const Icon = cfg.icon as any;
              const isActive = statusFilter === key;
              const count = statusCounts[key] ?? 0;

              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 transition-all duration-200 ${isActive
                    ? `${cfg.bg} ${cfg.color} ring-1 ${cfg.ring} border-transparent shadow-sm`
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                >
                  {cfg.dot && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? "bg-white/80 dark:bg-black/40" : "bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subject Pills (if multiple subjects exist) */}
          {availableSubjects.length > 1 && (
            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs pb-1">
              <span className="text-slate-400 font-semibold text-[11px] mr-1 shrink-0">Subject:</span>
              <button
                onClick={() => setSelectedSubject("all")}
                className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${selectedSubject === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
              >
                All Subjects
              </button>
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${selectedSubject === sub
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Date range collapsible filter */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> From Date
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> To Date
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Header Info */}
        <div ref={gridSectionRef} className="scroll-mt-6">
          {!loading && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Showing{" "}
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {filteredExams.length === 0 ? 0 : startIndex + 1}–{Math.min(endIndex, filteredExams.length)}
                </span>{" "}
                of{" "}
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{filteredExams.length}</span> exam{filteredExams.length !== 1 ? "s" : ""}
                {hasActiveFilters && " (filtered)"}
              </p>

              {/* Page size & Status details */}
              <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-slate-500 dark:text-slate-400">
                {isRefreshing && (
                  <span className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1 font-medium animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Updating...
                  </span>
                )}
                {filteredExams.length > 12 && (
                  <div className="flex items-center gap-1.5">
                    <span>Show:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                    >
                      <option value={12}>12 / page</option>
                      <option value={24}>24 / page</option>
                      <option value={48}>48 / page</option>
                      <option value={999}>All</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Exam Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <EmptyState filter={statusFilter} hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <AnimatePresence mode="popLayout">
                {paginatedExams.map((exam, i) => (
                  <motion.div
                    key={exam.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.25) }}
                  >
                    <ExamCard
                      exam={exam}
                      submitted={hasSubmitted(exam.id)}
                      inProgress={hasInProgress(exam.id)}
                      result={getResult(exam.id)}
                      now={now}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Information status */}
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
                </div>

                {/* Page Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(1)}
                    className="h-8.5 w-8.5 p-0 rounded-xl text-slate-600 dark:text-slate-400"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="h-8.5 px-2.5 rounded-xl text-xs gap-1 font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </Button>

                  {/* Page numbers range */}
                  <div className="flex items-center gap-1 mx-1">
                    {paginationRange.map((page, idx) =>
                      page === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-xs select-none">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${page}`}
                          onClick={() => handlePageChange(page as number)}
                          className={`h-8.5 min-w-[34px] px-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                            currentPage === page
                              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/30"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="h-8.5 px-2.5 rounded-xl text-xs gap-1 font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="h-8.5 w-8.5 p-0 rounded-xl text-slate-600 dark:text-slate-400"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ExamCard({
  exam,
  submitted,
  inProgress,
  result,
  now,
}: {
  exam: Exam;
  submitted: boolean;
  inProgress: boolean;
  result?: Result;
  now: Date;
}) {
  const status = getExamStatus(exam, now);
  const { start, end } = getExamTiming(exam);
  const startFormatted = formatExamDateTime(start);
  const endFormatted = formatExamDateTime(end);
  const durationStr = getDurationText(start, end, exam.duration);
  const countdown = getLiveCountdown(start, end, now);

  const statusConfig = {
    active: {
      label: "Live Now",
      icon: Zap,
      bar: "bg-indigo-500",
      badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700",
      glow: "border-indigo-300 dark:border-indigo-800 shadow-indigo-500/10 shadow-lg",
    },
    upcoming: {
      label: "Upcoming",
      icon: Timer,
      bar: "bg-amber-500",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      glow: "",
    },
    finished: {
      label: "Ended",
      icon: Clock,
      bar: "bg-slate-400",
      badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
      glow: "",
    },
  }[status];

  const Icon = statusConfig.icon;

  return (
    <div className={`group bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1 ${status === "active" && !submitted ? statusConfig.glow : "border-slate-200 dark:border-slate-800"}`}>
      {/* Accent top bar */}
      <div className={`h-1.5 w-full ${statusConfig.bar}`} />

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.badge}`}>
            {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
            <Icon className="w-3 h-3" />
            {statusConfig.label}
          </span>

          {submitted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <CheckCircle2 className="w-3 h-3" /> Done
            </span>
          )}

          {inProgress && !submitted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 animate-pulse">
              <HourglassIcon className="w-3 h-3" /> Resuming
            </span>
          )}

          {/* Real-time countdown pill */}
          {!submitted && (status === "active" || status === "upcoming") && (
            <span className={`ml-auto inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${status === "active"
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
              : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50"
              }`}>
              <Clock className="w-3 h-3" />
              {countdown.text}
            </span>
          )}
        </div>

        {/* Exam Title */}
        <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-snug mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {exam.name}
        </h3>

        {/* Meta info & Schedule Details */}
        <div className="mb-4 flex-1 space-y-3">
          {exam.subject && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-semibold">{exam.subject}</span>
            </div>
          )}

          {!submitted ? (
            /* Rich Schedule Box when exam is NOT given */
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Exam Schedule
                </span>
                {durationStr && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold normal-case bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <Timer className="w-3 h-3 text-amber-500" /> {durationStr}
                  </span>
                )}
              </div>

              {/* Start Date & Time */}
              <div className="flex items-start justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Start:</span>
                </div>
                <div className="text-right font-medium text-slate-800 dark:text-slate-200">
                  <span>{startFormatted.date}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">
                    {startFormatted.time}
                  </span>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="flex items-start justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>End:</span>
                </div>
                <div className="text-right font-medium text-slate-800 dark:text-slate-200">
                  <span>{endFormatted.date}</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold ml-1.5">
                    {endFormatted.time}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Summary for completed / submitted exams */
            <div className="space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{startFormatted.date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{startFormatted.time} – {endFormatted.time}</span>
              </div>
            </div>
          )}
        </div>

        {/* Score box (if submitted) */}
        {submitted && result && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Score</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{result.total} pts</span>
          </div>
        )}

        {/* Action Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
          {submitted ? (
            <div className="flex gap-2">
              <Link href={`/exams/results/${exam.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full rounded-xl h-9 text-xs font-semibold gap-1.5 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                  View Result <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              {status === "finished" && (
                <Link href={`/exams/practice/${exam.id}`}>
                  <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-semibold px-3 border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50">
                    <Sparkles className="w-3 h-3 mr-1" /> Practice
                  </Button>
                </Link>
              )}
              {exam.allowRetake && status === "active" && (
                <Link href={`/exams/online/${exam.id}?action=start`}>
                  <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-semibold px-3 border-amber-200 text-amber-600">
                    Retake
                  </Button>
                </Link>
              )}
            </div>
          ) : (inProgress || status === "active") ? (
            <div className="flex gap-2">
              <a href={`/exams/online/${exam.id}`} className="flex-1">
                <Button className="w-full rounded-xl h-10 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 gap-2 transition-transform active:scale-[0.98]">
                  <Play className="w-4 h-4 fill-current" />
                  {inProgress ? "Resume Exam" : "Start Exam"}
                </Button>
              </a>
              <a href={`/exams/online/${exam.id}?mode=omr`} title="শুধুমাত্র ওএমআর শিট মোড (Only OMR Mode)">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40" title="Only OMR Mode">
                  <FileSpreadsheet className="w-4 h-4" />
                </Button>
              </a>
            </div>
          ) : status === "upcoming" ? (
            <Button disabled className="w-full rounded-xl h-10 text-sm font-medium opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <Timer className="w-4 h-4 mr-2" /> Not Started Yet
            </Button>
          ) : (
            <Link href={`/exams/practice/${exam.id}`} className="block">
              <Button variant="outline" className="w-full rounded-xl h-10 text-sm font-semibold border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                <BookOpen className="w-4 h-4 mr-2" /> Take Practice Session
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ filter, hasActiveFilters, onClear }: { filter: StatusFilter; hasActiveFilters: boolean; onClear: () => void }) {
  const messages: Partial<Record<StatusFilter, { emoji: string; title: string; desc: string }>> = {
    not_taken: { emoji: "🎉", title: "All Live Exams Taken!", desc: "Great job! You've attempted all available active exams." },
    in_progress: { emoji: "⏳", title: "No Exams in Progress", desc: "You don't have any ongoing exam sessions right now." },
    completed: { emoji: "📋", title: "No Completed Exams Yet", desc: "Start taking exams to see your results and scores here." },
    active: { emoji: "⚡", title: "No Live Exams Right Now", desc: "There are no exams running at this moment. Check upcoming exams or practice!" },
    upcoming: { emoji: "🗓️", title: "No Upcoming Exams", desc: "No exams are scheduled yet. Enjoy your free study time!" },
    expired_not_taken: { emoji: "✨", title: "No Missed Exams", desc: "You're all caught up! You haven't missed any exams." },
    all: { emoji: "📚", title: "No Exams Found", desc: "No exams match your current filter or search criteria." },
  };

  const msg = messages[filter] || messages.all!;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 shadow-sm text-4xl">
        {msg.emoji}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1.5">{msg.title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-xs text-sm">{msg.desc}</p>
      {hasActiveFilters && (
        <Button onClick={onClear} variant="outline" className="mt-5 rounded-xl gap-1.5 text-xs font-semibold">
          <X className="w-3.5 h-3.5" /> Clear All Filters
        </Button>
      )}
    </div>
  );
}