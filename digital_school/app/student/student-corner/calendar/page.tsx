import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { CalendarPlanningView } from '@/features/student-corner/components/calendar/CalendarPlanningView';
import db from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, addMonths, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Planning Calendar — Student Corner',
  description: 'Plan daily, weekly, and monthly challenge routines with workload balance warnings.',
};

export default async function CalendarPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  // Fetch planned arenas for the 3-month window
  const start = startOfMonth(subMonths(new Date(), 1));
  const end = endOfMonth(addMonths(new Date(), 1));

  const arenas = await db.dailyArena.findMany({
    where: {
      studentProfileId: student.studentProfileId,
      date: { gte: start, lte: end },
    },
    select: {
      date: true,
      totalCount: true,
      completedCount: true,
      totalPlannedMinutes: true,
    },
  });

  const summaries = arenas.map((a) => ({
    date: format(new Date(a.date), 'yyyy-MM-dd'),
    count: a.totalCount,
    totalPlannedMinutes: a.totalPlannedMinutes,
    completedCount: a.completedCount,
  }));

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <CalendarPlanningView initialSummaries={summaries} />
    </StudentCornerShell>
  );
}
