'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Brain,
  AlertTriangle,
  Award,
  Target,
  Layers,
  ArrowRight,
  X,
  Loader2,
  Command,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { crossFeatureSearchAction } from '../../actions/cross-feature-actions';
import { CrossFeatureSearchResult } from '../../services/cross-feature-service';

export function CrossFeatureCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CrossFeatureSearchResult | null>(null);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await crossFeatureSearchAction(query);
        if (res.success && res.results) {
          setResults(res.results);
        }
      } catch {
        // silent fallback
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    router.push(url);
  };

  const hasResults =
    results &&
    (results.topics.length > 0 ||
      results.revisions.length > 0 ||
      results.mistakes.length > 0 ||
      results.exams.length > 0 ||
      results.goals.length > 0 ||
      results.arenaChallenges.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Student Corner</DialogTitle>
        </DialogHeader>

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, mistakes, revision items, exams, goals, or tasks..."
            className="w-full bg-transparent text-sm font-semibold placeholder:text-slate-400 focus:outline-hidden text-slate-900 dark:text-white"
            autoFocus
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              <Command className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Type anything to search the entire Student Corner
              </p>
              <p className="text-[11px] mt-1 text-slate-400">
                Search topics (e.g. "Mechanics"), mistakes (e.g. "Integration"), revision formulas, or upcoming exams.
              </p>
            </div>
          )}

          {query && !loading && !hasResults && (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {/* 1. Topics */}
          {results && results.topics.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2">
                <Layers className="w-3 h-3" />
                <span>Syllabus Topics</span>
              </div>
              <div className="space-y-1">
                {results.topics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left group"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {t.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {t.subjectName} • Status: {t.masteryStatus}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Spaced Revision */}
          {results && results.revisions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-2">
                <Brain className="w-3 h-3" />
                <span>Spaced Revision Items</span>
              </div>
              <div className="space-y-1">
                {results.revisions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left group"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {r.title}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        Box {r.leitnerBox} • {r.vaultCategory}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Mistake Records */}
          {results && results.mistakes.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2">
                <AlertTriangle className="w-3 h-3" />
                <span>Mistake Diary</span>
              </div>
              <div className="space-y-1">
                {results.mistakes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left group"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        [{m.errorNumber}] {m.subjectName}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {m.fallacyCategory.replace(/_/g, ' ')} • {m.isResolved ? 'Resolved ✓' : 'Pending Retest'}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Exams */}
          {results && results.exams.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-2">
                <BookOpen className="w-3 h-3" />
                <span>Exams</span>
              </div>
              <div className="space-y-1">
                {results.exams.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => handleSelect(e.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left group"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {e.title} ({e.subject})
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        Scheduled: {new Date(e.examDate).toLocaleDateString()}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Goals */}
          {results && results.goals.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 px-2">
                <Award className="w-3 h-3" />
                <span>Goals</span>
              </div>
              <div className="space-y-1">
                {results.goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSelect(g.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left group"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {g.title}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {g.currentValue} / {g.targetValue} {g.unit}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. Arena Challenges */}
          {results && results.arenaChallenges.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2">
                <Target className="w-3 h-3" />
                <span>Arena Challenges</span>
              </div>
              <div className="space-y-1">
                {results.arenaChallenges.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left group"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {c.title}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {c.category} • Status: {c.status}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
