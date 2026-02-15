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
    leftColumn: z.array(z.any()).optional().nullable(),
    rightColumn: z.array(z.any()).optional().nullable(),
    matches: z.record(z.string(), z.string()).optional().nullable(),
    explanation: z.string().optional().nullable(),
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

        const { questionBankIds, assertion, reason, correctOption, leftColumn, rightColumn, matches, explanation, ...questionData } = validation.data;

        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: {
                ...questionData,
                assertion,
                reason,
                correctOption,
                leftColumn,
                rightColumn,
                matches,
                explanation,
                QuestionToQuestionBank: questionBankIds ? { set: questionBankIds.map(bankId => ({ question_banks: { connect: { id: bankId } } })) } : { set: [] },
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

    // Response schema for Gemini
    const responseSchema: any = {
        type: "object",
        properties: {
            questions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        type: { type: "string", enum: [questionType] },
                        questionText: { type: "string" },
                        marks: { type: "number" },
                        difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
                        subject: { type: "string" },
                        topic: { type: "string" },
                        hasMath: { type: "boolean" },
                    },
                    required: ["type", "questionText", "marks", "difficulty", "subject", "topic", "hasMath"]
                }
            }
        },
        required: ["questions"]
    };

    const itemProps = responseSchema.properties.questions.items.properties;
    const itemRequired = responseSchema.properties.questions.items.required;

    if (questionType === 'MCQ' || (questionType as string) === 'MC') {
        itemProps.options = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    text: { type: "string" },
                    isCorrect: { type: "boolean" },
                    ...(includeAnswers && { explanation: { type: "string" } })
                },
                required: ["text", "isCorrect"]
            }
        };
        itemRequired.push("options");
        if (questionType === 'MCQ') {
            itemProps.correct = { type: "string" };
            itemRequired.push("correct");
        }
    } else if ((questionType as string) === 'INT') {
        itemProps.modelAnswer = { type: "string" };
        itemRequired.push("modelAnswer");
        if (includeAnswers) {
            itemProps.explanation = { type: "string" };
            itemRequired.push("explanation");
        }
    } else if ((questionType as string) === 'AR') {
        itemProps.assertion = { type: "string" };
        itemProps.reason = { type: "string" };
        itemProps.correctOption = { type: "number" };
        itemRequired.push("assertion", "reason", "correctOption");
        if (includeAnswers) {
            itemProps.explanation = { type: "string" };
            itemRequired.push("explanation");
        }
    } else if ((questionType as string) === 'MTF') {
        itemProps.leftColumn = {
            type: "array",
            items: {
                type: "object",
                properties: { id: { type: "string" }, text: { type: "string" } },
                required: ["id", "text"]
            }
        };
        itemProps.rightColumn = {
            type: "array",
            items: {
                type: "object",
                properties: { id: { type: "string" }, text: { type: "string" } },
                required: ["id", "text"]
            }
        };
        itemProps.matches = { type: "object", additionalProperties: { type: "string" } };
        itemRequired.push("leftColumn", "rightColumn", "matches");
        if (includeAnswers) {
            itemProps.explanation = { type: "string" };
            itemRequired.push("explanation");
        }
    } else if ((questionType as string) === 'CQ') {
        itemProps.subQuestions = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    marks: { type: "number" },
                    ...(includeAnswers && { modelAnswer: { type: "string" } })
                },
                required: ["question", "marks"]
            }
        };
        itemRequired.push("subQuestions");
    } else if ((questionType as string) === 'SQ') {
        itemProps.modelAnswer = { type: "string" };
        itemRequired.push("modelAnswer");
        if (includeAnswers) {
            itemProps.explanation = { type: "string" };
            itemRequired.push("explanation");
        }
    }

    const prompt = `You are an expert test creator specializing in ${subject} for ${className} level. Generate ${count} unique, high-quality questions based on these specifications:
- Class/Level: ${className}
- Subject: ${subject}
${topic ? `- Topic: ${topic}` : ''}
- Difficulty: ${difficulty}
- Question Type: ${questionType}
- Count: ${count}
- Language: Provide all content in Bengali, but keep IDs like '1', '2', 'A', 'B' and keys in 'matches' in English.

${(questionType as string) === 'MCQ' || (questionType as string) === 'MC' ? `
${(questionType as string) === 'MCQ' ? 'MCQ (SINGLE CORRECT) RULES:' : 'MC (MULTIPLE CORRECT) RULES:'}
- Create a clear, concise question
- Provide 4-6 plausible options
- ${(questionType as string) === 'MCQ' ? 'EXACTLY ONE option must be correct' : 'AT LEAST TWO options must be correct'}
${includeAnswers ? '- Include a helpful \'explanation\' for each correct option' : ''}
- Avoid "None of the above" or "All of the above" if possible` : ''}

${(questionType as string) === 'INT' ? `
INT (INTEGER TYPE) QUESTIONS:
- The answer MUST be a single integer (whole number)
- Question should have a clear numerical answer
- Provide the correct integer answer in 'modelAnswer' field as a number
${includeAnswers ? '- Include detailed \'explanation\' showing step-by-step solution' : ''}
- Use LaTeX for mathematical expressions in the question and explanation` : ''}

${(questionType as string) === 'CQ' ? `
CQ (COMPREHENSIVE) QUESTIONS:
- Provide 2-4 sub-questions that build upon each other
- Each sub-question should have appropriate marks (total should equal question marks)
- Sub-questions should progress from basic to advanced
${includeAnswers ? '- Include detailed \'modelAnswer\' for each sub-question with step-by-step solutions' : ''}
- Use LaTeX for mathematical expressions and solutions` : ''}

${(questionType as string) === 'SQ' ? `
SQ (SHORT) QUESTIONS:
- Focus on a single concept or calculation
- Question should be clear and direct
${includeAnswers ? '- Provide comprehensive \'modelAnswer\' with detailed solution steps and reasoning' : ''}
- Use LaTeX for mathematical expressions and solutions` : ''}

${(questionType as string) === 'AR' ? `
AR (ASSERTION-REASON) QUESTIONS:
- Create two statements: Assertion (A) and Reason (R)
- Both statements must be factual and clear
- Students must evaluate both statements and their relationship
- Provide the correct relationship as option 1-5:
  1. Both A and R are true, and R is the correct explanation of A
  2. Both A and R are true, but R is NOT the correct explanation of A
  3. Assertion is true but Reason is false
  4. Assertion is false but Reason is true
  5. Both statements are false
${includeAnswers ? '- Include a detailed \'explanation\' of why the selected relationship is correct' : ''}
- Use LaTeX for mathematical expressions in both statements` : ''}

${(questionType as string) === 'MTF' ? `
MTF (MATCH THE FOLLOWING) QUESTIONS:
- Create two lists: leftColumn (Column A) and rightColumn (Column B)
- Column A items should be numbered (1, 2, 3...)
- Column B items should be lettered (A, B, C...)
- Provide the correct pairings in the 'matches' field (e.g., {"1": "B", "2": "A"})
- Right column can have more items than left column (distractors)
${includeAnswers ? '- Provide detailed \'explanation\' summarizing the correct matches' : ''}
- Use LaTeX for mathematical expressions and solutions` : ''}

MATHEMATICAL CONTENT AND FORMATTING:
- For any mathematical content, use proper LaTeX notation
- Common examples: $x^2 + y^2 = z^2$, $\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$, $\\int_{a}^{b} f(x) dx$

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
        const generatedData = JSON.parse(text);

        // Handle both wrapped and unwrapped array responses
        const questionsArray = Array.isArray(generatedData) ? generatedData : (generatedData.questions || []);

        const finalQuestions = questionsArray.map((q: any) => ({
            ...q,
            type: questionType,
            subject,
            topic: topic || q.topic,
            difficulty: difficulty || q.difficulty,
            isAiGenerated: true,
            hasMath: Boolean(
                /\\/.test(q.questionText || '') ||
                /\\/.test(q.modelAnswer || '') ||
                /\\/.test(q.assertion || '') ||
                /\\/.test(q.reason || '') ||
                (q.options ? q.options.some((o: any) => /\\/.test(o.text)) : false) ||
                (q.subQuestions ? q.subQuestions.some((sq: any) => /\\/.test(sq.question)) : false)
            )
        }));
        return NextResponse.json({ questions: finalQuestions });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return NextResponse.json({ error: "An error occurred during AI question generation.", details: (error as Error).message }, { status: 500 });
    }
}
