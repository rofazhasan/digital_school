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
import { motion, AnimatePresence } from "framer-motion";

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
  logoUrl?: string; // Corrected from logo
  colorTheme?: any; // Added colorTheme
  signatureUrl?: string; // Corrected from signature
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

// Add Dialog imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";



import { ApprovalsTab, AiUsageTab, SystemLogsTab, AnalyticsTab, ProfileTab } from "@/components/dashboard/super-user-tabs";

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
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function SuperUserDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Settings State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    instituteName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    signatureUrl: '',
    primaryColor: '#000000'
  });

  // Load initial data into form
  useEffect(() => {
    if (institute) {
      setFormData(prev => ({
        ...prev,
        instituteName: institute.name || '',
        address: institute.address || '',
        phone: institute.phone || '',
        email: institute.email || '',
        website: institute.website || '',
        logoUrl: institute.logoUrl || '',
        signatureUrl: institute.signatureUrl || '',
        primaryColor: (institute.colorTheme as any)?.primary || '#000000'
      }));
    }
  }, [institute]);

  const handleSaveSettings = async (type: 'info' | 'branding') => {
    try {
      setIsSaving(true);
      const payload: any = {};

      if (type === 'info') {
        payload.instituteName = formData.instituteName;
        payload.address = formData.address;
        payload.phone = formData.phone;
        payload.email = formData.email;
        payload.website = formData.website;
      } else {
        payload.logoUrl = formData.logoUrl;
        payload.signatureUrl = formData.signatureUrl;
        payload.colorTheme = { primary: formData.primaryColor };
      }

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Reload institute data
        const updated = await res.json();
        // We might need to refresh the whole page or just re-fetch institute
        // Ideally, just update state:
        fetch('/api/institute')
          .then(r => r.json())
          .then(d => { if (d.institute) setInstitute(d.institute); });

        setSettingsOpen(false);
        setBrandingOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [aiUsageData, setAiUsageData] = useState<AIUsage[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);

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

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.maintenanceMode === 'boolean') {
          setMaintenanceMode(data.maintenanceMode);
        }
      })
      .catch(console.error);

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);

    fetch('/api/super-user/recent-exams')
      .then(res => res.json())
      .then(data => Array.isArray(data) && setRecentExams(data))
      .catch(console.error);

    fetch('/api/super-user/activity-logs')
      .then(res => res.json())
      .then(data => Array.isArray(data) && setActivityLogs(data))
      .catch(console.error);

    fetch('/api/super-user/pending-approvals')
      .then(res => res.json())
      .then(data => {
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
      .catch(console.error);

    fetch('/api/super-user/ai-usage')
      .then(res => res.json())
      .then(data => Array.isArray(data) && setAiUsageData(data))
      .catch(console.error);

    // System Stats fetching
    const fetchSystemStats = () => {
      fetch('/api/super-user/system-stats')
        .then(res => res.json())
        .then(data => setSystemStats(data))
        .catch(console.error);
    };

    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 30000);

    return () => clearInterval(interval);
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
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800';
      case 'REJECTED': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800';
      case 'COMPLETED': return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-800';
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
      <header className="sticky top-0 z-40 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/30 hidden md:flex">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                    {institute?.name || "Digital School"}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">Super User Panel</span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-500" />}
                </Button>

                <Button variant="ghost" size="icon" className="hidden sm:flex h-10 w-10 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 relative">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>
                </Button>
              </div>

              <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 px-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md ring-2 ring-white dark:ring-gray-950">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-semibold leading-none">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Super User</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block ml-1" />
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
                  <DropdownMenuItem onClick={() => setActiveTab('profile')} className="rounded-lg cursor-pointer py-2.5 focus:bg-gray-100 dark:focus:bg-gray-800">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
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
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <div className="flex">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-hidden={!sidebarOpen}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed md:relative z-50 w-72 h-screen border-r border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-2xl md:shadow-none transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30 flex-shrink-0">
                  SU
                </div>
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 whitespace-nowrap">
                  Super User
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 space-y-1.5 px-3 custom-scrollbar">
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
              ].map((item) => (
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
                  className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden text-left ${activeTab === item.id
                    ? 'bg-purple-50/80 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full" />
                  )}
                  <div className={`
                    p-2 rounded-lg transition-all duration-300 flex-shrink-0
                    ${activeTab === item.id ? 'bg-white dark:bg-gray-800 shadow-sm text-purple-600 dark:text-purple-400' : 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-500 group-hover:bg-white group-hover:shadow-sm dark:group-hover:bg-gray-700'}
                `}>
                    <item.icon className="w-5 h-5" />
                  </div>

                  <span className="ml-3 font-medium text-sm flex-1 truncate">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl 2xl:max-w-[95vw] mx-auto w-full">
          <div>
            {/* Page Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Super User Dashboard</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Welcome back, {user.name}! Here's what's happening with your { } institute today.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4 md:space-y-6">
                    {/* System Status Banner */}
                    {systemStats && (
                      <Card className={`border-none shadow-sm bg-gradient-to-r ${systemStats.status === 'Operational' ? 'from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20' : 'from-rose-500/10 to-rose-500/5 border border-rose-500/20'}`}>
                        <CardContent className="py-3 px-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full animate-pulse ${systemStats.status === 'Operational' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-sm font-semibold">System {systemStats.status}</span>
                            <span className="text-xs text-muted-foreground hidden md:inline">• {systemStats.latency}ms Latency • {systemStats.uptime} Uptime</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] opacity-70">
                            Last Refreshed: {new Date().toLocaleTimeString()}
                          </Badge>
                        </CardContent>
                      </Card>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      {[
                        { title: "Total Users", icon: Users, value: stats?.totalUsers, label: `+${stats?.newUsers || 0} new this week` },
                        { title: "Exams Today", icon: Calendar, value: stats?.examsToday, label: "Across all classes" },
                        { title: "AI Usage", icon: Zap, value: stats?.aiUsage, label: "Tokens used this month" },
                        { title: "Pending Approvals", icon: Clock, value: stats?.pendingApprovals, label: "Require your attention" }
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="hover:shadow-lg transition-shadow duration-300 border-indigo-100/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-xs md:text-sm font-medium">{item.title}</CardTitle>
                              <item.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-lg md:text-2xl font-bold">{item.value || 'N/A'}</div>
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Recent Activities and Pending Approvals */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Card className="h-full hover:shadow-md transition-shadow">
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
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Card className="h-full hover:shadow-md transition-shadow">
                          <CardHeader>
                            <CardTitle className="flex items-center text-base md:text-lg">
                              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                              Pending Approvals
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3 md:space-y-4">
                              {(pendingApprovals || []).slice(0, 3).map((approval) => (
                                <div key={approval.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-2 sm:space-y-0 hover:bg-slate-50 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs md:text-sm font-medium truncate">{approval.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {approval.submittedBy} • {approval.submittedAt}
                                    </p>
                                    <Badge className={`text-xs ${getPriorityColor(approval.priority)} mt-1`}>
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
                      </motion.div>
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
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-colors">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 className="h-4 w-4" />
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
                </motion.div>
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

                          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">Manage Info</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>General Information</DialogTitle>
                                <DialogDescription>Update your institute's public details.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Institute Name</Label>
                                  <Input value={formData.instituteName} onChange={e => setFormData({ ...formData, instituteName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Address</Label>
                                  <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Phone</Label>
                                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Email</Label>
                                  <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Website</Label>
                                  <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={() => handleSaveSettings('info')} disabled={isSaving}>
                                  {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium mb-2">Branding</h3>
                          <p className="text-sm text-muted-foreground mb-4">Upload logo, signature, and set colors.</p>

                          <Dialog open={brandingOpen} onOpenChange={setBrandingOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">Manage Branding</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                              <DialogHeader>
                                <DialogTitle>Institute Branding</DialogTitle>
                                <DialogDescription>Customize your institute's look and feel.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                  <Label>Details</Label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-xs">Primary Color</Label>
                                      <div className="flex items-center gap-2 mt-1">
                                        <input
                                          type="color"
                                          value={formData.primaryColor}
                                          onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                          className="h-8 w-12 cursor-pointer"
                                        />
                                        <Input
                                          value={formData.primaryColor}
                                          onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                          className="h-8"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Institute Logo</Label>
                                  <div className="border rounded p-2">
                                    {formData.logoUrl && <img src={formData.logoUrl} alt="Logo" className="h-10 mb-2 object-contain" />}
                                    <div className="border border-dashed rounded p-4 text-center">
                                      <Input type="file" accept="image/*" className="max-w-xs mx-auto mb-2" />
                                      <p className="text-xs text-muted-foreground">Logo upload temporarily unavailable</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Digital Signature</Label>
                                  <div className="border rounded p-2">
                                    {formData.signatureUrl && <img src={formData.signatureUrl} alt="Signature" className="h-10 mb-2 object-contain" />}
                                    <div className="border border-dashed rounded p-4 text-center">
                                      <Input type="file" accept="image/*" className="max-w-xs mx-auto mb-2" />
                                      <p className="text-xs text-muted-foreground">Signature upload temporarily unavailable</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={() => handleSaveSettings('branding')} disabled={isSaving}>
                                  {isSaving ? 'Saving...' : 'Save Branding'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}


              {/* Other Tabs with Animation */}
              {activeTab !== 'overview' && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'approvals' && <ApprovalsTab approvals={pendingApprovals} />}
                  {activeTab === 'ai-usage' && <AiUsageTab data={aiUsageData} />}
                  {activeTab === 'logs' && <SystemLogsTab logs={activityLogs} />}
                  {activeTab === 'analytics' && <AnalyticsTab systemStats={systemStats} />}
                  {activeTab === 'profile' && <ProfileTab user={user} />}

                  {!['overview', 'settings', 'approvals', 'ai-usage', 'logs', 'analytics', 'profile'].includes(activeTab) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardTitle>
                        <CardDescription>This section is under development.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">The {activeTab} functionality will be implemented soon.</p>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}