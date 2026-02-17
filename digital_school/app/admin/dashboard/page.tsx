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
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative font-sans selection:bg-primary/20">
      {/* Background Elements - More sophisticated for a "WOW" effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[140px] animate-pulse delay-700" />
        <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-violet-500/5 rounded-full blur-[120px]" />
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
      <div className="flex-1 overflow-hidden flex flex-col bg-background/20 backdrop-blur-md transition-colors relative z-10">
        {/* Top Bar with User Menu - Refined with glass effect */}
        <header className="h-24 py-4 bg-background/40 backdrop-blur-2xl sticky top-0 z-40 border-b border-border/40 flex items-center justify-between px-6 md:px-12">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-3 rounded-2xl hover:bg-muted transition-all text-muted-foreground border border-transparent active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:hidden text-center pl-4">
            <h1 className="font-black text-xl text-foreground tracking-tight">
              {sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="hidden lg:flex flex-col">
            <h1 className="font-black text-2xl text-foreground tracking-tight leading-none">
              {sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground/60 mt-1 uppercase tracking-[0.1em]">
              Administration & Management
            </p>
          </div>

          <div className="flex items-center gap-6 ml-auto">
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all duration-300"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400 group-hover:rotate-45 transition-transform" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
              </Button>
              <div className="relative group">
                <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl border border-transparent hover:border-primary/20 transition-all duration-300">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background ring-4 ring-destructive/10"></span>
                </Button>
              </div>
            </div>

            <div className="h-10 w-[1px] bg-border/40 hidden md:block"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-3 focus:outline-none group p-1.5 pr-3 rounded-2xl border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 bg-background/50"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 border border-white/10 group-hover:scale-105 transition-transform">
                    {user?.name?.[0] || 'A'}
                  </div>
                  <div className="hidden md:flex flex-col items-start mr-1">
                    <span className="text-xs font-bold leading-none">{user?.name || 'Admin'}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">Administrator</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-data-[state=open]:rotate-180 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-3 rounded-2xl shadow-2xl border-border/50 backdrop-blur-2xl bg-card/90" align="end" forceMount>
                <div className="px-3 py-4 bg-muted/30 rounded-xl mb-3 border border-border/20">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                      {user?.name?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-black leading-none text-foreground">{user?.name || 'Admin'}</p>
                      <p className="text-[10px] font-bold leading-none text-muted-foreground mt-1.5 uppercase tracking-wider">{user?.email || 'admin@school.com'}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-border/40 mb-2" />
                <DropdownMenuItem onClick={() => setActiveTab('settings')} className="rounded-xl cursor-not-allowed py-3 font-semibold group focus:bg-primary/10 focus:text-primary transition-all">
                  <Settings className="mr-3 h-4 w-4 text-muted-foreground group-focus:text-primary group-focus:rotate-90 transition-all duration-500" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-xl cursor-pointer py-3 font-semibold group mt-1 transition-all">
                  <LogOut className="mr-3 h-4 w-4 group-focus:translate-x-1 transition-transform" />
                  <span>End Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
          <div className="max-w-7xl 2xl:max-w-[90vw] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "circOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component - Redesigned for a premium "WOW" experience
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
    <div className="space-y-12 pb-12">
      {/* Premium Welcome Section */}
      <div className="relative overflow-hidden p-10 md:p-14 rounded-[2.5rem] bg-gradient-to-br from-primary via-indigo-600 to-violet-700 text-white shadow-2xl shadow-primary/30 border border-white/10 group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-indigo-500/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-xl text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-widest mb-6 translate-y-[-5px]">
              <Sparkles className="w-3 h-3" /> System Control Center
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-[1.1]">
              Command & <br /><span className="text-white/80">Intelligence Center.</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl font-medium leading-relaxed max-w-lg mb-8">
              Welcome back. All systems are operational. Monitor performance and manage institutional growth from your private command center.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-black rounded-2xl h-14 px-8 shadow-xl shadow-black/10 transition-all hover:scale-[1.03] active:scale-95">
                Generate AI Reports
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 font-bold rounded-2xl h-14 px-8 border border-white/20 backdrop-blur-sm">
                View System Logs
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden xl:flex w-72 h-72 rounded-[3rem] bg-white/10 backdrop-blur-3xl border border-white/20 items-center justify-center relative shadow-inner"
          >
            <div className="absolute inset-0 animate-spin-slow opacity-30">
              <svg viewBox="0 0 100 100" className="w-full h-full p-4">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
              </svg>
            </div>
            <Shield className="w-32 h-32 text-white/90 drop-shadow-2xl" />
          </motion.div>
        </div>
      </div>

      {/* Stats Cards - Redesigned with luxury aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: "Total Users", icon: Users, value: stats?.totalUsers, label: `+${stats?.newUsers || 0} this week`, color: 'blue', bg: 'from-blue-600 to-indigo-600', trend: 'up' },
          { title: "Active Teachers", icon: UserCheck, value: stats?.activeTeachers || 0, label: "Staff Performance", color: 'emerald', bg: 'from-emerald-500 to-teal-600', trend: 'up' },
          { title: "Active Exams", icon: FileText, value: stats?.activeExams || 0, label: "Ongoing Assessment", color: 'violet', bg: 'from-violet-500 to-purple-600', trend: 'neutral' },
          { title: "System Credits", icon: Zap, value: stats?.aiUsage || 0, label: "AI Resource Usage", color: 'amber', bg: 'from-amber-400 to-orange-500', trend: 'down' }
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.4 }}
          >
            <Card className="rounded-[2rem] border border-border/40 shadow-xl bg-background/50 backdrop-blur-xl overflow-hidden relative group hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.bg} opacity-[0.03] rounded-bl-[4rem] transition-all group-hover:scale-125 duration-700`} />

              <CardHeader className="flex flex-row items-center justify-between font-black pb-2 px-8 pt-8">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">{item.title}</span>
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.bg} bg-opacity-10 text-white shadow-lg shadow-black/5`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="text-4xl font-black text-foreground mb-3 tracking-tighter">{item.value !== undefined ? item.value : '...'}</div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full ${item.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : item.trend === 'down' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {item.trend === 'up' ? <Plus className="w-3 h-3 stroke-[3px]" /> : <Search className="w-3 h-3 stroke-[3px]" />}
                  </div>
                  <span className="text-[11px] font-black text-muted-foreground/80 tracking-tight uppercase">{item.label}</span>
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${item.bg} w-0 group-hover:w-full transition-all duration-700`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions - Highly Interactive */}
      <div>
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Zap className="w-5 h-5" />
            </div>
            Critical Operations
          </h2>
          <Button variant="link" className="text-primary font-bold">View all controls</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Register Student', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/20', href: '/admin/users?role=STUDENT', desc: 'Add new students to the system' },
            { label: 'Recruit Staff', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', href: '/admin/users?role=TEACHER', desc: 'Onboard new faculty members' },
            { label: 'Manage Exams', icon: FileText, color: 'text-violet-500', bg: 'bg-violet-500/5', border: 'border-violet-500/20', href: '/exams', desc: 'Schedule and review assessments' },
            { label: 'Curricular Bank', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20', href: '/question-bank', desc: 'Access study and test materials' },
          ].map((action, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(action.href)}
              className={`flex flex-col text-left p-8 bg-card backdrop-blur-sm rounded-[2.5rem] border ${action.border} shadow-sm hover:shadow-2xl hover:bg-background transition-all group relative overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${action.bg} rounded-bl-[3rem] transition-all group-hover:scale-150 group-hover:opacity-20 duration-500`} />

              <div className={`p-5 rounded-2xl ${action.bg} ${action.color} mb-6 self-start shadow-inner transition-transform duration-500 group-hover:rotate-12`}>
                <action.icon className="h-7 w-7 stroke-[2.5px]" />
              </div>
              <span className="font-black text-lg text-foreground mb-2 leading-none">{action.label}</span>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed mb-6">{action.desc}</p>

              <div className="flex items-center gap-2 mt-auto text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                Lauch Module <Plus className="w-3 h-3" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Activity & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="rounded-[2.5rem] border border-border/40 shadow-xl bg-background/50 backdrop-blur-xl group overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Intelligence Logs</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider mt-1">Real-time system telemetry</CardDescription>
              </div>
              <div className="p-2 rounded-xl bg-primary/5 text-primary">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-4">
              {[
                { title: 'System Security Patch Applied', time: '12 min ago', type: 'security', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { title: 'High AI Credit Usage Detected', time: '1 hour ago', type: 'warning', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { title: 'New Teacher Onboarded: Dr. Sarah', time: '3 hours ago', type: 'user', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { title: 'Automated Database Backup', time: 'Yesterday', type: 'system', color: 'text-violet-500', bg: 'bg-violet-500/10' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-5 p-4 rounded-2xl hover:bg-muted/30 border border-transparent hover:border-border/20 transition-all cursor-crosshair group/item">
                  <div className={`w-12 h-12 rounded-xl ${log.bg} flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110`}>
                    <Activity className={`w-5 h-5 ${log.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{log.title}</p>
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">{log.time}</p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground/20 group-hover/item:text-primary transition-colors" />
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 rounded-xl font-bold py-6 text-muted-foreground hover:text-primary transition-colors">
              Access Full Audit History
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border border-border/40 shadow-xl bg-background/50 backdrop-blur-xl group overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Critical Tasks</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider mt-1">Pending administrative action</CardDescription>
              </div>
              <div className="p-2 rounded-xl bg-destructive/5 text-destructive">
                <Bell className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-destructive/5 rounded-[1.5rem] border border-destructive/10 group/task hover:bg-destructive/10 transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive group-hover/task:rotate-3 transition-transform">
                    <CheckCircle className="w-6 h-6 stroke-[2.5px]" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-foreground block">Review Annual Exam Results</span>
                    <span className="text-[10px] font-bold text-destructive/80 uppercase tracking-wider">Due in 2 hours</span>
                  </div>
                </div>
                <Badge className="bg-destructive text-white border-0 font-black px-3 py-1 rounded-lg">CRITICAL</Badge>
              </div>

              <div className="flex items-center justify-between p-6 bg-amber-500/5 rounded-[1.5rem] border border-amber-500/10 group/task hover:bg-amber-500/10 transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/task:rotate-3 transition-transform">
                    <Clock className="w-6 h-6 stroke-[2.5px]" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-foreground block">Faculty Leave Authorization</span>
                    <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wider">3 requests pending</span>
                  </div>
                </div>
                <Badge className="bg-amber-500 text-white border-0 font-black px-3 py-1 rounded-lg">PENDING</Badge>
              </div>

              <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10 group/task hover:bg-primary/10 transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/task:rotate-3 transition-transform">
                    <Shield className="w-6 h-6 stroke-[2.5px]" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-foreground block">Weekly Performance Audit</span>
                    <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">Sync required</span>
                  </div>
                </div>
                <Badge className="bg-primary text-white border-0 font-black px-3 py-1 rounded-lg">SCHEDULED</Badge>
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
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-black tracking-tight mb-2">Academic Structures</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {classes.length} Active Classes under management
          </p>
        </motion.div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 rounded-2xl px-6 h-12 font-bold border border-white/10 transition-all hover:scale-[1.03] active:scale-95">
          <Plus className="h-5 w-5 mr-2 stroke-[3px]" /> Initialize New Class
        </Button>
      </div>

      <div className="relative group max-w-2xl">
        <div className="absolute inset-0 bg-primary/20 rounded-[1.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search academic cohorts, sections, or teachers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-14 h-16 bg-background/50 backdrop-blur-xl border-border/40 rounded-[1.5rem] text-lg font-medium shadow-sm transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-muted/30 animate-pulse rounded-[2.5rem] border border-border/20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((cls: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -8 }}
            >
              <Card className="overflow-hidden border border-border/40 bg-background/50 backdrop-blur-xl rounded-[2.5rem] group cursor-pointer hover:shadow-2xl hover:border-primary/30 transition-all duration-500 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-700 blur-[40px] opacity-0 group-hover:opacity-100" />

                <div className="h-2.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-violet-500 opacity-80" />

                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20 rounded-lg px-2">
                          ACTIVE COHORT
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-black tracking-tight text-foreground truncate">{cls.name}</CardTitle>
                      <CardDescription className="font-black text-[10px] mt-2 bg-muted/50 px-3 py-1.5 rounded-xl inline-flex items-center gap-2 text-muted-foreground uppercase tracking-widest border border-border/40">
                        <Scan className="w-3 h-3" /> SEC-{cls.section || 'ALPHA'}
                      </CardDescription>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                      <GraduationCap className="w-6 h-6 stroke-[2.5px]" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8 pt-4">
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/20 group/info hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-background border border-border/40 flex items-center justify-center text-primary shadow-sm font-black">
                          {cls.teacher?.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Faculty Lead</p>
                          <p className="text-sm font-bold text-foreground truncate max-w-[140px]">{cls.teacher?.name || 'Unassigned'}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-background"><MessageSquare className="w-4 h-4" /></Button>
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2 font-black text-[11px] text-muted-foreground/60 uppercase tracking-tighter">
                        <Users className="w-4 h-4 text-primary/60" /> Total Enrolled
                      </div>
                      <span className="font-black text-lg text-primary tracking-tighter">
                        {cls.students?.length || 0} <span className="text-[10px] text-muted-foreground/40 lowercase">studs</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-border/30">
                    <Button variant="secondary" className="w-full h-12 rounded-[1.2rem] font-black tracking-tight text-xs bg-muted/40 hover:bg-muted font-black border border-border/40 transition-all">
                      SYLLABUS
                    </Button>
                    <Button className="w-full h-12 rounded-[1.2rem] font-black tracking-tight text-xs bg-primary/10 hover:bg-primary hover:text-white text-primary border-primary/10 transition-all">
                      ANALYTICS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-muted/30 rounded-[2.5rem] flex items-center justify-center mb-6 border border-border/20 shadow-inner">
                <Search className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-2xl font-black text-foreground tracking-tight">No academic cohorts found</h3>
              <p className="text-muted-foreground font-medium mt-2">Try adjusting your search query or initialize a new class.</p>
              <Button variant="link" className="mt-4 text-primary font-black uppercase tracking-widest text-[10px]" onClick={() => setSearchTerm('')}>Clear all filters</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
