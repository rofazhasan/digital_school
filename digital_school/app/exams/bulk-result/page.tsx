"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Printer, ArrowLeft, Download, Plus, Trash2, Edit2, Layers,
  CheckCircle2, XCircle, Award, BarChart3, Settings2, Sliders,
  Users, Check, Building2, BookOpen, GraduationCap, ChevronRight,
  Search, Eye, EyeOff, FileSpreadsheet, RefreshCw, Star, Info,
  AlertTriangle, CheckSquare, Square
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toBengaliNumerals } from "@/utils/numeralConverter";
import { toast } from "sonner";

// --- Types ---
interface ClassItem {
  id: string;
  name: string;
  section: string;
  shift?: string;
  _count?: { students: number };
  institute?: {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
  };
}

interface StudentItem {
  id: string;
  userId?: string;
  name: string;
  roll: string;
  registrationNo?: string;
  email?: string;
  image?: string | null;
}

interface ExamItem {
  id: string;
  name: string;
  subject: string;
  date: string;
  totalMarks: number;
  passMarks: number;
  classId: string;
  cqSubsections?: any;
  hasCQ: boolean;
  hasSQ: boolean;
  hasDescriptive: boolean;
  hasObjective: boolean;
  cqMax: number;
  sqMax: number;
  descMax: number;
  objMax: number;
}

interface ManualSubject {
  id: string;
  name: string;
  totalMarks: number;
  passMarks: number;
  isOptional: boolean;
  marks: Record<string, number>; // studentId -> marks
}

interface SubjectGroup {
  id: string;
  name: string; // e.g. "Bangla"
  examIds: string[]; // e.g. ["exam1_id", "exam2_id"]
}

// Bangladesh Secondary & Higher Secondary Education Board Grade Point calculation
export function getSubjectGradePoint(marks: number, totalMarks: number, passMarks: number = 33): { gp: number; grade: string } {
  if (totalMarks <= 0) return { gp: 0.0, grade: "F" };
  const percentage = (marks / totalMarks) * 100;
  const passThresholdPct = (passMarks / totalMarks) * 100;

  if (percentage < passThresholdPct) {
    return { gp: 0.0, grade: "F" };
  }
  if (percentage >= 80) return { gp: 5.0, grade: "A+" };
  if (percentage >= 70) return { gp: 4.0, grade: "A" };
  if (percentage >= 60) return { gp: 3.5, grade: "A-" };
  if (percentage >= 50) return { gp: 3.0, grade: "B" };
  if (percentage >= 40) return { gp: 2.0, grade: "C" };
  return { gp: 1.0, grade: "D" };
}

export function getOverallGradeFromGPA(gpa: number): string {
  if (gpa >= 5.0) return "A+";
  if (gpa >= 4.0) return "A";
  if (gpa >= 3.5) return "A-";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.0) return "C";
  if (gpa >= 1.0) return "D";
  return "F";
}

function BulkResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIds = searchParams.get("ids");

  // Loading & Data State
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [availableExams, setAvailableExams] = useState<ExamItem[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [resultsData, setResultsData] = useState<Record<string, Record<string, any>>>({});
  const [instituteData, setInstituteData] = useState<any>(null);

  // Marksheet Customization State
  const [marksheetTitle, setMarksheetTitle] = useState("বার্ষিক পরীক্ষা ২০২৬ / Annual Examination 2026");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionAddress, setInstitutionAddress] = useState("");
  const [academicYear, setAcademicYear] = useState("2026");
  const [publicationDate, setPublicationDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Selected students filter ('ALL' or array of studentIds)
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<"ALL" | string[]>("ALL");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Breakdown Column Visibility Toggle
  const [showComponentBreakdown, setShowComponentBreakdown] = useState(true);

  // Subject Grouping (e.g. Bangla 1st + 2nd = 200 marks)
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupSelectedExams, setNewGroupSelectedExams] = useState<string[]>([]);

  // Optional (4th Subject) Selection
  const [optionalSubjectIds, setOptionalSubjectIds] = useState<string[]>([]);

  // Manual External Subjects
  const [manualSubjects, setManualSubjects] = useState<ManualSubject[]>([]);
  const [isManualSubjectModalOpen, setIsManualSubjectModalOpen] = useState(false);
  const [newManualName, setNewManualName] = useState("");
  const [newManualTotal, setNewManualTotal] = useState(100);
  const [newManualPass, setNewManualPass] = useState(33);
  const [newManualIsOpt, setNewManualIsOpt] = useState(false);

  // Manual Marks Entry Dialog
  const [marksEntrySubjectId, setMarksEntrySubjectId] = useState<string | null>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"tabulation" | "transcripts" | "config">("tabulation");
  const [selectedTranscriptStudentId, setSelectedTranscriptStudentId] = useState<string>("ALL");

  // Fetch Data on mount or when class/exams change
  const fetchData = async (classId?: string, examIds?: string[]) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (classId) params.set("classId", classId);
      if (examIds && examIds.length > 0) params.set("examIds", examIds.join(","));

      const res = await fetch(`/api/exams/bulk-result?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load results data");
      const data = await res.json();

      setClasses(data.classes || []);
      if (data.selectedClassId && (!selectedClassId || selectedClassId !== data.selectedClassId)) {
        setSelectedClassId(data.selectedClassId);
      }
      setAllStudents(data.students || []);
      setAvailableExams(data.exams || []);
      setResultsData(data.results || {});

      if (data.institute) {
        setInstituteData(data.institute);
        if (!institutionName) setInstitutionName(data.institute.name || "Digital School Academy");
        if (!institutionAddress) setInstitutionAddress(data.institute.address || "Dhaka, Bangladesh");
      }

      // Default select all exams if no specific examIds passed
      if (!examIds || examIds.length === 0) {
        const ids = (data.exams || []).map((e: any) => e.id);
        setSelectedExamIds(ids);
      } else {
        setSelectedExamIds(examIds);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load results data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ids = initialIds ? initialIds.split(",").filter(Boolean) : undefined;
    fetchData(undefined, ids);
  }, []);

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSelectedExamIds([]);
    setSubjectGroups([]);
    setOptionalSubjectIds([]);
    setManualSubjects([]);
    fetchData(newClassId, undefined);
  };

  // Filtered Students list based on search and selection
  const displayedStudents = useMemo(() => {
    let list = allStudents;
    if (selectedStudentFilter !== "ALL") {
      const allowed = new Set(selectedStudentFilter);
      list = list.filter(s => allowed.has(s.id));
    }
    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        (s.registrationNo && s.registrationNo.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allStudents, selectedStudentFilter, studentSearchQuery]);

  // Selected Exam Objects
  const activeExams = useMemo(() => {
    return availableExams.filter(e => selectedExamIds.includes(e.id));
  }, [availableExams, selectedExamIds]);

  // Global Check: Does ANY active exam contain CQ, SQ, Descriptive, Objective?
  const globalColumnCapabilities = useMemo(() => {
    const hasCQ = activeExams.some(e => e.hasCQ);
    const hasSQ = activeExams.some(e => e.hasSQ);
    const hasDescriptive = activeExams.some(e => e.hasDescriptive);
    const hasObjective = activeExams.some(e => e.hasObjective);
    return { hasCQ, hasSQ, hasDescriptive, hasObjective };
  }, [activeExams]);

  // Handle Add Subject Group (e.g. Bangla 1st + 2nd)
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.warning("গ্রুপের নাম লিখুন (Enter group name)");
      return;
    }
    if (newGroupSelectedExams.length < 2) {
      toast.warning("কমপক্ষে ২টি বিষয় নির্বাচন করুন (Select at least 2 subjects)");
      return;
    }
    const newGroup: SubjectGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      examIds: [...newGroupSelectedExams]
    };
    setSubjectGroups(prev => [...prev, newGroup]);
    setNewGroupName("");
    setNewGroupSelectedExams([]);
    setIsGroupModalOpen(false);
    toast.success(`'${newGroup.name}' গ্রুপ সফলভাবে যুক্ত হয়েছে!`);
  };

  const handleRemoveGroup = (groupId: string) => {
    setSubjectGroups(prev => prev.filter(g => g.id !== groupId));
    toast.info("গ্রুপ মুছে ফেলা হয়েছে");
  };

  // Handle Add Manual Subject
  const handleCreateManualSubject = () => {
    if (!newManualName.trim()) {
      toast.warning("বিষয়ের নাম লিখুন");
      return;
    }
    const newSub: ManualSubject = {
      id: `manual_${Date.now()}`,
      name: newManualName.trim(),
      totalMarks: Number(newManualTotal) || 100,
      passMarks: Number(newManualPass) || 33,
      isOptional: newManualIsOpt,
      marks: {}
    };
    setManualSubjects(prev => [...prev, newSub]);
    if (newManualIsOpt) {
      setOptionalSubjectIds(prev => [...prev, newSub.id]);
    }
    setNewManualName("");
    setIsManualSubjectModalOpen(false);
    toast.success(`ম্যানুয়াল বিষয় '${newSub.name}' যুক্ত হয়েছে`);
  };

  const handleRemoveManualSubject = (id: string) => {
    setManualSubjects(prev => prev.filter(m => m.id !== id));
    setOptionalSubjectIds(prev => prev.filter(optId => optId !== id));
    toast.info("ম্যানুয়াল বিষয় সরানো হয়েছে");
  };

  const handleUpdateManualMark = (subjectId: string, studentId: string, markVal: number) => {
    setManualSubjects(prev => prev.map(m => {
      if (m.id !== subjectId) return m;
      return {
        ...m,
        marks: {
          ...m.marks,
          [studentId]: markVal
        }
      };
    }));
  };

  // Toggle Optional Subject (4th Subject)
  const toggleOptionalSubject = (subjectId: string) => {
    setOptionalSubjectIds(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        if (prev.length >= 2) {
          toast.warning("সর্বোচ্চ ২টি ঐচ্ছিক (৪র্থ) বিষয় নির্বাচন করা যাবে।");
          return prev;
        }
        toast.success("ঐচ্ছিক (৪র্থ) বিষয় হিসেবে নির্ধারিত হয়েছে");
        return [...prev, subjectId];
      }
    });
  };

  // Compute Full Student Marks & Tabulation Row
  // Implements Bangladesh Education Board GPA & 4th Subject Rule
  const computedStudentRows = useMemo(() => {
    return displayedStudents.map(student => {
      // 1. Map of Subject Marks:
      // We will organize subjects by grouped and standalone
      const groupedExamIdsSet = new Set(subjectGroups.flatMap(g => g.examIds));

      // Standalone exams (not in any joint group)
      const standaloneExams = activeExams.filter(e => !groupedExamIdsSet.has(e.id));

      interface EvaluatedSubject {
        id: string;
        name: string;
        isOptional: boolean;
        isGroup: boolean;
        papers?: { name: string; marks: number; total: number; cq: number; sq: number; desc: number; obj: number }[];
        cqMarks: number;
        sqMarks: number;
        descMarks: number;
        objMarks: number;
        totalEarned: number;
        totalMarks: number;
        percentage: number;
        gp: number;
        grade: string;
        isFailed: boolean;
      }

      const subjectResults: EvaluatedSubject[] = [];

      // A. Evaluate Joint Subject Groups (e.g. Bangla 1st + 2nd = 200 marks)
      subjectGroups.forEach(grp => {
        const grpExams = activeExams.filter(e => grp.examIds.includes(e.id));
        let grpEarned = 0;
        let grpTotal = 0;
        let grpCq = 0;
        let grpSq = 0;
        let grpDesc = 0;
        let grpObj = 0;
        const papers: any[] = [];

        grpExams.forEach(e => {
          const r = resultsData[student.id]?.[e.id] || { total: 0, mcqMarks: 0, cqMarks: 0, sqMarks: 0, descMarks: 0 };
          grpEarned += (r.total || 0);
          grpTotal += (e.totalMarks || 100);
          grpCq += (r.cqMarks || 0);
          grpSq += (r.sqMarks || 0);
          grpDesc += (r.descMarks || 0);
          grpObj += (r.mcqMarks || 0);
          papers.push({
            name: e.name,
            marks: r.total || 0,
            total: e.totalMarks || 100,
            cq: r.cqMarks || 0,
            sq: r.sqMarks || 0,
            desc: r.descMarks || 0,
            obj: r.mcqMarks || 0
          });
        });

        const isOpt = optionalSubjectIds.includes(grp.id);
        const { gp, grade } = getSubjectGradePoint(grpEarned, grpTotal, 33 * grpExams.length);
        const isFailed = gp === 0;

        subjectResults.push({
          id: grp.id,
          name: grp.name,
          isOptional: isOpt,
          isGroup: true,
          papers,
          cqMarks: grpCq,
          sqMarks: grpSq,
          descMarks: grpDesc,
          objMarks: grpObj,
          totalEarned: grpEarned,
          totalMarks: grpTotal,
          percentage: grpTotal > 0 ? (grpEarned / grpTotal) * 100 : 0,
          gp,
          grade,
          isFailed
        });
      });

      // B. Evaluate Standalone Exams
      standaloneExams.forEach(e => {
        const r = resultsData[student.id]?.[e.id] || { total: 0, mcqMarks: 0, cqMarks: 0, sqMarks: 0, descMarks: 0 };
        const earned = r.total || 0;
        const total = e.totalMarks || 100;
        const pass = e.passMarks || 33;
        const isOpt = optionalSubjectIds.includes(e.id);
        const { gp, grade } = getSubjectGradePoint(earned, total, pass);
        const isFailed = gp === 0;

        subjectResults.push({
          id: e.id,
          name: e.name,
          isOptional: isOpt,
          isGroup: false,
          cqMarks: r.cqMarks || 0,
          sqMarks: r.sqMarks || 0,
          descMarks: r.descMarks || 0,
          objMarks: r.mcqMarks || 0,
          totalEarned: earned,
          totalMarks: total,
          percentage: total > 0 ? (earned / total) * 100 : 0,
          gp,
          grade,
          isFailed
        });
      });

      // C. Evaluate Manual Subjects
      manualSubjects.forEach(m => {
        const earned = m.marks[student.id] ?? 0;
        const total = m.totalMarks || 100;
        const pass = m.passMarks || 33;
        const isOpt = optionalSubjectIds.includes(m.id) || m.isOptional;
        const { gp, grade } = getSubjectGradePoint(earned, total, pass);
        const isFailed = gp === 0;

        subjectResults.push({
          id: m.id,
          name: m.name,
          isOptional: isOpt,
          isGroup: false,
          cqMarks: 0,
          sqMarks: 0,
          descMarks: 0,
          objMarks: 0,
          totalEarned: earned,
          totalMarks: total,
          percentage: total > 0 ? (earned / total) * 100 : 0,
          gp,
          grade,
          isFailed
        });
      });

      // D. Overall GPA & Result Computation according to Bangladesh 4th Subject Rule:
      // - Compulsory subjects: fail in any compulsory subject => overall F
      // - Optional subjects: fail in optional => does NOT cause overall fail
      // - Optional subjects: if GP > 2.0 => extra GP = (GP - 2.0) added to numerator
      const compulsorySubjects = subjectResults.filter(s => !s.isOptional);
      const optionalSubjects = subjectResults.filter(s => s.isOptional);

      let hasCompulsoryFail = false;
      let compulsoryGpSum = 0;
      let compulsoryTotalEarned = 0;
      let compulsoryFullMarks = 0;

      compulsorySubjects.forEach(s => {
        compulsoryGpSum += s.gp;
        compulsoryTotalEarned += s.totalEarned;
        compulsoryFullMarks += s.totalMarks;
        if (s.isFailed) {
          hasCompulsoryFail = true;
        }
      });

      let optionalBonusGp = 0;
      let optionalTotalEarned = 0;
      let optionalFullMarks = 0;

      optionalSubjects.forEach(s => {
        optionalTotalEarned += s.totalEarned;
        optionalFullMarks += s.totalMarks;
        if (s.gp > 2.0) {
          optionalBonusGp += (s.gp - 2.0);
        }
      });

      const grandTotalEarned = compulsoryTotalEarned + optionalTotalEarned;
      const grandTotalMarks = compulsoryFullMarks + optionalFullMarks;
      const grandPercentage = grandTotalMarks > 0 ? (grandTotalEarned / grandTotalMarks) * 100 : 0;

      let finalGPA = 0.00;
      let finalGrade = "F";
      let status: "PASSED" | "FAILED" = "PASSED";

      if (compulsorySubjects.length === 0) {
        finalGPA = 0;
        finalGrade = "F";
        status = "FAILED";
      } else if (hasCompulsoryFail) {
        finalGPA = 0.00;
        finalGrade = "F";
        status = "FAILED";
      } else {
        const rawGPA = (compulsoryGpSum + optionalBonusGp) / compulsorySubjects.length;
        finalGPA = Math.min(5.00, Number(rawGPA.toFixed(2)));
        finalGrade = getOverallGradeFromGPA(finalGPA);
        status = "PASSED";
      }

      return {
        student,
        subjectResults,
        compulsorySubjects,
        optionalSubjects,
        compulsoryGpSum,
        optionalBonusGp,
        grandTotalEarned,
        grandTotalMarks,
        grandPercentage,
        finalGPA,
        finalGrade,
        status
      };
    });
  }, [displayedStudents, activeExams, resultsData, subjectGroups, optionalSubjectIds, manualSubjects]);

  // Ranking & Sorting Logic:
  // "which student good in gpa overall come first then if gpa same then whole marks if marks same then indiviual mark precentage"
  const rankedStudentRows = useMemo(() => {
    const list = [...computedStudentRows];

    list.sort((a, b) => {
      // 1. Pass status first (Passed students come before Failed)
      if (a.status === "PASSED" && b.status === "FAILED") return -1;
      if (a.status === "FAILED" && b.status === "PASSED") return 1;

      // 2. Highest GPA first
      if (b.finalGPA !== a.finalGPA) {
        return b.finalGPA - a.finalGPA;
      }

      // 3. Highest Total Marks
      if (b.grandTotalEarned !== a.grandTotalEarned) {
        return b.grandTotalEarned - a.grandTotalEarned;
      }

      // 4. Highest Percentage
      if (b.grandPercentage !== a.grandPercentage) {
        return b.grandPercentage - a.grandPercentage;
      }

      // 5. Roll number as tie breaker
      return Number(a.student.roll || 0) - Number(b.student.roll || 0);
    });

    // Assign Merit Position
    let currentRank = 1;
    return list.map((item, idx) => {
      let meritText = "";
      if (item.status === "PASSED") {
        meritText = `${currentRank++}`;
      } else {
        meritText = "—";
      }
      return {
        ...item,
        meritPosition: meritText
      };
    });
  }, [computedStudentRows]);

  // Print Function
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    if (rankedStudentRows.length === 0) {
      toast.warning("কোনো ডাটা পাওয়া যায়নি");
      return;
    }
    const headers = [
      "Merit",
      "Roll",
      "Student Name",
      ...activeExams.map(e => `${e.name} (${e.totalMarks})`),
      "Total Marks",
      "Percentage",
      "GPA",
      "Grade",
      "Status"
    ];

    const rows = rankedStudentRows.map(row => {
      const examMarks = activeExams.map(e => {
        const sub = row.subjectResults.find(s => s.id === e.id);
        return sub ? sub.totalEarned : 0;
      });
      return [
        row.meritPosition,
        row.student.roll,
        `"${row.student.name}"`,
        ...examMarks,
        row.grandTotalEarned,
        `${row.grandPercentage.toFixed(1)}%`,
        row.finalGPA.toFixed(2),
        row.finalGrade,
        row.status
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tabulation_sheet_${selectedClassId}_${academicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV ফাইল ডাউনলোড সম্পন্ন হয়েছে!");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans pb-24 print:bg-white print:p-0">
      {/* Top Navigation Bar (Hidden in Print) */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 print:hidden shadow-xs">
        <div className="max-w-7xl 2xl:max-w-[96vw] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/exams")}
              className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                  Bulk Result & Marksheet Studio
                </span>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
                  Board Standard GPA
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                বাল্ক রেজাল্ট শিট, কম্বাইন্ড গ্রেডিং, ৪র্থ বিষয় ও প্রফেশনাল মার্কশিট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>

            <Button
              onClick={handlePrint}
              className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-xs h-9 px-4"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl 2xl:max-w-[96vw] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 print:p-0 print:max-w-none print:m-0">
        
        {/* Controls Card (Hidden in Print) */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs print:hidden">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Class Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  Select Class (শ্রেণি)
                </label>
                <Select value={selectedClassId} onValueChange={handleClassChange}>
                  <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 h-9 font-semibold">
                    <SelectValue placeholder="Choose Class..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id} className="cursor-pointer font-medium">
                        Class {c.name} {c.section ? `(${c.section})` : ""} {c._count ? `• ${c._count.students} Students` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  Students (শিক্ষার্থী)
                </label>
                <Select
                  value={selectedStudentFilter === "ALL" ? "ALL" : "SELECTED"}
                  onValueChange={(val) => {
                    if (val === "ALL") setSelectedStudentFilter("ALL");
                    else setSelectedStudentFilter(allStudents.map(s => s.id));
                  }}
                >
                  <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 h-9 font-semibold">
                    <SelectValue placeholder="Select Students" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ALL" className="cursor-pointer font-medium">
                      All Students ({allStudents.length})
                    </SelectItem>
                    <SelectItem value="SELECTED" className="cursor-pointer font-medium">
                      Selected Students ({displayedStudents.length}/{allStudents.length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marksheet Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                  Examination Title (পরীক্ষার নাম)
                </label>
                <Input
                  value={marksheetTitle}
                  onChange={(e) => setMarksheetTitle(e.target.value)}
                  placeholder="e.g. Annual Examination 2026"
                  className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 h-9 font-medium"
                />
              </div>

              {/* Quick Actions & Modal Triggers */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsGroupModalOpen(true)}
                    className="flex-1 rounded-xl border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-semibold text-xs h-9 hover:bg-purple-100"
                  >
                    <Layers className="w-3.5 h-3.5 mr-1" />
                    Group ({subjectGroups.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsManualSubjectModalOpen(true)}
                    className="flex-1 rounded-xl border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-semibold text-xs h-9 hover:bg-amber-100"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    + Subject ({manualSubjects.length})
                  </Button>
                </div>
              </div>
            </div>

            {/* Exam Selector Checkboxes */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  Select Exams to Include ({selectedExamIds.length}/{availableExams.length})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedExamIds(availableExams.map(e => e.id))}
                    className="h-7 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-2 rounded-lg"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedExamIds([])}
                    className="h-7 text-xs font-semibold text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 px-2 rounded-lg"
                  >
                    Deselect All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComponentBreakdown(!showComponentBreakdown)}
                    className={`h-7 text-xs font-bold px-2 rounded-lg ${showComponentBreakdown ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-500'}`}
                  >
                    {showComponentBreakdown ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
                    {showComponentBreakdown ? "Hide Breakdown" : "Show Breakdown"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 scrollbar-thin">
                {availableExams.map(exam => {
                  const isChecked = selectedExamIds.includes(exam.id);
                  const isOpt = optionalSubjectIds.includes(exam.id);
                  return (
                    <div
                      key={exam.id}
                      onClick={() => {
                        setSelectedExamIds(prev =>
                          isChecked ? prev.filter(id => id !== exam.id) : [...prev, exam.id]
                        );
                      }}
                      className={`cursor-pointer px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 select-none ${
                        isChecked
                          ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 shadow-xs"
                          : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="font-bold">{exam.name}</span>
                      <span className="text-[10px] text-muted-foreground">({exam.totalMarks}M)</span>
                      
                      {/* 4th Subject Toggle Pill */}
                      {isChecked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOptionalSubject(exam.id);
                          }}
                          title={isOpt ? "Click to make compulsory" : "Click to mark as 4th/Optional subject"}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase transition-all ${
                            isOpt
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-200"
                          }`}
                        >
                          {isOpt ? "★ 4th Sub" : "+ 4th"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Tabs (Hidden in Print) */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <TabsList className="rounded-xl p-1 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="tabulation" className="rounded-lg text-xs font-bold px-3 py-1.5">
                  <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Tabulation Sheet (Broadsheet)
                </TabsTrigger>
                <TabsTrigger value="transcripts" className="rounded-lg text-xs font-bold px-3 py-1.5">
                  <GraduationCap className="w-4 h-4 mr-1.5 text-blue-600" />
                  Student Marksheets (Transcripts)
                </TabsTrigger>
                <TabsTrigger value="config" className="rounded-lg text-xs font-bold px-3 py-1.5">
                  <Settings2 className="w-4 h-4 mr-1.5 text-purple-600" />
                  Group & Optional Setup
                </TabsTrigger>
              </TabsList>

              {activeTab === "transcripts" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Select Student:</span>
                  <Select
                    value={selectedTranscriptStudentId}
                    onValueChange={(val) => setSelectedTranscriptStudentId(val)}
                  >
                    <SelectTrigger className="w-48 h-8 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="All Students" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-56">
                      <SelectItem value="ALL" className="font-bold cursor-pointer">
                        All Students ({rankedStudentRows.length})
                      </SelectItem>
                      {rankedStudentRows.map(r => (
                        <SelectItem key={r.student.id} value={r.student.id} className="cursor-pointer">
                          Roll {r.student.roll}: {r.student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Tabs>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: TABULATION SHEET (BROADSHEET VIEW)                                  */}
        {/* ========================================================================= */}
        {activeTab === "tabulation" && (
          <div className="tabulation-sheet-wrapper print:block">
            
            {/* Formal Institutional Print Header */}
            <div className="text-center space-y-1 mb-6 border-b-2 border-slate-900 dark:border-white pb-4">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                {institutionName || "DIGITAL SCHOOL ACADEMY"}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                {institutionAddress || "Approved by Ministry of Education & Secondary Education Board"}
              </p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs sm:text-sm font-black uppercase tracking-wider">
                  {marksheetTitle}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold pt-2 px-2 text-slate-700 dark:text-slate-300">
                <span>Class: {classes.find(c => c.id === selectedClassId)?.name || "All"} {classes.find(c => c.id === selectedClassId)?.section ? `(${classes.find(c => c.id === selectedClassId)?.section})` : ""}</span>
                <span>Session / Year: {academicYear}</span>
                <span>Date: {publicationDate}</span>
                <span>Total Candidates: {rankedStudentRows.length}</span>
              </div>
            </div>

            {/* Bangladesh Education Board Grading System Legend */}
            <div className="mb-4 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] print:border-slate-400">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">Board Grading Scale:</span>
                <span className="font-mono">80-100: A+ (5.00)</span>
                <span className="font-mono">70-79: A (4.00)</span>
                <span className="font-mono">60-69: A- (3.50)</span>
                <span className="font-mono">50-59: B (3.00)</span>
                <span className="font-mono">40-49: C (2.00)</span>
                <span className="font-mono">33-39: D (1.00)</span>
                <span className="font-mono font-bold text-rose-600">0-32: F (0.00)</span>
                <span className="italic text-slate-500 font-medium">★ 4th Subject: GP &gt; 2.0 added to overall GPA</span>
              </div>
            </div>

            {/* Broadsheet Tabulation Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 print:border-slate-900 print:shadow-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  {/* Top Level Headers */}
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 print:bg-slate-200 print:border-slate-900">
                    <th rowSpan={2} className="p-2.5 font-black text-center border-r border-slate-200 dark:border-slate-700 w-12 print:border-slate-900">
                      Merit
                    </th>
                    <th rowSpan={2} className="p-2.5 font-black text-center border-r border-slate-200 dark:border-slate-700 w-14 print:border-slate-900">
                      Roll
                    </th>
                    <th rowSpan={2} className="p-2.5 font-black border-r border-slate-200 dark:border-slate-700 min-w-[140px] print:border-slate-900">
                      Student Name
                    </th>

                    {/* Subject Headers */}
                    {activeExams.map(exam => {
                      const isOpt = optionalSubjectIds.includes(exam.id);
                      const subCols = (showComponentBreakdown ? 1 : 0) * (
                        (exam.hasCQ ? 1 : 0) +
                        (exam.hasSQ ? 1 : 0) +
                        (exam.hasDescriptive ? 1 : 0) +
                        (exam.hasObjective ? 1 : 0)
                      ) + 3; // Total, GP, Grade

                      return (
                        <th
                          key={exam.id}
                          colSpan={subCols}
                          className="p-2 text-center font-bold border-r border-slate-200 dark:border-slate-700 print:border-slate-900"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{exam.name}</span>
                            {isOpt && (
                              <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 h-4">
                                4th Sub
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] font-normal text-muted-foreground">({exam.totalMarks}M)</span>
                        </th>
                      );
                    })}

                    {/* Manual Subjects Headers */}
                    {manualSubjects.map(m => {
                      const isOpt = optionalSubjectIds.includes(m.id) || m.isOptional;
                      return (
                        <th
                          key={m.id}
                          colSpan={3}
                          className="p-2 text-center font-bold border-r border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-950/20 print:border-slate-900"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{m.name}</span>
                            {isOpt && <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 h-4">4th</Badge>}
                          </div>
                          <span className="text-[10px] font-normal text-muted-foreground">({m.totalMarks}M)</span>
                        </th>
                      );
                    })}

                    {/* Grand Summary Headers */}
                    <th rowSpan={2} className="p-2.5 font-black text-center border-r border-slate-200 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-800/50 w-16 print:border-slate-900">
                      Total Marks
                    </th>
                    <th rowSpan={2} className="p-2.5 font-black text-center border-r border-slate-200 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-800/50 w-14 print:border-slate-900">
                      (%)
                    </th>
                    <th rowSpan={2} className="p-2.5 font-black text-center border-r border-slate-200 dark:border-slate-700 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 w-16 print:border-slate-900">
                      GPA
                    </th>
                    <th rowSpan={2} className="p-2.5 font-black text-center border-r border-slate-200 dark:border-slate-700 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 w-14 print:border-slate-900">
                      Grade
                    </th>
                    <th rowSpan={2} className="p-2.5 font-black text-center w-16 print:border-slate-900">
                      Status
                    </th>
                  </tr>

                  {/* Sub Headers for Breakdowns */}
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] text-slate-600 dark:text-slate-400 border-b border-slate-300 dark:border-slate-700 print:border-slate-900">
                    {activeExams.map(exam => (
                      <React.Fragment key={exam.id}>
                        {showComponentBreakdown && exam.hasCQ && <th className="p-1.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-slate-900">CQ</th>}
                        {showComponentBreakdown && exam.hasSQ && <th className="p-1.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-slate-900">SQ</th>}
                        {showComponentBreakdown && exam.hasDescriptive && <th className="p-1.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-slate-900">Desc</th>}
                        {showComponentBreakdown && exam.hasObjective && <th className="p-1.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-slate-900">Obj</th>}
                        <th className="p-1.5 text-center font-bold border-r border-slate-200 dark:border-slate-700 print:border-slate-900">Tot</th>
                        <th className="p-1.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-slate-900">GP</th>
                        <th className="p-1.5 text-center font-bold border-r border-slate-200 dark:border-slate-700 print:border-slate-900">LG</th>
                      </React.Fragment>
                    ))}

                    {manualSubjects.map(m => (
                      <React.Fragment key={m.id}>
                        <th className="p-1.5 text-center font-bold border-r border-slate-200 dark:border-slate-700 print:border-slate-900">Tot</th>
                        <th className="p-1.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-slate-900">GP</th>
                        <th className="p-1.5 text-center font-bold border-r border-slate-200 dark:border-slate-700 print:border-slate-900">LG</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-900 font-mono">
                  {rankedStudentRows.map((row, rIdx) => {
                    const isEven = rIdx % 2 === 0;
                    const isFailed = row.status === "FAILED";

                    return (
                      <tr
                        key={row.student.id}
                        className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                          isEven ? "bg-white dark:bg-slate-900" : "bg-slate-50/40 dark:bg-slate-800/20"
                        } ${isFailed ? "bg-rose-50/20 dark:bg-rose-950/10" : ""}`}
                      >
                        {/* Merit */}
                        <td className="p-2 text-center font-black border-r border-slate-200 dark:border-slate-700 print:border-slate-900">
                          {row.meritPosition === "1" ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-900 font-black text-xs shadow-xs">
                              1
                            </span>
                          ) : row.meritPosition === "2" ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs">
                              2
                            </span>
                          ) : row.meritPosition === "3" ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs">
                              3
                            </span>
                          ) : (
                            row.meritPosition
                          )}
                        </td>

                        {/* Roll */}
                        <td className="p-2 text-center font-bold border-r border-slate-200 dark:border-slate-700 print:border-slate-900">
                          {row.student.roll}
                        </td>

                        {/* Student Name */}
                        <td className="p-2 font-sans font-bold border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 print:border-slate-900">
                          {row.student.name}
                        </td>

                        {/* Exam Marks Columns */}
                        {activeExams.map(exam => {
                          const sub = row.subjectResults.find(s => s.id === exam.id);
                          const earned = sub ? sub.totalEarned : 0;
                          const gp = sub ? sub.gp : 0;
                          const lg = sub ? sub.grade : "F";
                          const isSubFail = gp === 0;

                          return (
                            <React.Fragment key={exam.id}>
                              {showComponentBreakdown && exam.hasCQ && (
                                <td className="p-1.5 text-center text-[11px] border-r border-slate-200 dark:border-slate-700 text-muted-foreground print:border-slate-900">
                                  {sub ? sub.cqMarks : 0}
                                </td>
                              )}
                              {showComponentBreakdown && exam.hasSQ && (
                                <td className="p-1.5 text-center text-[11px] border-r border-slate-200 dark:border-slate-700 text-muted-foreground print:border-slate-900">
                                  {sub ? sub.sqMarks : 0}
                                </td>
                              )}
                              {showComponentBreakdown && exam.hasDescriptive && (
                                <td className="p-1.5 text-center text-[11px] border-r border-slate-200 dark:border-slate-700 text-muted-foreground print:border-slate-900">
                                  {sub ? sub.descMarks : 0}
                                </td>
                              )}
                              {showComponentBreakdown && exam.hasObjective && (
                                <td className="p-1.5 text-center text-[11px] border-r border-slate-200 dark:border-slate-700 text-muted-foreground print:border-slate-900">
                                  {sub ? sub.objMarks : 0}
                                </td>
                              )}

                              <td className={`p-1.5 text-center font-bold border-r border-slate-200 dark:border-slate-700 ${isSubFail ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'} print:border-slate-900`}>
                                {earned}
                              </td>
                              <td className={`p-1.5 text-center text-[11px] border-r border-slate-200 dark:border-slate-700 ${isSubFail ? 'text-rose-600 font-bold' : ''} print:border-slate-900`}>
                                {gp.toFixed(1)}
                              </td>
                              <td className={`p-1.5 text-center font-black border-r border-slate-200 dark:border-slate-700 ${isSubFail ? 'text-rose-600' : lg === 'A+' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'} print:border-slate-900`}>
                                {lg}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Manual Subjects Marks Columns */}
                        {manualSubjects.map(m => {
                          const sub = row.subjectResults.find(s => s.id === m.id);
                          const earned = sub ? sub.totalEarned : 0;
                          const gp = sub ? sub.gp : 0;
                          const lg = sub ? sub.grade : "F";
                          const isSubFail = gp === 0;

                          return (
                            <React.Fragment key={m.id}>
                              <td className={`p-1.5 text-center font-bold border-r border-slate-200 dark:border-slate-700 ${isSubFail ? 'text-rose-600' : ''} print:border-slate-900`}>
                                {earned}
                              </td>
                              <td className={`p-1.5 text-center text-[11px] border-r border-slate-200 dark:border-slate-700 ${isSubFail ? 'text-rose-600 font-bold' : ''} print:border-slate-900`}>
                                {gp.toFixed(1)}
                              </td>
                              <td className={`p-1.5 text-center font-black border-r border-slate-200 dark:border-slate-700 ${isSubFail ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'} print:border-slate-900`}>
                                {lg}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Total Marks */}
                        <td className="p-2 text-center font-black border-r border-slate-200 dark:border-slate-700 bg-slate-100/40 dark:bg-slate-800/40 print:border-slate-900">
                          {row.grandTotalEarned}
                        </td>

                        {/* Percentage */}
                        <td className="p-2 text-center font-bold border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 print:border-slate-900">
                          {row.grandPercentage.toFixed(1)}%
                        </td>

                        {/* Overall GPA */}
                        <td className={`p-2 text-center font-black text-sm border-r border-slate-200 dark:border-slate-700 ${
                          row.status === 'FAILED'
                            ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                        } print:border-slate-900`}>
                          {row.finalGPA.toFixed(2)}
                        </td>

                        {/* Overall Grade */}
                        <td className={`p-2 text-center font-black border-r border-slate-200 dark:border-slate-700 ${
                          row.status === 'FAILED' ? 'text-rose-600' : 'text-emerald-600'
                        } print:border-slate-900`}>
                          {row.finalGrade}
                        </td>

                        {/* Status Badge */}
                        <td className="p-2 text-center font-sans font-bold print:border-slate-900">
                          {row.status === "PASSED" ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                              PASS
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              FAIL
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Block for Print */}
            <div className="hidden print:grid grid-cols-3 gap-8 pt-16 text-center text-xs font-bold text-slate-800">
              <div className="border-t border-slate-900 pt-2">
                Prepared & Verified by
              </div>
              <div className="border-t border-slate-900 pt-2">
                Class Teacher
              </div>
              <div className="border-t border-slate-900 pt-2">
                Headmaster / Principal
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INDIVIDUAL STUDENT MARKSHEETS / TRANSCRIPTS                         */}
        {/* ========================================================================= */}
        {activeTab === "transcripts" && (
          <div className="space-y-12">
            {rankedStudentRows
              .filter(r => selectedTranscriptStudentId === "ALL" || r.student.id === selectedTranscriptStudentId)
              .map(row => (
                <div
                  key={row.student.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm print:border-slate-900 print:shadow-none print:rounded-none print:p-0 page-break-after-always"
                >
                  {/* Marksheet Institutional Header */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                      {institutionName || "DIGITAL SCHOOL ACADEMY"}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {institutionAddress || "Approved by Ministry of Education, Bangladesh"}
                    </p>
                    <div className="py-2">
                      <span className="inline-block px-5 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs sm:text-sm font-black uppercase tracking-wider">
                        ACADEMIC TRANSCRIPT / MARKSHEET
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {marksheetTitle}
                    </p>
                  </div>

                  {/* Student Details & GPA Scale Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">Student Name:</span> <strong className="text-foreground text-sm">{row.student.name}</strong></div>
                        <div><span className="text-muted-foreground">Roll Number:</span> <strong className="text-foreground text-sm">{row.student.roll}</strong></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">Registration No:</span> <strong>{row.student.registrationNo || "N/A"}</strong></div>
                        <div><span className="text-muted-foreground">Class & Section:</span> <strong>Class {classes.find(c => c.id === selectedClassId)?.name || "All"} {classes.find(c => c.id === selectedClassId)?.section ? `(${classes.find(c => c.id === selectedClassId)?.section})` : ""}</strong></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">Academic Year:</span> <strong>{academicYear}</strong></div>
                        <div><span className="text-muted-foreground">Date of Issue:</span> <strong>{publicationDate}</strong></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[10px] flex flex-col justify-center">
                      <div className="font-bold text-center border-b pb-1 mb-1.5 uppercase text-slate-800 dark:text-slate-200">
                        Grading System
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center font-mono">
                        <span>80-100: A+ (5)</span>
                        <span>70-79: A (4)</span>
                        <span>60-69: A- (3.5)</span>
                        <span>50-59: B (3)</span>
                        <span>40-49: C (2)</span>
                        <span>33-39: D (1)</span>
                      </div>
                      <div className="text-center font-bold text-rose-600 mt-1">
                        Below 33: F (0.00)
                      </div>
                    </div>
                  </div>

                  {/* Subject-Wise Marks Table */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 print:border-slate-900">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 print:bg-slate-200 print:border-slate-900">
                          <th className="p-2.5">Sl</th>
                          <th className="p-2.5">Name of Subject</th>
                          <th className="p-2.5 text-center">Full Marks</th>
                          {showComponentBreakdown && <th className="p-2.5 text-center">CQ</th>}
                          {showComponentBreakdown && <th className="p-2.5 text-center">SQ</th>}
                          {showComponentBreakdown && <th className="p-2.5 text-center">Desc</th>}
                          {showComponentBreakdown && <th className="p-2.5 text-center">Obj</th>}
                          <th className="p-2.5 text-center">Obtained Marks</th>
                          <th className="p-2.5 text-center">Grade Point</th>
                          <th className="p-2.5 text-center">Letter Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono print:divide-slate-900">
                        {row.subjectResults.map((sub, sIdx) => {
                          const isFailed = sub.isFailed;
                          return (
                            <tr key={sub.id} className={sub.isOptional ? "bg-amber-50/40 dark:bg-amber-950/20" : ""}>
                              <td className="p-2.5 font-bold">{sIdx + 1}</td>
                              <td className="p-2.5 font-sans font-bold text-foreground">
                                {sub.name}
                                {sub.isOptional && (
                                  <Badge className="ml-2 bg-amber-500 text-white text-[9px] px-1.5 py-0">
                                    4th Subject
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2.5 text-center">{sub.totalMarks}</td>
                              {showComponentBreakdown && <td className="p-2.5 text-center text-muted-foreground">{sub.cqMarks}</td>}
                              {showComponentBreakdown && <td className="p-2.5 text-center text-muted-foreground">{sub.sqMarks}</td>}
                              {showComponentBreakdown && <td className="p-2.5 text-center text-muted-foreground">{sub.descMarks}</td>}
                              {showComponentBreakdown && <td className="p-2.5 text-center text-muted-foreground">{sub.objMarks}</td>}
                              <td className={`p-2.5 text-center font-bold ${isFailed ? 'text-rose-600' : ''}`}>{sub.totalEarned}</td>
                              <td className={`p-2.5 text-center font-semibold ${isFailed ? 'text-rose-600' : ''}`}>{sub.gp.toFixed(2)}</td>
                              <td className={`p-2.5 text-center font-black ${isFailed ? 'text-rose-600' : 'text-emerald-600'}`}>{sub.grade}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 4th Subject Bonus Point Breakdown */}
                  {row.optionalSubjects.length > 0 && (
                    <div className="mb-6 p-3 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                        <span>
                          <strong>ঐচ্ছিক (৪র্থ) বিষয়ের অতিরিক্ত পয়েন্ট:</strong>{" "}
                          {row.optionalSubjects.map(s => `${s.name} (GP: ${s.gp.toFixed(2)})`).join(", ")}
                        </span>
                      </div>
                      <span className="font-mono font-bold">
                        অতিরিক্ত বোনাস: +{row.optionalBonusGp.toFixed(2)} GP
                      </span>
                    </div>
                  )}

                  {/* Result Summary Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 border mb-10 print:bg-slate-100 print:text-slate-900 print:border-slate-900">
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Total Marks</span>
                      <p className="text-xl font-black">{row.grandTotalEarned} / {row.grandTotalMarks}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Grade Point Average</span>
                      <p className="text-xl font-black text-emerald-400 print:text-emerald-700">{row.finalGPA.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Letter Grade</span>
                      <p className="text-xl font-black text-emerald-400 print:text-emerald-700">{row.finalGrade}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Merit Position</span>
                      <p className="text-xl font-black text-amber-400 print:text-amber-700">{row.meritPosition}</p>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-3 gap-8 pt-10 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="border-t border-slate-400 dark:border-slate-600 pt-2">
                      Class Teacher
                    </div>
                    <div className="border-t border-slate-400 dark:border-slate-600 pt-2">
                      Exam Controller
                    </div>
                    <div className="border-t border-slate-400 dark:border-slate-600 pt-2">
                      Headmaster / Principal
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONFIGURATION & MANUAL SUBJECTS                                    */}
        {/* ========================================================================= */}
        {activeTab === "config" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
            {/* Subject Grouping Card */}
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-base font-bold">Joint Subject Groups (যৌথ বিষয়)</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsGroupModalOpen(true)}
                    className="h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Group
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  বাংলা ১ম ও ২য় পত্রের মতো বিষয়গুলো একসাথে গ্রুপ করুন (২০০ নম্বরে একক GPA গণনা)।
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjectGroups.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed rounded-xl text-muted-foreground text-xs">
                    কোনো বিষয় গ্রুপ করা হয়নি। "Add Group" বাটনে ক্লিক করে গ্রুপ তৈরি করুন।
                  </div>
                ) : (
                  subjectGroups.map(grp => {
                    const examsInGroup = availableExams.filter(e => grp.examIds.includes(e.id));
                    const totalMarks = examsInGroup.reduce((sum, e) => sum + e.totalMarks, 0);

                    return (
                      <div key={grp.id} className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-purple-950 dark:text-purple-200">{grp.name}</span>
                            <Badge className="bg-purple-600 text-white text-[10px]">{totalMarks} Marks</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            অন্তর্ভুক্ত বিষয়: {examsInGroup.map(e => e.name).join(" + ")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveGroup(grp.id)}
                          className="text-rose-500 hover:bg-rose-50 rounded-lg h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Manual Offline / External Subjects */}
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-amber-600" />
                    <CardTitle className="text-base font-bold">Manual / Offline Subjects</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsManualSubjectModalOpen(true)}
                    className="h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Subject
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  শারীরিক শিক্ষা, চারু ও কারুকলা বা মৌখিক পরীক্ষার নম্বর সরাসরি ইনপুট দিন।
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {manualSubjects.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed rounded-xl text-muted-foreground text-xs">
                    কোনো ম্যানুয়াল বিষয় যুক্ত করা হয়নি।
                  </div>
                ) : (
                  manualSubjects.map(m => (
                    <div key={m.id} className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-amber-950 dark:text-amber-200">{m.name}</span>
                          <Badge className="bg-amber-600 text-white text-[10px]">{m.totalMarks} Marks</Badge>
                          {m.isOptional && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-400">4th Sub</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          পাস মার্ক: {m.passMarks} • এন্ট্রি সংখ্যা: {Object.keys(m.marks).length}/{allStudents.length}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMarksEntrySubjectId(m.id)}
                          className="h-8 text-xs font-bold rounded-lg border-amber-300 hover:bg-amber-100"
                        >
                          Enter Marks
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveManualSubject(m.id)}
                          className="text-rose-500 hover:bg-rose-50 rounded-lg h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. Add Subject Group Modal */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              যৌথ বিষয় গ্রুপ তৈরি করুন (Subject Group)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                গ্রুপের নাম (Group Name)
              </label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. বাংলা (১ম ও ২য় পত্র)"
                className="rounded-xl h-9"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                গ্রুপের অন্তর্ভুক্ত বিষয় নির্বাচন করুন (কমপক্ষে ২টি)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-1 border rounded-xl">
                {availableExams.map(e => {
                  const isChecked = newGroupSelectedExams.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => {
                        setNewGroupSelectedExams(prev =>
                          isChecked ? prev.filter(id => id !== e.id) : [...prev, e.id]
                        );
                      }}
                      className={`p-2 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between ${
                        isChecked ? "bg-purple-100 text-purple-900 font-bold" : "hover:bg-slate-100"
                      }`}
                    >
                      <span>{e.name}</span>
                      <span className="text-[10px] text-muted-foreground">{e.totalMarks} Marks</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold">
              Save Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Add Manual Subject Modal */}
      <Dialog open={isManualSubjectModalOpen} onOpenChange={setIsManualSubjectModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-600" />
              ম্যানুয়াল / অফলাইন বিষয় যুক্ত করুন
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বিষয়ের নাম (Subject Name)
              </label>
              <Input
                value={newManualName}
                onChange={(e) => setNewManualName(e.target.value)}
                placeholder="e.g. শারীরিক শিক্ষা ও স্বাস্থ্য"
                className="rounded-xl h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">পূর্ণমান (Full Marks)</label>
                <Input
                  type="number"
                  value={newManualTotal}
                  onChange={(e) => setNewManualTotal(Number(e.target.value))}
                  className="rounded-xl h-9"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">পাস মার্ক (Pass Marks)</label>
                <Input
                  type="number"
                  value={newManualPass}
                  onChange={(e) => setNewManualPass(Number(e.target.value))}
                  className="rounded-xl h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="optCheck"
                checked={newManualIsOpt}
                onChange={(e) => setNewManualIsOpt(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="optCheck" className="text-xs font-bold cursor-pointer">
                এটি ঐচ্ছিক (৪র্থ বিষয়) হিসেবে গণ্য হবে
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualSubjectModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreateManualSubject} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Manual Marks Quick-Entry Modal */}
      {marksEntrySubjectId && (
        <Dialog open={!!marksEntrySubjectId} onOpenChange={() => setMarksEntrySubjectId(null)}>
          <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>
                  নম্বর ইনপুট: {manualSubjects.find(m => m.id === marksEntrySubjectId)?.name}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  (পূর্ণমান: {manualSubjects.find(m => m.id === marksEntrySubjectId)?.totalMarks})
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              {allStudents.map(s => {
                const currentMark = manualSubjects.find(m => m.id === marksEntrySubjectId)?.marks[s.id] ?? "";
                return (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold w-12 text-slate-500">Roll {s.roll}</span>
                      <span className="font-semibold text-foreground">{s.name}</span>
                    </div>
                    <Input
                      type="number"
                      value={currentMark}
                      onChange={(e) => handleUpdateManualMark(marksEntrySubjectId, s.id, Number(e.target.value))}
                      placeholder="0"
                      className="w-20 h-8 rounded-lg text-center font-bold font-mono"
                    />
                  </div>
                );
              })}
            </div>
            <DialogFooter className="pt-2">
              <Button onClick={() => setMarksEntrySubjectId(null)} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Print Specific Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            background: white !important;
            color: black !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .page-break-after-always {
            page-break-after: always;
            break-after: page;
          }
          .print\\:hidden {
            display: none !important;
          }
          .tabulation-sheet-wrapper {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function BulkResultPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-semibold">Loading Bulk Result Hub...</div>}>
      <BulkResultContent />
    </Suspense>
  );
}
