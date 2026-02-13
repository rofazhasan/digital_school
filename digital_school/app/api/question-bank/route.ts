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
    subject: z.string().min(1, "Subject is required"),
    topic: z.string().optional().nullable(),
    marks: z.coerce.number().int().min(1, "Marks must be at least 1"),
    difficulty: z.nativeEnum(Difficulty),
    questionText: z.string().min(1, "Question content is required"),
    hasMath: z.boolean().default(false),
    classId: z.string().cuid("Valid class ID is required"),
    isAiGenerated: z.boolean().default(false),
    options: z.array(z.object({
        text: z.string().min(1, "Option text is required"),
        isCorrect: z.boolean(),
        explanation: z.string().optional().nullable(),
        image: z.string().optional().nullable()
    })).nullable().default(null),
    subQuestions: z.array(z.object({
        question: z.string().min(1, "Sub-question text is required"),
        marks: z.number().int().min(1, "Sub-question marks must be at least 1"),
        modelAnswer: z.string().optional().nullable(),
        image: z.string().optional().nullable()
    })).nullable().default(null),
    modelAnswer: z.string().optional().nullable(),
    assertion: z.string().optional().nullable(),
    reason: z.string().optional().nullable(),
    correctOption: z.coerce.number().int().min(1).max(5).optional().nullable(),
    questionBankIds: z.array(z.string().cuid()).optional().nullable(),
    images: z.array(z.string()).optional().nullable(),
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
            console.error('Validation failed:', validation.error.flatten());
            return NextResponse.json({
                error: "Invalid input",
                details: validation.error.flatten(),
                receivedData: body
            }, { status: 400 });
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
        const ids = searchParams.get('ids');

        if (ids) {
            const idList = ids.split(',').filter(Boolean);
            if (idList.length === 0) return NextResponse.json({ error: "No valid IDs provided" }, { status: 400 });

            await prisma.question.deleteMany({
                where: { id: { in: idList } }
            });
            return NextResponse.json({ message: "Questions deleted successfully" });
        }

        if (!id) return NextResponse.json({ error: "Question ID is required" }, { status: 400 });

        await prisma.question.delete({ where: { id } });
        return NextResponse.json({ message: "Question deleted successfully" });
    } catch (error) {
        console.error("Failed to delete question:", error);
        return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { ids, isForPractice } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        if (typeof isForPractice !== 'boolean') {
            return NextResponse.json({ error: "isForPractice must be a boolean" }, { status: 400 });
        }

        const updated = await prisma.question.updateMany({
            where: { id: { in: ids } },
            data: { isForPractice }
        });

        return NextResponse.json({
            message: "Questions updated successfully",
            count: updated.count
        });

    } catch (error) {
        console.error("Failed to bulk update questions:", error);
        return NextResponse.json({ error: "Failed to bulk update questions" }, { status: 500 });
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
                }),
                ...(questionType === 'AR' && {
                    assertion: { type: "STRING", description: "The assertion statement (A)." },
                    reason: { type: "STRING", description: "The reason statement (R)." },
                    correctOption: { type: "NUMBER", description: "The correct option (1-5)." }
                }),
                explanation: { type: "STRING", description: "Explanation of why the answer is correct." }
            },
            required: ["questionText", "marks"].concat(
                (questionType === 'MCQ' || questionType === 'MC') ? ['options'] :
                    questionType === 'INT' ? ['modelAnswer'] :
                        questionType === 'AR' ? ['assertion', 'reason', 'correctOption'] :
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

${questionType === 'MC' ? `
MC (MULTIPLE CORRECT) QUESTIONS:
- Provide exactly 4-6 options
- At least TWO options should have 'isCorrect: true'
- Remaining options should have 'isCorrect: false'
- Make incorrect options plausible but clearly wrong
${includeAnswers ? '- Include detailed \'explanation\' for EACH correct option explaining the reasoning' : ''}
- Use LaTeX for mathematical expressions: $\\frac{a}{b}$, $x^2$, $\\sqrt{x}$, etc.
- Students must select ALL correct options to get full marks` : ''}

${questionType === 'INT' ? `
INT (INTEGER TYPE) QUESTIONS:
- The answer MUST be a single integer (whole number)
- Question should have a clear numerical answer
- Provide the correct integer answer in 'modelAnswer' field as a number
${includeAnswers ? '- Include detailed \'explanation\' showing step-by-step solution' : ''}
- Use LaTeX for mathematical expressions in the question and explanation
- Examples: "What is the value of $5^3$?", "How many prime numbers are there between 1 and 20?"` : ''}

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

${questionType === 'AR' ? `
AR (ASSERTION-REASON) QUESTIONS:
- Create two statements: Assertion (A) and Reason (R)
- Both statements must be factual and clear
- Students must evaluate both statements and their relationship
- Provide the correct relationship as option 1-5:
  1. Both A and R are true, and R is the correct explanation of A
  2. Both A and R are true, but R is NOT the correct explanation of A
  3. A is true, but R is false
  4. A is false, but R is true
  5. Both A and R are false
- Put Assertion in 'assertion' field and Reason in 'reason' field
- Put the correct number (1-5) in 'correctOption' field
${includeAnswers ? '- Include a detailed \'explanation\' of why the selected relationship is correct' : ''}
- Use LaTeX for mathematical expressions in both statements` : ''}

MATHEMATICAL CONTENT AND FORMATTING:
- For any mathematical content, use proper LaTeX notation
- Common examples: $x^2 + y^2 = z^2$, $\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$, $\\int_{a}^{b} f(x) dx$


TABLES AND DATA:
- When presenting data in tables, use LaTeX table syntax:
  - Simple table: $\\begin{array}{|c|c|c|} \\hline A & B & C \\\\ \\hline 1 & 2 & 3 \\\\ \\hline \\end{array}$
  - Matrix: $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$
  - Determinant: $\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}$
- For frequency tables, use: $\\begin{array}{|c|c|} \\hline \\text{Value} & \\text{Frequency} \\\\ \\hline x_1 & f_1 \\\\ \\hline x_2 & f_2 \\\\ \\hline \\end{array}$

GEOMETRY AND DIAGRAMS:
- For geometric shapes, use LaTeX geometry commands:
  - Triangle: $\\triangle ABC$ with sides $a$, $b$, $c$
  - Circle: $\\odot O$ with radius $r$ and center $O$
  - Rectangle: $\\square ABCD$ with length $l$ and width $w$
  - Angles: $\\angle ABC = \\theta$
  - Parallel lines: $AB \\parallel CD$
  - Perpendicular: $AB \\perp CD$
- For coordinate geometry: Point $A(x_1, y_1)$, Line $y = mx + c$, Circle $(x-h)^2 + (y-k)^2 = r^2$

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
            ...q, type: questionType, subject, topic, difficulty, isAiGenerated: true, hasMath: !!q.questionText.match(/[\$\\]/),
        }));
        return NextResponse.json({ questions: finalQuestions });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return NextResponse.json({ error: "An error occurred during AI question generation.", details: (error as Error).message }, { status: 500 });
    }
}
