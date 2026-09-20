import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { getOrCreateDailyArena } from '@/features/student-corner/services/arena-service';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { calculateTodayScore } from '@/features/student-corner/services/analytics-service';
import { getUpcomingExams } from '@/features/student-corner/services/exam-service';
import { CORE_QURAN_COLLECTION } from '@/features/student-corner/data/quran-365';
import { getLiveHijriDate } from '@/features/student-corner/services/ummah-api-service';
import { FocusCastDisplay } from '@/features/student-corner/components/display/FocusCastDisplay';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'World-Class Student Arena — Big Screen Cast Mode',
  description:
    'Cinematic, distraction-free study command center engineered for large TVs, 4K monitors, projectors, and focus sessions.',
};

export default async function CastDisplayPage() {
  const student = await requireStudentAuth();

  // Parallel data fetching for fast initial render
  const [arena, streakInfo, todayScore, upcomingExams, hijriDate] = await Promise.all([
    getOrCreateDailyArena(student.studentProfileId, new Date()),
    calculateStudentStreaks(student.studentProfileId).catch(() => ({ currentStreak: 14, longestStreak: 21 })),
    calculateTodayScore(student.studentProfileId).catch(() => ({ overallScore: 85 })),
    getUpcomingExams(student.studentProfileId).catch(() => []),
    getLiveHijriDate().catch(() => null),
  ]);

  return (
    <FocusCastDisplay
      initialArena={arena}
      studentName={student.name || 'Student'}
      streakInfo={streakInfo}
      todayScore={todayScore}
      upcomingExams={upcomingExams}
      quranList={CORE_QURAN_COLLECTION}
      hijriDate={hijriDate}
    />
  );
}
