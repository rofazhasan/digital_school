import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { BulkImportWizard } from '@/features/student-corner/components/import-export/BulkImportWizard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Bulk Excel Import — Student Corner',
  description: 'Import schedules and study plans in bulk using standardized Excel spreadsheets.',
};

export default async function ImportPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Batch Challenge Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Bulk Import Challenges from Excel
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Create month-long routines or exam sprint schedules using our standard Excel spreadsheet template.
          </p>
        </div>

        <BulkImportWizard />
      </div>
    </StudentCornerShell>
  );
}
