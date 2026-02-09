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
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);



  const fetchExams = useCallback(async () => {
    try {
      const params = selectedStatus && selectedStatus !== "ALL" ? `?status=${selectedStatus}` : "";
      const response = await fetch(`/api/exams/evaluations${params}`, {
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched exams:', data);
        setExams(data);
      } else {
        console.error("Failed to fetch exams:", response.status, response.statusText);
        toast.error("Failed to fetch exams");
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error("Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

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
    if (isSuperUser) {
      fetchEvaluators();
    }
  }, [selectedStatus, isSuperUser, fetchExams]);

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
        const data = await response.json();
        toast.success(data.message);
        setAssignDialogOpen(false);
        setSelectedExam(null);
        setSelectedEvaluator("");
        setAssignmentNotes("");
        fetchExams();
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
      const response = await fetch("/api/exams/evaluations/release-results", {
        method: "POST",
        credentials: 'include', // Include cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchExams();
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
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "UNASSIGNED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">Exam Evaluations</h1>
          <p className="text-base md:text-lg text-gray-600">
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

      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-48 bg-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {isSuperUser && (
          <div className="text-sm text-gray-600 flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-100">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Showing All Exams</span>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{exam.name}</CardTitle>
                  <p className="text-gray-600 mt-1">{exam.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(exam.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(exam.status)}
                      {exam.status.replace("_", " ")}
                    </div>
                  </Badge>
                  {isSuperUser && (
                    <Badge className={exam.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {exam.isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Date</span>
                    <span className="text-sm font-medium">
                      {new Date(exam.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Submissions</span>
                    <span className="text-sm font-medium">
                      {exam.submittedStudents}/{exam.totalStudents} students
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Published</span>
                    <span className="text-sm font-medium">
                      {exam.publishedResults} results
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                  <LayoutDashboard className="h-5 w-5 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Class info</span>
                    <span className="text-sm font-medium">
                      {exam.class.name} {exam.class.section}
                    </span>
                  </div>
                </div>
              </div>

              {exam.publishedResults > 0 && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4 flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Results Released</span>
                  <span className="text-sm">({exam.publishedResults} results published)</span>
                </div>
              )}

              {exam.evaluationAssignments && exam.evaluationAssignments.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4 space-y-3">
                  <h4 className="font-medium text-sm">Evaluators ({exam.evaluationAssignments.length})</h4>
                  {exam.evaluationAssignments.map((assignment) => (
                    <div key={assignment.id} className="border-b border-gray-200 last:border-0 pb-2 last:pb-0 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-600">Name:</span> {assignment.evaluator.name} <span className="text-xs text-gray-500">({assignment.evaluator.role})</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="outline" className={`ml-2 ${getStatusColor(assignment.status)}`}>
                            {assignment.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      {assignment.notes && <div className="text-xs text-gray-500 mt-1 italic">Note: {assignment.notes}</div>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {/* View Evaluation - Hidden for Admins unless they are also evaluators (handled by logic) */}
                {(!isAdmin || isSuperUser) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/exams/evaluations/${exam.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Evaluation
                  </Button>
                )}

                {/* Assign Evaluator - Visible for Admin and Super User */}
                {(isSuperUser || isAdmin) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedExam(exam);
                      setAssignDialogOpen(true);
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign Evaluator
                  </Button>
                )}


                {/* Release Results - Super User (Always) or Admin/Teacher (Only if COMPLETED) */}
                {(isSuperUser || (exam.evaluationAssignments && exam.evaluationAssignments.some(a => a.status === 'COMPLETED'))) && exam.submittedStudents > 0 && exam.publishedResults === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
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
          <div className="text-gray-500 text-lg">No exams found</div>
          <p className="text-gray-400 mt-2">
            {selectedStatus && selectedStatus !== "ALL"
              ? `No exams with status "${selectedStatus}"`
              : "No exams available for evaluation"
            }
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
