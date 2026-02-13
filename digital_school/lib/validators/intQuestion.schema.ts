import { z } from 'zod';

// Integer Type Question Schema
export const intQuestionSchema = z.object({
    type: z.literal("INT"),
    subject: z.string().min(2),
    topic: z.string().optional(),
    marks: z.number().min(1).max(10),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    questionText: z.string().min(10),
    correctAnswer: z.number().int(), // The correct integer answer
    tolerance: z.number().min(0).optional().default(0), // Optional tolerance for range-based answers
    tags: z.array(z.string()).optional(),
    modelAnswer: z.string().optional(), // Explanation of the solution
    hasMath: z.boolean().optional(),
    images: z.array(z.string()).optional(),
});

export type IntQuestion = z.infer<typeof intQuestionSchema>;
