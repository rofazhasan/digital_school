import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { MistakeLabView } from '@/features/student-corner/components/mistakes/MistakeLabView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mistake Lab & Fallacy Diary — Student Corner',
  description: 'Track exam errors, analyze cognitive fallacies, and execute remedial retests in Today\'s Arena.',
};

export default async function MistakeLabPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <MistakeLabView />
    </StudentCornerShell>
  );
}
