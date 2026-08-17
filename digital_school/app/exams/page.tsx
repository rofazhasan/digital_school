"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Edit,
  Trash2,
  CheckCircle,
  Plus,
  Award,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Clock,
  BookOpen,
  RefreshCw,
  Save,
  FileText,
  Monitor,
  Globe,
  MoreVertical,
  Library,
  SortAsc,
  SortDesc,
  BarChart3,
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Timer,
  SlidersHorizontal,
  X,
  Layers,
  Sparkles,
  RotateCcw,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";
import { copyToClipboard } from "@/lib/native/interaction";

export type Exam = {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  subject: string;
  totalMarks: number;
  isActive: boolean;
  createdBy?: string;
  classId?: string;
  createdAt?: string;
  type?: 'ONLINE' | 'OFFLINE' | 'MIXED';
  allowRetake?: boolean;
  mcqNegativeMarking?: number;
  mcNegativeMarking?: number;
  cqTotalQuestions?: number;
  cqRequiredQuestions?: number;
  sqTotalQuestions?: number;
  sqRequiredQuestions?: number;
  objectiveTime?: number;
  cqSqTime?: number;
  hasSets?: boolean;
  setsCount?: number;
  generatedSet?: any;
};

type TimingFilter = 'all' | 'live' | 'upcoming' | 'finished';

type FilterState = {
  search: string;
  status: string;
  timing: TimingFilter;
  type: string;
  subject: string;
  negativeMarking?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

function getExamTiming(exam: Exam): { start: Date; end: Date } {
  let start: Date;
  let end: Date;

  if (exam.startTime && !isNaN(new Date(exam.startTime).getTime())) {
    start = new Date(exam.startTime);
  } else if (exam.date && !isNaN(new Date(exam.date).getTime())) {
    start = new Date(exam.date);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date();
  }

  if (exam.endTime && !isNaN(new Date(exam.endTime).getTime())) {
    end = new Date(exam.endTime);
  } else if (exam.duration && exam.duration > 0 && exam.startTime && !isNaN(new Date(exam.startTime).getTime())) {
    end = new Date(new Date(exam.startTime).getTime() + exam.duration * 60000);
  } else if (exam.date && !isNaN(new Date(exam.date).getTime())) {
    end = new Date(exam.date);
    end.setHours(23, 59, 59, 999);
  } else {
    end = new Date(start.getTime() + 60 * 60000);
  }

  return { start, end };
}

function getExamStatus(exam: Exam, now: Date): "live" | "upcoming" | "finished" {
  const { start, end } = getExamTiming(exam);
  if (now < start) return "upcoming";
  if (now > end) return "finished";
  return "live";
}

function formatTimeRemaining(diffMs: number): string {
  if (diffMs <= 0) return "0s";
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function getLiveCountdown(start: Date, end: Date, now: Date): { text: string; state: "live" | "upcoming" | "ended" } {
  const startDiff = start.getTime() - now.getTime();
  const endDiff = end.getTime() - now.getTime();

  if (now < start) {
    if (startDiff <= 0) return { text: "Starting now", state: "upcoming" };
    return { text: `Starts in ${formatTimeRemaining(startDiff)}`, state: "upcoming" };
  }

  if (now >= start && now <= end) {
    if (endDiff <= 0) return { text: "Ending now", state: "live" };
    return { text: `Ends in ${formatTimeRemaining(endDiff)}`, state: "live" };
  }

  return { text: "Ended", state: "ended" };
}

function formatExamTimingDisplay(start: Date, end: Date) {
  const isSameDay = start.toDateString() === end.toDateString();
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const startTimeStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTimeStr = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isSameDay) {
    return `${dateStr} • ${startTimeStr} – ${endTimeStr}`;
  }
  const endDateStr = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${dateStr} ${startTimeStr} – ${endDateStr} ${endTimeStr}`;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    timing: 'all',
    type: 'all',
    subject: 'all',
    negativeMarking: 'all',
    sortBy: 'priority_asc', // Default to Live -> Upcoming -> Passed (Date Ascending)
    sortOrder: 'asc'
  });

  const [activeTab, setActiveTab] = useState('all');
  const [userRole, setUserRole] = useState<string>("");
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 0,
    allowRetake: false,
    objectiveTime: 0,
    cqSqTime: 0
  });

  // Single Delete Confirmation Modal State ('DELETE' text required)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Delete Confirmation Modal State ('DELETE' text required)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteConfirmationText, setBulkDeleteConfirmationText] = useState("");
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  // Real-time 1s tick for smooth countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for search ('/' to focus, 'Escape' to clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    fetchExams();
    fetchUserRole();
    fetchResults();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const handleCopyId = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic(ImpactStyle.Light);
    await copyToClipboard(id);
    setCopiedId(id);
    toast({ title: "Copied", description: "Exam ID copied to clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchResults = async () => {
    try {
      const response = await fetch("/api/results");
      if (response.ok) {
        const result = await response.json();
        setResults(result.results || []);
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
    }
  };

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const result = await response.json();
        const user = result.user || result.data?.user;
        if (user && user.role) {
          setUserRole(user.role);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/exams?limit=1000");
      if (!response.ok) throw new Error("Failed to fetch exams");
      const result = await response.json();

      let data: any[] = [];
      if (Array.isArray(result)) {
        data = result;
      } else if (Array.isArray(result.data)) {
        data = result.data;
      } else if (result.data?.exams && Array.isArray(result.data.exams)) {
        data = result.data.exams;
      } else if (result.exams && Array.isArray(result.exams)) {
        data = result.exams;
      }

      setExams(data);
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast({
        title: "Error",
        description: "Failed to fetch exams.",
        variant: "destructive"
      });
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    triggerHaptic(ImpactStyle.Medium);
    setRefreshing(true);
    await fetchExams();
    setRefreshing(false);
    toast({ title: "Refreshed", description: "Exam list updated in real-time." });
  };

  const handleEdit = (id: string) => {
    const exam = exams.find((e) => e.id === id);
    if (!exam) return;

    setEditingExam(exam);

    const timing = getExamTiming(exam);

    const formatDateTime = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const formatDate = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    setEditForm({
      name: exam.name,
      description: exam.description || '',
      date: formatDate(timing.start),
      startTime: formatDateTime(timing.start),
      endTime: formatDateTime(timing.end),
      duration: exam.duration || 0,
      allowRetake: exam.allowRetake || false,
      objectiveTime: exam.objectiveTime || 0,
      cqSqTime: exam.cqSqTime || 0
    });

    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingExam) return;

    try {
      const res = await fetch(`/api/exams?id=${editingExam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          date: new Date(editForm.date).toISOString(),
          startTime: editForm.startTime ? new Date(editForm.startTime).toISOString() : null,
          endTime: editForm.endTime ? new Date(editForm.endTime).toISOString() : null,
          duration: Number(editForm.duration),
          allowRetake: editForm.allowRetake,
          objectiveTime: Number(editForm.objectiveTime) || null,
          cqSqTime: Number(editForm.cqSqTime) || null
        })
      });

      if (!res.ok) throw new Error('Failed to update exam');

      const updated = await res.json();
      const updatedExam = updated.data || updated;

      setExams(prev => prev.map(e => e.id === editingExam.id ? { ...e, ...updatedExam } : e));
      setIsEditOpen(false);
      setEditingExam(null);
      toast({ title: 'Success', description: 'Exam updated successfully.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update exam.', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/exams?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!res.ok) throw new Error('Failed to toggle status');

      setExams(prev => prev.map(e => e.id === id ? { ...e, isActive: !currentStatus } : e));
      toast({
        title: 'Status Updated',
        description: `Exam is now ${!currentStatus ? 'Active' : 'Pending'}.`
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const handleChangeType = async (id: string, newType: 'ONLINE' | 'OFFLINE' | 'MIXED') => {
    try {
      const res = await fetch(`/api/exams?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType })
      });

      if (!res.ok) throw new Error('Failed to change type');

      setExams(prev => prev.map(e => e.id === id ? { ...e, type: newType } : e));
      toast({ title: 'Type Updated', description: `Exam type changed to ${newType}.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to change exam type.', variant: 'destructive' });
    }
  };

  const openDeleteDialog = (exam: Exam, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExamToDelete(exam);
    setDeleteConfirmationText("");
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete || deleteConfirmationText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/exams?id=${examToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete exam');

      setExams(prev => prev.filter(exam => exam.id !== examToDelete.id));
      setSelectedExams(prev => prev.filter(examId => examId !== examToDelete.id));
      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
      toast({ title: 'Success', description: 'Exam deleted permanently.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete exam.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const openBulkDeleteDialog = () => {
    if (selectedExams.length === 0) return;
    setBulkDeleteConfirmationText("");
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedExams.length === 0 || bulkDeleteConfirmationText !== "DELETE") return;
    setIsBulkDeleting(true);
    try {
      const res = await fetch(`/api/exams`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedExams })
      });
      if (!res.ok) throw new Error('Failed to delete exams');

      setExams(prev => prev.filter(exam => !selectedExams.includes(exam.id)));
      setSelectedExams([]);
      setIsBulkDeleteModalOpen(false);
      toast({ title: 'Success', description: `${selectedExams.length} exams deleted permanently.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete exams.', variant: 'destructive' });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push("/exams/create");
  };

  const handleExamClick = (id: string) => {
    router.push(`/exams/${id}`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExams(filteredAndSortedExams.map(e => e.id));
    } else {
      setSelectedExams([]);
    }
  };

  const handleSelectExam = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedExams(prev => [...prev, id]);
    } else {
      setSelectedExams(prev => prev.filter(examId => examId !== id));
    }
  };

  const resetFilters = () => {
    triggerHaptic(ImpactStyle.Light);
    setFilters({
      search: '',
      status: 'all',
      timing: 'all',
      type: 'all',
      subject: 'all',
      negativeMarking: 'all',
      sortBy: 'priority_asc',
      sortOrder: 'asc'
    });
    setActiveTab('all');
    setCurrentPage(1);
  };

  // Get unique subjects
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    exams.forEach(e => {
      if (e.subject && e.subject.trim()) subjects.add(e.subject.trim());
    });
    return Array.from(subjects);
  }, [exams]);

  // Statistics calculation
  const stats = useMemo(() => {
    let liveCount = 0;
    let upcomingCount = 0;
    let finishedCount = 0;
    let activeCount = 0;
    let pendingCount = 0;
    let onlineCount = 0;
    let withNegativeMarking = 0;

    exams.forEach(e => {
      const st = getExamStatus(e, now);
      if (st === 'live') liveCount++;
      else if (st === 'upcoming') upcomingCount++;
      else finishedCount++;

      if (e.isActive) activeCount++;
      else pendingCount++;

      if (e.type === 'ONLINE') onlineCount++;
      if (e.mcqNegativeMarking && e.mcqNegativeMarking > 0) withNegativeMarking++;
    });

    return {
      total: exams.length,
      live: liveCount,
      upcoming: upcomingCount,
      finished: finishedCount,
      active: activeCount,
      pending: pendingCount,
      online: onlineCount,
      withNegativeMarking
    };
  }, [exams, now]);

  // Active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.timing !== 'all') count++;
    if (filters.status !== 'all' || activeTab !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.subject !== 'all') count++;
    if (filters.negativeMarking && filters.negativeMarking !== 'all') count++;
    return count;
  }, [filters, activeTab]);

  // Filter and Exact Priority Sort
  const filteredAndSortedExams = useMemo(() => {
    const filtered = exams.filter(exam => {
      // Search
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const matchesName = exam.name?.toLowerCase().includes(q);
        const matchesDesc = exam.description?.toLowerCase().includes(q);
        const matchesSubject = exam.subject?.toLowerCase().includes(q);
        const matchesAuthor = exam.createdBy?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesSubject && !matchesAuthor) return false;
      }

      // Status Filter
      if (filters.status === 'active' && !exam.isActive) return false;
      if (filters.status === 'pending' && exam.isActive) return false;

      // Type Filter
      if (filters.type !== 'all' && exam.type !== filters.type) return false;

      // Subject Filter
      if (filters.subject !== 'all' && exam.subject?.toLowerCase() !== filters.subject.toLowerCase()) return false;

      // Negative Marking Filter
      if (filters.negativeMarking === 'with' && (!exam.mcqNegativeMarking || exam.mcqNegativeMarking <= 0)) return false;
      if (filters.negativeMarking === 'without' && (exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0)) return false;

      // Status Tab Filtering
      if (activeTab === 'active' && !exam.isActive) return false;
      if (activeTab === 'pending' && exam.isActive) return false;
      if (activeTab === 'online' && exam.type !== 'ONLINE') return false;

      // Timing Filter (All, Live, Upcoming, Finished)
      if (filters.timing !== 'all') {
        const examStatus = getExamStatus(exam, now);
        if (filters.timing !== examStatus) return false;
      }

      return true;
    });

    // Exact Sorting Specification:
    // 1. Live exams first (both active and inactive: now >= start && now <= end)
    // 2. Upcoming exams second (now < start)
    // 3. Passed / Finished exams last (now > end)
    // Within EACH category: Date Ascending order (earliest start date first)
    filtered.sort((a, b) => {
      const timingA = getExamTiming(a);
      const timingB = getExamTiming(b);
      const startA = timingA.start.getTime();
      const startB = timingB.start.getTime();
      const endA = timingA.end.getTime();
      const endB = timingB.end.getTime();

      if (filters.sortBy === 'priority_asc') {
        const getRank = (start: number, end: number) => {
          const nowMs = now.getTime();
          if (nowMs >= start && nowMs <= end) return 0; // Live (both active and inactive)
          if (nowMs < start) return 1; // Upcoming
          return 2; // Passed / Ended
        };

        const rankA = getRank(startA, endA);
        const rankB = getRank(startB, endB);

        if (rankA !== rankB) {
          return rankA - rankB; // 0 (Live) -> 1 (Upcoming) -> 2 (Passed)
        }

        // Within same timing bucket: Date Ascending!
        if (startA !== startB) return startA - startB;
        if (endA !== endB) return endA - endB;
        return (a.name || "").localeCompare(b.name || "");
      }

      if (filters.sortBy === 'date') {
        if (filters.sortOrder === 'asc') {
          if (startA !== startB) return startA - startB;
        } else {
          if (startA !== startB) return startB - startA;
        }
        return (a.name || "").localeCompare(b.name || "");
      }

      if (filters.sortBy === 'name') {
        return filters.sortOrder === 'asc'
          ? (a.name || "").localeCompare(b.name || "")
          : (b.name || "").localeCompare(a.name || "");
      }

      if (filters.sortBy === 'marks') {
        return filters.sortOrder === 'asc'
          ? a.totalMarks - b.totalMarks
          : b.totalMarks - a.totalMarks;
      }

      if (filters.sortBy === 'created') {
        const createA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return filters.sortOrder === 'asc' ? createA - createB : createB - createA;
      }

      return startA - startB;
    });

    return filtered;
  }, [exams, debouncedSearch, filters, activeTab, now]);

  // Pagination Logic
  const paginatedExams = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedExams.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedExams, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedExams.length / pageSize));

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'ONLINE': return <Monitor className="w-3 h-3" />;
      case 'OFFLINE': return <FileText className="w-3 h-3" />;
      case 'MIXED': return <Globe className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground pb-20">
      <TooltipProvider>
        {/* Sticky Hero Header */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Award className="h-5 w-5" />
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                    Academic Exam Hub
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium pl-10 sm:pl-11">
                  Manage live, upcoming, and past exams with real-time status and set generation tools.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-semibold shadow-xs"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin text-blue-500" : ""}`} />
                  Sync
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/exams/evaluations')}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-semibold shadow-xs"
                >
                  <FileText className="h-4 w-4 mr-1.5 text-indigo-500" />
                  Evaluations
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/question-bank')}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-semibold shadow-xs"
                >
                  <Library className="h-4 w-4 mr-1.5 text-purple-500" />
                  Question Bank
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-semibold shadow-xs"
                >
                  <LayoutDashboard className="h-4 w-4 mr-1.5 text-slate-500" />
                  Dashboard
                </Button>
                {userRole !== 'TEACHER' && (
                  <Button
                    onClick={handleCreate}
                    className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95 transition-all text-xs h-9 px-4"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create Exam
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div
              onClick={() => {
                triggerHaptic(ImpactStyle.Light);
                setFilters(p => ({ ...p, timing: 'all', status: 'all' }));
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`cursor-pointer group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                filters.timing === 'all' && activeTab === 'all'
                  ? "bg-blue-500/10 border-blue-500/30 shadow-md ring-2 ring-blue-500/20"
                  : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Exams</span>
                <Layers className="h-4 w-4 text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black">{stats.total}</span>
                <span className="text-[11px] text-muted-foreground font-medium">All recorded</span>
              </div>
            </div>

            <div
              onClick={() => {
                triggerHaptic(ImpactStyle.Light);
                setFilters(p => ({ ...p, timing: 'live', status: 'all' }));
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`cursor-pointer group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                filters.timing === 'live'
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-md ring-2 ring-emerald-500/20"
                  : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live Now</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.live}</span>
                <span className="text-[11px] text-muted-foreground font-medium">Ongoing</span>
              </div>
            </div>

            <div
              onClick={() => {
                triggerHaptic(ImpactStyle.Light);
                setFilters(p => ({ ...p, timing: 'upcoming', status: 'all' }));
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`cursor-pointer group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                filters.timing === 'upcoming'
                  ? "bg-indigo-500/10 border-indigo-500/30 shadow-md ring-2 ring-indigo-500/20"
                  : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Upcoming</span>
                <Timer className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats.upcoming}</span>
                <span className="text-[11px] text-muted-foreground font-medium">Scheduled</span>
              </div>
            </div>

            <div
              onClick={() => {
                triggerHaptic(ImpactStyle.Light);
                setFilters(p => ({ ...p, status: 'active', timing: 'all' }));
                setActiveTab('active');
                setCurrentPage(1);
              }}
              className={`cursor-pointer group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                activeTab === 'active'
                  ? "bg-teal-500/10 border-teal-500/30 shadow-md ring-2 ring-teal-500/20"
                  : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Active</span>
                <CheckCircle className="h-4 w-4 text-teal-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">{stats.active}</span>
                <span className="text-[11px] text-muted-foreground font-medium">Published</span>
              </div>
            </div>

            <div
              onClick={() => {
                triggerHaptic(ImpactStyle.Light);
                setFilters(p => ({ ...p, status: 'pending', timing: 'all' }));
                setActiveTab('pending');
                setCurrentPage(1);
              }}
              className={`cursor-pointer group col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                activeTab === 'pending'
                  ? "bg-amber-500/10 border-amber-500/30 shadow-md ring-2 ring-amber-500/20"
                  : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Setup</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</span>
                <span className="text-[11px] text-muted-foreground font-medium">Draft</span>
              </div>
            </div>
          </div>

          {/* Control Bar: Timing Pills, Tabs, Search & Filters */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            {/* Top Row: Timing Chips & Status Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Button
                  variant={filters.timing === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => { triggerHaptic(ImpactStyle.Light); setFilters(p => ({ ...p, timing: 'all' })); setCurrentPage(1); }}
                  className={`rounded-xl font-bold text-xs h-8 px-3.5 transition-all ${
                    filters.timing === 'all'
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  All Timing ({stats.total})
                </Button>
                <Button
                  variant={filters.timing === 'live' ? "default" : "outline"}
                  size="sm"
                  onClick={() => { triggerHaptic(ImpactStyle.Light); setFilters(p => ({ ...p, timing: 'live' })); setCurrentPage(1); }}
                  className={`rounded-xl font-bold text-xs h-8 px-3.5 transition-all ${
                    filters.timing === 'live'
                      ? "bg-emerald-600 text-white shadow-emerald-600/30 shadow-md"
                      : "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Live Now ({stats.live})
                </Button>
                <Button
                  variant={filters.timing === 'upcoming' ? "default" : "outline"}
                  size="sm"
                  onClick={() => { triggerHaptic(ImpactStyle.Light); setFilters(p => ({ ...p, timing: 'upcoming' })); setCurrentPage(1); }}
                  className={`rounded-xl font-bold text-xs h-8 px-3.5 transition-all ${
                    filters.timing === 'upcoming'
                      ? "bg-indigo-600 text-white shadow-indigo-600/30 shadow-md"
                      : "text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                  }`}
                >
                  <Timer className="h-3.5 w-3.5 mr-1" />
                  Upcoming ({stats.upcoming})
                </Button>
                <Button
                  variant={filters.timing === 'finished' ? "default" : "outline"}
                  size="sm"
                  onClick={() => { triggerHaptic(ImpactStyle.Light); setFilters(p => ({ ...p, timing: 'finished' })); setCurrentPage(1); }}
                  className={`rounded-xl font-bold text-xs h-8 px-3.5 transition-all ${
                    filters.timing === 'finished'
                      ? "bg-slate-700 text-white shadow-slate-700/30 shadow-md"
                      : "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  Passed / Ended ({stats.finished})
                </Button>
              </div>

              {/* Status Tab Switcher */}
              <div className="flex items-center gap-2">
                <Tabs
                  value={activeTab}
                  onValueChange={(val) => {
                    triggerHaptic(ImpactStyle.Light);
                    setActiveTab(val);
                    setFilters(p => ({
                      ...p,
                      status: val === 'active' ? 'active' : val === 'pending' ? 'pending' : 'all',
                      type: val === 'online' ? 'ONLINE' : 'all'
                    }));
                    setCurrentPage(1);
                  }}
                >
                  <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl h-9">
                    <TabsTrigger value="all" className="rounded-xl text-xs font-bold px-3">All Status</TabsTrigger>
                    <TabsTrigger value="active" className="rounded-xl text-xs font-bold px-3">Active</TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-xl text-xs font-bold px-3">Pending</TabsTrigger>
                    <TabsTrigger value="online" className="rounded-xl text-xs font-bold px-3">Online</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`rounded-xl font-semibold text-xs h-9 px-3 ${
                    showFilters || activeFiltersCount > 0
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                      : "text-muted-foreground"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
              </div>
            </div>

            {/* Middle Row: Search & Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="relative w-full lg:col-span-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search exam name, subject, or creator... (Press '/' to focus)"
                  value={filters.search}
                  onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                  className="pl-10 pr-9 py-2.5 w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-muted-foreground/60"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters(p => ({ ...p, search: "" }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Exact Priority Sort Selector */}
              <Select
                value={filters.sortBy}
                onValueChange={(v) => {
                  triggerHaptic(ImpactStyle.Light);
                  setFilters(p => ({ ...p, sortBy: v }));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm font-medium h-10">
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="priority_asc">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">✨ Priority:</span> Live → Upcoming → Passed (Date Asc)
                  </SelectItem>
                  <SelectItem value="date">📅 Date: Earliest First</SelectItem>
                  <SelectItem value="marks">🎯 Total Marks: Highest First</SelectItem>
                  <SelectItem value="name">🔤 Title: A to Z</SelectItem>
                  <SelectItem value="created">🕒 Recently Created</SelectItem>
                </SelectContent>
              </Select>

              {/* Subject Selector */}
              <Select
                value={filters.subject}
                onValueChange={(v) => {
                  triggerHaptic(ImpactStyle.Light);
                  setFilters(p => ({ ...p, subject: v }));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm font-medium h-10">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Subjects ({uniqueSubjects.length})</SelectItem>
                  {uniqueSubjects.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filter Chips Bar */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground mr-1">Active Filters:</span>
                {filters.search.trim() && (
                  <Badge variant="secondary" className="rounded-lg text-xs gap-1 py-1 font-medium">
                    Search: "{filters.search}"
                    <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setFilters(p => ({ ...p, search: "" }))} />
                  </Badge>
                )}
                {filters.timing !== 'all' && (
                  <Badge variant="secondary" className="rounded-lg text-xs gap-1 py-1 font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                    Timing: {filters.timing === 'live' ? 'Live Now' : filters.timing === 'upcoming' ? 'Upcoming' : 'Passed / Ended'}
                    <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setFilters(p => ({ ...p, timing: 'all' }))} />
                  </Badge>
                )}
                {activeTab !== 'all' && (
                  <Badge variant="secondary" className="rounded-lg text-xs gap-1 py-1 font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                    Status: {activeTab}
                    <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => { setActiveTab('all'); setFilters(p => ({ ...p, status: 'all' })); }} />
                  </Badge>
                )}
                {filters.subject !== 'all' && (
                  <Badge variant="secondary" className="rounded-lg text-xs gap-1 py-1 font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                    Subject: {filters.subject}
                    <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setFilters(p => ({ ...p, subject: 'all' }))} />
                  </Badge>
                )}
                {filters.type !== 'all' && (
                  <Badge variant="secondary" className="rounded-lg text-xs gap-1 py-1 font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                    Type: {filters.type}
                    <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setFilters(p => ({ ...p, type: 'all' }))} />
                  </Badge>
                )}
                {filters.negativeMarking && filters.negativeMarking !== 'all' && (
                  <Badge variant="secondary" className="rounded-lg text-xs gap-1 py-1 font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                    Negative Marking: {filters.negativeMarking === 'with' ? 'With Negative' : 'Without Negative'}
                    <X className="h-3 w-3 cursor-pointer hover:text-rose-500" onClick={() => setFilters(p => ({ ...p, negativeMarking: 'all' }))} />
                  </Badge>
                )}

                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 ml-1 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" /> Clear All
                </button>
              </div>
            )}

            {/* Advanced Filters Drawer */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-4 gap-3"
                >
                  <div>
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Exam Type</Label>
                    <Select value={filters.type} onValueChange={(v) => { triggerHaptic(ImpactStyle.Light); setFilters(p => ({ ...p, type: v })); setCurrentPage(1); }}>
                      <SelectTrigger className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/50 text-xs h-9">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                        <SelectItem value="OFFLINE">Offline</SelectItem>
                        <SelectItem value="MIXED">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Negative Marking</Label>
                    <Select value={filters.negativeMarking || 'all'} onValueChange={(v) => { triggerHaptic(ImpactStyle.Light); setFilters(p => ({ ...p, negativeMarking: v })); setCurrentPage(1); }}>
                      <SelectTrigger className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/50 text-xs h-9">
                        <SelectValue placeholder="All Exams" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Exams</SelectItem>
                        <SelectItem value="with">With Negative Marking</SelectItem>
                        <SelectItem value="without">Without Negative Marking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Page Size</Label>
                    <Select value={pageSize.toString()} onValueChange={(v) => { triggerHaptic(ImpactStyle.Light); setPageSize(parseInt(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/50 text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="12">12 per page</SelectItem>
                        <SelectItem value="24">24 per page</SelectItem>
                        <SelectItem value="48">48 per page</SelectItem>
                        <SelectItem value="1000">Show All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="w-full rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-9"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk Selection Bar if any selected */}
            {selectedExams.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  {selectedExams.length} exams selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedExams([])}
                    className="h-8 text-xs font-semibold text-muted-foreground"
                  >
                    Deselect All
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={openBulkDeleteDialog}
                    className="h-8 text-xs font-bold rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete Selected ({selectedExams.length})
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                Loading academic exams in priority date-ascending order...
              </p>
            </div>
          )}

          {/* Exam Cards Grid */}
          {!loading && paginatedExams.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {paginatedExams.map((exam, index) => {
                  const timing = getExamTiming(exam);
                  const timingStatus = getExamStatus(exam, now);
                  const countdown = getLiveCountdown(timing.start, timing.end, now);

                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                      className="group"
                    >
                      <Card
                        onClick={() => handleExamClick(exam.id)}
                        className={`relative h-full overflow-hidden transition-all duration-300 rounded-[2rem] border cursor-pointer ${
                          timingStatus === 'live'
                            ? 'bg-gradient-to-br from-white via-emerald-50/20 to-white dark:from-slate-900 dark:via-emerald-950/15 dark:to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/5 hover:border-emerald-500 hover:shadow-xl'
                            : timingStatus === 'upcoming'
                            ? 'bg-gradient-to-br from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/15 dark:to-slate-900 border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/60 hover:shadow-md'
                            : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                        } ${selectedExams.includes(exam.id) ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                      >
                        {/* Top Indicator Bar */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-1.5 ${
                            timingStatus === 'live'
                              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-pulse'
                              : timingStatus === 'upcoming'
                              ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        />

                        <CardContent className="p-5 sm:p-6 flex flex-col h-full space-y-4">
                          {/* Header: Timing status, Badges & Actions */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Timing Badge */}
                              {timingStatus === 'live' && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-2.5 py-0.5 font-bold text-[10px] uppercase flex items-center gap-1">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </span>
                                  LIVE • {countdown.text}
                                </Badge>
                              )}

                              {timingStatus === 'upcoming' && (
                                <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 px-2.5 py-0.5 font-bold text-[10px] uppercase flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  UPCOMING • {countdown.text}
                                </Badge>
                              )}

                              {timingStatus === 'finished' && (
                                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 px-2 py-0.5 font-semibold text-[10px] uppercase">
                                  ENDED
                                </Badge>
                              )}

                              {/* Active / Inactive Badge */}
                              <Badge
                                className={
                                  exam.isActive
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase"
                                }
                              >
                                {exam.isActive ? 'Active' : 'Pending'}
                              </Badge>

                              {/* Type Badge */}
                              <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-700 px-2 py-0.5 flex items-center gap-1 uppercase">
                                {getTypeIcon(exam.type)}
                                {exam.type}
                              </Badge>

                              {/* Sets Status (Green Tick When Sets Generated) */}
                              {(exam.hasSets || exam.generatedSet || (exam.setsCount && exam.setsCount > 0)) ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 uppercase">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                                  <span>Sets Ready ({exam.setsCount || 1})</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground/60 border-dashed border-slate-300 dark:border-slate-700 px-1.5 py-0.5 flex items-center gap-1">
                                  <span>No Sets</span>
                                </Badge>
                              )}

                              {exam.allowRetake && (
                                <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 px-1.5 py-0.5 flex items-center gap-1 uppercase">
                                  <RefreshCw className="w-2.5 h-2.5" /> Retake
                                </Badge>
                              )}
                            </div>

                            {/* Dropdown Menu & Select Checkbox */}
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedExams.includes(exam.id)}
                                onCheckedChange={(checked) => handleSelectExam(exam.id, checked as boolean)}
                                className="rounded-md mr-1"
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-slate-200 shadow-2xl p-1.5 min-w-[200px]">
                                  <DropdownMenuItem className="rounded-xl flex items-center gap-2 font-medium cursor-pointer" onClick={() => router.push(`/exams/${exam.id}`)}>
                                    <Layers className="w-4 h-4 text-blue-500" />
                                    <span>Manage & Questions</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-xl flex items-center gap-2 font-medium cursor-pointer" onClick={() => handleEdit(exam.id)}>
                                    <Edit className="w-4 h-4 text-indigo-500" />
                                    <span>Edit Details</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="rounded-xl flex items-center gap-2 font-medium cursor-pointer">
                                      <Monitor className="w-4 h-4 text-cyan-500" />
                                      <span>Change Type</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                      <DropdownMenuSubContent className="rounded-2xl border-slate-200 shadow-2xl p-1.5 min-w-[140px]">
                                        <DropdownMenuRadioGroup value={exam.type} onValueChange={(val) => handleChangeType(exam.id, val as any)}>
                                          <DropdownMenuRadioItem value="ONLINE" className="rounded-xl cursor-pointer">Online</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="OFFLINE" className="rounded-xl cursor-pointer">Offline</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="MIXED" className="rounded-xl cursor-pointer">Mixed</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                  </DropdownMenuSub>
                                  <DropdownMenuItem className="rounded-xl flex items-center gap-2 font-medium cursor-pointer" onClick={() => handleToggleActive(exam.id, exam.isActive)}>
                                    {exam.isActive ? (
                                      <>
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        <span>Set as Pending</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span>Activate Exam</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-xl flex items-center gap-2 font-medium cursor-pointer" onClick={() => router.push(`/exams/evaluations/${exam.id}/results`)}>
                                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                                    <span>View Results</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-xl flex items-center gap-2 font-medium cursor-pointer" onClick={() => window.open(`/exams/${exam.id}/print`, '_blank')}>
                                    <Printer className="w-4 h-4 text-violet-500" />
                                    <span>Print Exam & Cards</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1.5" />
                                  <DropdownMenuItem className="rounded-xl flex items-center gap-2 text-rose-500 focus:bg-rose-50 focus:text-rose-600 font-bold cursor-pointer" onClick={(e) => openDeleteDialog(exam, e)}>
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Exam</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Subject & Name */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                {exam.subject || 'General'}
                              </span>
                              <button
                                onClick={(e) => handleCopyId(exam.id, e)}
                                title="Copy Exam ID"
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                {copiedId === exam.id ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{exam.id.substring(0, 8)}...</span>
                              </button>
                            </div>

                            <h3 className="text-lg font-black text-foreground line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {exam.name}
                            </h3>

                            {exam.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                                {exam.description}
                              </p>
                            )}
                          </div>

                          {/* Marks & Minus Marks Pills */}
                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Total Marks</span>
                              <span className="text-base font-black text-foreground">{exam.totalMarks}</span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Negative Marks</span>
                              <span className="text-base font-black text-rose-600 dark:text-rose-400">
                                {exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0
                                  ? `-${exam.mcqNegativeMarking >= 1 ? exam.mcqNegativeMarking : Math.round(exam.mcqNegativeMarking * 100)}%`
                                  : '0'}
                              </span>
                            </div>
                          </div>

                          {/* Footer Info & Actions */}
                          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground truncate" title={formatExamTimingDisplay(timing.start, timing.end)}>
                                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="truncate">{formatExamTimingDisplay(timing.start, timing.end)}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground block pl-5">
                                Duration: {exam.duration || 60} mins
                              </span>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleExamClick(exam.id); }}
                              className="rounded-xl font-bold text-xs h-8 px-3.5 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0"
                            >
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredAndSortedExams.length === 0 && (
            <div className="text-center py-20 bg-white/60 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-foreground">No exams match your filters</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Try clearing your search query, adjusting status or timing filters.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="rounded-xl font-bold text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
              >
                Reset All Filters
              </Button>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                Showing <strong className="text-foreground font-bold">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                <strong className="text-foreground font-bold">{Math.min(currentPage * pageSize, filteredAndSortedExams.length)}</strong> of{" "}
                <strong className="text-blue-600 dark:text-blue-400 font-bold">{filteredAndSortedExams.length}</strong> exams
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-xl h-9 font-bold text-xs"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                      return (
                        <Button
                          key={p}
                          variant={currentPage === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCurrentPage(p);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`w-9 h-9 rounded-xl font-bold text-xs ${
                            currentPage === p
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                              : ""
                          }`}
                        >
                          {p}
                        </Button>
                      );
                    }
                    if (p === 2 || p === totalPages - 1) {
                      return (
                        <span key={p} className="px-1 text-slate-400 text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-xl h-9 font-bold text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Edit Exam Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Edit Exam Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Make changes to exam timing, duration, and configurations below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Exam Name
              </Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                className="rounded-xl resize-none text-xs"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Start Date & Time
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm(p => ({ ...p, startTime: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  End Date & Time
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm(p => ({ ...p, endTime: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Duration (Minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => setEditForm(p => ({ ...p, duration: Number(e.target.value) }))}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label htmlFor="allowRetake" className="text-xs font-bold">Allow Retake</Label>
                  <p className="text-[10px] text-muted-foreground">Students can retry exam</p>
                </div>
                <Switch
                  id="allowRetake"
                  checked={editForm.allowRetake}
                  onCheckedChange={(checked) => setEditForm(p => ({ ...p, allowRetake: checked }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Exam Delete Confirmation Dialog ('DELETE' required) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl border-rose-200 dark:border-rose-900/50 shadow-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-rose-600 dark:text-rose-400">
              Permanently Delete Exam?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              You are about to permanently delete <span className="font-bold text-foreground">{examToDelete?.name}</span>. All related questions, student submissions, OMR sheets, and published results will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 font-medium">
              ⚠️ <strong>This action cannot be undone.</strong> To confirm, please type <span className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 select-all">DELETE</span> below:
            </div>
            <Input
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="font-mono text-center font-bold tracking-widest uppercase rounded-xl border-rose-300 dark:border-rose-800 focus:ring-rose-500"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setExamToDelete(null);
                setDeleteConfirmationText("");
              }}
              disabled={isDeleting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmationText !== "DELETE" || isDeleting}
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Exam Permanently"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Exam Delete Confirmation Dialog ('DELETE' required) */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl border-rose-200 dark:border-rose-900/50 shadow-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-rose-600 dark:text-rose-400">
              Permanently Delete {selectedExams.length} Exams?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              You are about to permanently delete <span className="font-bold text-foreground">{selectedExams.length} selected examinations</span>. All related questions, submissions, OMR sheets, and results will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 font-medium">
              ⚠️ <strong>This bulk action cannot be undone.</strong> To confirm, please type <span className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 select-all">DELETE</span> below:
            </div>
            <Input
              value={bulkDeleteConfirmationText}
              onChange={(e) => setBulkDeleteConfirmationText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="font-mono text-center font-bold tracking-widest uppercase rounded-xl border-rose-300 dark:border-rose-800 focus:ring-rose-500"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkDeleteModalOpen(false);
                setBulkDeleteConfirmationText("");
              }}
              disabled={isBulkDeleting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBulkDelete}
              disabled={bulkDeleteConfirmationText !== "DELETE" || isBulkDeleting}
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20"
            >
              {isBulkDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting {selectedExams.length} Exams...
                </>
              ) : (
                `Permanently Delete ${selectedExams.length} Exams`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
