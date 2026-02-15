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
    X,
    Scan,
    ChevronDown,
    Users,
    Clock,
    CheckCircle,
    Sparkles,
    Plus,
    Search,
    ArrowRight
} from 'lucide-react';
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

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    badge?: number;
}

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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const router = useRouter();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);

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

    const Sidebar = () => (
        <motion.div
            initial={false}
            animate={{ width: sidebarCollapsed ? 80 : 280 }}
            className={`fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border shadow-2xl shadow-black/5 dark:shadow-none transition-all duration-300`}
        >
            <div className={`h-20 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-gray-100/50 dark:border-gray-800/50`}>
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
                            DS
                        </div>
                        <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">Digital<span className="text-blue-600 dark:text-blue-400">School</span></span>
                    </div>
                )}
                {sidebarCollapsed && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
                        DS
                    </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`hidden lg:flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full ${sidebarCollapsed ? 'mt-4 rotate-180' : ''}`}>
                    {sidebarCollapsed ? <ChevronDown className="h-5 w-5 rotate-90" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-1 px-3 custom-scrollbar">
                {sidebarItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            if (item.href.startsWith('/')) {
                                router.push(item.href);
                            } else {
                                setActiveTab(item.id);
                            }
                        }}
                        className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${activeTab === item.id
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <div className={`p-1 rounded-lg transition-all duration-300 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200'}`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        {!sidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="ml-3 font-medium text-sm flex-1 text-left truncate"
                            >
                                {item.label}
                            </motion.span>
                        )}
                        {!sidebarCollapsed && item.badge && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                                {item.badge}
                            </Badge>
                        )}
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 backdrop-blur-sm">
                {!sidebarCollapsed ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab('settings')}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold border-2 border-white dark:border-gray-700 shadow-sm">
                            {user?.name?.[0] || 'T'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name || 'Teacher'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <Settings className="w-4 h-4 text-gray-400" />
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold border-2 border-white dark:border-gray-700 shadow-sm" title={user?.name}>
                            {user?.name?.[0]}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );

    const MobileSidebar = () => (
        <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileSidebarOpen(false)}>
            <div className={`absolute inset-y-0 left-0 w-72 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-2xl transition-transform transform duration-300 ease-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-950/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            DS
                        </div>
                        <span className="font-bold text-xl text-gray-800 dark:text-gray-200">Menu</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)} className="rounded-full hover:bg-red-50 hover:text-red-600">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="overflow-y-auto py-6 space-y-1 h-[calc(100vh-80px)] px-3 custom-scrollbar">
                    {sidebarItems.map((item) => (
                        <div key={item.id}>
                            <div
                                onClick={() => {
                                    if (item.href.startsWith('/')) {
                                        router.push(item.href);
                                    } else {
                                        setActiveTab(item.id);
                                        setMobileSidebarOpen(false);
                                    }
                                }}
                                className={`
                      w-full flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200
                      ${activeTab === item.id && !item.href.startsWith('/')
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                    `}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </div>
                        </div>
                    ))}
                    <div className="px-3 mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 py-6 text-base rounded-xl" onClick={handleLogout}>
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
            </div>

            <Sidebar />
            <MobileSidebar />

            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} flex-1 flex flex-col min-h-screen w-full relative z-10`}>
                {/* Top Header */}
                <header className="h-20 py-4 bg-background/80 backdrop-blur-xl sticky top-0 z-40 border-b border-border flex items-center justify-between px-4 md:px-8 transition-all duration-300">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <Button variant="ghost" size="icon" className="lg:hidden flex-shrink-0" onClick={() => setMobileSidebarOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <div className="truncate flex flex-col justify-center pl-2">
                            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 px-1 truncate leading-tight">
                                {sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 mr-2">
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>
                            </Button>
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-800 hidden md:block"></div>
                        <div className="relative" ref={userMenuRef}>
                            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 focus:outline-none group p-1 rounded-full border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shadow-sm">
                                            {user?.name?.[0] || 'T'}
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors hidden md:block" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border-gray-100 dark:border-gray-800 backdrop-blur-xl bg-white/90 dark:bg-gray-950/90">
                                    <div className="px-2 py-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg mb-2">
                                        <p className="text-sm font-semibold leading-none text-foreground">{user?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email}</p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                                    <DropdownMenuItem onClick={() => setActiveTab('settings')} className="rounded-lg cursor-pointer py-2.5">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/')} className="rounded-lg cursor-pointer py-2.5">
                                        <Home className="mr-2 h-4 w-4" />
                                        <span>Home</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg cursor-pointer py-2.5" onClick={handleLogout}>
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
                                                    <Card className="rounded-2xl border-0 shadow-lg shadow-gray-200/50 dark:shadow-none bg-white dark:bg-gray-900 overflow-hidden relative group hover:shadow-xl transition-all duration-300">
                                                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110`} />
                                                        <CardContent className="p-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className={`p-2 rounded-xl ${stat.bg} bg-opacity-10 text-${stat.color}-600`}>
                                                                    <stat.icon className="h-5 w-5" />
                                                                </div>
                                                                <Badge variant="outline" className={`bg-${stat.color}-50 text-${stat.color}-600 border-${stat.color}-200`}>
                                                                    This Week
                                                                </Badge>
                                                            </div>
                                                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
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
                                                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group"
                                                    >
                                                        <div className={`p-4 rounded-full bg-gray-50 dark:bg-gray-800 mb-3 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors`}>
                                                            <action.icon className={`h-6 w-6 ${action.color}`} />
                                                        </div>
                                                        <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{action.label}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Recent Activity */}
                                            <Card className="rounded-2xl border-0 shadow-sm bg-white dark:bg-gray-900">
                                                <CardHeader>
                                                    <CardTitle>Recent Activity</CardTitle>
                                                    <CardDescription>Latest updates from your classes</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        {[
                                                            { title: "Exam 'Math Midterm' Published", time: "2 hours ago", icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                                                            { title: "Class 10-A Attendance Marked", time: "4 hours ago", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                                                            { title: "New Question Added to Bank", time: "Yesterday", icon: BookOpen, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
                                                        ].map((item, i) => (
                                                            <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                                                                <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                                                    <item.icon className={`h-5 w-5 ${item.color}`} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h4>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Schedule */}
                                            <Card className="rounded-2xl border-0 shadow-sm bg-white dark:bg-gray-900">
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
                                                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                                                <div className="flex flex-col items-center justify-center min-w-[60px] p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
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
                                        <div className="p-6 rounded-full bg-blue-50 text-blue-500 mb-6 relative">
                                            <div className="absolute inset-0 bg-blue-100/50 rounded-full animate-ping" />
                                            <Settings className="w-12 h-12 relative z-10" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Module Under Development</h3>
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
                    {/* Page-Specific Footer already rendered at global layout, but hidden by us in AppFooter.tsx.
                        We can add an internal footer if we want, but for dashboard cleanness, usually no large footer is needed.
                        We add a copyright line only.
                     */}
                    <div className="mt-12 mb-4 text-center text-xs text-muted-foreground">
                        <p>© {new Date().getFullYear()} Digital School. All rights reserved.</p>
                    </div>
                </main>
            </div>
        </div>
    );
}
