import React from 'react';
import db from '@/lib/db';
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
  const [streakInfo, exams, topics] = await Promise.all([
    calculateStudentStreaks(student.studentProfileId),
    getUpcomingExams(student.studentProfileId),
    db.studentCornerTopic.findMany({
      where: { subject: { studentProfileId: student.studentProfileId } },
      select: {
        id: true,
        name: true,
        confidenceLevel: true,
        masteryStatus: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <ExamAwarenessView initialExams={exams} availableTopics={topics} />
    </StudentCornerShell>
  );
}
