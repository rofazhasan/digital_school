'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentCornerNav } from './StudentCornerNav';
import { QuickAddChallengeModal } from './QuickAddChallengeModal';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { CommandPaletteDialog } from './CommandPaletteDialog';

interface StudentCornerShellProps {
  children: React.ReactNode;
  currentStreak?: number;
  studentName?: string;
}

export function StudentCornerShell({
  children,
  currentStreak = 0,
  studentName,
}: StudentCornerShellProps) {
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if student is typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
      } else if (key === 'N') {
        e.preventDefault();
        setQuickAddOpen(true);
      } else if (key === 'F') {
        e.preventDefault();
        router.push('/student/student-corner/focus');
      } else if (key === 'T') {
        e.preventDefault();
        router.push('/student/student-corner/arena');
      } else if (key === 'P') {
        e.preventDefault();
        router.push('/student/student-corner/analytics');
      } else if (key === 'C') {
        e.preventDefault();
        router.push('/student/student-corner/calendar');
      } else if (key === 'E') {
        e.preventDefault();
        router.push('/student/student-corner/exams');
      } else if (key === 'R') {
        e.preventDefault();
        router.push('/student/student-corner/reflection');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-600">
      <StudentCornerNav currentStreak={currentStreak} studentName={studentName} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </main>

      <QuickAddChallengeModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
      <CommandPaletteDialog />
    </div>
  );
}
