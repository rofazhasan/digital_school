'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Compass,
  Flame,
  Target,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  Settings,
  Download,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface CommandPaletteItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Focus' | 'Exams';
  icon: any;
  href?: string;
  onSelect?: () => void;
  keywords?: string;
}

export function CommandPaletteDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Command palette items list
  const items: CommandPaletteItem[] = useMemo(
    () => [
      {
        id: 'nav-arena',
        title: "Go to Today's Arena",
        category: 'Navigation',
        icon: Compass,
        href: '/student/student-corner/arena',
        keywords: 'arena today challenge plan task',
      },
      {
        id: 'nav-focus',
        title: 'Launch Focus Mode',
        category: 'Focus',
        icon: Target,
        href: '/student/student-corner/focus',
        keywords: 'focus timer pomodoro study countdown',
      },
      {
        id: 'nav-cast',
        title: 'Launch Cast Display Mode',
        category: 'Focus',
        icon: Sparkles,
        href: '/student/student-corner/focus/display',
        keywords: 'cast display projector tv second screen monitor',
      },
      {
        id: 'nav-calendar',
        title: 'Planning Calendar & Routines',
        category: 'Navigation',
        icon: Calendar,
        href: '/student/student-corner/calendar',
        keywords: 'calendar routine schedule month week',
      },
      {
        id: 'nav-analytics',
        title: '365-Day Consistency Heatmap & Analytics',
        category: 'Navigation',
        icon: TrendingUp,
        href: '/student/student-corner/analytics',
        keywords: 'analytics heatmap progress streak consistency review',
      },
      {
        id: 'nav-exams',
        title: 'Exam Awareness & Routine',
        category: 'Exams',
        icon: BookOpen,
        href: '/student/student-corner/exams',
        keywords: 'exam test countdown schedule routine hall',
      },
      {
        id: 'nav-goals',
        title: 'Goals & Semester Milestones',
        category: 'Navigation',
        icon: Target,
        href: '/student/student-corner/goals',
        keywords: 'goal milestone semester weekly habit',
      },
      {
        id: 'nav-reflection',
        title: 'Daily Islamic Reflection (Quran & Hadith)',
        category: 'Navigation',
        icon: BookOpen,
        href: '/student/student-corner/reflection',
        keywords: 'reflection quran hadith islamic ayah dua prayer',
      },
      {
        id: 'nav-export',
        title: 'Print Progress Report',
        category: 'Actions',
        icon: Download,
        href: '/student/student-corner/export',
        keywords: 'print export pdf report progress',
      },
      {
        id: 'nav-settings',
        title: 'Student Corner Settings',
        category: 'Navigation',
        icon: Settings,
        href: '/student/student-corner/settings',
        keywords: 'settings timezone sound notification mode privacy',
      },
    ],
    []
  );

  // Global keyboard shortcut listener (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in form inputs, unless holding Cmd/Ctrl
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
      } else if (!isInput && e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        // Quick shortcut 'F' for focus
        e.preventDefault();
        router.push('/student/student-corner/focus');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Filter items based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords?.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: CommandPaletteItem) => {
    setIsOpen(false);
    if (item.href) {
      router.push(item.href);
    } else if (item.onSelect) {
      item.onSelect();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search student corner..."
            className="w-full bg-transparent text-sm sm:text-base font-medium outline-hidden placeholder:text-slate-400 text-slate-900 dark:text-white"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands or destinations found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with ↑ ↓ and Enter</span>
          <span className="font-mono">Cmd / Ctrl + K</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
