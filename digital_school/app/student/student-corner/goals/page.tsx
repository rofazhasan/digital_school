import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { getStudentGoals } from '@/features/student-corner/services/goal-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { GoalsManagerView } from '@/features/student-corner/components/goals/GoalsManagerView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Goals & Milestones — Student Corner',
  description: 'Track long-term academic targets, milestone celebrations, and progress metrics.',
};

export default async function GoalsPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);
  const goals = await getStudentGoals(student.studentProfileId);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <GoalsManagerView initialGoals={goals} />
    </StudentCornerShell>
  );
}
