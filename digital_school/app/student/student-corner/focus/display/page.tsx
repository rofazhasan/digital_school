import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { getOrCreateDailyArena } from '@/features/student-corner/services/arena-service';
import { getQuranReflectionForDay } from '@/features/student-corner/data/quran-365';
import { FocusCastDisplay } from '@/features/student-corner/components/display/FocusCastDisplay';
import { getDayOfYear } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cast Display Mode — Student Corner',
  description: 'Clean, distraction-free countdown display optimized for TVs and external monitors.',
};

export default async function CastDisplayPage() {
  const student = await requireStudentAuth();
  const arena = await getOrCreateDailyArena(student.studentProfileId, new Date());
  const dayOfYear = getDayOfYear(new Date());
  const quran = getQuranReflectionForDay(dayOfYear);

  const completedCount = arena.challenges.filter((c) => c.status === 'COMPLETED').length;
  const totalCount = arena.challenges.length || 1;

  // Active or first incomplete challenge
  const activeChallenge = arena.challenges.find((c) => c.status === 'IN_PROGRESS') ||
    arena.challenges.find((c) => c.status !== 'COMPLETED') ||
    arena.challenges[0];

  return (
    <FocusCastDisplay
      initialTitle={activeChallenge?.title || 'Daily Deep Focus Routine'}
      initialSubject={activeChallenge?.category || 'Focus Arena'}
      initialMinutes={activeChallenge?.durationMinutes || 45}
      completedCount={completedCount}
      totalCount={totalCount}
      dailyAyahText={quran.arabicText}
      dailyAyahSource={`সূরা ${quran.surahNameBangla}: ${quran.ayahNumber}`}
    />
  );
}
