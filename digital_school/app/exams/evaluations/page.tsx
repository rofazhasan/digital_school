"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useRouter } from "next/navigation";
import { Calendar, Users, FileText, CheckCircle, Clock, AlertCircle, UserCheck, Eye, ArrowLeft, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { verifyAdminAction } from "@/lib/native/auth";

interface Exam {
  id: string;
  name: string;
  description: string;
  date: string;
  type: string;
  totalMarks: number;
  isActive: boolean;
  class: {
    name: string;
    section: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  totalStudents: number;
  submittedStudents: number;
  publishedResults: number;
  evaluationAssignments: Array<{
    id: string;
    status: string;
    evaluator: {
      name: string;
      email: string;
      role: string;
    };
    assignedBy: {
      name: string;
      email: string;
    };
    notes: string;
  }>;
  status: string;
}

interface Evaluator {
  id: string;
  name: string;
  email: string;
  role: string;
  teacherProfile?: {
    department: string;
    subjects: string[];
  };
}

export default function EvaluationsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchName, setSearchName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);



  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedStatus && selectedStatus !== "ALL") queryParams.append("status", selectedStatus);
      if (searchName) queryParams.append("name", searchName);
      if (selectedClass && selectedClass !== "ALL") queryParams.append("classId", selectedClass);
      if (selectedSubject && selectedSubject !== "ALL") queryParams.append("subject", selectedSubject);

      const response = await fetch(`/api/exams/evaluations?${queryParams.toString()}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      } else {
        toast.error("Failed to fetch exams");
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error("Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchName, selectedClass, selectedSubject]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  useEffect(() => {
    // Get user role from custom JWT token
    const getUserRole = async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setIsSuperUser(userData.user.role === "SUPER_USER");
          setIsAdmin(userData.user.role === "ADMIN");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    getUserRole();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    if (isSuperUser) {
      fetchEvaluators();
      fetchClasses();
    }
  }, [isSuperUser]);

  const fetchEvaluators = async () => {
    try {
      const response = await fetch("/api/evaluators", {
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEvaluators(data);
      } else {
        console.error("Failed to fetch evaluators:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching evaluators:", error);
    }
  };

  const assignEvaluator = async () => {
    if (!selectedExam || !selectedEvaluator) {
      toast.error("Please select an exam and evaluator");
      return;
    }

    try {
      const response = await fetch("/api/exams/evaluations/assign", {
        method: "POST",
        credentials: 'include', // Include cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam.id,
          evaluatorId: selectedEvaluator,
          notes: assignmentNotes
        })
      });

      if (response.ok) {
        // Find evaluator name for optimistic UI update
        const evalObj = evaluators.find(e => e.id === selectedEvaluator);

        // Update local state optimistically
        setExams(prev => prev.map(exam => {
          if (exam.id === selectedExam.id) {
            const newAssignment = {
              id: Date.now().toString(), // Temporary ID
              status: "PENDING",
              evaluator: {
                name: evalObj?.name || "Assigned Evaluator",
                email: evalObj?.email || "",
                role: evalObj?.role || ""
              },
              assignedBy: { name: "You", email: "" },
              notes: assignmentNotes
            };
            return {
              ...exam,
              status: "PENDING",
              evaluationAssignments: [...(exam.evaluationAssignments || []), newAssignment]
            };
          }
          return exam;
        }));

        const data = await response.json();
        toast.success(data.message);
        setAssignDialogOpen(false);
        setSelectedExam(null);
        setSelectedEvaluator("");
        setAssignmentNotes("");
        // fetchExams();
      } else {
        const error = await response.json();
        toast.error(error.error);
      }
    } catch (error) {
      console.error("Error assigning evaluator:", error);
      toast.error("Failed to assign evaluator");
    }
  };

  const releaseResults = async (examId: string) => {
    try {
      // NATIVE BIOMETRIC SECURITY GATE
      const confirmed = await verifyAdminAction("Release Exam Results");
      if (!confirmed) return;

      const response = await fetch("/api/exams/evaluations/release-results", {
        method: "POST",
        credentials: 'include', // Include cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId })
      });

      if (response.ok) {
        // Update local state optimistically
        setExams(prev => prev.map(exam =>
          exam.id === examId ? { ...exam, publishedResults: exam.submittedStudents } : exam
        ));

        const data = await response.json();
        toast.success(data.message);
        // fetchExams();
      } else {
        const error = await response.json();
        toast.error(error.error);
      }
    } catch (error) {
      console.error("Error releasing results:", error);
      toast.error("Failed to release results");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400";
      case "COMPLETED": return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400";
      case "APPROVED": return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400";
      case "REJECTED": return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400";
      case "UNASSIGNED": return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock className="h-4 w-4" />;
      case "IN_PROGRESS": return <AlertCircle className="h-4 w-4" />;
      case "COMPLETED": return <CheckCircle className="h-4 w-4" />;
      case "APPROVED": return <CheckCircle className="h-4 w-4" />;
      case "REJECTED": return <AlertCircle className="h-4 w-4" />;
      case "UNASSIGNED": return <UserCheck className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading evaluations...</div>
        </div>
      </div>
    );
  }



  return (
    <div className="w-full max-w-7xl 2xl:max-w-[95vw] mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">Exam Evaluations</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            {isSuperUser
              ? "Manage exam evaluations and assign evaluators"
              : "View your assigned exam evaluations"
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="flex-1 sm:flex-none">
            <LayoutDashboard className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Home</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/exams')} className="flex-1 sm:flex-none">
            <FileText className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Exams</span>
            <span className="sm:hidden">Exams</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search Exam Name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - {cls.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].includes(selectedStatus) && (
            <Badge variant="outline" className="whitespace-nowrap rounded-lg px-3 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
              {selectedStatus === "ALL" ? `${exams.length} Exams` : `${exams.filter(e => e.status === selectedStatus).length} ${selectedStatus}`}
            </Badge>
          )}
          {isSuperUser && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Manager View</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl truncate">{exam.name}</CardTitle>
                  <p className="text-muted-foreground mt-1 line-clamp-2">{exam.description || "No description available."}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <Badge className={getStatusColor(exam.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(exam.status)}
                      {exam.status.replace("_", " ")}
                    </div>
                  </Badge>
                  {isSuperUser && (
                    <Badge className={exam.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 border-green-200/50 dark:border-green-800/50"
                      : "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-400 border-gray-200/50 dark:border-slate-700/50"}>
                      {exam.isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Date</span>
                    <span className="text-sm font-medium">
                      {new Date(exam.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Submissions</span>
                    <span className="text-sm font-medium">
                      {exam.submittedStudents}/{exam.totalStudents} students
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Published</span>
                    <span className="text-sm font-medium">
                      {exam.publishedResults} results
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <LayoutDashboard className="h-5 w-5 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Class info</span>
                    <span className="text-sm font-medium">
                      {exam.class.name} {exam.class.section}
                    </span>
                  </div>
                </div>
              </div>

              {exam.publishedResults > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg mb-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Results Released</span>
                  <span className="text-sm">({exam.publishedResults} results published)</span>
                </div>
              )}

              {exam.evaluationAssignments && exam.evaluationAssignments.length > 0 && (
                <div className="bg-muted/30 p-3 rounded-lg mb-4 space-y-3">
                  <h4 className="font-medium text-sm">Evaluators ({exam.evaluationAssignments.length})</h4>
                  {exam.evaluationAssignments.map((assignment: any) => (
                    <div key={assignment.id} className="border-b border-border last:border-0 pb-2 last:pb-0 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Name:</span> {assignment.evaluator.name} <span className="text-xs text-muted-foreground">({assignment.evaluator.role})</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="outline" className={`ml-2 ${getStatusColor(assignment.status)}`}>
                            {assignment.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      {assignment.notes && <div className="text-xs text-muted-foreground mt-1 italic">Note: {assignment.notes}</div>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {(!isAdmin || isSuperUser) && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => router.push(`/exams/evaluations/${exam.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Evaluation
                  </Button>
                )}

                {(isSuperUser || isAdmin) && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    onClick={() => {
                      setSelectedExam(exam);
                      setAssignDialogOpen(true);
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign Evaluator
                  </Button>
                )}

                {(isSuperUser || (exam.evaluationAssignments && exam.evaluationAssignments.some((a: any) => a.status === 'COMPLETED'))) && exam.submittedStudents > 0 && exam.publishedResults === 0 && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50 hover:bg-green-50 dark:hover:bg-green-900/20"
                    onClick={() => releaseResults(exam.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Release Results
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {exams.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg">No exams found</div>
          <p className="text-muted-foreground/60 mt-2">
            Try adjusting your filters to find what you're looking for.
          </p>
        </div>
      )}

      {/* Assign Evaluator Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Evaluator to {selectedExam?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Evaluator</label>
              <Select value={selectedEvaluator} onValueChange={setSelectedEvaluator}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an evaluator" />
                </SelectTrigger>
                <SelectContent>
                  {evaluators.map((evaluator) => (
                    <SelectItem key={evaluator.id} value={evaluator.id}>
                      {evaluator.name} ({evaluator.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add any notes for the evaluator..."
              />
            </div>
            <Button onClick={assignEvaluator} className="w-full">
              Assign Evaluator
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
