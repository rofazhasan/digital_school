"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  FileText,
  BarChart3,
  Calendar,
  LogOut,
  User,
  Settings,
  Bell,
  Trophy,
  Award,
  Download,
  Play,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Home,
  ChevronDown,
  Target,
  Users,
  CheckCircle,
  Lock,
  ArrowLeft,
  Zap,
  Flame,
  CheckCircle2,
  AlertCircle,
  Timer,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  ChevronRight,
  Filter,
  Monitor
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";
import { StudentAnalyticsTab } from "@/components/dashboard/student-tabs";

const FocusMode = dynamic(() => import("@/components/dashboard/wonderspace/FocusMode").then(mod => mod.FocusMode), { ssr: false });
const AmbientPlayer = dynamic(() => import("@/components/dashboard/wonderspace/AmbientPlayer").then(mod => mod.AmbientPlayer), { ssr: false });
const MoodJournal = dynamic(() => import("@/components/dashboard/wonderspace/MoodJournal").then(mod => mod.MoodJournal), { ssr: false });

import { AIAnalysisCard } from "@/components/dashboard/student/AIAnalysisCard";
import { PerformancePredictor } from "@/components/dashboard/student/PerformancePredictor";
import { SecuritySettings } from "@/components/dashboard/SecuritySettings";

// Chart Components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  ArcElement
} from 'chart.js';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT';
  studentProfile?: {
    id?: string;
    roll: string;
    registrationNo: string;
    class: {
      name: string;
      section: string;
    };
    classId: string;
  };
}

interface Exam {
  id: string;
  name: string;
  subject?: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  type: 'ONLINE' | 'OFFLINE' | 'MIXED';
  totalMarks: number;
  classId?: string;
}

interface Result {
  id?: string;
  examId: string;
  examTitle: string;
  subject: string;
  type?: 'ONLINE' | 'OFFLINE' | 'MIXED';
  score: number;
  totalMarks: number;
  percentage: number;
  rank?: number;
  grade?: string;
  comment?: string;
  date: string;
  isPublished?: boolean;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

const DASHBOARD_CACHE_KEY = "student_dashboard_cache_v4";

function getCachedData() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY) || sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const DEFAULT_FALLBACK_USER: UserProfile = {
  id: "student",
  name: "Student",
  email: "",
  role: "STUDENT",
  studentProfile: {
    id: "sp-initial",
    roll: "01",
    class: { name: "Class 10", section: "A" }
  }
};

export default function StudentDashboardPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    const c = getCachedData();
    return c?.user || DEFAULT_FALLBACK_USER;
  });
  const [exams, setExams] = useState<Exam[]>(() => {
    const c = getCachedData();
    return Array.isArray(c?.exams) ? c.exams : [];
  });
  const [results, setResults] = useState<Result[]>(() => {
    const c = getCachedData();
    return Array.isArray(c?.results) ? c.results : [];
  });
  const [examSubmissions, setExamSubmissions] = useState<Array<{ examId: string; studentId: string; status: string }>>(() => {
    const c = getCachedData();
    return Array.isArray(c?.submissions) ? c.submissions : [];
  });
  const [attendance, setAttendance] = useState<any>(() => {
    const c = getCachedData();
    return c?.attendance || null;
  });
  const [notices, setNotices] = useState<Notice[]>(() => {
    const c = getCachedData();
    return Array.isArray(c?.notices) ? c.notices : [];
  });
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(() => {
    const c = getCachedData();
    return typeof c?.unreadNoticeCount === "number" ? c.unreadNoticeCount : 0;
  });
  const [analytics, setAnalytics] = useState<any>(() => {
    const c = getCachedData();
    return c?.analytics || null;
  });
  const [loading, setLoading] = useState(() => {
    const c = getCachedData();
    return !c?.user;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [instituteSettings, setInstituteSettings] = useState<any>(() => {
    const c = getCachedData();
    return c?.instituteSettings || null;
  });
  const [now, setNow] = useState<Date>(new Date());

  // Performance Trends Controls
  const [trendRange, setTrendRange] = useState<'5' | '10' | 'all'>('10');
  const [trendSubjectFilter, setTrendSubjectFilter] = useState<string>('all');

  // Exams Tab Controls
  const [examSubTab, setExamSubTab] = useState<'upcoming' | 'results'>('upcoming');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all');
  const [examSearchQuery, setExamSearchQuery] = useState<string>('');

  // 1-second real-time timer for live exams
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isFetchingRef = useRef(false);

  // Main Dashboard Data Fetch with single unified endpoint and SWR background sync
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isSilent) setLoading(true);

    try {
      const dashRes = await fetch('/api/student/dashboard', { credentials: 'include' });
      if (dashRes.status === 401) {
        router.push('/login');
        return;
      }

      if (dashRes.ok) {
        const data = await dashRes.json();
        if (data.user) setUser(data.user);
        if (Array.isArray(data.exams)) setExams(data.exams);
        if (Array.isArray(data.results)) setResults(data.results);
        if (Array.isArray(data.submissions)) setExamSubmissions(data.submissions);
        if (data.attendance) setAttendance(data.attendance);
        if (data.analytics) setAnalytics(data.analytics);
        if (Array.isArray(data.notices)) setNotices(data.notices);
        if (typeof data.unreadNoticeCount === 'number') setUnreadNoticeCount(data.unreadNoticeCount);
        if (data.instituteSettings) setInstituteSettings(data.instituteSettings);

        // Cache snapshot in localStorage & sessionStorage for instant 0-second loading
        try {
          const payload = JSON.stringify({
            user: data.user,
            exams: data.exams,
            results: data.results,
            submissions: data.submissions,
            attendance: data.attendance,
            analytics: data.analytics,
            notices: data.notices,
            unreadNoticeCount: data.unreadNoticeCount,
            instituteSettings: data.instituteSettings,
            updatedAt: Date.now()
          });
          localStorage.setItem(DASHBOARD_CACHE_KEY, payload);
          sessionStorage.setItem(DASHBOARD_CACHE_KEY, payload);
        } catch {}
      } else {
        const userRes = await fetch('/api/user', { credentials: 'include' });
        if (userRes.ok) {
          const uData = await userRes.json();
          if (uData.user?.role !== 'STUDENT') {
            router.push(uData.user?.role === 'SUPER_USER' ? '/super-user/dashboard' : uData.user?.role === 'ADMIN' ? '/admin/dashboard' : '/teacher/dashboard');
          }
        }
      }
    } catch (err) {
      console.error("Dashboard sync error:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [router]);

  // Client-side Mount and SWR Cache Hydration
  useEffect(() => {
    setMounted(true);
    const cached = getCachedData();
    if (cached) {
      if (cached.user) setUser(cached.user);
      if (Array.isArray(cached.exams)) setExams(cached.exams);
      if (Array.isArray(cached.results)) setResults(cached.results);
      if (Array.isArray(cached.submissions)) setExamSubmissions(cached.submissions);
      if (cached.attendance) setAttendance(cached.attendance);
      if (cached.analytics) setAnalytics(cached.analytics);
      if (Array.isArray(cached.notices)) setNotices(cached.notices);
      if (typeof cached.unreadNoticeCount === "number") setUnreadNoticeCount(cached.unreadNoticeCount);
      if (cached.instituteSettings) setInstituteSettings(cached.instituteSettings);
      if (cached.user) setLoading(false);
    }

    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem(DASHBOARD_CACHE_KEY);
      sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Extract unique subjects across results & exams
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => { if (r.subject) set.add(r.subject); });
    exams.forEach(e => { if (e.subject) set.add(e.subject); });
    if (analytics?.subjectPerformance) {
      analytics.subjectPerformance.forEach((s: any) => { if (s.subject) set.add(s.subject); });
    }
    return Array.from(set);
  }, [results, exams, analytics]);

  // Refined Performance Trends Data
  const trendChartData = useMemo(() => {
    // If we have detailed results, sort chronological (earliest to latest)
    let rawList: Array<{ label: string; score: number; classAvg: number; subject: string; date: string }> = [];

    if (results.length > 0) {
      const sorted = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      rawList = sorted.map(r => ({
        label: r.examTitle || r.subject,
        score: Number(r.percentage) || (r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0),
        classAvg: 70, // Baseline estimate
        subject: r.subject || 'General',
        date: r.date
      }));
    } else if (analytics?.trends && Array.isArray(analytics.trends)) {
      rawList = analytics.trends.map((t: any) => ({
        label: t.label || t.examTitle || 'Exam',
        score: Number(t.score) || 0,
        classAvg: Number(t.classAverage) || 70,
        subject: t.subject || 'General',
        date: t.date || ''
      }));
    }

    if (trendSubjectFilter !== 'all') {
      rawList = rawList.filter(item => item.subject.toLowerCase() === trendSubjectFilter.toLowerCase());
    }

    if (rawList.length === 0) {
      rawList = [
        { label: 'Diagnostic Assessment', score: 78, classAvg: 70, subject: 'General', date: new Date(Date.now() - 7 * 86400000).toISOString() },
        { label: 'Practice Milestone', score: 85, classAvg: 72, subject: 'General', date: new Date(Date.now() - 3 * 86400000).toISOString() },
        { label: 'Current Standing', score: 88, classAvg: 73, subject: 'General', date: new Date().toISOString() }
      ];
    }

    if (trendRange === '5') {
      rawList = rawList.slice(-5);
    } else if (trendRange === '10') {
      rawList = rawList.slice(-10);
    }

    const scores = rawList.map(r => r.score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 84;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 88;
    const minScore = scores.length > 0 ? Math.min(...scores) : 78;
    const firstScore = scores[0] || 78;
    const lastScore = scores[scores.length - 1] || 88;
    const delta = lastScore - firstScore;

    return {
      items: rawList,
      avgScore,
      maxScore,
      minScore,
      delta,
      chart: {
        labels: rawList.map(r => r.label.length > 14 ? r.label.substring(0, 12) + '...' : r.label),
        datasets: [
          {
            label: 'Your Score (%)',
            data: rawList.map(r => r.score),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            fill: true,
            tension: 0.35,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
          },
          {
            label: 'Class Avg (%)',
            data: rawList.map(r => r.classAvg),
            borderColor: 'rgba(148, 163, 184, 0.6)',
            borderDash: [5, 5],
            fill: false,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          }
        ]
      }
    };
  }, [results, analytics, trendRange, trendSubjectFilter]);

  // Subject Strengths Matrix
  const subjectMatrix = useMemo(() => {
    // Aggregate subject scores from results or analytics
    const subjectMap: Record<string, { totalPct: number; count: number; maxPct: number; minPct: number }> = {};

    results.forEach(r => {
      const sub = r.subject || 'General';
      const pct = Number(r.percentage) || (r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0);
      if (!subjectMap[sub]) {
        subjectMap[sub] = { totalPct: 0, count: 0, maxPct: 0, minPct: 100 };
      }
      subjectMap[sub].totalPct += pct;
      subjectMap[sub].count += 1;
      subjectMap[sub].maxPct = Math.max(subjectMap[sub].maxPct, pct);
      subjectMap[sub].minPct = Math.min(subjectMap[sub].minPct, pct);
    });

    // Merge with analytics if results are few
    if (analytics?.subjectPerformance && Array.isArray(analytics.subjectPerformance)) {
      analytics.subjectPerformance.forEach((s: any) => {
        if (!subjectMap[s.subject]) {
          subjectMap[s.subject] = {
            totalPct: Number(s.score) || 75,
            count: 1,
            maxPct: Number(s.score) || 75,
            minPct: Number(s.score) || 75
          };
        }
      });
    }

    if (Object.keys(subjectMap).length === 0) {
      subjectMap['General Science'] = { totalPct: 88, count: 1, maxPct: 88, minPct: 88 };
      subjectMap['Mathematics'] = { totalPct: 84, count: 1, maxPct: 84, minPct: 84 };
      subjectMap['Language & Lit'] = { totalPct: 90, count: 1, maxPct: 90, minPct: 90 };
      subjectMap['General Knowledge'] = { totalPct: 80, count: 1, maxPct: 80, minPct: 80 };
    }

    const list = Object.entries(subjectMap).map(([subject, stat]) => {
      const avg = Math.round(stat.totalPct / stat.count);
      let status: 'Mastered' | 'Proficient' | 'Developing' = 'Proficient';
      let color = 'emerald';
      if (avg >= 85) {
        status = 'Mastered';
        color = 'emerald';
      } else if (avg >= 65) {
        status = 'Proficient';
        color = 'blue';
      } else {
        status = 'Developing';
        color = 'amber';
      }
      return { subject, avg, count: stat.count, max: stat.maxPct, min: stat.minPct, status, color };
    });

    list.sort((a, b) => b.avg - a.avg);

    const topSubject = list[0] || null;
    const focusSubject = list.length > 1 ? list[list.length - 1] : null;

    const radarChart = {
      labels: list.map(s => s.subject),
      datasets: [
        {
          label: 'Subject Mastery %',
          data: list.map(s => s.avg),
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#6366f1'
        }
      ]
    };

    return { list, topSubject, focusSubject, radarChart };
  }, [results, analytics]);

  // Filtered Scheduled & Live Exams
  const filteredScheduledExams = useMemo(() => {
    return exams.filter(exam => {
      if (examTypeFilter !== 'all' && exam.type !== examTypeFilter) return false;
      if (examSearchQuery.trim()) {
        const q = examSearchQuery.toLowerCase();
        const mTitle = exam.name?.toLowerCase().includes(q);
        const mSub = exam.subject?.toLowerCase().includes(q);
        if (!mTitle && !mSub) return false;
      }
      return true;
    }).sort((a, b) => {
      const tA = a.startTime ? new Date(a.startTime).getTime() : new Date(a.date).getTime();
      const tB = b.startTime ? new Date(b.startTime).getTime() : new Date(b.date).getTime();
      return tA - tB;
    });
  }, [exams, examTypeFilter, examSearchQuery]);

  // Filtered Completed Exam Results
  const filteredExamResults = useMemo(() => {
    return results.filter(result => {
      if (examTypeFilter !== 'all' && result.type && result.type !== examTypeFilter) return false;
      if (examSearchQuery.trim()) {
        const q = examSearchQuery.toLowerCase();
        const mTitle = result.examTitle?.toLowerCase().includes(q);
        const mSub = result.subject?.toLowerCase().includes(q);
        if (!mTitle && !mSub) return false;
      }
      return true;
    });
  }, [results, examTypeFilter, examSearchQuery]);

  // Metrics
  const lastResult = results && results.length > 0 ? results[0] : null;
  const attendanceData = analytics?.attendance || attendance || { percentage: 95, present: 28, absent: 2, late: 0, total: 30 };
  const performanceData = analytics?.performance || { averagePercentage: 86, gpa: 4.85, grade: 'A+' };
  const classRank = analytics?.rank || '3';
  const totalStudents = analytics?.totalStudents || '42';
  const badges = analytics?.badges || [];

  const instituteName = instituteSettings?.instituteName || "Rofaz Academy";
  const instituteLogo = instituteSettings?.logoUrl || "/logo.png";

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground transition-colors duration-300">
      <AnimatePresence>
        {isFocusModeOpen && <FocusMode onClose={() => setIsFocusModeOpen(false)} />}
      </AnimatePresence>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-950/75 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 sm:px-6">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Logo and Nav */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25">
                  {instituteLogo && instituteLogo !== '/logo.png' ? (
                    <img src={instituteLogo} alt={instituteName} className="h-6 w-auto object-contain brightness-0 invert" />
                  ) : (
                    "RA"
                  )}
                </div>
                <div className="hidden sm:block">
                  <span className="font-extrabold text-base tracking-tight text-foreground block leading-none">
                    {instituteName}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    Student Portal
                  </span>
                </div>
              </div>

              {/* Desktop Nav Pills */}
              <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-full border border-slate-200/80 dark:border-slate-800/80">
                {[
                  { id: 'dashboard', label: 'Overview', icon: Home, action: () => setActiveTab('dashboard') },
                  { id: 'exams', label: 'My Exams', icon: FileText, action: () => setActiveTab('exams') },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp, action: () => setActiveTab('analytics') },
                  { id: 'focus', label: 'Focus Mode', icon: Target, action: () => setIsFocusModeOpen(true) },
                  { id: 'results', label: 'Completed & Results', icon: BarChart3, href: '/exams/results' },
                  { id: 'prac-perfect', label: 'PracPerfect', icon: Sparkles, href: '/student/prac-perfect' },
                  { id: 'notices', label: 'Notices', icon: Bell, href: '/student/notices', badge: unreadNoticeCount }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      triggerHaptic(ImpactStyle.Light);
                      if (item.action) {
                        item.action();
                      } else if (item.href) {
                        router.push(item.href);
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                      activeTab === item.id && !item.href && item.id !== 'focus'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${activeTab === item.id && item.id !== 'focus' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Actions & Profile */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/student/prac-perfect')}
                className="hidden sm:flex rounded-full text-xs font-bold border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Practice Now
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 rounded-full pl-2 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {user.name.charAt(0)}
                      </div>
                      <div className="hidden sm:flex flex-col items-start text-left">
                        <span className="text-xs font-bold leading-none">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          {user.studentProfile?.class?.name || "Student"}
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 p-2 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800" align="end">
                  <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl mb-1.5">
                    <p className="text-xs font-bold">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    {user.studentProfile?.roll && (
                      <Badge variant="outline" className="mt-1.5 text-[10px] font-mono">
                        Roll: {user.studentProfile.roll}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/student/profile')} className="rounded-xl text-xs font-semibold py-2">
                    <Settings className="mr-2 h-4 w-4 text-slate-500" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 rounded-xl text-xs font-semibold py-2">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Navigation Strip */}
      <div className="lg:hidden sticky top-16 sm:top-20 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {[
            { id: 'dashboard', label: 'Overview', icon: Home, action: () => setActiveTab('dashboard') },
            { id: 'exams', label: 'My Exams', icon: FileText, action: () => setActiveTab('exams') },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp, action: () => setActiveTab('analytics') },
            { id: 'focus', label: 'Focus Mode', icon: Target, action: () => setIsFocusModeOpen(true) },
            { id: 'results', label: 'Completed & Results', icon: BarChart3, href: '/exams/results' },
            { id: 'prac-perfect', label: 'PracPerfect', icon: Sparkles, href: '/student/prac-perfect' },
            { id: 'notices', label: 'Notices', icon: Bell, href: '/student/notices', badge: unreadNoticeCount }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                triggerHaptic(ImpactStyle.Light);
                if (item.action) {
                  item.action();
                } else if (item.href) {
                  router.push(item.href);
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === item.id && !item.href && item.id !== 'focus'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-muted-foreground border border-slate-200 dark:border-slate-800'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Gen-Z Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-4 sm:p-8 shadow-xl border border-indigo-500/20">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold text-indigo-200">
                      <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      5-Day Study Streak • Keep Pushing!
                    </div>
                    <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
                      Welcome back, {user.name.split(' ')[0]}! 🚀
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                      You are in the <strong className="text-white">Top 10%</strong> of your class. Your current average is <strong className="text-emerald-400">{performanceData.averagePercentage}%</strong> with an overall grade of <strong className="text-amber-400">{performanceData.grade}</strong>.
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0">
                    <Button
                      onClick={() => router.push('/student/prac-perfect')}
                      className="flex-1 sm:flex-initial rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/30 px-4 sm:px-5 py-3 sm:py-5 active:scale-95 transition-all"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Practice Center
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('exams')}
                      className="flex-1 sm:flex-initial rounded-2xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border-white/20 py-3 sm:py-5"
                    >
                      View Exams
                    </Button>
                  </div>
                </div>
              </div>

              {/* 5 Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                <Card
                  onClick={() => router.push('/student/prac-perfect')}
                  className="rounded-2xl sm:rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <CardContent className="p-3 sm:p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">PracPerfect</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <span className="text-base sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">AI Trainer</span>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5">Practice</p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setActiveTab('exams')}
                  className="rounded-2xl sm:rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs hover:border-blue-500/50 transition-all cursor-pointer group"
                >
                  <CardContent className="p-3 sm:p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Exam</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <span className="text-sm sm:text-lg font-black text-foreground line-clamp-1">
                        {exams[0]?.name || "None"}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                        {exams[0]?.date ? new Date(exams[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Caught up"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => router.push('/exams/results')}
                  className="rounded-2xl sm:rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
                >
                  <CardContent className="p-3 sm:p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Latest Score</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <span className="text-base sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {lastResult ? `${lastResult.percentage}%` : "N/A"}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                        {lastResult ? lastResult.examTitle : "No results"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl sm:rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs">
                  <CardContent className="p-3 sm:p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Attendance</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <span className="text-base sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                        {attendanceData.percentage}%
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                        {attendanceData.present}/{attendanceData.total} days
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl sm:rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs col-span-2 sm:col-span-1">
                  <CardContent className="p-3 sm:p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Class Rank</span>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <span className="text-base sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                        #{classRank}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                        Out of {totalStudents} students
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Trends & Subject Strengths (Totally Revamped) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                {/* Performance Trends Chart (7 Cols) */}
                <Card className="lg:col-span-7 rounded-2xl sm:rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <TrendingUp className="h-4 w-4" />
                        </span>
                        <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                          Performance Trends
                        </h3>
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                        Track score trajectory over examinations
                      </p>
                    </div>

                    {/* Timeframe & Subject Controls */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(['5', '10', 'all'] as const).map((range) => (
                          <button
                            key={range}
                            onClick={() => { triggerHaptic(ImpactStyle.Light); setTrendRange(range); }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              trendRange === range
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {range === 'all' ? 'All' : `Last ${range}`}
                          </button>
                        ))}
                      </div>

                      {availableSubjects.length > 0 && (
                        <select
                          value={trendSubjectFilter}
                          onChange={(e) => setTrendSubjectFilter(e.target.value)}
                          className="text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border-0 px-2.5 py-1.5 text-foreground max-w-[130px] sm:max-w-none truncate"
                        >
                          <option value="all">All Subjects</option>
                          {availableSubjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Stats Bar */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average</span>
                      <div className="text-base sm:text-lg font-black text-foreground">{trendChartData.avgScore}%</div>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Peak</span>
                      <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">{trendChartData.maxScore}%</div>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Growth</span>
                      <div className={`text-base sm:text-lg font-black ${trendChartData.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                        {trendChartData.delta >= 0 ? `+${trendChartData.delta}%` : `${trendChartData.delta}%`}
                      </div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className="h-[220px] sm:h-[260px] w-full">
                    {trendChartData.items.length > 0 ? (
                      <Line
                        data={trendChartData.chart}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: { usePointStyle: true, boxWidth: 6, font: { size: 10, weight: 600 } }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              padding: 10,
                              cornerRadius: 12,
                              titleFont: { size: 11, weight: 'bold' },
                              bodyFont: { size: 11 }
                            }
                          },
                          scales: {
                            y: {
                              min: 0,
                              max: 100,
                              grid: { color: 'rgba(156, 163, 175, 0.1)' },
                              ticks: { font: { size: 9 } }
                            },
                            x: {
                              grid: { display: false },
                              ticks: { font: { size: 9 } }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        No examination records found for selected criteria.
                      </div>
                    )}
                  </div>
                </Card>

                {/* Subject Strengths Matrix (5 Cols) */}
                <Card className="lg:col-span-5 rounded-2xl sm:rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <Target className="h-4 w-4" />
                        </span>
                        <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                          Subject Strengths
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Domain mastery & proficiency ranking
                      </p>
                    </div>

                    {subjectMatrix.topSubject && (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 font-bold text-[10px]">
                        Top: {subjectMatrix.topSubject.subject} ({subjectMatrix.topSubject.avg}%)
                      </Badge>
                    )}
                  </div>

                  {/* Subject List with Progress Bars */}
                  <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                    {subjectMatrix.list.length > 0 ? (
                      subjectMatrix.list.map((sub, idx) => (
                        <div
                          key={sub.subject || idx}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-2 hover:border-indigo-500/40 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">{sub.subject}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  sub.status === 'Mastered'
                                    ? 'bg-emerald-100/50 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                    : sub.status === 'Proficient'
                                    ? 'bg-blue-100/50 text-blue-700 dark:text-blue-300 border-blue-300'
                                    : 'bg-amber-100/50 text-amber-700 dark:text-amber-300 border-amber-300'
                                }`}
                              >
                                {sub.status}
                              </Badge>
                              <span className="font-black text-foreground">{sub.avg}%</span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                sub.avg >= 85
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : sub.avg >= 65
                                  ? 'bg-gradient-to-r from-indigo-500 to-blue-400'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, sub.avg))}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        Take examinations to unlock your subject strengths breakdown.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* AI Insights & Performance Predictor */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AIAnalysisCard insights={analytics?.insights || []} />
                </div>
                <div>
                  <PerformancePredictor projection={analytics?.projection || null} />
                </div>
              </div>

              {/* Attendance & Achievements */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance */}
                <Card className="lg:col-span-2 rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-foreground">Monthly Attendance Matrix</h3>
                      <p className="text-xs text-muted-foreground">Current academic session presence</p>
                    </div>
                    <Badge variant="outline" className="font-bold text-xs">
                      {attendanceData.percentage}% Present
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {Array.from({ length: attendanceData.total || 30 }, (_, i) => {
                      const isPresent = i < attendanceData.present;
                      const isLate = !isPresent && i < (attendanceData.present + (attendanceData.late || 0));
                      const isAbsent = !isPresent && !isLate && i < (attendanceData.present + (attendanceData.late || 0) + (attendanceData.absent || 0));

                      return (
                        <div
                          key={i}
                          className={`h-7 w-7 rounded-xl flex items-center justify-center text-[10px] font-bold shadow-xs transition-all hover:scale-110 ${
                            isPresent
                              ? 'bg-emerald-500 text-white'
                              : isLate
                              ? 'bg-amber-500 text-white'
                              : isAbsent
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Achievements / Badges */}
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-foreground flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Badges
                    </h3>
                    <Badge variant="secondary" className="text-xs font-bold">
                      {badges.length} Earned
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {badges.length > 0 ? (
                      badges.slice(0, 3).map((b: any) => (
                        <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60">
                          <span className="text-2xl">{b.icon || '🏅'}</span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate">{b.title}</h4>
                            <p className="text-[10px] text-muted-foreground truncate">{b.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        Keep scoring above 80% to earn badges!
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Notice Board */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-indigo-500" />
                  Academic Notice Board
                </h3>
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 overflow-hidden shadow-sm">
                  <Accordion type="single" collapsible className="w-full">
                    {notices.map((n, i) => (
                      <AccordionItem key={n.id || i} value={`n-${i}`} className="px-5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <AccordionTrigger className="py-4 hover:no-underline">
                          <div className="flex items-center gap-3 text-left w-full pr-4">
                            <Badge
                              className={`text-[10px] font-bold ${
                                n.priority === 'HIGH'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                  : n.priority === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              }`}
                            >
                              {n.priority}
                            </Badge>
                            <span className="font-bold text-xs sm:text-sm text-foreground">{n.title}</span>
                            <span className="text-[11px] text-muted-foreground ml-auto hidden sm:inline-block">
                              {n.date ? new Date(n.date).toLocaleDateString() : ''}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 text-xs text-muted-foreground leading-relaxed">
                          {n.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              </div>
            </motion.div>
          )}

          {/* TAB 2: EXAMS & RESULTS HUB */}
          {activeTab === 'exams' && (
            <motion.div
              key="exams"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                    Exams & Evaluations Hub
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Access live/scheduled tests, take online exams, and review published results.
                  </p>
                </div>

                <Button
                  onClick={() => router.push('/exams/online')}
                  className="rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
                >
                  <Monitor className="h-4 w-4 mr-1.5" />
                  Browse Online Exams Portal
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>

              {/* Sub-Tab Navigation Bar & Filters */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    <button
                      onClick={() => { triggerHaptic(ImpactStyle.Light); setExamSubTab('upcoming'); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        examSubTab === 'upcoming'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Scheduled & Live Exams ({filteredScheduledExams.length})
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic(ImpactStyle.Light);
                        router.push('/exams/results');
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                    >
                      <Award className="h-3.5 w-3.5" />
                      Completed & Results ({filteredExamResults.length}) →
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Exam Type Filter */}
                    <select
                      value={examTypeFilter}
                      onChange={(e) => setExamTypeFilter(e.target.value)}
                      className="text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border-0 px-3 py-2 text-foreground"
                    >
                      <option value="all">All Types</option>
                      <option value="ONLINE">Online Exams</option>
                      <option value="OFFLINE">Offline Exams</option>
                      <option value="MIXED">Mixed Exams</option>
                    </select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by exam title or subject..."
                    value={examSearchQuery}
                    onChange={(e) => setExamSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              {/* VIEW 1: Scheduled & Live Exams */}
              {examSubTab === 'upcoming' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredScheduledExams.length > 0 ? (
                    filteredScheduledExams.map((exam, i) => {
                      const submission = examSubmissions.find((s: any) => s.examId === exam.id);
                      const isSubmitted = submission?.status === 'SUBMITTED';
                      const isInProgress = !isSubmitted && submission?.status === 'IN_PROGRESS';

                      const examStart = exam.startTime ? new Date(exam.startTime) : (() => { const d = new Date(exam.date); d.setHours(0, 0, 0, 0); return d; })();
                      const examEnd = exam.endTime ? new Date(exam.endTime) : (() => { const d = new Date(exam.date); d.setHours(23, 59, 59, 999); return d; })();

                      const isExpired = now > examEnd;
                      const isLive = !isExpired && now >= examStart;

                      return (
                        <motion.div
                          key={exam.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.04, 0.3) }}
                        >
                          <Card className={`rounded-3xl border overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col h-full ${
                            isLive
                              ? 'border-emerald-500/50 bg-gradient-to-br from-white via-emerald-50/20 to-white dark:from-slate-900 dark:via-emerald-950/15 dark:to-slate-900'
                              : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900'
                          }`}>
                            <div className="p-5 sm:p-6 flex flex-col h-full space-y-4">
                              <div className="flex items-center justify-between gap-2">
                                <Badge className="text-[10px] font-bold uppercase">
                                  {exam.type}
                                </Badge>

                                {isSubmitted && (
                                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-[10px]">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Submitted
                                  </Badge>
                                )}
                                {isInProgress && (
                                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-[10px] animate-pulse">
                                    ⏳ In Progress
                                  </Badge>
                                )}
                                {isLive && !isSubmitted && !isInProgress && (
                                  <Badge className="bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    LIVE NOW
                                  </Badge>
                                )}
                                {!isLive && !isExpired && !isSubmitted && (
                                  <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                                    Upcoming
                                  </Badge>
                                )}
                                {isExpired && !isSubmitted && (
                                  <Badge variant="outline" className="text-[10px] font-semibold text-slate-400">
                                    Ended
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                                  {exam.subject || 'General'}
                                </span>
                                <h3 className="text-base sm:text-lg font-black text-foreground line-clamp-2">
                                  {exam.name}
                                </h3>
                              </div>

                              {/* Timing Details */}
                              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between text-muted-foreground">
                                  <span>Start Date:</span>
                                  <span className="font-bold text-foreground">
                                    {examStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {examStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                  <span>Duration:</span>
                                  <span className="font-bold text-foreground">{exam.duration || 60} Mins</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                  <span>Total Marks:</span>
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{exam.totalMarks} Marks</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="mt-auto pt-2">
                                {exam.type === 'ONLINE' ? (
                                  isSubmitted ? (
                                    <Button
                                      variant="outline"
                                      onClick={() => router.push(`/exams/results/${exam.id}`)}
                                      className="w-full rounded-2xl font-bold text-xs h-10 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50"
                                    >
                                      <BarChart3 className="h-4 w-4 mr-1.5" />
                                      View Result & Answers
                                    </Button>
                                  ) : isLive || isInProgress ? (
                                    <Button
                                      onClick={() => router.push(`/exams/online/${exam.id}`)}
                                      className="w-full rounded-2xl font-bold text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                                    >
                                      <Play className="h-4 w-4 mr-1.5 fill-current" />
                                      {isInProgress ? 'Resume Live Exam' : 'Start Exam Now'}
                                    </Button>
                                  ) : isExpired ? (
                                    <Button
                                      variant="outline"
                                      onClick={() => router.push(`/exams/practice/${exam.id}`)}
                                      className="w-full rounded-2xl font-bold text-xs h-10 border-slate-300 hover:border-indigo-500"
                                    >
                                      <Sparkles className="h-4 w-4 mr-1.5 text-indigo-500" />
                                      Practice This Exam
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="secondary"
                                      onClick={() => router.push('/exams/online')}
                                      className="w-full rounded-2xl font-bold text-xs h-10"
                                    >
                                      <Clock className="h-4 w-4 mr-1.5" />
                                      Opens Soon
                                    </Button>
                                  )
                                ) : (
                                  <Button
                                    variant="outline"
                                    onClick={() => router.push(`/exams/${exam.id}/print`)}
                                    className="w-full rounded-2xl font-bold text-xs h-10"
                                  >
                                    <Download className="h-4 w-4 mr-1.5" />
                                    Admit Card & Info
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-16 text-center bg-white/60 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                      <Clock className="h-10 w-10 text-muted-foreground mx-auto" />
                      <h4 className="font-bold text-base">No upcoming exams found</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        You have no scheduled exams matching this filter. Check back soon!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: Completed Exam Results (Online, Offline, Mixed) */}
              {examSubTab === 'results' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredExamResults.length > 0 ? (
                    filteredExamResults.map((result, i) => (
                      <motion.div
                        key={result.id || result.examId || i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      >
                        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
                          <div className="p-5 sm:p-6 flex flex-col h-full space-y-4">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                {result.type || 'EXAM'}
                              </Badge>
                              {result.rank && (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-[10px]">
                                  Rank #{result.rank}
                                </Badge>
                              )}
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-[10px]">
                                Grade: {result.grade || 'A'}
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                                {result.subject || 'General'}
                              </span>
                              <h3 className="text-base sm:text-lg font-black text-foreground line-clamp-2">
                                {result.examTitle}
                              </h3>
                              <p className="text-[11px] text-muted-foreground">
                                Completed on {result.date ? new Date(result.date).toLocaleDateString() : 'Recent'}
                              </p>
                            </div>

                            {/* Score Breakdown */}
                            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Marks</span>
                                <div className="text-lg font-black text-foreground">
                                  {result.score} / {result.totalMarks}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Percentage</span>
                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                  {result.percentage}%
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto pt-2 flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => router.push(`/exams/results/${result.examId}`)}
                                className="flex-1 rounded-2xl font-bold text-xs h-10 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50"
                              >
                                <BarChart3 className="h-4 w-4 mr-1.5" />
                                View Result Details
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => router.push(`/exams/practice/${result.examId}`)}
                                className="rounded-2xl font-bold text-xs h-10 px-3 hover:border-indigo-500"
                                title="Practice Again"
                              >
                                <Sparkles className="h-4 w-4 text-indigo-500" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center bg-white/60 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                      <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto" />
                      <h4 className="font-bold text-base">No completed results found</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Results will appear here automatically once your examinations are graded and published.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: DEEP ANALYTICS */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <StudentAnalyticsTab analytics={analytics} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}