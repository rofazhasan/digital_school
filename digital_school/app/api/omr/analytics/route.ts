/**
 * OMR Analytics API — Phase 3-D
 *
 * GET /api/omr/analytics?examId=...
 *
 * Returns aggregated statistics for all OMR scans for a given exam:
 *   - Score distribution (histogram buckets)
 *   - Per-question correctness rates (difficulty index)
 *   - Grade distribution
 *   - Top performers
 *   - Set-wise comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = await getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');

    if (!examId) return NextResponse.json({ error: 'examId is required' }, { status: 400 });

    // ── Fetch all APPROVED scans for the exam ──────────────────────────────
    const scans = await prisma.oMRScan.findMany({
      where: { examId, status: { in: ['APPROVED', 'SYNCED', 'PUBLISHED'] } },
      include: {
        answers: { select: { questionNo: true, isCorrect: true, selectedOption: true, marksObtained: true } },
      },
    });

    if (scans.length === 0) {
      return NextResponse.json({
        examId,
        totalScanned: 0,
        message: 'No approved scans found for this exam.',
        scoreDistribution: [],
        gradeDistribution: [],
        questionDifficulty: [],
        topPerformers: [],
        setComparison: [],
      });
    }

    const totalScanned = scans.length;
    const scores = scans.map((s) => s.totalScore);
    const maxScore = scans[0]?.maxScore || 100;

    // ── Score stats ───────────────────────────────────────────────────────
    const avg    = scores.reduce((a, b) => a + b, 0) / totalScanned;
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const highest = Math.max(...scores);
    const lowest  = Math.min(...scores);

    // ── Score histogram (10 buckets) ─────────────────────────────────────
    const bucketCount = 10;
    const bucketSize  = maxScore / bucketCount;
    const buckets     = Array.from({ length: bucketCount }, (_, i) => ({
      label: `${Math.round(i * bucketSize)}–${Math.round((i + 1) * bucketSize)}`,
      min:   i * bucketSize,
      max:   (i + 1) * bucketSize,
      count: 0,
    }));
    for (const score of scores) {
      const idx = Math.min(Math.floor(score / bucketSize), bucketCount - 1);
      buckets[idx].count++;
    }

    // ── Grade distribution ────────────────────────────────────────────────
    const gradeMap: Record<string, number> = {};
    for (const scan of scans) {
      const pct = maxScore > 0 ? (scan.totalScore / maxScore) * 100 : 0;
      const grade = pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'A-'
        : pct >= 50 ? 'B' : pct >= 40 ? 'C' : pct >= 33 ? 'D' : 'F';
      gradeMap[grade] = (gradeMap[grade] || 0) + 1;
    }
    const gradeOrder = ['A+', 'A', 'A-', 'B', 'C', 'D', 'F'];
    const gradeDistribution = gradeOrder
      .filter((g) => gradeMap[g])
      .map((g) => ({
        grade:   g,
        count:   gradeMap[g],
        percent: Math.round((gradeMap[g] / totalScanned) * 100),
      }));

    // ── Question difficulty index ────────────────────────────────────────
    const qStats: Record<number, { correct: number; wrong: number; blank: number; total: number }> = {};
    for (const scan of scans) {
      for (const ans of scan.answers) {
        if (!qStats[ans.questionNo]) qStats[ans.questionNo] = { correct: 0, wrong: 0, blank: 0, total: 0 };
        qStats[ans.questionNo].total++;
        if (ans.isCorrect === true)                  qStats[ans.questionNo].correct++;
        else if (!ans.selectedOption)                qStats[ans.questionNo].blank++;
        else                                         qStats[ans.questionNo].wrong++;
      }
    }
    const questionDifficulty = Object.entries(qStats)
      .map(([qNo, stat]) => ({
        questionNo:      parseInt(qNo),
        correctRate:     stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
        wrongRate:       stat.total > 0 ? Math.round((stat.wrong   / stat.total) * 100) : 0,
        blankRate:       stat.total > 0 ? Math.round((stat.blank   / stat.total) * 100) : 0,
        difficulty:      stat.total > 0
          ? stat.correct / stat.total >= 0.7 ? 'EASY'
          : stat.correct / stat.total >= 0.4 ? 'MEDIUM' : 'HARD'
          : 'UNKNOWN',
        respondents:     stat.total,
      }))
      .sort((a, b) => a.questionNo - b.questionNo);

    // ── Set-wise comparison ──────────────────────────────────────────────
    const setMap: Record<string, { scores: number[]; count: number }> = {};
    for (const scan of scans) {
      const set = scan.detectedSet || 'Unknown';
      if (!setMap[set]) setMap[set] = { scores: [], count: 0 };
      setMap[set].scores.push(scan.totalScore);
      setMap[set].count++;
    }
    const setComparison = Object.entries(setMap).map(([set, data]) => ({
      set,
      count:   data.count,
      average: Math.round((data.scores.reduce((a, b) => a + b, 0) / data.count) * 100) / 100,
      highest: Math.max(...data.scores),
      lowest:  Math.min(...data.scores),
    }));

    // ── Top performers ───────────────────────────────────────────────────
    const topPerformers = scans
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10)
      .map((scan, idx) => ({
        rank:          idx + 1,
        rollNumber:    scan.rollNumber || '—',
        registrationNo: scan.registrationNo || '—',
        score:         scan.totalScore,
        percentage:    maxScore > 0 ? Math.round((scan.totalScore / maxScore) * 100 * 10) / 10 : 0,
        detectedSet:   scan.detectedSet || '—',
        scanId:        scan.id,
      }));

    // ── Full ranking table ───────────────────────────────────────────────
    const ranking = scans
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((scan, idx) => ({
        rank:          idx + 1,
        rollNumber:    scan.rollNumber || '—',
        registrationNo: scan.registrationNo || '—',
        score:         scan.totalScore,
        maxScore,
        percentage:    maxScore > 0 ? Math.round((scan.totalScore / maxScore) * 100 * 10) / 10 : 0,
        detectedSet:   scan.detectedSet || '—',
        studentId:     scan.studentId,
        scanId:        scan.id,
      }));

    return NextResponse.json({
      examId,
      totalScanned,
      maxScore,
      stats: {
        average: Math.round(avg * 100) / 100,
        median:  Math.round(median * 100) / 100,
        highest,
        lowest,
        passCount: scores.filter((s) => maxScore > 0 && s / maxScore >= 0.33).length,
        failCount: scores.filter((s) => maxScore > 0 && s / maxScore < 0.33).length,
      },
      scoreDistribution:  buckets,
      gradeDistribution,
      questionDifficulty,
      setComparison,
      topPerformers,
      ranking,
    });
  } catch (err: any) {
    console.error('[OMR Analytics]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
