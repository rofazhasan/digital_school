// app/exams/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlusCircle, Printer, Save, X, Loader2, Eye, AlertTriangle, BookOpen, ClipboardList, Wand2, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
import { cleanupMath } from "@/lib/utils";

// --- Mock Prisma Types (replace with your actual generated types) ---
// You would typically import these from `import type { Exam, Question, QuestionType, Difficulty } from '@prisma/client'`
type QuestionType = 'MCQ' | 'CQ' | 'SQ' | 'INT' | 'AR' | 'MTF' | 'MC';
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
  images?: string[];
  modelAnswer?: string;
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

const QuestionCard = ({ question, onAdd, onRemove, isAdded, isSelectable, selectionReason }: {
  question: Question;
  onAdd?: (q: Question) => void;
  onRemove?: (id: string) => void;
  isAdded: boolean;
  isSelectable: boolean;
  selectionReason?: string;
}) => (
  <div className={`p-4 border rounded-lg mb-3 transition-all ${isAdded ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
    <div className="flex justify-between items-start gap-4">
      <div className="prose prose-sm dark:prose-invert max-w-full flex-grow">
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
                {Array.isArray(question.leftColumn) && question.leftColumn.map((item: any, i: number) => (
                  <div key={i} className="text-xs p-1.5 bg-white dark:bg-gray-900 border rounded flex items-start gap-2">
                    <span className="font-bold text-blue-600">{i + 1}.</span>
                    <UniversalMathJax inline>{cleanupMath(item.text)}</UniversalMathJax>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Column B</span>
                {Array.isArray(question.rightColumn) && question.rightColumn.map((item: any, i: number) => (
                  <div key={i} className="text-xs p-1.5 bg-white dark:bg-gray-900 border rounded flex items-start gap-2">
                    <span className="font-bold text-purple-600">{String.fromCharCode(65 + i)}.</span>
                    <UniversalMathJax inline>{cleanupMath(item.text)}</UniversalMathJax>
                  </div>
                ))}
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

        {(question.type?.toUpperCase() === 'CQ' || question.type?.toUpperCase() === 'SQ') && (question.subQuestions || question.sub_questions) && (
          <div className="mt-3 space-y-3">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Sub Questions:</span>
            {(question.subQuestions || question.sub_questions || []).map((sq: any, i: number) => (
              <div key={i} className="pl-4 border-l-2 border-indigo-100 dark:border-indigo-900 py-1">
                <div className="text-xs font-medium">
                  {String.fromCharCode(97 + i)}. <UniversalMathJax inline>{cleanupMath(sq.question || sq.questionText || sq.text || sq || '')}</UniversalMathJax>
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
      <TooltipProvider>
        {onAdd && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={() => onAdd(question)} disabled={isAdded || !isSelectable}>
                <PlusCircle className={`h-5 w-5 ${isAdded || !isSelectable ? 'text-gray-400' : 'text-green-500 hover:text-green-600'}`} />
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
              <Button size="icon" variant="ghost" onClick={() => onRemove(question.id)}>
                <X className="h-5 w-5 text-red-500 hover:text-red-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Remove Question</p></TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 flex-wrap">
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
        {question.type === 'MCQ' && question.negativeMarks && (
          <Badge variant="destructive" className="text-xs">-{question.negativeMarks} Marks</Badge>
        )}
        <Badge variant="outline">Sub: {question.subject}</Badge>
        {question.topic && <Badge variant="outline" className="text-teal-600 border-teal-600 dark:text-teal-400 dark:border-teal-400">{question.topic}</Badge>}
        {selectionReason && (
          <Badge variant="outline" className="text-xs">{selectionReason}</Badge>
        )}
      </div>
    </div>
  </div>
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

    const newQuestions = questionsData.data.filter(q =>
      !selectedQuestionIds.has(q.id) && canAddQuestion(q)
    );

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

      const newQuestions = allMatchingQuestions.filter(q =>
        !selectedQuestionIds.has(q.id) && canAddQuestion(q)
      );

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

  // Derived State for Question Selection Logic
  const selectedCQQuestions = useMemo(() => selectedQuestions.filter(q => q.type === 'CQ'), [selectedQuestions]);
  const selectedSQQuestions = useMemo(() => selectedQuestions.filter(q => q.type === 'SQ'), [selectedQuestions]);
  const selectedMCQQuestions = useMemo(() => selectedQuestions.filter(q => ['MCQ', 'MC', 'AR', 'INT', 'MTF'].includes(q.type)), [selectedQuestions]);

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

  // Total marks is sum of required CQ + required SQ + all MCQ
  const currentMarks = useMemo(() => cqMarks + sqMarks + mcqMarks, [cqMarks, sqMarks, mcqMarks]);

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
  const isSelectionValid = useMemo(() => isCQValid && isSQValid && isMarksMatched, [isCQValid, isSQValid, isMarksMatched]);

  const selectedQuestionIds = useMemo(() => new Set(selectedQuestions.map(q => q.id)), [selectedQuestions]);

  // Helper function to determine if a question can be added
  const canAddQuestion = useCallback((question: Question) => {
    if (!exam) return false;

    // Check if question is already selected
    if (selectedQuestionIds.has(question.id)) return false;

    // Check type-specific constraints first
    if (question.type === 'CQ') {
      if (selectedCQQuestions.length >= exam.cqTotalQuestions) return false;
    } else if (question.type === 'SQ') {
      if (selectedSQQuestions.length >= exam.sqTotalQuestions) return false;
    }

    // For MCQ/Objective questions, check if adding would exceed total marks
    if (['MCQ', 'MC', 'AR', 'INT', 'MTF'].includes(question.type)) {
      if (currentMarks + question.marks > exam.totalMarks) return false;
    }

    return true;
  }, [exam, selectedQuestionIds, currentMarks, selectedCQQuestions.length, selectedSQQuestions.length]);

  // Helper function to get selection reason for tooltip
  const getSelectionReason = useCallback((question: Question) => {
    if (!exam) return '';

    if (selectedQuestionIds.has(question.id)) return 'Already Added';

    if (question.type === 'CQ') {
      if (selectedCQQuestions.length >= exam.cqTotalQuestions) return 'CQ Limit Reached';
      return 'Add CQ Question';
    } else if (question.type === 'SQ') {
      if (selectedSQQuestions.length >= exam.sqTotalQuestions) return 'SQ Limit Reached';
      return 'Add SQ Question';
    } else if (['MCQ', 'MC', 'AR', 'INT', 'MTF'].includes(question.type)) {
      if (currentMarks + question.marks > exam.totalMarks) return 'Exceeds Total Marks';
      return `Add ${question.type} Question`;
    }

    return 'Add Question';
  }, [exam, selectedQuestionIds, currentMarks, selectedCQQuestions.length, selectedSQQuestions.length]);

  // Event Handlers
  const handleAddQuestion = (question: Question) => {
    if (!selectedQuestionIds.has(question.id) && canAddQuestion(question)) {
      setSelectedQuestions(prev => [...prev, question]);
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
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  // On generate, create N sets with shuffled questions and MCQ options
  const handleGenerateSets = async () => {
    if (!isSelectionValid) {
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
        const shuffledQuestions = shuffleArray(selectedQuestions).map(q => {
          let processedQuestion = { ...q };

          // Shuffle MCQ/MC options
          if ((q.type === 'MCQ' || q.type === 'MC') && Array.isArray(q.options)) {
            const shuffledOptions = shuffleArray(q.options);
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

          // Add negative marks for all Objective-style questions (MCQ, MC, AR, INT, MTF, NUMERIC)
          if (['MCQ', 'MC', 'AR', 'INT', 'MTF', 'NUMERIC'].includes(q.type) && exam?.mcqNegativeMarking && exam.mcqNegativeMarking > 0) {
            const negativeMarks = (q.marks * exam.mcqNegativeMarking) / 100;
            processedQuestion = {
              ...processedQuestion,
              negativeMarks: parseFloat(negativeMarks.toFixed(2))
            };
          }

          return processedQuestion;
        });
        return {
          name: `${newSetName.trim()} ${String.fromCharCode(65 + i)}`,
          questions: shuffledQuestions,
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
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
      inlineMath: [["$", "$"], ["\\(", "\\)"]],
      displayMath: [["$$", "$$"], ["\\[", "\\]"]],
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
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{exam.name}</h1>
                  <p className="text-sm text-muted-foreground">Exam Builder | Total Marks: {exam.totalMarks}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span>CQ: {exam.cqRequiredQuestions}-{exam.cqTotalQuestions} questions (marks count from first {exam.cqRequiredQuestions})</span>
                    <span>SQ: {exam.sqRequiredQuestions}-{exam.sqTotalQuestions} questions (marks count from first {exam.sqRequiredQuestions})</span>
                    <span>MCQ: Remaining questions{exam.mcqNegativeMarking && exam.mcqNegativeMarking > 0 ? ` (${exam.mcqNegativeMarking}% negative marking)` : ''}</span>
                  </div>

                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={() => window.location.href = '/dashboard'} variant="secondary" size="sm" className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100"><ArrowRight className="mr-2 h-4 w-4" /> Dashboard</Button>
                  <Button variant="secondary" size="sm" onClick={() => router.push('/question-bank')} className="bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-100"><BookOpen className="mr-2 h-4 w-4" /> Question Bank</Button>
                  <Button variant="outline" onClick={() => router.push(`/exams/${examId}/print`)}><Printer className="mr-2 h-4 w-4" />Print Sets ({exam.examSets.length})</Button>
                  <Dialog>
                    <DialogTrigger asChild><Button><Eye className="mr-2 h-4 w-4" />Preview Current Set</Button></DialogTrigger>
                    <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Exam Preview: {newSetName || "Untitled Set"}</DialogTitle></DialogHeader><ScrollArea className="h-[70vh] p-4">{selectedQuestions.length > 0 ? selectedQuestions.map((q, index) => (<div key={q.id} className="mb-4"><h3 className="font-bold mb-2">Question {index + 1}</h3><QuestionCard question={q} isAdded={true} isSelectable={false} /></div>)) : <p className="text-center text-muted-foreground">No questions selected.</p>}</ScrollArea></DialogContent>
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
                    <Badge variant="secondary">{questionsData?.meta.total ?? 0} Questions Found</Badge>
                  </div>
                  <CardDescription>Filter and select questions for the exam.</CardDescription>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                    <Input placeholder="Search by subject..." onChange={(e) => handleFilterChange('subject', e.target.value)} />
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
                        <SelectItem value="CQ">CQ</SelectItem>
                        <SelectItem value="SQ">SQ</SelectItem>
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
                  {/* Question Type Breakdown */}
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
                    {selectedQuestions.length > 0 ? selectedQuestions.map(q => <QuestionCard key={q.id} question={q} onRemove={handleRemoveQuestion} isAdded={true} isSelectable={false} />) : <div className="text-center py-10 border-2 border-dashed rounded-lg"><p className="text-muted-foreground">Add questions from the bank.</p></div>}
                  </ScrollArea>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild><div className="mt-4"><Button className="w-full" onClick={handleGenerateSets} disabled={!isSelectionValid || isSubmitting || !newSetName.trim()}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Generate & Save Sets</Button></div></TooltipTrigger>
                      {!isSelectionValid && <TooltipContent><p>All validation criteria must be met: CQ ({exam.cqRequiredQuestions}-{exam.cqTotalQuestions}), SQ ({exam.sqRequiredQuestions}-{exam.sqTotalQuestions}), and total marks ({exam.totalMarks}).</p></TooltipContent>}
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
                          {q.hasMath ? <UniversalMathJax inline>{cleanupMath(q.questionText)}</UniversalMathJax> : q.questionText}
                        </td>
                        {sets.map((set, sIdx) => {
                          const setQ = Array.isArray(set.questionsJson) ? set.questionsJson[qIdx] : undefined;
                          return (
                            <td key={set.name} className="border px-2 py-1">
                              {setQ ? (
                                <div>
                                  {setQ.hasMath ? <UniversalMathJax inline>{cleanupMath(setQ.questionText)}</UniversalMathJax> : setQ.questionText}
                                  {setQ.type === 'MCQ' && Array.isArray(setQ.options) && (
                                    <ul className="list-disc pl-4 mt-1">
                                      {setQ.options.map((opt: any, i: number) => (
                                        <li key={i} className={opt.isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}>
                                          {opt.text && /\\\(|\\\[|\\\]|\\\)/.test(opt.text) ? <UniversalMathJax inline>{cleanupMath(opt.text)}</UniversalMathJax> : opt.text}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {setQ.type === 'MCQ' && setQ.negativeMarks && (
                                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                                      -{setQ.negativeMarks} marks
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
                            {q.hasMath ? <UniversalMathJax inline>{cleanupMath(q.questionText)}</UniversalMathJax> : q.questionText}
                          </div>
                          {q.type === 'MCQ' && Array.isArray(q.options) && (
                            <ul className="list-disc pl-6 mt-1">
                              {q.options.map((opt: any, i: number) => (
                                <li key={i} className={opt.isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}>
                                  {opt.text && /\\\(|\\\[|\\\]|\\\)/.test(opt.text) ? <MathJax>{opt.text}</MathJax> : opt.text}
                                </li>
                              ))}
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
                                  <UniversalMathJax inline>{cleanupMath(sq.question || sq.text || sq || '')}</UniversalMathJax>
                                  {sq.marks && <span className="ml-2 text-[10px] text-gray-400">[{sq.marks}M]</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'SQ' && q.modelAnswer && (
                            <div className="mt-2 pt-2 border-t"><span className="font-semibold text-xs mb-1">Answer:</span> {q.modelAnswer}</div>
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
        </div>
      </div>
    </MathJaxContext>
  );
}

