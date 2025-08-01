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
  MapPin
} from "lucide-react";

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
          fetch('/api/exams')
            .then(res => res.json())
            .then(examData => {
              let filtered = examData;
              if (data.user.studentProfile?.class?.name) {
                filtered = examData.filter((exam: any) => exam.subject === data.user.studentProfile.class.name);
              }
              if (isMounted) setExams(filtered);
            })
            .catch(() => {
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
          // Fetch attendance
          fetch('/api/student/attendance')
            .then(res => res.json())
            .then(attData => {
              if (isMounted) setAttendance(attData.summary || null);
            })
            .catch(() => {
              if (isMounted) setAttendance(null);
            });
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
  const attendanceData = attendance || { percentage: 0, present: 0, absent: 0, late: 0, total: 0 };

  const badges = [
    {
      id: '1',
      name: 'Top Performer',
      description: 'Achieved highest score in Mathematics',
      icon: '🏆',
      earnedAt: '2024-01-10',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: '2',
      name: 'Perfect Attendance',
      description: '100% attendance this month',
      icon: '📅',
      earnedAt: '2024-01-05',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: '3',
      name: 'Quick Learner',
      description: 'Completed 5 assignments early',
      icon: '⚡',
      earnedAt: '2024-01-08',
      color: 'bg-blue-100 text-blue-800'
    }
  ];

  const notices = [
    {
      id: '1',
      title: 'Mid-Term Examination Schedule',
      content: 'The mid-term examinations will begin from January 15th. Please check your admit cards and exam schedules.',
      date: '2024-01-12',
      priority: 'HIGH'
    },
    {
      id: '2',
      title: 'Science Fair Registration',
      content: 'Registration for the annual science fair is now open. Submit your project proposals by January 20th.',
      date: '2024-01-11',
      priority: 'MEDIUM'
    },
    {
      id: '3',
      title: 'Library Hours Extended',
      content: 'Library hours have been extended until 8 PM for exam preparation.',
      date: '2024-01-10',
      priority: 'LOW'
    }
  ];

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">DS</span>
                </div>
                <span className="font-semibold text-lg hidden sm:block">Digital School</span>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: Home },
                  { id: 'exams', label: 'Exams', icon: FileText },
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
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground'
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
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                    <ChevronDown className="h-4 w-4" />
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
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 py-2 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'exams', label: 'Exams', icon: FileText },
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
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
      <main className="container mx-auto px-4 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
              <p className="text-muted-foreground">
                Here's what's happening with your studies today.
              </p>
            </div>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Exam</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {exams.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold">{exams[0].name}</div>
                      <p className="text-xs text-muted-foreground">
                        {exams[0].subject} • {exams[0].date ? new Date(exams[0].date).toLocaleDateString() : ''}
                      </p>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No upcoming exams</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Result</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {lastResult ? (
                    <>
                      <div className="text-2xl font-bold">{lastResult.percentage ? `${lastResult.percentage}%` : lastResult.grade || '-'}</div>
                      <p className="text-xs text-muted-foreground">
                        {lastResult.examTitle} {lastResult && lastResult.rank != null ? `• Rank ${lastResult.rank}` : ''}
                      </p>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No results yet</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceData.percentage}%</div>
                  <p className="text-xs text-muted-foreground">
                    {attendanceData.present} present, {attendanceData.absent} absent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Grade</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastResult ? lastResult.grade || '-' : '-'}</div>
                  <p className="text-xs text-muted-foreground">
                    Current semester average
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Summary */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Attendance Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-primary">{attendanceData.percentage}%</div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Present: {attendanceData.present}</div>
                        <div className="text-sm text-muted-foreground">Absent: {attendanceData.absent}</div>
                        <div className="text-sm text-muted-foreground">Late: {attendanceData.late}</div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {Array.from({ length: attendanceData.total || 20 }, (_, i) => (
                        <div
                          key={i}
                          className={`h-4 w-4 rounded-sm ${
                            i < attendanceData.present
                              ? 'bg-green-500'
                              : i < attendanceData.present + attendanceData.late
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Class Rank
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">{lastResult && lastResult.rank != null ? `#${lastResult.rank}` : '-'}</div>
                      <p className="text-sm text-muted-foreground">
                        Out of {lastResult && lastResult.totalStudents != null ? lastResult.totalStudents : '-'} students
                      </p>
                      <div className="mt-4 flex items-center justify-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">+2 positions this month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Badges and Leaderboard */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Badges & Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Trophy className="h-5 w-5 mr-2" />
                        Your Badges
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {badges.map((badge) => (
                          <div key={badge.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                            <div className="text-2xl">{badge.icon}</div>
                            <div>
                              <div className="font-medium">{badge.name}</div>
                              <div className="text-sm text-muted-foreground">{badge.description}</div>
                              <div className="text-xs text-muted-foreground">{badge.earnedAt}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Leaderboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { rank: 1, name: 'Sarah Johnson', score: 95, isCurrent: false },
                        { rank: 2, name: 'Mike Chen', score: 92, isCurrent: false },
                        { rank: 3, name: user.name, score: 85, isCurrent: true },
                        { rank: 4, name: 'Emma Wilson', score: 83, isCurrent: false },
                        { rank: 5, name: 'Alex Brown', score: 80, isCurrent: false }
                      ].map((student) => (
                        <div
                          key={student.rank}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            student.isCurrent ? 'bg-primary/10 border border-primary/20' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              student.rank === 1 ? 'bg-yellow-500 text-white' :
                              student.rank === 2 ? 'bg-gray-400 text-white' :
                              student.rank === 3 ? 'bg-orange-500 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {student.rank}
                            </div>
                            <span className={`font-medium ${student.isCurrent ? 'text-primary' : ''}`}>
                              {student.name}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{student.score}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Notices */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Recent Notices</h2>
              <Accordion type="single" collapsible className="w-full">
                {notices.map((notice, index) => (
                  <AccordionItem key={notice.id} value={`item-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center space-x-3">
                        <Badge className={getPriorityColor(notice.priority)}>
                          {notice.priority}
                        </Badge>
                        <span className="font-medium">{notice.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{notice.content}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Posted on {notice.date}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Offline & Mixed Exams</h2>
              <Button variant="default" size="sm" onClick={() => router.push('/exams/online')}>
                See Online Exams
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.length > 0 ? (
                exams
                  .filter(exam => exam.type === 'OFFLINE' || exam.type === 'MIXED')
                  .map((exam) => (
                    <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{exam.name}</CardTitle>
                          <Badge variant={exam.type === 'ONLINE' ? 'default' : 'secondary'}>
                            {exam.type}
                          </Badge>
                        </div>
                        <CardDescription>
                          {exam.subject} • {exam.date ? new Date(exam.date).toLocaleDateString() : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex space-x-2">
                          <Button variant="outline" className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Download Admit Card
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <div className="text-muted-foreground">No exams found</div>
              )}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Latest Results</h2>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{lastResult ? lastResult.examTitle : 'No results yet'}</span>
                  <Badge variant="outline">{lastResult ? `${lastResult.percentage || lastResult.grade || '-'}%` : '-'}</Badge>
                </CardTitle>
                <CardDescription>
                  {lastResult ? `${lastResult.subject} • ${lastResult.date ? new Date(lastResult.date).toLocaleDateString() : ''}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lastResult ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{lastResult.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{lastResult && lastResult.rank != null ? lastResult.rank : '-'}</div>
                      <div className="text-sm text-muted-foreground">Rank</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{lastResult.grade || '-'}</div>
                      <div className="text-sm text-muted-foreground">Grade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.length}</div>
                      <div className="text-sm text-muted-foreground">Total Results</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No results to display</div>
                )}
                {lastResult && lastResult.comment && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Teacher's Feedback:</p>
                    <p className="text-sm text-muted-foreground">{lastResult.comment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Analytics</h2>
            {/* Add analytics content here */}
            <div className="text-muted-foreground">Analytics coming soon...</div>
          </div>
        )}

        {/* Notices Tab */}
        {activeTab === 'notices' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recent Notices</h2>
            <Accordion type="single" collapsible className="w-full">
              {notices.map((notice, index) => (
                <AccordionItem key={notice.id} value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-3">
                      <Badge className={getPriorityColor(notice.priority)}>
                        {notice.priority}
                      </Badge>
                      <span className="font-medium">{notice.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{notice.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Posted on {notice.date}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">DS</span>
                </div>
                <span className="font-semibold text-lg">Digital School</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Empowering education through technology. Providing comprehensive digital solutions for modern learning.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-foreground">About Us</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground">Contact</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground">Privacy Policy</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground">Terms of Service</a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>123 Education Street</p>
                <p>Dhaka, Bangladesh</p>
                <p>Phone: +880 1234-567890</p>
                <p>Email: info@digitalschool.edu</p>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Digital School. Made with ❤️ by{' '}
              <a href="#" className="text-primary hover:underline font-medium">
                Md. Rofaz Hasan Rafiu
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 