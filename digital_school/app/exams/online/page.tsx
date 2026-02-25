"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import Link from "next/link";

interface Exam {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  subject?: string;
  type: string;
  classId?: string;
  isActive?: boolean;
  allowRetake?: boolean; // Added allowRetake to Exam interface
}

interface Result {
  examId: string;
  total: number;
  grade?: string;
  rank?: number;
  isPublished: boolean;
}

interface ExamSubmission {
  examId: string;
  studentId: string;
  submittedAt: string;
  score?: number;
  answers?: any;
  status?: 'IN_PROGRESS' | 'SUBMITTED';
}

const fetchUser = async () => {
  const res = await fetch("/api/user");
  return res.json();
};

const fetchExams = async () => {
  const res = await fetch("/api/exams");
  const result = await res.json();
  // Handle array, wrapped array, or wrapped object with exams property
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (result.data?.exams && Array.isArray(result.data.exams)) return result.data.exams;
  return [];
};

const fetchResults = async () => {
  try {
    const res = await fetch("/api/results");
    if (!res.ok) return { results: [] };
    const result = await res.json();

    // Handle various API response structures
    let data = [];
    if (Array.isArray(result)) data = result;
    else if (Array.isArray(result.results)) data = result.results;
    else if (Array.isArray(result.data)) data = result.data;
    else if (result.data?.results && Array.isArray(result.data.results)) data = result.data.results;

    return { results: data };
  } catch {
    return { results: [] };
  }
};

const fetchExamSubmissions = async () => {
  try {
    const res = await fetch("/api/exam-submissions");
    if (!res.ok) return { submissions: [] };
    const result = await res.json();

    // Handle various API response structures
    let data = [];
    if (Array.isArray(result)) data = result;
    else if (Array.isArray(result.submissions)) data = result.submissions;
    else if (Array.isArray(result.data)) data = result.data;
    else if (result.data?.submissions && Array.isArray(result.data.submissions)) data = result.data.submissions;

    return { submissions: data };
  } catch {
    return { submissions: [] };
  }
};

export default function OnlineExamsPage() {
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("online");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const userData = await fetchUser();
        setUser(userData.user);
        const examsData = await fetchExams();
        setExams(examsData);
        const resultsData = await fetchResults();
        setResults(resultsData.results || []);
        const submissionsData = await fetchExamSubmissions();
        setSubmissions(submissionsData.submissions || []);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const userClassId = user?.studentProfile?.class?.id;

  // --- Filtering Logic ---
  const filterExams = (examList: Exam[]) => {
    if (!userClassId) return []; // strict: only see if you have a class

    const now = new Date();
    // Reset time for strictly date-based comparison logic if needed, 
    // but users usually want "7 days from now" from current moment.
    // The requirement: "today, tomorrow, tomorrow+1 ... all previous ... cant see 7 days after"
    // "Tomorrow+1" = Today + 2 days.
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() + 3); // Allow T, T+1, T+2. T+3 is hidden.
    cutoffDate.setHours(0, 0, 0, 0);

    return examList.filter(exam => {
      // 0. Active Status Filter (Critical)
      if (!exam.isActive) return false;

      // 1. Class Filter - STRICT
      // If exam is assigned to a class, it must match user's class.
      // If exam is NOT assigned to a class (undefined/null), assume it's NOT for this student 
      // (or modify to assume global if that's the requirement, but user said "seeing all exams" is a bug).
      if (!exam.classId || exam.classId !== userClassId) return false;

      // 2. Date Filter - REMOVED
      // User requested to see all approved exams even if they are in the future ("don't hide these only say that exam not started")
      // const examDate = new Date(exam.date);
      // if (examDate >= cutoffDate) return false; 

      return true;
    });
  };

  const filteredExams = filterExams(exams);
  const onlineExams = filteredExams.filter(e => !e.type || e.type === "ONLINE");
  const mixedExams = filteredExams.filter(e => e.type === "MIXED");

  // Helper to determine exam status
  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    let start: Date, end: Date;

    if (exam.startTime && exam.endTime) {
      start = new Date(exam.startTime);
      end = new Date(exam.endTime);
    } else {
      const date = new Date(exam.date);
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    }

    if (now < start) return "upcoming";
    if (now > end) return "finished";
    return "active";
  };

  const getResult = (examId: string) => results.find((r) => r.examId === examId);
  const hasSubmitted = (examId: string) => {
    const submittedSubmission = submissions.some((s) => s.examId === examId && s.studentId === user?.studentProfile?.id && s.status === 'SUBMITTED');
    const resultExists = results.some((r) => r.examId === examId);
    return submittedSubmission || resultExists;
  };
  const hasInProgress = (examId: string) => submissions.some((s) =>
    s.examId === examId &&
    s.studentId === user?.studentProfile?.id &&
    s.status === 'IN_PROGRESS'
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100">
      {/* Decorative header background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-b-[3rem] shadow-xl z-0" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Online Exams</h1>
            <p className="text-blue-100 opacity-90 font-medium">{user?.studentProfile?.class?.name ? `Class: ${user.studentProfile.class.name}` : "Student Portal"}</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="secondary" className="shadow-lg hover:shadow-xl transition-all">
              <Link href="/student/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-lg hover:shadow-xl transition-all backdrop-blur-md">
              <Link href="/exams/results">Results</Link>
            </Button>
            <DarkModeToggle />
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-3xl overflow-hidden">
          <div className="p-2 sm:p-6">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl h-14">
                <TabsTrigger value="online" className="rounded-xl h-12 text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all">
                  Online Exams ({onlineExams.length})
                </TabsTrigger>
                <TabsTrigger value="mixed" className="rounded-xl h-12 text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all">
                  Mixed Mode ({mixedExams.length})
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="online" className="mt-0">
                    <ExamGrid
                      exams={onlineExams}
                      getExamStatus={getExamStatus}
                      getResult={getResult}
                      hasSubmitted={hasSubmitted}
                      hasInProgress={hasInProgress}
                      loading={loading}
                    />
                  </TabsContent>
                  <TabsContent value="mixed" className="mt-0">
                    <ExamGrid
                      exams={mixedExams}
                      getExamStatus={getExamStatus}
                      getResult={getResult}
                      hasSubmitted={hasSubmitted}
                      hasInProgress={hasInProgress}
                      loading={loading}
                    />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </Card>
      </div>
    </main>
  );
}

function ExamGrid({ exams, getExamStatus, getResult, hasSubmitted, hasInProgress, loading }: any) {
  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />)}
    </div>
  );

  if (exams.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <span className="text-4xl">🎉</span>
      </div>
      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No exams found</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">You're all caught up! No exams scheduled for next few days.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {exams.map((exam: any) => {
          const status = getExamStatus(exam);
          const submitted = hasSubmitted(exam.id);
          const inProgress = hasInProgress(exam.id);
          const result = getResult(exam.id);

          let statusColor = "bg-slate-100 text-slate-700";
          if (status === "active") statusColor = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
          if (status === "upcoming") statusColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
          if (status === "finished") statusColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";

          return (
            <motion.div
              layout
              key={exam.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className={`h-2 w-full ${status === 'active' ? 'bg-indigo-500' : status === 'upcoming' ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="secondary" className={`${statusColor} border-none px-3 py-1 font-semibold capitalize`}>
                      {status === 'active' ? 'Live Now' : status}
                    </Badge>
                    {submitted && <Badge className="bg-green-500 text-white border-none">Completed</Badge>}
                    {inProgress && !submitted && <Badge className="bg-amber-500 text-white border-none">Resuming...</Badge>}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {exam.name}
                  </h3>

                  <div className="space-y-3 mt-4 text-sm text-slate-600 dark:text-slate-400 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs">📚</span>
                      {exam.subject || "General"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs">📅</span>
                      {new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    {status === 'upcoming' && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                        <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-xs">⏰</span>
                        Starts {new Date(exam.startTime || exam.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {status === 'active' && (
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs">⚡</span>
                        Ending {new Date(exam.endTime || exam.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    {submitted ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <div className="text-xs text-slate-500">Score</div>
                            <div className="font-bold text-slate-900 dark:text-white">{result?.total ?? '-'}</div>
                          </div>
                          <Button asChild variant="outline" className="h-full rounded-xl border-slate-200">
                            <a href={`/exams/results/${exam.id}`}>View Result</a>
                          </Button>
                        </div>
                        {status === 'finished' && (
                          <Button asChild className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg h-11 text-base font-semibold">
                            <a href={`/exams/practice/${exam.id}`}>Take Practice Session</a>
                          </Button>
                        )}
                        {exam.allowRetake && status === 'active' && (
                          <Button asChild className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-lg h-11 text-base font-semibold">
                            <a href={`/exams/online/${exam.id}?action=start`}>🔄 Retake Exam</a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      // Allow starting/resuming if:
                      // 1. Exam is currently active, OR
                      // 2. Student has IN_PROGRESS submission and exam hasn't finished
                      (status === 'active' || inProgress) && status !== 'finished' ? (
                        <Button asChild className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none h-11 text-base font-semibold">
                          <a href={`/exams/online/${exam.id}`}>{inProgress ? '▶️ Resume Exam' : 'Start Exam'}</a>
                        </Button>
                      ) : status === 'upcoming' ? (
                        <Button disabled className="w-full rounded-xl opacity-50 bg-slate-100 text-slate-400 dark:bg-slate-800 h-11">
                          Not Started
                        </Button>
                      ) : (
                        <Button asChild className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none h-11 text-base font-semibold">
                          <a href={`/exams/practice/${exam.id}`}>Take Practice Session</a>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}



function ResultCard({ result }: { result: Result }) {
  return (
    <Card className="glass border-green-400">
      <CardHeader>
        <CardTitle>ফলাফল</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span>মোট নম্বর: <b>{result.total}</b></span>
          <span>গ্রেড: <b>{result.grade || "N/A"}</b></span>
          <span>র‍্যাঙ্ক: <b>{result.rank || "N/A"}</b></span>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col gap-2 w-full">
          <Badge variant="outline">{result.isPublished ? "প্রকাশিত" : "অপ্রকাশিত"}</Badge>
          {result.isPublished && (
            <Button asChild variant="outline" size="sm">
              <a href={`/exams/results/${result.examId}`}>বিস্তারিত দেখুন</a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}