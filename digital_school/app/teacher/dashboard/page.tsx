'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap,
    FileText,
    Calendar,
    BarChart3,
    Bell,
    Settings,
    LogOut,
    Home,
    BookOpen,
    ClipboardList,
    MessageSquare,
    Activity,
    Shield,
    Menu,
    Scan,
    ChevronDown,
    Users,
    Clock,
    CheckCircle,
    Sparkles,
    ArrowRight,
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
    ChatTab,
    SecurityTab,
    AdminSettingsTab,
} from "@/components/dashboard/admin-tabs";
import TeacherAdmitCardsTab from "@/components/dashboard/TeacherAdmitCardsTab";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    { id: 'classes', label: 'Classes', icon: GraduationCap, href: '#classes' },
    { id: 'exams', label: 'Exams', icon: FileText, href: '/exams' },
    { id: 'questions', label: 'Question Bank', icon: BookOpen, href: '/question-bank' },
    { id: 'admit-cards', label: 'Admit Cards', icon: ClipboardList, href: '#admit-cards' },
    { id: 'results', label: 'Results', icon: BarChart3, href: '/exams/results' },
    { id: 'omr-scanner', label: 'OMR Scanner', icon: Scan, href: '/omr_scanner' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, href: '#attendance' },
    { id: 'notices', label: 'Notices', icon: Bell, href: '#notices' },
    { id: 'chat', label: 'Chat Support', icon: MessageSquare, href: '#chat' },
    { id: 'analytics', label: 'Analytics', icon: Activity, href: '#analytics' },
    { id: 'security', label: 'Security', icon: Shield, href: '#security' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '#settings' },
];

export default function TeacherDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const { theme, setTheme } = useTheme();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const router = useRouter();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [instituteSettings, setInstituteSettings] = useState<any>(null);


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

    useEffect(() => {
        fetch('/api/settings').then(r => r.json()).then(setInstituteSettings).catch(console.error);
        fetch('/api/user')
            .then(res => res.json())
            .then(data => {
                if (data.user && (data.user.role === 'TEACHER' || data.user.role === 'ADMIN' || data.user.role === 'SUPER_USER')) {
                    setUser(data.user);
                } else if (data.user) {
                    router.push('/dashboard');
                } else {
                    router.push('/login');
                }
            })
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);


    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    const instituteName = instituteSettings?.instituteName || "Digital School";

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

            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} flex-1 flex flex-col min-h-screen w-full relative z-10`}>
                {/* Top Header */}
                <header className="h-20 py-4 bg-background/80 backdrop-blur-xl sticky top-0 z-40 border-b border-border flex items-center justify-between px-4 md:px-8 transition-all duration-300">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <Button variant="ghost" size="icon" className="lg:hidden flex-shrink-0" onClick={() => setMobileSidebarOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <div className="truncate flex flex-col justify-center pl-2">
                            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 px-1 truncate leading-tight">
                                {sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">

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
                        <div className="relative" ref={userMenuRef}>
                            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 focus:outline-none group p-1 rounded-full border-2 border-transparent hover:border-border transition-all">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                                            {user?.name?.[0] || 'T'}
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors hidden md:block" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border-border backdrop-blur-xl bg-card/90">
                                    <div className="px-2 py-3 bg-muted/50 rounded-lg mb-2">
                                        <p className="text-sm font-semibold leading-none text-foreground">{user?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email}</p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem onClick={() => setActiveTab('settings')} className="rounded-lg cursor-pointer py-2.5">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/')} className="rounded-lg cursor-pointer py-2.5">
                                        <Home className="mr-2 h-4 w-4" />
                                        <span>Home</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer py-2.5" onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="w-full"
                            >
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="mb-6 lg:mb-8">
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                            >
                                                <h1 className="text-3xl font-bold mb-2 tracking-tight">Teacher Dashboard</h1>
                                                <p className="text-muted-foreground">Welcome back, {user?.name.split(' ')[0]}! Manage your classes, exams, and students.</p>
                                            </motion.div>
                                        </div>

                                        {/* Premium Stats Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                                            {[
                                                { label: 'Total Students', value: '1,234', icon: Users, color: 'blue', bg: 'bg-blue-500' },
                                                { label: 'Upcoming Exams', value: '3', icon: FileText, color: 'purple', bg: 'bg-purple-500' },
                                                { label: 'Pending Grading', value: '12', icon: ClipboardList, color: 'amber', bg: 'bg-amber-500' },
                                                { label: 'Avg. Attendance', value: '92%', icon: Calendar, color: 'emerald', bg: 'bg-emerald-500' },
                                            ].map((stat, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                >
                                                    <Card className="rounded-2xl border border-border shadow-md bg-card overflow-hidden relative group hover:shadow-xl transition-all duration-300">
                                                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110`} />
                                                        <CardContent className="p-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className={`p-2 rounded-xl ${stat.bg} bg-opacity-10 text-${stat.color}-600`}>
                                                                    <stat.icon className="h-5 w-5" />
                                                                </div>
                                                                <Badge variant="outline" className={`bg-${stat.color}-500/10 text-${stat.color}-600 border-${stat.color}-500/20`}>
                                                                    This Week
                                                                </Badge>
                                                            </div>
                                                            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                                                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="mb-8">
                                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-blue-500" /> Quick Actions
                                            </h2>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Create Exam', icon: FileText, color: 'text-blue-500', href: '/exams/create' },
                                                    { label: 'Question Bank', icon: BookOpen, color: 'text-amber-500', href: '/question-bank' },
                                                    { label: 'Attendance', icon: Calendar, color: 'text-emerald-500', href: '#attendance' },
                                                    { label: 'Results', icon: BarChart3, color: 'text-purple-500', href: '/exams/results' },
                                                ].map((action, i) => (
                                                    <motion.button
                                                        key={i}
                                                        whileHover={{ scale: 1.02, y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            if (action.href.startsWith('/')) router.push(action.href);
                                                            else setActiveTab(action.href.replace('#', ''));
                                                        }}
                                                        className="flex flex-col items-center justify-center p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group"
                                                    >
                                                        <div className={`p-4 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors`}>
                                                            <action.icon className={`h-6 w-6 ${action.color}`} />
                                                        </div>
                                                        <span className="font-semibold text-sm text-foreground/80 group-hover:text-foreground transition-colors">{action.label}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Recent Activity */}
                                            <Card className="rounded-2xl border border-border shadow-sm bg-card">
                                                <CardHeader>
                                                    <CardTitle>Recent Activity</CardTitle>
                                                    <CardDescription>Latest updates from your classes</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        {[
                                                            { title: "Exam 'Math Midterm' Published", time: "2 hours ago", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                                                            { title: "Class 10-A Attendance Marked", time: "4 hours ago", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                                            { title: "New Question Added to Bank", time: "Yesterday", icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
                                                        ].map((item, i) => (
                                                            <div key={i} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                                                                <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                                                    <item.icon className={`h-5 w-5 ${item.color}`} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Schedule */}
                                            <Card className="rounded-2xl border border-border shadow-sm bg-card">
                                                <CardHeader>
                                                    <CardTitle>Today&apos;s Schedule</CardTitle>
                                                    <CardDescription>Your upcoming classes & tasks</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3">
                                                        {[
                                                            { time: "09:00 AM", class: "Class 10 - Section A", subject: "Mathematics", status: "Completed" },
                                                            { time: "11:00 AM", class: "Class 9 - Section B", subject: "Physics", status: "In Progress" },
                                                            { time: "02:00 PM", class: "Class 11 - Section A", subject: "Further Math", status: "Upcoming" },
                                                        ].map((item, i) => (
                                                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary transition-colors">
                                                                <div className="flex flex-col items-center justify-center min-w-[60px] p-2 bg-card rounded-lg shadow-sm border border-border">
                                                                    <Clock className="h-4 w-4 text-primary mb-1" />
                                                                    <span className="text-[10px] font-bold whitespace-nowrap">{item.time}</span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-sm">{item.subject}</div>
                                                                    <div className="text-xs text-muted-foreground">{item.class}</div>
                                                                </div>
                                                                <Badge variant={item.status === 'Completed' ? 'secondary' : item.status === 'In Progress' ? 'default' : 'outline'}>
                                                                    {item.status}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'analytics' && <AdminAnalyticsTab />}
                                {activeTab === 'attendance' && <AttendanceTab />}
                                {activeTab === 'notices' && <NoticesTab />}
                                {activeTab === 'chat' && <ChatTab />}
                                {activeTab === 'security' && <SecurityTab />}
                                {activeTab === 'settings' && <AdminSettingsTab />}
                                {activeTab === 'admit-cards' && <TeacherAdmitCardsTab />}

                                {/* Placeholders for sections that are primarily link-based but might have inline content */}
                                {['classes', 'omr-scanner'].includes(activeTab) && (
                                    <div className="flex flex-col items-center justify-center h-96 text-center">
                                        <div className="p-6 rounded-full bg-primary/10 text-primary mb-6 relative">
                                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                            <Settings className="w-12 h-12 relative z-10" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground mb-2">Module Under Development</h3>
                                        <p className="text-muted-foreground max-w-md mb-8">
                                            This specialized module for the Teacher Dashboard is being enhanced to provide better functionality.
                                        </p>
                                        <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25" onClick={() => setActiveTab('overview')}>
                                            Return to Overview
                                        </Button>
                                    </div>
                                )}

                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="mt-12 mb-4 text-center text-xs text-muted-foreground">
                        <p>© {new Date().getFullYear()} Digital School. All rights reserved.</p>
                    </div>
                </main>
            </div>
        </div>
    );
}
