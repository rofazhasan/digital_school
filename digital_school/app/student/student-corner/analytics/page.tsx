import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import {
  getHeatmapData,
  getStudentAnalyticsOverview,
  getPlanVsReality,
} from '@/features/student-corner/services/analytics-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { AnalyticsDashboard } from '@/features/student-corner/components/analytics/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Progress & Analytics — Student Corner',
  description: '365-day consistency heatmap, focus time breakdown, and plan vs reality estimation tracking.',
};

export default async function AnalyticsPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);
  const heatmapData = await getHeatmapData(student.studentProfileId);
  const overview = await getStudentAnalyticsOverview(student.studentProfileId);
  const planVsReality = await getPlanVsReality(student.studentProfileId, 14);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <AnalyticsDashboard
        heatmapData={heatmapData}
        overview={overview}
        streakInfo={streakInfo}
        planVsReality={planVsReality}
      />
    </StudentCornerShell>
  );
}
