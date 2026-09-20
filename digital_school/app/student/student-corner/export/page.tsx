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
  let profile = null;
  try {
    profile = await db.studentProfile.findUnique({
      where: { id: student.studentProfileId },
      include: {
        class: true,
      },
    });
  } catch (err) {
    console.error('Failed to load student profile for export:', err);
  }

  const categoryBreakdown = (overview.categoryBreakdown || []).map((item) => ({
    category: item.category,
    count: item.totalChallenges,
    hours: item.focusedHours,
    rate: item.completionRate,
  }));

  const totalChallenges = overview.totalChallenges || 0;
  const completedChallenges = overview.completedChallenges || 0;
  const missedChallenges = Math.max(0, totalChallenges - completedChallenges);
  const focusHours = overview.totalCompletedFocusHours ?? 0;

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <PrintableProgressReport
        studentName={student.name}
        registrationNo={profile?.registrationNo || 'STUDENT-CORNER'}
        className={profile?.class?.name || 'Academic Scholar'}
        completionRate={overview.overallCompletionRate ?? 0}
        totalCompleted={completedChallenges}
        totalMissed={missedChallenges}
        totalPlanned={totalChallenges}
        totalFocusHours={focusHours}
        categoryBreakdown={categoryBreakdown.length > 0 ? categoryBreakdown : undefined}
      />
    </StudentCornerShell>
  );
}
