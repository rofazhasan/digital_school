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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings,
  Users,
  Building,
  BookOpen,
  BarChart3,
  Shield,
  LogOut,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  FileText,
  Download,
  Upload,
  Palette,
  Zap,
  CreditCard,
  Bell,
  ChevronDown,
  Home,
  UserPlus,
  FileCheck,
  History,
  Monitor,
  DollarSign,
  Moon,
  Sun,
  Search,
  Filter,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  CheckSquare,
  Square,
  Clock as ClockIcon,
  UserCheck,
  FileBarChart,
  Database,
  Settings as SettingsIcon,
  Bell as BellIcon,
  Mail,
  Phone,
  MapPin,
  Globe,
  Crown,
  User,
  Menu,
  X,
  Brain
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_USER' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  isActive: boolean;
  createdAt: string;
  institute?: {
    id: string;
    name: string;
  };
}

interface Institute {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logo?: string;
  primaryColor?: string;
  signature?: string;
  maintenanceMode?: boolean;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  type: 'OMR' | 'CQ';
  createdBy: string;
  totalStudents: number;
}

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
  type: 'EXAM' | 'USER' | 'SYSTEM' | 'AI';
}

interface PendingApproval {
  id: string;
  type: 'EXAM' | 'GRADING' | 'MARK_RELEASE';
  title: string;
  submittedBy: string;
  submittedAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AIUsage {
  userId: string;
  userName: string;
  tokensUsed: number;
  requests: number;
  lastUsed: string;
}

export default function SuperUserDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [aiUsageData, setAiUsageData] = useState<AIUsage[]>([]);

  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'SUPER_USER') {
          setUser(data.user);
        } else if (data.user) {
          const userRole = data.user.role;
          let redirectUrl = '/dashboard';
          switch (userRole) {
            case 'ADMIN': redirectUrl = '/admin/dashboard'; break;
            case 'TEACHER': redirectUrl = '/teacher/dashboard'; break;
            case 'STUDENT': redirectUrl = '/student/dashboard'; break;
            default: redirectUrl = '/dashboard';
          }
          router.push(redirectUrl);
        } else {
          router.push('/login');
        }
      })
      .catch(() => { router.push('/login'); })
      .finally(() => { setLoading(false); });

    fetch('/api/institute')
      .then(res => res.json())
      .then(data => { if (data.institute) setInstitute(data.institute); })
      .catch(console.error);

    // Fetch initial settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.maintenanceMode === 'boolean') {
          setInstitute(prev => prev ? ({ ...prev, maintenanceMode: data.maintenanceMode }) : null);
        }
      })
      .catch(console.error);

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);

    fetch('/api/super-user/recent-exams')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch recent exams');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setRecentExams(data);
        } else {
          console.warn('Invalid recent exams data:', data);
          setRecentExams([]);
        }
      })
      .catch(error => {
        console.error('Error fetching recent exams:', error);
        setRecentExams([]);
      });

    fetch('/api/super-user/activity-logs')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch activity logs');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setActivityLogs(data);
        } else {
          console.warn('Invalid activity logs data:', data);
          setActivityLogs([]);
        }
      })
      .catch(error => {
        console.error('Error fetching activity logs:', error);
        setActivityLogs([]);
      });

    fetch('/api/super-user/pending-approvals')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch pending approvals');
        }
        return res.json();
      })
      .then(data => {
        // Transform the API response to match the expected format
        const transformedApprovals = [
          ...(data.pendingUsers || []).map((user: any) => ({
            id: user.id,
            type: 'USER' as const,
            title: `User Activation: ${user.name}`,
            submittedBy: user.email,
            submittedAt: new Date(user.createdAt).toLocaleDateString(),
            priority: 'MEDIUM' as const
          })),
          ...(data.pendingEvaluations || []).map((evaluation: any) => ({
            id: evaluation.id,
            type: 'EXAM' as const,
            title: `Exam Evaluation: ${evaluation.exam?.name || 'Unknown Exam'}`,
            submittedBy: evaluation.evaluator?.name || 'Unknown Evaluator',
            submittedAt: new Date(evaluation.assignedAt).toLocaleDateString(),
            priority: 'HIGH' as const
          }))
        ];
        setPendingApprovals(transformedApprovals);
      })
      .catch(error => {
        console.error('Error fetching pending approvals:', error);
        setPendingApprovals([]);
      });

    fetch('/api/super-user/ai-usage')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch AI usage');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAiUsageData(data);
        } else {
          console.warn('Invalid AI usage data:', data);
          setAiUsageData([]);
        }
      })
      .catch(error => {
        console.error('Error fetching AI usage:', error);
        setAiUsageData([]);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    console.log(`${action} approval for id: ${id}`);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'EXAM': return <FileText className="h-4 w-4" />;
      case 'USER': return <Users className="h-4 w-4" />;
      case 'SYSTEM': return <Settings className="h-4 w-4" />;
      case 'AI': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Super User Dashboard...</p>
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
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10 border border-border hover:bg-muted"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="Digital School" className="h-8 w-auto" />
                <span className="font-semibold text-lg hidden sm:block">
                  {institute?.name || "Digital School"}
                </span>
              </div>
              <Badge className="bg-purple-500 text-white hidden sm:flex">
                <Shield className="h-4 w-4 mr-1" />
                SUPER USER
              </Badge>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={toggleDarkMode}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button variant="ghost" size="icon" className="hidden sm:flex h-10 w-10">
                <Bell className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-2 sm:mx-4"></div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 px-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground">Super User</p>
                      </div>
                      <ChevronDown className="h-4 w-4 hidden sm:block" />
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
                    <span>Profile</span>
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
        </div>
      </header>

      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!sidebarOpen}
        />

        {/* Sidebar */}
        <aside className={`
          fixed md:relative z-50 w-64 border-r min-h-screen transition-all duration-300 ease-in-out transform
          ${sidebarOpen ? 'translate-x-0 scale-100 opacity-100' : '-translate-x-full scale-95 opacity-0'}
          md:translate-x-0 md:scale-100 md:opacity-100 md:block
          shadow-2xl md:shadow-none border-r border-border bg-gradient-to-b from-muted/80 via-background/90 to-muted/60
        `}>
          <div className="flex items-center justify-between p-4 border-b md:hidden">
            <span className="font-semibold">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Home },
              { id: 'users', label: 'Manage Users', icon: Users, href: '/admin/users' },
              { id: 'exams', label: 'Exam Management', icon: FileText, href: '/exams' },
              { id: 'question-bank', label: 'Question Bank', icon: BookOpen, href: '/question-bank' },
              { id: 'approvals', label: 'Pending Approvals', icon: CheckSquare },
              { id: 'ai-usage', label: 'AI Usage Monitor', icon: Zap },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'logs', label: 'System Logs', icon: History },
              { id: 'settings', label: 'Institute Settings', icon: Settings },
              { id: 'billing', label: 'Billing', icon: CreditCard }
            ].map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.href) {
                    router.push(item.href);
                  } else {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === item.id
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                  ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                  md:opacity-100 md:translate-x-0
                  delay-[${idx * 40}ms]`}
                style={{ transitionProperty: 'opacity, transform, box-shadow, background, color' }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Super User Dashboard</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Welcome back, {user.name}! Here's what's happening with your { } institute today.
              </p>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 md:space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs md:text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg md:text-2xl font-bold">{stats?.totalUsers || 'N/A'}</div>
                      <p className="text-xs text-muted-foreground">
                        +{stats?.newUsers || '0'} new this week
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs md:text-sm font-medium">Exams Today</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg md:text-2xl font-bold">{stats?.examsToday || 'N/A'}</div>
                      <p className="text-xs text-muted-foreground">
                        Across all classes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs md:text-sm font-medium">AI Usage</CardTitle>
                      <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg md:text-2xl font-bold">{stats?.aiUsage || 'N/A'}</div>
                      <p className="text-xs text-muted-foreground">
                        Tokens used this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs md:text-sm font-medium">Pending Approvals</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg md:text-2xl font-bold">{stats?.pendingApprovals || 'N/A'}</div>
                      <p className="text-xs text-muted-foreground">
                        Require your attention
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activities and Pending Approvals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base md:text-lg">
                        <Activity className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                        Recent Activities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 md:space-y-4">
                        {(activityLogs || []).slice(0, 5).map((log) => (
                          <div key={log.id} className="flex items-start space-x-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                              {getActivityIcon(log.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm font-medium truncate">{log.action}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{log.details}</p>
                              <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base md:text-lg">
                        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                        Pending Approvals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 md:space-y-4">
                        {(pendingApprovals || []).slice(0, 3).map((approval) => (
                          <div key={approval.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm font-medium truncate">{approval.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {approval.submittedBy} • {approval.submittedAt}
                              </p>
                              <Badge className={`text-xs ${getPriorityColor(approval.priority)}`}>
                                {approval.priority}
                              </Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => handleApproval(approval.id, 'approve')}>
                                <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleApproval(approval.id, 'reject')}>
                                <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Exams */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <CardTitle className="flex items-center text-base md:text-lg">
                        <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                        Recent Exams
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                        Download Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs md:text-sm">Title</TableHead>
                            <TableHead className="text-xs md:text-sm hidden md:table-cell">Subject</TableHead>
                            <TableHead className="text-xs md:text-sm hidden lg:table-cell">Date</TableHead>
                            <TableHead className="text-xs md:text-sm">Type</TableHead>
                            <TableHead className="text-xs md:text-sm">Status</TableHead>
                            <TableHead className="text-xs md:text-sm hidden md:table-cell">Students</TableHead>
                            <TableHead className="text-xs md:text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(recentExams || []).map((exam) => (
                            <TableRow key={exam.id}>
                              <TableCell className="font-medium text-xs md:text-sm">
                                <div>
                                  <div className="truncate max-w-[120px] md:max-w-none">{exam.title}</div>
                                  <div className="text-xs text-muted-foreground md:hidden">{exam.subject}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm hidden md:table-cell">{exam.subject}</TableCell>
                              <TableCell className="text-xs md:text-sm hidden lg:table-cell">{exam.date}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{exam.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${getStatusColor(exam.status)}`}>
                                  {exam.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm hidden md:table-cell">{exam.totalStudents}</TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <SettingsIcon className="mr-2 h-5 w-5" />
                      Institute Settings
                    </CardTitle>
                    <CardDescription>
                      Manage global settings for your institute
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                          <h3 className="font-medium text-base">Maintenance Mode</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          When enabled, only Admins and Super Users can access the system.
                          <br />Students and Teachers will be logged out and blocked.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={maintenanceMode ? "destructive" : "default"}
                          onClick={async () => {
                            try {
                              const newState = !maintenanceMode;
                              const res = await fetch('/api/settings', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ maintenanceMode: newState })
                              });

                              if (res.ok) {
                                const data = await res.json();
                                setMaintenanceMode(data.maintenanceMode);
                              }
                            } catch (err) {
                              console.error('Failed to toggle maintenance mode', err);
                            }
                          }}
                        >
                          {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                        </Button>
                      </div>
                    </div>

                    {/* Other settings placeholders */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">General Information</h3>
                        <p className="text-sm text-muted-foreground mb-4">Update institute name, address, and contacts.</p>
                        <Button variant="outline" size="sm">Manage Info</Button>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Branding</h3>
                        <p className="text-sm text-muted-foreground mb-4">Upload logo, signature, and set colors.</p>
                        <Button variant="outline" size="sm">Manage Branding</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other tabs placeholder */}
            {activeTab !== 'overview' && activeTab !== 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardTitle>
                  <CardDescription>
                    This section is under development.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    The {activeTab} functionality will be implemented soon.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}