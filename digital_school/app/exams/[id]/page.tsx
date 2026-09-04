// app/exams/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlusCircle, Printer, Save, X, Loader2, Eye, AlertTriangle, BookOpen, ClipboardList, Wand2, ChevronLeft, ChevronRight, ArrowRight, FileSpreadsheet, Plus, Sparkles, Camera, Check, Filter, Settings, CheckCircle2, Sliders, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster, toast } from 'sonner';

declare const MathJax: any;

// Use better-react-mathjax for consistent math rendering across the app
import { MathJaxContext } from "better-react-mathjax";
import { UniversalMathJax } from "@/app/components/UniversalMathJax";
import debounce from 'lodash.debounce';
import { startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { CheckSquare } from "lucide-react";
import { cleanupMath, shuffleArray } from "@/lib/utils";

import { CMARenderer, MPCRenderer } from '@/components/ui/QuestionRenderers';
import { BulkAddExamQuestionsDialog } from './BulkAddExamQuestionsDialog';

// --- Mock Prisma Types (replace with your actual generated types) ---
// You would typically import these from `import type { Exam, Question, QuestionType, Difficulty } from '@prisma/client'`
type QuestionType = 'MCQ' | 'CQ' | 'SQ' | 'INT' | 'AR' | 'MTF' | 'MC' | 'DESCRIPTIVE' | 'SMCQ' | 'CMA' | 'MPC';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  subject: string;
  marks: number;
  difficulty: Difficulty;
  tags: string[];
  hasMath: boolean;
  options?: any;

  negativeMarks?: number;
  topic?: string | null;
  correctAnswer?: string; // Should store A, B, C, D...
  assertion?: string;
  reason?: string;
  correctOption?: number;
  leftColumn?: any;
  rightColumn?: any;
  matches?: any;
  subQuestions?: any[];
  sub_questions?: any[];
  parts?: any[];
  stages?: any[];
  components?: any[];
  sraComponents?: any[];
  reasonOptions?: any[];
  images?: string[];
  modelAnswer?: string;
}

interface SubjectConfigItem {
  name: string;
  totalMarks: number;
  isMandatory: boolean;
}

interface SubjectsConfig {
  subjects: SubjectConfigItem[];
  mandatoryCount?: number;
  optionalCount?: number;
  requiredOptionalCount?: number;
}

interface ExamSet {
  id: string;
  name: string;
  _count: { questions: number };
  questionsJson?: any[];
}

interface Exam {
  id: string;
  name: string;
  totalMarks: number;
  cqTotalQuestions: number;
  cqRequiredQuestions: number;
  sqTotalQuestions: number;
  sqRequiredQuestions: number;
  mcqNegativeMarking?: number;
  mcNegativeMarking?: number;
  subjectType?: 'SS' | 'MS';
  subjectsConfig?: SubjectsConfig;
  examSets: ExamSet[];
}

interface QuestionsApiResponse {
  data: Question[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
// --- End Mock Types ---

// --- Custom Hook for Debouncing ---
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  return useCallback(debounce(callback, delay), [delay]);
};

// --- Helper Components ---
const MathRenderer = ({ content, inline = true }: { content: string; inline?: boolean }) => {
  try {
    if (inline) return <UniversalMathJax inline>{cleanupMath(content)}</UniversalMathJax>;
    return <UniversalMathJax>{cleanupMath(content)}</UniversalMathJax>;
  } catch (error) {
    return <span className="text-red-500">Invalid Math Syntax</span>;
  }
};

const QuestionCard = ({
  question,
  onAdd,
  onRemove,
  isAdded,
  isSelectable,
  selectionReason,
  isMS,
  configuredSubjects,
  assignedSubject,
  onAssignSubject,
}: {
  question: Question;
  onAdd?: (q: Question) => void;
  onRemove?: (id: string) => void;
  isAdded: boolean;
  isSelectable: boolean;
  selectionReason?: string;
  isMS?: boolean;
  configuredSubjects?: SubjectConfigItem[];
  assignedSubject?: string;
  onAssignSubject?: (subj: string) => void;
}) => (
  <div className={`p-4 border rounded-lg mb-3 transition-all ${isAdded ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
    <div className="grid grid-cols-[1fr_auto] gap-4 relative w-full items-start">
      <div className="prose prose-sm dark:prose-invert min-w-0 w-full overflow-x-auto pr-2 custom-scrollbar">
        <h4 className="font-semibold text-sm mb-1 leading-snug"><UniversalMathJax inline>{cleanupMath(question.questionText)}</UniversalMathJax></h4>
        {question.images && question.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {question.images.map((img, i) => (
              <img key={i} src={img} alt="Question" className="max-h-32 rounded border shadow-sm" />
            ))}
          </div>
        )}

        {(question.type === 'MCQ' || question.type === 'MC') && Array.isArray(question.options) && (
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {question.options.map((opt: any, i: number) => (
              <li key={i} className={opt.isCorrect || String(opt.isCorrect) === 'true' ? 'font-bold text-green-600 dark:text-green-400' : ''}>
                <UniversalMathJax inline>{cleanupMath(opt.text)}</UniversalMathJax>
                {opt.image && (
                  <div className="mt-1">
                    <img src={opt.image} alt="Option" className="max-h-24 rounded border" />
                  </div>
                )}
                {(opt.isCorrect || String(opt.isCorrect) === 'true') && opt.explanation && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium italic mt-0.5">
                    {opt.explanation}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {question.type === 'AR' && (
          <div className="mt-2 space-y-2 border-l-2 border-blue-200 dark:border-blue-800 pl-3 py-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Assertion (A)</span>
              <div className="text-sm font-medium"><UniversalMathJax inline>{cleanupMath(question.assertion || '')}</UniversalMathJax></div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">Reason (R)</span>
              <div className="text-sm font-medium"><UniversalMathJax inline>{cleanupMath(question.reason || '')}</UniversalMathJax></div>
            </div>
            {question.correctOption && (
              <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-green-600">Correct Answer: Option {question.correctOption}</span>
                <p className="text-[10px] italic text-gray-500">
                  {question.correctOption === 1 ? "Both A and R are true, and R is the correct explanation of A." :
                    question.correctOption === 2 ? "Both A and R are true, but R is NOT the correct explanation of A." :
                      question.correctOption === 3 ? "A is true, but R is false." :
                        question.correctOption === 4 ? "A is false, but R is true." :
                          question.correctOption === 5 ? "Both A and R are false." : ""}
                </p>
              </div>
            )}
          </div>
        )}

        {question.type === 'MTF' && (
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Column A</span>
                {Array.isArray(question.leftColumn) && question.leftColumn.map((item: any, i: number) => {
                  const itemText = typeof item === 'string' ? item : (item?.text || item?.content || item?.value || '');
                  return (
                    <div key={i} className="text-xs p-1.5 bg-white dark:bg-gray-900 border rounded flex items-start gap-2">
                      <span className="font-bold text-blue-600 shrink-0">{i + 1}.</span>
                      <div className="flex-1">
                        <UniversalMathJax inline dynamic>{cleanupMath(itemText)}</UniversalMathJax>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Column B</span>
                {Array.isArray(question.rightColumn) && question.rightColumn.map((item: any, i: number) => {
                  const itemText = typeof item === 'string' ? item : (item?.text || item?.content || item?.value || '');
                  return (
                    <div key={i} className="text-xs p-1.5 bg-white dark:bg-gray-900 border rounded flex items-start gap-2">
                      <span className="font-bold text-purple-600 shrink-0">{String.fromCharCode(65 + i)}.</span>
                      <div className="flex-1">
                        <UniversalMathJax inline dynamic>{cleanupMath(itemText)}</UniversalMathJax>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {question.matches && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Correct Matches:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(question.matches as Record<string, string>).map(([left, right]) => (
                    <Badge key={left} variant="outline" className="text-[10px] font-medium border-green-200 text-green-700 bg-green-50">
                      {String(left)} → {String(right)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {question.type === 'INT' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Correct Answer:</span>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300">{question.correctAnswer || question.modelAnswer}</Badge>
          </div>
        )}

        {(question.type?.toUpperCase() === 'SMCQ') && (question.subQuestions || question.sub_questions) && (
          <div className="mt-3 space-y-4">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Sub MCQs (Stem-based):</span>
            <div className="space-y-4 mt-2">
              {(question.subQuestions || question.sub_questions || []).map((sq: any, i: number) => (
                <div key={i} className="pl-4 border-l-2 border-blue-100 dark:border-blue-900 py-1 min-w-0 break-words overflow-x-auto">
                  <div className="text-xs font-semibold mb-2">
                    {i + 1}. <UniversalMathJax inline>{cleanupMath(sq.question || sq.questionText || sq.text || sq || '')}</UniversalMathJax>
                    <span className="ml-2 text-[10px] text-gray-400">[{sq.marks}M]</span>
                    {sq.negativeMarks && (
                      <span className="ml-2 text-[10px] text-red-500 font-bold">[-{sq.negativeMarks}M]</span>
                    )}
                  </div>
                  {sq.options && Array.isArray(sq.options) && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {sq.options.map((opt: any, oi: number) => {
                        const isCorrect = opt.isCorrect || String(opt.isCorrect) === 'true';
                        return (
                          <li key={oi} className={`text-[11px] p-1.5 rounded border ${isCorrect ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-white border-gray-100'}`}>
                            <span className="mr-1.5 text-gray-400">{String.fromCharCode(65 + oi)})</span>
                            <UniversalMathJax inline>{cleanupMath(opt.text)}</UniversalMathJax>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(question.type?.toUpperCase() === 'CQ' || question.type?.toUpperCase() === 'SQ' || question.type?.toUpperCase() === 'DESCRIPTIVE') && (question.subQuestions || question.sub_questions) && (
          <div className="mt-3 space-y-3">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              {question.type?.toUpperCase() === 'DESCRIPTIVE' ? 'Descriptive Parts:' : 'Sub Questions:'}
            </span>
            <div className="space-y-3 mt-2">
              {(question.subQuestions || question.sub_questions || []).map((sq: any, i: number) => (
                <div key={i} className="pl-4 border-l-2 border-indigo-100 dark:border-indigo-900 py-1 min-w-0 break-words overflow-x-auto">
                  <div className="text-xs font-medium">
                    {question.type?.toUpperCase() === 'DESCRIPTIVE' ? (
                      <span>Part {sq.label || (i + 1)}: {sq.subType?.replace('_', ' ')}</span>
                    ) : (
                      <span>{String.fromCharCode(97 + i)}. <UniversalMathJax inline>{cleanupMath(sq.question || sq.questionText || sq.text || sq || '')}</UniversalMathJax></span>
                    )}
                    <span className="ml-2 text-[10px] text-gray-400">[{sq.marks}M]</span>
                  </div>
                  {sq.image && (
                    <div className="mt-1">
                      <img src={sq.image} alt="Sub-question" className="max-h-24 rounded border" />
                    </div>
                  )}
                  {sq.modelAnswer && (
                    <div className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 italic">
                      <span className="font-bold uppercase tracking-tighter">Model Answer: </span>
                      <UniversalMathJax inline>{cleanupMath(sq.modelAnswer)}</UniversalMathJax>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {question.type === 'SQ' && (
          <div className="mt-2 p-2 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900">
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block mb-1">Model Answer:</span>
            <div className="text-xs text-gray-700 dark:text-gray-300 italic">
              <UniversalMathJax inline>{cleanupMath(question.modelAnswer || '')}</UniversalMathJax>
            </div>
          </div>
        )}
      </div>
      <div className="w-[100px] flex justify-end z-20 sticky top-0 pt-1">
        <TooltipProvider>
          {onAdd && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  className={`shadow-sm ${isAdded || !isSelectable ? 'bg-gray-100 text-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  onClick={() => onAdd(question)}
                  disabled={isAdded || !isSelectable}
                >
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-bold">Add</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isAdded ? 'Already Added' : selectionReason || 'Add Question'}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {onRemove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => onRemove(question.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="text-xs font-bold">Remove</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Remove Question</p></TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div >
    <div className="grid grid-cols-[1fr_auto] gap-4 items-center mt-3 pt-4 border-t border-gray-200 dark:border-gray-700 w-full overflow-hidden">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <Badge variant="secondary">{question.type}</Badge>
        <Badge variant={
          question.difficulty === 'HARD'
            ? 'destructive'
            : question.difficulty === 'MEDIUM'
              ? 'secondary'
              : 'default'
        }>
          {question.difficulty}
        </Badge>
        <Badge variant="outline">{question.marks} Marks</Badge>
        {['MCQ', 'MC', 'AR', 'INT', 'MTF', 'NUMERIC', 'SMCQ', 'CMA', 'MPC'].includes(question.type || '') && question.negativeMarks && (
          <Badge variant="destructive" className="text-xs">-{question.negativeMarks} Marks</Badge>
        )}
        {isMS && configuredSubjects && configuredSubjects.length > 0 ? (
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border text-xs">
            <span className="font-bold text-muted-foreground text-[10px]">Subject:</span>
            <select
              value={assignedSubject || question.subject || configuredSubjects[0]?.name || ''}
              onChange={(e) => onAssignSubject && onAssignSubject(e.target.value)}
              disabled={isAdded}
              className="text-xs font-bold py-0.5 px-1.5 rounded border bg-background text-foreground border-input focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {configuredSubjects.map(s => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.totalMarks}M)
                </option>
              ))}
              {question.subject && !configuredSubjects.some(s => s.name.toLowerCase() === question.subject.toLowerCase()) && (
                <option value={question.subject}>{question.subject} (Bank Tag)</option>
              )}
            </select>
          </div>
        ) : (
          question.subject && <Badge variant="outline">Sub: {question.subject}</Badge>
        )}
        {question.topic && <Badge variant="outline" className="text-teal-600 border-teal-600 dark:text-teal-400 dark:border-teal-400">{question.topic}</Badge>}
        {selectionReason && (
          <Badge variant="outline" className="text-xs">{selectionReason}</Badge>
        )}
      </div>

      <div className="w-[100px] flex justify-end">
        {onAdd ? (
          <Button
            size="sm"
            variant="outline"
            className={`h-8 border-green-200 text-green-700 hover:bg-green-50 font-bold whitespace-nowrap ${isAdded || !isSelectable ? 'opacity-50' : ''}`}
            onClick={() => onAdd(question)}
            disabled={isAdded || !isSelectable}
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            {isAdded ? 'Added' : selectionReason || 'Add'}
          </Button>
        ) : onRemove ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-red-200 text-red-700 hover:bg-red-50 font-bold whitespace-nowrap"
            onClick={() => onRemove(question.id)}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  </div >
);

const AutoGenerateDialog = ({ onGenerate }: { onGenerate: (name: string) => Promise<void> }) => {
  const [setName, setSetName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!setName.trim()) {
      toast.error("Please provide a name for the new set.");
      return;
    }
    setIsGenerating(true);
    await onGenerate(setName);
    setIsGenerating(false);
    // The dialog will be closed by the parent component on success
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Auto-Generate Question Set</DialogTitle>
        <CardDescription>
          A unique set of questions matching the exam's total marks will be generated.
        </CardDescription>
      </DialogHeader>
      <div className="py-4">
        <label htmlFor="autoSetName" className="block text-sm font-medium mb-2">New Set Name</label>
        <Input
          id="autoSetName"
          placeholder="e.g., Set C, Auto-generated"
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleGenerate} disabled={isGenerating || !setName.trim()}>
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Generate
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};


export default function ExamBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  // State Management
  const [exam, setExam] = useState<Exam | null>(null);
  const [questionsData, setQuestionsData] = useState<QuestionsApiResponse | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [newSetName, setNewSetName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtering and Pagination State
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    type: '',
    difficulty: '',
    subject: '',
    topic: '',
  });

  // Add state for number of sets
  const [numSets, setNumSets] = useState(1);
  const [sets, setSets] = useState<any[]>([]); // Add this state if not present
  const [previewSet, setPreviewSet] = useState<any | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [questionSubjectOverrides, setQuestionSubjectOverrides] = useState<Record<string, string>>({});
  const [configureSubjectsOpen, setConfigureSubjectsOpen] = useState(false);
  const [editingSubjects, setEditingSubjects] = useState<SubjectConfigItem[]>([]);

  const handleBulkAddQuestions = (newQuestions: Question[]) => {
    setSelectedQuestions((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const filtered = newQuestions.filter((q) => !existingIds.has(q.id));
      return [...prev, ...filtered];
    });
  };

  // API Call Logic
  const fetchExamData = useCallback(
    async (currentFilters: {
      page: number;
      limit: number;
      type: string;
      difficulty: string;
      subject: string;
      topic: string;
    }, dateRange?: DateRange) => {
      if (!examId) return;
      setIsLoading(true);
      try {
        const queryParams: any = {
          page: String(currentFilters.page),
          limit: String(currentFilters.limit),
          ...(currentFilters.type && { type: currentFilters.type }),
          ...(currentFilters.difficulty && { difficulty: currentFilters.difficulty }),
          ...(currentFilters.subject && { subject: currentFilters.subject }),
          ...(currentFilters.topic && { topic: currentFilters.topic }),
        };

        if (dateRange?.from) {
          queryParams.startDate = startOfDay(dateRange.from).toISOString();
          if (dateRange.to) {
            queryParams.endDate = endOfDay(dateRange.to).toISOString();
          } else {
            queryParams.endDate = endOfDay(dateRange.from).toISOString();
          }
        }

        const query = new URLSearchParams(queryParams).toString();
        const response = await fetch(`/api/exams/${examId}?${query}`);
        if (!response.ok) throw new Error('Failed to fetch exam data');
        const data = await response.json();
        setExam(data.exam);
        setQuestionsData(data.questions);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load exam data.');
      } finally {
        setIsLoading(false);
      }
    },
    [examId]
  );

  const debouncedFetch = useDebounce(fetchExamData, 500);

  const handleSelectAll = () => {
    if (!questionsData?.data) return;

    const newQuestions: Question[] = [];
    const runningSubMarks = new Map<string, number>();
    if (isMS && configuredSubjects.length > 0) {
      configuredSubjects.forEach(s => {
        const entry = subjectMarksBreakdown.get(s.name);
        runningSubMarks.set(s.name, entry?.current || 0);
      });
    }
    let runningMarks = currentMarks;

    for (const q of questionsData.data) {
      if (selectedQuestionIds.has(q.id)) continue;
      if (isMS && configuredSubjects.length > 0) {
        const matched = findConfiguredSubject(q);
        if (!matched) continue;
        const cur = runningSubMarks.get(matched.name) || 0;
        if (cur + q.marks <= matched.totalMarks) {
          runningSubMarks.set(matched.name, cur + q.marks);
          newQuestions.push(q);
        }
      } else {
        if (canAddQuestion(q) && (runningMarks + q.marks <= (exam?.totalMarks || 0))) {
          runningMarks += q.marks;
          newQuestions.push(q);
        }
      }
    }

    if (newQuestions.length === 0) {
      toast.info("No new valid questions to add from this page.");
      return;
    }

    setSelectedQuestions(prev => [...prev, ...newQuestions]);
    toast.success(`Added ${newQuestions.length} questions from this page.`);
  };

  const handleSelectAllFromDB = async () => {
    setIsLoading(true);
    try {
      const queryParams: any = {
        page: '1',
        limit: '10000', // Fetch all matching
        ...(filters.type && { type: filters.type }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.subject && { subject: filters.subject }),
        ...(filters.topic && { topic: filters.topic }),
      };

      if (dateRange?.from) {
        queryParams.startDate = startOfDay(dateRange.from).toISOString();
        if (dateRange.to) {
          queryParams.endDate = endOfDay(dateRange.to).toISOString();
        } else {
          queryParams.endDate = endOfDay(dateRange.from).toISOString();
        }
      }

      const query = new URLSearchParams(queryParams).toString();
      const response = await fetch(`/api/exams/${examId}?${query}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();

      const allMatchingQuestions: Question[] = data.questions.data;

      const newQuestions: Question[] = [];
      const runningSubMarks = new Map<string, number>();
      if (isMS && configuredSubjects.length > 0) {
        configuredSubjects.forEach(s => {
          const entry = subjectMarksBreakdown.get(s.name);
          runningSubMarks.set(s.name, entry?.current || 0);
        });
      }
      let runningMarks = currentMarks;

      for (const q of allMatchingQuestions) {
        if (selectedQuestionIds.has(q.id)) continue;
        if (isMS && configuredSubjects.length > 0) {
          const matched = findConfiguredSubject(q);
          if (!matched) continue;
          const cur = runningSubMarks.get(matched.name) || 0;
          if (cur + q.marks <= matched.totalMarks) {
            runningSubMarks.set(matched.name, cur + q.marks);
            newQuestions.push(q);
          }
        } else {
          if (canAddQuestion(q) && (runningMarks + q.marks <= (exam?.totalMarks || 0))) {
            runningMarks += q.marks;
            newQuestions.push(q);
          }
        }
      }

      if (newQuestions.length === 0) {
        toast.info("No new valid questions found in database matching criteria.");
      } else {
        setSelectedQuestions(prev => [...prev, ...newQuestions]);
        toast.success(`Added ${newQuestions.length} questions from database.`);
      }

    } catch (error) {
      console.error(error);
      toast.error('Failed to select all questions from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if not searching by subject (subject search is handled by debouncedFetch)
    if (!filters.subject) {
      fetchExamData(filters, dateRange);
    }
  }, [fetchExamData, filters, dateRange]);

  useEffect(() => {
    if (filters.subject) {
      debouncedFetch(filters);
    }
  }, [filters.subject, debouncedFetch, filters]);

  // On mount, fetch and display existing sets
  useEffect(() => {
    const fetchSets = async () => {
      const setsRes = await fetch(`/api/exams/${examId}/set`);
      const setsData = await setsRes.json();
      setSets(setsData.sets || []);
    };
    fetchSets();
  }, [examId]);

  // --- Multiple Subject (MS) & Single Subject (SS) Logic ---
  const isMS = exam?.subjectType ? exam.subjectType === 'MS' : Boolean(
    exam?.subjectsConfig && ((exam.subjectsConfig as any)?.subjects || []).length > 0
  );
  const configuredSubjects = useMemo<SubjectConfigItem[]>(() => {
    if (!isMS) return [];
    const subjects = (exam?.subjectsConfig as any)?.subjects;
    if (Array.isArray(subjects) && subjects.length > 0) return subjects;

    // Fallback: If exam is MS but subjectsConfig is not pre-configured,
    // strictly follow and discover the subjects present in the questions themselves!
    const discoveredSubjectNames = Array.from(new Set([
      ...selectedQuestions.map(q => q.subject).filter(Boolean),
      ...(questionsData?.data?.map(q => q.subject).filter(Boolean) || [])
    ])) as string[];

    if (discoveredSubjectNames.length > 0) {
      const marksPerSubj = Math.floor((exam?.totalMarks || 100) / discoveredSubjectNames.length);
      return discoveredSubjectNames.map((name, i) => ({
        name,
        totalMarks: i === discoveredSubjectNames.length - 1
          ? (exam?.totalMarks || 100) - marksPerSubj * (discoveredSubjectNames.length - 1)
          : marksPerSubj,
        isMandatory: true
      }));
    }

    return [];
  }, [isMS, exam?.subjectsConfig, exam?.totalMarks, selectedQuestions, questionsData?.data]);

  const getQuestionSubject = useCallback((q: Question): string => {
    return questionSubjectOverrides[q.id] || q.subject || '';
  }, [questionSubjectOverrides]);

  // Subject matching helper with aliases and normalization
  const matchSubject = useCallback((questionSubject: string | undefined | null, targetSubjectName: string): boolean => {
    if (!questionSubject || !targetSubjectName) return false;
    const qClean = questionSubject.trim().toLowerCase();
    const tClean = targetSubjectName.trim().toLowerCase();
    if (qClean === tClean) return true;
    if (qClean.includes(tClean) || tClean.includes(qClean)) return true;

    // Common Bengali / English aliases
    const aliases: Record<string, string[]> = {
      'physics': ['পদার্থবিজ্ঞান', 'পদার্থ', 'phy'],
      'chemistry': ['রসায়ন', 'রসায়ন', 'chem'],
      'mathematics': ['গণিত', 'উচ্চতর গণিত', 'math', 'higher math', 'higher mathematics', 'maths'],
      'higher mathematics': ['উচ্চতর গণিত', 'গণিত', 'math', 'higher math'],
      'biology': ['জীববিজ্ঞান', 'জীব', 'bio'],
      'bangla': ['বাংলা', 'bengali'],
      'english': ['ইংরেজি', 'ইংরেজী', 'eng'],
      'ict': ['তথ্য ও যোগাযোগ প্রযুক্তি', 'আইসিটি'],
    };

    for (const [key, list] of Object.entries(aliases)) {
      const isTarget = tClean === key || list.some(a => tClean.includes(a));
      const isQuestion = qClean === key || list.some(a => qClean.includes(a));
      if (isTarget && isQuestion) return true;
    }

    return false;
  }, []);

  const findConfiguredSubject = useCallback((question: Question): SubjectConfigItem | undefined => {
    if (!isMS || configuredSubjects.length === 0) return undefined;
    const sub = getQuestionSubject(question);
    return configuredSubjects.find(s => matchSubject(sub, s.name));
  }, [isMS, configuredSubjects, matchSubject, getQuestionSubject]);

  // Track marks and questions selected per subject for MS exams
  const subjectMarksBreakdown = useMemo(() => {
    if (!isMS || configuredSubjects.length === 0) {
      return new Map<string, { current: number; target: number; isMandatory: boolean; count: number; name: string }>();
    }

    const map = new Map<string, { current: number; target: number; isMandatory: boolean; count: number; name: string }>();
    configuredSubjects.forEach(s => {
      map.set(s.name, {
        name: s.name,
        current: 0,
        target: s.totalMarks,
        isMandatory: s.isMandatory ?? true,
        count: 0
      });
    });

    selectedQuestions.forEach(q => {
      const sub = getQuestionSubject(q);
      const matched = configuredSubjects.find(s => matchSubject(sub, s.name));
      if (matched) {
        const entry = map.get(matched.name);
        if (entry) {
          entry.current += q.marks;
          entry.count += 1;
        }
      }
    });

    return map;
  }, [isMS, configuredSubjects, selectedQuestions, matchSubject, getQuestionSubject]);

  // Derived State for Question Selection Logic
  const selectedCQQuestions = useMemo(() => selectedQuestions.filter(q => q.type === 'CQ'), [selectedQuestions]);
  const selectedSQQuestions = useMemo(() => selectedQuestions.filter(q => q.type === 'SQ'), [selectedQuestions]);
  const selectedMCQQuestions = useMemo(() => selectedQuestions.filter(q => ['MCQ', 'MC', 'AR', 'INT', 'MTF', 'SMCQ', 'DESCRIPTIVE', 'CMA', 'MPC'].includes(q.type)), [selectedQuestions]);

  // Calculate marks only up to required number of questions
  const cqMarks = useMemo(() => {
    const requiredCQ = exam?.cqRequiredQuestions || 0;
    return selectedCQQuestions.slice(0, requiredCQ).reduce((total, q) => total + q.marks, 0);
  }, [selectedCQQuestions, exam]);

  const sqMarks = useMemo(() => {
    const requiredSQ = exam?.sqRequiredQuestions || 0;
    return selectedSQQuestions.slice(0, requiredSQ).reduce((total, q) => total + q.marks, 0);
  }, [selectedSQQuestions, exam]);

  const mcqMarks = useMemo(() => selectedMCQQuestions.reduce((total, q) => total + q.marks, 0), [selectedMCQQuestions]);

  // For MS exams: total selected marks is the sum of marks across all configured subjects
  const msCurrentMarks = useMemo(() => {
    if (!isMS) return 0;
    let sum = 0;
    subjectMarksBreakdown.forEach(s => {
      sum += s.current;
    });
    return sum;
  }, [isMS, subjectMarksBreakdown]);

  // Total marks is sum of required CQ + required SQ + all MCQ/Objective/Multi-step (for SS), or msCurrentMarks (for MS)
  const currentMarks = useMemo(() => {
    if (isMS) {
      return msCurrentMarks;
    }
    return cqMarks + sqMarks + mcqMarks;
  }, [isMS, msCurrentMarks, cqMarks, sqMarks, mcqMarks]);

  // Validation logic
  const isMarksMatched = useMemo(() => exam ? currentMarks === exam.totalMarks : false, [currentMarks, exam]);
  const isCQValid = useMemo(() => {
    if (!exam) return false;
    return selectedCQQuestions.length >= exam.cqRequiredQuestions && selectedCQQuestions.length <= exam.cqTotalQuestions;
  }, [selectedCQQuestions.length, exam]);
  const isSQValid = useMemo(() => {
    if (!exam) return false;
    return selectedSQQuestions.length >= exam.sqRequiredQuestions && selectedSQQuestions.length <= exam.sqTotalQuestions;
  }, [selectedSQQuestions.length, exam]);

  // MS Validation: every configured subject must have selected questions equaling its totalMarks
  const isMSValid = useMemo(() => {
    if (!isMS) return true;
    if (configuredSubjects.length === 0) return false;

    // Check mandatory subjects have reached their exact totalMarks
    for (const subj of configuredSubjects) {
      const entry = subjectMarksBreakdown.get(subj.name);
      const current = entry?.current || 0;
      if (subj.isMandatory && current !== subj.totalMarks) {
        return false;
      }
    }
    return true;
  }, [isMS, configuredSubjects, subjectMarksBreakdown]);

  // Overall selection validity
  const isSelectionValid = useMemo(() => {
    if (isMS) {
      return isMSValid;
    }
    // Single Subject (SS): Strictly preserved
    return isCQValid && isSQValid && isMarksMatched;
  }, [isMS, isMSValid, isCQValid, isSQValid, isMarksMatched]);

  const selectedQuestionIds = useMemo(() => new Set(selectedQuestions.map(q => q.id)), [selectedQuestions]);

  // Helper function to check if a question can be added based on exam constraints
  const canAddQuestion = useCallback((question: Question, targetSubjectOverride?: string) => {
    if (!exam) return false;

    // Check if already selected
    if (selectedQuestionIds.has(question.id)) return false;

    // Multiple Subject (MS) Check: Ensure subject quota is not exceeded
    if (isMS && configuredSubjects.length > 0) {
      const sub = targetSubjectOverride || getQuestionSubject(question);
      const matched = configuredSubjects.find(s => matchSubject(sub, s.name));
      if (!matched) {
        // If question doesn't match a subject yet, allow adding if ANY configured subject has room
        return configuredSubjects.some(s => {
          const entry = subjectMarksBreakdown.get(s.name);
          return (entry?.current || 0) + question.marks <= s.totalMarks;
        });
      }
      const entry = subjectMarksBreakdown.get(matched.name);
      const current = entry?.current || 0;
      if (current + question.marks > matched.totalMarks) {
        return false;
      }
      return true;
    }

    // Single Subject (SS) Check: Strictly preserved
    if (question.type === 'CQ') {
      if (selectedCQQuestions.length >= exam.cqTotalQuestions) return false;
    } else if (question.type === 'SQ') {
      if (selectedSQQuestions.length >= exam.sqTotalQuestions) return false;
    }

    // For MCQ/Objective/Multi-step questions, check if adding would exceed total marks
    if (['MCQ', 'MC', 'AR', 'INT', 'MTF', 'SMCQ', 'DESCRIPTIVE', 'CMA', 'MPC'].includes(question.type)) {
      if (currentMarks + question.marks > exam.totalMarks) return false;
    }

    return true;
  }, [exam, isMS, configuredSubjects, matchSubject, getQuestionSubject, subjectMarksBreakdown, selectedQuestionIds, currentMarks, selectedCQQuestions.length, selectedSQQuestions.length]);

  // Helper function to get selection reason for tooltip
  const getSelectionReason = useCallback((question: Question) => {
    if (!exam) return '';

    if (selectedQuestionIds.has(question.id)) return 'Already Added';

    // Multiple Subject (MS) Tooltip
    if (isMS && configuredSubjects.length > 0) {
      const sub = getQuestionSubject(question);
      const matched = configuredSubjects.find(s => matchSubject(sub, s.name));
      if (!matched) {
        return `Assign to an exam section with open quota`;
      }
      const entry = subjectMarksBreakdown.get(matched.name);
      const current = entry?.current || 0;
      if (current + question.marks > matched.totalMarks) {
        return `Subject "${matched.name}" quota full (${current}/${matched.totalMarks} M)`;
      }
      return `Add to ${matched.name} (${current}/${matched.totalMarks} M)`;
    }

    // Single Subject (SS) Tooltip: Strictly preserved
    if (question.type === 'CQ') {
      if (selectedCQQuestions.length >= exam.cqTotalQuestions) return 'CQ Limit Reached';
      return 'Add CQ Question';
    } else if (question.type === 'SQ') {
      if (selectedSQQuestions.length >= exam.sqTotalQuestions) return 'SQ Limit Reached';
      return 'Add SQ Question';
    } else if (['MCQ', 'MC', 'AR', 'INT', 'MTF', 'SMCQ', 'DESCRIPTIVE', 'CMA', 'MPC'].includes(question.type)) {
      if (currentMarks + question.marks > exam.totalMarks) return 'Exceeds Total Marks';
      return `Add ${question.type} Question`;
    }

    return 'Add Question';
  }, [exam, isMS, configuredSubjects, getQuestionSubject, subjectMarksBreakdown, selectedQuestionIds, currentMarks, selectedCQQuestions.length, selectedSQQuestions.length]);

  // Event Handlers
  const handleAddQuestion = (question: Question) => {
    let sub = getQuestionSubject(question);
    if (isMS && configuredSubjects.length > 0) {
      const matched = configuredSubjects.find(s => matchSubject(sub, s.name));
      if (!matched) {
        // Auto-assign to the first subject that has room
        const available = configuredSubjects.find(s => {
          const entry = subjectMarksBreakdown.get(s.name);
          return (entry?.current || 0) + question.marks <= s.totalMarks;
        });
        if (available) {
          sub = available.name;
          setQuestionSubjectOverrides(prev => ({ ...prev, [question.id]: available.name }));
        }
      }
    }
    const qWithSubject = { ...question, subject: sub || question.subject };
    if (!selectedQuestionIds.has(question.id) && canAddQuestion(qWithSubject)) {
      setSelectedQuestions(prev => [...prev, qWithSubject]);
    }
  };

  const handleAssignSubject = (questionId: string, newSubject: string) => {
    setQuestionSubjectOverrides(prev => ({ ...prev, [questionId]: newSubject }));
    setSelectedQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return { ...q, subject: newSubject };
      }
      return q;
    }));
  };

  const handleToggleSubjectType = async (newType: 'SS' | 'MS') => {
    if (!examId) return;
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectType: newType,
          subjectsConfig: newType === 'MS' ? (exam?.subjectsConfig || {
            subjects: [
              { name: 'Physics', totalMarks: Math.floor((exam?.totalMarks || 100) / 3), isMandatory: true },
              { name: 'Chemistry', totalMarks: Math.floor((exam?.totalMarks || 100) / 3), isMandatory: true },
              { name: 'Higher Math', totalMarks: (exam?.totalMarks || 100) - 2 * Math.floor((exam?.totalMarks || 100) / 3), isMandatory: true },
            ],
            mandatoryCount: 3,
            optionalCount: 0,
            requiredOptionalCount: 0,
          }) : null
        })
      });
      if (!res.ok) throw new Error('Failed to update exam subject type');
      toast.success(`Exam converted to ${newType === 'SS' ? 'Single Subject (SS)' : 'Multiple Subjects (MS)'}`);
      fetchExamData(filters, dateRange);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update subject structure');
    }
  };

  const handleOpenConfigureSubjects = () => {
    if (configuredSubjects.length > 0) {
      setEditingSubjects([...configuredSubjects]);
    } else {
      setEditingSubjects([
        { name: 'Physics', totalMarks: Math.floor((exam?.totalMarks || 100) / 3), isMandatory: true },
        { name: 'Chemistry', totalMarks: Math.floor((exam?.totalMarks || 100) / 3), isMandatory: true },
        { name: 'Higher Math', totalMarks: (exam?.totalMarks || 100) - 2 * Math.floor((exam?.totalMarks || 100) / 3), isMandatory: true },
      ]);
    }
    setConfigureSubjectsOpen(true);
  };

  const handleSaveSubjectsConfig = async () => {
    if (!examId) return;
    const totalAssigned = editingSubjects.reduce((sum, s) => sum + (Number(s.totalMarks) || 0), 0);
    if (totalAssigned !== exam?.totalMarks) {
      toast.warning(`Total subject marks (${totalAssigned}) does not match exam total marks (${exam?.totalMarks}).`);
    }
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectType: 'MS',
          subjectsConfig: {
            subjects: editingSubjects,
            mandatoryCount: editingSubjects.filter(s => s.isMandatory).length,
            optionalCount: editingSubjects.filter(s => !s.isMandatory).length,
          }
        })
      });
      if (!res.ok) throw new Error('Failed to update subjects configuration');
      toast.success('Subject configuration updated successfully!');
      setConfigureSubjectsOpen(false);
      fetchExamData(filters, dateRange);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update subjects');
    }
  };

  const handleRemoveQuestion = (questionId: string) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleFilterChange = (key: 'type' | 'difficulty' | 'subject' | 'topic', value: string) => {
    const v = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: v, page: 1 }));
    // fetchExamData is handled by useEffect
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (questionsData?.meta.totalPages ?? 0)) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSubmitSet = async () => {
    if (!isSelectionValid) {
      if (isMS) {
        const incomplete = configuredSubjects
          .map(s => {
            const entry = subjectMarksBreakdown.get(s.name);
            const curr = entry?.current || 0;
            if (curr !== s.totalMarks) return `${s.name}: ${curr}/${s.totalMarks} Marks`;
            return null;
          })
          .filter(Boolean)
          .join(', ');
        toast.error(`MS Validation failed. Incomplete subjects: ${incomplete}`);
        return;
      }
      let errorMessage = "Validation failed: ";
      if (!isCQValid) errorMessage += `CQ questions must be ${exam?.cqRequiredQuestions}-${exam?.cqTotalQuestions}. `;
      if (!isSQValid) errorMessage += `SQ questions must be ${exam?.sqRequiredQuestions}-${exam?.sqTotalQuestions}. `;
      if (!isMarksMatched) errorMessage += `Total marks must be ${exam?.totalMarks}.`;
      toast.error(errorMessage);
      return;
    }
    if (!newSetName.trim()) {
      toast.error("Please provide a name for this question set.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSetName.trim(), questionIds: selectedQuestions.map(q => q.id) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create exam set.');
      toast.success(`Exam set "${newSetName}" created successfully!`);
      setExam(prev => prev ? { ...prev, examSets: [result, ...prev.examSets] } : null);
      setSelectedQuestions([]);
      setNewSetName('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoGenerate = async (name: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate set.');
      toast.success(`Successfully auto-generated set "${name}"!`);
      setExam(prev => prev ? { ...prev, examSets: [result, ...prev.examSets] } : null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to shuffle array
  const shuffleArrayHelper = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // On generate, create N sets with shuffled questions and MCQ options
  const handleGenerateSets = async () => {
    if (!isSelectionValid) {
      if (isMS) {
        const incomplete = configuredSubjects
          .map(s => {
            const entry = subjectMarksBreakdown.get(s.name);
            const curr = entry?.current || 0;
            if (curr !== s.totalMarks) return `${s.name}: ${curr}/${s.totalMarks} Marks`;
            return null;
          })
          .filter(Boolean)
          .join(', ');
        toast.error(`MS Validation failed. Incomplete subjects: ${incomplete}`);
        return;
      }
      let errorMessage = "Validation failed: ";
      if (!isCQValid) errorMessage += `CQ questions must be ${exam?.cqRequiredQuestions}-${exam?.cqTotalQuestions}. `;
      if (!isSQValid) errorMessage += `SQ questions must be ${exam?.sqRequiredQuestions}-${exam?.sqTotalQuestions}. `;
      if (!isMarksMatched) errorMessage += `Total marks must be ${exam?.totalMarks}.`;
      toast.error(errorMessage);
      return;
    }
    if (!newSetName.trim()) {
      toast.error("Please provide a name for this question set.");
      return;
    }
    setIsSubmitting(true);
    try {
      const setsToSave = Array.from({ length: numSets }).map((_, i) => {
        let orderedQuestionsRaw: any[] = [];

        if (isMS) {
          // Multiple Subject (MS): Shuffling happens strictly WITHIN each subject.
          // Partition selectedQuestions so each question belongs to strictly ONE subject group
          const subjectGroups = new Map<string, Question[]>();
          configuredSubjects.forEach(s => {
            subjectGroups.set(s.name, []);
          });
          const unassignedQuestions: Question[] = [];

          selectedQuestions.forEach(q => {
            const matched = findConfiguredSubject(q);
            if (matched && subjectGroups.has(matched.name)) {
              subjectGroups.get(matched.name)!.push(q);
            } else {
              unassignedQuestions.push(q);
            }
          });

          // Group and shuffle questions strictly within each subject section
          configuredSubjects.forEach(subj => {
            const subjectQuestions = subjectGroups.get(subj.name) || [];
            if (subjectQuestions.length > 0) {
              const cqInSubject = subjectQuestions.filter(q => q.type === 'CQ');
              const otherInSubject = subjectQuestions.filter(q => q.type !== 'CQ');
              // Shuffle non-CQ within this subject
              const shuffledOthersInSubject = shuffleArray(otherInSubject);
              // Canonicalize subject name
              const canonicalized = [...cqInSubject, ...shuffledOthersInSubject].map(q => ({
                ...q,
                subject: subj.name
              }));
              orderedQuestionsRaw.push(...canonicalized);
            }
          });

          // Any unassigned questions (fallback - processed strictly once)
          if (unassignedQuestions.length > 0) {
            const cqUnassigned = unassignedQuestions.filter(q => q.type === 'CQ');
            const otherUnassigned = unassignedQuestions.filter(q => q.type !== 'CQ');
            orderedQuestionsRaw.push(...cqUnassigned, ...shuffleArray(otherUnassigned));
          }
        } else {
          // Single Subject (SS): Global CQ first, then shuffled others (Strictly preserved)
          const cqQuestions = selectedQuestions.filter(q => q.type === 'CQ');
          const otherQuestions = selectedQuestions.filter(q => q.type !== 'CQ');
          const shuffledOthers = shuffleArray(otherQuestions);
          orderedQuestionsRaw = [...cqQuestions, ...shuffledOthers];
        }

        const orderedQuestions = orderedQuestionsRaw.map(q => {
          let processedQuestion = { ...q };

          // Shuffle MCQ/MC options while preserving originalIndex and updating correctAnswer
          if ((q.type === 'MCQ' || q.type === 'MC') && Array.isArray(q.options)) {
            const optionsWithOriginal = q.options.map((opt: any, idx: number) => {
              if (typeof opt === 'string') return { text: opt, originalIndex: idx };
              return { ...opt, originalIndex: opt.originalIndex !== undefined ? opt.originalIndex : idx };
            });
            const shuffledOptions = shuffleArray(optionsWithOriginal);
            processedQuestion = { ...processedQuestion, options: shuffledOptions };

            // Recalculate correctAnswer based on the new position of correct options
            const correctIndices = shuffledOptions.reduce((acc: number[], opt: any, idx: number) => {
              if (opt.isCorrect === true || String(opt.isCorrect) === 'true') {
                acc.push(idx);
              }
              return acc;
            }, []);

            if (correctIndices.length > 0) {
              // Convert index 0->A, 1->B, 2->C...
              const answerString = correctIndices.map(idx => String.fromCharCode(65 + idx)).join('');
              processedQuestion = {
                ...processedQuestion,
                correctAnswer: answerString
              };
            }
          }

          // Shuffle MTF Right Column
          if (q.type === 'MTF' && Array.isArray(q.rightColumn)) {
            const shuffledRightColumn = shuffleArray(q.rightColumn);
            processedQuestion = { ...processedQuestion, rightColumn: shuffledRightColumn };
          }

          // Shuffle AR Options (Generate default if missing)
          if (q.type === 'AR') {
            const defaultAROptions = [
              { text: "Assertion (A) ও Reason (R) উভয়ই সঠিক এবং R হলো A এর সঠিক ব্যাখ্যা", isCorrect: false },
              { text: "Assertion (A) ও Reason (R) উভয়ই সঠিক কিন্তু R হলো A এর সঠিক ব্যাখ্যা নয়", isCorrect: false },
              { text: "Assertion (A) সঠিক কিন্তু Reason (R) মিথ্যা", isCorrect: false },
              { text: "Assertion (A) মিথ্যা কিন্তু Reason (R) সঠিক", isCorrect: false },
              { text: "Assertion (A) ও Reason (R) উভয়ই মিথ্যা", isCorrect: false }
            ];

            let optionsToShuffle = (Array.isArray(q.options) && q.options.length > 0) ? q.options : defaultAROptions;

            // Identify correct option index (1-based from correctOption or finding isCorrect in options)
            let correctIndex = -1;
            if (q.correctOption) {
              correctIndex = Number(q.correctOption) - 1; // Convert 1-based to 0-based
            } else if (Array.isArray(q.options)) {
              correctIndex = q.options.findIndex((o: any) => o.isCorrect === true || String(o.isCorrect) === 'true');
            }

            // Mark correct option in the array if not already marked (for default options)
            if (correctIndex >= 0 && correctIndex < optionsToShuffle.length) {
              optionsToShuffle = optionsToShuffle.map((opt: any, idx: number) => ({
                ...opt,
                isCorrect: idx === correctIndex
              }));
            }

            // Use options as-is (MUST NOT SHUFFLE AR)
            const finalAROptions = optionsToShuffle;
            processedQuestion = { ...processedQuestion, options: finalAROptions };

            // Find correct index in final array
            const finalCorrectIndex = finalAROptions.findIndex((o: any) => o.isCorrect === true || String(o.isCorrect) === 'true');
            if (finalCorrectIndex !== -1) {
              processedQuestion = {
                ...processedQuestion,
                correctOption: finalCorrectIndex + 1 // Store as 1-based index
              };
            }
          }

          // Shuffle SMCQ sub-questions and their options
          if (q.type === 'SMCQ') {
            const subQs = q.subQuestions || q.sub_questions || [];
            if (Array.isArray(subQs) && subQs.length > 0) {
              const shuffledSubQs = shuffleArray(subQs).map((sq: any) => {
                let processedSq = { ...sq };
                if (Array.isArray(sq.options)) {
                  const shuffledOptions = shuffleArray(sq.options);
                  processedSq = { ...processedSq, options: shuffledOptions };

                  // Recalculate correctAnswer for the sub-question
                  const correctIndices = shuffledOptions.reduce((acc: number[], opt: any, idx: number) => {
                    if (opt.isCorrect === true || String(opt.isCorrect) === 'true') {
                      acc.push(idx);
                    }
                    return acc;
                  }, []);

                  if (correctIndices.length > 0) {
                    const answerString = correctIndices.map(idx => String.fromCharCode(65 + idx)).join('');
                    processedSq = {
                      ...processedSq,
                      correctAnswer: answerString
                    };
                  }
                }

                // Add individual negative marks for each sub-question
                if (exam?.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
                  const subNegMarks = (sq.marks * exam.mcqNegativeMarking) / 100;
                  processedSq = {
                    ...processedSq,
                    negativeMarks: parseFloat(subNegMarks.toFixed(2))
                  };
                }

                return processedSq;
              });
              processedQuestion = {
                ...processedQuestion,
                subQuestions: shuffledSubQs,
                sub_questions: shuffledSubQs // Keep both for safety
              };
            }
          }

          // Shuffle DESCRIPTIVE sub-types
          if (q.type === 'DESCRIPTIVE') {
            const parts = q.parts || q.sub_questions || q.subQuestions || [];
            if (Array.isArray(parts) && parts.length > 0) {
              const processedParts = parts.map((part: any) => {
                let processedPart = { ...part };

                // 1. Shuffling for Rearranging
                if (part.subType === 'rearranging' && Array.isArray(part.items)) {
                  // Keep track of original item content to label mapping
                  const originalItemsWithLabels = part.items.map((item: string, idx: number) => ({
                    content: item,
                    originalLabel: String.fromCharCode(97 + idx)
                  }));

                  const shuffledItems = shuffleArray(part.items);
                  processedPart = { ...processedPart, items: shuffledItems };

                  // Map original modelAnswer labels to new shuffled labels
                  if (part.modelAnswer) {
                    const originalAnsLabels = part.modelAnswer.split(',').map((s: string) => s.trim().toLowerCase());
                    const newAnsLabels = originalAnsLabels.map((origLabel: string) => {
                      // Find which content had this label
                      const item = originalItemsWithLabels.find((it: any) => it.originalLabel === origLabel);
                      if (!item) return origLabel;
                      // Find new index of this content
                      const newIdx = shuffledItems.indexOf(item.content);
                      return String.fromCharCode(97 + newIdx);
                    });
                    processedPart.modelAnswer = newAnsLabels.join(', ');
                  }
                }

                // 2. Shuffling for Fill-in Word Box
                if (part.subType === 'fill_in' && Array.isArray(part.wordBox)) {
                  processedPart.wordBox = shuffleArray(part.wordBox);
                }

                // 3. Shuffling for Comprehension MCQ
                if (part.subType === 'comprehension_mcq') {
                  const subQs = part.subQuestions || part.questions || [];
                  if (Array.isArray(subQs) && subQs.length > 0) {
                    const shuffledSubQs = shuffleArray(subQs).map((sq: any) => {
                      let processedSq = { ...sq };
                      if (Array.isArray(sq.options)) {
                        const shuffledOptions = shuffleArray(sq.options);
                        processedSq = { ...processedSq, options: shuffledOptions };

                        // Recalculate correctAnswer for the sub-question
                        const correctIndices = shuffledOptions.reduce((acc: number[], opt: any, idx: number) => {
                          const isCorrect = typeof opt === 'object' ? (opt.isCorrect === true || String(opt.isCorrect) === 'true') : false;
                          if (isCorrect) acc.push(idx);
                          return acc;
                        }, []);

                        if (correctIndices.length > 0) {
                          const answerString = correctIndices.map(idx => String.fromCharCode(65 + idx)).join('');
                          processedSq = { ...processedSq, correctAnswer: answerString };
                        }
                      }
                      return processedSq;
                    });
                    processedPart.subQuestions = shuffledSubQs;
                  }
                }

                return processedPart;
              });

              processedQuestion = {
                ...processedQuestion,
                parts: processedParts,
                sub_questions: processedParts,
                subQuestions: processedParts
              };
            }
          }

          // Add negative marks for all Objective-style questions (MCQ, MC, AR, INT, MTF, NUMERIC, SMCQ)
          const isObjective = ['MCQ', 'MC', 'AR', 'INT', 'MTF', 'NUMERIC', 'SMCQ', 'CMA', 'MPC'].includes(q.type);
          const negativePercentage = q.type === 'MC' ? (exam?.mcNegativeMarking || 0) : (exam?.mcqNegativeMarking || 0);

          if (isObjective && negativePercentage > 0) {
            const negativeMarks = (q.marks * negativePercentage) / 100;
            processedQuestion = {
              ...processedQuestion,
              negativeMarks: parseFloat(negativeMarks.toFixed(2))
            };
          }

          return processedQuestion;
        });
        return {
          name: `${newSetName.trim()} ${String.fromCharCode(65 + i)}`,
          questions: orderedQuestions,
        };
      });
      const response = await fetch(`/api/exams/${examId}/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sets: setsToSave }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create exam sets.');
      toast.success(`Generated and saved ${numSets} sets!`);
      // Fetch the new sets and update state
      const setsRes = await fetch(`/api/exams/${examId}/set`);
      const setsData = await setsRes.json();
      setSets(setsData.sets || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !exam) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-4 text-lg">Loading Exam Builder...</p></div>;
  }

  if (!exam) {
    return <div className="flex flex-col items-center justify-center h-screen text-center"><AlertTriangle className="h-16 w-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Exam Not Found</h1><p className="text-muted-foreground">The requested exam could not be found.</p><Button onClick={() => router.push('/dashboard')} className="mt-6">Go to Dashboard</Button></div>;
  }

  const mathJaxConfig = {
    loader: { load: ["input/tex", "input/mml", "output/chtml", "[tex]/mhchem"] },
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      packages: { '[+]': ['ams', 'mhchem'] }
    },
    options: {
      enableEnrichment: false
    }
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-6 lg:p-8">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <header className="mb-6">
            <Card>
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{exam.name}</h1>
                    {isMS ? (
                      <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-2.5 py-0.5 shadow-sm">
                        Multiple Subject (MS)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs font-semibold">
                        Single Subject (SS)
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSubjectType(isMS ? 'SS' : 'MS')}
                      className="h-6 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-dashed border-gray-300 dark:border-gray-700 rounded transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {isMS ? "Switch to SS" : "Switch to MS"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Exam Builder | Total Marks: <span className="font-bold text-foreground">{exam.totalMarks}</span>
                    {isMS && configuredSubjects.length > 0 && ` | ${configuredSubjects.length} Subjects (${exam.subjectsConfig?.mandatoryCount || 0} Mandatory, ${exam.subjectsConfig?.optionalCount || 0} Optional)`}
                  </p>
                  {isMS && configuredSubjects.length > 0 ? (
                    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                      <span className="font-semibold text-muted-foreground">Subjects:</span>
                      {configuredSubjects.map(subj => {
                        const stats = subjectMarksBreakdown.get(subj.name);
                        const isDone = stats && stats.current === subj.totalMarks;
                        return (
                          <Badge
                            key={subj.name}
                            variant={isDone ? "default" : "outline"}
                            className={`text-[11px] px-2 py-0.5 font-semibold ${
                              isDone
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'border-slate-300 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {subj.name}: {stats?.current || 0}/{subj.totalMarks}M {subj.isMandatory ? '★' : '○'}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-4 mt-2 text-xs">
                      <span>CQ: {exam.cqRequiredQuestions}-{exam.cqTotalQuestions} questions (marks count from first {exam.cqRequiredQuestions})</span>
                      <span>SQ: {exam.sqRequiredQuestions}-{exam.sqTotalQuestions} questions (marks count from first {exam.sqRequiredQuestions})</span>
                      <span>MCQ: Remaining questions{exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0 ? ` (${exam.mcqNegativeMarking}% negative marking)` : ''}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={() => window.location.href = '/dashboard'} variant="secondary" size="sm" className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100"><ArrowRight className="mr-2 h-4 w-4" /> Dashboard</Button>
                  <Button variant="secondary" size="sm" onClick={() => router.push('/question-bank')} className="bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-100"><BookOpen className="mr-2 h-4 w-4" /> Question Bank</Button>
                  {isMS && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenConfigureSubjects}
                      className="border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-bold shadow-sm"
                    >
                      <Settings className="mr-1.5 h-4 w-4" /> Configure Quotas
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setBulkDialogOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Bulk Add Questions
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                    onClick={() => router.push(`/exams/${examId}/print`)}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print OMR & Sets ({exam.examSets.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-950/40 font-bold"
                    onClick={() => router.push('/scanner')}
                  >
                    <Camera className="mr-2 h-4 w-4" /> Open OMR Scanner
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild><Button><Eye className="mr-2 h-4 w-4" />Preview Current Set</Button></DialogTrigger>
                    <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Exam Preview: {newSetName || "Untitled Set"}</DialogTitle></DialogHeader><ScrollArea className="h-[70vh] p-4">{selectedQuestions.length > 0 ? selectedQuestions.map((q, index) => (<div key={q.id} className="mb-4"><h3 className="font-bold mb-2">Question {index + 1} {q.subject && <span className="ml-2 text-xs font-normal text-muted-foreground">[{q.subject}]</span>}</h3><QuestionCard question={q} isAdded={true} isSelectable={false} /></div>)) : <p className="text-center text-muted-foreground">No questions selected.</p>}</ScrollArea></DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild><Button variant="secondary"><Wand2 className="mr-2 h-4 w-4" />Auto-Generate Set</Button></DialogTrigger>
                    <AutoGenerateDialog onGenerate={handleAutoGenerate} />
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </header>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column: Question Bank */}
            <div className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Question Bank</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkDialogOpen(true)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Bulk Import
                      </Button>
                      <Badge variant="secondary">{questionsData?.meta.total ?? 0} Questions Found</Badge>
                    </div>
                  </div>
                  <CardDescription>Filter and select questions for the exam.</CardDescription>

                  {/* Interactive Subject Filter Tabs for MS Exams */}
                  {isMS && configuredSubjects.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar border-b pb-2">
                      <span className="text-xs font-bold text-muted-foreground shrink-0 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" /> Subject:
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant={filters.subject === '' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('subject', '')}
                        className="text-xs h-7 px-3 rounded-full font-bold transition-all"
                      >
                        All ({questionsData?.meta.total ?? 0})
                      </Button>
                      {configuredSubjects.map(subj => {
                        const stats = subjectMarksBreakdown.get(subj.name);
                        const curr = stats?.current || 0;
                        const target = subj.totalMarks;
                        const isDone = curr === target;
                        const isActive = filters.subject.trim().toLowerCase() === subj.name.trim().toLowerCase();

                        return (
                          <Button
                            key={subj.name}
                            type="button"
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            onClick={() => handleFilterChange('subject', subj.name)}
                            className={`text-xs h-7 px-3 rounded-full font-bold flex items-center gap-1.5 transition-all ${
                              isActive
                                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                                : isDone
                                ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <span>{subj.name}</span>
                            <span className="text-[10px] opacity-80">
                              ({curr}/{target}M)
                            </span>
                            {isDone && <Check className="w-3 h-3 text-emerald-600" />}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                    {isMS && configuredSubjects.length > 0 ? (
                      <Select value={filters.subject || 'all'} onValueChange={(v) => handleFilterChange('subject', v)}>
                        <SelectTrigger><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects ({questionsData?.meta.total ?? 0})</SelectItem>
                          {configuredSubjects.map(s => {
                            const stats = subjectMarksBreakdown.get(s.name);
                            const curr = stats?.current || 0;
                            return (
                              <SelectItem key={s.name} value={s.name}>
                                {s.name} ({curr}/{s.totalMarks} M){curr === s.totalMarks ? ' ✓' : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input placeholder="Search by subject..." value={filters.subject} onChange={(e) => handleFilterChange('subject', e.target.value)} />
                    )}
                    <Input placeholder="Search by topic..." onChange={(e) => handleFilterChange('topic', e.target.value)} />
                    <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="MCQ">MCQ</SelectItem>
                        <SelectItem value="MC">MC (Multiple Correct)</SelectItem>
                        <SelectItem value="AR">AR (Assertion-Reason)</SelectItem>
                        <SelectItem value="INT">INT (Integer)</SelectItem>
                        <SelectItem value="MTF">MTF (Match Following)</SelectItem>
                        <SelectItem value="CMA">CMA (Constructed Multi-Answer)</SelectItem>
                        <SelectItem value="MPC">MPC (Multi-Step Problem Chain)</SelectItem>
                        <SelectItem value="CQ">CQ</SelectItem>
                        <SelectItem value="SQ">SQ</SelectItem>
                        <SelectItem value="SMCQ">SMCQ (Stem MCQ)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.difficulty} onValueChange={(v) => handleFilterChange('difficulty', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by Difficulty" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Difficulties</SelectItem>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="sm:col-span-3 flex items-center gap-2 flex-wrap">
                      <DatePickerWithRange date={dateRange} setDate={setDateRange} className="flex-grow" />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSelectAll} title="Select all valid questions on this page">
                          <CheckSquare className="mr-2 h-4 w-4" /> Select Page
                        </Button>
                        <Button variant="outline" onClick={handleSelectAllFromDB} title="Select ALL matching questions from database">
                          <CheckSquare className="mr-2 h-4 w-4" /> Select All from DB
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[60vh] pr-4">
                    {isLoading && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                    {!isLoading && questionsData?.data.map(q => {
                      const isAdded = selectedQuestionIds.has(q.id);
                      return (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          onAdd={!isAdded ? handleAddQuestion : undefined}
                          onRemove={isAdded ? handleRemoveQuestion : undefined}
                          isAdded={isAdded}
                          isSelectable={canAddQuestion(q)}
                          selectionReason={getSelectionReason(q)}
                          isMS={isMS}
                          configuredSubjects={configuredSubjects}
                          assignedSubject={getQuestionSubject(q)}
                          onAssignSubject={(newSubj) => handleAssignSubject(q.id, newSubj)}
                        />
                      );
                    })}
                    {!isLoading && questionsData?.data.length === 0 && <p className="text-center text-muted-foreground py-10">No questions match the current filters.</p>}
                  </ScrollArea>
                  {/* Pagination Controls */}
                  {questionsData && questionsData.meta.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <Button variant="outline" onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page <= 1}><ChevronLeft className="h-4 w-4 mr-2" /> Previous</Button>
                      <span className="text-sm text-muted-foreground">Page {filters.page} of {questionsData.meta.totalPages}</span>
                      <Button variant="outline" onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page >= questionsData.meta.totalPages}>Next <ChevronRight className="h-4 w-4 ml-2" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: New Exam Set */}
            <div className="lg:col-span-2">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" />Manual Set Builder</CardTitle>
                  <div className={`flex justify-between items-center text-sm pt-2 p-2 rounded-md ${isSelectionValid ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                    <span className="font-medium">Selected Marks:</span>
                    <span className={`font-bold text-lg ${isSelectionValid ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {currentMarks} / {exam.totalMarks}
                    </span>
                  </div>

                  {/* Multiple Subject (MS): Subject Quota Tracker */}
                  {isMS && configuredSubjects.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Subject Quotas</span>
                        <Badge variant={isMSValid ? "default" : "outline"} className={isMSValid ? "bg-emerald-600 text-white font-bold text-[10px]" : "text-amber-600 border-amber-400 font-bold text-[10px]"}>
                          {isMSValid ? "All Subjects Complete ✓" : "Incomplete Quotas"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                        {configuredSubjects.map(subj => {
                          const stats = subjectMarksBreakdown.get(subj.name);
                          const curr = stats?.current || 0;
                          const target = subj.totalMarks;
                          const pct = Math.min(100, Math.round((curr / target) * 100));
                          const isComplete = curr === target;
                          const isOver = curr > target;

                          return (
                            <div
                              key={subj.name}
                              className={`p-2 rounded-lg border transition-all ${
                                isComplete
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800'
                                  : isOver
                                  ? 'bg-red-50/80 dark:bg-red-950/25 border-red-300 dark:border-red-800'
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-foreground">{subj.name}</span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] px-1 py-0 ${
                                      subj.isMandatory
                                        ? 'border-indigo-300 text-indigo-700 bg-indigo-50/50 dark:text-indigo-300'
                                        : 'border-amber-300 text-amber-700 bg-amber-50/50 dark:text-amber-300'
                                    }`}
                                  >
                                    {subj.isMandatory ? 'Mandatory' : 'Optional'}
                                  </Badge>
                                </div>
                                <span className={isComplete ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : isOver ? 'text-red-600 font-extrabold' : 'text-foreground'}>
                                  {curr} / {target} M
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isComplete ? 'bg-emerald-500' : isOver ? 'bg-red-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center mt-1 text-[10px]">
                                <span className={isComplete ? 'text-emerald-600 font-medium' : isOver ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                                  {isComplete ? 'Quota Complete ✓' : isOver ? `${curr - target}M over limit` : `${target - curr}M needed`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleFilterChange('subject', subj.name)}
                                  className="text-primary hover:underline font-bold"
                                >
                                  Filter {subj.name} →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Single Subject (SS): Strictly Preserved CQ/SQ/MCQ Breakdown */
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div className={`p-2 rounded ${isCQValid ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                        <div className="font-medium">CQ</div>
                        <div>{selectedCQQuestions.length} / {exam.cqRequiredQuestions}-{exam.cqTotalQuestions}</div>
                        <div>{cqMarks} marks (first {exam.cqRequiredQuestions})</div>
                      </div>
                      <div className={`p-2 rounded ${isSQValid ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                        <div className="font-medium">SQ</div>
                        <div>{selectedSQQuestions.length} / {exam.sqRequiredQuestions}-{exam.sqTotalQuestions}</div>
                        <div>{sqMarks} marks (first {exam.sqRequiredQuestions})</div>
                      </div>
                      <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/30">
                        <div className="font-medium">MCQ</div>
                        <div>{selectedMCQQuestions.length} questions</div>
                        <div>{mcqMarks} marks</div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <label htmlFor="setName" className="block text-sm font-medium mb-1">Set Name</label>
                    <Input id="setName" placeholder="e.g., Set A, Morning Shift" value={newSetName} onChange={(e) => setNewSetName(e.target.value)} />
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    <label htmlFor="numSets" className="text-sm font-medium">Number of Sets:</label>
                    <Input
                      id="numSets"
                      type="number"
                      min={1}
                      max={10}
                      value={numSets}
                      onChange={e => setNumSets(Math.max(1, Math.min(10, Number(e.target.value))))}
                      className="w-20 text-center"
                    />
                  </div>
                  <h3 className="text-md font-semibold mb-2">Selected Questions ({selectedQuestions.length})</h3>
                  <ScrollArea className="h-[45vh] pr-4">
                    {selectedQuestions.length > 0 ? (
                      isMS && configuredSubjects.length > 0 ? (
                        <div className="space-y-4">
                          {configuredSubjects.map(subj => {
                            const stats = subjectMarksBreakdown.get(subj.name);
                            const curr = stats?.current || 0;
                            const target = subj.totalMarks;
                            const isDone = curr === target;
                            const subjQuestions = selectedQuestions.filter(q => {
                              const s = getQuestionSubject(q);
                              return matchSubject(s, subj.name);
                            });

                            return (
                              <div key={subj.name} className="border rounded-lg p-3 bg-white dark:bg-slate-900/60 shadow-sm">
                                <div className="flex items-center justify-between pb-2 mb-2 border-b">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-foreground">{subj.name}</span>
                                    <Badge
                                      variant={isDone ? "default" : "outline"}
                                      className={`text-[10px] px-1.5 py-0 font-bold ${
                                        isDone ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-amber-600 border-amber-300'
                                      }`}
                                    >
                                      {curr} / {target} M {isDone ? '✓' : ''}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground font-semibold">{subjQuestions.length} Questions</span>
                                </div>
                                {subjQuestions.length > 0 ? (
                                  <div className="space-y-2">
                                    {subjQuestions.map(q => (
                                      <QuestionCard
                                        key={q.id}
                                        question={q}
                                        onRemove={handleRemoveQuestion}
                                        isAdded={true}
                                        isSelectable={false}
                                        isMS={isMS}
                                        configuredSubjects={configuredSubjects}
                                        assignedSubject={getQuestionSubject(q)}
                                        onAssignSubject={(newSubj) => handleAssignSubject(q.id, newSubj)}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic py-3 text-center">No questions added yet for {subj.name}.</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        selectedQuestions.map(q => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            onRemove={handleRemoveQuestion}
                            isAdded={true}
                            isSelectable={false}
                          />
                        ))
                      )
                    ) : (
                      <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Add questions from the bank.</p>
                      </div>
                    )}
                  </ScrollArea>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild><div className="mt-4"><Button className="w-full" onClick={handleGenerateSets} disabled={!isSelectionValid || isSubmitting || !newSetName.trim()}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Generate & Save Sets</Button></div></TooltipTrigger>
                      {!isSelectionValid && (
                        <TooltipContent>
                          {isMS ? (
                            <p>
                              All configured subjects must reach their exact marks quota:{' '}
                              {configuredSubjects.map(s => `${s.name} (${s.totalMarks}M)`).join(', ')}
                            </p>
                          ) : (
                            <p>
                              All validation criteria must be met: CQ ({exam.cqRequiredQuestions}-{exam.cqTotalQuestions}), SQ ({exam.sqRequiredQuestions}-{exam.sqTotalQuestions}), and total marks ({exam.totalMarks}).
                            </p>
                          )}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* After save, display a table/grid showing question order and MCQ option order for each set */}
          {sets.length > 0 && (
            <>
              <div className="overflow-x-auto mt-8">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">#</th>
                      <th className="border px-2 py-1">Question</th>
                      {sets.map((set, idx) => (
                        <th key={set.name} className="border px-2 py-1 flex items-center gap-2 justify-between">
                          <span>{set.name}</span>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => { setPreviewSet(set); setPreviewOpen(true); }}
                              title={`Preview set ${set.name}`}
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                  await fetch(`/api/exams/${examId}/set?setId=${set.id}`, { method: 'DELETE' });
                                  setSets(prev => prev.filter(s => s.id !== set.id));
                                  toast.success(`Set '${set.name}' deleted.`);
                                } catch (e) {
                                  toast.error('Failed to delete set.');
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              disabled={isSubmitting}
                              title={`Delete set ${set.name}`}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuestions.map((q, qIdx) => (
                      <tr key={q.id}>
                        <td className="border px-2 py-1">{qIdx + 1}</td>
                        <td className="border px-2 py-1">
                          <UniversalMathJax inline dynamic>{cleanupMath(q.questionText)}</UniversalMathJax>
                        </td>
                        {sets.map((set, sIdx) => {
                          const setQ = Array.isArray(set.questionsJson) ? set.questionsJson[qIdx] : undefined;
                          return (
                            <td key={set.name} className="border px-2 py-1">
                              {setQ ? (
                                <div>
                                  <UniversalMathJax inline dynamic>{cleanupMath(setQ.questionText)}</UniversalMathJax>
                                  {((setQ.type === 'MCQ' || setQ.type === 'AR') && Array.isArray(setQ.options)) && (
                                    <ul className="list-disc pl-4 mt-1">
                                      {setQ.options.map((opt: any, i: number) => {
                                        let isCorrect = false;
                                        if (opt.isCorrect !== undefined) isCorrect = opt.isCorrect;
                                        // Fallback to correctOption index check if isCorrect not explicit on option
                                        if (!isCorrect && setQ.correctOption !== undefined) {
                                          isCorrect = (i === (Number(setQ.correctOption) - 1));
                                        }
                                        return (
                                          <li key={i} className={isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}>
                                            <UniversalMathJax inline dynamic>{cleanupMath(opt.text)}</UniversalMathJax>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                  {['MCQ', 'MC', 'AR', 'INT', 'MTF', 'NUMERIC', 'SMCQ'].includes(setQ.type || '') && setQ.negativeMarks && (
                                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                                      -{setQ.negativeMarks} marks
                                    </div>
                                  )}
                                  {(setQ.type === 'INT' || setQ.type === 'NUMERIC') && (
                                    <div className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-400">
                                      Answer: {setQ.correctAnswer || setQ.modelAnswer || setQ.correct}
                                    </div>
                                  )}
                                  {setQ.type === 'SMCQ' && (setQ.subQuestions || setQ.sub_questions) && (
                                    <div className="mt-2 text-[10px] space-y-2">
                                      <div className="font-bold text-gray-400 uppercase tracking-tighter">Sub MCQs:</div>
                                      {(setQ.subQuestions || setQ.sub_questions || []).map((sq: any, i: number) => (
                                        <div key={i} className="pl-2 border-l border-blue-200">
                                          <div className="font-medium">
                                            {i + 1}. <UniversalMathJax inline dynamic>{cleanupMath(sq.question || sq.text || '')}</UniversalMathJax>
                                          </div>
                                          {Array.isArray(sq.options) && (
                                            <ul className="list-disc pl-4 mt-0.5 opacity-80">
                                              {sq.options.map((opt: any, oi: number) => (
                                                <li key={oi} className={opt.isCorrect || String(opt.isCorrect) === 'true' ? 'text-green-600 font-bold' : ''}>
                                                  <UniversalMathJax inline dynamic>{cleanupMath(opt.text)}</UniversalMathJax>
                                                  {sq.negativeMarks && opt.isCorrect === false && (
                                                    <span className="text-[8px] text-red-400 ml-1">(-{sq.negativeMarks})</span>
                                                  )}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : <span className="text-muted-foreground">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Preview Dialog */}
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Preview: {previewSet?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {Array.isArray(previewSet?.questionsJson) && previewSet.questionsJson.length > 0 ? (
                      previewSet.questionsJson.map((q: any, idx: number) => (
                        <div key={q.id || idx} className="mb-6">
                          <div className="font-bold mb-1">Q{idx + 1}.</div>
                          <div className="mb-2">
                            <UniversalMathJax inline dynamic>{cleanupMath(q.questionText)}</UniversalMathJax>
                          </div>
                          {((q.type === 'MCQ' || q.type === 'AR') && Array.isArray(q.options)) && (
                            <ul className="list-disc pl-6 mt-1">
                              {q.options.map((opt: any, i: number) => {
                                let isCorrect = false;
                                if (opt.isCorrect !== undefined) isCorrect = opt.isCorrect;
                                if (!isCorrect && q.correctOption !== undefined) {
                                  isCorrect = (i === (Number(q.correctOption) - 1));
                                }
                                return (
                                  <li key={i} className={isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}>
                                    <UniversalMathJax inline dynamic>{cleanupMath(opt.text)}</UniversalMathJax>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {q.type === 'MCQ' && q.negativeMarks && (
                            <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                              Negative marking: -{q.negativeMarks} marks for wrong answer
                            </div>
                          )}
                          {q.type === 'CQ' && Array.isArray(q.subQuestions) && (
                            <div className="space-y-2 mt-2 ml-6 border-l-2 border-indigo-100 dark:border-indigo-900 pl-4">
                              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Sub Questions:</span>
                              {q.subQuestions.map((sq: any, i: number) => (
                                <div key={i} className="text-sm">
                                  <span className="font-bold mr-1">{String.fromCharCode(97 + i)}.</span>
                                  <UniversalMathJax inline dynamic>{cleanupMath(sq.question || sq.text || sq || '')}</UniversalMathJax>
                                  {sq.marks && <span className="ml-2 text-[10px] text-gray-400">[{sq.marks}M]</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'SQ' && (q.modelAnswer || q.explanation) && (
                            <div className="mt-2 pt-2 border-t"><span className="font-semibold text-xs mb-1">Answer:</span> <UniversalMathJax inline dynamic>{cleanupMath(q.modelAnswer || q.explanation)}</UniversalMathJax></div>
                          )}
                          {q.type === 'SMCQ' && (q.subQuestions || q.sub_questions) && (
                            <div className="mt-3 space-y-4 ml-6 border-l-2 border-blue-100 dark:border-blue-900 pl-4">
                              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Sub MCQs (Stem-based):</span>
                              {(q.subQuestions || q.sub_questions || []).map((sq: any, i: number) => (
                                <div key={i} className="space-y-2">
                                  <div className="text-sm font-semibold">
                                    {i + 1}. <UniversalMathJax inline>{cleanupMath(sq.question || sq.questionText || sq.text || sq || '')}</UniversalMathJax>
                                    <span className="ml-2 text-[10px] text-gray-400">[{sq.marks}M]</span>
                                  </div>
                                  {sq.options && Array.isArray(sq.options) && (
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                      {sq.options.map((opt: any, oi: number) => {
                                        const isCorrect = opt.isCorrect || String(opt.isCorrect) === 'true';
                                        return (
                                          <li key={oi} className={`text-[11px] p-1.5 rounded border ${isCorrect ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-white border-gray-100'}`}>
                                            <span className="mr-1.5 text-gray-400">{String.fromCharCode(65 + oi)})</span>
                                            <UniversalMathJax inline>{cleanupMath(opt.text)}</UniversalMathJax>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {q.type === 'CMA' && (
                            <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs space-y-2">
                              <span className="font-bold text-indigo-900 dark:text-indigo-300 uppercase text-[10px]">Constructed Multi-Answer Parts:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(((q as any).parts || (q as any).cmaParts || q.subQuestions) || []).map((part: any, pIdx: number) => (
                                  <div key={pIdx} className="p-2 bg-white dark:bg-slate-900 border rounded text-[11px] space-y-1">
                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                      <span className="text-indigo-600 dark:text-indigo-400 mr-1">({part.label || `Part ${pIdx + 1}`})</span>
                                      <UniversalMathJax inline dynamic>{cleanupMath(part.prompt || part.text || part.question || '')}</UniversalMathJax>
                                    </div>
                                    <div className="text-emerald-600 dark:text-emerald-400 font-mono">
                                      Answer: <UniversalMathJax inline dynamic>{cleanupMath(String(part.expectedAnswer ?? part.modelAnswer ?? ''))}</UniversalMathJax> {part.unit || ''}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {q.type === 'MPC' && (
                            <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs space-y-2">
                              <span className="font-bold text-blue-900 dark:text-blue-300 uppercase text-[10px]">Multi-Step Problem Chain Stages:</span>
                              <div className="space-y-1.5">
                                {(((q as any).stages || (q as any).mpcStages || q.subQuestions) || []).map((stage: any, sIdx: number) => (
                                  <div key={sIdx} className="p-2 bg-white dark:bg-slate-900 border rounded text-[11px] flex justify-between items-center gap-2">
                                    <div>
                                      <span className="font-bold text-blue-600 dark:text-blue-400 mr-1.5">Step {sIdx + 1}:</span>
                                      <UniversalMathJax inline dynamic>{cleanupMath(stage.stageTitle || stage.prompt || stage.text || stage.question || '')}</UniversalMathJax>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                      Expected: <UniversalMathJax inline dynamic>{cleanupMath(String(stage.expectedAnswer ?? stage.modelAnswer ?? ''))}</UniversalMathJax> {stage.unit || ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : <div className="text-muted-foreground text-center">No questions in this set.</div>}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          {sets.length > 0 && (
            <div className="flex justify-end mb-2">
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await fetch(`/api/exams/${examId}/set`, { method: 'DELETE' });
                    setSets([]);
                    toast.success('All sets deleted.');
                  } catch (e) {
                    toast.error('Failed to delete sets.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
              >
                Delete All Sets
              </Button>
            </div>
          )}

          {/* Bulk Add Exam Questions Dialog */}
          {exam && (
            <BulkAddExamQuestionsDialog
              isOpen={bulkDialogOpen}
              onOpenChange={setBulkDialogOpen}
              exam={exam}
              onAddQuestionsToSet={handleBulkAddQuestions}
              onQuestionsPermanentlySaved={() => fetchExamData(filters, dateRange)}
            />
          )}

          {/* Dialog for Configuring MS Subjects and Quotas */}
          <Dialog open={configureSubjectsOpen} onOpenChange={setConfigureSubjectsOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Configure MS Subject Quotas
                </DialogTitle>
                <DialogDescription>
                  Configure the subjects and their exact required marks for this Multi-Subject Exam ({exam?.totalMarks} Total Marks).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 max-h-[60vh] overflow-y-auto pr-1">
                {editingSubjects.map((subj, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50 dark:bg-slate-900/40">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-muted-foreground">Subject Name</label>
                      <Input
                        value={subj.name}
                        onChange={(e) => {
                          const updated = [...editingSubjects];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setEditingSubjects(updated);
                        }}
                        placeholder="e.g. Physics"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-[11px] font-bold text-muted-foreground">Target Marks</label>
                      <Input
                        type="number"
                        min={1}
                        value={subj.totalMarks}
                        onChange={(e) => {
                          const updated = [...editingSubjects];
                          updated[idx] = { ...updated[idx], totalMarks: Number(e.target.value) || 0 };
                          setEditingSubjects(updated);
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="pt-4 flex items-center gap-1">
                      <Button
                        type="button"
                        variant={subj.isMandatory ? "default" : "outline"}
                        size="sm"
                        className={`h-8 text-xs font-bold ${subj.isMandatory ? 'bg-primary' : ''}`}
                        onClick={() => {
                          const updated = [...editingSubjects];
                          updated[idx] = { ...updated[idx], isMandatory: !subj.isMandatory };
                          setEditingSubjects(updated);
                        }}
                      >
                        {subj.isMandatory ? 'Mandatory' : 'Optional'}
                      </Button>
                      {editingSubjects.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setEditingSubjects(prev => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingSubjects(prev => [
                      ...prev,
                      { name: `Subject ${prev.length + 1}`, totalMarks: 25, isMandatory: true }
                    ]);
                  }}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Another Subject
                </Button>

                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-semibold">
                  <span>Sum of Subject Marks:</span>
                  <span className={
                    editingSubjects.reduce((sum, s) => sum + (Number(s.totalMarks) || 0), 0) === exam?.totalMarks
                      ? "text-emerald-600 font-bold"
                      : "text-amber-600 font-bold"
                  }>
                    {editingSubjects.reduce((sum, s) => sum + (Number(s.totalMarks) || 0), 0)} / {exam?.totalMarks} Marks
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setConfigureSubjectsOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveSubjectsConfig} className="font-bold">Save Quotas & Sync</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MathJaxContext>
  );
}

