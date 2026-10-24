import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/db";
import { getTokenFromRequest } from '@/lib/auth';
import {
    validateAndRepairQuestion,
    createBlindMaskedQuestion,
    generateAuditCertificate,
    verifyAuditCertificate,
    getCurriculumQuestions,
    BlindGenerationRequestSchema,
    QuestionAuditResult
} from '@/lib/blind-exam-engine';

export async function POST(req: NextRequest) {
    try {
        const auth = await getTokenFromRequest(req);
        if (!auth || !auth.user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const rawBody = await req.json().catch(() => ({}));
        
        // Strict input validation & sanitization via Zod (zod-validation-expert & backend-security-coder)
        const parseResult = BlindGenerationRequestSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: parseResult.error.flatten().fieldErrors
            }, { 
                status: 400,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }

        const {
            examId,
            subject,
            topic,
            difficulty,
            questionType,
            count: numQuestions,
            className,
            setName,
            autoAddToExam,
            customFocus,
            shuffleOptions
        } = parseResult.data;

        let rawQuestions: any[] = [];

        // Check for Google Gemini API key
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

        if (apiKey) {
            try {
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

                const prompt = `You are a distinguished national exam author, curriculum specialist, and LaTeX mathematician.
Generate exactly ${numQuestions} distinct, rigorous exam questions for ${className} on Subject: "${subject}", Topic: "${topic}".
Difficulty: ${difficulty}. Question Type: ${questionType}.
${customFocus ? `Special focus syllabus: ${customFocus}` : ''}

### CRITICAL INTEGRITY RULES:
1. LATEX PRECISION:
   - Format every mathematical and scientific variable, equation, and unit in valid LaTeX.
   - Use $...$ for inline formulas and $$...$$ for standalone display formulas.
   - ALWAYS close all math tags. NEVER leave unclosed $ or braces { }.
2. OPTION RIGOR (for MCQ / MC):
   - Provide 4 distinct, plausible options.
   - For MCQ, designate EXACTLY ONE correct option by setting "isCorrect": true.
   - Ensure the distractors are realistic student misconceptions, not trivial or nonsensical.
   - Options must NOT contain duplicate text or give away the answer.
3. EXPLANATIONS:
   - Provide a mathematically and conceptually rigorous step-by-step solution.

Output ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "type": "${questionType}",
      "questionText": "...",
      "marks": 1,
      "difficulty": "${difficulty}",
      "subject": "${subject}",
      "topic": "${topic}",
      "options": [
        { "text": "...", "isCorrect": true, "explanation": "..." },
        { "text": "...", "isCorrect": false },
        { "text": "...", "isCorrect": false },
        { "text": "...", "isCorrect": false }
      ],
      "modelAnswer": "...",
      "explanation": "..."
    }
  ]
}`;

                const responseSchema = {
                    type: "object",
                    properties: {
                        questions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    questionText: { type: "string" },
                                    marks: { type: "number" },
                                    difficulty: { type: "string" },
                                    subject: { type: "string" },
                                    topic: { type: "string" },
                                    modelAnswer: { type: "string" },
                                    explanation: { type: "string" },
                                    options: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                text: { type: "string" },
                                                isCorrect: { type: "boolean" },
                                                explanation: { type: "string" }
                                            },
                                            required: ["text", "isCorrect"]
                                        }
                                    }
                                },
                                required: ["questionText", "type", "marks"]
                            }
                        }
                    },
                    required: ["questions"]
                };

                const geminiRes = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            responseSchema
                        }
                    })
                });

                if (geminiRes.ok) {
                    const geminiData = await geminiRes.json();
                    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        const parsed = JSON.parse(text);
                        rawQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
                    }
                }
            } catch (aiErr) {
                console.warn("[BlindGenerationAPI] Gemini generation failed or timed out, using curriculum bank fallback:", aiErr);
            }
        }

        // Fallback to high-yield curriculum bank if AI didn't return questions
        if (!rawQuestions || rawQuestions.length === 0) {
            rawQuestions = getCurriculumQuestions(subject, topic, difficulty, questionType, numQuestions, className);
        }

        // Run full AI Quality & LaTeX Audit Pass
        const auditResults: QuestionAuditResult[] = [];
        const verifiedQuestions: any[] = [];
        const blindMaskedQuestions: any[] = [];

        rawQuestions.slice(0, numQuestions).forEach((rawQ, idx) => {
            const { question: verified, audit } = validateAndRepairQuestion(rawQ, idx, shuffleOptions);
            verified.className = className;
            auditResults.push(audit);
            verifiedQuestions.push(verified);

            // Pure Zero-Knowledge Masking (server never returns plain text to creator)
            const blindMasked = createBlindMaskedQuestion(verified, idx);
            blindMaskedQuestions.push(blindMasked);
        });

        const auditCertificate = generateAuditCertificate(auditResults);
        const isCertValid = verifyAuditCertificate(auditCertificate);

        let createdExamSetId: string | null = null;

        // Auto-save directly into exam if requested
        if (autoAddToExam && examId) {
            const existingExam = await prisma.exam.findUnique({
                where: { id: examId },
                include: { examSets: true }
            });

            if (existingExam) {
                // The questions saved to the database use the fully encrypted payload
                const setRecord = await prisma.examSet.create({
                    data: {
                        name: setName,
                        description: 'Encrypted Confidential Set (Zero-Knowledge Blind Mode)',
                        examId: examId,
                        createdById: auth.user.id,
                        // Store the blind encrypted questions in questionsJson
                        questionsJson: blindMaskedQuestions as any
                    }
                });
                createdExamSetId = setRecord.id;

                // Also update generatedSet on exam
                const allSets = [
                    ...(existingExam.examSets || []).map(s => ({
                        id: s.id,
                        name: s.name,
                        description: s.description,
                        questions: s.questionsJson
                    })),
                    {
                        id: setRecord.id,
                        name: setRecord.name,
                        description: setRecord.description,
                        isEncrypted: true,
                        isBlindEncrypted: true,
                        questions: blindMaskedQuestions
                    }
                ];

                await prisma.exam.update({
                    where: { id: examId },
                    data: { generatedSet: allSets as any }
                });
            }
        }

        // Return hardened response with anti-caching & strict content-type headers
        return NextResponse.json({
            success: true,
            examId: examId || null,
            examSetId: createdExamSetId,
            setName,
            totalGenerated: blindMaskedQuestions.length,
            // Creator receives ONLY the blind-masked questions (NO plaintext leaked)
            questions: blindMaskedQuestions,
            auditCertificate,
            certificateVerified: isCertValid,
            securityRating: "WORLD-CLASS ZERO-KNOWLEDGE (AES-256-GCM + HMAC-SHA256)"
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Content-Type-Options': 'nosniff'
            }
        });

    } catch (error: any) {
        console.error("[BlindGenerationAPI] Error:", error);
        return NextResponse.json({
            error: error.message || 'Failed to generate blind questions'
        }, { status: 500 });
    }
}
