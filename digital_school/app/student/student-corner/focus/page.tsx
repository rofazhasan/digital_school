import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { FocusEngine } from '@/features/student-corner/components/focus/FocusEngine';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { getOrCreateDailyArena } from '@/features/student-corner/services/arena-service';
import db from '@/lib/db';

interface FocusPageProps {
  searchParams: Promise<{ challengeId?: string; arenaId?: string; duration?: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Focus Engine — Student Corner',
  description: 'Immersive timestamp-based focus session with sleep resilience and ambient sound.',
};

export default async function FocusPage({ searchParams }: FocusPageProps) {
  const { challengeId, arenaId, duration } = await searchParams;
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  // If arenaId not provided, get today's arena
  let activeArenaId = arenaId;
  if (!activeArenaId) {
    const todayArena = await getOrCreateDailyArena(student.studentProfileId, new Date());
    activeArenaId = todayArena.id;
  }

  let challengeTitle: string | undefined;
  let categoryLabel: string | undefined;
  let subjectName: string | undefined;
  let plannedMinutes = duration ? Number(duration) : 25;

  if (challengeId) {
    const challenge = await db.arenaChallenge.findFirst({
      where: { id: challengeId, studentProfileId: student.studentProfileId },
      include: {
        subjects: { include: { subject: true } },
      },
    });

    if (challenge) {
      challengeTitle = challenge.title;
      categoryLabel = challenge.category;
      plannedMinutes = challenge.durationMinutes;
      if (challenge.subjects.length > 0) {
        subjectName = challenge.subjects.map((s) => s.subject.name).join(', ');
      }
    }
  }

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <FocusEngine
        initialChallengeId={challengeId}
        initialArenaId={activeArenaId}
        initialDurationMinutes={plannedMinutes}
        challengeTitle={challengeTitle}
        categoryLabel={categoryLabel}
        subjectName={subjectName}
      />
    </StudentCornerShell>
  );
}
