import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { getOrCreateDailyArena } from '@/features/student-corner/services/arena-service';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { getUpcomingExams } from '@/features/student-corner/services/exam-service';
import { calculateTodayScore } from '@/features/student-corner/services/analytics-service';
import { getFullSpiritualPackage } from '@/features/student-corner/services/ummah-api-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { TodayArenaView } from '@/features/student-corner/components/arena/TodayArenaView';
import { ReflectionCard } from '@/features/student-corner/components/reflection/ReflectionCard';
import Link from 'next/link';
import { BookOpen, Flame, ArrowRight, Target, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDayOfYear, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Student Corner — Personal Daily Arena & Focus OS',
  description: 'Manage daily challenges, strict focus countdown, Islamic reflection, and exam milestones.',
};

export default async function StudentCornerHomePage() {
  const student = await requireStudentAuth();
  const arena = await getOrCreateDailyArena(student.studentProfileId, new Date());
  const streakInfo = await calculateStudentStreaks(student.studentProfileId);
  const todayScore = await calculateTodayScore(student.studentProfileId);
  const upcomingExams = await getUpcomingExams(student.studentProfileId);

  const dayOfYear = getDayOfYear(new Date());
  const spiritualPackage = await getFullSpiritualPackage(dayOfYear);

  const nextExam = upcomingExams[0];

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <div className="space-y-8">
        {/* Next Exam Awareness Banner if any */}
        {nextExam && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-indigo-950 dark:text-indigo-200 block">
                  Upcoming Exam: {nextExam.title} ({nextExam.subject})
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {format(new Date(nextExam.examDate), 'EEEE, MMMM d')} • {nextExam.daysRemaining === 0 ? 'TODAY' : `${nextExam.daysRemaining} days remaining`}
                </span>
              </div>
            </div>

            <Link
              href="/student/student-corner/exams"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
            >
              <span>View Exam Routine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Centerpiece: Today's Arena with TodayScore & Timeline */}
        <TodayArenaView
          initialArena={arena as any}
          studentName={student.name}
          currentStreak={streakInfo.currentStreak}
          scoreDetails={todayScore}
        />

        {/* Bottom Dual Grid: Islamic Reflection & Quick Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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

          <div className="space-y-4">
            {/* Focus Cast Display Promo */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-slate-900 to-indigo-950 text-white shadow-md">
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Cast Display Mode</span>
              </div>
              <h3 className="text-lg font-black leading-snug">
                Study with Zero Distractions
              </h3>
              <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
                Project your countdown timer onto a TV or monitor with ambient daily progress metrics.
              </p>
              <Link href="/student/student-corner/focus/display">
                <Button className="w-full rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100">
                  Launch Cast Mode
                </Button>
              </Link>
            </div>

            {/* Print Progress & Milestone Reports Promo */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Progress & Consistency Reports
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Export formal high-resolution reports of your focus hours and challenge completion for review.
              </p>
              <Link href="/student/student-corner/export">
                <Button variant="outline" className="w-full rounded-xl text-xs font-bold">
                  Print Progress Report
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StudentCornerShell>
  );
}
