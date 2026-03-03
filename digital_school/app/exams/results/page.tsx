'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Search,
  Filter,
  Trophy,
  Award,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Target,
  BarChart3,
  Star,
  Medal,
  Crown,
  CheckCircle,
  XCircle,
  Minus,
  Eye,
  Clock,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_USER' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  studentProfile?: {
    id: string;
    roll: string;
    registrationNo: string;
    class: {
      id: string;
      name: string;
      section: string;
    };
  };
  institute?: {
    id: string;
    name: string;
  };
}

interface Exam {
  id: string;
  name: string;
  date: string;
  totalMarks: number;
  passMarks: number;
  class: {
    id: string;
    name: string;
    section: string;
  };
}

interface Result {
  id: string;
  mcqMarks: number;
  cqMarks: number;
  sqMarks: number;
  total: number;
  rank?: number;
  grade?: string;
  percentage?: number;
  isPublished: boolean;
  publishedAt?: string;
  student: {
    id: string;
    roll: string;
    registrationNo: string;
    user: {
      name: string;
    };
    class: {
      name: string;
      section: string;
    };
  };
  exam: Exam;
}

interface ExamResults {
  exam: Exam;
  results: Result[];
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  mcqTotal: number;
  cqTotal: number;
  sqTotal: number;
}

interface DetailedResult {
  id: string;
  mcqMarks: number;
  cqMarks: number;
  sqMarks: number;
  total: number;
  rank?: number;
  grade?: string;
  percentage?: number;
  isPublished: boolean;
  publishedAt?: string;
  student: {
    id: string;
    roll: string;
    registrationNo: string;
    user: {
      name: string;
    };
    class: {
      name: string;
      section: string;
    };
  };
  exam: Exam;
  // Additional detailed fields
  mcqTotal?: number;
  cqTotal?: number;
  sqTotal?: number;
  mcqPercentage?: number;
  cqPercentage?: number;
  sqPercentage?: number;
  performanceAnalysis?: {
    strength: string;
    weakness: string;
    recommendation: string;
  };
}

export default function ExamResultsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<ExamResults[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExamResults[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'class'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUserAndResults();
  }, []);

  useEffect(() => {
    filterAndSortResults();
  }, [examResults, selectedExam, searchTerm, sortBy, sortOrder]);

  const fetchUserAndResults = async () => {
    try {
      setLoading(true);

      // Fetch current user
      const userResponse = await fetch('/api/user', {
        credentials: 'include'
      });
      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`Failed to fetch user: ${userResponse.status}`);
      }
      const userData = await userResponse.json();
      setUser(userData);

      // Fetch results based on user role
      const resultsResponse = await fetch('/api/exams/results/all', {
        credentials: 'include'
      });
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();

        // Handle different possible data structures
        let examResults = [];
        if (Array.isArray(resultsData)) examResults = resultsData;
        else if (Array.isArray(resultsData.examResults)) examResults = resultsData.examResults;
        else if (Array.isArray(resultsData.results)) examResults = resultsData.results;
        else if (Array.isArray(resultsData.data)) examResults = resultsData.data;
        else if (resultsData.data?.examResults && Array.isArray(resultsData.data.examResults)) examResults = resultsData.data.examResults;
        else if (resultsData.data?.results && Array.isArray(resultsData.data.results)) examResults = resultsData.data.results;

        console.log('📊 API Response:', resultsData);
        console.log('📊 Processed exam results:', examResults);
        setExamResults(examResults);
      } else {
        console.error('Failed to fetch results:', resultsResponse.status);
        toast.error('Failed to load exam results');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load results');
      toast.error('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortResults = () => {
    let filtered = examResults;

    // Filter by exam
    if (selectedExam !== 'all') {
      filtered = filtered.filter((result: ExamResults) => result.exam?.id === selectedExam);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((result: ExamResults) =>
        result.exam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.exam?.class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.results?.some((r: Result) =>
          r.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.student?.roll?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort results
    filtered.sort((a: ExamResults, b: ExamResults) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.exam?.date || 0).getTime() - new Date(b.exam?.date || 0).getTime();
          break;
        case 'name':
          comparison = (a.exam?.name || '').localeCompare(b.exam?.name || '');
          break;
        case 'class':
          comparison = (a.exam?.class?.name || '').localeCompare(b.exam?.class?.name || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredResults(filtered);
  };

  const downloadResultsSheet = async (examId: string, format: 'pdf' | 'csv' = 'pdf') => {
    const downloadKey = `${examId}-${format}`;

    if (downloading.has(downloadKey)) {
      return; // Prevent multiple downloads
    }

    try {
      setDownloading((prev: Set<string>) => new Set(prev).add(downloadKey));
      const loadingToast = toast.loading(`Generating ${format.toUpperCase()} results sheet...`);

      const endpoint = format === 'pdf'
        ? `/api/exams/results/${examId}/download`
        : `/api/exams/results/${examId}/download-simple`;

      console.log('🔍 Download request:', { endpoint, format, examId });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('🔍 Download response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Generated file is empty');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exam-results-${examId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.dismiss(loadingToast);
        toast.success(`${format.toUpperCase()} results sheet downloaded successfully`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error downloading ${format} results sheet:`, error);
      toast.error(`Failed to download ${format.toUpperCase()} results sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloading((prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(downloadKey);
        return newSet;
      });
    }
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800';

    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'A-':
      case 'B+':
        return 'bg-blue-100 text-blue-800';
      case 'B':
      case 'B-':
        return 'bg-yellow-100 text-yellow-800';
      case 'C+':
      case 'C':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getRankBadge = (rank?: number) => {
    if (!rank) return null;

    if (rank === 1) return <Badge className="bg-yellow-100 text-yellow-800" {...({} as any)}><Trophy className="w-3 h-3 mr-1" />1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-100 text-gray-800" {...({} as any)}><Award className="w-3 h-3 mr-1" />2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-100 text-orange-800" {...({} as any)}><Award className="w-3 h-3 mr-1" />3rd</Badge>;
    return <Badge variant="outline" {...({} as any)}>{rank}</Badge>;
  };

  const getPerformanceAnalysis = (result: Result) => {
    const totalPossible = result.exam.totalMarks;
    const percentage = result.percentage || 0;

    let strength = '';
    let weakness = '';
    let recommendation = '';

    // Analyze performance by section
    const mcqPercentage = result.mcqMarks / (result.exam.totalMarks * 0.4) * 100; // Assuming 40% MCQ
    const cqPercentage = result.cqMarks / (result.exam.totalMarks * 0.4) * 100; // Assuming 40% CQ
    const sqPercentage = result.sqMarks / (result.exam.totalMarks * 0.2) * 100; // Assuming 20% SQ

    if (mcqPercentage > 80) strength = 'Excellent MCQ performance';
    else if (mcqPercentage < 50) weakness = 'MCQ section needs improvement';

    if (cqPercentage > 80) strength = strength ? strength + ', Strong CQ answers' : 'Strong CQ answers';
    else if (cqPercentage < 50) weakness = weakness ? weakness + ', CQ section needs work' : 'CQ section needs work';

    if (sqPercentage > 80) strength = strength ? strength + ', Good SQ performance' : 'Good SQ performance';
    else if (sqPercentage < 50) weakness = weakness ? weakness + ', SQ section needs attention' : 'SQ section needs attention';

    if (percentage >= 90) recommendation = 'Outstanding performance! Keep up the excellent work.';
    else if (percentage >= 80) recommendation = 'Very good performance. Focus on weak areas for even better results.';
    else if (percentage >= 70) recommendation = 'Good performance. Review and practice more in challenging areas.';
    else if (percentage >= 60) recommendation = 'Satisfactory performance. Consider additional study and practice.';
    else recommendation = 'Performance needs improvement. Consider seeking additional help and practice.';

    return { strength, weakness, recommendation };
  };

  const toggleExpandedResult = (examId: string) => {
    setExpandedResults((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(examId)) {
        newSet.delete(examId);
      } else {
        newSet.add(examId);
      }
      return newSet;
    });
  };

  // Helper for rank styling
  const getRankData = (rank?: number) => {
    if (rank === 1) return { color: 'from-amber-400 to-yellow-600', icon: Crown, label: 'Champion' };
    if (rank === 2) return { color: 'from-slate-300 to-slate-500', icon: Medal, label: 'Runner Up' };
    if (rank === 3) return { color: 'from-orange-400 to-amber-700', icon: Medal, label: '3rd Place' };
    return { color: 'from-indigo-400 to-blue-600', icon: Star, label: `Rank #${rank}` };
  };

  const isStudent = user?.role === 'STUDENT';
  const canViewAllResults = user && ['SUPER_USER', 'ADMIN', 'TEACHER'].includes(user.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 relative z-10"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/20 text-rose-200 backdrop-blur-xl">
          <AlertDescription className="flex flex-col items-center gap-4 py-4">
            <span className="text-center font-medium">Error: {error}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-rose-500/30 hover:bg-rose-500/20"
              onClick={() => {
                setError(null);
                fetchUserAndResults();
              }}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-slate-400">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
            <FileText className="w-8 h-8 opacity-20" />
          </div>
          <p className="text-lg font-medium">Please login to view your results</p>
          <Button onClick={() => router.push('/login')} className="bg-indigo-600 hover:bg-indigo-700">
            Login Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-indigo-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-rose-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto p-4 md:p-8 relative z-10 space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
              <GraduationCap className="w-3.5 h-3.5" />
              Academic Excellence
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent">
              Exam Results
            </h1>
            <p className="text-slate-400 max-w-md">
              Detailed performance metrics and competitive class standings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/exams/online')}
              className="text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
            >
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              Back
            </Button>
            {isStudent && user.studentProfile && (
              <div className="flex items-center gap-2 p-1 pl-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-xs font-medium text-slate-400">Class {user.studentProfile.class.name}</span>
                <div className="h-4 w-px bg-white/10" />
                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border-none" {...({} as any)}>
                  Roll: {user.studentProfile.roll}
                </Badge>
              </div>
            )}
          </div>
        </header>

        {/* Filters - Advanced Glassmorphism */}
        {canViewAllResults && (
          <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative group/input">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" />
                  <Input
                    placeholder="Search students or exams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-white/5 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20 text-slate-200 placeholder:text-slate-500"
                  />
                </div>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="h-11 bg-white/5 border-white/10 focus:ring-indigo-500/20">
                    <SelectValue placeholder="Select Exam" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                    <SelectItem value="all">All Exams</SelectItem>
                    {examResults.map((result: ExamResults) => (
                      <SelectItem key={result.exam.id} value={result.exam.id}>
                        {result.exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="h-11 bg-white/5 border-white/10 focus:ring-indigo-500/20">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                    <SelectItem value="date">Date Published</SelectItem>
                    <SelectItem value="name">Exam Name</SelectItem>
                    <SelectItem value="class">Classroom</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="h-11 bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Area */}
        <div className="space-y-12">
          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 backdrop-blur-sm">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                <FileText className="w-16 h-16 text-slate-600 relative z-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-300">No outcomes found</h3>
              <p className="text-slate-500 mt-2">Check back later or adjust your filters.</p>
            </div>
          ) : (
            filteredResults.map((examResult: ExamResults) => {
              const myResult = isStudent ? examResult.results.find((r: Result) => r.student?.id === user.studentProfile?.id) : null;
              const classmatesResults = isStudent
                ? examResult.results.filter((r: Result) => r.student?.id !== user.studentProfile?.id)
                  .sort((a: Result, b: Result) => (b.total || 0) - (a.total || 0))
                : examResult.results;

              return (
                <div key={examResult.exam.id} className="space-y-6">
                  {/* Exam Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Trophy className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{examResult.exam.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(examResult.exam.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                          <span className="mx-1 opacity-30">|</span>
                          <span className="font-semibold text-slate-300">{examResult.exam.totalMarks} Total Marks</span>
                        </div>
                      </div>
                    </div>
                    {!isStudent && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-white/5"
                          onClick={() => downloadResultsSheet(examResult.exam.id, 'pdf')}
                        >
                          <Download className="w-4 h-4 mr-2" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-white/5"
                          onClick={() => downloadResultsSheet(examResult.exam.id, 'csv')}
                        >
                          <Download className="w-4 h-4 mr-2" /> CSV
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Desktop Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: Analytics & Personal Result */}
                    <div className="lg:col-span-4 space-y-6">
                      {isStudent && myResult ? (
                        <Card className="bg-indigo-600 border-none shadow-2xl shadow-indigo-500/20 overflow-hidden relative group">
                          {/* Decorative Rings */}
                          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

                          <CardHeader className="relative z-10 pb-2">
                            <CardTitle className="text-white flex items-center justify-between">
                              Your Standing
                              <Crown className="w-5 h-5 text-indigo-200" />
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="relative z-10 space-y-6">
                            <div className="flex items-end justify-between">
                              <div>
                                <div className="text-4xl font-black text-white">{myResult.total}</div>
                                <div className="text-sm text-indigo-200">Earned Points</div>
                              </div>
                              <div className="text-right">
                                <div className="text-4xl font-black text-white">#{myResult.rank || '--'}</div>
                                <div className="text-sm text-indigo-200">Class Rank</div>
                              </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-indigo-100">Grade: <span className="font-bold text-white">{myResult.grade}</span></span>
                                <span className="text-indigo-100">Accuracy: <span className="font-bold text-white">{myResult.percentage?.toFixed(1)}%</span></span>
                              </div>
                              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                  style={{ width: `${myResult.percentage}%` }}
                                />
                              </div>
                            </div>

                            <Button
                              onClick={() => router.push(`/exams/results/${examResult.exam.id}`)}
                              className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold transition-transform active:scale-95"
                            >
                              View Full Review <Eye className="w-4 h-4 ml-2" />
                            </Button>
                          </CardContent>
                        </Card>
                      ) : null}

                      {/* Performance Insights Card */}
                      <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl hidden md:block">
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-rose-400" /> Performance Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {myResult ? (
                            <>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-400">
                                  <span>Objective Accuracy</span>
                                  <span>{((myResult.mcqMarks / (examResult.mcqTotal || 1)) * 100).toFixed(0)}%</span>
                                </div>
                                <Progress value={(myResult.mcqMarks / (examResult.mcqTotal || 1)) * 100} className="h-1 bg-white/5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-400">
                                  <span>Creative Accuracy</span>
                                  <span>{((myResult.cqMarks / (examResult.cqTotal || 1)) * 100).toFixed(0)}%</span>
                                </div>
                                <Progress value={(myResult.cqMarks / (examResult.cqTotal || 1)) * 100} className="h-1 bg-white/5" />
                              </div>
                              <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-200 mt-4">
                                <Star className="w-4 h-4" />
                                <AlertDescription className="text-[11px]">
                                  {getPerformanceAnalysis(myResult).recommendation}
                                </AlertDescription>
                              </Alert>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                              <BarChart3 className="w-8 h-8 text-slate-700 mb-2" />
                              <p className="text-xs text-slate-500">Aggregate analytics for teacher review.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* RIGHT COLUMN: Leaderboard / Class Standing */}
                    <div className="lg:col-span-8">
                      <Card className="bg-white/[0.02] border-white/10 backdrop-blur-md overflow-hidden h-full">
                        <CardHeader className="border-b border-white/5 bg-white/[0.01]">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-slate-300 flex items-center gap-2">
                              <Users className="w-5 h-5 text-indigo-400" /> Class Standings
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] text-slate-500 border-white/10" {...({} as any)}>
                              Showcases {examResult.results.length} Students
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto overflow-y-auto max-h-[600px] no-scrollbar">
                            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                              <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                  <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                    <TableHead className="w-[60px] font-bold text-slate-900 dark:text-white">Rank</TableHead>
                                    <TableHead className="min-w-[150px] font-bold text-slate-900 dark:text-white">Student Name</TableHead>
                                    <TableHead className="text-center font-bold text-slate-900 dark:text-white">Objective</TableHead>
                                    <TableHead className="text-center font-bold text-slate-900 dark:text-white">CQ</TableHead>
                                    <TableHead className="text-center font-bold text-slate-900 dark:text-white">SQ</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900 dark:text-white">Total</TableHead>
                                    <TableHead className="text-right hidden md:table-cell font-bold text-slate-900 dark:text-white">%</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900 dark:text-white">Grade</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {classmatesResults.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                                        No classmates results found.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    classmatesResults.map((res: Result, idx: number) => {
                                      const isMe = isStudent && res.student.id === user.studentProfile?.id;
                                      const resRank = res.rank || (idx + 1);
                                      return (
                                        <TableRow
                                          key={res.id}
                                          className={`group border-slate-100 dark:border-slate-800/50 transition-colors ${isMe ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
                                            }`}
                                        >
                                          <TableCell className="font-medium">
                                            {getRankBadge(resRank)}
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex flex-col">
                                              <span className={`font-semibold ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                                {res.student.user.name}
                                              </span>
                                              <span className="text-[10px] text-slate-500">Roll: {res.student.roll}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <span className="text-sm font-medium">{res.mcqMarks}</span>
                                            <span className="text-[10px] text-slate-400 block">/ {examResult.mcqTotal}</span>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <span className="text-sm font-medium">{res.cqMarks}</span>
                                            <span className="text-[10px] text-slate-400 block">/ {examResult.cqTotal}</span>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <span className="text-sm font-medium">{res.sqMarks}</span>
                                            <span className="text-[10px] text-slate-400 block">/ {examResult.sqTotal}</span>
                                          </TableCell>
                                          <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                                            {res.total}
                                          </TableCell>
                                          <TableCell className="text-right hidden md:table-cell">
                                            <span className="text-[11px] text-slate-500">{res.percentage?.toFixed(1)}%</span>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Badge className={`border-none ${getGradeColor(res.grade)}`} {...({} as any)}>
                                              {res.grade}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
