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
      filtered = filtered.filter(result => result.exam?.id === selectedExam);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.exam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.exam?.class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.results?.some(r =>
          r.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.student?.roll?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort results
    filtered.sort((a, b) => {
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
      setDownloading(prev => new Set(prev).add(downloadKey));
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
      setDownloading(prev => {
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

    if (rank === 1) return <Badge className="bg-yellow-100 text-yellow-800"><Trophy className="w-3 h-3 mr-1" />1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-100 text-gray-800"><Award className="w-3 h-3 mr-1" />2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-100 text-orange-800"><Award className="w-3 h-3 mr-1" />3rd</Badge>;
    return <Badge variant="outline">{rank}</Badge>;
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
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(examId)) {
        newSet.delete(examId);
      } else {
        newSet.add(examId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Error: {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => {
                setError(null);
                fetchUserAndResults();
              }}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Please log in to view results.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isStudent = user.role === 'STUDENT';
  const canViewAllResults = ['SUPER_USER', 'ADMIN', 'TEACHER'].includes(user.role);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
          <p className="text-muted-foreground">
            {isStudent
              ? 'View your exam results and performance analysis'
              : 'Manage and view all exam results'
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/exams/online')}
            className="mr-2 gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Online Exams
          </Button>

          {isStudent && (
            <>
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                {user.studentProfile?.class.name} {user.studentProfile?.class.section}
              </Badge>
              <Badge variant="outline">
                <FileText className="w-3 h-3 mr-1" />
                Roll: {user.studentProfile?.roll}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Filters and Search - Only for non-students */}
      {canViewAllResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams, classes, or students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {examResults.map((result) => (
                    <SelectItem key={result.exam.id} value={result.exam.id}>
                      {result.exam.name} - {result.exam.class.name} {result.exam.class.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'class') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Exam Name</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'} Sort Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {isStudent ? (
        // Student View - Individual Results with Detailed Analysis
        <div className="space-y-6">
          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">No results available yet.</p>
                  <p className="text-sm text-muted-foreground">Your results will appear here once they are published.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredResults.map((examResult) => {
              const studentResult = examResult.results?.[0];
              if (!studentResult) return null;

              const performanceAnalysis = getPerformanceAnalysis(studentResult);
              const isExpanded = expandedResults.has(examResult.exam.id);

              return (
                <Card key={examResult.exam?.id || 'unknown'} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {examResult.exam?.name || 'Unknown Exam'}
                        </CardTitle>
                        <CardDescription>
                          {examResult.exam?.class?.name || 'Unknown Class'} {examResult.exam?.class?.section || ''} •
                          {examResult.exam?.date ? new Date(examResult.exam.date).toLocaleDateString() : 'No Date'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={studentResult.isPublished ? "default" : "secondary"}>
                          {studentResult.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandedResult(examResult.exam.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Summary Cards */}
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {studentResult.total || 0}
                        </div>
                        <div className="text-sm text-blue-600">Your Score</div>
                        <div className="text-xs text-muted-foreground">
                          out of {examResult.exam?.totalMarks || 0}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {studentResult.percentage?.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-green-600">Percentage</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {studentResult.grade || 'N/A'}
                        </div>
                        <div className="text-sm text-purple-600">Grade</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {studentResult.rank || 'N/A'}
                        </div>
                        <div className="text-sm text-orange-600">Rank</div>
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Detailed Breakdown
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-muted-foreground">MCQ Marks</div>
                          <div className="text-xl font-semibold">
                            {studentResult.mcqMarks || 0}
                          </div>
                          <Progress
                            value={((studentResult.mcqMarks || 0) / (examResult.exam?.totalMarks || 1) * 100)}
                            className="mt-2"
                          />
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-muted-foreground">CQ Marks</div>
                          <div className="text-xl font-semibold">{studentResult.cqMarks || 0}</div>
                          <Progress
                            value={((studentResult.cqMarks || 0) / (examResult.exam?.totalMarks || 1) * 100)}
                            className="mt-2"
                          />
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-muted-foreground">SQ Marks</div>
                          <div className="text-xl font-semibold">{studentResult.sqMarks || 0}</div>
                          <Progress
                            value={((studentResult.sqMarks || 0) / (examResult.exam?.totalMarks || 1) * 100)}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detailed Analysis */}
                    {isExpanded && (
                      <div className="mt-6 space-y-6">
                        <Separator />

                        {/* Performance Analysis */}
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Performance Analysis
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {performanceAnalysis.strength && (
                              <div className="p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-green-800">Strengths</span>
                                </div>
                                <p className="text-sm text-green-700">{performanceAnalysis.strength}</p>
                              </div>
                            )}
                            {performanceAnalysis.weakness && (
                              <div className="p-4 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="font-medium text-red-800">Areas for Improvement</span>
                                </div>
                                <p className="text-sm text-red-700">{performanceAnalysis.weakness}</p>
                              </div>
                            )}
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-800">Recommendation</span>
                              </div>
                              <p className="text-sm text-blue-700">{performanceAnalysis.recommendation}</p>
                            </div>
                          </div>
                        </div>

                        {/* Class Performance Comparison */}
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Class Performance
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="text-lg font-semibold">{examResult.averageScore?.toFixed(1) || 0}</div>
                              <div className="text-sm text-muted-foreground">Class Average</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                              <div className="text-lg font-semibold">{examResult.highestScore || 0}</div>
                              <div className="text-sm text-muted-foreground">Highest Score</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-lg font-semibold">{examResult.passRate?.toFixed(1) || 0}%</div>
                              <div className="text-sm text-muted-foreground">Pass Rate</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <div className="text-lg font-semibold">{examResult.totalStudents || 0}</div>
                              <div className="text-sm text-muted-foreground">Total Students</div>
                            </div>
                          </div>
                        </div>

                        {/* Action Items */}
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Next Steps
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button variant="outline" className="w-full">
                              <Eye className="w-4 h-4 mr-2" />
                              View Detailed Answers
                            </Button>
                            <Button variant="outline" className="w-full">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Request Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        // Admin/Teacher View - All Results
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Exams</p>
                      <p className="text-2xl font-bold">{filteredResults.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">
                        {filteredResults.reduce((sum, result) => sum + (result.totalStudents || 0), 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg. Pass Rate</p>
                      <p className="text-2xl font-bold">
                        {filteredResults.length > 0
                          ? (filteredResults.reduce((sum, result) => sum + (result.passRate || 0), 0) / filteredResults.length).toFixed(1)
                          : 0
                        }%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg. Score</p>
                      <p className="text-2xl font-bold">
                        {filteredResults.length > 0
                          ? (filteredResults.reduce((sum, result) => sum + (result.averageScore || 0), 0) / filteredResults.length).toFixed(1)
                          : 0
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exam Results Summary */}
            <div className="space-y-4">
              {filteredResults.map((examResult) => (
                <Card key={examResult.exam?.id || 'unknown'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {examResult.exam?.name || 'Unknown Exam'}
                        </CardTitle>
                        <CardDescription>
                          {examResult.exam?.class?.name || 'Unknown Class'} {examResult.exam?.class?.section || ''} •
                          {examResult.exam?.date ? new Date(examResult.exam.date).toLocaleDateString() : 'No Date'} •
                          {examResult.totalStudents || 0} students
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadResultsSheet(examResult.exam.id, 'pdf')}
                          disabled={downloading.has(`${examResult.exam.id}-pdf`)}
                        >
                          {downloading.has(`${examResult.exam.id}-pdf`) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadResultsSheet(examResult.exam.id, 'csv')}
                          disabled={downloading.has(`${examResult.exam.id}-csv`)}
                        >
                          {downloading.has(`${examResult.exam.id}-csv`) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          CSV
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{examResult.averageScore.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Average Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{examResult.highestScore}</div>
                        <div className="text-sm text-muted-foreground">Highest Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{examResult.lowestScore}</div>
                        <div className="text-sm text-muted-foreground">Lowest Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{examResult.passRate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Pass Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            {filteredResults.map((examResult) => (
              <Card key={examResult.exam.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{examResult.exam.name}</CardTitle>
                      <CardDescription>
                        {examResult.exam.class.name} {examResult.exam.class.section} •
                        {new Date(examResult.exam.date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => downloadResultsSheet(examResult.exam.id, 'pdf')}
                        disabled={downloading.has(`${examResult.exam.id}-pdf`)}
                      >
                        {downloading.has(`${examResult.exam.id}-pdf`) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadResultsSheet(examResult.exam.id, 'csv')}
                        disabled={downloading.has(`${examResult.exam.id}-csv`)}
                      >
                        {downloading.has(`${examResult.exam.id}-csv`) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Roll</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>MCQ</TableHead>
                        <TableHead>CQ</TableHead>
                        <TableHead>SQ</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examResult.results?.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>
                            {getRankBadge(result.rank)}
                          </TableCell>
                          <TableCell className="font-medium">{result.student?.roll || 'N/A'}</TableCell>
                          <TableCell>{result.student?.user?.name || 'Unknown'}</TableCell>
                          <TableCell>{result.mcqMarks || 0}</TableCell>
                          <TableCell>{result.cqMarks || 0}</TableCell>
                          <TableCell>{result.sqMarks || 0}</TableCell>
                          <TableCell className="font-semibold">{result.total || 0}</TableCell>
                          <TableCell>{result.percentage?.toFixed(1) || 0}%</TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(result.grade)}>
                              {result.grade || 'N/A'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )) || (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground">
                              No results available
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
