"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileSpreadsheet,
  BrainCircuit,
  FileText,
  Upload,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Save,
  Layers,
  Check,
  X,
  Loader2,
  Info,
  Edit,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import { cleanupMath } from "@/lib/utils";
import { triggerHaptic, ImpactStyle } from "@/lib/haptics";

export type QuestionType = 'MCQ' | 'CQ' | 'SQ' | 'INT' | 'AR' | 'MTF' | 'MC' | 'DESCRIPTIVE' | 'SMCQ' | 'CMA' | 'MPC';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface StagedQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  subject: string;
  marks: number;
  difficulty: Difficulty;
  tags?: string[];
  hasMath?: boolean;
  className?: string;
  classId?: string | null;
  options?: Array<{ text: string; isCorrect: boolean; explanation?: string }>;
  modelAnswer?: string;
  explanation?: string;
  assertion?: string;
  reason?: string;
  correctOption?: number;
  leftColumn?: Array<{ id: string; text: string }>;
  rightColumn?: Array<{ id: string; text: string }>;
  matches?: Record<string, string>;
  subQuestions?: any[];
  sub_questions?: any[];
  parts?: any[];
  topic?: string;
  isValid?: boolean;
  error?: string;
}

interface BulkAddExamQuestionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exam: {
    id: string;
    name: string;
    totalMarks: number;
    cqTotalQuestions?: number;
    cqRequiredQuestions?: number;
    sqTotalQuestions?: number;
    sqRequiredQuestions?: number;
    mcqNegativeMarking?: number;
    class?: { id?: string; name: string; section?: string };
  };
  onAddQuestionsToSet: (questions: any[]) => void;
  onQuestionsPermanentlySaved?: () => void;
}

export function BulkAddExamQuestionsDialog({
  isOpen,
  onOpenChange,
  exam,
  onAddQuestionsToSet,
  onQuestionsPermanentlySaved
}: BulkAddExamQuestionsDialogProps) {
  const [inputType, setInputType] = useState<'file' | 'json' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<StagedQuestion[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string; section?: string }[]>([]);
  const [showMathPreview, setShowMathPreview] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        if (res.ok) {
          const data = await res.json();
          setAvailableClasses(data.classes || []);
        }
      } catch (err) {
        console.error("Failed to fetch classes", err);
      }
    };
    fetchClasses();
  }, []);

  // Default subject/class based on exam
  const defaultClassName = useMemo(() => {
    if (exam.class?.name) {
      return exam.class.section ? `${exam.class.name} - ${exam.class.section}` : exam.class.name;
    }
    return availableClasses[0]?.name || "Class 10";
  }, [exam, availableClasses]);

  const defaultSubject = useMemo(() => {
    // Attempt to extract subject name from exam name (e.g. "Physics 1st Paper" -> "Physics")
    const words = exam.name.split(" ");
    return words[0] || "General";
  }, [exam.name]);

  const sampleJson = [
    {
      "questionText": "What is Newton's Second Law of Motion?",
      "type": "MCQ",
      "marks": 1,
      "difficulty": "EASY",
      "subject": defaultSubject,
      "className": defaultClassName,
      "options": [
        { "text": "$$F = ma$$", "isCorrect": true, "explanation": "Force is product of mass and acceleration." },
        { "text": "$$F = m/a$$", "isCorrect": false },
        { "text": "$$F = mv$$", "isCorrect": false },
        { "text": "$$F = m/v$$", "isCorrect": false }
      ]
    },
    {
      "questionText": "Select all prime numbers less than 10.",
      "type": "MC",
      "marks": 4,
      "difficulty": "MEDIUM",
      "subject": defaultSubject,
      "className": defaultClassName,
      "options": [
        { "text": "$$2$$", "isCorrect": true },
        { "text": "$$3$$", "isCorrect": true },
        { "text": "$$5$$", "isCorrect": true },
        { "text": "$$7$$", "isCorrect": true },
        { "text": "$$9$$", "isCorrect": false }
      ]
    },
    {
      "type": "INT",
      "questionText": "Calculate the value of $$5!$$ (factorial of 5).",
      "marks": 2,
      "difficulty": "EASY",
      "subject": defaultSubject,
      "className": defaultClassName,
      "modelAnswer": "120"
    },
    {
      "type": "CQ",
      "questionText": "A 10kg mass is pulled across a frictionless surface with a 50N force.",
      "marks": 10,
      "difficulty": "HARD",
      "subject": defaultSubject,
      "className": defaultClassName,
      "subQuestions": [
        { "question": "Define acceleration.", "marks": 2, "modelAnswer": "Rate of change of velocity." },
        { "question": "Calculate the acceleration of the mass.", "marks": 4, "modelAnswer": "a = F/m = 50/10 = 5 m/s²." },
        { "question": "Find the distance traveled in 4 seconds starting from rest.", "marks": 4, "modelAnswer": "s = 0.5 * 5 * 16 = 40m." }
      ]
    },
    {
      "type": "SQ",
      "questionText": "State the principle of conservation of energy.",
      "marks": 2,
      "difficulty": "MEDIUM",
      "subject": defaultSubject,
      "className": defaultClassName,
      "modelAnswer": "Energy cannot be created or destroyed, only transformed from one form to another."
    }
  ];

  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(sampleJson, null, 2));
    toast.success("Sample JSON template loaded.");
  };

  const handleLoadSampleText = () => {
    const sampleText = `1. What is the SI unit of electric force? [1M]
A) Newton (Correct)
B) Joule
C) Watt
D) Pascal
Explanation: Force is measured in Newtons (N).

2. Select all primary colors of light. [2M]
A) Red (Correct)
B) Green (Correct)
C) Blue (Correct)
D) Yellow

3. Calculate the resistance of a 100W bulb at 200V. [2M] [INT]
Answer: 400

4. State Archimedes' principle. [2M] [SQ]
Answer: Any body completely or partially submerged in a fluid at rest is acted upon by an upward force equal to the weight of fluid displaced.`;
    setTextInput(sampleText);
    toast.success("Sample plain text questions loaded.");
  };

  // Quick plain text parser
  const parsePlainText = (text: string): StagedQuestion[] => {
    const blocks = text.split(/\n\s*(?=\d+[\.\)])/).filter(b => b.trim());
    const parsed: StagedQuestion[] = [];

    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      const firstLine = lines[0].replace(/^\d+[\.\)]\s*/, '');
      let marks = 1;
      const marksMatch = firstLine.match(/\[(\d+)\s*M\]/i);
      if (marksMatch) {
        marks = parseInt(marksMatch[1]);
      }

      let type: QuestionType = 'MCQ';
      if (/\[INT\]/i.test(firstLine)) type = 'INT';
      else if (/\[SQ\]/i.test(firstLine)) type = 'SQ';
      else if (/\[CQ\]/i.test(firstLine)) type = 'CQ';
      else if (/\[AR\]/i.test(firstLine)) type = 'AR';
      else if (/\[MTF\]/i.test(firstLine)) type = 'MTF';
      else if (/\[MC\]/i.test(firstLine)) type = 'MC';

      const questionText = firstLine.replace(/\[.*?\]/g, '').trim();
      const options: Array<{ text: string; isCorrect: boolean; explanation?: string }> = [];
      let modelAnswer = "";
      let explanation = "";

      lines.slice(1).forEach(line => {
        if (/^(?:A|B|C|D|E|a|b|c|d|e)[\)\.]/i.test(line)) {
          const isCorrect = /\(correct\)/i.test(line) || /\*/.test(line);
          const optText = line.replace(/^[A-Ea-e][\)\.]\s*/, '').replace(/\(correct\)/gi, '').replace(/\*/g, '').trim();
          options.push({ text: optText, isCorrect });
        } else if (/^Answer:\s*/i.test(line)) {
          modelAnswer = line.replace(/^Answer:\s*/i, '').trim();
        } else if (/^Explanation:\s*/i.test(line)) {
          explanation = line.replace(/^Explanation:\s*/i, '').trim();
        }
      });

      if (options.length > 0 && options.filter(o => o.isCorrect).length > 1) {
        type = 'MC';
      }

      parsed.push({
        id: `bulk_staged_${Date.now()}_${idx}`,
        questionText: questionText || `Question ${idx + 1}`,
        type,
        marks,
        difficulty: 'MEDIUM',
        subject: defaultSubject,
        className: defaultClassName,
        options: options.length > 0 ? options : undefined,
        modelAnswer: modelAnswer || undefined,
        explanation: explanation || undefined,
        hasMath: /\\/.test(questionText) || options.some(o => /\\/.test(o.text)),
        isValid: true
      });
    });

    return parsed;
  };

  const handleParseText = () => {
    if (!textInput.trim()) {
      toast.error("Please paste question text.");
      return;
    }
    const result = parsePlainText(textInput);
    if (result.length === 0) {
      toast.error("Could not recognize question format. Please check the sample.");
      return;
    }
    setPreviewQuestions(result);
    setIsPreviewMode(true);
    toast.success(`Successfully parsed ${result.length} questions.`);
  };

  const handleParseJson = () => {
    try {
      if (!jsonInput.trim()) return;
      const parsed = JSON.parse(jsonInput);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];

      const staged: StagedQuestion[] = dataArray.map((item, idx) => {
        let qType: QuestionType = item.type || 'MCQ';
        let marks = Number(item.marks) || 1;

        return {
          id: `bulk_json_${Date.now()}_${idx}`,
          questionText: item.questionText || item.question || item.title || "",
          type: qType,
          marks,
          difficulty: item.difficulty || 'MEDIUM',
          subject: item.subject || defaultSubject,
          className: item.className || defaultClassName,
          classId: item.classId || null,
          options: Array.isArray(item.options) ? item.options : undefined,
          modelAnswer: item.modelAnswer || item.correctAnswer || undefined,
          explanation: item.explanation || undefined,
          assertion: item.assertion || undefined,
          reason: item.reason || undefined,
          correctOption: item.correctOption || undefined,
          leftColumn: item.leftColumn || undefined,
          rightColumn: item.rightColumn || undefined,
          matches: item.matches || undefined,
          subQuestions: item.subQuestions || item.sub_questions || undefined,
          parts: item.parts || undefined,
          topic: item.topic || undefined,
          hasMath: Boolean(
            /\\/.test(String(item.questionText || '')) ||
            (Array.isArray(item.options) && item.options.some((o: any) => /\\/.test(String(o.text || o))))
          ),
          isValid: Boolean(item.questionText || item.assertion)
        };
      });

      setPreviewQuestions(staged);
      setIsPreviewMode(true);
      toast.success(`Parsed ${staged.length} questions from JSON.`);
    } catch {
      toast.error("Invalid JSON format. Please verify syntax.");
    }
  };

  const handleUploadFile = async () => {
    if (!file) {
      toast.error("Please select an Excel (.xlsx) file.");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/question-bank/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Preview failed');
      }

      const data = await response.json();
      if (data.mode === 'preview' && Array.isArray(data.rows)) {
        const mapped: StagedQuestion[] = data.rows.map((r: any, idx: number) => {
          const q = r.data || r;
          return {
            id: `bulk_excel_${Date.now()}_${idx}`,
            questionText: q.questionText || "",
            type: q.type || 'MCQ',
            marks: Number(q.marks) || 1,
            difficulty: q.difficulty || 'MEDIUM',
            subject: q.subject || defaultSubject,
            className: q.className || defaultClassName,
            classId: q.classId || null,
            options: q.options || undefined,
            modelAnswer: q.modelAnswer || undefined,
            explanation: q.explanation || undefined,
            assertion: q.assertion || undefined,
            reason: q.reason || undefined,
            correctOption: q.correctOption || undefined,
            leftColumn: q.leftColumn || undefined,
            rightColumn: q.rightColumn || undefined,
            matches: q.matches || undefined,
            subQuestions: q.subQuestions || undefined,
            topic: q.topic || undefined,
            hasMath: Boolean(
              /\\/.test(String(q.questionText || '')) ||
              (Array.isArray(q.options) && q.options.some((o: any) => /\\/.test(String(o.text || ''))))
            ),
            isValid: r.isValid !== false,
            error: r.error
          };
        });

        setPreviewQuestions(mapped);
        setIsPreviewMode(true);
        toast.success(`Loaded ${mapped.length} questions from Excel.`);
      } else {
        toast.info("Excel processed successfully.");
      }
    } catch (error: any) {
      console.error("Bulk upload preview error:", error);
      toast.error(error.message || "Failed to process Excel file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditRow = (idx: number, field: keyof StagedQuestion, value: any) => {
    setPreviewQuestions(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleRemoveRow = (idx: number) => {
    setPreviewQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddManualRow = () => {
    const newQ: StagedQuestion = {
      id: `bulk_manual_${Date.now()}`,
      questionText: "New Question Text",
      type: "MCQ",
      marks: 1,
      difficulty: "MEDIUM",
      subject: defaultSubject,
      className: defaultClassName,
      options: [
        { text: "Option A", isCorrect: true },
        { text: "Option B", isCorrect: false },
        { text: "Option C", isCorrect: false },
        { text: "Option D", isCorrect: false }
      ],
      isValid: true
    };
    setPreviewQuestions(prev => [...prev, newQ]);
  };

  // Metrics
  const batchTotalMarks = useMemo(() => {
    return previewQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
  }, [previewQuestions]);

  const batchCounts = useMemo(() => {
    const cq = previewQuestions.filter(q => q.type === 'CQ').length;
    const sq = previewQuestions.filter(q => q.type === 'SQ').length;
    const mcq = previewQuestions.filter(q => ['MCQ', 'MC', 'AR', 'INT', 'MTF', 'SMCQ', 'DESCRIPTIVE', 'CMA', 'MPC'].includes(q.type)).length;
    return { cq, sq, mcq, total: previewQuestions.length };
  }, [previewQuestions]);

  // ACTION 1: Send directly to Set Builder only
  const handleSendToSetOnly = () => {
    if (previewQuestions.length === 0) {
      toast.error("No questions in batch to add.");
      return;
    }

    triggerHaptic(ImpactStyle.Medium);

    // Normalize for set builder
    const formatted = previewQuestions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      type: q.type,
      subject: q.subject || defaultSubject,
      marks: Number(q.marks) || 1,
      difficulty: q.difficulty || 'MEDIUM',
      tags: q.tags || [],
      hasMath: Boolean(q.hasMath),
      options: q.options,
      modelAnswer: q.modelAnswer,
      explanation: q.explanation,
      assertion: q.assertion,
      reason: q.reason,
      correctOption: q.correctOption,
      leftColumn: q.leftColumn,
      rightColumn: q.rightColumn,
      matches: q.matches,
      subQuestions: q.subQuestions,
      sub_questions: q.sub_questions || q.subQuestions,
      parts: q.parts,
      topic: q.topic
    }));

    onAddQuestionsToSet(formatted);
    toast.success(`⚡ Staged ${formatted.length} questions directly into Set Builder!`);
    onOpenChange(false);
    resetState();
  };

  // ACTION 2: Save permanently in Question Bank & Send to Set Builder
  const handleSaveAndSendToSet = async () => {
    if (previewQuestions.length === 0) {
      toast.error("No questions in batch to save.");
      return;
    }

    setIsProcessing(true);
    triggerHaptic(ImpactStyle.Heavy);

    try {
      const payloadQuestions = previewQuestions.map(q => {
        // Resolve class ID if needed
        let resolvedClassId = q.classId;
        if (!resolvedClassId && q.className) {
          const found = availableClasses.find(c =>
            c.name.toLowerCase() === q.className?.toLowerCase() ||
            `${c.name} - ${c.section}`.toLowerCase() === q.className?.toLowerCase()
          );
          resolvedClassId = found?.id || exam.class?.id || null;
        }

        return {
          questionText: q.questionText,
          type: q.type,
          subject: q.subject || defaultSubject,
          topic: q.topic,
          difficulty: q.difficulty || 'MEDIUM',
          marks: Number(q.marks) || 1,
          className: q.className || defaultClassName,
          classId: resolvedClassId,
          options: q.options,
          subQuestions: q.subQuestions,
          modelAnswer: q.modelAnswer,
          explanation: q.explanation,
          assertion: q.assertion,
          reason: q.reason,
          correctOption: q.correctOption,
          leftColumn: q.leftColumn,
          rightColumn: q.rightColumn,
          matches: q.matches
        };
      });

      const response = await fetch('/api/question-bank/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: payloadQuestions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save questions to database.');
      }

      const result = await response.json();

      // Format for set builder
      const formatted = previewQuestions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        type: q.type,
        subject: q.subject || defaultSubject,
        marks: Number(q.marks) || 1,
        difficulty: q.difficulty || 'MEDIUM',
        tags: q.tags || [],
        hasMath: Boolean(q.hasMath),
        options: q.options,
        modelAnswer: q.modelAnswer,
        explanation: q.explanation,
        assertion: q.assertion,
        reason: q.reason,
        correctOption: q.correctOption,
        leftColumn: q.leftColumn,
        rightColumn: q.rightColumn,
        matches: q.matches,
        subQuestions: q.subQuestions,
        sub_questions: q.sub_questions || q.subQuestions,
        parts: q.parts,
        topic: q.topic
      }));

      onAddQuestionsToSet(formatted);
      onQuestionsPermanentlySaved?.();

      toast.success(`💾 Permanently saved ${result.success || formatted.length} questions to Q-Bank and added to Set Builder!`);
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      console.error("Save and send error:", error);
      toast.error(error.message || "Failed to permanently save questions.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setJsonInput('');
    setTextInput('');
    setPreviewQuestions([]);
    setIsPreviewMode(false);
    setIsProcessing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) resetState(); }}>
      <DialogContent className="max-w-5xl rounded-3xl p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <DialogTitle className="text-xl font-black tracking-tight text-foreground">
                Bulk Add Questions to Exam
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pl-10 font-medium">
              Import questions in bulk via Excel, JSON, or Text. Directly stage them into set generation or permanently save to Question Bank.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/80 dark:bg-slate-900/80 text-xs font-bold border-indigo-200 dark:border-indigo-800">
              Exam: {exam.totalMarks} Marks
            </Badge>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isPreviewMode ? (
            /* Input Mode */
            <div className="space-y-6">
              {/* Mode Selectors */}
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setInputType('file')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    inputType === 'file'
                      ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  Excel File (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('json')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    inputType === 'json'
                      ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BrainCircuit className="h-4 w-4 text-indigo-500" />
                  Paste JSON
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('text')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    inputType === 'text'
                      ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-4 w-4 text-blue-500" />
                  Quick Plain Text
                </button>
              </div>

              {/* Mode 1: Excel File */}
              {inputType === 'file' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-3xl p-8 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30 transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {file ? file.name : "Click or drag & drop Excel spreadsheet (.xlsx)"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports MCQ, MC, AR, INT, MTF, CQ, SQ, SMCQ, CMA, MPC & Descriptive rows.
                      </p>
                    </div>
                    {file && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Ready to process ({(file.size / 1024).toFixed(1)} KB)
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/api/question-bank/sample-template?type=objective', '_blank')}
                        className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800"
                      >
                        <Download className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                        Objective Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/api/question-bank/sample-template?type=descriptive', '_blank')}
                        className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800"
                      >
                        <Download className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                        Descriptive Template
                      </Button>
                    </div>

                    <Button
                      onClick={handleUploadFile}
                      disabled={!file || isProcessing}
                      className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md h-9 px-5"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                      Parse & Preview Questions
                    </Button>
                  </div>
                </div>
              )}

              {/* Mode 2: JSON Input */}
              {inputType === 'json' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Paste JSON Array of Questions
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadSample}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 h-7"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> Load Sample JSON
                    </Button>
                  </div>

                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste JSON array here... e.g. [{ questionText: '...', type: 'MCQ', marks: 1, ... }]"
                    rows={12}
                    className="font-mono text-xs rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 resize-none"
                  />

                  <div className="flex justify-end">
                    <Button
                      onClick={handleParseJson}
                      disabled={!jsonInput.trim()}
                      className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md h-9 px-5"
                    >
                      <Eye className="h-4 w-4 mr-1.5" /> Parse & Preview JSON
                    </Button>
                  </div>
                </div>
              )}

              {/* Mode 3: Quick Text Input */}
              {inputType === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Paste Numbered Plain Text Questions
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadSampleText}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 h-7"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> Load Text Sample
                    </Button>
                  </div>

                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="1. Question text? [1M]&#10;A) Option 1 (Correct)&#10;B) Option 2&#10;C) Option 3&#10;D) Option 4&#10;Explanation: Note here..."
                    rows={12}
                    className="font-mono text-xs rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 resize-none"
                  />

                  <div className="flex justify-end">
                    <Button
                      onClick={handleParseText}
                      disabled={!textInput.trim()}
                      className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md h-9 px-5"
                    >
                      <Eye className="h-4 w-4 mr-1.5" /> Parse & Preview Text
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Interactive Preview Mode */
            <div className="space-y-5">
              {/* Batch Overview Header */}
              <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      Batch Summary: {previewQuestions.length} Questions
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Total Batch Marks: <strong className="text-foreground font-black">{batchTotalMarks} Marks</strong> | Exam Target: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{exam.totalMarks} Marks</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-semibold">CQ: {batchCounts.cq}</Badge>
                  <Badge variant="outline" className="text-xs font-semibold">SQ: {batchCounts.sq}</Badge>
                  <Badge variant="outline" className="text-xs font-semibold">MCQ/Obj: {batchCounts.mcq}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMathPreview(!showMathPreview)}
                    className="rounded-xl text-xs h-8"
                  >
                    {showMathPreview ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                    {showMathPreview ? "Hide Math Preview" : "Show Math Preview"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddManualRow}
                    className="rounded-xl text-xs font-bold border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreviewMode(false)}
                    className="rounded-xl text-xs text-muted-foreground hover:text-foreground h-8"
                  >
                    Start Over
                  </Button>
                </div>
              </div>

              {/* Editable Question Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
                <ScrollArea className="max-h-[48vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 font-bold w-10 text-center">#</th>
                        <th className="p-3 font-bold w-24">Type</th>
                        <th className="p-3 font-bold min-w-[220px]">Question Text</th>
                        <th className="p-3 font-bold w-16 text-center">Marks</th>
                        <th className="p-3 font-bold w-28">Subject</th>
                        <th className="p-3 font-bold min-w-[180px]">Options / Answer</th>
                        <th className="p-3 font-bold w-12 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                      {previewQuestions.map((q, idx) => (
                        <tr key={q.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="p-3 text-center font-bold text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="p-3">
                            <Select
                              value={q.type}
                              onValueChange={(val: QuestionType) => handleEditRow(idx, 'type', val)}
                            >
                              <SelectTrigger className="h-8 text-xs rounded-lg font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="MCQ">MCQ</SelectItem>
                                <SelectItem value="MC">MC</SelectItem>
                                <SelectItem value="INT">INT</SelectItem>
                                <SelectItem value="AR">AR</SelectItem>
                                <SelectItem value="MTF">MTF</SelectItem>
                                <SelectItem value="CQ">CQ</SelectItem>
                                <SelectItem value="SQ">SQ</SelectItem>
                                <SelectItem value="SMCQ">SMCQ</SelectItem>
                                <SelectItem value="CMA">CMA</SelectItem>
                                <SelectItem value="MPC">MPC</SelectItem>
                                <SelectItem value="DESCRIPTIVE">DESCRIPTIVE</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 space-y-1">
                            <Input
                              value={q.questionText}
                              onChange={(e) => handleEditRow(idx, 'questionText', e.target.value)}
                              className="h-8 text-xs rounded-lg font-medium"
                            />
                            {showMathPreview && q.questionText && (
                              <div className="text-[11px] text-muted-foreground bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                <UniversalMathJax inline>{cleanupMath(q.questionText)}</UniversalMathJax>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min={1}
                              value={q.marks}
                              onChange={(e) => handleEditRow(idx, 'marks', Number(e.target.value))}
                              className="h-8 text-xs rounded-lg text-center font-bold w-14 mx-auto"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={q.subject}
                              onChange={(e) => handleEditRow(idx, 'subject', e.target.value)}
                              className="h-8 text-xs rounded-lg"
                            />
                          </td>
                          <td className="p-3">
                            {/* MCQ/MC Options display */}
                            {Array.isArray(q.options) && q.options.length > 0 ? (
                              <div className="space-y-1 max-w-xs">
                                <div className="flex flex-wrap gap-1">
                                  {q.options.map((opt, oi) => (
                                    <span
                                      key={oi}
                                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        opt.isCorrect
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold'
                                          : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + oi)}: {opt.text}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : q.modelAnswer ? (
                              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                                Ans: {q.modelAnswer}
                              </span>
                            ) : q.subQuestions && q.subQuestions.length > 0 ? (
                              <span className="text-[11px] text-blue-600 font-semibold">
                                {q.subQuestions.length} sub-questions
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px] italic">None</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleRemoveRow(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                              title="Delete question from batch"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-semibold"
          >
            Cancel
          </Button>

          {isPreviewMode && (
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Option 1: Send to Set Builder only */}
              <Button
                variant="outline"
                onClick={handleSendToSetOnly}
                disabled={isProcessing || previewQuestions.length === 0}
                className="rounded-xl font-bold text-xs h-10 px-4 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 active:scale-95 transition-all flex-1 sm:flex-none"
              >
                <Zap className="h-4 w-4 mr-1.5 text-amber-500" />
                Send to Set Builder Only (Staging)
              </Button>

              {/* Option 2: Permanently Save to Q-Bank and Send to Set Builder */}
              <Button
                onClick={handleSaveAndSendToSet}
                disabled={isProcessing || previewQuestions.length === 0}
                className="rounded-xl font-bold text-xs h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex-1 sm:flex-none"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Permanently Save & Add to Set Builder
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
