"use client";

import { useEffect, useState } from "react";
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
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppFooter } from "@/components/AppFooter";
import { StudentAnalyticsTab } from "@/components/dashboard/student-tabs";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT';
  studentProfile?: {
    roll: string;
    registrationNo: string;
    class: {
      name: string;
      section: string;
    };
    classId: string; // Added classId based on usage
  };
}

interface Exam {
  id: string;
  name: string;
  subject: string;
  examSet: string;
  date: string;
  time: string;
  type: 'ONLINE' | 'OFFLINE' | 'MIXED';
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  totalMarks: number;
}

interface Result {
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  totalStudents: number;
  gpa: number;
  grade?: string;
  feedback: string;
  date: string;
  examId?: string;
  total?: number;
}

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  color: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function StudentDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [attendance, setAttendance] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [notices, setNotices] = useState<Notice[]>([]);
  const [analytics, setAnalytics] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  // Fetch user, exams, results, and attendance from API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'STUDENT') {
          if (isMounted) setUser(data.user);
          // Fetch exams after user is loaded
          fetch('/api/exams?limit=100')
            .then(res => res.json())
            .then(resData => {
              // Handle both array and { data: [] } format
              const examData = Array.isArray(resData) ? resData : (resData.exams || resData.data || []);

              let filtered = [];
              const userClassId = data.user.studentProfile?.classId;

              if (userClassId && Array.isArray(examData)) {
                // Show all exams for the student's class
                filtered = examData.filter((exam: any) => exam.classId === userClassId); // eslint-disable-line @typescript-eslint/no-explicit-any
              }
              if (isMounted) setExams(filtered);
            })
            .catch((err) => {
              console.error("Failed to fetch exams", err);
              if (isMounted) setExams([]);
            });

          // Fetch results
          fetch('/api/student/results')
            .then(res => res.json())
            .then(resultData => {
              if (isMounted) setResults(resultData.results || []);
            })
            .catch(() => {
              if (isMounted) setResults([]);
            });

          // Fetch attendance (legacy) - Keeping for now, but analytics endpoint provides it too
          fetch('/api/student/attendance')
            .then(res => res.json())
            .then(attData => {
              if (isMounted) setAttendance(attData.summary || null);
            })
            .catch(() => {
              if (isMounted) setAttendance(null);
            });

          // Fetch new Analytics
          fetch('/api/student/analytics')
            .then(res => res.json())
            .then(analyticsData => {
              if (isMounted) setAnalytics(analyticsData.analytics);
            })
            .catch(console.error);

          // Fetch Notices
          fetch('/api/student/notices')
            .then(res => res.json())
            .then(noticeData => {
              if (isMounted) setNotices(noticeData.notices || []);
            })
            .catch(console.error);

        } else if (data.user) {
          const userRole = data.user.role;
          let redirectUrl = '/dashboard';
          switch (userRole) {
            case 'SUPER_USER':
              redirectUrl = '/super-user/dashboard';
              break;
            case 'ADMIN':
              redirectUrl = '/admin/dashboard';
              break;
            case 'TEACHER':
              redirectUrl = '/teacher/dashboard';
              break;
            default:
              redirectUrl = '/dashboard';
          }
          router.push(redirectUrl);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [router]);

  // Use the latest result for overview and results section
  const lastResult = results && results.length > 0 ? results[0] : null;
  const attendanceData = analytics?.attendance || attendance || { percentage: 0, present: 0, absent: 0, late: 0, total: 30 };
  const performanceData = analytics?.performance || { averagePercentage: 0, gpa: 0, grade: '-' };
  const classRank = analytics?.rank || '-';
  const totalStudents = analytics?.totalStudents || '-';

  // Real badges can be fetched or we can leave mock for now if not implemented fully in backend yet.
  // The analytics endpoint returns badges. let's use them if available.
  const badges = analytics?.badges || [];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'LOW': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const [instituteSettings, setInstituteSettings] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setInstituteSettings).catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const instituteName = instituteSettings?.instituteName || "Digital School";
  const instituteLogo = instituteSettings?.logoUrl || "/logo.png";

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black font-sans relative overflow-x-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
                  {/* Use a clear specific text or Icon if image fails, but here we keep the image logic if present, else fallback */}
                  {instituteLogo && instituteLogo !== '/logo.png' ? <img src={instituteLogo} alt={instituteName} className="h-6 w-auto object-contain brightness-0 invert" /> : "DS"}
                </div>
                <span className="font-bold text-xl hidden sm:block tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                  {instituteName}
                </span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: Home },
                  { id: 'exams', label: 'Exams', icon: FileText },
                  { id: 'prac-perfect', label: 'PracPerfect', icon: Sparkles, href: '/student/prac-perfect' },
                  { id: 'results', label: 'Results', icon: BarChart3, href: '/exams/results' },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                  { id: 'notices', label: 'Notices', icon: Bell }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.href) {
                        router.push(item.href);
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === item.id
                      ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'text-blue-500' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-auto rounded-full pl-2 pr-4 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md ring-2 ring-white dark:ring-gray-950">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="hidden sm:block text-sm font-semibold leading-none text-foreground">{user.name}</span>
                      <span className="hidden sm:block text-[10px] text-muted-foreground leading-none mt-1 font-medium">{user.role}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2 rounded-2xl shadow-xl border-gray-100 dark:border-gray-800 backdrop-blur-xl bg-white/90 dark:bg-gray-950/90" align="end" forceMount>
                <div className="px-3 py-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl mb-2">
                  <p className="text-sm font-semibold leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                <DropdownMenuItem className="rounded-lg cursor-pointer py-2.5 focus:bg-gray-100 dark:focus:bg-gray-800">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg cursor-pointer py-2.5 focus:bg-gray-100 dark:focus:bg-gray-800">
                  <User className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10 rounded-lg cursor-pointer py-2.5">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="lg:hidden sticky top-20 z-40 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-2 py-3 overflow-x-auto no-scrollbar scroll-smooth snap-x items-center custom-scrollbar">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'exams', label: 'Exams', icon: FileText },
              { id: 'prac-perfect', label: 'PracPerfect', icon: Sparkles, href: '/student/prac-perfect' },
              { id: 'results', label: 'Results', icon: BarChart3, href: '/exams/results' },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'notices', label: 'Notices', icon: Bell }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.href) {
                    router.push(item.href);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeTab === item.id
                  ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-md'
                  : 'bg-white dark:bg-gray-900 text-muted-foreground border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <>
                {/* Welcome Section */}
                <div className="mb-8">
                  <h1 className="text-3xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Welcome back, {user.name}! 👋
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg">
                    Here&apos;s what&apos;s happening with your studies today.
                  </p>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card
                      className="border-0 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer bg-white/60 dark:bg-gray-900/60 backdrop-blur-md group"
                      onClick={() => router.push('/student/prac-perfect')}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform" />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Practice</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300 font-mono tracking-tight">PracPerfect</div>
                        <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                          Start personalized session
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card className="border-0 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all bg-white/60 dark:bg-gray-900/60 backdrop-blur-md group overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform" />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground z-10">Next Exam</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center z-10">
                          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      </CardHeader>
                      <CardContent className="z-10 relative">
                        {exams.length > 0 ? (
                          <>
                            <div className="text-xl font-bold truncate">{exams[0].name}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {exams[0].date ? new Date(exams[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''} • {exams[0].subject}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-xl font-bold text-muted-foreground/50">None</div>
                            <p className="text-xs text-muted-foreground mt-1">No upcoming exams</p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card className="border-0 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 transition-all bg-white/60 dark:bg-gray-900/60 backdrop-blur-md group overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-500/20 to-transparent rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform" />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground z-10">Last Result</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center z-10">
                          <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      </CardHeader>
                      <CardContent className="z-10 relative">
                        {lastResult ? (
                          <>
                            <div className="text-xl font-bold">{lastResult.percentage ? `${lastResult.percentage}%` : lastResult.grade || '-'}</div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {lastResult.examTitle} {lastResult && lastResult.rank != null ? `• Rank ${lastResult.rank}` : ''}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-xl font-bold text-muted-foreground/50">-</div>
                            <div className="text-muted-foreground text-xs mt-1">No results yet</div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card className="border-0 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all bg-white/60 dark:bg-gray-900/60 backdrop-blur-md group overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform" />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground z-10">Attendance</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center z-10">
                          <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                      </CardHeader>
                      <CardContent className="z-10 relative">
                        <div className="text-xl font-bold">{attendanceData.percentage}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {attendanceData.present} present • {attendanceData.absent} absent
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card className="border-0 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all bg-white/60 dark:bg-gray-900/60 backdrop-blur-md group overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform" />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground z-10">GPA / Grade</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center z-10">
                          <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                      </CardHeader>
                      <CardContent className="z-10 relative">
                        <div className="text-xl font-bold">{performanceData.grade}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          CGPA: {performanceData.gpa}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Attendance & Class Rank Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <Card className="lg:col-span-2 shadow-lg shadow-gray-200/50 dark:shadow-none border-0 bg-white dark:bg-gray-900">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-primary" />
                        Attendance Visualizer
                      </CardTitle>
                      <CardDescription>Your attendance record for the current month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                          <span className="text-2xl md:text-4xl font-bold text-primary">{attendanceData.percentage}%</span>
                          <span className="text-sm text-muted-foreground">Overall Attendance</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Present</div>
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Late</div>
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Absent</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: attendanceData.total || 30 }, (_, i) => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                            key={i}
                            className={`h-8 w-8 rounded-md flex items-center justify-center text-xs font-medium text-white shadow-sm transition-all hover:scale-110 ${i < attendanceData.present
                              ? 'bg-green-500'
                              : i < attendanceData.present + attendanceData.late
                                ? 'bg-yellow-500'
                                : i < (attendanceData.present + attendanceData.late + attendanceData.absent)
                                  ? 'bg-red-500'
                                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                              }`}
                          >
                            {i < (attendanceData.present + attendanceData.late + attendanceData.absent) ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <span>{i + 1}</span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg shadow-primary/5 border-primary/10 bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-900 dark:to-gray-900/50">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-primary" />
                        Class Standing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                      <div className="relative mb-4">
                        <div className="w-32 h-32 rounded-full border-8 border-white dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl flex items-center justify-center ring-4 ring-primary/10">
                          <span className="text-3xl md:text-5xl font-bold text-primary">#{classRank}</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" /> Top 10%
                        </div>
                      </div>
                      <p className="text-muted-foreground font-medium">Out of {totalStudents} students</p>
                      <div className="mt-6 w-full">
                        <div className="flex justify-between text-xs mb-2 font-medium">
                          <span>Percentile</span>
                          <span>92%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '92%' }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="bg-primary h-full rounded-full"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Badges and Leaderboard */}
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2"><Award className="w-6 h-6 text-yellow-500" /> Achievements</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <Card className="shadow-lg shadow-gray-200/50 dark:shadow-none border-0 h-full bg-white dark:bg-gray-900">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                            Your Badges
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {badges.length > 0 ? badges.map((badge: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                              <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center space-x-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all cursor-default group"
                              >
                                <div className="text-3xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">{badge.icon || '🏅'}</div>
                                <div>
                                  <div className="font-semibold text-sm">{badge.title}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">{badge.description}</div>
                                  <div className="text-[10px] text-muted-foreground mt-1 opacity-70">{badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : ''}</div>
                                </div>
                              </motion.div>
                            )) : (
                              <div className="col-span-full py-8 text-center text-muted-foreground bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed">
                                <Award className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                No badges earned yet. Keep performing well!
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="shadow-lg shadow-gray-200/50 dark:shadow-none border-0 h-full bg-white dark:bg-gray-900">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                          Leaderboard
                        </CardTitle>
                        <CardDescription>Top performers this month</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(analytics?.leaderboard || []).length > 0 ? analytics.leaderboard.map((student: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                            <div
                              key={student.rank}
                              className={`flex items-center justify-between p-3 rounded-xl transition-all ${student.isCurrent
                                ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${student.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' :
                                  student.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                    student.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' :
                                      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500'
                                  }`}>
                                  {student.rank}
                                </div>
                                <div>
                                  <div className={`font-medium text-sm ${student.isCurrent ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                                    {student.name}
                                  </div>
                                  {student.isCurrent && <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                                </div>
                              </div>
                              <span className="font-bold text-sm tracking-tight">{student.score}%</span>
                            </div>
                          )) : (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                              No leaderboard data available yet.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Notices */}
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2"><Bell className="w-6 h-6 text-primary" /> Notice Board</h2>
                  <Card className="border-t-4 border-t-primary shadow-lg shadow-gray-200/50 dark:shadow-none border-x-0 border-b-0">
                    <Accordion type="single" collapsible className="w-full">
                      {notices.map((notice, index) => (
                        <AccordionItem key={notice.id} value={`item-${index}`} className="px-4 border-b border-gray-100 dark:border-gray-800">
                          <AccordionTrigger className="hover:no-underline py-4 group">
                            <div className="flex items-center gap-3 text-left w-full pr-4">
                              <Badge className={`${getPriorityColor(notice.priority)} border-0`}>
                                {notice.priority}
                              </Badge>
                              <span className="font-medium group-hover:text-primary transition-colors">{notice.title}</span>
                              <span className="text-xs text-muted-foreground font-normal ml-auto whitespace-nowrap hidden sm:inline-block">{notice.date}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 pt-1 text-muted-foreground">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-sm leading-relaxed border border-gray-100 dark:border-gray-800">
                              {notice.content}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                      {notices.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                          </div>
                          <p>No new notices at the moment.</p>
                        </div>
                      )}
                    </Accordion>
                  </Card>
                </div>
              </>
            )}

            {/* Exams Tab */}
            {activeTab === 'exams' && (
              <div className="mb-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold">My Exams</h2>
                    <p className="text-muted-foreground">View and manage your upcoming examinations</p>
                  </div>
                  <Button variant="default" onClick={() => router.push('/exams/online')} className="shadow-lg shadow-primary/20 rounded-xl">
                    See Online Exams <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.length > 0 ? (
                    exams.map((exam, i) => (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500 overflow-hidden group rounded-2xl bg-white dark:bg-gray-900">
                          <CardHeader className="bg-gray-50/50 dark:bg-gray-900 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={exam.type === 'ONLINE' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider font-bold">
                                {exam.type}
                              </Badge>
                              <span className="text-xs font-mono text-muted-foreground bg-white dark:bg-gray-950 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800">
                                {exam.time ? new Date(`2000-01-01T${exam.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                              </span>
                            </div>
                            <CardTitle className="text-lg md:text-xl group-hover:text-primary transition-colors">{exam.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <BookOpen className="w-3 h-3" /> {exam.subject}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="font-medium">{exam.date ? new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''}</span>
                            </div>

                            {/* Marks & Rank Section */}
                            {(() => {
                              const result = results.find((r: any) => r.examId === exam.id); // eslint-disable-line @typescript-eslint/no-explicit-any
                              if (result) {
                                return (
                                  <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center border border-blue-100 dark:border-blue-900/30">
                                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Marks</div>
                                      <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{result.total} / {exam.totalMarks}</div>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg text-center border border-amber-100 dark:border-amber-900/30">
                                      <div className="text-lg font-bold text-amber-700 dark:text-amber-300">#{result.rank || '-'}</div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <div className="flex space-x-2">
                              {exam.type === 'ONLINE' ? (
                                <Button className="w-full group-hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20" onClick={() => router.push('/exams/online')}>
                                  <Play className="h-4 w-4 mr-2 fill-current" />
                                  Start Exam
                                </Button>
                              ) : (
                                <Button variant="outline" className="w-full rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                                  <Download className="h-4 w-4 mr-2" />
                                  Admit Card
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
                      <div className="bg-white dark:bg-gray-950 p-4 rounded-full shadow-sm mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-lg">No Upcoming Exams</h3>
                      <p className="text-muted-foreground max-w-sm mt-1">You&apos;re all caught up! Check back later for new schedules.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'results' && <div className="p-4"><h1 className="text-2xl font-bold">Results Module</h1><p className="text-muted-foreground">Redirecting...</p>{/* Logic to redirect handled in nav */}</div>}
            {activeTab === 'analytics' && <StudentAnalyticsTab analytics={analytics} />}
            {/* Other tabs placeholders */}

          </motion.div>
        </AnimatePresence>
      </main>

      <div className="relative z-10 mt-12 bg-white dark:bg-black">
        <AppFooter />
      </div>
    </div>
  );
}