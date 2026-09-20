import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { SyllabusMatrixView } from '@/features/student-corner/components/syllabus/SyllabusMatrixView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Subject Syllabus Matrix — Student Corner',
  description: 'Track chapter completion, question bank practice, Leitner boxes, and confidence levels.',
};

export default async function SyllabusPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <SyllabusMatrixView />
    </StudentCornerShell>
  );
}
