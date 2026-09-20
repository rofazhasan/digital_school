'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const shortcuts = [
    { key: 'N', label: 'New Challenge', desc: 'Open quick challenge creator' },
    { key: 'F', label: 'Focus Mode', desc: 'Launch full-screen focus timer' },
    { key: 'T', label: 'Today', desc: 'Jump to today’s arena' },
    { key: 'P', label: 'Progress', desc: 'View 365-day consistency heatmap' },
    { key: 'C', label: 'Calendar', desc: 'Open planning calendar' },
    { key: 'E', label: 'Exams', desc: 'Check upcoming exam deadlines' },
    { key: 'R', label: 'Reflection', desc: 'Daily Quran Ayah & Hadith' },
    { key: '?', label: 'Help', desc: 'Show keyboard shortcuts' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Keyboard Shortcuts
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Navigate your daily student operating system with instant keypresses.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{s.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.desc}</p>
              </div>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-xs text-slate-700 dark:text-slate-300">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
