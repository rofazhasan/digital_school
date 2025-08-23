"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef, useCallback, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import Latex from "react-latex";
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
import { PlusCircle, Trash2, Edit, Save, X, Bot, Wand2, Loader2, Search, ChevronsUpDown, Check, BrainCircuit, BookCopy, Library, FilterX } from "lucide-react";

// --- Types ---
type QuestionType = 'MCQ' | 'CQ' | 'SQ';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type QuestionBank = { id: string; name: string; subject: string };
type Question = {
  id: string; type: QuestionType; subject: string; topic?: string | null; marks: number; difficulty: Difficulty;
  questionText: string; questionLatex?: string | null; hasMath: boolean; options?: any; subQuestions?: any;
  modelAnswer?: string | null; class: { id: string; name: string }; createdBy: { id: string; name: string };
  questionBanks: QuestionBank[]; createdAt: string; isAiGenerated?: boolean;
};

// Enhanced types for AI generated questions
type GeneratedQuestion = {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: Array<{ text: string; isCorrect: boolean; explanation?: string }>;
  subQuestions?: Array<{ question: string; marks: number; modelAnswer?: string }>;
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
              <Latex>{`$${s.display}$`}</Latex>
            </Button>
        ))}
      </div>
  );
};

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

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

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
      toast({ title: "Success", description: "Question deleted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete question." });
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
    toast({ title: "Bank Created", description: `'${newBank.name}' is now available.`});
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
        .filter((q: Question) => difficultyFilter === "all" || q.difficulty === difficultyFilter);
  }, [questions, searchTerm, classFilter, subjectFilter, difficultyFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setClassFilter("all");
    setSubjectFilter("all");
    setDifficultyFilter("all");
  };

  return (
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
                      <div className="flex items-end gap-2 lg:col-span-5">
                        <Button onClick={resetFilters} variant="outline" className="w-full"><FilterX className="mr-2 h-4 w-4" />Reset Filters</Button>
                        <Button onClick={() => { setEditingQuestion(null); setIsFormOpen(true); }} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
                      </div>
                    </div>
                  </Card>

                  {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                      : filteredQuestions.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredQuestions.map(q => <QuestionCard key={q.id} question={q} onEdit={handleEdit} onDelete={handleDelete} />)}
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
  );
}

const QuestionCard: React.FC<{ question: Question; onEdit: (q: Question) => void; onDelete: (id: string) => void }> = ({ question, onEdit, onDelete }) => {
  const difficultyColors: Record<Difficulty, string> = {
    EASY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    HARD: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return (
      <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-base font-semibold leading-snug prose prose-sm dark:prose-invert max-w-full">
              <Latex>{question.questionText || ''}</Latex>
            </CardTitle>
            <Badge variant="outline">{question.marks} Marks</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-xs mt-2">
            <Badge className={difficultyColors[question.difficulty]}>{question.difficulty}</Badge>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{question.subject}</Badge>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{question.class.name}</Badge>
            {question.isAiGenerated && <Badge variant="outline" className="text-indigo-500 border-indigo-500"><Bot className="h-3 w-3 mr-1"/>AI</Badge>}
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
                    <Latex>{opt.text || ''}</Latex>
                    {opt.isCorrect && opt.explanation && (
                      <div className="mt-2 ml-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700">
                        <span className="font-semibold text-green-700 dark:text-green-300 text-xs">Explanation: </span>
                        <span className="text-green-600 dark:text-green-400 text-xs"><Latex>{opt.explanation}</Latex></span>
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
                      <Latex>{sq.question || ''}</Latex>
                      <span className="text-xs font-mono text-gray-500 ml-2">[{sq.marks || 0} marks]</span>
                    </div>
                    {sq.modelAnswer && (
                      <div className="ml-4 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                        <span className="font-semibold text-blue-700 dark:text-blue-300 text-xs">Model Answer: </span>
                        <span className="text-blue-600 dark:text-blue-400 text-xs"><Latex>{sq.modelAnswer}</Latex></span>
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
                <Latex>{question.modelAnswer}</Latex>
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
  const [type, setType] = useState(initialData?.type || 'MCQ');
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [marks, setMarks] = useState(initialData?.marks || 5);
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'MEDIUM');
  const [classId, setClassId] = useState(initialData?.class?.id || (classes.length > 0 ? classes[0].id : ''));
  const [questionBankIds, setQuestionBankIds] = useState<string[]>((initialData?.questionBanks || []).map((qb: QuestionBank) => qb.id) || []);
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean; explanation?: string }[]>(initialData?.options || [{ text: '', isCorrect: true, explanation: '' }, { text: '', isCorrect: false, explanation: '' }]);
  const [subQuestions, setSubQuestions] = useState<{ question: string; marks: number; modelAnswer?: string }[]>(initialData?.subQuestions || [{ question: '', marks: 5, modelAnswer: '' }]);
  const [modelAnswer, setModelAnswer] = useState(initialData?.modelAnswer || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTextarea, setActiveTextarea] = useState<{ id: string; setter: (v: any) => void; index?: number; [key: string]: any }>({ id: 'qtext', setter: setQuestionText });
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

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

  const makeFocusHandler = (id: string, setter: React.Dispatch<React.SetStateAction<any>>, index?: number) => () => setActiveTextarea({ id, setter, index });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const isUpdate = initialData?.id && !isRefiningAi;
    const payload = {
      type, subject, topic, marks: Number(marks), difficulty, classId, questionText,
      isAiGenerated: !!initialData?.isAiGenerated,
      options: type === 'MCQ' ? options : null,
      subQuestions: type === 'CQ' ? subQuestions : null,
      modelAnswer: type === 'SQ' && modelAnswer.trim() !== '' ? modelAnswer : undefined,
      hasMath: /\\/.test(questionText) || 
                (type === 'MCQ' && options.some((opt: { text: string; isCorrect: boolean; explanation?: string }) => 
                  /\\/.test(opt.text) || (opt.explanation && /\\/.test(opt.explanation))
                )) || 
                (type === 'CQ' && subQuestions.some((sq: { question: string; marks: number; modelAnswer?: string }) => 
                  /\\/.test(sq.question) || (sq.modelAnswer && /\\/.test(sq.modelAnswer))
                )) || 
                (type === 'SQ' && /\\/.test(modelAnswer)),
      questionBankIds: questionBankIds.length > 0 ? questionBankIds : undefined,
    };

    try {
      const url = isUpdate ? `/api/question-bank?id=${initialData.id}` : '/api/question-bank';
      const method = isUpdate ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const err = await response.json(); throw new Error(err.details?.body?._errors[0] || err.error || 'Failed to save'); }
      const savedQuestion = await response.json();
      toast({ title: "Success", description: `Question ${isUpdate ? 'updated' : 'created'}.` });
      if(onSave) onSave(savedQuestion);
    } catch (error) {
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
              <div><Label>Class</Label><Select value={classId} onValueChange={setClassId} required><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map((c: {id: string, name: string}) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
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
              <Textarea 
                ref={el => { textareaRefs.current['qtext'] = el; }} 
                onFocus={makeFocusHandler('qtext', setQuestionText)} 
                value={questionText} 
                onChange={e => setQuestionText(e.target.value)} 
                required 
                rows={8}
                placeholder="Enter your question here. Use the math toolbar above for mathematical expressions..."
              />
              {/\\/.test(questionText) && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium">Mathematical content detected</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <Label>Type-specific Details</Label>
            <AnimatePresence mode="wait"><motion.div key={type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50">
              {type === 'MCQ' && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <MathToolbar onInsert={handleInsertSymbol} />
                    {(options || []).map((opt: { text: string; isCorrect: boolean; explanation?: string }, i: number) => (
                        <div key={i} className="space-y-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800/30">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={opt.isCorrect} onCheckedChange={() => setOptions((options || []).map((o, idx) => ({...o, isCorrect: i === idx})))} />
                            <Textarea 
                              ref={el => { textareaRefs.current[`opt-${i}`] = el; }} 
                              onFocus={makeFocusHandler(`opt-${i}`, (newText) => { const newOpts = [...(options || [])]; newOpts[i].text = newText; setOptions(newOpts); })} 
                              value={opt.text} 
                              onChange={e => { const newOpts = [...(options || [])]; newOpts[i].text = e.target.value; setOptions(newOpts); }} 
                              placeholder={`Option ${i + 1}`} 
                              rows={2} 
                              className="h-auto flex-grow" 
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => setOptions((options || []).filter((_, idx) => i !== idx))}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
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
                    <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...(options || []), {text: '', isCorrect: false, explanation: ''}])}>
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
                  {(subQuestions || []).map((sq: { question: string; marks: number; modelAnswer?: string }, i: number) => (
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => setSubQuestions((subQuestions || []).filter((_, idx) => i !== idx))}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
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
                  <Button type="button" variant="outline" size="sm" onClick={() => setSubQuestions([...(subQuestions || []), {question: '', marks: 5, modelAnswer: ''}])}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Sub-question
                  </Button>
                </div>
              )}
            </motion.div></AnimatePresence>
            <Label>Live Preview</Label>
            <Card className="h-full min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="prose dark:prose-invert max-w-none">
                <Latex>{questionText || ''}</Latex>
                {type === 'MCQ' && (
                  <div className="mt-4">
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Options:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      {(options || []).map((opt: { text: string; isCorrect: boolean; explanation?: string }, i: number) => (
                        <li key={i} className={`${opt.isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                          <Latex>{opt.text || `(Option ${i+1})`}</Latex>
                          {opt.isCorrect && opt.explanation && (
                            <div className="mt-2 ml-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                              <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Explanation:</p>
                              <Latex>{opt.explanation}</Latex>
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
                      {(subQuestions || []).map((sq: { question: string; marks: number; modelAnswer?: string }, i: number) => (
                        <li key={i} className="space-y-2">
                          <div>
                            <Latex>{sq.question || `(Sub-question ${i+1})`}</Latex>
                            <span className="text-xs font-mono text-gray-500 ml-2">[{sq.marks || 0} marks]</span>
                          </div>
                          {sq.modelAnswer && (
                            <div className="ml-4 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Model Answer:</p>
                              <Latex>{sq.modelAnswer}</Latex>
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
                      <Latex>{modelAnswer}</Latex>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{initialData?.id && !isRefiningAi ? 'Save Changes' : 'Create Question'}</Button>
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
      setGeneratedQuestions((result.questions || []).map((q: any) => ({...q, id: generateTempId(), class: selectedClass })));
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
      const response = await fetch('/api/question-bank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({...payload, classId: qClass.id}) });
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
                        <Latex>{q.questionText || ''}</Latex>
                        
                        {/* MCQ Options with Explanations */}
                        {q.type === 'MCQ' && (
                          <div className="mt-3 space-y-2">
                            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Options:</p>
                            <ul className="list-disc pl-5 space-y-2">
                              {((q.options || []) || []).map((opt, i) => (
                                <li key={i} className={`${opt.isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                  <Latex>{opt.text || ''}</Latex>
                                  {opt.isCorrect && opt.explanation && (
                                    <div className="mt-1 ml-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                                      <p className="text-xs font-semibold text-green-700 dark:text-green-300">Why this is correct:</p>
                                      <p className="text-xs text-green-600 dark:text-green-400"><Latex>{opt.explanation}</Latex></p>
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
                                    <Latex>{sq.question || ''}</Latex>
                                    <span className="text-xs font-mono text-gray-500 ml-2">[{sq.marks || 0} marks]</span>
                                  </div>
                                  {sq.modelAnswer && (
                                    <div className="ml-4 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Model Answer:</p>
                                      <Latex>{sq.modelAnswer}</Latex>
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
                              <Latex>{q.modelAnswer}</Latex>
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