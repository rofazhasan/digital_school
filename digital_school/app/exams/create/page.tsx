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
import { CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const examTypes = ["ONLINE", "OFFLINE", "MIXED"];

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
  return true;
}, {
  message: "Required questions cannot exceed total questions",
  path: ["cqRequiredQuestions", "sqRequiredQuestions"]
});

type ExamForm = z.infer<typeof schema>;

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
    },
  });

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-10 px-2">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-2xl"
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