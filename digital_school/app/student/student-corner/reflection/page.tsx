import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { getFullSpiritualPackage } from '@/features/student-corner/services/ummah-api-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { ReflectionCard } from '@/features/student-corner/components/reflection/ReflectionCard';
import { getDayOfYear } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Daily Reflection — Student Corner',
  description: 'Daily Quran Ayah, authentic Hadith reflections, 99 Names of Allah, and prayer times via UmmahAPI.',
};

export default async function ReflectionPage() {
  const student = await requireStudentAuth();
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);

  const dayOfYear = getDayOfYear(new Date());
  const spiritualPackage = await getFullSpiritualPackage(dayOfYear);

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Islamic Tadabbur & Spiritual Grounding
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Daily Quran & Hadith Reflection
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Begin and end each study day with intentional reflection, authentic dhikr, and gratitude.
          </p>
        </div>

        <ReflectionCard
          quran={spiritualPackage.quran}
          hadith={spiritualPackage.hadith}
          dayNumber={dayOfYear}
          hijriDate={spiritualPackage.hijriDate}
          asmaUlHusna={spiritualPackage.asmaUlHusna}
          dua={spiritualPackage.dua}
          prayerTimes={spiritualPackage.prayerTimes}
        />
      </div>
    </StudentCornerShell>
  );
}
