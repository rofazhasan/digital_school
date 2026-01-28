"use client";
import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, Plus, Trash2, LayoutDashboard, FileSpreadsheet, Upload, Download, AlertTriangle, ArrowRight, ArrowLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from 'xlsx';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const examTypes = ["ONLINE", "OFFLINE", "MIXED"];

// Schema for CQ subsection
const cqSubsectionSchema = z.object({
  name: z.string().min(1, "Subsection name is required"),
  startIndex: z.coerce.number().min(1, "Start index must be at least 1"),
  endIndex: z.coerce.number().min(1, "End index must be at least 1"),
  requiredQuestions: z.coerce.number().min(1, "Required questions must be at least 1"),
});

const schema = z.object({
  name: z.string().min(2, "Exam name is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  duration: z.coerce.number().min(1, "Duration is required"),
  type: z.enum(["ONLINE", "OFFLINE", "MIXED"]),
  totalMarks: z.coerce.number().min(1, "Total marks required"),
  passMarks: z.coerce.number().min(0, "Pass marks required"),
  classId: z.string().min(1, "Class is required"),
  allowRetake: z.boolean().optional(),
  instructions: z.string().optional(),
  mcqNegativeMarking: z.coerce.number().min(0).max(100).optional(),
  cqTotalQuestions: z.coerce.number().min(0).optional(),
  cqRequiredQuestions: z.coerce.number().min(0).optional(),
  sqTotalQuestions: z.coerce.number().min(0).optional(),
  sqRequiredQuestions: z.coerce.number().min(0).optional(),
  cqSubsections: z.array(cqSubsectionSchema).optional(),
}).refine((data) => {
  if (data.cqRequiredQuestions !== undefined && data.cqTotalQuestions !== undefined) {
    if (data.cqRequiredQuestions > data.cqTotalQuestions) {
      return false;
    }
  }
  if (data.sqRequiredQuestions !== undefined && data.sqTotalQuestions !== undefined) {
    if (data.sqRequiredQuestions > data.sqTotalQuestions) {
      return false;
    }
  }
  if (data.cqTotalQuestions && data.cqTotalQuestions > 0 && data.cqSubsections && data.cqSubsections.length > 0) {
    const sortedSubsections = [...data.cqSubsections].sort((a, b) => a.startIndex - b.startIndex);
    for (let i = 0; i < sortedSubsections.length; i++) {
      const current = sortedSubsections[i];
      if (current.startIndex > current.endIndex) return false;
      const availableQuestions = current.endIndex - current.startIndex + 1;
      if (current.requiredQuestions > availableQuestions) return false;
      if (i < sortedSubsections.length - 1) {
        const next = sortedSubsections[i + 1];
        if (current.endIndex >= next.startIndex) return false;
      }
    }
    const totalCovered = sortedSubsections.reduce((sum, sub) => sum + (sub.endIndex - sub.startIndex + 1), 0);
    if (data.cqTotalQuestions !== undefined && totalCovered !== data.cqTotalQuestions) return false;
  }
  return true;
}, {
  message: "Invalid question configuration. Check question counts and subsection ranges.",
  path: ["cqSubsections"]
});

type ExamForm = z.infer<typeof schema>;
type CQSubsection = z.infer<typeof cqSubsectionSchema>;
type ClassOption = { id: string; name: string };
type BulkExam = ExamForm & { validationError?: string; rowIndex: number; rawClassName?: string };

export default function CreateExamPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bulkExams, setBulkExams] = useState<BulkExam[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ExamForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      duration: 60,
      type: "OFFLINE",
      totalMarks: 100,
      passMarks: 33,
      classId: "",
      allowRetake: false,
      instructions: "",
      mcqNegativeMarking: 0,
      cqTotalQuestions: 8,
      cqRequiredQuestions: 5,
      sqTotalQuestions: 15,
      sqRequiredQuestions: 5,
      cqSubsections: [],
    },
  });

  const cqTotalQuestions = form.watch("cqTotalQuestions");
  const cqSubsections = form.watch("cqSubsections");

  useEffect(() => {
    if (cqTotalQuestions !== undefined) {
      const currentSubsections = form.getValues("cqSubsections") || [];
      if (cqTotalQuestions > 0) {
        if (currentSubsections.length === 0) {
          form.setValue("cqSubsections", [{
            name: "",
            startIndex: 1,
            endIndex: cqTotalQuestions,
            requiredQuestions: Math.min(5, cqTotalQuestions),
          }]);
        } else {
          if (currentSubsections.length === 1) {
            const updatedSubsections = [...currentSubsections];
            updatedSubsections[0].endIndex = cqTotalQuestions;
            form.setValue("cqSubsections", updatedSubsections);
          }
        }
      } else {
        if (currentSubsections.length > 0) form.setValue("cqSubsections", []);
      }
    }
  }, [cqTotalQuestions, form]);

  const addSubsection = () => {
    const currentSubsections = form.getValues("cqSubsections") || [];
    const lastSubsection = currentSubsections[currentSubsections.length - 1];
    if (lastSubsection && lastSubsection.endIndex < (cqTotalQuestions || 0)) {
      const newSubsection: CQSubsection = {
        name: "",
        startIndex: lastSubsection.endIndex + 1,
        endIndex: Math.min(lastSubsection.endIndex + 3, cqTotalQuestions || 0),
        requiredQuestions: 1,
      };
      form.setValue("cqSubsections", [...currentSubsections, newSubsection]);
    }
  };

  const removeSubsection = (index: number) => {
    const currentSubsections = form.getValues("cqSubsections") || [];
    if (currentSubsections.length > 1) {
      const updatedSubsections = currentSubsections.filter((_, i) => i !== index);
      form.setValue("cqSubsections", updatedSubsections);
    }
  };

  const updateSubsectionRanges = (index: number, field: 'startIndex' | 'endIndex', value: number) => {
    const currentSubsections = form.getValues("cqSubsections") || [];
    const updatedSubsections = [...currentSubsections];
    if (field === 'startIndex') {
      updatedSubsections[index].startIndex = value;
      if (index > 0) updatedSubsections[index - 1].endIndex = value - 1;
    } else if (field === 'endIndex') {
      updatedSubsections[index].endIndex = value;
      if (index < updatedSubsections.length - 1) updatedSubsections[index + 1].startIndex = value + 1;
    }
    form.setValue("cqSubsections", updatedSubsections);
  };

  useEffect(() => {
    setClassesLoading(true);
    fetch("/api/classes")
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch classes');
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.classes)) setClasses(data.classes);
        else setClasses([]);
      })
      .catch((error) => {
        console.error('Error fetching classes:', error);
        setClasses([]);
        toast({ title: "Error", description: "Failed to load classes.", variant: "destructive" });
      })
      .finally(() => setClassesLoading(false));
  }, [toast]);

  const onSubmit = async (data: ExamForm) => {
    if (classes.length === 0) {
      toast({ title: "Error", description: "No classes available.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || result.error || "Failed to create exam");
      }

      setSuccess(true);
      toast({ title: "Success", description: "Exam created successfully!", variant: "default" });
      setTimeout(() => router.push("/exams"), 1500);
    } catch (error: any) {
      console.error("Bulk create error:", error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create exams. Please check your data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Bulk Import Helpers ---

  const downloadSample = () => {
    const headers = [
      "Exam Name",
      "Select Class",
      "Description",
      "Date (e.g. 2026-10-15)",
      "Start Time (e.g. 2026-10-15 10:00)",
      "End Time (e.g. 2026-10-15 13:00)",
      "Duration (mins)",
      "Type",
      "Total Marks",
      "Pass Marks",
      "Instructions",
      "MCQ Negative Marking (%)",
      "CQ Total",
      "CQ Required",
      "SQ Total",
      "SQ Required",
      // Subsection 1
      "Sub 1 Name",
      "Sub 1 Start",
      "Sub 1 End",
      "Sub 1 Required",
      // Subsection 2
      "Sub 2 Name",
      "Sub 2 Start",
      "Sub 2 End",
      "Sub 2 Required"
    ];

    const sampleData = [
      "Mid Term Math",
      classes[0]?.name || "Class 9",
      "Mid term examination for mathematics",
      "2026-10-15",
      "2026-10-15 10:00",
      "2026-10-15 13:00",
      180,
      "OFFLINE",
      100,
      33,
      "Answer all questions carefully.",
      0.25,
      8,
      5,
      15,
      10,
      "Algebra", 1, 3, 2, // Sub 1
      "Geometry", 4, 8, 3 // Sub 2
    ];

    const wb = XLSX.utils.book_new();

    // Template Sheet
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleData]);
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Valid Classes Reference Sheet
    const classHeaders = ["Available Classes", "ID (System Use)"];
    const classRows = classes.map(c => [c.name, c.id]);
    const wsClasses = XLSX.utils.aoa_to_sheet([classHeaders, ...classRows]);
    XLSX.utils.book_append_sheet(wb, wsClasses, "Classes (Reference)");

    XLSX.writeFile(wb, "exam_import_template_v3.xlsx");
  };

  const parseExcelDate = (dateVal: any): string => {
    if (!dateVal) return "";

    // 1. Handle Excel Serial Date
    if (typeof dateVal === 'number') {
      const d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split('T')[0];
    }

    // 2. Handle Strings
    if (typeof dateVal === 'string') {
      const str = dateVal.trim();

      // Try strictly parsing ISO date (YYYY-MM-DD)
      // If it contains time (T or space), split it
      if (str.includes('T')) return str.split('T')[0];

      // Split by common separators
      const parts = str.split(/[\/\-\s]+/); // added \s to handle space separator if any

      if (parts.length >= 3) {
        // Check for YYYY-MM-DD (first part > 31)
        if (parseInt(parts[0]) > 31) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        // Check for DD/MM/YYYY
        // This is ambiguous: 01/02/2026. Assuming DD/MM/YYYY based on common usage in this context
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      // Fallback: Date.parse
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        return new Date(parsed).toISOString().split('T')[0];
      }
    }
    return "";
  };

  const parseTime = (dateStr: string, timeStr: any): string => {
    if (!dateStr && !timeStr) return "";

    let hours = 0;
    let minutes = 0;
    let isValid = false;

    if (typeof timeStr === 'number') {
      const totalSeconds = Math.round(timeStr * 86400);
      hours = Math.floor(totalSeconds / 3600) % 24;
      minutes = Math.floor((totalSeconds % 3600) / 60);
      isValid = true;
    } else if (timeStr) {
      const str = String(timeStr).trim();
      if (!str || str.includes("--")) return "";

      const simpleMatch = str.match(/^(\d{1,2}):(\d{2})/);
      if (simpleMatch) {
        hours = parseInt(simpleMatch[1]);
        minutes = parseInt(simpleMatch[2]);
        isValid = true;
      } else {
        const parsed = Date.parse(str);
        if (!isNaN(parsed)) {
          const d = new Date(parsed);
          hours = d.getHours();
          minutes = d.getMinutes();
          isValid = true;
        }
      }
    }

    if (!isValid) return "";

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');

    if (!dateStr) return "";
    return `${dateStr}T${hh}:${mm}:00`;
  };

  // Helper to validate and reconstruct a bulk exam object
  const validateBulkExam = (exam: any, index: number, rawClassName: string): BulkExam => {
    let error = "";

    // Match class
    let matchedClass = classes.find(c => c.id === exam.classId);
    if (!matchedClass && rawClassName) {
      matchedClass = classes.find(c => c.name.toLowerCase() === String(rawClassName).toLowerCase() || c.id === rawClassName);
      if (matchedClass) {
        exam.classId = matchedClass.id;
      }
    }

    if (!matchedClass) error = `Class '${rawClassName}' not found.`;

    // Date validations
    const dateValid = !isNaN(Date.parse(exam.date));
    if (!dateValid || !exam.date) error += (error ? " " : "") + "Invalid Date.";

    const startValid = !isNaN(Date.parse(exam.startTime));
    if (!startValid || !exam.startTime) error += (error ? " " : "") + "Invalid Start Time.";

    const endValid = !isNaN(Date.parse(exam.endTime));
    if (!endValid || !exam.endTime) error += (error ? " " : "") + "Invalid End Time.";

    if (exam.duration <= 0) error += (error ? " " : "") + "Invalid Duration.";

    return { ...exam, validationError: error, rowIndex: index, rawClassName: rawClassName };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const parsedExams: BulkExam[] = data.map((row: any, index: number) => {
        const className = row["Select Class"] || row["Class"] || "";
        const dateStr = parseExcelDate(row["Date (DD/MM/YYYY)"] || row["Date"]);
        const startTimeStr = parseTime(dateStr, row["Start Time (HH:mm)"] || row["Start Time"]);
        const endTimeStr = parseTime(dateStr, row["End Time (HH:mm)"] || row["End Time"]);

        // Parse subsections
        const subsections: any[] = [];
        // Sub 1
        if (row["Sub 1 Name"]) {
          subsections.push({
            name: row["Sub 1 Name"],
            startIndex: Number(row["Sub 1 Start"] || 1),
            endIndex: Number(row["Sub 1 End"] || 1),
            requiredQuestions: Number(row["Sub 1 Required"] || 1)
          });
        }
        // Sub 2
        if (row["Sub 2 Name"]) {
          subsections.push({
            name: row["Sub 2 Name"],
            startIndex: Number(row["Sub 2 Start"] || 1),
            endIndex: Number(row["Sub 2 End"] || 1),
            requiredQuestions: Number(row["Sub 2 Required"] || 1)
          });
        }

        const exam: any = {
          name: row["Exam Name"] || `Exam ${index + 1}`,
          description: row["Description"] || "",
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          duration: Number(row["Duration (mins)"] || row["Duration"] || 60),
          type: (row["Type"] || "OFFLINE").toUpperCase(), // Normalized
          totalMarks: Number(row["Total Marks"] || 100),
          passMarks: Number(row["Pass Marks"] || 33),
          classId: "", // Will be resolved in validation
          allowRetake: false,
          instructions: row["Instructions"] || "",
          mcqNegativeMarking: Number(row["MCQ Negative Marking (%)"] || 0),
          cqTotalQuestions: Number(row["CQ Total"] || 8),
          cqRequiredQuestions: Number(row["CQ Required"] || 5),
          sqTotalQuestions: Number(row["SQ Total"] || 15),
          sqRequiredQuestions: Number(row["SQ Required"] || 5),
          cqSubsections: subsections
        };

        return validateBulkExam(exam, index, className);
      });

      setBulkExams(parsedExams);
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
  };

  const handleCellChange = (index: number, field: keyof ExamForm | 'rawClassName', value: any) => {
    const updatedExams = [...bulkExams];
    const currentExam = { ...updatedExams[index] };

    // Handle specific field logic
    if (field === 'rawClassName') {
      currentExam.rawClassName = value;
      // Try to re-match class ID immediately
      const matched = classes.find(c => c.name === value || c.id === value);
      if (matched) currentExam.classId = matched.id;
      else currentExam.classId = "";
    } else if (field === "date") {
      // If date changes, we must try to repair start/end time dates too if they existed
      currentExam[field] = value;
      // Extract time component from existing start/end and re-attach new date
      if (currentExam.startTime && currentExam.startTime.includes('T')) {
        const timePart = currentExam.startTime.split('T')[1];
        currentExam.startTime = `${value}T${timePart}`;
      }
      if (currentExam.endTime && currentExam.endTime.includes('T')) {
        const timePart = currentExam.endTime.split('T')[1];
        currentExam.endTime = `${value}T${timePart}`;
      }
    } else {
      (currentExam as any)[field] = value;
    }

    // Re-validate
    updatedExams[index] = validateBulkExam(currentExam, index, currentExam.rawClassName || "");
    setBulkExams(updatedExams);
  };

  const submitBulk = async () => {
    const validExams = bulkExams.filter(e => !e.validationError);
    if (validExams.length === 0) {
      toast({ title: "Error", description: "No valid exams to import.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/exams/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validExams)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || "Bulk import failed");
      toast({ title: "Success", description: `Imported ${result.data?.count || validExams.length} exams.`, variant: "default" });
      setTimeout(() => router.push("/exams"), 1200);
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-10 px-2 relative">
      <div className="absolute top-4 left-4 flex gap-2">
        <Button variant="ghost" className="gap-2 text-gray-600" onClick={() => router.push("/dashboard")}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Button>
        <Button variant="ghost" className="gap-2 text-gray-600" onClick={() => router.push("/exams")}>
          <ArrowLeft className="w-4 h-4" /> Go to Exams
        </Button>
      </div>

      <div className="absolute top-4 right-4">
        <Button variant="outline" className="gap-2" onClick={() => router.push("/question-bank")}>
          <BookOpen className="w-4 h-4" /> Question Bank <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, type: "spring" }} className="w-full max-w-5xl">
        <div className="rounded-2xl shadow-2xl border border-border bg-white/90 dark:bg-gray-900/90 backdrop-blur-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-blue-500 p-6 text-white text-center">
            <h1 className="text-3xl font-bold tracking-tight">Create New Exam</h1>
            <p className="text-sm opacity-80 mt-1">Schedule exams individually or bulk import</p>
          </div>
          <div className="p-8">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="single">Single Exam</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Import (Excel)</TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <AnimatePresence>
                  {success ? (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                      <div className="text-xl font-semibold mb-2">Exam Created!</div>
                      <div className="text-gray-500">Redirecting...</div>
                    </motion.div>
                  ) : (
                    <FormProvider {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="name" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Exam Name</FormLabel><FormControl><Input placeholder="Exam name" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="classId" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Class</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange} disabled={classesLoading}>
                                <SelectTrigger><SelectValue placeholder={classesLoading ? "Loading..." : "Select class"} /></SelectTrigger>
                                <SelectContent>
                                  {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField name="description" control={form.control} render={({ field }) => (
                          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        {/* Time & Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="date" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="duration" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Duration (mins)</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="startTime" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="endTime" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="type" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Type</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{examTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                              </Select>
                              <FormMessage /></FormItem>
                          )} />
                          <FormField name="totalMarks" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Total Marks</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField name="passMarks" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Pass Marks</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField name="allowRetake" control={form.control} render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 mt-6"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="mb-0">Allow Retake</FormLabel></FormItem>
                          )} />
                        </div>
                        <FormField name="instructions" control={form.control} render={({ field }) => (
                          <FormItem><FormLabel>Instructions</FormLabel><FormControl><Textarea placeholder="Instructions" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        {/* Settings */}
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-semibold">Negative Marking</h3>
                          <FormField name="mcqNegativeMarking" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>MCQ % Deducted</FormLabel><FormControl><Input type="number" step={0.25} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-semibold">Questions</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Creative (CQ)</h4>
                              <div className="flex gap-2">
                                <FormField name="cqTotalQuestions" control={form.control} render={({ field }) => (
                                  <FormItem className="flex-1"><FormLabel>Total</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField name="cqRequiredQuestions" control={form.control} render={({ field }) => (
                                  <FormItem className="flex-1"><FormLabel>Required</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Short (SQ)</h4>
                              <div className="flex gap-2">
                                <FormField name="sqTotalQuestions" control={form.control} render={({ field }) => (
                                  <FormItem className="flex-1"><FormLabel>Total</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField name="sqRequiredQuestions" control={form.control} render={({ field }) => (
                                  <FormItem className="flex-1"><FormLabel>Required</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {cqTotalQuestions && cqTotalQuestions > 0 && (
                          <div className="space-y-4 border-t pt-4">
                            <div className="flex justify-between items-center"><h3 className="font-semibold">CQ Subsections</h3><Button type="button" size="sm" variant="outline" onClick={addSubsection}><Plus className="w-4 h-4" /> Add</Button></div>
                            {cqSubsections?.map((sub, i) => (
                              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border grid grid-cols-4 gap-2 text-sm relative">
                                <Button type="button" size="sm" variant="ghost" className="absolute right-1 top-1 h-6 w-6 p-0 text-red-500" onClick={() => removeSubsection(i)}><Trash2 className="w-3 h-3" /></Button>
                                <FormField name={`cqSubsections.${i}.name`} control={form.control} render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input className="h-8" {...field} /></FormControl></FormItem>} />
                                <FormField name={`cqSubsections.${i}.startIndex`} control={form.control} render={({ field }) => <FormItem><FormLabel>Start</FormLabel><FormControl><Input className="h-8" type="number" {...field} onChange={e => { field.onChange(parseInt(e.target.value)); updateSubsectionRanges(i, 'startIndex', parseInt(e.target.value)) }} /></FormControl></FormItem>} />
                                <FormField name={`cqSubsections.${i}.endIndex`} control={form.control} render={({ field }) => <FormItem><FormLabel>End</FormLabel><FormControl><Input className="h-8" type="number" {...field} onChange={e => { field.onChange(parseInt(e.target.value)); updateSubsectionRanges(i, 'endIndex', parseInt(e.target.value)) }} /></FormControl></FormItem>} />
                                <FormField name={`cqSubsections.${i}.requiredQuestions`} control={form.control} render={({ field }) => <FormItem><FormLabel>Req</FormLabel><FormControl><Input className="h-8" type="number" {...field} /></FormControl></FormItem>} />
                              </div>
                            ))}
                          </div>
                        )}

                        <Button type="submit" className="w-full bg-primary" disabled={loading}>{loading ? "Creating..." : "Create Exam"}</Button>
                      </form>
                    </FormProvider>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                  <h3 className="font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <FileSpreadsheet className="w-5 h-5" /> Bulk Import Instructions
                  </h3>
                  <p className="text-sm mt-2 text-blue-700 dark:text-blue-400">
                    1. Download Sample. 2. Fill Data (Use "Classes" sheet for reference). 3. Upload. 4. <strong>Edit errors directly in table below.</strong>
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 gap-2 border-blue-200" onClick={downloadSample}>
                    <Download className="w-4 h-4" /> Download Sample
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-base font-medium text-gray-700 dark:text-gray-300">Upload Filled Excel File</span>
                  </label>
                </div>

                {bulkExams.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Preview & Edit ({bulkExams.length})</h3>
                      {bulkExams.some(e => e.validationError) ? (
                        <Badge variant="destructive" className="gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" /> Errors Found</Badge>
                      ) : <Badge variant="default" className="bg-green-500 gap-1"><CheckCircle className="w-3 h-3" /> Ready</Badge>}
                    </div>

                    <div className="border rounded-lg overflow-x-auto max-h-[500px]">
                      <Table className="min-w-[1000px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead className="w-[180px]">Exam Name</TableHead>
                            <TableHead className="w-[150px]">Class</TableHead>
                            <TableHead className="w-[140px]">Date</TableHead>
                            <TableHead className="w-[100px]">Dur.(m)</TableHead>
                            <TableHead className="w-[120px]">Type</TableHead>
                            <TableHead className="min-w-[200px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkExams.map((exam, i) => (
                            <TableRow key={i} className={exam.validationError ? "bg-red-50 dark:bg-red-900/10" : ""}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell>
                                <Input className="h-8" value={exam.name} onChange={(e) => handleCellChange(i, 'name', e.target.value)} />
                              </TableCell>
                              <TableCell>
                                <Select value={exam.rawClassName} onValueChange={(val) => handleCellChange(i, 'rawClassName', val)}>
                                  <SelectTrigger className="h-8 w-full"><SelectValue placeholder="Class" /></SelectTrigger>
                                  <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input className="h-8" type="date" value={exam.date} onChange={(e) => handleCellChange(i, 'date', e.target.value)} />
                              </TableCell>
                              <TableCell>
                                <Input className="h-8 w-16" type="number" value={exam.duration} onChange={(e) => handleCellChange(i, 'duration', parseInt(e.target.value) || 0)} />
                              </TableCell>
                              <TableCell>
                                <Select value={exam.type} onValueChange={(val) => handleCellChange(i, 'type', val as any)}>
                                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                  <SelectContent>{examTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                {exam.validationError ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger className="text-left text-xs text-red-600 font-medium truncate max-w-[200px] block cursor-help">
                                        {exam.validationError}
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-red-600 text-white border-red-700">
                                        {exam.validationError}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Valid</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                      disabled={loading || bulkExams.some(e => !!e.validationError)} onClick={submitBulk}>
                      {loading ? "Importing..." : `Create ${bulkExams.length} Exams Now`}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  );
}