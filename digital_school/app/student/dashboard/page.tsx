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
  DropdownMenuLabel,
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
  GraduationCap,
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
  Users,
  Megaphone,
  ChevronDown,
  Home,
  Target,
  CheckCircle,
  XCircle,
  Minus,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Sparkles
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
  feedback: string;
  date: string;
}

interface Badge {
  id: string;
  name: string;
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
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [analytics, setAnalytics] = useState<any>(null); // Replace with proper type
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
                filtered = examData.filter((exam: any) => exam.classId === userClassId);
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
  const attendanceData = analytics?.attendance || attendance || { percentage: 0, present: 0, absent: 0, late: 0, total: 0 };
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
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const [instituteSettings, setInstituteSettings] = useState<any>(null);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <img src={instituteLogo} alt={instituteName} className="h-8 w-auto object-contain" />
                <span className="font-semibold text-lg hidden sm:block">{instituteName}</span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-6">
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
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === item.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-auto rounded-full px-2 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-primary-foreground shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start px-1">
                      <span className="hidden sm:block text-sm font-medium leading-none">{user.name}</span>
                      <span className="hidden sm:block text-xs text-muted-foreground leading-none mt-1">{user.role}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-b bg-background/95 backdrop-blur overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 py-3 overflow-x-auto no-scrollbar scroll-smooth snap-x">
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
                className={`flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
                  }`}
              >
                <item.icon className="h-3 w-3" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Welcome back, {user.name}! 👋
                </h1>
                <p className="text-muted-foreground text-lg">
                  Here's what's happening with your studies today.
                </p>
              </div>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
                <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card
                    className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-indigo-50/30"
                    onClick={() => router.push('/student/prac-perfect')}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-indigo-900">Practice Perfectly</CardTitle>
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-indigo-700 font-mono tracking-tight">PracPerfect</div>
                      <p className="text-xs text-indigo-600/70 mt-1">
                        Personalized practice sessions
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Next Exam</CardTitle>
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {exams.length > 0 ? (
                        <>
                          <div className="text-2xl font-bold truncate">{exams[0].name}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {exams[0].subject} • {exams[0].date ? new Date(exams[0].date).toLocaleDateString() : ''}
                          </p>
                        </>
                      ) : (
                        <div className="text-muted-foreground">No upcoming exams</div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Last Result</CardTitle>
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {lastResult ? (
                        <>
                          <div className="text-2xl font-bold">{lastResult.percentage ? `${lastResult.percentage}%` : lastResult.grade || '-'}</div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {lastResult.examTitle} {lastResult && lastResult.rank != null ? `• Rank ${lastResult.rank}` : ''}
                          </p>
                        </>
                      ) : (
                        <div className="text-muted-foreground">No results yet</div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Attendance</CardTitle>
                      <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{attendanceData.percentage}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {attendanceData.present} present, {attendanceData.absent} absent
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Overall Grade</CardTitle>
                      <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceData.grade}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        GPA: {performanceData.gpa}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Attendance & Class Rank Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="lg:col-span-2 shadow-sm">
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
                        <span className="text-4xl font-bold text-primary">{attendanceData.percentage}%</span>
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
                          className={`h-8 w-8 rounded-md flex items-center justify-center text-xs font-medium text-white shadow-sm ${i < attendanceData.present
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

                <Card className="shadow-sm border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      Class Standing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <div className="relative mb-4">
                      <div className="w-32 h-32 rounded-full border-8 border-background bg-white dark:bg-gray-900 shadow-xl flex items-center justify-center">
                        <span className="text-5xl font-bold text-primary">#{classRank}</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> Top 10%
                      </div>
                    </div>
                    <p className="text-muted-foreground font-medium">Out of {totalStudents} students</p>
                    <div className="mt-6 w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Percentile</span>
                        <span>92%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Badges and Leaderboard */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Award className="w-6 h-6 text-yellow-500" /> Achievements</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Card className="shadow-sm h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                          Your Badges
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {badges.length > 0 ? badges.map((badge: any, i: number) => (
                            <motion.div
                              key={badge.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-center space-x-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors cursor-default group"
                            >
                              <div className="text-3xl group-hover:scale-110 transition-transform duration-300">{badge.icon || '🏅'}</div>
                              <div>
                                <div className="font-semibold text-sm">{badge.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">{badge.description}</div>
                                <div className="text-[10px] text-muted-foreground mt-1 opacity-70">{badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : ''}</div>
                              </div>
                            </motion.div>
                          )) : (
                            <div className="col-span-full py-8 text-center text-muted-foreground">
                              <Award className="w-12 h-12 mx-auto mb-2 opacity-20" />
                              No badges earned yet. Keep performing well!
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="shadow-sm h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                        Leaderboard
                      </CardTitle>
                      <CardDescription>Top performers this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(analytics?.leaderboard || []).length > 0 ? analytics.leaderboard.map((student: any) => (
                          <div
                            key={student.rank}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all ${student.isCurrent
                              ? 'bg-primary/10 border border-primary/20 shadow-sm transform scale-[1.02]'
                              : 'hover:bg-muted/50'
                              }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${student.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' :
                                student.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                  student.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' :
                                    'bg-muted text-muted-foreground'
                                }`}>
                                {student.rank}
                              </div>
                              <span className={`font-medium ${student.isCurrent ? 'text-primary' : ''}`}>
                                {student.name}
                                {student.isCurrent && <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">YOU</span>}
                              </span>
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
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Bell className="w-6 h-6 text-primary" /> Notice Board</h2>
                <Card className="border-t-4 border-t-primary shadow-sm">
                  <Accordion type="single" collapsible className="w-full">
                    {notices.map((notice, index) => (
                      <AccordionItem key={notice.id} value={`item-${index}`} className="px-4">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center space-x-3 text-left">
                            <Badge className={getPriorityColor(notice.priority)}>
                              {notice.priority}
                            </Badge>
                            <span className="font-medium">{notice.title}</span>
                            <span className="text-xs text-muted-foreground font-normal ml-2 hidden sm:inline-block">• {notice.date}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 pt-1 text-muted-foreground">
                          <div className="bg-muted/30 p-4 rounded-md text-sm">
                            {notice.content}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    {notices.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        No new notices.
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
                  <h2 className="text-3xl font-bold">My Exams</h2>
                  <p className="text-muted-foreground">View and manage your upcoming examinations</p>
                </div>
                <Button variant="default" onClick={() => router.push('/exams/online')} className="shadow-lg shadow-primary/20">
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
                      <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500 overflow-hidden group">
                        <CardHeader className="bg-muted/20 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={exam.type === 'ONLINE' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider">
                              {exam.type}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded border">
                              {exam.time ? new Date(`2000-01-01T${exam.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                            </span>
                          </div>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">{exam.name}</CardTitle>
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
                            const result = results.find((r: any) => r.examId === exam.id);
                            if (result) {
                              return (
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center">
                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Marks</div>
                                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{result.total} / {exam.totalMarks}</div>
                                  </div>
                                  <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg text-center">
                                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Rank</div>
                                    <div className="text-lg font-bold text-amber-700 dark:text-amber-300">#{result.rank || '-'}</div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <div className="flex space-x-2">
                            {exam.type === 'ONLINE' ? (
                              <Button className="w-full group-hover:bg-primary/90" onClick={() => router.push('/exams/online')}>
                                <Play className="h-4 w-4 mr-2 fill-current" />
                                Start Exam
                              </Button>
                            ) : (
                              <Button variant="outline" className="w-full">
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
                  <div className="col-span-full flex flex-col items-center justify-center py-16 bg-muted/20 rounded-xl border border-dashed">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No upcoming exams</h3>
                    <p className="text-muted-foreground text-center max-w-sm mt-2">You don't have any scheduled exams regarding your criteria at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="mb-8 max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold">Latest Results</h2>
                  <p className="text-muted-foreground">Detailed analysis of your performance</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>

              <Card className="overflow-hidden border-2 border-primary/10 shadow-lg mb-8">
                <div className="bg-primary/5 p-6 border-b border-primary/10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                        {lastResult ? lastResult.examTitle : 'No results found'}
                        {lastResult && <Badge className={lastResult.percentage >= 80 ? 'bg-green-500' : lastResult.percentage >= 60 ? 'bg-blue-500' : 'bg-yellow-500'}>{lastResult.percentage ? 'Passed' : 'Pending'}</Badge>}
                      </h3>
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <BookOpen className="w-4 h-4" /> {lastResult ? lastResult.subject : '-'}
                        <span className="inline-block w-1 h-1 rounded-full bg-gray-300 mx-1"></span>
                        <Calendar className="w-4 h-4" /> {lastResult && lastResult.date ? new Date(lastResult.date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 bg-background px-6 py-3 rounded-xl shadow-sm border">
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Score</span>
                        <div className="text-3xl font-extrabold text-foreground">{lastResult ? (lastResult.percentage || 0) : 0}%</div>
                      </div>
                      <div className="w-px h-8 bg-border"></div>
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Grade</span>
                        <div className="text-3xl font-extrabold text-primary">{lastResult ? (lastResult.grade || '-') : '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  {lastResult ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex flex-col items-center">
                          <div className="text-sm text-muted-foreground mb-1">Total Marks</div>
                          <div className="text-2xl font-bold">{lastResult.total}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex flex-col items-center">
                          <div className="text-sm text-muted-foreground mb-1">Pass Marks</div>
                          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">33</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex flex-col items-center">
                          <div className="text-sm text-muted-foreground mb-1">Class Rank</div>
                          <div className="text-2xl font-bold text-orange-500">#{lastResult.rank || '-'}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex flex-col items-center">
                          <div className="text-sm text-muted-foreground mb-1">Percentile</div>
                          <div className="text-2xl font-bold text-blue-500">Top 15%</div>
                        </div>
                      </div>

                      {lastResult.comment && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-4">
                          <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full h-fit text-blue-600 dark:text-blue-300">
                            <Megaphone className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Teacher's Feedback</h4>
                            <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                              "{lastResult.comment}"
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      No detailed results available to display for this exam.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="mb-8 max-w-7xl 2xl:max-w-[95vw] mx-auto">
              <h2 className="text-3xl font-bold mb-6">Academic Analytics</h2>
              <StudentAnalyticsTab analytics={analytics} />
            </div>
          )}

          {/* Notices Tab */}
          {activeTab === 'notices' && (
            <div className="mb-8 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Notice Board</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {notices.map((notice, index) => (
                      <div key={notice.id} className="p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer">{notice.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" /> {notice.date}
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className={
                                notice.priority === 'HIGH' ? 'text-red-500 font-medium' :
                                  notice.priority === 'MEDIUM' ? 'text-orange-500' : 'text-green-500'
                              }>{notice.priority} Priority</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0">{notice.priority}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mt-3 border">
                          {notice.content}
                        </p>
                      </div>
                    ))}
                  </div>
                  {notices.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      No notices posted yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </main>

      <AppFooter />
    </div>
  );
} 