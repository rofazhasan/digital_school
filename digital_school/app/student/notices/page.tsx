"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, AlertTriangle, Info, CheckCircle, Search, Filter,
    ExternalLink, User, Calendar, Clock, Eye, EyeOff,
    Megaphone, BookOpen, Trophy, Palmtree, Building2,
    Landmark, Banknote, ChevronDown, ChevronUp, X,
    RefreshCw, Loader2, BellOff, ArrowLeft, Sparkles, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";

const NOTICES_CACHE_KEY = "student_notices_cache_v2";

// Priority and category configs
const PRIORITY_CONFIG = {
    URGENT: {
        label: 'জরুরি',
        labelEn: 'URGENT',
        color: 'bg-red-500/10 text-red-600 border-red-400/40',
        borderLeft: 'border-l-red-500',
        badge: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800',
        dot: 'bg-red-500',
        bg: 'from-red-500/5 to-transparent',
        icon: AlertTriangle,
        pulse: true
    },
    HIGH: {
        label: 'উচ্চ',
        labelEn: 'HIGH',
        color: 'bg-orange-500/10 text-orange-600 border-orange-400/40',
        borderLeft: 'border-l-orange-500',
        badge: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-800',
        dot: 'bg-orange-500',
        bg: 'from-orange-500/5 to-transparent',
        icon: AlertTriangle,
        pulse: false
    },
    MEDIUM: {
        label: 'সাধারণ',
        labelEn: 'MEDIUM',
        color: 'bg-blue-500/10 text-blue-600 border-blue-400/40',
        borderLeft: 'border-l-blue-500',
        badge: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800',
        dot: 'bg-blue-500',
        bg: 'from-blue-500/5 to-transparent',
        icon: Info,
        pulse: false
    },
    LOW: {
        label: 'তথ্য',
        labelEn: 'LOW',
        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/40',
        borderLeft: 'border-l-emerald-500',
        badge: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800',
        dot: 'bg-emerald-500',
        bg: 'from-emerald-500/5 to-transparent',
        icon: CheckCircle,
        pulse: false
    },
} as const;

const CATEGORY_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
    General: { icon: Megaphone, label: 'সাধারণ', color: 'text-slate-500' },
    Academic: { icon: BookOpen, label: 'একাডেমিক', color: 'text-blue-500' },
    Exam: { icon: Trophy, label: 'পরীক্ষা', color: 'text-amber-500' },
    Holiday: { icon: Palmtree, label: 'ছুটি', color: 'text-emerald-500' },
    Administrative: { icon: Building2, label: 'প্রশাসনিক', color: 'text-indigo-500' },
    Event: { icon: Landmark, label: 'অনুষ্ঠান', color: 'text-purple-500' },
    Fee: { icon: Banknote, label: 'বেতন', color: 'text-red-500' },
    Result: { icon: Trophy, label: 'ফলাফল', color: 'text-cyan-500' },
    Other: { icon: Info, label: 'অন্যান্য', color: 'text-slate-400' },
};

interface NoticeLink { label: string; url: string; }
interface Notice {
    id: string;
    title: string;
    description: string;
    targetType: string;
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    links?: NoticeLink[];
    readBy: string[];
    isActive: boolean;
    expiresAt?: string | null;
    createdAt: string;
    postedBy: { id: string; name: string; role: string };
}

function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function NoticeCard({
    notice,
    isRead,
    onMarkRead,
}: {
    notice: Notice;
    isRead: boolean;
    onMarkRead: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const priority = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.LOW;
    const PriorityIcon = priority.icon;
    const cat = CATEGORY_CONFIG[notice.category] || CATEGORY_CONFIG.Other;
    const CatIcon = cat.icon;

    const isLong = notice.description.length > 220;
    const displayDesc = isLong && !expanded
        ? notice.description.slice(0, 220) + '...'
        : notice.description;

    const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();
    const links = notice.links || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`relative rounded-3xl border transition-all duration-300 overflow-hidden shadow-xs hover:shadow-md ${
                !isRead
                    ? 'bg-white/95 dark:bg-slate-900/95 border-indigo-200/80 dark:border-indigo-800/80'
                    : 'bg-white/60 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/70 opacity-90'
            }`}
        >
            <div className={`border-l-4 ${priority.borderLeft} p-5 sm:p-6`}>
                <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0">
                        <CatIcon className={`h-5 w-5 ${cat.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Tags Header */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${priority.badge}`}>
                                <PriorityIcon className={`h-3 w-3 ${priority.pulse ? 'animate-pulse' : ''}`} />
                                {priority.labelEn}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-bold rounded-full border-slate-200 dark:border-slate-700">
                                {cat.label}
                            </Badge>
                            {!isRead && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500 text-white animate-pulse">
                                    NEW
                                </span>
                            )}
                            {isExpired && (
                                <Badge variant="secondary" className="text-[9px] text-muted-foreground">
                                    Expired
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className={`text-base sm:text-lg font-black leading-snug text-foreground ${!isRead ? 'font-black' : 'font-bold'}`}>
                            {notice.title}
                        </h3>

                        {/* Content */}
                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                            {displayDesc}
                        </p>

                        {isLong && (
                            <button
                                onClick={() => { triggerHaptic(ImpactStyle.Light); setExpanded(!expanded); }}
                                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                            >
                                {expanded ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Read full notice <ChevronDown className="h-3 w-3" /></>}
                            </button>
                        )}

                        {/* External Links */}
                        {links.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {links.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        {link.label || 'Open Resource'}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-medium">
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {notice.postedBy?.name || 'Academic Office'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatRelativeDate(notice.createdAt)}
                                </span>
                                {notice.expiresAt && !isExpired && (
                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                        <Clock className="h-3 w-3" />
                                        Valid until: {new Date(notice.expiresAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {!isRead ? (
                                <button
                                    onClick={() => onMarkRead(notice.id)}
                                    className="text-xs font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                                >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Mark as Read
                                </button>
                            ) : (
                                <span className="text-[11px] font-semibold flex items-center gap-1 text-slate-400">
                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                                    Read
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function StudentNoticesPage() {
    const router = useRouter();

    // 0-Second SWR Hydration
    const [cached] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const raw = sessionStorage.getItem(NOTICES_CACHE_KEY);
                if (raw) return JSON.parse(raw);
            } catch {}
        }
        return null;
    });

    const [notices, setNotices] = useState<Notice[]>(cached?.notices || []);
    const [loading, setLoading] = useState(!cached?.notices);
    const [unreadCount, setUnreadCount] = useState(cached?.unreadCount || 0);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const fetchNotices = useCallback(async (isSilent = false) => {
        if (!isSilent && notices.length === 0) setLoading(true);
        try {
            const res = await fetch('/api/notices', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                const list = data.notices || [];
                const unread = data.unreadCount || 0;
                setNotices(list);
                setUnreadCount(unread);
                try {
                    sessionStorage.setItem(NOTICES_CACHE_KEY, JSON.stringify({ notices: list, unreadCount: unread, cachedAt: Date.now() }));
                } catch {}
            }
        } finally {
            setLoading(false);
        }
    }, [notices.length]);

    useEffect(() => {
        fetchNotices(true);
    }, [fetchNotices]);

    const handleMarkRead = useCallback(async (id: string) => {
        triggerHaptic(ImpactStyle.Light);
        if (readIds.has(id)) return;
        setReadIds((prev: Set<string>) => new Set([...prev, id]));
        setUnreadCount((prev: number) => Math.max(0, prev - 1));
        try {
            await fetch(`/api/notices/${id}/read`, { method: 'POST', credentials: 'include' });
        } catch (e) {}
    }, [readIds]);

    const isRead = useCallback((notice: Notice) => {
        return readIds.has(notice.id) || (notice.readBy && notice.readBy.length > 0);
    }, [readIds]);

    const filtered = notices.filter(n => {
        const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.description.toLowerCase().includes(search.toLowerCase());
        const matchPriority = filterPriority === 'ALL' || n.priority === filterPriority;
        const matchCategory = filterCategory === 'ALL' || n.category === filterCategory;
        const matchUnread = !showUnreadOnly || !isRead(n);
        return matchSearch && matchPriority && matchCategory && matchUnread;
    });

    const urgentNotices = filtered.filter(n => n.priority === 'URGENT');

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground transition-colors">
            {/* Top banner for URGENT notices */}
            <AnimatePresence>
                {urgentNotices.some(n => !isRead(n)) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-rose-600 text-white overflow-hidden shadow-md"
                    >
                        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
                                <AlertTriangle className="h-4 w-4 animate-bounce" />
                                <span>{urgentNotices.filter(n => !isRead(n)).length} Urgent Academic Notices require your attention!</span>
                            </div>
                            <Badge className="bg-white/20 text-white font-bold text-[10px]">Action Required</Badge>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                {/* Gen-Z Navigation Header with Back Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { triggerHaptic(ImpactStyle.Light); router.push('/student/dashboard'); }}
                        className="self-start rounded-full font-bold text-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 hover:text-indigo-600 transition-all gap-1.5 px-4 h-9"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Student Dashboard
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchNotices(false)}
                            className="rounded-full text-xs font-bold gap-1.5 text-muted-foreground h-9"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Hero Header */}
                <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
                    <div className="relative z-10 space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-200 backdrop-blur-md">
                            <Bell className="h-3.5 w-3.5" />
                            Official Announcement Channel
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                            Student Notice Board 📢
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-lg font-medium">
                            Stay informed on exam dates, schedule adjustments, academic holidays, and institutional announcements.
                        </p>

                        {/* Metric stats row */}
                        <div className="flex flex-wrap gap-2.5 pt-3">
                            <Badge className="bg-white/15 hover:bg-white/20 text-white font-bold text-xs py-1 px-3 rounded-full border-white/20">
                                Total: {notices.length} Notices
                            </Badge>
                            <Badge className="bg-rose-500/30 text-rose-200 font-bold text-xs py-1 px-3 rounded-full border-rose-400/30">
                                {unreadCount} Unread
                            </Badge>
                            <Badge className="bg-amber-500/30 text-amber-200 font-bold text-xs py-1 px-3 rounded-full border-amber-400/30">
                                {notices.filter(n => n.priority === 'URGENT').length} Urgent
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                        <Input
                            placeholder="Search notices by keyword, title, or topic..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-11 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium"
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => { triggerHaptic(ImpactStyle.Light); setFilterPriority(p); }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        filterPriority === p
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {p === 'ALL' ? 'All Priority' : p}
                                </button>
                            ))}
                        </div>

                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-muted-foreground hover:text-foreground">
                            <input
                                type="checkbox"
                                checked={showUnreadOnly}
                                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            Show Unread Only
                        </label>
                    </div>
                </div>

                {/* Notices List */}
                <div className="space-y-4">
                    {filtered.length > 0 ? (
                        filtered.map((notice) => (
                            <NoticeCard
                                key={notice.id}
                                notice={notice}
                                isRead={isRead(notice)}
                                onMarkRead={handleMarkRead}
                            />
                        ))
                    ) : (
                        <div className="py-16 text-center bg-white/60 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                            <BellOff className="h-10 w-10 text-muted-foreground mx-auto" />
                            <h4 className="font-bold text-base">No notices found</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                There are no announcements matching your current search or filter criteria.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
