import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { getStudentAnalyticsOverview } from '@/features/student-corner/services/analytics-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { PrintableProgressReport } from '@/features/student-corner/components/import-export/PrintableProgressReport';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Export & Print Progress — Student Corner',
  description: 'Print-ready high-resolution progress reports for students, mentors, and guardians.',
};

export default async function ExportPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);
  const overview = await getStudentAnalyticsOverview(student.studentProfileId);

  // Fetch student profile details for official header
  const profile = await db.studentProfile.findUnique({
    where: { id: student.studentProfileId },
    include: {
      class: true,
    },
  });

  const categoryBreakdown = Object.entries(overview.categoryStats).map(([cat, stat]) => ({
    category: cat,
    count: stat.total,
    hours: Math.round((stat.minutes / 60) * 10) / 10,
    rate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
  }));

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <PrintableProgressReport
        studentName={student.name}
        registrationNo={profile?.registrationNo || 'STUDENT-CORNER'}
        className={profile?.class?.name || 'Academic Scholar'}
        completionRate={overview.overallCompletionRate}
        totalCompleted={overview.completedChallenges}
        totalMissed={overview.totalChallenges - overview.completedChallenges}
        totalPlanned={overview.totalChallenges}
        totalFocusHours={overview.totalFocusHours}
        categoryBreakdown={categoryBreakdown.length > 0 ? categoryBreakdown : undefined}
      />
    </StudentCornerShell>
  );
}
