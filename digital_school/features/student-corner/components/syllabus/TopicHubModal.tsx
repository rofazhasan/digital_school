'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Clock,
  Brain,
  AlertTriangle,
  BookOpen,
  Target,
  Play,
  Plus,
  CheckCircle2,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getTopicHubDetailsAction, quickAddTopicRevisionToArenaAction } from '../../actions/cross-feature-actions';
import { TopicHubDetails } from '../../services/cross-feature-service';

interface TopicHubModalProps {
  topicId: string | null;
  open: boolean;
  onClose: () => void;
}

export function TopicHubModal({ topicId, open, onClose }: TopicHubModalProps) {
  const router = useRouter();
  const [details, setDetails] = useState<TopicHubDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingToArena, setAddingToArena] = useState(false);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId || !open) {
      setDetails(null);
      return;
    }

    setLoading(true);
    getTopicHubDetailsAction(topicId)
      .then((res) => {
        if (res.success && res.details) {
          setDetails(res.details);
        }
      })
      .finally(() => setLoading(false));
  }, [topicId, open]);

  const handleAddToArena = async () => {
    if (!topicId) return;
    setAddingToArena(true);
    try {
      const res = await quickAddTopicRevisionToArenaAction(topicId);
      if (res.success) {
        setSuccessNote(`Chapter revision added to Today's Arena!`);
        router.refresh();
      }
    } catch {
      // fallback
    } finally {
      setAddingToArena(false);
      setTimeout(() => setSuccessNote(null), 3000);
    }
  };

  const handleStartFocus = () => {
    if (!details) return;
    onClose();
    router.push(`/student/student-corner/focus?topic=${encodeURIComponent(details.topic.name)}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Topic Knowledge Hub</span>
            </div>
            {details && (
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                {details.topic.subjectName}
              </span>
            )}
          </div>

          {details && (
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {details.topic.name}
            </DialogTitle>
          )}
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-indigo-500 animate-spin" />
            <p className="text-xs font-semibold">Connecting topic ecosystem...</p>
          </div>
        ) : details ? (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block">
                  Mastery Status
                </span>
                <span className="text-sm font-black text-indigo-700 dark:text-indigo-300 mt-1 block">
                  {details.topic.masteryStatus}
                </span>
                <span className="text-[10px] text-slate-500">
                  {details.topic.retentionRate}% retention
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block">
                  Study Time
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                  {Math.round((details.totalFocusMinutes / 60) * 10) / 10} hrs
                </span>
                <span className="text-[10px] text-slate-500">
                  {details.completedChallengesCount} sessions
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block">
                  Leitner Recall
                </span>
                <span className="text-sm font-black text-purple-700 dark:text-purple-300 mt-1 block">
                  Box {details.topic.leitnerBox} / 5
                </span>
                <span className="text-[10px] text-slate-500">
                  {details.revisions.dueCount} due today
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block">
                  Mistake Lab
                </span>
                <span className="text-sm font-black text-amber-700 dark:text-amber-300 mt-1 block">
                  {details.mistakes.unresolved} Unresolved
                </span>
                <span className="text-[10px] text-slate-500">
                  {details.mistakes.resolved} resolved
                </span>
              </div>
            </div>

            {/* Syllabus Coverage Details */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-2 text-xs">
              <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300 block">
                Syllabus Matrix Progress
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${details.topic.theoryCompleted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Theory: {details.topic.theoryCompleted ? 'Completed ✓' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${details.topic.qbSolved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Question Bank: {details.topic.qbSolved ? 'Solved ✓' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>Confidence: {details.topic.confidenceLevel} / 5 stars</span>
                </div>
              </div>
            </div>

            {/* Connected Mistakes Section */}
            {details.mistakes.items.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Connected Mistakes ({details.mistakes.items.length})</span>
                  </span>
                </div>
                <div className="space-y-1.5">
                  {details.mistakes.items.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          [{m.errorNumber}] {m.fallacyCategory.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Remedial Rule: "{m.remedialRule}"
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          m.isResolved
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {m.isResolved ? 'Resolved' : 'Needs Retest'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Exam Relevance */}
            {details.upcomingExams.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 text-xs">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Appears in Upcoming Exam</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {details.upcomingExams[0].title} is scheduled in{' '}
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {details.upcomingExams[0].daysRemaining} days
                  </span>
                  .
                </p>
              </div>
            )}

            {successNote && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                ✓ {successNote}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-xl text-xs font-bold"
              >
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToArena}
                disabled={addingToArena}
                className="rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Arena</span>
              </Button>
              <Button
                size="sm"
                onClick={handleStartFocus}
                className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Study Timer</span>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
