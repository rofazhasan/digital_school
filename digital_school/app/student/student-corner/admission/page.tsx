import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { AdmissionTargetsView } from '@/features/student-corner/components/admission/AdmissionTargetsView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Target Universities & Admission Blueprint — Student Corner',
  description: 'Admission target benchmarks, historical safe cutoffs, and application milestones for top universities.',
};

export default async function AdmissionPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <AdmissionTargetsView />
    </StudentCornerShell>
  );
}
