import { z } from "zod";
import { intQuestionSchema } from './intQuestion.schema';

export const mcqQuestionSchema = z.object({
  type: z.literal("MCQ"),
  subject: z.string().min(2),
  topic: z.string().optional(),
  marks: z.number().min(1).max(10),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questionText: z.string().min(10),
  options: z.array(z.string().min(1)).length(4),
  correct: z.string().min(1).max(1),
  tags: z.array(z.string()).optional(),
  modelAnswer: z.string().optional(),
  hasMath: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

// Multiple Correct Question Schema
export const mcQuestionSchema = z.object({
  type: z.literal("MC"),
  subject: z.string().min(2),
  topic: z.string().optional(),
  marks: z.number().min(1).max(10),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questionText: z.string().min(10),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean()
  })).min(4).max(6).refine(
    (opts) => opts.filter(o => o.isCorrect).length >= 2,
    { message: "At least 2 options must be correct for MC questions" }
  ),
  tags: z.array(z.string()).optional(),
  modelAnswer: z.string().optional(),
  hasMath: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

export const cqQuestionSchema = z.object({
  type: z.literal("CQ"),
  subject: z.string().min(2),
  topic: z.string().optional(),
  marks: z.number().min(2).max(20),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questionText: z.string().min(10),
  modelAnswer: z.string().min(10),
  tags: z.array(z.string()).optional(),
  hasMath: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

export const sqQuestionSchema = z.object({
  type: z.literal("SQ"),
  subject: z.string().min(2),
  topic: z.string().optional(),
  marks: z.number().min(1).max(5),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questionText: z.string().min(5),
  modelAnswer: z.string().min(5),
  tags: z.array(z.string()).optional(),
  hasMath: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

export const questionSchema = z.discriminatedUnion("type", [
  mcqQuestionSchema,
  mcQuestionSchema,
  intQuestionSchema,
  cqQuestionSchema,
  sqQuestionSchema,
]);

export type QuestionFormData = z.infer<typeof questionSchema>;