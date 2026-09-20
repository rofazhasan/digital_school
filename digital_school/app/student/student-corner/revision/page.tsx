import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { RevisionDashboard } from '@/features/student-corner/components/revision/RevisionDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Spaced Repetition & Active Recall — Student Corner',
  description: 'Leitner 5-Box revision engine with Feynman, Blurting, and Flashcard protocols.',
};

export default async function RevisionPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <RevisionDashboard />
    </StudentCornerShell>
  );
}
