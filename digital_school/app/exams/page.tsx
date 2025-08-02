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
import { 
  Edit, Trash2, CheckCircle, Plus, Award, AlertTriangle, Search, 
  Filter, Calendar, Clock, Users, BookOpen, Eye, MoreVertical,
  Globe, Monitor, FileText, BarChart3, Settings, Download,
  RefreshCw, SortAsc, SortDesc, FilterX
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

// Mock user role (replace with real auth logic)
const userRole = "SUPER_USER"; // or "ADMIN", "TEACHER", etc.

type Exam = {
  id: string;
  name: string;
  description: string;
  date: string;
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
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/exams");
      if (!response.ok) throw new Error("Failed to fetch exams");
      const result = await response.json();
      // Handle both array and object with data property
      const data = Array.isArray(result) ? result : result.data || [];
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

  const handleEdit = async (id: string) => {
    const exam = exams.find((e) => e.id === id);
    if (!exam) return;
    
    const name = prompt('Edit exam name:', exam.name);
    const description = prompt('Edit description:', exam.description || '');
    if (name === null) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/exams?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error('Failed to update exam');
      toast({ title: 'Success', description: 'Exam updated successfully.' });
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
      
      return matchesSearch && matchesStatus && matchesType && matchesSubject;
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
    
    return { total, active, pending, online, offline, mixed };
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                  Refresh
                </Button>
                <Button
                  onClick={handleCreate}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Create Exam
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
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
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-700">
                    <TabsTrigger value="all">All Exams</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="online">Online</TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                      <Card className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {exam.name}
                              </CardTitle>
                              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {exam.description || 'No description provided'}
                              </CardDescription>
                            </div>
                            
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
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/exams/results/${exam.id}`); }}>
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
                              <Badge variant="outline" className="text-red-600 border-red-600">
                                -{exam.mcqNegativeMarking}% MCQ
                              </Badge>
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
                                <Users className="w-3 h-3" />
                                Created By
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {exam.createdBy || 'Unknown'}
                              </p>
                            </div>
                            
                            {(exam.cqTotalQuestions || exam.sqTotalQuestions) && (
                              <div className="col-span-2">
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                                  <FileText className="w-3 h-3" />
                                  Question Selection
                                </div>
                                <div className="flex gap-2 text-xs">
                                  {exam.cqTotalQuestions && (
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                      CQ: {exam.cqRequiredQuestions || 5}/{exam.cqTotalQuestions}
                                    </span>
                                  )}
                                  {exam.sqTotalQuestions && (
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                      SQ: {exam.sqRequiredQuestions || 5}/{exam.sqTotalQuestions}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

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
      </div>
    </div>
  );
}
