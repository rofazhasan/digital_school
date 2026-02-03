'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  GraduationCap,
  FileText,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Home,
  UserCheck,
  BookOpen,
  ClipboardList,
  CreditCard,
  MessageSquare,
  Activity,
  Shield,
  Menu,
  X,
  Scan,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Zap,
  User,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppFooter } from '@/components/AppFooter';
import {
  AdminAnalyticsTab,
  AttendanceTab,
  NoticesTab,
  BillingTab,
  ChatTab,
  SecurityTab,
  AdminSettingsTab,
  AdminAdmitCardsTab
} from "@/components/dashboard/admin-tabs";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

const sidebarItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: Home, href: '#overview' },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
  { id: 'classes', label: 'Classes', icon: GraduationCap, href: '#classes' },
  { id: 'exams', label: 'Exams', icon: FileText, href: '/exams' },
  { id: 'questions', label: 'Question Bank', icon: BookOpen, href: '/question-bank' },
  { id: 'admit-cards', label: 'Admit Cards', icon: ClipboardList, href: '#admit-cards' },
  { id: 'results', label: 'Results', icon: BarChart3, href: '/exams/results' },
  { id: 'omr-scanner', label: 'OMR Scanner', icon: Scan, href: '/omr_scanner' },
  { id: 'attendance', label: 'Attendance', icon: Calendar, href: '#attendance' },
  { id: 'notices', label: 'Notices', icon: Bell, href: '#notices' },
  { id: 'billing', label: 'Billing', icon: CreditCard, href: '#billing' },
  { id: 'chat', label: 'Chat Support', icon: MessageSquare, href: '#chat' },
  { id: 'analytics', label: 'Analytics', icon: Activity, href: '#analytics' },
  { id: 'security', label: 'Security', icon: Shield, href: '#security' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '#settings' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'classes':
        return <ClassesTab />;
      case 'admit-cards':
        return <AdminAdmitCardsTab />;
      case 'attendance':
        return <AttendanceTab />;
      case 'notices':
        return <NoticesTab />;
      case 'billing':
        return <BillingTab />;
      case 'chat':
        return <ChatTab />;
      case 'analytics':
        return <AdminAnalyticsTab />;
      case 'security':
        return <SecurityTab />;
      case 'settings':
        return <AdminSettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  const [instituteSettings, setInstituteSettings] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setInstituteSettings).catch(console.error);
    fetch('/api/user').then(r => r.json()).then(data => setUser(data.user)).catch(console.error);
  }, []);

  const instituteName = instituteSettings?.instituteName || "Digital School";
  const instituteLogo = instituteSettings?.logoUrl || "/logo.png";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 bg-opacity-60 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ width: 280 }}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className={`fixed lg:relative z-50 h-full bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
              className="flex items-center gap-2"
            >
              <img src={instituteLogo} alt={instituteName} className="h-8 w-auto object-contain" />
              <span className="text-xl lg:text-2xl font-bold text-gray-800">{instituteName}</span>
            </motion.div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronDown className={`w-5 h-5 transform transition-transform ${sidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.href && item.href.startsWith('/')) {
                    router.push(item.href);
                  } else {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center px-3 lg:px-4 py-3 lg:py-3 rounded-lg transition-all duration-200 text-sm lg:text-base font-medium min-h-[44px] ${activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600 shadow-sm ring-2 ring-blue-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
              >
                <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                <motion.span
                  initial={{ opacity: 1 }}
                  animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
                  className="flex-1 text-left"
                >
                  {item.label}
                </motion.span>
                {item.badge && (
                  <motion.span
                    initial={{ opacity: 1 }}
                    animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
                    className={`text-xs px-2 py-1 rounded-full font-semibold min-w-[20px] text-center ${activeTab === item.id
                      ? 'bg-blue-200 text-blue-700'
                      : 'bg-blue-100 text-blue-600'
                      }`}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar with User Menu */}
        <div className="flex items-center justify-between px-4 lg:px-8 py-4 bg-white border-b border-gray-200 relative z-10 shadow-sm">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 lg:hidden" />

          <div className="relative ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center space-x-2 focus:outline-none group p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <span className="inline-block w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm lg:text-lg shadow-sm">
                    AD
                  </span>
                  <span className="hidden md:inline text-gray-800 font-medium">{user?.name || 'Admin'}</span>
                  <ChevronDown className="w-4 h-4 ml-1 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Admin'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || 'admin@school.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
          <AppFooter />,
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);
  }, []);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 text-sm lg:text-base">Welcome back! Here&apos;s what&apos;s happening with your school.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {[
          { title: "Total Users", icon: Users, value: stats?.totalUsers, label: `+${stats?.newUsers || 0} this week`, color: 'blue' },
          { title: "Active Teachers", icon: UserCheck, value: stats?.activeTeachers || 0, label: "Teaching staffs", color: 'green' },
          { title: "Active Exams", icon: FileText, value: stats?.activeExams || 0, label: "Ongoing exams", color: 'purple' },
          { title: "AI Usage", icon: Zap, value: stats?.aiUsage || 0, label: "Tokens used", color: 'yellow' }
        ].map((item, index) => (
          <Card key={index} className="rounded-xl shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <item.icon className={`h-4 w-4 text-${item.color}-600`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value !== undefined ? item.value : '...'}</div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you perform often</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => router.push('/admin/users?role=STUDENT')}>
              <Users className="h-6 w-6 text-blue-500" />
              <span>Add Student</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => router.push('/admin/users?role=TEACHER')}>
              <UserCheck className="h-6 w-6 text-green-500" />
              <span>Add Teacher</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => router.push('/exams')}>
              <FileText className="h-6 w-6 text-purple-500" />
              <span>Create Exam</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => router.push('/question-bank')}>
              <BookOpen className="h-6 w-6 text-yellow-500" />
              <span>Question Bank</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Activity logs will appear here.</p>
              {/* Could map real logs here if available */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Review Exam Results</span>
                <Badge variant="outline">Pending</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Approve Teacher Leave</span>
                <Badge variant="outline">Pending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClassesTab() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if (data.classes) setClasses(data.classes);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes Management</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Class
        </Button>
      </div>
      <div className="mb-6">
        <Input
          placeholder="Search classes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center py-10">Loading classes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cls: any) => (
            <Card key={cls.id}>
              <CardHeader>
                <CardTitle>{cls.name}</CardTitle>
                <CardDescription>{cls.section ? `Section ${cls.section}` : 'No Section'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Teacher: {cls.teacher?.name || 'Unassigned'}</p>
                  <p>Students: {cls.students?.length || 0}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="w-full">View</Button>
                  <Button variant="outline" size="sm" className="w-full">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground">No classes found.</p>}
        </div>
      )}
    </div>
  );
}

