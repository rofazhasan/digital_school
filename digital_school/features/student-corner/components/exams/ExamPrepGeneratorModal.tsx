'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckSquare,
  Square,
  Sparkles,
  Loader2,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateExamPrepTasksAction } from '../../actions/cross-feature-actions';

interface ExamPrepGeneratorModalProps {
  exam: {
    id: string;
    title: string;
    subject: string;
    daysRemaining: number;
  } | null;
  availableTopics: Array<{
    id: string;
    name: string;
    confidenceLevel: number;
    masteryStatus: string;
    hasMistakes?: boolean;
  }>;
  open: boolean;
  onClose: () => void;
}

export function ExamPrepGeneratorModal({
  exam,
  availableTopics,
  open,
  onClose,
}: ExamPrepGeneratorModalProps) {
  const router = useRouter();
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(() =>
    availableTopics.filter((t) => t.confidenceLevel <= 3).slice(0, 3).map((t) => t.id)
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!exam) return null;

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedTopicIds.length === 0) return;
    setLoading(true);
    try {
      const res = await generateExamPrepTasksAction(exam.id, selectedTopicIds);
      if (res.success) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => {
          onClose();
          router.push('/student/student-corner/arena');
        }, 1200);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50/40 dark:bg-rose-950/20">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Targeted Exam Preparation</span>
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-white mt-1">
            Prepare for {exam.title} ({exam.subject})
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Exam scheduled in {exam.daysRemaining} days. Select topics to generate high-yield preparation missions for Today's Arena.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {availableTopics.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No syllabus topics currently registered for {exam.subject}.
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Select High-Yield Chapters to Revise ({selectedTopicIds.length} selected)
              </span>

              <div className="space-y-1.5">
                {availableTopics.map((topic) => {
                  const isSelected = selectedTopicIds.includes(topic.id);
                  const isWeak = topic.confidenceLevel <= 2;

                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {topic.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Confidence: {topic.confidenceLevel}/5 • Status: {topic.masteryStatus}
                          </span>
                        </div>
                      </div>

                      {isWeak && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Needs Work</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Exam preparation tasks created! Redirecting to Arena...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={loading || selectedTopicIds.length === 0 || success}
            className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Inject {selectedTopicIds.length} Task{selectedTopicIds.length !== 1 ? 's' : ''} into Arena</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
