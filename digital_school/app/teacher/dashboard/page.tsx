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
    User,
    ChevronDown
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
    AdminAdmitCardsTab
} from "@/components/dashboard/admin-tabs";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    // { id: 'users', label: 'Users', icon: Users, href: '/admin/users' }, // EXCLUDED FOR TEACHER
    { id: 'classes', label: 'Classes', icon: GraduationCap, href: '#classes' },
    { id: 'exams', label: 'Exams', icon: FileText, href: '/exams' },
    { id: 'questions', label: 'Question Bank', icon: BookOpen, href: '/question-bank' },
    { id: 'admit-cards', label: 'Admit Cards', icon: ClipboardList, href: '#admit-cards' },
    { id: 'results', label: 'Results', icon: BarChart3, href: '/exams/results' },
    { id: 'omr-scanner', label: 'OMR Scanner', icon: Scan, href: '/omr_scanner' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, href: '#attendance' },
    { id: 'notices', label: 'Notices', icon: Bell, href: '#notices' },
    // { id: 'billing', label: 'Billing', icon: CreditCard, href: '#billing' }, // EXCLUDED FOR TEACHER
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
    const [user, setUser] = useState<any>(null);
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
                if (data.user && data.user.role === 'TEACHER') {
                    setUser(data.user);
                } else if (data.user) {
                    // Redirect if not teacher
                    // Allow Admin/Super to view as well for testing, or redirect?
                    // Strict redirect:
                    if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_USER') {
                        // Admin can view teacher dashboard usually? Let's allow.
                        setUser(data.user);
                    } else {
                        router.push('/dashboard');
                    }
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
        <div className={`fixed inset-y-0 left-0 z-50 bg-white border-r transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} hidden md:flex flex-col shadow-sm`}>
            <div className="h-16 flex items-center justify-between px-4 border-b">
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            DS
                        </div>
                        <span className="font-bold text-xl text-gray-800">Digital<span className="text-blue-600">School</span></span>
                    </div>
                )}
                {sidebarCollapsed && (
                    <div className="w-full flex justify-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                            DS
                        </div>
                    </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden md:flex text-gray-400 hover:text-gray-600">
                    {sidebarCollapsed ? <ChevronDown className="h-5 w-5 rotate-[-90deg]" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
                {sidebarItems.map((item) => (
                    <div key={item.id} className="px-3">
                        <div
                            onClick={() => {
                                if (item.href.startsWith('/')) {
                                    router.push(item.href);
                                } else {
                                    setActiveTab(item.id);
                                }
                            }}
                            className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group
                  ${activeTab === item.id && !item.href.startsWith('/')
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
                        >
                            <div className={`
                    p-1.5 rounded-md transition-colors
                    ${activeTab === item.id && !item.href.startsWith('/') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'}
                `}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            {!sidebarCollapsed && (
                                <>
                                    <span className="font-medium text-sm flex-1">{item.label}</span>
                                    {item.badge && (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                            {item.badge}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t bg-gray-50/50">
                {!sidebarCollapsed ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
                            {user?.name?.[0] || 'T'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Teacher'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs" title={user?.name}>
                            {user?.name?.[0]}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const MobileSidebar = () => (
        <div className={`fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileSidebarOpen(false)}>
            <div className={`absolute inset-y-0 left-0 w-64 bg-white shadow-xl transition-transform transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
                <div className="h-16 flex items-center justify-between px-4 border-b bg-gray-50/50">
                    <span className="font-bold text-xl text-gray-800">Menu</span>
                    <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="overflow-y-auto py-4 space-y-1 h-[calc(100vh-64px)]">
                    {sidebarItems.map((item) => (
                        <div key={item.id} className="px-3">
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
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors
                      ${activeTab === item.id && !item.href.startsWith('/')
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'}
                    `}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </div>
                        </div>
                    ))}
                    <div className="px-3 mt-4 pt-4 border-t">
                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50/30 font-sans text-gray-900">
            <Sidebar />
            <MobileSidebar />

            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} flex flex-col min-h-screen`}>
                {/* Top Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b flex items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 px-1">
                                {sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative" ref={userMenuRef}>
                            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-full h-9 w-9 p-0 border shadow-sm">
                                        <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                            {user?.name?.[0] || 'T'}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user?.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 p-4 md:p-8 max-w-7xl 2xl:max-w-[95vw] mx-auto w-full">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Coming Soon</CardTitle>
                                                <Activity className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">Overview</div>
                                                <p className="text-xs text-muted-foreground">Detailed stats coming soon</p>
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
                            {activeTab === 'admit-cards' && <AdminAdmitCardsTab />}

                            {/* Placeholders for sections that are primarily link-based but might have inline content */}
                            {['classes', 'omr-scanner'].includes(activeTab) && (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="p-4 rounded-full bg-blue-50 text-blue-500 mb-4">
                                        <Settings className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Module Loaded</h3>
                                    <p className="text-gray-500 max-w-sm mt-2">
                                        This module is either integrated via navigation links or currently under development for the Teacher view.
                                    </p>
                                    <Button className="mt-4" onClick={() => router.push('/dashboard')}>
                                        Return to Dashboard
                                    </Button>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </main>

                <AppFooter />
            </div>
        </div>
    );
}
