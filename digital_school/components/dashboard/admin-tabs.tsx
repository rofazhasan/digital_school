"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    BarChart3,
    Users,
    DollarSign,
    MessageSquare,
    Shield,
    Settings,
    Bell,
    Search,
    Download,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    Edit2,
    Trash2,
    Link2,
    X,
    AlertTriangle,
    Info,
    ChevronDown,
    Eye,
    Building2,
    GraduationCap,
    User,
    Calendar,
    ExternalLink,
    Loader2,
    RefreshCw,
    ToggleLeft,
    ToggleRight
} from "lucide-react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ArcElement,
} from 'chart.js';
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { SecuritySettings } from "./SecuritySettings";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ArcElement
);

export function AdminAnalyticsTab() {
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Revenue ($)',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Expenses ($)',
                data: [8000, 12000, 10000, 15000, 18000, 20000],
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }
        ]
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl md:text-2xl font-bold">$123,456</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl md:text-2xl font-bold">2,350</div>
                        <p className="text-xs text-muted-foreground">+180 since last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">92.5%</div>
                        <p className="text-xs text-muted-foreground">+2.5% from last term</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">-4 from yesterday</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                    <CardDescription>Revenue vs Expenses for first half of year.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] md:h-[400px]">
                    <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
                </CardContent>
            </Card>
        </div>
    );
}

export function AttendanceTab() {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Daily Attendance</CardTitle>
                        <CardDescription>Monitor student and teacher attendance.</CardDescription>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                        <Input type="date" className="flex-1 sm:w-auto" />
                        <Button className="flex-1 sm:flex-none">View Report</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="p-4 border rounded-lg bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800">
                        <div className="text-sm font-medium text-green-800 dark:text-green-300">Present</div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">850</div>
                    </div>
                    <div className="p-4 border rounded-lg bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800">
                        <div className="text-sm font-medium text-red-800 dark:text-red-300">Absent</div>
                        <div className="text-2xl font-bold text-red-900 dark:text-red-100">45</div>
                    </div>
                    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800">
                        <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Late</div>
                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">32</div>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto no-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[100px]">Class</TableHead>
                                <TableHead className="min-w-[120px]">Total Students</TableHead>
                                <TableHead className="min-w-[100px]">Present</TableHead>
                                <TableHead className="min-w-[100px]">Absent</TableHead>
                                <TableHead className="min-w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { class: 'Class 10-A', total: 45, present: 42, absent: 3 },
                                { class: 'Class 12-B', total: 40, present: 35, absent: 5 },
                                { class: 'Class 9-C', total: 38, present: 38, absent: 0 },
                            ].map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium whitespace-nowrap">{row.class}</TableCell>
                                    <TableCell>{row.total}</TableCell>
                                    <TableCell className="text-green-600 font-medium">{row.present}</TableCell>
                                    <TableCell className="text-red-600 font-medium">{row.absent}</TableCell>
                                    <TableCell><Button variant="ghost" size="sm">Details</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================
// NOTICE TYPES
// ============================================================
interface NoticeLink { label: string; url: string; }
interface NoticePoster { id: string; name: string; role: string; avatar?: string; }
interface NoticeClass { id: string; name: string; section: string; }

interface Notice {
    id: string;
    title: string;
    description: string;
    targetType: string;
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    links?: NoticeLink[];
    attachments?: { name: string; url: string }[];
    readBy: string[];
    isActive: boolean;
    expiresAt?: string | null;
    createdAt: string;
    updatedAt: string;
    postedBy: NoticePoster;
    targetClasses: NoticeClass[];
}

// ============================================================
// PRIORITY CONFIG
// ============================================================
const PRIORITY_CONFIG = {
    URGENT: {
        label: 'জরুরি / Urgent',
        color: 'bg-red-500/15 text-red-600 border-red-500/30',
        dot: 'bg-red-500',
        border: 'border-l-red-500',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        glow: 'shadow-red-500/20',
        icon: AlertTriangle
    },
    HIGH: {
        label: 'উচ্চ / High',
        color: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
        dot: 'bg-orange-500',
        border: 'border-l-orange-500',
        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        glow: 'shadow-orange-500/20',
        icon: AlertTriangle
    },
    MEDIUM: {
        label: 'মাঝারি / Medium',
        color: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
        dot: 'bg-blue-500',
        border: 'border-l-blue-500',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        glow: 'shadow-blue-500/20',
        icon: Info
    },
    LOW: {
        label: 'সাধারণ / Low',
        color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
        dot: 'bg-emerald-500',
        border: 'border-l-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        glow: 'shadow-emerald-500/20',
        icon: CheckCircle
    }
} as const;

const TARGET_CONFIG: Record<string, { label: string; bangla: string; icon: any; color: string }> = {
    ALL: { label: 'Everyone', bangla: 'সবার জন্য', icon: Users, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    STUDENTS: { label: 'Students Only', bangla: 'শুধু শিক্ষার্থী', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    TEACHERS: { label: 'Teachers Only', bangla: 'শুধু শিক্ষক', icon: User, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    TEACHERS_AND_ADMINS: { label: 'Teachers & Admin', bangla: 'শিক্ষক ও প্রশাসন', icon: Shield, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
    ADMINS: { label: 'Admin Only', bangla: 'শুধু প্রশাসন', icon: Building2, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
    SPECIFIC_CLASS: { label: 'Specific Class', bangla: 'নির্দিষ্ট শ্রেণী', icon: GraduationCap, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
};

const CATEGORIES = ['General', 'Academic', 'Exam', 'Holiday', 'Administrative', 'Event', 'Fee', 'Result', 'Other'];
const CATEGORIES_BN: Record<string, string> = {
    General: 'সাধারণ', Academic: 'একাডেমিক', Exam: 'পরীক্ষা', Holiday: 'ছুটি',
    Administrative: 'প্রশাসনিক', Event: 'অনুষ্ঠান', Fee: 'বেতন', Result: 'ফলাফল', Other: 'অন্যান্য'
};

function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ============================================================
// MAIN NoticesTab COMPONENT
// ============================================================
export function NoticesTab({ isAdmin = true }: { isAdmin?: boolean }) {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [showCreate, setShowCreate] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        title: '',
        description: '',
        targetType: 'ALL',
        priority: 'MEDIUM',
        category: 'General',
        expiresAt: '',
        links: [] as NoticeLink[],
        targetClassIds: [] as string[],
    });
    const [newLink, setNewLink] = useState({ label: '', url: '' });

    const fetchNotices = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = isAdmin ? '/api/super-user/notices' : '/api/notices';
            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                setNotices(data.notices || []);
            }
        } catch (e) {
            console.error('Failed to fetch notices', e);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => { fetchNotices(); }, [fetchNotices]);

    const resetForm = () => {
        setForm({
            title: '', description: '', targetType: 'ALL',
            priority: 'MEDIUM', category: 'General',
            expiresAt: '', links: [], targetClassIds: []
        });
        setNewLink({ label: '', url: '' });
    };

    const openCreate = () => { resetForm(); setEditingNotice(null); setShowCreate(true); };

    const openEdit = (notice: Notice) => {
        setEditingNotice(notice);
        setForm({
            title: notice.title,
            description: notice.description,
            targetType: notice.targetType,
            priority: notice.priority,
            category: notice.category,
            expiresAt: notice.expiresAt ? notice.expiresAt.substring(0, 10) : '',
            links: (notice.links as NoticeLink[]) || [],
            targetClassIds: notice.targetClasses.map(c => c.id),
        });
        setShowCreate(true);
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.description.trim()) return;
        setSaving(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                targetType: form.targetType,
                priority: form.priority,
                category: form.category,
                expiresAt: form.expiresAt || null,
                links: form.links,
                targetClassIds: form.targetClassIds,
            };

            const method = editingNotice ? 'PUT' : 'POST';
            const url = editingNotice
                ? `/api/super-user/notices/${editingNotice.id}`
                : '/api/super-user/notices';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowCreate(false);
                resetForm();
                await fetchNotices();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this notice?')) return;
        await fetch(`/api/super-user/notices/${id}`, { method: 'DELETE' });
        await fetchNotices();
    };

    const handleToggleActive = async (notice: Notice) => {
        await fetch(`/api/super-user/notices/${notice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !notice.isActive })
        });
        await fetchNotices();
    };

    const addLink = () => {
        if (!newLink.url.trim()) return;
        setForm(f => ({ ...f, links: [...f.links, { ...newLink }] }));
        setNewLink({ label: '', url: '' });
    };

    const removeLink = (i: number) => {
        setForm(f => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }));
    };

    const filtered = notices.filter(n => {
        const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.description.toLowerCase().includes(search.toLowerCase());
        const matchPriority = filterPriority === 'ALL' || n.priority === filterPriority;
        const matchCat = filterCategory === 'ALL' || n.category === filterCategory;
        return matchSearch && matchPriority && matchCat;
    });

    const urgentCount = notices.filter(n => n.priority === 'URGENT' && n.isActive).length;
    const totalActive = notices.filter(n => n.isActive).length;

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Notices', value: notices.length, icon: Bell, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Active', value: totalActive, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Urgent', value: urgentCount, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { label: 'Expired', value: notices.filter(n => n.expiresAt && new Date(n.expiresAt) < new Date()).length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                        <Card className="border border-border bg-card/60 backdrop-blur-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Notice Board */}
            <Card className="border border-border bg-card shadow-lg">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Bell className="h-5 w-5 text-primary" />
                                নোটিশ বোর্ড / Notice Board
                            </CardTitle>
                            <CardDescription>Official notices • সরকারি নোটিশ</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={fetchNotices} className="h-9">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                                <Button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all h-9">
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    নতুন নোটিশ / New Notice
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notices... / নোটিশ খুঁজুন..."
                                className="pl-9 h-9 bg-muted/30"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setFilterPriority(p)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterPriority === p
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/50'
                                        }`}
                                >
                                    {p === 'ALL' ? 'All' : p}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No notices found</p>
                            <p className="text-sm">কোনো নোটিশ পাওয়া যায়নি</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {filtered.map((notice, idx) => {
                                    const pc = PRIORITY_CONFIG[notice.priority];
                                    const tc = TARGET_CONFIG[notice.targetType] || TARGET_CONFIG['ALL'];
                                    const PIcon = pc?.icon || Info;
                                    const TIcon = tc?.icon;
                                    const links = (notice.links as NoticeLink[]) || [];
                                    const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();

                                    return (
                                        <motion.div
                                            key={notice.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className={`relative border-l-4 ${pc?.border || 'border-l-border'} rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 md:p-5 shadow-sm hover:shadow-md transition-all group ${!notice.isActive ? 'opacity-50' : ''
                                                }`}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start gap-3">
                                                {/* Priority icon */}
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${pc?.color}`}>
                                                    <PIcon className="h-5 w-5" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Badges row */}
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${pc?.badge}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${pc?.dot}`} />
                                                            {notice.priority}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${tc?.color}`}>
                                                            <TIcon className="h-3 w-3" />
                                                            {tc?.bangla}
                                                        </span>
                                                        {notice.category && notice.category !== 'General' && (
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                                {CATEGORIES_BN[notice.category] || notice.category}
                                                            </span>
                                                        )}
                                                        {!notice.isActive && (
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800">Inactive</span>
                                                        )}
                                                        {isExpired && (
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-500">Expired</span>
                                                        )}
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="font-bold text-base md:text-lg leading-tight mb-1 text-foreground font-['Hind_Siliguri',_'Noto_Sans_Bengali',_sans-serif]">
                                                        {notice.title}
                                                    </h3>

                                                    {/* Description preview */}
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 font-['Hind_Siliguri',_'Noto_Sans_Bengali',_sans-serif]">
                                                        {notice.description}
                                                    </p>

                                                    {/* Links */}
                                                    {links.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {links.map((link, li) => (
                                                                <a
                                                                    key={li}
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                                                >
                                                                    <ExternalLink className="h-3 w-3" />
                                                                    {link.label || link.url}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Footer */}
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {notice.postedBy?.name}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(notice.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-muted-foreground/70">•</span>
                                                        <span>{formatTimeAgo(notice.createdAt)}</span>
                                                        {isAdmin && (
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="h-3 w-3" />
                                                                {notice.readBy?.length || 0} read
                                                            </span>
                                                        )}
                                                        {notice.expiresAt && (
                                                            <span className="flex items-center gap-1 text-amber-600">
                                                                <Clock className="h-3 w-3" />
                                                                Expires {new Date(notice.expiresAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1.5 flex-shrink-0 self-start">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 rounded-lg hover:bg-muted"
                                                            onClick={() => setViewingNotice(notice)}
                                                            title="Preview"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                                                            onClick={() => openEdit(notice)}
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`h-8 w-8 p-0 rounded-lg ${notice.isActive
                                                                    ? 'hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30'
                                                                    : 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30'
                                                                }`}
                                                            onClick={() => handleToggleActive(notice)}
                                                            title={notice.isActive ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {notice.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                                            onClick={() => handleDelete(notice.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ======== CREATE / EDIT DIALOG ======== */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Bell className="h-5 w-5 text-primary" />
                            {editingNotice ? 'Edit Notice • নোটিশ সম্পাদনা' : 'Create Notice • নতুন নোটিশ'}
                        </DialogTitle>
                        <DialogDescription>Fill in all fields to publish a professional notice</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* Priority + Category row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-semibold">Priority • গুরুত্ব</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => {
                                        const cfg = PRIORITY_CONFIG[p];
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, priority: p }))}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${form.priority === p
                                                        ? `${cfg.color} border-current`
                                                        : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Category • বিভাগ</Label>
                                <div className="relative">
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c} • {CATEGORIES_BN[c]}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Target Audience */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Target Audience • লক্ষ্য দর্শক</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(TARGET_CONFIG).filter(([k]) => k !== 'SPECIFIC_CLASS').map(([key, cfg]) => {
                                    const Icon = cfg.icon;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, targetType: key }))}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${form.targetType === key
                                                    ? `${cfg.color.replace('text-', 'border-').replace(/dark:[^\s]+/g, '').replace('bg-', 'border-l-')} border-current bg-gradient-to-br from-muted to-muted/50`
                                                    : 'border-border bg-muted/20 hover:border-primary/40'
                                                }`}
                                        >
                                            <Icon className="h-4 w-4 flex-shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold">{cfg.label}</div>
                                                <div className="text-[10px] text-muted-foreground">{cfg.bangla}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Notice Title • শিরোনাম <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="e.g. গুরুত্বপূর্ণ পরীক্ষার নোটিশ / Important Exam Notice"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className="font-['Hind_Siliguri',_sans-serif] text-base"
                            />
                        </div>

                        {/* Body */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Notice Body • বিবরণ <span className="text-red-500">*</span></Label>
                            <Textarea
                                placeholder="Write the full notice text here... Bangla and English both supported.\nএখানে পূর্ণ নোটিশের বিবরণ লিখুন..."
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className="min-h-[140px] font-['Hind_Siliguri',_'Noto_Sans_Bengali',_sans-serif] text-sm leading-relaxed"
                            />
                        </div>

                        {/* Expiry Date */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Expiry Date • মেয়াদ শেষ (optional)</Label>
                            <Input
                                type="date"
                                value={form.expiresAt}
                                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                className="w-full md:w-64"
                            />
                        </div>

                        {/* Links */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Links • লিংক (optional)</Label>
                            {form.links.map((link, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border">
                                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{link.label || 'Link'}</div>
                                        <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => removeLink(i)}>
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Link label (e.g. Download PDF)"
                                    value={newLink.label}
                                    onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="https://..."
                                    value={newLink.url}
                                    onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))}
                                    className="flex-1"
                                    onKeyDown={e => e.key === 'Enter' && addLink()}
                                />
                                <Button variant="outline" size="sm" onClick={addLink} className="flex-shrink-0">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !form.title.trim() || !form.description.trim()}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white min-w-[120px]"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingNotice ? 'Update Notice' : 'Publish Notice')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ======== VIEW DIALOG ======== */}
            <Dialog open={!!viewingNotice} onOpenChange={() => setViewingNotice(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {viewingNotice && (() => {
                        const pc = PRIORITY_CONFIG[viewingNotice.priority];
                        const tc = TARGET_CONFIG[viewingNotice.targetType] || TARGET_CONFIG['ALL'];
                        const links = (viewingNotice.links as NoticeLink[]) || [];
                        const PIcon = pc?.icon || Info;
                        return (
                            <>
                                <DialogHeader>
                                    <div className={`flex items-center gap-2 mb-3`}>
                                        <div className={`p-2 rounded-lg ${pc?.color}`}>
                                            <PIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pc?.badge}`}>{viewingNotice.priority}</span>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tc?.color}`}>{tc?.label}</span>
                                                {viewingNotice.category && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{viewingNotice.category}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <DialogTitle className="text-xl leading-tight font-['Hind_Siliguri',_sans-serif]">
                                        {viewingNotice.title}
                                    </DialogTitle>
                                </DialogHeader>

                                {/* Official notice border styling */}
                                <div className={`mt-4 border-l-4 ${pc?.border} pl-4`}>
                                    <p className="text-muted-foreground text-sm font-['Hind_Siliguri',_'Noto_Sans_Bengali',_sans-serif] leading-relaxed whitespace-pre-wrap">
                                        {viewingNotice.description}
                                    </p>
                                </div>

                                {links.length > 0 && (
                                    <div className="mt-4">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Attached Links</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {links.map((link, i) => (
                                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors dark:bg-blue-900/20 dark:text-blue-400">
                                                    <ExternalLink className="h-3 w-3" />
                                                    {link.label || link.url}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-3">
                                        <span>Posted by: <strong>{viewingNotice.postedBy?.name}</strong></span>
                                        <span>•</span>
                                        <span>{new Date(viewingNotice.createdAt).toLocaleString('en-BD')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>{viewingNotice.readBy?.length || 0} people read this</span>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function BillingTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing & Invoices</CardTitle>
                <CardDescription>Manage student fees and payments.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <Input placeholder="Search invoice..." className="w-full sm:max-w-sm" />
                    <Button variant="outline" className="w-full sm:w-auto"><Filter className="h-4 w-4 sm:mr-2" /><span className="sm:hidden">Filter</span><span className="hidden sm:inline">Filter Records</span></Button>
                </div>
                <div className="rounded-md border overflow-x-auto no-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[100px]">Invoice ID</TableHead>
                                <TableHead className="min-w-[150px]">Student</TableHead>
                                <TableHead className="min-w-[100px]">Amount</TableHead>
                                <TableHead className="min-w-[100px]">Status</TableHead>
                                <TableHead className="min-w-[120px]">Date</TableHead>
                                <TableHead className="min-w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { id: 'INV-001', student: 'John Doe', amount: '$500', status: 'Paid', date: '2025-05-01' },
                                { id: 'INV-002', student: 'Jane Smith', amount: '$500', status: 'Pending', date: '2025-05-05' },
                                { id: 'INV-003', student: 'Ali Khan', amount: '$450', status: 'Overdue', date: '2025-04-20' },
                            ].map((inv, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{inv.id}</TableCell>
                                    <TableCell className="whitespace-nowrap">{inv.student}</TableCell>
                                    <TableCell>{inv.amount}</TableCell>
                                    <TableCell>
                                        <Badge className={
                                            inv.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                                inv.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                        }>{inv.status}</Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">{inv.date}</TableCell>
                                    <TableCell><Button size="sm" variant="outline">View</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export function ChatTab() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 h-auto md:h-[600px] border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="border-b md:border-b-0 md:border-r col-span-1 bg-muted p-4 overflow-y-auto">
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search contacts..." className="pl-9 bg-card" />
                    </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar pb-3 md:pb-0">
                    {['Support Team', 'Teachers Group', 'Admin Console'].map((name, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer bg-white border min-w-[180px] md:min-w-0 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                {name.charAt(0)}
                            </div>
                            <div className="hidden sm:block">
                                <div className="font-medium text-sm">{name}</div>
                                <div className="text-xs text-muted-foreground truncate w-24 lg:w-32">Latest message...</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-span-1 md:col-span-2 flex flex-col min-h-[400px]">
                <div className="p-4 border-b flex justify-between items-center bg-card sticky top-0 z-10">
                    <div className="font-medium">Support Team</div>
                    <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
                </div>
                <div className="flex-1 p-4 bg-muted flex items-center justify-center text-muted-foreground">
                    Select a chat to start messaging
                </div>
                <div className="p-3 border-t bg-card flex gap-2 sticky bottom-0 z-10">
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button className="px-6">Send</Button>
                </div>
            </div>
        </div>
    );
}

export function SecurityTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage platform security and access controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-1">
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                    </div>
                    <Switch />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-1">
                        <Label className="text-base">Login Alerts</Label>
                        <p className="text-sm text-muted-foreground">Notify on new device login</p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                        <Label className="text-base">Force Password Reset</Label>
                        <p className="text-sm text-muted-foreground">Require all users to reset password every 90 days</p>
                    </div>
                    <Switch />
                </div>
                <div className="pt-4 border-t">
                    <SecuritySettings />
                </div>
                <div className="pt-4">
                    <Button variant="destructive">View Audit Logs</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function AdminSettingsTab() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                    <CardDescription>General system preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Institute Name</Label>
                        <Input defaultValue="Digital School" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Support Email</Label>
                        <Input defaultValue="support@digitalschool.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Timezone</Label>
                        <Input defaultValue="GMT+6 (Dhaka)" />
                    </div>
                </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <Button variant="outline" className="w-full sm:w-auto">Reset</Button>
                <Button className="w-full sm:w-auto">Save Changes</Button>
            </div>
        </div>
    );
}

export function AdminAdmitCardsTab() {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Admit Cards</CardTitle>
                        <CardDescription>Generate and manage student admit cards.</CardDescription>
                    </div>
                    <Button className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" /> Bulk Download</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="grid gap-1.5 w-full">
                        <Label>Select Exam</Label>
                        <Input placeholder="Select exam..." />
                    </div>
                    <div className="grid gap-1.5 w-full">
                        <Label>Select Class</Label>
                        <Input placeholder="Select class..." />
                    </div>
                    <div className="flex items-end">
                        <Button variant="secondary" className="w-full sm:w-auto">Filter Results</Button>
                    </div>
                </div>
                <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted border-dashed">
                    Select an exam and class to view generated admit cards.
                </div>
            </CardContent>
        </Card>
    );
}
