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
      const matchesSearch = !filters.search ||
        exam.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        exam.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        exam.subject.toLowerCase().includes(filters.search.toLowerCase());

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
  }, [exams, filters]);

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
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'ONLINE': return <Monitor className="w-4 h-4" />;
      case 'OFFLINE': return <FileText className="w-4 h-4" />;
      case 'MIXED': return <Globe className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'ONLINE': return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 'OFFLINE': return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case 'MIXED': return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Exam Management
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                  Create, manage, and monitor all your examinations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refesh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/question-bank')}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Question Bank
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/exams/evaluations')}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Evaluations
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100"
                >
                  <ArrowRight className="w-4 h-4" />
                  Dashboard
                </Button>
                {userRole !== 'TEACHER' && (
                  <Button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Create Exam
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
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-700">
                    <TabsTrigger value="all">All Exams</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="online">Online</TabsTrigger>
                    <TabsTrigger value="negative-marking">Negative Marking</TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                      <div className="lg:col-span-2">
                        <Label htmlFor="search">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="search"
                            placeholder="Search exams..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="select-all"
                            checked={filteredAndSortedExams.length > 0 && selectedExams.length === filteredAndSortedExams.length}
                            onCheckedChange={handleSelectAll}
                          />
                          <Label htmlFor="select-all" className="cursor-pointer">Select All</Label>
                        </div>
                      </div>

                      {selectedExams.length > 0 && (
                        <div className="flex items-end pb-0 gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to activate ${selectedExams.length} exams?`)) return;
                              setLoading(true);
                              try {
                                // We can reuse the loop or make a bulk API. For now, looping is safer/easier without API changes.
                                // Or simpler: just notify user we need a bulk activate API? 
                                // Let's loop for now as it's client side.
                                for (const id of selectedExams) {
                                  await fetch(`/api/exams?id=${id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isActive: true }),
                                  });
                                }
                                toast({ title: "Success", description: "Exams activated successfully" });
                                await fetchExams();
                                setSelectedExams([]);
                              } catch (e) {
                                toast({ title: "Error", description: "Failed to activate exams", variant: "destructive" });
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-100"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Activate ({selectedExams.length})
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedExams.length})
                          </Button>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="status-filter">Status</Label>
                        <Select
                          value={filters.status}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger id="status-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="type-filter">Type</Label>
                        <Select
                          value={filters.type}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger id="type-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="ONLINE">Online</SelectItem>
                            <SelectItem value="OFFLINE">Offline</SelectItem>
                            <SelectItem value="MIXED">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="subject-filter">Subject</Label>
                        <Select
                          value={filters.subject}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value }))}
                        >
                          <SelectTrigger id="subject-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {uniqueSubjects.map(subject => (
                              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="negative-marking-filter">Negative Marking</Label>
                        <Select
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
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Exam Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-64">
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
                <AnimatePresence>
                  {filteredAndSortedExams.map((exam, index) => (
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
                    >
                      <Card
                        onClick={() => handleExamClick(exam.id)}
                        className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 flex gap-3">
                              <div className="pt-1">
                                {userRole !== 'TEACHER' && (
                                  <Checkbox
                                    checked={selectedExams.includes(exam.id)}
                                    onCheckedChange={(checked) => handleSelectExam(exam.id, checked as boolean)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                  {exam.name}
                                </CardTitle>
                                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {exam.description || 'No description provided'}
                                </CardDescription>
                                <div className="hidden">{/* Debug hidden element */}{userRole}</div>
                              </div>
                            </div>

                            {userRole !== 'TEACHER' && (
                              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExamClick(exam.id); }}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      console.log("Redirecting with role:", userRole);
                                      const role = userRole?.toUpperCase();
                                      if (role === "SUPER_USER" || role === "ADMIN" || role === "TEACHER") {
                                        router.push(`/exams/evaluations/${exam.id}/results`);
                                      } else {
                                        router.push(`/exams/results/${exam.id}`);
                                      }
                                    }}>
                                      <BarChart3 className="w-4 h-4 mr-2" />
                                      View Results
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(exam.id); }}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Exam
                                    </DropdownMenuItem>
                                    {userRole === "SUPER_USER" && !exam.isActive && (
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleApprove(exam.id); }}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve Exam
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => { e.stopPropagation(); handleDelete(exam.id); }}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Exam
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className={getStatusColor(exam.isActive)}>
                              {exam.isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Pending
                                </>
                              )}
                            </Badge>

                            <Badge className={getTypeColor(exam.type)}>
                              {getTypeIcon(exam.type)}
                              <span className="ml-1">
                                {exam.type === 'ONLINE' ? 'Online' :
                                  exam.type === 'OFFLINE' ? 'Offline' :
                                    exam.type === 'MIXED' ? 'Mixed' : 'Type'}
                              </span>
                            </Badge>

                            {exam.allowRetake && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Retake Allowed
                              </Badge>
                            )}

                            {exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-red-600 border-red-600 cursor-help">
                                    -{exam.mcqNegativeMarking}% MCQ
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Negative marking of {exam.mcqNegativeMarking}% for incorrect MCQ answers</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                                <BookOpen className="w-3 h-3" />
                                Subject
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white">{exam.subject}</p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                                <Award className="w-3 h-3" />
                                Marks
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white">{exam.totalMarks}</p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                                <Calendar className="w-3 h-3" />
                                Date
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(exam.date).toLocaleDateString()}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                                <Clock className="w-3 h-3" />
                                Time
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white text-xs">
                                {exam.startTime ? new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                {' - '}
                                {exam.endTime ? new Date(exam.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                                <Users className="w-3 h-3" />
                                Created By
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {exam.createdBy || 'Unknown'}
                              </p>
                            </div>
                          </div>

                          {/* CQ/SQ Information */}
                          {(exam.cqTotalQuestions || exam.sqTotalQuestions) && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {exam.cqTotalQuestions && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                                          <FileText className="w-3 h-3" />
                                          CQ Questions
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {exam.cqRequiredQuestions || 0}/{exam.cqTotalQuestions}
                                        </p>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Creative Questions: {exam.cqRequiredQuestions || 0} required out of {exam.cqTotalQuestions} total</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {exam.sqTotalQuestions && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                                          <FileText className="w-3 h-3" />
                                          SQ Questions
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {exam.sqRequiredQuestions || 0}/{exam.sqTotalQuestions}
                                        </p>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Short Questions: {exam.sqRequiredQuestions || 0} required out of {exam.sqTotalQuestions} total</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleExamClick(exam.id); }}
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); router.push(`/exams/results/${exam.id}`); }}
                                className="flex items-center gap-2"
                              >
                                <BarChart3 className="w-4 h-4" />
                                Results
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </TooltipProvider>

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
      </div>
    </div >
  );
}