// In app/api/question-bank/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, QuestionType, Difficulty } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// --- Helper function to get a valid user for development ---
async function getDeveloperUserId() {
  // Get the first user in the database (or throw if none found)
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found in the database. Please seed a user.');
  return user.id;
}

// --- Updated Schema ---
const questionSchema = z.object({
    type: z.nativeEnum(QuestionType),
    subject: z.string().min(1),
    topic: z.string().optional(),
    marks: z.coerce.number().int().min(1),
    difficulty: z.nativeEnum(Difficulty),
    // UNIFIED: questionText is now the single source for content
    questionText: z.string().min(1, "Question content is required"),
    hasMath: z.boolean().default(false),
    classId: z.string().cuid(),
    isAiGenerated: z.boolean().default(false),
    options: z.array(z.object({
        text: z.string().min(1, "Option text is required"),
        isCorrect: z.boolean(),
        explanation: z.string().optional()
    })).optional(),
    subQuestions: z.array(z.object({
        question: z.string().min(1, "Sub-question text is required"),
        marks: z.number().int().min(1),
        modelAnswer: z.string().optional()
    })).optional(),
    modelAnswer: z.string().optional(),
    questionBankIds: z.array(z.string().cuid()).optional(),
});

const aiGenerationSchema = z.object({
    action: z.literal('generate-with-ai'),
    subject: z.string(),
    topic: z.string().optional(),
    difficulty: z.nativeEnum(Difficulty),
    questionType: z.nativeEnum(QuestionType),
    count: z.coerce.number().int().min(1).max(10),
    className: z.string(),
    includeAnswers: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (body.action === 'generate-with-ai') {
            return handleAIGeneration(body);
        }

        // FIX: Get a guaranteed valid user ID on the server
        const developerUserId = await getDeveloperUserId();

        const validation = questionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });
        }

        const { questionBankIds, ...questionData } = validation.data;

        const newQuestion = await prisma.question.create({
            data: {
                ...questionData,
                createdById: developerUserId, // Use the valid ID from the server
                QuestionToQuestionBank: questionBankIds
                    ? {
                        create: questionBankIds.map((id) => ({
                            question_banks: { connect: { id } }
                        }))
                    }
                    : undefined,
            },
            include: {
                class: true,
                createdBy: true,
                QuestionToQuestionBank: {
                    include: {
                        question_banks: { select: { id: true, name: true } }
                    }
                }
            }
        } as any);

        return NextResponse.json(newQuestion, { status: 201 });
    } catch (error) {
        console.error("Failed to create question:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Failed to create question", details: errorMessage }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'get-question-banks') {
        try {
            const banks = await prisma.questionBank.findMany({
                select: { id: true, name: true, subject: true },
                orderBy: { name: 'asc' },
            });
            return NextResponse.json(banks);
        } catch (error) {
            console.error("Failed to fetch question banks:", error);
            return NextResponse.json({ error: "Failed to fetch question banks" }, { status: 500 });
        }
    }

    try {
        const questions = await prisma.question.findMany({
            include: {
                createdBy: { select: { id: true, name: true } },
                class: { select: { id: true, name: true } },
                QuestionToQuestionBank: {
                    include: {
                        question_banks: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(questions);
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "Question ID is required" }, { status: 400 });

        const body = await request.json();
        const validation = questionSchema.partial().safeParse(body);
        if (!validation.success) return NextResponse.json({ error: "Invalid input", details: validation.error.flatten() }, { status: 400 });

        const { questionBankIds, ...questionData } = validation.data;

        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: {
                ...questionData,
                QuestionToQuestionBank: questionBankIds ? { set: questionBankIds.map(id => ({ question_banks: { connect: { id } } })) } : { set: [] },
            },
            include: { QuestionToQuestionBank: true, class: true, createdBy: true },
        } as any);

        return NextResponse.json(updatedQuestion);
    } catch (error) {
        console.error("Failed to update question:", error);
        return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "Question ID is required" }, { status: 400 });

        await prisma.question.delete({ where: { id } });
        return NextResponse.json({ message: "Question deleted successfully" });
    } catch (error) {
        console.error("Failed to delete question:", error);
        return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
    }
}

async function handleAIGeneration(body: any) {
    const validation = aiGenerationSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid AI generation request", details: validation.error.flatten() }, { status: 400 });

    const { subject, topic, difficulty, questionType, count, className, includeAnswers } = validation.data;
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Google AI API key is not configured." }, { status: 500 });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const responseSchema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                questionText: { type: "STRING", description: "The main text of the question." },
                questionLatex: { type: "STRING", description: "LaTeX for math equations. Empty string if none." },
                marks: { type: "NUMBER", description: "Marks for the question." },
                ...(questionType === 'MCQ' && {
                    options: { 
                        type: "ARRAY", 
                        description: "MUST contain 4 options for an MCQ question.", 
                        items: { 
                            type: "OBJECT", 
                            properties: { 
                                text: { type: "STRING" }, 
                                isCorrect: { type: "BOOLEAN" },
                                ...(includeAnswers && { explanation: { type: "STRING", description: "Explanation for why this option is correct (only for correct option)" } })
                            }, 
                            required: ["text", "isCorrect"] 
                        } 
                    }
                }),
                ...(questionType === 'CQ' && {
                    subQuestions: { 
                        type: "ARRAY", 
                        description: "MUST contain 2 to 4 sub-questions for a CQ question.", 
                        items: { 
                            type: "OBJECT", 
                            properties: { 
                                question: { type: "STRING" }, 
                                marks: { type: "NUMBER" },
                                ...(includeAnswers && { modelAnswer: { type: "STRING", description: "Model answer for this sub-question" } })
                            }, 
                            required: ["question", "marks"] 
                        } 
                    }
                }),
                ...(questionType === 'SQ' && {
                    modelAnswer: { type: "STRING", description: "MUST contain a model answer for an SQ question." }
                })
            },
            required: ["questionText", "marks"].concat(
                questionType === 'MCQ' ? ['options'] :
                    questionType === 'CQ' ? ['subQuestions'] :
                        questionType === 'SQ' ? ['modelAnswer'] : []
            )
        }
    };

   
 const prompt = `You are an expert test creator specializing in ${subject} for ${className} level. Generate ${count} unique, high-quality questions based on these specifications:

REQUIREMENTS:
- Class: ${className}, Subject: ${subject}, Topic: ${topic || 'General'}, Difficulty: ${difficulty}, Type: ${questionType}
- Each question must be engaging, clear, and appropriate for the specified difficulty level
- Include mathematical expressions, formulas, and equations where relevant using LaTeX notation

QUESTION TYPE SPECIFICATIONS:

${questionType === 'MCQ' ? `
MCQ QUESTIONS:
- Provide exactly 4 options (A, B, C, D format)
- Only ONE option should have 'isCorrect: true'
- All other options should have 'isCorrect: false'
- Make incorrect options plausible but clearly wrong
${includeAnswers ? '- Include detailed \'explanation\' for the correct option explaining the reasoning and solution steps' : ''}
- Use LaTeX for mathematical expressions: $\\frac{a}{b}$, $x^2$, $\\sqrt{x}$, etc.` : ''}

${questionType === 'CQ' ? `
CQ (COMPREHENSIVE) QUESTIONS:
- Provide 2-4 sub-questions that build upon each other
- Each sub-question should have appropriate marks (total should equal question marks)
- Sub-questions should progress from basic to advanced
${includeAnswers ? '- Include detailed \'modelAnswer\' for each sub-question with step-by-step solutions' : ''}
- Use LaTeX for mathematical expressions and solutions` : ''}

${questionType === 'SQ' ? `
SQ (SHORT) QUESTIONS:
- Focus on a single concept or calculation
- Question should be clear and direct
${includeAnswers ? '- Provide comprehensive \'modelAnswer\' with detailed solution steps and reasoning' : ''}
- Use LaTeX for mathematical expressions and solutions` : ''}

MATHEMATICAL CONTENT:
- For any mathematical content, use proper LaTeX notation
- Common examples: $x^2 + y^2 = z^2$, $\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$, $\\int_{a}^{b} f(x) dx$
- If no mathematical content, set 'questionLatex' to empty string

RESPONSE FORMAT:
- Respond ONLY with a valid JSON array matching the provided schema
- Do not include any explanatory text outside the JSON
- Ensure all required fields are present and properly formatted

Generate questions that will challenge students appropriately for ${difficulty} level while maintaining clarity and educational value.`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema }
    };

    try {
        const geminiResponse = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!geminiResponse.ok) throw new Error(`Gemini API Error: ${await geminiResponse.text()}`);

        const result = await geminiResponse.json();
        const text = result.candidates[0].content.parts[0].text;
        const generatedQuestions = JSON.parse(text);
        const finalQuestions = generatedQuestions.map((q: any) => ({
            ...q, type: questionType, subject, topic, difficulty, isAiGenerated: true, hasMath: !!q.questionLatex,
        }));
        return NextResponse.json({ questions: finalQuestions });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return NextResponse.json({ error: "An error occurred during AI question generation.", details: (error as Error).message }, { status: 500 });
    }
}
