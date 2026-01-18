"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PuterFileUpload } from "@/components/ui/puter-file-upload";
import {
    BookOpen,
    FileText,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Plus,
    Search,
    Filter,
    Upload,
    Camera,
    CheckCircle,
    Clock,
    AlertCircle,
    Star,
    Brain,
    Calculator,
    Image,
    FileCheck,
    Bell,
    Calendar,
    TrendingUp,
    Award,
    Zap,
    Eye,
    Edit,
    Trash2,
    Download,
    Upload as UploadIcon,
    Scan,
    CheckSquare,
    XSquare,
    MinusSquare,
    PlusSquare,
    FileSpreadsheet,
    Printer,
    QrCode,
    Smartphone,
    Laptop,
    Globe,
    Wifi,
    WifiOff
} from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    role: 'TEACHER';
    teacherProfile?: {
        id: string;
        employeeId: string;
        department: string;
        subjects: string[];
    };
}

interface Evaluation {
    id: string;
    examName: string;
    studentName: string;
    subject: string;
    totalMarks: number;
    obtainedMarks: number;
    status: 'pending' | 'evaluated' | 'ai_evaluated';
    submittedAt: string;
    evaluationType: 'manual' | 'ai';
}

interface Question {
    id: string;
    type: 'MCQ' | 'CQ';
    subject: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    question: string;
    options?: string[];
    correctAnswer?: string;
    marks: number;
    hasImage: boolean;
    hasMath: boolean;
    createdAt: string;
}

interface Exam {
    id: string;
    name: string;
    subject: string;
    class: string;
    totalMarks: number;
    duration: number;
    status: 'draft' | 'published' | 'ongoing' | 'completed';
    startDate: string;
    endDate: string;
    totalStudents: number;
    submittedCount: number;
}

interface Attendance {
    id: string;
    date: string;
    class: string;
    subject: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    mode: 'online' | 'offline';
}

export default function TeacherDashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSubject, setFilterSubject] = useState('all');
    const [aiUsageCount, setAiUsageCount] = useState(0);
    const [evaluationSpeed, setEvaluationSpeed] = useState(0);
    const router = useRouter();

    useEffect(() => {
        // Fetch current user data
        fetch('/api/user')
            .then(res => res.json())
            .then(data => {
                if (data.user && data.user.role === 'TEACHER') {
                    setUser(data.user);
                } else if (data.user) {
                    // Redirect to appropriate dashboard based on role
                    const userRole = data.user.role;
                    let redirectUrl = '/dashboard';

                    switch (userRole) {
                        case 'SUPER_USER':
                            redirectUrl = '/super-user/dashboard';
                            break;
                        case 'ADMIN':
                            redirectUrl = '/admin/dashboard';
                            break;
                        case 'STUDENT':
                            redirectUrl = '/student/dashboard';
                            break;
                        default:
                            redirectUrl = '/dashboard';
                    }

                    router.push(redirectUrl);
                } else {
                    router.push('/login');
                }
            })
            .catch(() => {
                router.push('/login');
            })
            .finally(() => {
                setLoading(false);
            });

        // Load mock data
        loadMockData();
    }, [router]);

    const loadMockData = () => {
        // Mock evaluations
        setEvaluations([
            {
                id: '1',
                examName: 'Mid Term Physics',
                studentName: 'Ahmed Khan',
                subject: 'Physics',
                totalMarks: 50,
                obtainedMarks: 0,
                status: 'pending',
                submittedAt: '2025-06-28T10:30:00Z',
                evaluationType: 'manual'
            },
            {
                id: '2',
                examName: 'Mid Term Physics',
                studentName: 'Fatima Ali',
                subject: 'Physics',
                totalMarks: 50,
                obtainedMarks: 42,
                status: 'ai_evaluated',
                submittedAt: '2025-06-28T09:15:00Z',
                evaluationType: 'ai'
            }
        ]);

        // Mock questions
        setQuestions([
            {
                id: '1',
                type: 'MCQ',
                subject: 'Physics',
                topic: 'Mechanics',
                difficulty: 'medium',
                question: 'What is the SI unit of force?',
                options: ['Newton', 'Joule', 'Watt', 'Pascal'],
                correctAnswer: 'Newton',
                marks: 1,
                hasImage: false,
                hasMath: false,
                createdAt: '2025-06-28T08:00:00Z'
            },
            {
                id: '2',
                type: 'CQ',
                subject: 'Physics',
                topic: 'Mechanics',
                difficulty: 'hard',
                question: 'A car accelerates from rest to 20 m/s in 5 seconds. Calculate the acceleration.',
                marks: 5,
                hasImage: false,
                hasMath: true,
                createdAt: '2025-06-28T07:30:00Z'
            }
        ]);

        // Mock exams
        setExams([
            {
                id: '1',
                name: 'Mid Term Physics',
                subject: 'Physics',
                class: 'Class 11',
                totalMarks: 50,
                duration: 90,
                status: 'ongoing',
                startDate: '2025-06-28T09:00:00Z',
                endDate: '2025-06-28T10:30:00Z',
                totalStudents: 25,
                submittedCount: 18
            }
        ]);

        // Mock attendance
        setAttendance([
            {
                id: '1',
                date: '2025-06-28',
                class: 'Class 11',
                subject: 'Physics',
                totalStudents: 25,
                presentCount: 22,
                absentCount: 2,
                lateCount: 1,
                mode: 'online'
            }
        ]);

        // Mock stats
        setAiUsageCount(15);
        setEvaluationSpeed(85);
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500';
            case 'evaluated':
                return 'bg-green-500';
            case 'ai_evaluated':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'hard':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getExamStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-500';
            case 'published':
                return 'bg-blue-500';
            case 'ongoing':
                return 'bg-green-500';
            case 'completed':
                return 'bg-purple-500';
            default:
                return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Teacher Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-white">
                <div className="flex justify-between items-center px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <img src="/logo.png" alt="Digital School" className="h-8 w-auto" />
                                <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                            </div>
                            <p className="text-muted-foreground">
                                Welcome back, {user.name} • {user.teacherProfile?.department}
                            </p>
                        </div>
                        <Badge className="bg-blue-500 text-white">
                            <BookOpen className="h-4 w-4 mr-1" />
                            TEACHER
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            AI Usage: {aiUsageCount}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Speed: {evaluationSpeed}%
                        </Badge>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-white border-r min-h-screen p-4">
                    <nav className="space-y-2">
                        <Button
                            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Dashboard
                        </Button>
                        <Button
                            variant={activeTab === 'create-questions' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => router.push('/create-question')}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Questions
                        </Button>
                        <Button
                            variant={activeTab === 'question-bank' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => router.push('/question-bank')}
                        >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Question Bank
                        </Button>
                        <Button
                            variant={activeTab === 'ai-generator' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => router.push('/teacher/ai-generator')}
                        >
                            <Brain className="h-4 w-4 mr-2" />
                            AI Generator
                        </Button>
                        <Button
                            variant={activeTab === 'create-exams' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('create-exams')}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Exams
                        </Button>
                        <Button
                            variant={activeTab === 'evaluate-cq' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('evaluate-cq')}
                        >
                            <FileCheck className="h-4 w-4 mr-2" />
                            Evaluate CQ
                        </Button>
                        <Button
                            variant={activeTab === 'scan-sheets' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('scan-sheets')}
                        >
                            <Scan className="h-4 w-4 mr-2" />
                            Scan OMR & CQ
                        </Button>
                        <Button
                            variant={activeTab === 'attendance' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('attendance')}
                        >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Take Attendance
                        </Button>
                        <Button
                            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('analytics')}
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Class Analytics
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => router.push('/exams/results')}
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Exam Results
                        </Button>
                        <Button
                            variant={activeTab === 'notices' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('notices')}
                        >
                            <Bell className="h-4 w-4 mr-2" />
                            Post Notices
                        </Button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {evaluations.filter(e => e.status === 'pending').length}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Need your attention
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">AI Evaluations</CardTitle>
                                        <Brain className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {evaluations.filter(e => e.status === 'ai_evaluated').length}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            AI-assisted grading
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{questions.length}</div>
                                        <p className="text-xs text-muted-foreground">
                                            In your question bank
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Evaluations</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {evaluations.slice(0, 5).map((evaluation) => (
                                                <div key={evaluation.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="font-medium">{evaluation.studentName}</p>
                                                        <p className="text-sm text-muted-foreground">{evaluation.examName}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={getStatusColor(evaluation.status)}>
                                                            {evaluation.status.replace('_', ' ')}
                                                        </Badge>
                                                        {evaluation.evaluationType === 'ai' && (
                                                            <Brain className="h-4 w-4 text-blue-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Active Exams</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {exams.filter(e => e.status === 'ongoing').map((exam) => (
                                                <div key={exam.id} className="p-3 border rounded-lg">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-medium">{exam.name}</p>
                                                            <p className="text-sm text-muted-foreground">{exam.class}</p>
                                                        </div>
                                                        <Badge className={getExamStatusColor(exam.status)}>
                                                            {exam.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Submitted: {exam.submittedCount}/{exam.totalStudents}</span>
                                                        <span>{exam.totalMarks} marks</span>
                                                    </div>
                                                    <Progress
                                                        value={(exam.submittedCount / exam.totalStudents) * 100}
                                                        className="mt-2"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'create-questions' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Create Questions</h2>
                                <Button onClick={() => router.push('/teacher/create-question')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Question
                                </Button>
                            </div>

                            <Tabs defaultValue="mcq" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="mcq">MCQ Question</TabsTrigger>
                                    <TabsTrigger value="cq">CQ Question</TabsTrigger>
                                </TabsList>
                                <TabsContent value="mcq" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Multiple Choice Question</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="subject">Subject</Label>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select subject" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="physics">Physics</SelectItem>
                                                            <SelectItem value="chemistry">Chemistry</SelectItem>
                                                            <SelectItem value="mathematics">Mathematics</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="difficulty">Difficulty</Label>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select difficulty" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="easy">Easy</SelectItem>
                                                            <SelectItem value="medium">Medium</SelectItem>
                                                            <SelectItem value="hard">Hard</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="question">Question</Label>
                                                <Input placeholder="Enter your question..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Options</Label>
                                                    <div className="space-y-2">
                                                        <Input placeholder="Option A" />
                                                        <Input placeholder="Option B" />
                                                        <Input placeholder="Option C" />
                                                        <Input placeholder="Option D" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="correct-answer">Correct Answer</Label>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select correct answer" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="a">A</SelectItem>
                                                            <SelectItem value="b">B</SelectItem>
                                                            <SelectItem value="c">C</SelectItem>
                                                            <SelectItem value="d">D</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <Button variant="outline">
                                                    <Image className="h-4 w-4 mr-2" />
                                                    Add Image
                                                </Button>
                                                <Button variant="outline">
                                                    <Calculator className="h-4 w-4 mr-2" />
                                                    Add Math
                                                </Button>
                                            </div>
                                            <Button className="w-full">Create MCQ Question</Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="cq" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Creative Question</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="subject">Subject</Label>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select subject" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="physics">Physics</SelectItem>
                                                            <SelectItem value="chemistry">Chemistry</SelectItem>
                                                            <SelectItem value="mathematics">Mathematics</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="marks">Marks</Label>
                                                    <Input type="number" placeholder="Enter marks" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="question">Question</Label>
                                                <Input placeholder="Enter your question..." />
                                            </div>
                                            <div className="flex gap-4">
                                                <Button variant="outline">
                                                    <Image className="h-4 w-4 mr-2" />
                                                    Add Image
                                                </Button>
                                                <Button variant="outline">
                                                    <Calculator className="h-4 w-4 mr-2" />
                                                    Add Math
                                                </Button>
                                            </div>
                                            <Button className="w-full">Create CQ Question</Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {activeTab === 'question-bank' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Question Bank</h2>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search questions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-64"
                                    />
                                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="physics">Physics</SelectItem>
                                            <SelectItem value="chemistry">Chemistry</SelectItem>
                                            <SelectItem value="mathematics">Mathematics</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/teacher/create-question')}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Plus className="w-5 h-5" />
                                            Create Question
                                        </CardTitle>
                                        <CardDescription>
                                            Create new questions with rich text, math, and image support
                                        </CardDescription>
                                    </CardHeader>
                                </Card>

                                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/teacher/question-bank')}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" />
                                            Question Bank
                                        </CardTitle>
                                        <CardDescription>
                                            Manage and organize your question collection with advanced filtering
                                        </CardDescription>
                                    </CardHeader>
                                </Card>

                                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/teacher/ai-generator')}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Brain className="w-5 h-5" />
                                            AI Generator
                                        </CardTitle>
                                        <CardDescription>
                                            Generate questions using AI with Gemini Flash 1.5
                                        </CardDescription>
                                    </CardHeader>
                                </Card>

                                {questions.map((question) => (
                                    <Card key={question.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{question.type}</CardTitle>
                                                    <CardDescription>{question.subject} • {question.topic}</CardDescription>
                                                </div>
                                                <Badge className={getDifficultyColor(question.difficulty)}>
                                                    {question.difficulty}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm mb-4 line-clamp-3">{question.question}</p>
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-2">
                                                    {question.hasImage && <Image className="h-4 w-4 text-blue-500" />}
                                                    {question.hasMath && <Calculator className="h-4 w-4 text-green-500" />}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'evaluate-cq' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Evaluate CQ Papers</h2>
                                <div className="flex gap-2">
                                    <Button variant="outline">
                                        <Brain className="h-4 w-4 mr-2" />
                                        AI Evaluation
                                    </Button>
                                    <Button variant="outline">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Bulk Upload
                                    </Button>
                                </div>
                            </div>

                            <Tabs defaultValue="pending" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="pending">Pending ({evaluations.filter(e => e.status === 'pending').length})</TabsTrigger>
                                    <TabsTrigger value="evaluated">Evaluated ({evaluations.filter(e => e.status === 'evaluated').length})</TabsTrigger>
                                    <TabsTrigger value="ai">AI Evaluated ({evaluations.filter(e => e.status === 'ai_evaluated').length})</TabsTrigger>
                                </TabsList>
                                <TabsContent value="pending" className="space-y-4">
                                    {evaluations.filter(e => e.status === 'pending').map((evaluation) => (
                                        <Card key={evaluation.id}>
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle>{evaluation.studentName}</CardTitle>
                                                        <CardDescription>{evaluation.examName} • {evaluation.subject}</CardDescription>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm">
                                                            <Brain className="h-4 w-4 mr-2" />
                                                            AI Evaluate
                                                        </Button>
                                                        <Button size="sm" variant="outline">
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Manual
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Question 1 (5 marks)</Label>
                                                        <div className="mt-2 p-3 border rounded bg-gray-50">
                                                            <p className="text-sm">Student's answer will appear here...</p>
                                                        </div>
                                                        <div className="mt-2 flex gap-2">
                                                            <Input type="number" placeholder="Marks" className="w-20" />
                                                            <Button size="sm">Save</Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label>Question 2 (5 marks)</Label>
                                                        <div className="mt-2 p-3 border rounded bg-gray-50">
                                                            <p className="text-sm">Student's answer will appear here...</p>
                                                        </div>
                                                        <div className="mt-2 flex gap-2">
                                                            <Input type="number" placeholder="Marks" className="w-20" />
                                                            <Button size="sm">Save</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {activeTab === 'scan-sheets' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Scan OMR & CQ Sheets</h2>
                                <div className="flex gap-2">
                                    <Button variant="outline">
                                        <Camera className="h-4 w-4 mr-2" />
                                        Webcam
                                    </Button>
                                    <Button variant="outline">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Files
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>OMR Scanner</CardTitle>
                                        <CardDescription>Scan multiple choice answer sheets</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                            <p className="text-lg font-medium mb-2">Drop OMR sheets here</p>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                or click to browse files
                                            </p>
                                            <Link href="/omr_scanner">
                                                <Button>Open OMR Scanner</Button>
                                            </Link>
                                        </div>
                                        <div className="mt-4">
                                            <h4 className="font-medium mb-2">Recent Scans</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                    <span className="text-sm">OMR_Class11_Physics_001.pdf</span>
                                                    <Badge className="bg-green-500">Processed</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>CQ Scanner</CardTitle>
                                        <CardDescription>Scan creative question answer sheets</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <PuterFileUpload
                                            title="Upload CQ Sheets"
                                            description="Upload creative question answer sheets for evaluation"
                                            storageType="cloud"
                                            multiple={true}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            maxSize={50 * 1024 * 1024} // 50MB
                                            showFileList={false}
                                            className="border-0 p-0"
                                        />
                                        <div className="mt-4">
                                            <h4 className="font-medium mb-2">Recent Scans</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                    <span className="text-sm">CQ_Class11_Physics_001.pdf</span>
                                                    <Badge className="bg-yellow-500">Pending</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Take Attendance</h2>
                                <div className="flex gap-2">
                                    <Button variant="outline">
                                        <Globe className="h-4 w-4 mr-2" />
                                        Online Mode
                                    </Button>
                                    <Button variant="outline">
                                        <WifiOff className="h-4 w-4 mr-2" />
                                        Offline Mode
                                    </Button>
                                    <Button variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Today's Attendance</CardTitle>
                                        <CardDescription>Class 11 • Physics</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 border rounded">
                                                    <div>
                                                        <p className="font-medium">Student {i + 1}</p>
                                                        <p className="text-sm text-muted-foreground">Roll: {1001 + i}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                                            <CheckSquare className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                                            <XSquare className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                                            <MinusSquare className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex justify-between items-center">
                                            <div className="text-sm">
                                                <span className="text-green-600">Present: 3</span> •
                                                <span className="text-red-600"> Absent: 1</span> •
                                                <span className="text-yellow-600"> Late: 1</span>
                                            </div>
                                            <Button>Save Attendance</Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Attendance History</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {attendance.map((record) => (
                                                <div key={record.id} className="flex justify-between items-center p-3 border rounded">
                                                    <div>
                                                        <p className="font-medium">{record.date}</p>
                                                        <p className="text-sm text-muted-foreground">{record.class} • {record.subject}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm">{record.presentCount}/{record.totalStudents}</p>
                                                        <Badge variant="outline" className="text-xs">
                                                            {record.mode}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Class Analytics</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Performance Overview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Class Average</span>
                                                    <span>75%</span>
                                                </div>
                                                <Progress value={75} />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Pass Rate</span>
                                                    <span>92%</span>
                                                </div>
                                                <Progress value={92} />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Attendance</span>
                                                    <span>88%</span>
                                                </div>
                                                <Progress value={88} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Activity</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <div>
                                                    <p className="text-sm font-medium">Exam completed</p>
                                                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <div>
                                                    <p className="text-sm font-medium">AI evaluation used</p>
                                                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                <div>
                                                    <p className="text-sm font-medium">Question created</p>
                                                    <p className="text-xs text-muted-foreground">1 day ago</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Badges Earned</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Award className="h-5 w-5 text-yellow-500" />
                                                <div>
                                                    <p className="text-sm font-medium">Fast Evaluator</p>
                                                    <p className="text-xs text-muted-foreground">Complete 50 evaluations</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Brain className="h-5 w-5 text-blue-500" />
                                                <div>
                                                    <p className="text-sm font-medium">AI Pioneer</p>
                                                    <p className="text-xs text-muted-foreground">Use AI evaluation 10 times</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 opacity-50">
                                                <Star className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium">Question Master</p>
                                                    <p className="text-xs text-muted-foreground">Create 100 questions</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notices' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Post Notices</h2>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Notice
                                </Button>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Create Notice</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">Title</Label>
                                        <Input placeholder="Enter notice title..." />
                                    </div>
                                    <div>
                                        <Label htmlFor="content">Content</Label>
                                        <Input placeholder="Enter notice content..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="class">Class</Label>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="class11">Class 11</SelectItem>
                                                    <SelectItem value="class12">Class 12</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="priority">Priority</Label>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button className="w-full">Post Notice</Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
