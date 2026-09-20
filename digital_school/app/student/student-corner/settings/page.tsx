import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { StudentCornerSettingsView } from '@/features/student-corner/components/settings/StudentCornerSettingsView';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Settings — Student Corner',
  description: 'Manage Student Corner preferences, timezone, discipline modes, and category preferences.',
};

export default async function SettingsPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  const profile = await db.studentCornerProfile.findUnique({
    where: { studentProfileId: student.studentProfileId },
  });

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <StudentCornerSettingsView initialSettings={profile} />
    </StudentCornerShell>
  );
}
