"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef, useCallback, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
// import Latex from "react-latex"; // Replaced by MathJax
import "katex/dist/katex.min.css";
import { WebGLContextManager } from "@/components/ui/webgl-context-manager";
import { WebGLFallback, useWebGLSupport } from "@/components/ui/webgl-fallback";
import { WebGLErrorBoundary } from "@/components/ui/webgl-error-boundary";

// --- Shadcn UI & Icons ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PlusCircle, Trash2, Edit, Save, X, Bot, Wand2, Loader2, Search, ChevronsUpDown, Check, BrainCircuit, BookCopy, Library, FilterX, Upload, FileSpreadsheet, Download, AlertTriangle, ArrowRight, FileText } from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- Types ---
type QuestionType = 'MCQ' | 'CQ' | 'SQ';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type QuestionBank = { id: string; name: string; subject: string };
type Question = {
  id: string; type: QuestionType; subject: string; topic?: string | null; marks: number; difficulty: Difficulty;
  questionText: string; questionLatex?: string | null; hasMath: boolean;
  options?: Array<{ text: string; isCorrect: boolean; explanation?: string; image?: string }>;
  subQuestions?: Array<{ question: string; marks: number; modelAnswer?: string; image?: string }>;
  modelAnswer?: string | null; class: { id: string; name: string }; createdBy: { id: string; name: string };
  questionBanks: QuestionBank[]; createdAt: string; isAiGenerated?: boolean;
  images?: string[];
};

// Enhanced types for AI generated questions
type GeneratedQuestion = {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: Array<{ text: string; isCorrect: boolean; explanation?: string; image?: string }>;
  subQuestions?: Array<{ question: string; marks: number; modelAnswer?: string; image?: string }>;
  modelAnswer?: string;
  marks: number;
  difficulty: Difficulty;
  subject: string;
  topic?: string;
  class: { id: string; name: string };
  hasMath?: boolean;
  questionLatex?: string;
};

// Add this at the top of your project (e.g., types/react-latex.d.ts):
// declare module 'react-latex';

// --- Reusable Components ---
const ThreeJSBackground: React.FC = () => {
  const ref = useRef<any>(null);
  const [contextLost, setContextLost] = useState(false);

  const [sphere] = useState<Float32Array>(() => {
    // Further reduce particle count to minimize WebGL context loss
    const positions = new Float32Array(1000 * 3); // Reduced from 1500 to 1000
    for (let i = 0; i < 1000; i++) {
      const r = 4.5 + Math.random() * 2;
      const t = Math.random() * Math.PI;
      const p = Math.random() * Math.PI * 2;
      positions[i * 3] = r * Math.sin(t) * Math.cos(p);
      positions[i * 3 + 1] = r * Math.sin(t) * Math.sin(p);
      positions[i * 3 + 2] = r * Math.cos(t);
    }
    return positions;
  });

  useFrame((_, delta) => {
    if (ref.current && !contextLost) {
      // Reduce rotation speed to improve performance
      ref.current.rotation.x -= delta / 40; // Reduced speed
      ref.current.rotation.y -= delta / 50; // Reduced speed
    }
  });

  return (
    <>
      <WebGLContextManager
        id="question-bank-background"
        onContextLost={() => {
          console.log('Question bank background context lost');
          setContextLost(true);
        }}
        onContextRestored={() => {
          console.log('Question bank background context restored');
          setContextLost(false);
        }}
      />
      {!contextLost && (
        <Points
          ref={ref}
          positions={sphere}
          stride={3}
          frustumCulled={false}
        >
          <PointMaterial
            transparent
            color="#4A5568"
            size={0.015} // Reduced size
            sizeAttenuation={true}
            depthWrite={false}
            alphaTest={0.1}
          />
        </Points>
      )}
    </>
  );
};

const MathToolbar = ({ onInsert }: { onInsert: (text: string) => void }) => {
  const symbols = [
    // Basic operations
    { display: '√x', latex: '$\\sqrt{}$' },
    { display: 'x²', latex: '$^{2}$' },
    { display: 'x/y', latex: '$\\frac{}{}$' },
    { display: '±', latex: '$\\pm$' },
    { display: '≠', latex: '$\\neq$' },
    { display: '≤', latex: '$\\leq$' },
    { display: '≥', latex: '$\\geq$' },

    // Greek letters
    { display: 'α', latex: '$\\alpha$' },
    { display: 'β', latex: '$\\beta$' },
    { display: 'π', latex: '$\\pi$' },
    { display: 'θ', latex: '$\\theta$' },
    { display: 'φ', latex: '$\\phi$' },
    { display: 'Δ', latex: '$\\Delta$' },

    // Calculus
    { display: '∑', latex: '$\\sum_{i=1}^{n}$' },
    { display: '∫', latex: '$\\int_{a}^{b}$' },
    { display: 'dx', latex: '$dx$' },
    { display: 'dy/dx', latex: '$\\frac{dy}{dx}$' },
    { display: 'lim', latex: '$\\lim_{x \\to a}$' },

    // Arrows and logic
    { display: '→', latex: '$\\rightarrow$' },
    { display: '←', latex: '$\\leftarrow$' },
    { display: '↔', latex: '$\\leftrightarrow$' },
    { display: '∴', latex: '$\\therefore$' },
    { display: '∵', latex: '$\\because$' },

    // Sets and logic
    { display: '∈', latex: '$\\in$' },
    { display: '∉', latex: '$\\notin$' },
    { display: '⊂', latex: '$\\subset$' },
    { display: '∪', latex: '$\\cup$' },
    { display: '∩', latex: '$\\cap$' },

    // Tables and matrices
    { display: 'Table', latex: '$\\begin{array}{|c|c|c|} \\hline A & B & C \\\\ \\hline 1 & 2 & 3 \\\\ \\hline \\end{array}$' },
    { display: 'Matrix', latex: '$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$' },
    { display: 'Det', latex: '$\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}$' },

    // Geometry
    { display: '△', latex: '$\\triangle$' },
    { display: '⊙', latex: '$\\odot$' },
    { display: '□', latex: '$\\square$' },
    { display: '∠', latex: '$\\angle$' },
    { display: '∥', latex: '$\\parallel$' },
    { display: '⊥', latex: '$\\perp$' },

    // Common expressions
    { display: 'x²+y²', latex: '$x^2 + y^2$' },
    { display: 'ax²+bx+c', latex: '$ax^2 + bx + c$' },
    { display: 'sin(x)', latex: '$\\sin(x)$' },
    { display: 'cos(x)', latex: '$\\cos(x)$' },
    { display: 'tan(x)', latex: '$\\tan(x)$' },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md mb-2">
      {symbols.map(s => (
        <Button
          key={s.display}
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-1 text-xs"
          onMouseDown={(e) => {
            e.preventDefault();
            onInsert(s.latex);
          }}
          title={s.latex}
        >
          <MathJax inline>{`$${s.display}$`}</MathJax>
        </Button>
      ))}
    </div>
  );
};

import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { cleanupMath } from "@/lib/utils";

// --- Main Page Component ---
export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isCreateBankDialogOpen, setIsCreateBankDialogOpen] = useState(false);
  const [webglContextLost, setWebglContextLost] = useState(false);
  const { toast } = useToast();
  const webglSupported = useWebGLSupport();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.classes)) {
          setClasses(data.classes);
        } else if (Array.isArray(data)) {
          setClasses(data);
        } else {
          console.error('Invalid classes data received:', data);
          setClasses([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching classes:', error);
        setClasses([]);
      });
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [qRes, qbRes] = await Promise.all([
        fetch("/api/question-bank"),
        fetch("/api/question-bank?action=get-question-banks")
      ]);
      if (!qRes.ok || !qbRes.ok) throw new Error("Failed to fetch data");
      const qData = await qRes.json();
      const qbData = await qbRes.json();

      // Ensure qData is an array
      if (Array.isArray(qData)) {
        setQuestions(qData);
      } else {
        console.error('Invalid questions data received:', qData);
        setQuestions([]);
        toast({ variant: "destructive", title: "Error", description: "Invalid data received from server." });
      }

      // Ensure qbData is an array
      if (Array.isArray(qbData)) {
        setQuestionBanks(qbData);
      } else {
        console.error('Invalid question banks data received:', qbData);
        setQuestionBanks([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setQuestions([]);
      setQuestionBanks([]);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch initial data." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = (question: Question) => { setEditingQuestion(question); setIsFormOpen(true); };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/question-bank?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Deletion failed on server");
      setQuestions(prev => prev.filter(q => q.id !== id));
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast({ title: "Success", description: "Question deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete question." });
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedQuestions.size} questions? This cannot be undone.`)) return;

    try {
      const ids = Array.from(selectedQuestions).join(',');
      const res = await fetch(`/api/question-bank?ids=${ids}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Bulk deletion failed");

      setQuestions(prev => prev.filter(q => !selectedQuestions.has(q.id)));
      setSelectedQuestions(new Set());
      toast({ title: "Success", description: `${selectedQuestions.size} questions deleted.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete selected questions." });
    }
  };

  const handleFormSave = (savedQuestion: Question) => {
    setQuestions(prev => {
      const exists = prev.some(q => q.id === savedQuestion.id);
      return exists ? prev.map(q => q.id === savedQuestion.id ? savedQuestion : q) : [savedQuestion, ...prev];
    });
    setIsFormOpen(false);
    setEditingQuestion(null);
  };

  const handleBankCreated = (newBank: QuestionBank) => {
    setQuestionBanks(prev => [...prev, newBank]);
    toast({ title: "Bank Created", description: `'${newBank.name}' is now available.` });
  };

  const uniqueSubjects = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return [...new Set(questions.map((q: Question) => q.subject).filter(Boolean))];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions
      .filter((q: Question) => searchTerm === "" || (q.questionText || '').toLowerCase().includes(searchTerm.toLowerCase()) || (q.subject || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((q: Question) => classFilter === "all" || q.class?.id === classFilter)
      .filter((q: Question) => subjectFilter === "all" || q.subject === subjectFilter)
      .filter((q: Question) => difficultyFilter === "all" || q.difficulty === difficultyFilter)
      .filter((q: Question) => topicFilter === "" || (q.topic || '').toLowerCase().includes(topicFilter.toLowerCase()))
      .filter((q: Question) => {
        if (!dateRange || !dateRange.from) return true;
        const qDate = new Date(q.createdAt);
        const start = startOfDay(dateRange.from);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        return isWithinInterval(qDate, { start, end });
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [questions, searchTerm, classFilter, subjectFilter, difficultyFilter, topicFilter, dateRange]);

  const resetFilters = () => {
    setSearchTerm("");
    setClassFilter("all");
    setSubjectFilter("all");
    setDifficultyFilter("all");
    setTopicFilter("");
    setDateRange(undefined);
  };

  const mathJaxConfig = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
      inlineMath: [["$", "$"], ["\\(", "\\)"]],
      displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    }
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="relative min-h-screen w-full bg-gray-50 dark:bg-gray-900 p-4 md:p-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <WebGLErrorBoundary>
            <WebGLFallback webglSupported={webglSupported}>
              <Suspense fallback={
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" />
              }>
                <Canvas
                  camera={{ position: [0, 0, 5] }}
                  gl={{
                    powerPreference: "high-performance",
                    antialias: true,
                    alpha: false,
                    stencil: false,
                    depth: true
                  }}
                  onCreated={({ gl }) => {
                    gl.setClearColor(0x000000, 0);
                    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                    // Handle WebGL context loss
                    const canvas = gl.domElement;
                    canvas.addEventListener('webglcontextlost', (event: Event) => {
                      event.preventDefault();
                      console.warn('WebGL context lost in question bank');
                      setWebglContextLost(true);
                      toast({
                        title: "Graphics Issue",
                        description: "Enhanced graphics temporarily unavailable. The page will continue to work normally.",
                        variant: "default"
                      });
                    });

                    canvas.addEventListener('webglcontextrestored', () => {
                      console.log('WebGL context restored in question bank');
                      setWebglContextLost(false);
                      toast({
                        title: "Graphics Restored",
                        description: "Enhanced graphics are back online.",
                        variant: "default"
                      });
                    });
                  }}
                >
                  <ThreeJSBackground />
                </Canvas>
              </Suspense>
            </WebGLFallback>
          </WebGLErrorBoundary>
          {webglContextLost && (
            <div className="absolute top-4 right-4 z-20">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg px-3 py-2 text-sm text-yellow-800 dark:text-yellow-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>Graphics temporarily unavailable</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-bold flex items-center gap-3"><BookCopy className="w-8 h-8 text-indigo-500" />Question Repository</CardTitle>
              <CardDescription>A centralized hub to browse, create, and intelligently generate questions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-200 dark:bg-gray-800">
                  <TabsTrigger value="browse">Browse</TabsTrigger>
                  <TabsTrigger value="create">Create Manually</TabsTrigger>
                  <TabsTrigger value="ai">AI Generator</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="browse" className="mt-4">
                  <Card className="p-4 mb-4 bg-white/50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="lg:col-span-2">
                        <Label htmlFor="search-term">Search</Label>
                        <Input id="search-term" placeholder="Search question text..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="class-filter">Class</Label>
                        <Select value={classFilter} onValueChange={setClassFilter}>
                          <SelectTrigger id="class-filter"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subject-filter">Subject</Label>
                        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                          <SelectTrigger id="subject-filter"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All Subjects</SelectItem>{uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="difficulty-filter">Difficulty</Label>
                        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                          <SelectTrigger id="difficulty-filter"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All Difficulties</SelectItem><SelectItem value="EASY">Easy</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HARD">Hard</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="topic-filter">Topic</Label>
                        <Input id="topic-filter" placeholder="Filter by topic..." value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} />
                      </div>
                      <div>
                        <Label>Date Range</Label>
                        <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full" />
                      </div>
                      <div className="flex items-end gap-2 lg:col-span-5 flex-wrap">
                        <Button onClick={resetFilters} variant="ghost" size="sm" className="whitespace-nowrap"><FilterX className="mr-2 h-4 w-4" />Reset Filters</Button>
                        <div className="flex-grow"></div>
                        <Button onClick={() => window.location.href = '/exams'} variant="outline" className="whitespace-nowrap"><FileText className="mr-2 h-4 w-4" /> Go to Exams</Button>
                        <Button onClick={() => window.location.href = '/dashboard'} variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100 whitespace-nowrap"><ArrowRight className="mr-2 h-4 w-4" /> Dashboard</Button>
                        <Button onClick={() => { setEditingQuestion(null); setIsFormOpen(true); }} className="whitespace-nowrap"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
                      </div>
                    </div>
                  </Card>

                  {filteredQuestions.length > 0 && (
                    <div className="flex items-center justify-between mb-4 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="select-all"
                          checked={selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                        <Label htmlFor="select-all" className="cursor-pointer">
                          Select All ({filteredQuestions.length})
                        </Label>
                      </div>
                      {selectedQuestions.size > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Selected ({selectedQuestions.size})
                        </Button>
                      )}
                    </div>
                  )}

                  {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    : filteredQuestions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredQuestions.map(q => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isSelected={selectedQuestions.has(q.id)}
                            onSelect={() => toggleSelection(q.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-500">
                        <p className="font-semibold">No questions found</p>
                        <p className="text-sm">Try adjusting your filters or creating a new question.</p>
                      </div>
                    )}
                </TabsContent>

                <TabsContent value="create" className="mt-4">
                  <QuestionForm key="create-form" initialData={null} onSave={handleFormSave} onCancel={() => setIsFormOpen(false)} classes={classes} questionBanks={questionBanks} openCreateBankDialog={() => setIsCreateBankDialogOpen(true)} />
                </TabsContent>
                <TabsContent value="ai" className="mt-4">
                  <AIGenerator onQuestionSaved={handleFormSave} classes={classes} questionBanks={questionBanks} openCreateBankDialog={() => setIsCreateBankDialogOpen(true)} />
                </TabsContent>
                <TabsContent value="bulk" className="mt-4">
                  <BulkUpload onQuestionSaved={handleFormSave} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>{editingQuestion ? 'Edit Question' : 'Create New Question'}</DialogTitle></DialogHeader>
            <div className="flex-grow overflow-y-auto -mx-6 px-6 pb-4">
              <QuestionForm key={editingQuestion ? editingQuestion.id : 'dialog-create-form'} initialData={editingQuestion} onSave={handleFormSave} onCancel={() => setIsFormOpen(false)} classes={classes} questionBanks={questionBanks} openCreateBankDialog={() => setIsCreateBankDialogOpen(true)} />
            </div>
          </DialogContent>
        </Dialog>
        <CreateQuestionBankDialog isOpen={isCreateBankDialogOpen} onOpenChange={setIsCreateBankDialogOpen} onBankCreated={handleBankCreated} />
      </div>
    </MathJaxContext>
  );
}

const QuestionCard: React.FC<{
  question: Question;
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ question, onEdit, onDelete, isSelected, onSelect }) => {
  const difficultyColors: Record<Difficulty, string> = {
    EASY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    HARD: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-start gap-3 w-full">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect()}
                className="mt-1"
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-base font-semibold leading-snug prose prose-sm dark:prose-invert max-w-full">
                <MathJax>{question.questionText || ''}</MathJax>
              </CardTitle>
            </div>
          </div>
          <Badge variant="outline" className="whitespace-nowrap">{question.marks} Marks</Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs mt-2">
          <Badge className={difficultyColors[question.difficulty]}>{question.difficulty}</Badge>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{question.subject}</Badge>
          {question.topic && <Badge variant="outline" className="text-teal-600 border-teal-600 dark:text-teal-400 dark:border-teal-400">{question.topic}</Badge>}
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{question.class.name}</Badge>
          {question.isAiGenerated && <Badge variant="outline" className="text-indigo-500 border-indigo-500"><Bot className="h-3 w-3 mr-1" />AI</Badge>}
          {question.hasMath && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
              Math
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow prose prose-sm dark:prose-invert max-w-none">
        {question.type === 'MCQ' && (
          <div className="space-y-2">
            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Options:</p>
            <ul className="list-disc pl-5 my-0 space-y-2">
              {((question.options || []) || []).map((opt: any, i: number) => (
                <li key={i} className={`${opt.isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                  <MathJax inline>{opt.text || ''}</MathJax>
                  {opt.image && (
                    <div className="my-2">
                      <img src={opt.image} alt={`Option ${i + 1}`} className="max-h-32 rounded border" />
                    </div>
                  )}
                  {opt.isCorrect && opt.explanation && (
                    <div className="mt-2 ml-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700">
                      <span className="font-semibold text-green-700 dark:text-green-300 text-xs">Explanation: </span>
                      <span className="text-green-600 dark:text-green-400 text-xs"><MathJax inline>{opt.explanation}</MathJax></span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {question.type === 'CQ' && (
          <div className="space-y-2">
            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Sub-questions:</p>
            <ol className="list-decimal pl-5 my-0 space-y-3">
              {((question.subQuestions || []) || []).map((sq: any, i: number) => (
                <li key={i} className="space-y-2">
                  <div>
                    <MathJax>{sq.question || ''}</MathJax>

                    {sq.image && (
                      <div className="my-2">
                        <img src={sq.image} alt={`Sub-question ${i + 1}`} className="max-h-32 rounded border" />
                      </div>
                    )}
                    <span className="text-xs font-mono text-gray-500 ml-2">[{sq.marks || 0} marks]</span>
                  </div>
                  {sq.modelAnswer && (
                    <div className="ml-4 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                      <span className="font-semibold text-blue-700 dark:text-blue-300 text-xs">Model Answer: </span>
                      <span className="text-blue-600 dark:text-blue-400 text-xs"><MathJax>{sq.modelAnswer}</MathJax></span>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
        {question.type === 'SQ' && question.modelAnswer && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Model Answer:</p>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
              <MathJax>{question.modelAnswer}</MathJax>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" size="sm" onClick={() => onEdit(question)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => onDelete(question.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
      </CardFooter>
    </Card>
  );
};

interface QuestionFormProps {
  initialData?: Question | null;
  onSave: (savedQuestion: Question) => void;
  onCancel?: () => void;
  classes: { id: string; name: string }[];
  questionBanks: QuestionBank[];
  openCreateBankDialog: () => void;
  isRefiningAi?: boolean;
}
const QuestionForm: React.FC<QuestionFormProps> = ({ initialData, onSave, onCancel, classes, questionBanks, openCreateBankDialog, isRefiningAi = false }) => {
  const { toast } = useToast();
  const [type, setType] = useState<QuestionType>(initialData?.type || 'MCQ');
  const [questionText, setQuestionText] = useState(initialData?.questionText || 'Enter your question here...');
  const [subject, setSubject] = useState(initialData?.subject || 'Mathematics');
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [marks, setMarks] = useState(initialData?.marks || 5);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialData?.difficulty || 'MEDIUM');
  const [classId, setClassId] = useState(initialData?.class?.id || (classes.length > 0 ? classes[0].id : ''));
  const [questionBankIds, setQuestionBankIds] = useState<string[]>((initialData?.questionBanks || []).map((qb: QuestionBank) => qb.id) || []);
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean; explanation?: string; image?: string }[]>(
    initialData?.options || [
      { text: 'Option A', isCorrect: true, explanation: '', image: '' },
      { text: 'Option B', isCorrect: false, explanation: '', image: '' },
      { text: 'Option C', isCorrect: false, explanation: '', image: '' },
      { text: 'Option D', isCorrect: false, explanation: '', image: '' }
    ]
  );
  const [subQuestions, setSubQuestions] = useState<{ question: string; marks: number; modelAnswer?: string; image?: string }[]>(
    initialData?.subQuestions || [{ question: 'Sub-question 1', marks: 5, modelAnswer: '', image: '' }]
  );
  const [modelAnswer, setModelAnswer] = useState(initialData?.modelAnswer || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTextarea, setActiveTextarea] = useState<{ id: string; setter: (v: any) => void; index?: number;[key: string]: any }>({ id: 'qtext', setter: setQuestionText });
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // Update classId when classes are loaded
  useEffect(() => {
    if (classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  // Debug logging
  useEffect(() => {
    console.log('QuestionForm initial state:', {
      type,
      questionText,
      subject,
      topic,
      marks,
      difficulty,
      classId,
      questionBankIds,
      options,
      subQuestions,
      modelAnswer,
      images,
      classes: classes.length
    });
  }, [type, questionText, subject, topic, marks, difficulty, classId, questionBankIds, options, subQuestions, modelAnswer, images, classes.length]);

  const handleInsertSymbol = useCallback((symbol: string) => {
    if (!activeTextarea || !activeTextarea.setter) return;
    const ref = textareaRefs.current[activeTextarea.id];
    if (!ref) return;
    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const text = ref.value;
    const newText = text.substring(0, start) + symbol + text.substring(end);
    activeTextarea.setter(newText);
    setTimeout(() => { ref.focus(); ref.selectionStart = ref.selectionEnd = start + symbol.length; }, 0);
  }, [activeTextarea]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setImages(prev => [...prev, data.url]);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Error", description: error.message });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleFieldImageUpload = async (file: File, callback: (url: string) => void) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      callback(data.url);
      toast({ title: "Success", description: "Image attached" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const makeFocusHandler = (id: string, setter: React.Dispatch<React.SetStateAction<any>>, index?: number) => () => setActiveTextarea({ id, setter, index });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const isUpdate = initialData?.id && !isRefiningAi;

    // Validate required fields before submission
    if (!questionText.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Question content is required" });
      setIsSaving(false);
      return;
    }

    if (!subject.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Subject is required" });
      setIsSaving(false);
      return;
    }

    if (!classId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Class is required" });
      setIsSaving(false);
      return;
    }

    // Validate MCQ options
    if (type === 'MCQ') {
      if (!options || options.length < 2) {
        toast({ variant: "destructive", title: "Validation Error", description: "MCQ must have at least 2 options" });
        setIsSaving(false);
        return;
      }

      const validOptions = options.filter(opt => opt.text.trim() !== '');
      if (validOptions.length < 2) {
        toast({ variant: "destructive", title: "Validation Error", description: "MCQ must have at least 2 valid options" });
        setIsSaving(false);
        return;
      }

      const correctOptions = validOptions.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        toast({ variant: "destructive", title: "Validation Error", description: "MCQ must have exactly one correct option" });
        setIsSaving(false);
        return;
      }
    }

    // Validate CQ sub-questions
    if (type === 'CQ') {
      if (!subQuestions || subQuestions.length < 1) {
        toast({ variant: "destructive", title: "Validation Error", description: "CQ must have at least one sub-question" });
        setIsSaving(false);
        return;
      }

      const validSubQuestions = subQuestions.filter(sq => sq.question.trim() !== '');
      if (validSubQuestions.length < 1) {
        toast({ variant: "destructive", title: "Validation Error", description: "CQ must have at least one valid sub-question" });
        setIsSaving(false);
        return;
      }
    }

    // Validate SQ model answer
    if (type === 'SQ' && !modelAnswer.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "SQ must have a model answer" });
      setIsSaving(false);
      return;
    }

    const payload = {
      type,
      subject: subject.trim(),
      topic: topic.trim() || undefined,
      marks: Number(marks),
      difficulty,
      classId,
      questionText: questionText.trim(),
      isAiGenerated: !!initialData?.isAiGenerated,
      options: type === 'MCQ' ? options.filter(opt => opt.text.trim() !== '').map(opt => ({
        text: opt.text.trim(),
        isCorrect: opt.isCorrect,
        explanation: opt.explanation?.trim() || undefined,
        image: opt.image || undefined
      })) : null,
      subQuestions: type === 'CQ' ? subQuestions.filter(sq => sq.question.trim() !== '').map(sq => ({
        question: sq.question.trim(),
        marks: Number(sq.marks),
        modelAnswer: sq.modelAnswer?.trim() || undefined,
        image: sq.image || undefined
      })) : null,
      modelAnswer: type === 'SQ' && modelAnswer.trim() !== '' ? modelAnswer.trim() : null,
      hasMath: /\\/.test(questionText) ||
        (type === 'MCQ' && options.some((opt: { text: string; isCorrect: boolean; explanation?: string }) =>
          /\\/.test(opt.text) || (opt.explanation && /\\/.test(opt.explanation))
        )) ||
        (type === 'CQ' && subQuestions.some((sq: { question: string; marks: number; modelAnswer?: string }) =>
          /\\/.test(sq.question) || (sq.modelAnswer && /\\/.test(sq.modelAnswer))
        )) ||
        (type === 'SQ' && /\\/.test(modelAnswer)),
      questionBankIds: questionBankIds.length > 0 ? questionBankIds : null,
      images: images.length > 0 ? images : undefined,
    };

    console.log('Submitting payload:', payload);

    try {
      const url = isUpdate ? `/api/question-bank?id=${initialData.id}` : '/api/question-bank';
      const method = isUpdate ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (!response.ok) {
        const err = await response.json();
        console.error('API Error Response:', err);

        // Extract detailed error information
        let errorMessage = 'Failed to save question';
        if (err.details?.body?._errors?.[0]) {
          errorMessage = err.details.body._errors[0];
        } else if (err.details?.fieldErrors && typeof err.details.fieldErrors === 'object') {
          const fieldErrors = Object.entries(err.details.fieldErrors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`)
            .join('; ');
          errorMessage = `Validation errors: ${fieldErrors}`;
        } else if (err.error) {
          errorMessage = err.error;
        }

        throw new Error(errorMessage);
      }

      const savedQuestion = await response.json();
      toast({ title: "Success", description: `Question ${isUpdate ? 'updated' : 'created'}.` });
      if (onSave) onSave(savedQuestion);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({ variant: "destructive", title: "Save Error", description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Question Type</Label><Select value={type} onValueChange={(v: QuestionType) => setType(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MCQ">MCQ</SelectItem><SelectItem value="CQ">CQ</SelectItem><SelectItem value="SQ">SQ</SelectItem></SelectContent></Select></div>
            <div><Label>Class</Label><Select value={classId} onValueChange={setClassId} required><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map((c: { id: string, name: string }) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label>Question Banks (Optional)</Label><MultiSelect options={questionBanks} selected={questionBankIds} onChange={setQuestionBankIds} openCreateBankDialog={openCreateBankDialog} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} required /></div>
            <div><Label>Topic (Optional)</Label><Input value={topic} onChange={e => setTopic(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Marks</Label><Input type="number" value={marks} onChange={e => setMarks(Number(e.target.value))} required /></div>
            <div><Label>Difficulty</Label><Select value={difficulty} onValueChange={(v: Difficulty) => setDifficulty(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EASY">Easy</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HARD">Hard</SelectItem></SelectContent></Select></div>
          </div>
          <div>
            <Label>Question Content</Label>
            <MathToolbar onInsert={handleInsertSymbol} />
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Enhanced Math Support:</strong> Use the toolbar above for mathematical expressions, tables, matrices, and geometry.
                Tables are supported using LaTeX array syntax.
              </p>
            </div>
            <Textarea
              ref={el => { textareaRefs.current['qtext'] = el; }}
              onFocus={makeFocusHandler('qtext', setQuestionText)}
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              required
              rows={8}
              placeholder="Enter your question here. Use the math toolbar above for mathematical expressions, tables, and geometry..."
            />
            {/\\/.test(questionText) && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium">Mathematical content detected</span>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <Label>Attachments (Images/Diagrams)</Label>
              <div className="flex flex-wrap gap-4">
                {images.map((url, i) => (
                  <div key={i} className="relative group w-24 h-24 border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> : <Upload className="w-6 h-6 text-gray-400" />}
                  <span className="text-[10px] text-gray-500 mt-1">Upload</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Label>Type-specific Details</Label>
          <AnimatePresence mode="wait"><motion.div key={type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50">
            {type === 'MCQ' && (
              <div className="space-y-2">
                <Label>Options</Label>
                <MathToolbar onInsert={handleInsertSymbol} />
                {(options || []).map((opt: { text: string; isCorrect: boolean; explanation?: string; image?: string }, i: number) => (
                  <div key={i} className="space-y-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800/30">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={opt.isCorrect} onCheckedChange={() => setOptions((options || []).map((o, idx) => ({ ...o, isCorrect: i === idx })))} />
                      <Textarea
                        ref={el => { textareaRefs.current[`opt-${i}`] = el; }}
                        onFocus={makeFocusHandler(`opt-${i}`, (newText) => { const newOpts = [...(options || [])]; newOpts[i].text = newText; setOptions(newOpts); })}
                        value={opt.text}
                        onChange={e => { const newOpts = [...(options || [])]; newOpts[i].text = e.target.value; setOptions(newOpts); }}
                        placeholder={`Option ${i + 1}`}
                        rows={2}
                        className="h-auto flex-grow"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFieldImageUpload(e.target.files[0], (url) => {
                                const newOpts = [...(options || [])];
                                newOpts[i].image = url;
                                setOptions(newOpts);
                              });
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                          id={`opt-img-${i}`}
                        />
                        <Label htmlFor={`opt-img-${i}`} className="cursor-pointer">
                          <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-600" asChild>
                            <span><Upload className="h-4 w-4" /></span>
                          </Button>
                        </Label>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setOptions((options || []).filter((_, idx) => i !== idx))}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    {opt.image && (
                      <div className="ml-8 mb-2 relative w-20 h-20 group">
                        <img src={opt.image} alt="Option attachment" className="w-full h-full object-cover rounded border" />
                        <button type="button" onClick={() => {
                          const newOpts = [...(options || [])];
                          newOpts[i].image = undefined;
                          setOptions(newOpts);
                        }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {opt.isCorrect && (
                      <div className="ml-6 space-y-2">
                        <Label className="text-sm text-gray-600 dark:text-gray-400">Explanation (Optional)</Label>
                        <MathToolbar onInsert={handleInsertSymbol} />
                        <Textarea
                          ref={el => { textareaRefs.current[`opt-expl-${i}`] = el; }}
                          onFocus={makeFocusHandler(`opt-expl-${i}`, (newText) => { const newOpts = [...(options || [])]; newOpts[i].explanation = newText; setOptions(newOpts); })}
                          value={opt.explanation || ''}
                          onChange={e => { const newOpts = [...(options || [])]; newOpts[i].explanation = e.target.value; setOptions(newOpts); }}
                          placeholder="Explain why this option is correct..."
                          rows={3}
                          className="h-auto"
                        />
                        {opt.explanation && /\\/.test(opt.explanation) && (
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs font-medium">Math detected in explanation</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {(/\\/.test(opt.text) || (opt.explanation && /\\/.test(opt.explanation))) && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-medium">Mathematical content detected</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...(options || []), { text: '', isCorrect: false, explanation: '', image: '' }])}>
                  <PlusCircle className="mr-2 h-4 w-4" />Add Option
                </Button>
              </div>
            )}
            {type === 'SQ' && (
              <div>
                <Label>Model Answer</Label>
                <MathToolbar onInsert={handleInsertSymbol} />
                <Textarea
                  ref={el => { textareaRefs.current['modelans'] = el; }}
                  onFocus={makeFocusHandler('modelans', setModelAnswer)}
                  value={modelAnswer}
                  onChange={e => setModelAnswer(e.target.value)}
                  rows={4}
                  placeholder="Enter the model answer with step-by-step solution..."
                />
                {modelAnswer && /\\/.test(modelAnswer) && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-medium">Mathematical content detected in model answer</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {type === 'CQ' && (
              <div className="space-y-2">
                <Label>Sub-questions</Label>
                {(subQuestions || []).map((sq: { question: string; marks: number; modelAnswer?: string; image?: string }, i: number) => (
                  <div key={i} className="space-y-3 p-3 border rounded-md bg-gray-50 dark:bg-gray-800/30">
                    <div className="flex items-start gap-2">
                      <div className="flex-grow space-y-2">
                        <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400">Question {i + 1}</Label>
                          <MathToolbar onInsert={handleInsertSymbol} />
                          <Textarea
                            ref={el => { textareaRefs.current[`sq-${i}`] = el; }}
                            onFocus={makeFocusHandler(`sq-${i}`, (newText) => { const newSQs = [...(subQuestions || [])]; newSQs[i].question = newText; setSubQuestions(newSQs); })}
                            value={sq.question}
                            onChange={e => { const newSQs = [...(subQuestions || [])]; newSQs[i].question = e.target.value; setSubQuestions(newSQs); }}
                            placeholder="Sub-question text"
                            rows={3}
                            className="h-auto"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-sm text-gray-600 dark:text-gray-400">Marks</Label>
                            <Input
                              type="number"
                              value={sq.marks}
                              onChange={e => { const newSQs = [...(subQuestions || [])]; newSQs[i].marks = Number(e.target.value); setSubQuestions(newSQs); }}
                              placeholder="Marks"
                              className="w-24"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600 dark:text-gray-400">Model Answer (Optional)</Label>
                          <MathToolbar onInsert={handleInsertSymbol} />
                          <Textarea
                            ref={el => { textareaRefs.current[`sq-ans-${i}`] = el; }}
                            onFocus={makeFocusHandler(`sq-ans-${i}`, (newText) => { const newSQs = [...(subQuestions || [])]; newSQs[i].modelAnswer = newText; setSubQuestions(newSQs); })}
                            value={sq.modelAnswer || ''}
                            onChange={e => { const newSQs = [...(subQuestions || [])]; newSQs[i].modelAnswer = e.target.value; setSubQuestions(newSQs); }}
                            placeholder="Model answer for this sub-question..."
                            rows={3}
                            className="h-auto"
                          />
                          {sq.modelAnswer && /\\/.test(sq.modelAnswer) && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs font-medium">Math detected in model answer</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFieldImageUpload(e.target.files[0], (url) => {
                                const newSQs = [...(subQuestions || [])];
                                newSQs[i].image = url;
                                setSubQuestions(newSQs);
                              });
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                          id={`sq-img-${i}`}
                        />
                        <Label htmlFor={`sq-img-${i}`} className="cursor-pointer">
                          <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-600" asChild>
                            <span><Upload className="h-4 w-4" /></span>
                          </Button>
                        </Label>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setSubQuestions((subQuestions || []).filter((_, idx) => i !== idx))}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    {sq.image && (
                      <div className="ml-8 mb-2 relative w-20 h-20 group">
                        <img src={sq.image} alt="Sub-question attachment" className="w-full h-full object-cover rounded border" />
                        <button type="button" onClick={() => {
                          const newSQs = [...(subQuestions || [])];
                          newSQs[i].image = undefined;
                          setSubQuestions(newSQs);
                        }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {(/\\/.test(sq.question) || (sq.modelAnswer && /\\/.test(sq.modelAnswer))) && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-medium">Mathematical content detected</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setSubQuestions([...(subQuestions || []), { question: '', marks: 5, modelAnswer: '', image: '' }])}>
                  <PlusCircle className="mr-2 h-4 w-4" />Add Sub-question
                </Button>
              </div>
            )}
          </motion.div></AnimatePresence>
          <Label>Live Preview</Label>
          <Card className="h-full min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="prose dark:prose-invert max-w-none">
              <MathJax>{questionText || ''}</MathJax>
              {type === 'MCQ' && (
                <div className="mt-4">
                  <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Options:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    {(options || []).map((opt: { text: string; isCorrect: boolean; explanation?: string; image?: string }, i: number) => (
                      <li key={i} className={`${opt.isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                        <MathJax inline>{opt.text || `(Option ${i + 1})`}</MathJax>
                        {opt.image && (
                          <div className="my-2">
                            <img src={opt.image} alt={`Option ${i + 1}`} className="max-h-32 rounded border" />
                          </div>
                        )}
                        {opt.isCorrect && opt.explanation && (
                          <div className="mt-1 ml-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Explanation:</p>
                            <p className="text-xs text-green-600 dark:text-green-400"><MathJax inline>{opt.explanation}</MathJax></p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {type === 'CQ' && (
                <div className="mt-4">
                  <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Sub-questions:</p>
                  <ol className="list-decimal pl-5 space-y-3">
                    {(subQuestions || []).map((sq: { question: string; marks: number; modelAnswer?: string; image?: string }, i: number) => (
                      <li key={i} className="space-y-2">
                        <div>
                          <MathJax>{sq.question || `(Sub-question ${i + 1})`}</MathJax>
                          {sq.image && (
                            <div className="my-2">
                              <img src={sq.image} alt={`Sub-question ${i + 1}`} className="max-h-32 rounded border" />
                            </div>
                          )}
                          <span className="text-xs font-mono text-gray-500 ml-2">[{sq.marks || 0} marks]</span>
                        </div>
                        {sq.modelAnswer && (
                          <div className="ml-4 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Model Answer:</p>
                            <MathJax>{sq.modelAnswer}</MathJax>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {type === 'SQ' && modelAnswer && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Model Answer:</p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <MathJax>{modelAnswer}</MathJax>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id && !isRefiningAi ? 'Save Changes' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
};

interface MultiSelectProps {
  options: QuestionBank[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  openCreateBankDialog: () => void;
}
const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, placeholder = "Select...", openCreateBankDialog }) => {
  const [open, setOpen] = useState(false);
  const selectedNames = (options || []).filter((opt: QuestionBank) => selected.includes(opt.id)).map((opt: QuestionBank) => opt.name).join(', ');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between font-normal"><span className="truncate">{selected.length > 0 ? selectedNames : placeholder}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search banks..." />
          <CommandList>
            <CommandEmpty>No banks found. Create one!</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => { openCreateBankDialog(); setOpen(false); }} className="text-indigo-600 dark:text-indigo-400 cursor-pointer"><PlusCircle className="mr-2 h-4 w-4" /> Create New Bank</CommandItem>
              {(options || []).map((option: QuestionBank) => (
                <CommandItem key={option.id} value={option.name} onSelect={() => { const newSelected = selected.includes(option.id) ? selected.filter((id: string) => id !== option.id) : [...selected, option.id]; onChange(newSelected); }}>
                  <Check className={`mr-2 h-4 w-4 ${selected.includes(option.id) ? "opacity-100" : "opacity-0"}`} />{option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CreateQuestionBankDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBankCreated: (bank: QuestionBank) => void;
}
const CreateQuestionBankDialog: React.FC<CreateQuestionBankDialogProps> = ({ isOpen, onOpenChange, onBankCreated }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/question-bank/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, chapter }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create bank"); }
      const newBank = await res.json();
      onBankCreated(newBank);
      onOpenChange(false);
      setName(''); setSubject(''); setChapter('');
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Library className="w-5 h-5" /> Create New Question Bank</DialogTitle><DialogDescription>Add a new bank to categorize your questions.</DialogDescription></DialogHeader>
        <form onSubmit={handleCreateBank} className="space-y-4 py-4">
          <div className="space-y-2"><Label htmlFor="bank-name">Bank Name</Label><Input id="bank-name" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="bank-subject">Subject</Label><Input id="bank-subject" value={subject} onChange={e => setSubject(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="bank-chapter">Chapter (Optional)</Label><Input id="bank-chapter" value={chapter} onChange={e => setChapter(e.target.value)} /></div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Bank</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface AIGeneratorProps {
  onQuestionSaved: (q: Question) => void;
  classes: { id: string; name: string }[];
  questionBanks: QuestionBank[];
  openCreateBankDialog: () => void;
}
const AIGenerator: React.FC<AIGeneratorProps> = ({ onQuestionSaved, classes, questionBanks, openCreateBankDialog }) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<GeneratedQuestion | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const generateTempId = () => `temp-id-${Date.now()}-${Math.random()}`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedQuestions([]);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const selectedClass = classes.find((c: { id: string; name: string }) => c.id === data.classId);

    try {
      const response = await fetch('/api/question-bank', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-with-ai',
          ...data,
          className: selectedClass?.name || 'General',
          includeAnswers: String(data.includeAnswers) === 'on' || String(data.includeAnswers) === 'true'
        }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.details || err.error); }
      const result = await response.json();
      setGeneratedQuestions((result.questions || []).map((q: any) => ({ ...q, id: generateTempId(), class: selectedClass })));
      toast({ title: "Preview Ready", description: "Review the generated questions below." });
    } catch (error) {
      toast({ variant: "destructive", title: "Generation Error", description: (error as Error).message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOne = async (questionData: GeneratedQuestion) => {
    try {
      const { id, class: qClass, ...payload } = questionData;
      const response = await fetch('/api/question-bank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, classId: qClass.id }) });
      if (!response.ok) throw new Error("Failed to save question");
      const savedQuestion = await response.json();
      onQuestionSaved(savedQuestion as Question);
      setGeneratedQuestions(prev => prev.filter(q => q.id !== questionData.id));
      toast({ title: "Success", description: "Question added to bank." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Error", description: (error as Error).message });
    }
  };

  const handleEditAndSave = (savedQuestion: Question) => {
    onQuestionSaved(savedQuestion);
    setGeneratedQuestions(prev => prev.filter(q => q.id !== editingQuestion?.id));
    setEditingQuestion(null);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <CardTitle className="flex items-center gap-2"><BrainCircuit className="w-6 h-6 text-indigo-500" />Generation Parameters</CardTitle>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Class</Label><Select name="classId" required defaultValue={classes.length > 0 ? classes[0].id : ''}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map((c: { id: string; name: string }) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Subject</Label><Input name="subject" required placeholder="e.g., Physics" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Question Type</Label><Select name="questionType" defaultValue="MCQ"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MCQ">MCQ</SelectItem><SelectItem value="CQ">CQ</SelectItem><SelectItem value="SQ">SQ</SelectItem></SelectContent></Select></div>
            <div><Label>Difficulty</Label><Select name="difficulty" defaultValue="MEDIUM"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EASY">Easy</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HARD">Hard</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label>Topic (Optional)</Label><Input name="topic" placeholder="e.g., Kinematics" /></div>
          <div><Label>Number of Questions</Label><Input name="count" type="number" defaultValue={3} min={1} max={10} /></div>
          <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <Checkbox id="include-answers" name="includeAnswers" defaultChecked />
            <div>
              <Label htmlFor="include-answers" className="text-sm font-medium">Include model answers & explanations</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">For MCQ: explanations for correct options. For CQ/SQ: detailed model answers.</p>
            </div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Enhanced AI Features</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              The AI now supports tables, matrices, and geometry using LaTeX notation.
              Tables will be automatically formatted using LaTeX array syntax.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
            Generate Questions
          </Button>
        </form>
        <div className="space-y-4">
          <CardTitle>Generated Preview</CardTitle>
          <Card className="h-full min-h-[300px] p-2 bg-gray-50 dark:bg-gray-800/50">
            {isGenerating && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}
            {generatedQuestions.length > 0 && <div className="space-y-2 max-h-[400px] overflow-y-auto p-2">
              {generatedQuestions.map((q) => (
                <Card key={q.id} className="p-3 bg-white dark:bg-gray-800 shadow-sm">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{q.type}</Badge>
                      <Badge variant="outline" className="text-xs">{q.marks} Marks</Badge>
                      <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
                      {q.hasMath && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                          Math
                        </Badge>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap overflow-x-auto">
                      <MathJax inline>{cleanupMath(q.questionText || '')}</MathJax>
                    </div>

                    {/* MCQ Options with Explanations */}
                    {q.type === 'MCQ' && (
                      <div className="mt-3 space-y-2">
                        <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Options:</p>
                        <ul className="list-disc pl-5 space-y-2">
                          {((q.options || []) || []).map((opt, i) => (
                            <li key={i} className={`${opt.isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                              <MathJax inline>{cleanupMath(opt.text || '')}</MathJax>
                              {opt.isCorrect && opt.explanation && (
                                <div className="mt-1 ml-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                                  <p className="text-xs font-semibold text-green-700 dark:text-green-300">Why this is correct:</p>
                                  <p className="text-xs text-green-600 dark:text-green-400"><MathJax inline>{cleanupMath(opt.explanation)}</MathJax></p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CQ Sub-questions with Model Answers */}
                    {q.type === 'CQ' && (
                      <div className="mt-3 space-y-3">
                        <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Sub-questions:</p>
                        <ol className="list-decimal pl-5 space-y-3">
                          {((q.subQuestions || []) || []).map((sq, i) => (
                            <li key={i} className="space-y-2">
                              <div>
                                <MathJax inline>{cleanupMath(sq.question || '')}</MathJax>
                                <span className="text-xs font-mono text-gray-500 ml-2">[{sq.marks || 0} marks]</span>
                              </div>
                              {sq.modelAnswer && (
                                <div className="ml-4 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Model Answer:</p>
                                  <MathJax inline>{cleanupMath(sq.modelAnswer)}</MathJax>
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* SQ Model Answer */}
                    {q.type === 'SQ' && q.modelAnswer && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Model Answer:</p>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <MathJax inline>{cleanupMath(q.modelAnswer)}</MathJax>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button size="sm" variant="outline" onClick={() => setEditingQuestion(q)}><Edit className="h-3 w-3 mr-1" /> Edit & Refine</Button>
                    <Button size="sm" onClick={() => handleSaveOne(q)}><PlusCircle className="h-3 w-3 mr-1" /> Add to Bank</Button>
                  </div>
                </Card>
              ))}
            </div>}
            {!isGenerating && generatedQuestions.length === 0 && <div className="flex items-center justify-center h-full text-sm text-gray-500"><p>Generated questions will appear here for review.</p></div>}
          </Card>
        </div>
      </div>
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Refine AI Generated Question</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto -mx-6 px-6 pb-4">
            <QuestionForm
              key={editingQuestion?.id}
              initialData={editingQuestion ? {
                ...editingQuestion,
                hasMath: false,
                createdBy: { id: '', name: '' },
                questionBanks: [],
                createdAt: new Date().toISOString()
              } as Question : null}
              onSave={handleEditAndSave}
              onCancel={() => setEditingQuestion(null)}
              classes={classes}
              questionBanks={questionBanks}
              openCreateBankDialog={openCreateBankDialog}
              isRefiningAi={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BulkUpload = ({ onQuestionSaved }: { onQuestionSaved: (q: Question) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  // Preview & Edit State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [editedPreviewData, setEditedPreviewData] = useState<any[]>([]); // For tracking edits

  // Class options for Dropdown
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string; section?: string }[]>([]);

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
        console.error("Failed to fetch classes for dropdown", err);
      }
    };
    fetchClasses();
  }, []);

  // JSON Input State
  const [inputType, setInputType] = useState<'file' | 'json'>('file');
  const [jsonInput, setJsonInput] = useState('');

  const sampleJson = [
    {
      "questionText": "What is the capital of France?",
      "type": "MCQ",
      "marks": 1,
      "difficulty": "EASY",
      "subject": "Geography",
      "className": "Class 9",
      "options": [
        { "text": "Paris", "isCorrect": true, "explanation": "Paris is the capital and most populous city of France." },
        { "text": "London", "isCorrect": false },
        { "text": "Berlin", "isCorrect": false },
        { "text": "Madrid", "isCorrect": false }
      ]
    },
    {
      "questionText": "Explain Newton's Second Law.",
      "type": "CQ",
      "marks": 5,
      "difficulty": "MEDIUM",
      "subject": "Physics",
      "className": "Class 10",
      "modelAnswer": "Newton's second law states that the rate of change of momentum..."
    }
  ];

  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(sampleJson, null, 2));
    toast({ title: "Sample Loaded", description: "Sample JSON format loaded." });
  };

  const handleParseJson = () => {
    try {
      if (!jsonInput.trim()) return;
      const parsed = JSON.parse(jsonInput);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];
      const rows = dataArray.map((item, idx) => ({
        rowNum: idx + 1,
        isValid: true, // Optimistic
        data: item,
        errors: []
      }));
      setPreviewData(rows);
      setEditedPreviewData(rows);
      setIsPreviewMode(true);
      toast({ title: "JSON Parsed", description: `Loaded ${rows.length} questions.` });
    } catch {
      toast({ variant: "destructive", title: "Invalid JSON", description: "Check format." });
    }
  };

  const handleAddManualQuestion = () => {
    const newQuestion = {
      rowNum: editedPreviewData.length + 1,
      isValid: true,
      data: {
        questionText: "New Question",
        type: "MCQ",
        marks: 1,
        difficulty: "EASY",
        subject: "General",
        className: availableClasses[0]?.name || "Class 10",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A"
      },
      errors: []
    };
    const newData = [...editedPreviewData, newQuestion];
    setEditedPreviewData(newData);
    setPreviewData(newData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
      setIsPreviewMode(false);
      setPreviewData([]);
      setEditedPreviewData([]);
    }
  };

  const handlePreviewUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Step 1: Upload for Preview
      const response = await fetch('/api/question-bank/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Preview failed');
      }

      const data = await response.json();

      if (data.mode === 'preview') {
        setPreviewData(data.rows);
        setEditedPreviewData(JSON.parse(JSON.stringify(data.rows))); // Deep copy for editing
        setIsPreviewMode(true);
        toast({ title: "Preview Ready", description: `Review ${data.rows.length} questions before finalizing.` });
      } else {
        // Fallback for direct success if backend logic changes
        setResults(data);
        if (data.success > 0) {
          toast({ title: "Upload Complete", description: `Successfully imported ${data.success} questions.` });
          window.location.reload();
        }
      }

    } catch (error: any) {
      console.error('Preview Error:', error);
      toast({ variant: "destructive", title: "Preview Failed", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsUploading(true);
    try {
      // Filter out invalid rows (keeping check simple for now, relying on backend validation mostly, 
      // but ideally we check if user fixed errors)
      // We send the 'data' part of the rows which contains the mapped question structure
      // However, we must send the *edited* data values. 
      // Since we edit the 'data' object in state, we form the payload here.

      // We need to re-construct the payload expected by backend JSON mode
      const payloadQuestions = editedPreviewData.map(row => row.data);

      const response = await fetch('/api/question-bank/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: payloadQuestions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Final import failed');
      }

      const data = await response.json();
      setResults(data);
      setIsPreviewMode(false); // Done with preview

      if (data.success > 0) {
        toast({ title: "Import Complete", description: `Successfully imported ${data.success} questions.` });
        // Optional: wait a bit before reload to let user see success card
        setTimeout(() => window.location.reload(), 2000);
      }

    } catch (error: any) {
      console.error('Final Submit Error:', error);
      toast({ variant: "destructive", title: "Import Failed", description: error.message });
      setIsUploading(false);
    }
  };

  const handleEditRow = (index: number, field: string, value: string) => {
    const newData = [...editedPreviewData];

    if (newData[index].data) {
      (newData[index].data as any)[field] = value;

      // Special handling for Class Name change -> Update Class ID
      if (field === 'className') {
        const foundClass = availableClasses.find(c =>
          c.name === value || (c.section ? `${c.name} - ${c.section}` : c.name) === value
        );
        if (foundClass) {
          newData[index].data.classId = foundClass.id;
        } else {
          // Try loose matching if exact match fails (e.g. if user typed it)
          const looseFound = availableClasses.find(c =>
            c.name.toLowerCase() === value.toLowerCase() ||
            (c.section ? `${c.name} - ${c.section}` : c.name).toLowerCase() === value.toLowerCase()
          );
          if (looseFound) {
            newData[index].data.classId = looseFound.id;
          } else {
            newData[index].data.classId = null;
          }
        }
      }

      newData[index].isValid = true;
      newData[index].error = undefined;
    }
    setEditedPreviewData(newData);
  };

  const handleRemoveRow = (index: number) => {
    const newData = [...editedPreviewData];
    newData.splice(index, 1);
    setEditedPreviewData(newData);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center space-y-6">

        {!isPreviewMode ? (
          /* Upload Mode */
          <>
            <div className="text-center space-y-2">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-2xl">Bulk Upload Questions</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Upload an Excel file (.xlsx) or paste JSON data to add questions in bulk.
              </CardDescription>
            </div>

            <div className="w-full max-w-md space-y-4">
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  className={`flex-1 py-2 text-sm font-medium ${inputType === 'file' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                  onClick={() => setInputType('file')}
                >
                  <FileSpreadsheet className="w-4 h-4 inline-block mr-2" /> File Upload
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium ${inputType === 'json' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                  onClick={() => setInputType('json')}
                >
                  <BrainCircuit className="w-4 h-4 inline-block mr-2" /> Paste JSON
                </button>
              </div>

              {inputType === 'file' ? (
                <>
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => window.open('/api/question-bank/sample-template', '_blank')}>
                      <Download className="mr-2 h-4 w-4" /> Download Sample Template
                    </Button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <Input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="excel-upload"
                    />
                    <Label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-medium">{file ? file.name : "Click to select Excel file"}</span>
                      <span className="text-xs text-gray-500">.xlsx or .xls files only</span>
                    </Label>
                  </div>

                  <Button onClick={handlePreviewUpload} disabled={!file || isUploading} className="w-full">
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploading ? "Processing..." : "Upload & Preview"}
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Paste JSON Data</Label>
                    <Button variant="outline" size="sm" onClick={handleLoadSample}>
                      <BookCopy className="w-3 h-3 mr-1" /> Load Sample
                    </Button>
                  </div>
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[\n  {\n    "questionText": "...",\n    "type": "MCQ",\n    ...\n  }\n]`}
                    className="font-mono text-xs h-64"
                  />
                  <Button onClick={handleParseJson} className="w-full">
                    <ArrowRight className="w-4 h-4 mr-2" /> Parse & Preview
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Preview Mode */
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview Data</CardTitle>
                <CardDescription>Review and edit questions before finalizing. Rows with errors are highlighted.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAddManualQuestion}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                </Button>
                <Button variant="outline" onClick={() => setIsPreviewMode(false)}>Cancel</Button>
                <Button onClick={handleFinalSubmit} disabled={isUploading}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Submit {editedPreviewData.length} Questions
                </Button>
              </div>
            </div>

            <div className="border rounded-md max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Row</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Question Type</TableHead>
                    <TableHead className="w-[180px]">Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-[300px]">Question Text</TableHead>
                    <TableHead className="w-[50px]">Marks</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editedPreviewData.map((row, index) => (
                    <TableRow key={index} className={!row.isValid ? "bg-red-50 dark:bg-red-900/10" : ""}>
                      <TableCell>{row.rowNum}</TableCell>
                      <TableCell>
                        {!row.isValid ? (
                          <span className="text-red-500 flex items-center text-xs font-bold">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Error
                          </span>
                        ) : (
                          <span className="text-green-500 flex items-center text-xs font-bold">
                            <Check className="w-3 h-3 mr-1" /> Valid
                          </span>
                        )}
                        {!row.isValid && <p className="text-[10px] text-red-500 mt-1">{row.error}</p>}
                      </TableCell>
                      <TableCell>{row.data.type}</TableCell>
                      <TableCell>
                        <select
                          className={`h-8 text-xs w-full max-w-[170px] border rounded px-1 bg-transparent dark:bg-slate-800 ${!row.data.classId && !row.isValid ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
                          value={row.data.className || ""}
                          onChange={(e) => handleEditRow(index, 'className', e.target.value)}
                        >
                          <option value="" disabled>Select Class</option>
                          {availableClasses.map(c => {
                            const val = c.section ? `${c.name} - ${c.section}` : c.name;
                            return <option key={c.id} value={val}>{val}</option>
                          })}
                          {/* Keep original value if not in list, so it isn't lost immediately */}
                          {!availableClasses.find(c => (c.section ? `${c.name} - ${c.section}` : c.name) === row.data.className) && row.data.className && (
                            <option value={row.data.className} disabled>{row.data.className} (Invalid)</option>
                          )}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.data.subject}
                          onChange={(e) => handleEditRow(index, 'subject', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={row.data.questionText}
                          onChange={(e) => handleEditRow(index, 'questionText', e.target.value)}
                          className="min-h-[60px] text-xs"
                        />
                      </TableCell>
                      <TableCell>{row.data.marks}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveRow(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {results && !isPreviewMode && (
          <div className="w-full max-w-2xl mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{results.success}</div>
                <div className="text-sm text-green-600 dark:text-green-400">Successfully Imported</div>
              </Card>
              <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{results.failed}</div>
                <div className="text-sm text-red-600 dark:text-red-400">Failed Rows</div>
              </Card>
            </div>

            {results.errors.length > 0 && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-sm text-red-700 dark:text-red-300">Error Details</CardTitle>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                  <ul className="list-disc pl-5 space-y-1 text-xs text-red-600 dark:text-red-400">
                    {results.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};