import { z } from 'zod';

export const mtfItemSchema = z.object({
    id: z.string(),
    text: z.string().min(1, "Text is required")
});

export const mtfQuestionSchema = z.object({
    type: z.literal("MTF"),
    subject: z.string().min(1, "Subject is required"),
    topic: z.string().optional().nullable(),
    marks: z.coerce.number().positive("Marks must be greater than 0"),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    questionText: z.string().optional().nullable().default("Match the items in Column A with the correct items in Column B."),
    leftColumn: z.array(mtfItemSchema).min(1, "At least one item in left column is required"),
    rightColumn: z.array(mtfItemSchema).min(1, "At least one item in right column is required"),
    matches: z.record(z.string(), z.string()).refine((m) => Object.keys(m).length > 0, "At least one match must be defined"),
    explanation: z.string().optional().nullable(),
    hasMath: z.boolean().default(false),
});
