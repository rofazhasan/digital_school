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
}

const fetchUser = async () => {
  const res = await fetch("/api/user");
  return res.json();
};

const fetchExams = async () => {
  const res = await fetch("/api/exams");
  const result = await res.json();
  // Handle both array and object with data property
  return Array.isArray(result) ? result : result.data || [];
};

const fetchResults = async () => {
  try {
    const res = await fetch("/api/results");
    if (!res.ok) return { results: [] };
    const result = await res.json();
    // Handle the API response structure
    const data = result.results || result.data || [];
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
    // Handle the API response structure
    const data = result.submissions || result.data || [];
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
  const [showAllExams, setShowAllExams] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const userData = await fetchUser();
      setUser(userData.user);
      const examsData = await fetchExams();
      console.log('📊 All exams fetched:', examsData);
      setExams(examsData);
      const resultsData = await fetchResults();
      console.log('📊 Results data:', resultsData);
      setResults(resultsData.results || []);
      const submissionsData = await fetchExamSubmissions();
      console.log('📊 Submissions data:', submissionsData);
      setSubmissions(submissionsData.submissions || []);
      setLoading(false);
    })();
  }, []);

  // Helper to get result for an exam
  const getResult = (examId: string) => results.find((r) => r.examId === examId);

  // Helper to check if user has submitted an exam (finished)
  const hasSubmitted = (examId: string) => {
    if (!user?.studentProfile?.id) return false;
    return submissions.some((s) => s.examId === examId && s.studentId === user.studentProfile.id && (s.answers as any)?._status !== 'in_progress');
  };

  // Helper to check if user has an in-progress exam
  const hasInProgress = (examId: string) => {
    if (!user?.studentProfile?.id) return false;
    return submissions.some((s) => s.examId === examId && s.studentId === user.studentProfile.id && (s.answers as any)?._status === 'in_progress');
  };

  // Helper to determine exam status
  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    let start: Date, end: Date;

    if (exam.startTime && exam.endTime) {
      start = new Date(exam.startTime);
      end = new Date(exam.endTime);
    } else {
      // If only date is provided, make it active for the whole day
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

  // Helper to get user's classId
  const userClassId = user?.studentProfile?.class?.id;
  console.log('👤 User data:', {
    userId: user?.id,
    userRole: user?.role,
    hasStudentProfile: !!user?.studentProfile,
    userClassId: userClassId,
    userClassName: user?.studentProfile?.class?.name
  });

  // Helper to get dashboard URL by role
  const getDashboardUrl = () => {
    if (!user) return "/dashboard";
    switch (user.role) {
      case "SUPER_USER": return "/super-user/dashboard";
      case "ADMIN": return "/admin/dashboard";
      case "TEACHER": return "/teacher/dashboard";
      case "STUDENT": return "/student/dashboard";
      default: return "/dashboard";
    }
  };

  // Adaptive layout classes
  const layoutClass = "w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-8 flex flex-col gap-6";

  return (
    <main className="min-h-screen font-serif bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-600 drop-shadow-lg">অনলাইন পরীক্ষা</h1>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllExams(!showAllExams)}
            className="flex-1 sm:flex-none"
          >
            {showAllExams ? "শুধু আমার ক্লাস" : "সকল পরীক্ষা দেখুন"}
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Link href="/exams/results">সকল ফলাফল দেখুন</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1 sm:flex-none">
            <Link href={getDashboardUrl()}>ড্যাশবোর্ডে যান</Link>
          </Button>
        </div>
      </div>
      <div className={layoutClass}>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="online" className="text-sm">অনলাইন পরীক্ষা</TabsTrigger>
            <TabsTrigger value="mixed" className="text-sm">মিশ্র পরীক্ষা</TabsTrigger>
          </TabsList>
          <TabsContent value="online">
            {(() => {
              const onlineExams = showAllExams
                ? exams.filter((e) => !e.type || e.type === "ONLINE")
                : exams.filter((e) => (!e.type || e.type === "ONLINE") && e.classId === userClassId);
              console.log('🔍 Online exams after filtering:', {
                totalExams: exams.length,
                onlineExams: onlineExams.length,
                userClassId: userClassId,
                showAllExams: showAllExams,
                filteredExams: onlineExams.map(e => ({ id: e.id, name: e.name, classId: e.classId, isActive: e.isActive }))
              });
              return (
                <ExamTable
                  exams={onlineExams}
                  getResult={getResult}
                  getExamStatus={getExamStatus}
                  hasSubmitted={hasSubmitted}
                  hasInProgress={hasInProgress}
                  loading={loading}
                />
              );
            })()}
          </TabsContent>
          <TabsContent value="mixed">
            {(() => {
              const mixedExams = showAllExams
                ? exams.filter((e) => e.type === "MIXED")
                : exams.filter((e) => e.type === "MIXED" && e.classId === userClassId);
              console.log('🔍 Mixed exams after filtering:', {
                totalExams: exams.length,
                mixedExams: mixedExams.length,
                userClassId: userClassId,
                showAllExams: showAllExams,
                filteredExams: mixedExams.map(e => ({ id: e.id, name: e.name, classId: e.classId, isActive: e.isActive }))
              });
              return (
                <ExamTable
                  exams={mixedExams}
                  getResult={getResult}
                  getExamStatus={getExamStatus}
                  hasSubmitted={hasSubmitted}
                  hasInProgress={hasInProgress}
                  loading={loading}
                />
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function ExamTable({ exams, getResult, getExamStatus, hasSubmitted, hasInProgress, loading }: {
  exams: Exam[];
  getResult: (examId: string) => Result | undefined;
  getExamStatus: (exam: Exam) => string;
  hasSubmitted: (examId: string) => boolean;
  hasInProgress: (examId: string) => boolean;
  loading: boolean;
}) {
  if (loading) return <div className="text-center py-8">লোড হচ্ছে...</div>;
  if (!exams.length) return <Alert className="glass"><AlertTitle>কোনো পরীক্ষা নেই</AlertTitle><AlertDescription>এই মুহূর্তে কোনো পরীক্ষা পাওয়া যায়নি।</AlertDescription></Alert>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {exams.map((exam) => {
          const status = getExamStatus(exam);
          const result = getResult(exam.id);
          const submitted = hasSubmitted(exam.id);
          const inProgress = hasInProgress(exam.id);
          const isInactive = exam.isActive === false;

          return (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`glass shadow-lg h-full ${isInactive ? 'opacity-75' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{exam.name}</CardTitle>
                    <div className="flex flex-wrap gap-1">
                      {submitted && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          ✓ জমা দেওয়া হয়েছে
                        </Badge>
                      )}
                      {inProgress && !submitted && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                          ⏱️ চলমান
                        </Badge>
                      )}
                      {exam.allowRetake && submitted && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          🔄 পুনরায় পরীক্ষা
                        </Badge>
                      )}
                      {isInactive && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                          ⏸️ নিষ্ক্রিয়
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-sm">{exam.subject}</CardDescription>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">বর্ণনা:</span>
                      <span className="line-clamp-2">{exam.description || "কোনো বর্ণনা নেই"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">তারিখ:</span>
                      <span>{new Date(exam.date).toLocaleDateString("bn-BD")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">স্ট্যাটাস:</span>
                      <Badge variant={status === "active" ? "default" : status === "upcoming" ? "secondary" : "outline"}>
                        {status === "active" && "চলমান"}
                        {status === "upcoming" && "আসন্ন"}
                        {status === "finished" && "শেষ"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  {!isInactive && (
                    <div className="w-full">
                      {status === "upcoming" ? (
                        <div className="text-sm text-muted-foreground text-center">
                          শুরু হবে {new Date(exam.startTime || exam.date).toLocaleString("bn-BD")}
                        </div>
                      ) : status === "finished" ? (
                        submitted ? (
                          <Button asChild variant="default" className="w-full">
                            <a href={`/exams/results/${exam.id}`}>ফলাফল দেখুন</a>
                          </Button>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center">পরীক্ষা দেওয়া হয়নি</div>
                        )
                      ) : status === "active" ? (
                        submitted ? (
                          <div className="space-y-2">
                            {exam.allowRetake && (
                              <Button asChild variant="default" size="sm" className="w-full">
                                <a href={`/exams/online/${exam.id}`}>পুনরায় পরীক্ষা দিন</a>
                              </Button>
                            )}
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <a href={`/exams/results/${exam.id}`}>ফলাফল দেখুন</a>
                            </Button>
                          </div>
                        ) : inProgress ? (
                          <Button asChild variant="default" className="w-full bg-amber-600 hover:bg-amber-700">
                            <a href={`/exams/online/${exam.id}`}>পরীক্ষা চালিয়ে যান</a>
                          </Button>
                        ) : (
                          <Button asChild variant="default" className="w-full">
                            <a href={`/exams/online/${exam.id}`}>পরীক্ষা দিন</a>
                          </Button>
                        )
                      ) : (
                        <div className="text-sm text-muted-foreground text-center">অজানা স্ট্যাটাস</div>
                      )}
                    </div>
                  )}

                  {isInactive && (
                    <div className="w-full text-center">
                      <div className="text-sm text-muted-foreground">
                        এই পরীক্ষাটি বর্তমানে নিষ্ক্রিয় অবস্থায় রয়েছে
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
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