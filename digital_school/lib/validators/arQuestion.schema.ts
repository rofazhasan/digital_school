import { z } from 'zod';

export const arQuestionSchema = z.object({
    type: z.literal("AR"),
    subject: z.string().min(2, "Subject must be at least 2 characters"),
    topic: z.string().optional(),
    marks: z.number().min(1, "Marks must be at least 1").max(10, "Marks cannot exceed 10"),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    questionText: z.string().min(10, "Question context must be at least 10 characters").optional(),
    assertion: z.string().min(5, "Assertion must be at least 5 characters"),
    reason: z.string().min(5, "Reason must be at least 5 characters"),
    correctOption: z.number().int().min(1, "Correct option must be between 1 and 5").max(5, "Correct option must be between 1 and 5"),
    explanation: z.string().optional(),
    tags: z.array(z.string()).optional(),
    hasMath: z.boolean().optional(),
    images: z.array(z.string()).optional(),
});

export type ARQuestion = z.infer<typeof arQuestionSchema>;
