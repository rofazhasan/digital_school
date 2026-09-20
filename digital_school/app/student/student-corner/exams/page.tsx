import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { getUpcomingExams } from '@/features/student-corner/services/exam-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { ExamAwarenessView } from '@/features/student-corner/components/exams/ExamAwarenessView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Exam Awareness — Student Corner',
  description: 'Upcoming school LMS examinations and student personal exams with live countdowns.',
};

export default async function ExamsPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);
  const exams = await getUpcomingExams(student.studentProfileId);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <ExamAwarenessView initialExams={exams} />
    </StudentCornerShell>
  );
}
