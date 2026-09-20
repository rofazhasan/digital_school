import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { getOrCreateDailyArena } from '@/features/student-corner/services/arena-service';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { TodayArenaView } from '@/features/student-corner/components/arena/TodayArenaView';

interface ArenaPageProps {
  searchParams: Promise<{ date?: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Arena — Student Corner',
  description: 'Manage and execute daily challenges with Strict and Locked commitment modes.',
};

export default async function ArenaPage({ searchParams }: ArenaPageProps) {
  const { date } = await searchParams;
  const student = await requireStudentAuth();
  const arena = await getOrCreateDailyArena(student.studentProfileId, date || new Date());
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <TodayArenaView
        initialArena={arena as any}
        studentName={student.name}
        currentStreak={streakInfo.currentStreak}
      />
    </StudentCornerShell>
  );
}
