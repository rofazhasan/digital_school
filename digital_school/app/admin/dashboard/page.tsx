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
  ChevronDown,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from "next-themes";

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardSidebar, MobileDashboardSidebar, SidebarItem } from '@/components/dashboard/DashboardSidebar';



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
  const { theme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
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

  const [instituteSettings, setInstituteSettings] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setInstituteSettings).catch(console.error);
    fetch('/api/user').then(r => r.json()).then(data => setUser(data.user)).catch(console.error);
  }, []);

  const instituteName = instituteSettings?.instituteName || "Digital School";
  // const instituteLogo = instituteSettings?.logoUrl || "/logo.png"; // Unused for now

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      </div>

      <DashboardSidebar
        items={sidebarItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        user={user}
        instituteName={instituteName}
        onLogout={handleLogout}
      />

      <MobileDashboardSidebar
        items={sidebarItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={mobileSidebarOpen}
        setIsOpen={setMobileSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-background/50 backdrop-blur-sm transition-colors relative z-10">
        {/* Top Bar with User Menu */}
        <header className="h-20 py-4 bg-background/80 backdrop-blur-xl sticky top-0 z-40 border-b border-border flex items-center justify-between px-4 md:px-8">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:hidden text-center pl-2">
            <h1 className="font-bold text-lg text-foreground">
              {sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden md:flex items-center gap-2 mr-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-muted/50"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
              </Button>
            </div>
            <div className="h-8 w-[1px] bg-border hidden md:block"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 focus:outline-none group p-1 rounded-full border-2 border-transparent hover:border-border transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                    {user?.name?.[0] || 'A'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-2 rounded-xl shadow-xl border-border backdrop-blur-xl bg-card/90" align="end" forceMount>
                <div className="px-2 py-3 bg-muted/50 rounded-lg mb-2">
                  <p className="text-sm font-semibold leading-none text-foreground">{user?.name || 'Admin'}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email || 'admin@school.com'}</p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => setActiveTab('settings')} className="rounded-lg cursor-pointer py-2.5">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer py-2.5">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
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
          <div className="mt-8">
            <AppFooter />
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab() {
  const [stats, setStats] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const router = useRouter();

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);
  }, []);

  return (
    <div className="p-0">
      <div className="mb-6 lg:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Manage your institution efficiently.</p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {[
          { title: "Total Users", icon: Users, value: stats?.totalUsers, label: `+${stats?.newUsers || 0} this week`, color: 'blue', bg: 'bg-blue-500' },
          { title: "Active Teachers", icon: UserCheck, value: stats?.activeTeachers || 0, label: "Teaching staffs", color: 'emerald', bg: 'bg-emerald-500' },
          { title: "Active Exams", icon: FileText, value: stats?.activeExams || 0, label: "Ongoing exams", color: 'violet', bg: 'bg-violet-500' },
          { title: "Tokens Used", icon: Zap, value: stats?.aiUsage || 0, label: "AI credits", color: 'amber', bg: 'bg-amber-500' }
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            <Card className="rounded-2xl border border-border shadow-md bg-card overflow-hidden relative group hover:shadow-xl transition-all duration-300">
              <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110`} />

              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground z-10">{item.title}</CardTitle>
                <div className={`p-2 rounded-xl ${item.bg} bg-opacity-10 text-${item.color}-600`}>
                  <item.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-1">{item.value !== undefined ? item.value : '...'}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className={`text-${item.color}-600 font-medium`}>{item.label}</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-500" /> Quick Actions
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Add Student', icon: Users, color: 'text-blue-500', href: '/admin/users?role=STUDENT' },
          { label: 'Add Teacher', icon: UserCheck, color: 'text-emerald-500', href: '/admin/users?role=TEACHER' },
          { label: 'Create Exam', icon: FileText, color: 'text-violet-500', href: '/exams' },
          { label: 'Question Bank', icon: BookOpen, color: 'text-amber-500', href: '/question-bank' },
        ].map((action, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center justify-center p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`p-4 rounded-full bg-muted/50 mb-3 group-hover:bg-primary/10 transition-colors`}>
              <action.icon className={`h-6 w-6 ${action.color}`} />
            </div>
            <span className="font-semibold text-sm text-foreground/80 group-hover:text-foreground transition-colors">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest logs from the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Activity className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">System Backup Completed</p>
                    <p className="text-xs text-muted-foreground">Today, 10:23 AM</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-destructive" />
                  <span className="text-sm font-medium text-destructive dark:text-red-300">Review Exam Results</span>
                </div>
                <Badge variant="outline" className="bg-background text-destructive border-destructive/20">Urgent</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-900 dark:text-amber-200">Approve Teacher Leave</span>
                </div>
                <Badge variant="outline" className="bg-background text-amber-600 border-amber-500/20">Pending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClassesTab() {
  const [classes, setClasses] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
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
    <div className="p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Classes Management</h1>
          <p className="text-muted-foreground text-sm">Manage class structures and sections.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Add Class
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search classes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md pl-10 h-10 bg-card border-border rounded-xl"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cls: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden border border-border bg-card rounded-2xl group cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                <div className="h-2 w-full bg-gradient-to-r from-primary to-indigo-500" />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{cls.name}</CardTitle>
                      <CardDescription className="font-mono text-xs mt-1 bg-muted px-2 py-0.5 rounded inline-block">
                        {cls.section ? `SEC-${cls.section}` : 'NO SECTION'}
                      </CardDescription>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><UserCheck className="w-3.5 h-3.5" /> Teacher</span>
                      <span className="font-medium truncate max-w-[120px]">{cls.teacher?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Students</span>
                      <span className="font-medium bg-muted px-2 py-0.5 rounded-full text-xs">
                        {cls.students?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2 pt-4 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full hover:text-primary hover:bg-primary/10">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No classes found</h3>
              <p className="text-muted-foreground">Try adjusting your search query.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
