"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, AlertTriangle, Info, CheckCircle, Search, Filter,
    ExternalLink, User, Calendar, Clock, Eye, EyeOff,
    Megaphone, BookOpen, Trophy, Palmtree, Building2,
    Landmark, Banknote, ChevronDown, ChevronUp, X,
    RefreshCw, Loader2, BellOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Priority and category configs shared between this page and admin-tabs
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
    if (diff < 60) return 'এইমাত্র';
    if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ঘন্টা আগে`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} দিন আগে`;
    return date.toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateBangla(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-BD', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Expanded notice card
function NoticeCard({ notice, isRead, onMarkRead }: {
    notice: Notice;
    isRead: boolean;
    onMarkRead: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const pc = PRIORITY_CONFIG[notice.priority];
    const cc = CATEGORY_CONFIG[notice.category] || CATEGORY_CONFIG['General'];
    const Icon = pc.icon;
    const CategoryIcon = cc.icon;
    const links = (notice.links as NoticeLink[]) || [];
    const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();
    const isLong = notice.description.length > 200;

    const handleToggle = () => {
        setExpanded(prev => !prev);
        if (!isRead) onMarkRead(notice.id);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            className={`relative border-l-4 ${pc.borderLeft} rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${!isRead ? 'bg-card' : 'bg-card/60'}`}
        >
            {/* Priority glow background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${pc.bg} pointer-events-none`} />

            {/* Unread indicator */}
            {!isRead && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${pc.dot} ${pc.pulse ? 'animate-pulse' : ''}`} />
                </div>
            )}

            <div className="relative p-4 md:p-6">
                {/* Header row */}
                <div className="flex items-start gap-4">
                    {/* Priority icon box */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border ${pc.color}`}>
                        <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${pc.badge}`}>
                                {pc.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground`}>
                                <CategoryIcon className={`h-3 w-3 ${cc.color}`} />
                                {cc.label}
                            </span>
                            {isExpired && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-500 dark:bg-red-950/50">মেয়াদ শেষ</span>
                            )}
                        </div>

                        {/* Title */}
                        <h2 className={`font-bold text-base md:text-lg leading-tight text-foreground mb-1 ${!isRead ? '' : 'text-foreground/75'}`}
                            style={{ fontFamily: '"Hind Siliguri", "Noto Sans Bengali", sans-serif' }}>
                            {notice.title}
                        </h2>

                        {/* Body */}
                        <div
                            className={`text-sm text-muted-foreground leading-relaxed transition-all duration-300 ${isLong && !expanded ? 'line-clamp-3' : ''}`}
                            style={{ fontFamily: '"Hind Siliguri", "Noto Sans Bengali", sans-serif', whiteSpace: 'pre-wrap' }}
                        >
                            {notice.description}
                        </div>

                        {/* Expand/collapse for long notices */}
                        {isLong && (
                            <button
                                onClick={handleToggle}
                                className="mt-1 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                                {expanded ? (
                                    <><ChevronUp className="h-3 w-3" /> কম দেখুন</>
                                ) : (
                                    <><ChevronDown className="h-3 w-3" /> আরও পড়ুন</>
                                )}
                            </button>
                        )}

                        {/* Links */}
                        {links.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {links.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        {link.label || 'লিংক দেখুন'}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-border/40">
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {notice.postedBy?.name}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatRelativeDate(notice.createdAt)}
                                </span>
                                {notice.expiresAt && !isExpired && (
                                    <span className="flex items-center gap-1 text-amber-600">
                                        <Clock className="h-3 w-3" />
                                        মেয়াদ: {new Date(notice.expiresAt).toLocaleDateString('en-BD')}
                                    </span>
                                )}
                            </div>

                            {/* Mark read button */}
                            {!isRead && (
                                <button
                                    onClick={() => onMarkRead(notice.id)}
                                    className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors font-medium"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    পড়া হয়েছে চিহ্নিত করুন
                                </button>
                            )}
                            {isRead && (
                                <span className="text-xs flex items-center gap-1 text-muted-foreground/60">
                                    <EyeOff className="h-3 w-3" />
                                    পড়া হয়েছে
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function StudentNoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const fetchNotices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notices');
            if (res.ok) {
                const data = await res.json();
                setNotices(data.notices || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotices(); }, [fetchNotices]);

    const handleMarkRead = useCallback(async (id: string) => {
        if (readIds.has(id)) return;
        setReadIds(prev => new Set([...prev, id]));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await fetch(`/api/notices/${id}/read`, { method: 'POST' });
        } catch (e) {
            // Silently fail — optimistic update stays
        }
    }, [readIds]);

    const isRead = useCallback((notice: Notice) => {
        return readIds.has(notice.id) || notice.readBy.length > 0;
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
    const otherNotices = filtered.filter(n => n.priority !== 'URGENT');

    return (
        <div className="min-h-screen bg-background">
            {/* Top banner for URGENT notices */}
            <AnimatePresence>
                {urgentNotices.some(n => !isRead(n)) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-red-600 dark:bg-red-800 text-white overflow-hidden"
                    >
                        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 animate-pulse" />
                            <span className="font-bold text-sm" style={{ fontFamily: '"Hind Siliguri", sans-serif' }}>
                                {urgentNotices.filter(n => !isRead(n)).length}টি জরুরি নোটিশ রয়েছে! নিচে স্ক্রল করুন।
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Bell className="h-8 w-8 text-primary" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground" style={{ fontFamily: '"Hind Siliguri", "Noto Sans Bengali", sans-serif' }}>
                                    নোটিশ বোর্ড
                                </h1>
                                <p className="text-muted-foreground text-sm">Official Notice Board</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchNotices} className="h-9 gap-1.5 text-muted-foreground">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">রিফ্রেশ</span>
                        </Button>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-3 text-sm mt-4">
                        {[
                            { label: 'মোট নোটিশ', value: notices.length, color: 'text-foreground' },
                            { label: 'অপঠিত', value: unreadCount, color: 'text-red-500' },
                            { label: 'জরুরি', value: notices.filter(n => n.priority === 'URGENT').length, color: 'text-orange-500' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                                <span className={`font-bold ${s.color}`}>{s.value}</span>
                                <span className="text-muted-foreground">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter area */}
                <div className="space-y-3 mb-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="নোটিশ খুঁজুন... / Search notices..."
                            className="pl-10 h-11 rounded-xl bg-muted/40 border-border"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}>
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter chips */}
                    <div className="flex flex-wrap gap-2">
                        {/* Unread toggle */}
                        <button
                            onClick={() => setShowUnreadOnly(p => !p)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${showUnreadOnly
                                    ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                    : 'bg-muted/30 text-muted-foreground border-border hover:border-red-400'
                                }`}
                        >
                            <Bell className="h-3.5 w-3.5" />
                            অপঠিত
                        </button>

                        {/* Priority filters */}
                        {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                            <button
                                key={p}
                                onClick={() => setFilterPriority(p)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterPriority === p
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/50'
                                    }`}
                            >
                                {p === 'ALL' ? 'সব' : PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG]?.label || p}
                            </button>
                        ))}

                        <span className="w-px h-6 bg-border self-center" />

                        {/* Category filter */}
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-muted/30 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        >
                            <option value="ALL">সব বিভাগ</option>
                            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notice List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm" style={{ fontFamily: '"Hind Siliguri", sans-serif' }}>নোটিশ লোড হচ্ছে...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <BellOff className="h-14 w-14 mb-4 opacity-20" />
                        <p className="text-lg font-semibold" style={{ fontFamily: '"Hind Siliguri", sans-serif' }}>কোনো নোটিশ পাওয়া যায়নি</p>
                        <p className="text-sm mt-1">No notices found for your selected filters.</p>
                        {(search || filterPriority !== 'ALL' || filterCategory !== 'ALL' || showUnreadOnly) && (
                            <Button
                                variant="outline" size="sm" className="mt-4"
                                onClick={() => { setSearch(''); setFilterPriority('ALL'); setFilterCategory('ALL'); setShowUnreadOnly(false); }}
                            >
                                ফিল্টার পরিষ্কার করুন
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {filtered.map((notice) => (
                                <NoticeCard
                                    key={notice.id}
                                    notice={notice}
                                    isRead={isRead(notice)}
                                    onMarkRead={handleMarkRead}
                                />
                            ))}
                        </AnimatePresence>

                        {filtered.length > 0 && (
                            <p className="text-center text-xs text-muted-foreground py-4">
                                মোট {filtered.length}টি নোটিশ দেখানো হচ্ছে
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
