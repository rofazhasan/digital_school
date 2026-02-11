"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Edit, Trash2, CheckCircle, Plus, Award, AlertTriangle, Search,
  Filter, Calendar, Clock, Users, BookOpen, Eye, MoreVertical,
  Globe, Monitor, FileText, BarChart3, Settings, Download,
  RefreshCw, SortAsc, SortDesc, FilterX, Save, X, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Mock user role (replace with real auth logic)
// const userRole = "SUPER_USER"; // or "ADMIN", "TEACHER", etc.

type Exam = {
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
  cqTotalQuestions?: number;
  cqRequiredQuestions?: number;
  sqTotalQuestions?: number;
  sqRequiredQuestions?: number;
};

type FilterState = {
  search: string;
  status: string;
  type: string;
  subject: string;
  negativeMarking?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    type: 'all',
    subject: 'all',
    sortBy: 'created',
    sortOrder: 'desc'
  });
  const [activeTab, setActiveTab] = useState('all');
  const [userRole, setUserRole] = useState<string>("");
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);


  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 0,
    allowRetake: false
  });

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchExams();
    fetchUserRole();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setCurrentPage(1); // Reset to first page on search
    }, 400);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const result = await response.json();
        // Handle wrapped response
        const user = result.user || result.data?.user;
        console.log("Fetched user role:", user?.role);
        if (user && user.role) {
          setUserRole(user.role);
        }
      } else {
        console.error("Failed to fetch user role, status:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/exams");
      if (!response.ok) throw new Error("Failed to fetch exams");
      const result = await response.json();

      // Handle array, wrapped array, or wrapped object with exams property
      let data = [];
      if (Array.isArray(result)) {
        data = result;
      } else if (Array.isArray(result.data)) {
        data = result.data;
      } else if (result.data?.exams && Array.isArray(result.data.exams)) {
        data = result.data.exams;
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
    setRefreshing(true);
    await fetchExams();
    setRefreshing(false);
    toast({ title: "Refreshed", description: "Exam list updated." });
  };

  const handleEdit = (id: string) => {
    const exam = exams.find((e) => e.id === id);
    if (!exam) return;

    setEditingExam(exam);

    // Parse times
    const dateObj = new Date(exam.date);
    const startDate = exam.startTime ? new Date(exam.startTime) : dateObj;
    const endDate = exam.endTime ? new Date(exam.endTime) : dateObj;

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
      date: formatDate(dateObj),
      startTime: formatDateTime(startDate),
      endTime: formatDateTime(endDate),
      duration: exam.duration || 0,
      allowRetake: exam.allowRetake || false
    });

    setIsEditOpen(true);
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;

    setLoading(true);
    try {
      // Reconstruct ISO strings
      const startDateTime = new Date(editForm.startTime);
      const endDateTime = new Date(editForm.endTime);

      // Calculate duration if it's 0 or invalid, otherwise use user input
      let duration = Number(editForm.duration);
      if (!duration || duration <= 0) {
        const diffMs = endDateTime.getTime() - startDateTime.getTime();
        if (diffMs > 0) {
          duration = Math.round(diffMs / 60000); // Convert to minutes
        }
      }

      const res = await fetch(`/api/exams?id=${editingExam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          date: new Date(editForm.date).toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          duration: duration,
          allowRetake: editForm.allowRetake
        }),
      });

      if (!res.ok) throw new Error('Failed to update exam');

      toast({ title: 'Success', description: 'Exam updated successfully.' });
      setIsEditOpen(false);
      await fetchExams();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update exam.',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`⚠️ PERMANENT DELETION WARNING ⚠️\n\nAre you sure you want to delete this exam?\n\nThis will permanently delete:\n• All student submissions\n• All uploaded answer images\n• All evaluation data and results\n• All exam sets and questions\n• All related records\n\nThis action CANNOT be undone!`)) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm permanent deletion:');
    if (confirmation !== 'DELETE') return;

    setLoading(true);
    try {
      const res = await fetch(`/api/exams?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete exam');
      toast({
        title: 'Success',
        description: 'Exam and all related data deleted permanently.'
      });
      await fetchExams();
      // Remove from selection if selected
      if (selectedExams.includes(id)) {
        setSelectedExams(prev => prev.filter(examId => examId !== id));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete exam.',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExams.length === 0) return;

    if (!confirm(`⚠️ BULK PERMANENT DELETION WARNING ⚠️\n\nAre you sure you want to delete ${selectedExams.length} exams?\n\nThis will permanently delete:\n• All student submissions\n• All uploaded answer images\n• All evaluation data and results\n• All exam sets and questions\n• All related records\n\nThis action CANNOT be undone!`)) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm permanent deletion:');
    if (confirmation !== 'DELETE') return;

    setLoading(true);
    try {
      const res = await fetch(`/api/exams`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedExams })
      });

      if (!res.ok) throw new Error('Failed to delete exams');

      const data = await res.json();
      toast({
        title: 'Success',
        description: data.message || 'Exams deleted successfully.'
      });

      setSelectedExams([]);
      await fetchExams();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete exams.',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredAndSortedExams.map(e => e.id);
      setSelectedExams(allIds);
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

  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exams?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error('Failed to approve exam');
      toast({ title: 'Success', description: 'Exam approved successfully.' });
      await fetchExams();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve exam.',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push("/exams/create");
  };

  const handleExamClick = (id: string) => {
    router.push(`/exams/${id}`);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      subject: 'all',
      negativeMarking: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  // Get unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    const subjects = [...new Set(exams.map(exam => exam.subject))];
    return subjects.filter(subject => subject && subject.trim() !== '');
  }, [exams]);

  // Filter and sort exams
  const filteredAndSortedExams = useMemo(() => {
    let filtered = exams.filter(exam => {
      const matchesSearch = !debouncedSearch ||
        exam.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        exam.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        exam.subject.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesStatus = filters.status === 'all' ||
        (filters.status === 'active' && exam.isActive) ||
        (filters.status === 'pending' && !exam.isActive);

      const matchesType = filters.type === 'all' || exam.type === filters.type;
      const matchesSubject = filters.subject === 'all' || exam.subject === filters.subject;
      const matchesNegativeMarking = !filters.negativeMarking || filters.negativeMarking === 'all' ||
        (filters.negativeMarking === 'with' && exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0) ||
        (filters.negativeMarking === 'without' && (!exam.mcqNegativeMarking || exam.mcqNegativeMarking === 0));

      // Handle tab-based filtering
      let matchesTab = true;
      if (activeTab === 'active') {
        matchesTab = exam.isActive;
      } else if (activeTab === 'pending') {
        matchesTab = !exam.isActive;
      } else if (activeTab === 'online') {
        matchesTab = exam.type === 'ONLINE';
      } else if (activeTab === 'negative-marking') {
        matchesTab = !!(exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0);
      }

      return matchesSearch && matchesStatus && matchesType && matchesSubject && matchesNegativeMarking && matchesTab;
    });

    // Sort exams
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'marks':
          aValue = a.totalMarks;
          bValue = b.totalMarks;
          break;
        case 'subject':
          aValue = a.subject.toLowerCase();
          bValue = b.subject.toLowerCase();
          break;
        case 'created':
          aValue = a.createdAt ? new Date(a.createdAt) : new Date(0);
          bValue = b.createdAt ? new Date(b.createdAt) : new Date(0);
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [exams, debouncedSearch, filters, activeTab]);

  // Pagination Logic
  const paginatedExams = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedExams.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedExams, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedExams.length / pageSize);

  // Statistics
  const stats = useMemo(() => {
    const total = exams.length;
    const active = exams.filter(e => e.isActive).length;
    const pending = total - active;
    const online = exams.filter(e => e.type === 'ONLINE').length;
    const offline = exams.filter(e => e.type === 'OFFLINE').length;
    const mixed = exams.filter(e => e.type === 'MIXED').length;
    const withNegativeMarking = exams.filter(e => e.mcqNegativeMarking && e.mcqNegativeMarking > 0).length;
    const withCQ = exams.filter(e => e.cqTotalQuestions && e.cqTotalQuestions > 0).length;
    const withSQ = exams.filter(e => e.sqTotalQuestions && e.sqTotalQuestions > 0).length;

    return { total, active, pending, online, offline, mixed, withNegativeMarking, withCQ, withSQ };
  }, [exams]);

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"
      : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-800";
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'ONLINE': return <Monitor className="w-3 h-3" />;
      case 'OFFLINE': return <FileText className="w-3 h-3" />;
      case 'MIXED': return <Globe className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'ONLINE': return "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-100 dark:border-purple-800";
      case 'OFFLINE': return "bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-100 dark:border-slate-800";
      case 'MIXED': return "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-100 dark:border-orange-800";
      default: return "bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-100 dark:border-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl 2xl:max-w-[95vw] mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <TooltipProvider>
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:to-gray-400 font-fancy">
                  Exam Hub
                </h1>
                <p className="mt-2 text-base md:text-lg text-gray-600 dark:text-gray-400 font-medium">
                  Simplify your academic evaluations with premium management tools.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-full border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh Sync</span>
                </Button>
                {userRole !== 'TEACHER' && (
                  <Button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-[1.02] active:scale-95 text-white shadow-xl shadow-blue-500/20 rounded-full px-6 transition-all duration-300"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Create Exam</span>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Exams</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.online}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Negative Marking</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {stats.withNegativeMarking}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters and Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                  <TabsList className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 p-1 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white">All</TabsTrigger>
                    <TabsTrigger value="active" className="rounded-lg px-6 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Active</TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-lg px-6 data-[state=active]:bg-amber-600 data-[state=active]:text-white">Pending</TabsTrigger>
                    <TabsTrigger value="online" className="rounded-lg px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white">Online</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search exam name or subject..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 rounded-xl border-gray-200 focus:ring-blue-500 transition-all bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  <Button
                    variant={showFilters ? "secondary" : "outline"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="rounded-xl flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Subject</Label>
                          <Select
                            value={filters.subject}
                            onValueChange={(v) => setFilters(p => ({ ...p, subject: v }))}
                          >
                            <SelectTrigger className="rounded-xl bg-white dark:bg-gray-900 border-gray-200">
                              <SelectValue placeholder="All Subjects" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Subjects</SelectItem>
                              {uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Type</Label>
                          <Select
                            value={filters.type}
                            onValueChange={(v) => setFilters(p => ({ ...p, type: v }))}
                          >
                            <SelectTrigger className="rounded-xl bg-white dark:bg-gray-900 border-gray-200">
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="ONLINE">Online</SelectItem>
                              <SelectItem value="OFFLINE">Offline</SelectItem>
                              <SelectItem value="MIXED">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Sort By</Label>
                          <div className="flex gap-2">
                            <Select
                              value={filters.sortBy}
                              onValueChange={(v) => setFilters(p => ({ ...p, sortBy: v }))}
                            >
                              <SelectTrigger className="rounded-xl bg-white dark:bg-gray-900 border-gray-200 flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="created">Recently Added</SelectItem>
                                <SelectItem value="marks">Total Marks</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              onClick={() => setFilters(p => ({ ...p, sortOrder: p.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                              className="rounded-xl w-10 p-0"
                            >
                              {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-end justify-end">
                          <Button variant="ghost" onClick={resetFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Reset All
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
                          value={filters.negativeMarking || 'all'}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, negativeMarking: value }))}
                        >
                          <SelectTrigger id="negative-marking-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Exams</SelectItem>
                            <SelectItem value="with">With Negative Marking</SelectItem>
                            <SelectItem value="without">Without Negative Marking</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end gap-2">
                        <Button
                          variant="outline"
                          onClick={resetFilters}
                          className="flex items-center gap-2"
                        >
                          <FilterX className="w-4 h-4" />
                          Reset
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="sort-by">Sort by:</Label>
                        <Select
                          value={filters.sortBy}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="created">Recently Created</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="marks">Marks</SelectItem>
                            <SelectItem value="subject">Subject</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                        }))}
                        className="flex items-center gap-2"
                      >
                        {filters.sortOrder === 'asc' ? (
                          <SortAsc className="w-4 h-4" />
                        ) : (
                          <SortDesc className="w-4 h-4" />
                        )}
                        {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      </Button>
                    </div>
                  </div >
                </Tabs >
              </CardContent >
            </Card >
          </motion.div >

    {/* Exam Cards Grid */ }
    < motion.div
  initial = {{ opacity: 0, y: 20 }
}
animate = {{ opacity: 1, y: 0 }}
transition = {{ delay: 0.3 }}
          >
{
  loading?(
              <div className = "flex justify-center items-center h-64" >
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading exams...</p>
      </div>
              </div>
            ) : filteredAndSortedExams.length === 0 ? (
  <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
    <CardContent className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No exams found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.status !== 'all' || filters.type !== 'all' || filters.subject !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first exam.'}
          </p>
          {!filters.search && filters.status === 'all' && filters.type === 'all' && filters.subject === 'all' && (
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Exam
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    <AnimatePresence mode="popLayout">
      {paginatedExams.map((exam, index) => (
        <motion.div
          key={exam.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{
            scale: 1.02,
            y: -4,
            transition: { duration: 0.2 }
          }}
          className="group"
                      <Card
                        onClick={() => handleExamClick(exam.id)}
                        className={`group relative h-full bg-white dark:bg-gray-800 border-gray-200/50 dark:border-gray-700/50 overflow-hidden card-premium rounded-[2rem] p-1 flex flex-col ${selectedExams.includes(exam.id) ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                      >
                        <div className="p-6 flex flex-col h-full bg-white dark:bg-gray-800 rounded-[1.75rem] shadow-sm group-hover:shadow-xl transition-all">
                          {/* Top Section: Status & Actions */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-tighter ${getStatusColor(exam.isActive)}`}>
                                {exam.isActive ? 'Active' : 'Pending'}
                              </Badge>
                              <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-tighter ${getTypeColor(exam.type)}`}>
                                {exam.type}
                              </Badge>
                            </div>
                            {userRole !== 'TEACHER' && (
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedExams.includes(exam.id)}
                                  onCheckedChange={(checked) => handleSelectExam(exam.id, checked as boolean)}
                                  className="rounded-md border-gray-300 mr-2"
                                />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-2xl border-gray-200 shadow-2xl p-2 min-w-[180px]">
                                    <DropdownMenuItem className="rounded-xl flex items-center gap-2" onClick={() => handleEdit(exam.id)}>
                                      <Edit className="w-4 h-4 text-blue-500" />
                                      <span>Edit Exam</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl flex items-center gap-2" onClick={() => router.push(`/exams/evaluations/${exam.id}/results`)}>
                                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                                      <span>View Results</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-2" />
                                    <DropdownMenuItem className="rounded-xl flex items-center gap-2 text-rose-500 focus:bg-rose-50 focus:text-rose-600" onClick={() => handleDelete(exam.id)}>
                                      <Trash2 className="w-4 h-4" />
                                      <span>Delete Exam</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>

                          {/* Subject & Name */}
                          <div className="mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 block mb-1">
                              {exam.subject || 'Academic Exam'}
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 min-h-[3rem] font-fancy">
                              {exam.name}
                            </h3>
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-0.5">
                                <Award className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Total Marks</span>
                              </div>
                              <p className="text-base font-bold text-gray-900 dark:text-white">{exam.totalMarks}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-0.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Date</span>
                              </div>
                              <p className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                {new Date(exam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          {/* Detailed Stats & Metadata */}
                          <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                {exam.createdBy?.charAt(0) || 'U'}
                              </div>
                              <div className="flex flex-col">
                                <p className="text-[10px] font-bold text-gray-500 leading-none mb-0.5 tracking-wider uppercase">Author</p>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 truncate max-w-[100px]">{exam.createdBy || 'Unknown'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold">{exam.duration}m</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Duration: {exam.duration} minutes</TooltipContent>
                              </Tooltip>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all font-bold px-4 text-xs"
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
        </motion.div>
      ))}
  </AnimatePresence>
  </div >
)}
          </motion.div >

  {/* Pagination Controls */ }
{
  totalPages > 1 && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-gray-700"
    >
      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        Showing <span className="text-blue-600 dark:text-blue-400">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-blue-600 dark:text-blue-400">{Math.min(currentPage * pageSize, filteredAndSortedExams.length)}</span> of <span className="font-bold">{filteredAndSortedExams.length}</span> exams
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          className="rounded-xl px-4"
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            // Show only first, last, and pages around current
            if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : ''}`}
                >
                  {pageNum}
                </Button>
              );
            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
              return <span key={pageNum} className="text-gray-400">...</span>;
            }
            return null;
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          className="rounded-xl px-4"
        >
          Next
        </Button>
      </div>
    </motion.div>
  )
}
        </TooltipProvider >

  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Exam</DialogTitle>
        <DialogDescription>
          Make changes to the exam here. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Textarea
            id="description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="date" className="text-right">
            Date
          </Label>
          <Input
            id="date"
            type="date"
            value={editForm.date}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="startTime" className="text-right">
            Start Time
          </Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={editForm.startTime}
            onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="endTime" className="text-right">
            End Time
          </Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={editForm.endTime}
            onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="duration" className="text-right">
            Duration (mins)
          </Label>
          <Input
            id="duration"
            type="number"
            value={editForm.duration}
            onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="retake" className="text-right">
            Allow Retake
          </Label>
          <div className="col-span-3 flex items-center space-x-2">
            <Switch
              id="retake"
              checked={editForm.allowRetake}
              onCheckedChange={(checked) => setEditForm({ ...editForm, allowRetake: checked })}
            />
            <Label htmlFor="retake">{editForm.allowRetake ? 'Yes' : 'No'}</Label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
        <Button onClick={handleUpdateExam} disabled={loading}>
          {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
      </div >
    </div >
  );
}