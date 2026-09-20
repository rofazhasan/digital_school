import React from 'react';
import { requireStudentAuth } from '@/features/student-corner/actions/auth-helper';
import { getOrCreateDailyArena, getArenaDueItemsAndExamDay } from '@/features/student-corner/services/arena-service';
import { calculateStudentStreaks } from '@/features/student-corner/services/streak-service';
import { getUpcomingExams } from '@/features/student-corner/services/exam-service';
import { calculateTodayScore } from '@/features/student-corner/services/analytics-service';
import { getNextBestActions } from '@/features/student-corner/services/cross-feature-service';
import { getStudentGoals } from '@/features/student-corner/services/goal-service';
import { getFullSpiritualPackage } from '@/features/student-corner/services/ummah-api-service';
import { StudentCornerShell } from '@/features/student-corner/components/shell/StudentCornerShell';
import { TodayArenaView } from '@/features/student-corner/components/arena/TodayArenaView';
import { ReflectionCard } from '@/features/student-corner/components/reflection/ReflectionCard';
import { NextBestActionCard } from '@/features/student-corner/components/home/NextBestActionCard';
import { EcosystemStatusRibbon } from '@/features/student-corner/components/home/EcosystemStatusRibbon';
import Link from 'next/link';
import { BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDayOfYear, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Student Corner — Unified Learning OS & Personal Arena',
  description: 'Connected student ecosystem: Daily Arena, Focus Timer, Spaced Revision, Mistake Lab, and Exam Preparation.',
};

export default async function StudentCornerHomePage() {
  const student = await requireStudentAuth();
  const [arena, streakInfo, todayScore, upcomingExams, dueItemsAndExam, nextBestActions, goals] = await Promise.all([
    getOrCreateDailyArena(student.studentProfileId, new Date()),
    calculateStudentStreaks(student.studentProfileId),
    calculateTodayScore(student.studentProfileId),
    getUpcomingExams(student.studentProfileId),
    getArenaDueItemsAndExamDay(student.studentProfileId),
    getNextBestActions(student.studentProfileId),
    getStudentGoals(student.studentProfileId),
  ]);

  const dayOfYear = getDayOfYear(new Date());
  const spiritualPackage = await getFullSpiritualPackage(dayOfYear);

  const nextExam = upcomingExams[0];
  const activeChallenges = arena.challenges.filter((c: any) => !c.isArchived);
  const completedCount = activeChallenges.filter((c: any) => c.status === 'COMPLETED').length;
  const arenaCompletionRate = activeChallenges.length > 0 ? Math.round((completedCount / activeChallenges.length) * 100) : 0;

  return (
    <StudentCornerShell
      currentStreak={streakInfo.currentStreak}
      studentName={student.name}
    >
      <div className="space-y-6">
        {/* Next Best Action - Intelligent Real-Time Recommendation */}
        <NextBestActionCard actions={nextBestActions} />

        {/* Interconnected Ecosystem Vitals Ribbon */}
        <EcosystemStatusRibbon
          nextExam={nextExam ? { title: nextExam.title, subject: nextExam.subject, daysRemaining: nextExam.daysRemaining } : null}
          dueRevisionsCount={dueItemsAndExam.dueRevisions.length}
          dueMistakesCount={dueItemsAndExam.dueMistakes.length}
          goalsCount={goals.length}
          arenaCompletionRate={arenaCompletionRate}
          currentStreak={streakInfo.currentStreak}
        />

        {/* Centerpiece: Today's Arena with TodayScore & Daily Timeline */}
        <TodayArenaView
          initialArena={arena as any}
          studentName={student.name}
          currentStreak={streakInfo.currentStreak}
          scoreDetails={todayScore}
          dueRevisions={dueItemsAndExam.dueRevisions}
          dueMistakes={dueItemsAndExam.dueMistakes}
          isExamDay={dueItemsAndExam.isExamDay}
          examTodayTitle={dueItemsAndExam.examTodayTitle}
        />

        {/* Bottom Dual Grid: Islamic Reflection & Focus Cast Hub */}
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
            {/* Focus Cast Display Card */}
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

            {/* Print Progress & Milestone Reports Card */}
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
