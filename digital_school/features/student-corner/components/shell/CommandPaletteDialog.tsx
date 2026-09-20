'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Compass,
  Target,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  Settings,
  Download,
  ArrowRight,
  Brain,
  AlertTriangle,
  Award,
  Layers,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { crossFeatureSearchAction } from '../../actions/cross-feature-actions';
import { CrossFeatureSearchResult } from '../../services/cross-feature-service';

interface CommandPaletteItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Focus' | 'Exams' | 'Topics' | 'Mistakes' | 'Revision' | 'Goals';
  icon: any;
  href?: string;
  subtitle?: string;
  onSelect?: () => void;
  keywords?: string;
}

export function CommandPaletteDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dynamicResults, setDynamicResults] = useState<CrossFeatureSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Static navigation command items
  const staticItems: CommandPaletteItem[] = useMemo(
    () => [
      {
        id: 'nav-today',
        title: "Today's Orchestrator Overview",
        category: 'Navigation',
        icon: Sparkles,
        href: '/student/student-corner',
        keywords: 'home overview today dashboard mission',
      },
      {
        id: 'nav-arena',
        title: "Go to Today's Arena",
        category: 'Navigation',
        icon: Compass,
        href: '/student/student-corner/arena',
        keywords: 'arena today challenge plan task execute',
      },
      {
        id: 'nav-focus',
        title: 'Launch Focus Timer',
        category: 'Focus',
        icon: Target,
        href: '/student/student-corner/focus',
        keywords: 'focus timer pomodoro study countdown',
      },
      {
        id: 'nav-cast',
        title: 'Launch Big Screen Cast Mode',
        category: 'Focus',
        icon: Sparkles,
        href: '/student/student-corner/focus/display',
        keywords: 'cast display projector tv second screen monitor ambient',
      },
      {
        id: 'nav-revision',
        title: 'Spaced Repetition & Leitner Vault',
        category: 'Navigation',
        icon: Brain,
        href: '/student/student-corner/revision',
        keywords: 'revision spaced repetition recall leitner ebbinghaus feynman',
      },
      {
        id: 'nav-syllabus',
        title: 'Subject Syllabus & Topic Matrix',
        category: 'Navigation',
        icon: Layers,
        href: '/student/student-corner/syllabus',
        keywords: 'syllabus subjects chapters topics paper matrix physics chemistry math',
      },
      {
        id: 'nav-mistakes',
        title: 'Mistake & Fallacy Diary Lab',
        category: 'Navigation',
        icon: AlertTriangle,
        href: '/student/student-corner/mistakes',
        keywords: 'mistake fallacy error diary retest calculation formula',
      },
      {
        id: 'nav-exams',
        title: 'Exams & Milestone Routine',
        category: 'Exams',
        icon: BookOpen,
        href: '/student/student-corner/exams',
        keywords: 'exam test countdown schedule routine hall admission',
      },
      {
        id: 'nav-goals',
        title: 'Goals & Target Benchmarks',
        category: 'Navigation',
        icon: Award,
        href: '/student/student-corner/goals',
        keywords: 'goal milestone semester weekly habit target',
      },
      {
        id: 'nav-calendar',
        title: 'Planning Calendar & Daily Timeline',
        category: 'Navigation',
        icon: Calendar,
        href: '/student/student-corner/calendar',
        keywords: 'calendar routine schedule month week timeline salat',
      },
      {
        id: 'nav-analytics',
        title: 'Consistency Heatmap & Analytics',
        category: 'Navigation',
        icon: TrendingUp,
        href: '/student/student-corner/analytics',
        keywords: 'analytics heatmap progress streak consistency review report',
      },
      {
        id: 'nav-reflection',
        title: 'Daily Islamic Reflection (Quran & Hadith)',
        category: 'Navigation',
        icon: BookOpen,
        href: '/student/student-corner/reflection',
        keywords: 'reflection quran hadith islamic ayah dua prayer salat',
      },
      {
        id: 'nav-export',
        title: 'Print Formal Progress Report',
        category: 'Actions',
        icon: Download,
        href: '/student/student-corner/export',
        keywords: 'print export pdf report progress certificate',
      },
      {
        id: 'nav-settings',
        title: 'Student Corner Settings',
        category: 'Navigation',
        icon: Settings,
        href: '/student/student-corner/settings',
        keywords: 'settings timezone sound notification mode privacy cleanup',
      },
    ],
    []
  );

  // Global keyboard shortcut listener (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setDynamicResults(null);
      } else if (!isInput && e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push('/student/student-corner/focus');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Live multi-domain search debouncing
  useEffect(() => {
    if (!query.trim()) {
      setDynamicResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await crossFeatureSearchAction(query);
        if (res.success && res.results) {
          setDynamicResults(res.results);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Merge static matches with dynamic domain matches
  const allItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    const staticMatches = q
      ? staticItems.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.keywords?.toLowerCase().includes(q)
        )
      : staticItems;

    const dynamicItems: CommandPaletteItem[] = [];

    if (dynamicResults) {
      for (const top of dynamicResults.topics) {
        dynamicItems.push({
          id: `dyn-top-${top.id}`,
          title: top.name,
          subtitle: `${top.subjectName} • Status: ${top.masteryStatus}`,
          category: 'Topics',
          icon: Layers,
          href: top.url,
        });
      }

      for (const rev of dynamicResults.revisions) {
        dynamicItems.push({
          id: `dyn-rev-${rev.id}`,
          title: rev.title,
          subtitle: `Leitner Box ${rev.leitnerBox} • ${rev.vaultCategory}`,
          category: 'Revision',
          icon: Brain,
          href: rev.url,
        });
      }

      for (const mis of dynamicResults.mistakes) {
        dynamicItems.push({
          id: `dyn-mis-${mis.id}`,
          title: `[${mis.errorNumber}] ${mis.subjectName}`,
          subtitle: `${mis.fallacyCategory.replace(/_/g, ' ')} • ${mis.isResolved ? 'Resolved ✓' : 'Retest Due'}`,
          category: 'Mistakes',
          icon: AlertTriangle,
          href: mis.url,
        });
      }

      for (const ex of dynamicResults.exams) {
        dynamicItems.push({
          id: `dyn-ex-${ex.id}`,
          title: ex.title,
          subtitle: `${ex.subject} • Date: ${new Date(ex.examDate).toLocaleDateString()}`,
          category: 'Exams',
          icon: BookOpen,
          href: ex.url,
        });
      }

      for (const g of dynamicResults.goals) {
        dynamicItems.push({
          id: `dyn-goal-${g.id}`,
          title: g.title,
          subtitle: `${g.currentValue} / ${g.targetValue} ${g.unit}`,
          category: 'Goals',
          icon: Award,
          href: g.url,
        });
      }
    }

    return [...dynamicItems, ...staticMatches];
  }, [staticItems, dynamicResults, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [allItems.length]);

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
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(allItems[selectedIndex]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search topics, mistakes, revisions, exams, goals, or commands..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold outline-hidden placeholder:text-slate-400 text-slate-900 dark:text-white"
            autoFocus
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands or connected records found.
            </div>
          ) : (
            allItems.map((item, idx) => {
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
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-bold truncate block">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span
                          className={`text-[10px] truncate block ${
                            isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </span>
                      )}
                    </div>
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
