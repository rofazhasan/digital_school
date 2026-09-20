'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Flame,
  Target,
  Sparkles,
  Calendar,
  BarChart3,
  BookOpen,
  FileDown,
  Upload,
  Settings,
  Tv,
  Plus,
  ArrowLeft,
  Keyboard,
  Menu,
  X,
  Compass,
  Award,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickAddChallengeModal } from './QuickAddChallengeModal';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { StreakDetailsModal } from '../arena/StreakDetailsModal';
import { getDetailedStreakHistoryAction } from '../../actions/analytics-actions';
import { StreakHistoryDetails } from '../../types';

interface StudentCornerNavProps {
  currentStreak?: number;
  studentName?: string;
}

export function StudentCornerNav({ currentStreak = 0, studentName }: StudentCornerNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [streakDetails, setStreakDetails] = useState<StreakHistoryDetails | null>(null);

  const navItems = [
    { label: 'Today', href: '/student/student-corner', icon: Sparkles },
    { label: 'My Arena', href: '/student/student-corner/arena', icon: Target },
    { label: 'Focus', href: '/student/student-corner/focus', icon: Flame },
    { label: 'Goals', href: '/student/student-corner/goals', icon: Award },
    { label: 'Calendar', href: '/student/student-corner/calendar', icon: Calendar },
    { label: 'Analytics', href: '/student/student-corner/analytics', icon: BarChart3 },
    { label: 'Exams', href: '/student/student-corner/exams', icon: BookOpen },
    { label: 'Reflection', href: '/student/student-corner/reflection', icon: Compass },
    { label: 'Export', href: '/student/student-corner/export', icon: FileDown },
    { label: 'Import', href: '/student/student-corner/import', icon: Upload },
    { label: 'Settings', href: '/student/student-corner/settings', icon: Settings },
  ];

  const handleOpenStreakDetails = async () => {
    setStreakModalOpen(true);
    if (!streakDetails) {
      const res = await getDetailedStreakHistoryAction();
      if (res.success && res.streakHistory) {
        setStreakDetails(res.streakHistory);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand and Back Button */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/student/dashboard')}
                title="Back to Student Dashboard"
                className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <Link href="/student/student-corner" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block leading-none">
                    Student Corner
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                    Personal OS
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-900/70 p-1.5 rounded-full border border-slate-200/70 dark:border-slate-800/70">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Actions & Streak */}
            <div className="flex items-center gap-2.5">
              {/* Interactive Streak Badge */}
              <button
                type="button"
                onClick={handleOpenStreakDetails}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Click to view streak breakdown, milestones & grace status"
              >
                <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{currentStreak}d Streak</span>
              </button>

              {/* Cast Display Shortcut */}
              <Link
                href="/student/student-corner/focus/display"
                title="Open Focus Cast Display (TV / Monitor mode)"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                <Tv className="h-3.5 w-3.5 text-cyan-500" />
                <span className="hidden md:inline">Cast Mode</span>
              </Link>

              {/* Quick Add Button */}
              <Button
                size="sm"
                onClick={() => setQuickAddOpen(true)}
                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Challenge</span>
              </Button>

              {/* Shortcuts Help */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShortcutsOpen(true)}
                title="Keyboard Shortcuts (Press ? or Cmd+K)"
                className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hidden lg:flex"
              >
                <Keyboard className="h-4 w-4" />
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden h-9 w-9 rounded-xl text-slate-600 dark:text-slate-300"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Modals */}
      <QuickAddChallengeModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
      {streakDetails && (
        <StreakDetailsModal
          open={streakModalOpen}
          onOpenChange={setStreakModalOpen}
          streakDetails={streakDetails}
        />
      )}
    </>
  );
}
