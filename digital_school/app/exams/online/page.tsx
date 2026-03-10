"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Filter,
  Calendar,
  Clock,
  BookOpen,
  ChevronRight,
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
} from "lucide-react";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

interface Exam {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
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
  submittedAt: string;
  score?: number;
  status?: "IN_PROGRESS" | "SUBMITTED";
}

type StatusFilter = "all" | "not_taken" | "in_progress" | "completed" | "active" | "upcoming" | "expired_not_taken";

const STATUS_CONFIGS: Record<StatusFilter, { label: string; icon: React.ElementType; color: string; bg: string; ring: string }> = {
  all: { label: "All Exams", icon: LayoutGrid, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800", ring: "ring-slate-300 dark:ring-slate-600" },
  not_taken: { label: "Not Taken (Live)", icon: XCircle, color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-900/30", ring: "ring-rose-300 dark:ring-rose-700" },
  expired_not_taken: { label: "Missed (Expired)", icon: HourglassIcon, color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-900/30", ring: "ring-orange-300 dark:ring-orange-700" },
  in_progress: { label: "In Progress", icon: HourglassIcon, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/30", ring: "ring-amber-300 dark:ring-amber-700" },
  completed: { label: "Taken", icon: CheckCircle2, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/30", ring: "ring-emerald-300 dark:ring-emerald-700" },
  active: { label: "Live Now", icon: Zap, color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-900/30", ring: "ring-indigo-300 dark:ring-indigo-700" },
  upcoming: { label: "Upcoming", icon: Timer, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-900/30", ring: "ring-blue-300 dark:ring-blue-700" },
};

const fetchUser = async () => {
  const res = await fetch("/api/user");
  return res.json();
};

const fetchExams = async () => {
  const res = await fetch("/api/exams");
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
    const res = await fetch("/api/exam-submissions");
    if (!res.ok) return { submissions: [] };
    const result = await res.json();
    let data = [];
    if (Array.isArray(result)) data = result;
    else if (Array.isArray(result.submissions)) data = result.submissions;
    else if (Array.isArray(result.data)) data = result.data;
    return { submissions: data };
  } catch { return { submissions: [] }; }
};

function getExamStatus(exam: Exam): "upcoming" | "active" | "finished" {
  const now = new Date();
  let start: Date, end: Date;
  if (exam.startTime && exam.endTime) {
    start = new Date(exam.startTime);
    end = new Date(exam.endTime);
  } else {
    const date = new Date(exam.date);
    start = new Date(date); start.setHours(0, 0, 0, 0);
    end = new Date(date); end.setHours(23, 59, 59, 999);
  }
  if (now < start) return "upcoming";
  if (now > end) return "finished";
  return "active";
}

export default function OnlineExamsPage() {
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [userData, examsData, resultsData, submissionsData] = await Promise.all([
          fetchUser(), fetchExams(), fetchResults(), fetchExamSubmissions(),
        ]);
        setUser(userData.user);
        setExams(examsData);
        setResults(resultsData.results || []);
        setSubmissions(submissionsData.submissions || []);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const userClassId = user?.studentProfile?.class?.id;
  const studentProfileId = user?.studentProfile?.id;

  const hasSubmitted = (examId: string) =>
    submissions.some((s) => s.examId === examId && s.studentId === studentProfileId && s.status === "SUBMITTED") ||
    results.some((r) => r.examId === examId);

  const hasInProgress = (examId: string) =>
    submissions.some((s) => s.examId === examId && s.studentId === studentProfileId && s.status === "IN_PROGRESS");

  const getResult = (examId: string) => results.find((r) => r.examId === examId);

  // Base filtered exams for the student's class
  const classExams = useMemo(() => {
    if (!userClassId) return [];
    return exams.filter((e) => e.isActive && e.classId && e.classId === userClassId);
  }, [exams, userClassId]);

  // Compute stats
  const stats = useMemo(() => ({
    total: classExams.length,
    active: classExams.filter((e) => getExamStatus(e) === "active").length,
    notTaken: classExams.filter((e) => !hasSubmitted(e.id) && !hasInProgress(e.id) && getExamStatus(e) === "active").length,
    missed: classExams.filter((e) => !hasSubmitted(e.id) && !hasInProgress(e.id) && getExamStatus(e) === "finished").length,
    completed: classExams.filter((e) => hasSubmitted(e.id)).length,
  }), [classExams, results, submissions]);

  // Apply filters
  const filteredExams = useMemo(() => {
    let list = classExams;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q));
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
      list = list.filter((e) => new Date(e.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      list = list.filter((e) => new Date(e.date) <= to);
    }

    // Status filter
    switch (statusFilter) {
      case "not_taken":
        // Only show live/active exams that haven't been started or submitted
        list = list.filter((e) => !hasSubmitted(e.id) && !hasInProgress(e.id) && getExamStatus(e) === "active");
        break;
      case "expired_not_taken":
        // Missed: expired exams that were never submitted
        list = list.filter((e) => !hasSubmitted(e.id) && !hasInProgress(e.id) && getExamStatus(e) === "finished");
        break;
      case "in_progress":
        list = list.filter((e) => hasInProgress(e.id) && !hasSubmitted(e.id));
        break;
      case "completed":
        list = list.filter((e) => hasSubmitted(e.id));
        break;
      case "active":
        list = list.filter((e) => getExamStatus(e) === "active");
        break;
      case "upcoming":
        list = list.filter((e) => getExamStatus(e) === "upcoming");
        break;
    }

    return list;
  }, [classExams, statusFilter, dateFrom, dateTo, search, results, submissions]);

  const hasActiveFilters = statusFilter !== "all" || dateFrom !== "" || dateTo !== "" || search !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0f1e] font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnpNMzYgMjJ2NmM2IDAgNi02IDYtNmgtNnpNMjIgMzR2NmM2IDAgNi02IDYtNmgtNnpNMjIgMjJ2NmM2IDAgNi02IDYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 dark:from-[#0a0f1e] to-transparent" />
        <div className="relative z-10 container mx-auto px-4 pt-6 pb-16 max-w-6xl">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Link href="/student/dashboard" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/exams/results">
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md rounded-full h-9 px-4 text-xs font-semibold">
                  My Results
                </Button>
              </Link>
              <DarkModeToggle />
            </div>
          </div>

          {/* Title */}
          <div className="text-white">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2"
            >
              Online Exams
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/70 text-base sm:text-lg"
            >
              {user?.studentProfile?.class?.name
                ? `Class: ${user.studentProfile.class.name}${user.studentProfile.class.section ? ` — ${user.studentProfile.class.section}` : ""}`
                : "Student Portal"}
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
          >
            {[
              { label: "Total Exams", value: loading ? "—" : stats.total, color: "from-white/20 to-white/10" },
              { label: "Live Now", value: loading ? "—" : stats.active, color: "from-indigo-400/30 to-indigo-300/10" },
              { label: "Not Taken (Live)", value: loading ? "—" : stats.notTaken, color: "from-rose-400/30 to-rose-300/10" },
              { label: "Missed", value: loading ? "—" : stats.missed, color: "from-orange-400/30 to-orange-300/10" },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4 text-white`}>
                <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                <div className="text-white/60 text-xs sm:text-sm font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16 max-w-6xl -mt-4 relative z-10">
        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 mb-6"
        >
          {/* Search + Toggle filters row */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exams..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-400"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-xl shrink-0 gap-2 h-10 px-3 font-medium text-sm ${showFilters ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300" : ""}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-500 ml-0.5" />}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-xl shrink-0 text-slate-500 gap-1.5 h-10 px-3 text-sm">
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>

          {/* Status filter chips */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(STATUS_CONFIGS) as [StatusFilter, typeof STATUS_CONFIGS[StatusFilter]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = statusFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${isActive
                    ? `${cfg.bg} ${cfg.color} ring-1 ${cfg.ring} border-transparent shadow-sm`
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Date filters (collapsible) */}
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
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

        {/* Results header */}
        {!loading && (
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="text-slate-800 dark:text-slate-200 font-semibold">{filteredExams.length}</span> exam{filteredExams.length !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
            </p>
          </div>
        )}

        {/* Exam Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <EmptyState filter={statusFilter} hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {filteredExams.map((exam, i) => (
                <motion.div
                  key={exam.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.4) }}
                >
                  <ExamCard
                    exam={exam}
                    submitted={hasSubmitted(exam.id)}
                    inProgress={hasInProgress(exam.id)}
                    result={getResult(exam.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}

function ExamCard({ exam, submitted, inProgress, result }: {
  exam: Exam;
  submitted: boolean;
  inProgress: boolean;
  result?: Result;
}) {
  const status = getExamStatus(exam);

  const statusConfig = {
    active: { label: "Live Now", icon: Zap, bar: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
    upcoming: { label: "Upcoming", icon: Timer, bar: "bg-amber-500", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    finished: { label: "Ended", icon: Clock, bar: "bg-slate-400", badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  }[status];

  const formattedDate = new Date(exam.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const Icon = statusConfig.icon;

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${statusConfig.bar}`} />

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.badge}`}>
            <Icon className="w-3 h-3" />
            {statusConfig.label}
          </span>
          {submitted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <CheckCircle2 className="w-3 h-3" /> Done
            </span>
          )}
          {inProgress && !submitted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <HourglassIcon className="w-3 h-3" /> Resuming
            </span>
          )}
        </div>

        {/* Exam name */}
        <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-snug mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {exam.name}
        </h3>

        {/* Meta info */}
        <div className="space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
          {exam.subject && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>{exam.subject}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          {status === "upcoming" && exam.startTime && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Starts {new Date(exam.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}
          {status === "active" && exam.endTime && (
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Ends {new Date(exam.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}
        </div>

        {/* Score (if submitted) */}
        {submitted && result && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Score</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{result.total} pts</span>
          </div>
        )}

        {/* Action footer */}
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
                    Practice
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
          ) : (status === "active" || inProgress) && status !== "finished" ? (
            <a href={`/exams/online/${exam.id}`} className="block">
              <Button className="w-full rounded-xl h-10 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 gap-2">
                <Play className="w-4 h-4 fill-current" />
                {inProgress ? "Resume Exam" : "Start Exam"}
              </Button>
            </a>
          ) : status === "upcoming" ? (
            <Button disabled className="w-full rounded-xl h-10 text-sm font-medium opacity-50 cursor-not-allowed">
              <Timer className="w-4 h-4 mr-2" /> Not Started Yet
            </Button>
          ) : (
            <Link href={`/exams/practice/${exam.id}`} className="block">
              <Button variant="outline" className="w-full rounded-xl h-10 text-sm font-semibold border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                <BookOpen className="w-4 h-4 mr-2" /> Practice
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
    not_taken: { emoji: "✅", title: "All exams taken!", desc: "Great job! You've attempted all available exams." },
    in_progress: { emoji: "⏳", title: "No exams in progress", desc: "You don't have any ongoing exam sessions." },
    completed: { emoji: "📋", title: "No completed exams yet", desc: "Start taking exams to see your results here." },
    active: { emoji: "⚡", title: "No live exams right now", desc: "There are no exams running at this moment. Check back soon!" },
    upcoming: { emoji: "🗓️", title: "No upcoming exams", desc: "No exams are scheduled yet. Enjoy your free time!" },
    all: { emoji: "📚", title: "No exams found", desc: "No exams are available for your class yet." },
  };

  const msg = messages[filter] || messages.all!;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-5 shadow-md text-5xl">
        {msg.emoji}
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{msg.title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-xs">{msg.desc}</p>
      {hasActiveFilters && (
        <Button onClick={onClear} variant="outline" className="mt-6 rounded-xl gap-2">
          <X className="w-4 h-4" /> Clear Filters
        </Button>
      )}
    </div>
  );
}