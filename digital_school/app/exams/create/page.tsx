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
import { CheckCircle, Plus, Trash2, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  // Negative marking for MCQs (percentage)
  mcqNegativeMarking: z.coerce.number().min(0).max(100).optional(),
  // Question selection settings
  cqTotalQuestions: z.coerce.number().min(0).optional(),
  cqRequiredQuestions: z.coerce.number().min(0).optional(),
  sqTotalQuestions: z.coerce.number().min(0).optional(),
  sqRequiredQuestions: z.coerce.number().min(0).optional(),
  // CQ Subsection settings
  cqSubsections: z.array(cqSubsectionSchema).optional(),
}).refine((data) => {
  // Validate that required questions don't exceed total questions
  // Allow both to be 0 (no questions of this type)
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

  // Validate CQ subsections if they exist AND CQ questions are > 0
  if (data.cqTotalQuestions && data.cqTotalQuestions > 0 && data.cqSubsections && data.cqSubsections.length > 0) {
    // Check that subsection ranges don't overlap and cover all questions
    const sortedSubsections = [...data.cqSubsections].sort((a, b) => a.startIndex - b.startIndex);

    for (let i = 0; i < sortedSubsections.length; i++) {
      const current = sortedSubsections[i];

      // Check if start index is less than or equal to end index
      if (current.startIndex > current.endIndex) {
        return false;
      }

      // Check if required questions don't exceed available questions in this subsection
      const availableQuestions = current.endIndex - current.startIndex + 1;
      if (current.requiredQuestions > availableQuestions) {
        return false;
      }

      // Check for overlaps with next subsection
      if (i < sortedSubsections.length - 1) {
        const next = sortedSubsections[i + 1];
        if (current.endIndex >= next.startIndex) {
          return false;
        }
      }
    }

    // Check if subsections cover the total CQ questions
    const totalCovered = sortedSubsections.reduce((sum, sub) => sum + (sub.endIndex - sub.startIndex + 1), 0);
    if (data.cqTotalQuestions !== undefined && totalCovered !== data.cqTotalQuestions) {
      return false;
    }
  }

  return true;
}, {
  message: "Invalid question configuration. Check question counts and subsection ranges.",
  path: ["cqSubsections"]
});

type ExamForm = z.infer<typeof schema>;
type CQSubsection = z.infer<typeof cqSubsectionSchema>;

type ClassOption = { id: string; name: string };

export default function CreateExamPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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

  // Watch CQ total questions to update subsections
  const cqTotalQuestions = form.watch("cqTotalQuestions");
  const cqSubsections = form.watch("cqSubsections");

  // Update subsections when CQ total questions change
  useEffect(() => {
    if (cqTotalQuestions !== undefined) {
      const currentSubsections = form.getValues("cqSubsections") || [];

      if (cqTotalQuestions > 0) {
        // If no subsections exist, create a default one
        if (currentSubsections.length === 0) {
          form.setValue("cqSubsections", [{
            name: "",
            startIndex: 1,
            endIndex: cqTotalQuestions,
            requiredQuestions: Math.min(5, cqTotalQuestions),
          }]);
        } else {
          // Update the last subsection's end index if it's the only one
          if (currentSubsections.length === 1) {
            const updatedSubsections = [...currentSubsections];
            updatedSubsections[0].endIndex = cqTotalQuestions;
            form.setValue("cqSubsections", updatedSubsections);
          }
        }
      } else {
        // If 0, clear subsections to avoid invalid schema state
        if (currentSubsections.length > 0) {
          form.setValue("cqSubsections", []);
        }
      }
    }
  }, [cqTotalQuestions, form]);

  // Add new subsection
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

  // Remove subsection
  const removeSubsection = (index: number) => {
    const currentSubsections = form.getValues("cqSubsections") || [];
    if (currentSubsections.length > 1) {
      const updatedSubsections = currentSubsections.filter((_, i) => i !== index);
      form.setValue("cqSubsections", updatedSubsections);
    }
  };

  // Update subsection ranges when one changes
  const updateSubsectionRanges = (index: number, field: 'startIndex' | 'endIndex', value: number) => {
    const currentSubsections = form.getValues("cqSubsections") || [];
    const updatedSubsections = [...currentSubsections];

    if (field === 'startIndex') {
      updatedSubsections[index].startIndex = value;
      // Update previous subsection's end index
      if (index > 0) {
        updatedSubsections[index - 1].endIndex = value - 1;
      }
    } else if (field === 'endIndex') {
      updatedSubsections[index].endIndex = value;
      // Update next subsection's start index
      if (index < updatedSubsections.length - 1) {
        updatedSubsections[index + 1].startIndex = value + 1;
      }
    }

    form.setValue("cqSubsections", updatedSubsections);
  };

  useEffect(() => {
    setClassesLoading(true);
    fetch("/api/classes")
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch classes');
        }
        return res.json();
      })
      .then((data) => {
        // Ensure data.classes is an array
        if (data && Array.isArray(data.classes)) {
          setClasses(data.classes);
        } else {
          console.warn('Invalid classes data received:', data);
          setClasses([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching classes:', error);
        setClasses([]);
        toast({
          title: "Error",
          description: "Failed to load classes. Please refresh the page.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setClassesLoading(false);
      });
  }, [toast]);

  const onSubmit = async (data: ExamForm) => {
    if (classes.length === 0) {
      toast({
        title: "Error",
        description: "No classes available. Please ensure classes are set up first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create exam");
      setSuccess(true);
      toast({ title: "Exam created!", description: "Exam is pending approval.", variant: "default" });
      setTimeout(() => router.push("/exams"), 1200);
    } catch {
      toast({ title: "Error", description: "Failed to create exam.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-10 px-2 relative">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        onClick={() => router.push("/dashboard")}
      >
        <LayoutDashboard className="w-4 h-4" /> Dashboard
      </Button>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-4xl"
      >
        <div className="rounded-2xl shadow-2xl border border-border bg-white/90 dark:bg-gray-900/90 backdrop-blur-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-blue-500 p-6 text-white text-center">
            <h1 className="text-3xl font-bold tracking-tight">Create New Exam</h1>
            <p className="text-sm opacity-80 mt-1">Fill out the form to schedule a new exam</p>
          </div>
          <div className="p-8">
            <AnimatePresence>
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                  <div className="text-xl font-semibold mb-2">Exam Created!</div>
                  <div className="text-gray-500 dark:text-gray-400">Redirecting...</div>
                </motion.div>
              ) : (
                <FormProvider {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField name="name" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Name</FormLabel>
                          <FormControl><Input placeholder="Exam name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="classId" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange} disabled={classesLoading}>
                            <SelectTrigger>
                              <SelectValue placeholder={classesLoading ? "Loading classes..." : "Select class"} />
                            </SelectTrigger>
                            <SelectContent>
                              {classesLoading ? (
                                <SelectItem value="loading" disabled>Loading...</SelectItem>
                              ) : classes.length === 0 ? (
                                <SelectItem value="no-classes" disabled>No classes available</SelectItem>
                              ) : (
                                classes.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField name="description" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea placeholder="Description (optional)" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField name="date" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="duration" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl><Input type="number" min={1} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField name="startTime" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl><Input type="datetime-local" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="endTime" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl><Input type="datetime-local" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField name="type" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              {examTypes.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="totalMarks" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Marks</FormLabel>
                          <FormControl><Input type="number" min={1} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField name="passMarks" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pass Marks</FormLabel>
                          <FormControl><Input type="number" min={0} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="allowRetake" control={form.control} render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-6">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="mb-0">Allow Retake</FormLabel>
                        </FormItem>
                      )} />
                    </div>
                    <FormField name="instructions" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions</FormLabel>
                        <FormControl><Textarea placeholder="Instructions (optional)" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Negative Marking Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Negative Marking Settings</h3>
                      <FormField name="mcqNegativeMarking" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>MCQ Negative Marking (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.25}
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Percentage of marks to deduct for wrong MCQ answers (e.g., 25% = 0.25 marks deducted for 1 mark question)
                          </p>
                        </FormItem>
                      )} />
                    </div>

                    {/* Question Selection Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Question Selection Settings</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">Creative Questions (CQ)</h4>
                          <FormField name="cqTotalQuestions" control={form.control} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Questions Available</FormLabel>
                              <FormControl><Input type="number" min={0} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField name="cqRequiredQuestions" control={form.control} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Questions to Answer</FormLabel>
                              <FormControl><Input type="number" min={0} {...field} /></FormControl>
                              <FormMessage />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Students must answer this many questions from the available options
                              </p>
                            </FormItem>
                          )} />
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">Short Questions (SQ)</h4>
                          <FormField name="sqTotalQuestions" control={form.control} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Questions Available</FormLabel>
                              <FormControl><Input type="number" min={0} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField name="sqRequiredQuestions" control={form.control} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Questions to Answer</FormLabel>
                              <FormControl><Input type="number" min={0} {...field} /></FormControl>
                              <FormMessage />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Students must answer this many questions from the available options
                              </p>
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    </div>

                    {/* CQ Subsection Settings */}
                    {cqTotalQuestions && cqTotalQuestions > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">CQ Subsection Settings</h3>
                          <Button
                            type="button"
                            onClick={addSubsection}
                            disabled={cqSubsections && cqSubsections.length > 0 && cqSubsections[cqSubsections.length - 1]?.endIndex >= cqTotalQuestions}
                            className="flex items-center gap-2"
                            variant="outline"
                          >
                            <Plus className="w-4 h-4" />
                            Add Subsection
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Define subsections for math exams (e.g., Algebra, Geometry, Trigonometry).
                          Each subsection specifies question ranges and required questions.
                        </p>

                        <div className="space-y-4">
                          {cqSubsections && cqSubsections.map((subsection, index) => (
                            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                                  Subsection {index + 1}
                                </h4>
                                {cqSubsections.length > 1 && (
                                  <Button
                                    type="button"
                                    onClick={() => removeSubsection(index)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FormField
                                  name={`cqSubsections.${index}.name`}
                                  control={form.control}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Name (optional)</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder={cqSubsections.length === 1 ? "Leave empty for single section" : "e.g., Algebra"}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  name={`cqSubsections.${index}.startIndex`}
                                  control={form.control}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Start Question</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={1}
                                          max={cqTotalQuestions}
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            field.onChange(value);
                                            updateSubsectionRanges(index, 'startIndex', value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  name={`cqSubsections.${index}.endIndex`}
                                  control={form.control}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>End Question</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={1}
                                          max={cqTotalQuestions}
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            field.onChange(value);
                                            updateSubsectionRanges(index, 'endIndex', value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  name={`cqSubsections.${index}.requiredQuestions`}
                                  control={form.control}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Required Questions</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={1}
                                          max={subsection.endIndex - subsection.startIndex + 1}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Max: {subsection.endIndex - subsection.startIndex + 1}
                                      </p>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {cqSubsections.length === 1 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Single subsection: Questions can be shuffled. Leave name empty.
                                </p>
                              )}
                              {cqSubsections.length > 1 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Multiple subsections: Questions cannot be shuffled. Each subsection maintains order.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {classes.length === 0 && !classesLoading && (
                      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>No classes available.</strong> Please ensure classes are set up in the system before creating exams.
                        </p>
                      </div>
                    )}
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full mt-4 bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg hover:shadow-xl border-0"
                        disabled={loading || classesLoading || classes.length === 0}
                      >
                        {loading ? "Creating..." : classesLoading ? "Loading..." : classes.length === 0 ? "No Classes Available" : "Create Exam"}
                      </Button>
                    </motion.div>
                  </form>
                </FormProvider>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}