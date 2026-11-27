import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const studentSelfEvalSchema = z.object({
  examId: z.string().min(1),
  examSet: z.string().optional().default('A'),
  sheetId: z.string().optional(),
  templateId: z.string().optional().default('medical_admission_100q'),
  rawResponses: z.record(z.array(z.string())),
  qualityMetrics: z.record(z.any()).optional(),
});

const BN_TO_EN: Record<string, string> = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D', 'ঙ': 'E' };
function normOpt(v: string): string {
  const clean = String(v || '').trim().toUpperCase();
  return BN_TO_EN[clean] || clean;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'লগইন আবশ্যক (Authentication required)' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = studentSelfEvalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid scan payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { examId, examSet, sheetId, templateId, rawResponses, qualityMetrics } = parsed.data;

    const exam = await prismadb.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        name: true,
        totalMarks: true,
        mcqNegativeMarking: true,
        endTime: true,
        isActive: true,
        examSets: { select: { id: true, name: true, questionsJson: true } },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Prevent answer-key harvesting while a live official exam is still in progress!
    const nowMs = Date.now();
    const endMs = exam.endTime ? new Date(exam.endTime).getTime() : 0;
    const isLiveOngoing = exam.isActive && endMs > nowMs;
    if (isLiveOngoing && auth.user.role === 'STUDENT') {
      return NextResponse.json(
        {
          error: 'পরীক্ষার নির্ধারিত সময় শেষ হওয়ার পর স্বয়ংক্রিয় ওএমআর মূল্যায়ন ও উত্তরপত্র দেখা যাবে।',
          examOngoing: true,
        },
        { status: 403 }
      );
    }

    const cleanSet = normOpt(examSet.replace(/^(set|সেট)\s*[-:]?\s*/i, ''));
    const matchedSet =
      exam.examSets.find((s) => {
        const sName = normOpt(s.name.replace(/^(set|সেট)\s*[-:]?\s*/i, ''));
        return sName === cleanSet || sName.startsWith(cleanSet);
      }) ||
      exam.examSets[0] ||
      null;

    const allSetQs = Array.isArray(matchedSet?.questionsJson) ? (matchedSet.questionsJson as any[]) : [];
    const questions = allSetQs.filter(
      (q: any) => !q?.type || ['MCQ', 'SMCQ'].includes(String(q.type).toUpperCase())
    );
    const rawNeg = Math.abs(Number(exam.mcqNegativeMarking ?? 0));
    const negMark = rawNeg > 1 ? rawNeg / 100 : rawNeg;

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unmarkedCount = 0;
    const questionVerdicts: Record<string, any> = {};

    questions.forEach((q: any, idx: number) => {
      const qKey = `q${idx + 1}`;
      const qMarks = Number(q.marks) || 1.0;
      maxScore += qMarks;

      let correctOpt = '';
      if (q.correctAnswer) correctOpt = normOpt(q.correctAnswer);
      else if (typeof q.correctOption === 'number') correctOpt = ['A', 'B', 'C', 'D', 'E'][q.correctOption] || '';
      else if (Array.isArray(q.options)) {
        const cIdx = q.options.findIndex((o: any) => o?.isCorrect || o?.correct);
        if (cIdx >= 0) correctOpt = ['A', 'B', 'C', 'D', 'E'][cIdx] || '';
      }

      const marked = rawResponses[qKey] || [];
      const studentAnswer = marked.join('/');
      let verdict: 'correct' | 'incorrect' | 'unmarked' | 'multi_marked' = 'unmarked';
      let score = 0;

      if (marked.length === 0) {
        verdict = 'unmarked';
        unmarkedCount++;
      } else if (marked.length > 1) {
        verdict = 'multi_marked';
        score = -negMark;
        incorrectCount++;
      } else if (normOpt(marked[0]) === correctOpt) {
        verdict = 'correct';
        score = qMarks;
        correctCount++;
      } else {
        verdict = 'incorrect';
        score = -negMark;
        incorrectCount++;
      }

      totalScore += score;
      questionVerdicts[qKey] = {
        question: qKey,
        studentAnswer,
        correctAnswer: correctOpt,
        verdict,
        score,
        section: q.subject || 'General',
      };
    });

    totalScore = parseFloat(totalScore.toFixed(2));
    const finalMax = maxScore || exam.totalMarks || 100;
    const percentage = finalMax > 0 ? parseFloat(((totalScore / finalMax) * 100).toFixed(2)) : 0;

    // Record non-authoritative self-check scan strictly tied to the authenticated student's own profile
    const studentProfileId = auth.user.studentProfile?.id || null;
    const studentRoll = auth.user.studentProfile?.roll || null;
    const scanUuid = sheetId || uuidv4();

    if (studentProfileId) {
      await prismadb.oMRScan.upsert({
        where: { scanUuid },
        update: {
          totalScore,
          maxScore: finalMax,
          rawAnswers: rawResponses,
          evaluatedAnswers: questionVerdicts,
          detectedSet: cleanSet,
          status: 'SELF_CHECKED',
          isAuthoritative: false,
        },
        create: {
          scanUuid,
          templateId,
          examId: exam.id,
          examSetId: matchedSet?.id || null,
          studentId: studentProfileId,
          rollNumber: studentRoll,
          detectedSet: cleanSet,
          totalScore,
          maxScore: finalMax,
          rawAnswers: rawResponses,
          evaluatedAnswers: questionVerdicts,
          confidenceScore: ((qualityMetrics as any)?.averageConfidence ?? 0.95) * 100,
          qualityScore: (qualityMetrics as any)?.sharpnessScore ?? 90,
          status: 'SELF_CHECKED',
          isAuthoritative: false,
          createdById: auth.user.id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      examName: exam.name,
      examSet: cleanSet,
      totalScore,
      maxScore: finalMax,
      percentage,
      correctCount,
      incorrectCount,
      unmarkedCount,
      questionVerdicts,
    });
  } catch (error: any) {
    console.error('POST /api/student/omr-self-evaluate error:', error);
    return NextResponse.json({ error: 'Self-evaluation failed: ' + error.message }, { status: 500 });
  }
}
