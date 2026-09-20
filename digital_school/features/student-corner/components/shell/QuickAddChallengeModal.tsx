'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChallengeCategory, ChallengePriority } from '@prisma/client';
import { CATEGORY_METADATA } from '../../types/categories';
import { createChallengeAction } from '../../actions/arena-actions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Sparkles, Clock, Target } from 'lucide-react';

interface QuickAddChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  onSuccess?: () => void;
}

export function QuickAddChallengeModal({
  open,
  onOpenChange,
  defaultDate,
  onSuccess,
}: QuickAddChallengeModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChallengeCategory>(ChallengeCategory.STUDY);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [scheduledTime, setScheduledTime] = useState('');
  const [priority, setPriority] = useState<ChallengePriority>(ChallengePriority.MEDIUM);
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a challenge title');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createChallengeAction({
        date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
        title: title.trim(),
        category,
        durationMinutes: Number(durationMinutes) || 30,
        scheduledTime: scheduledTime || undefined,
        priority,
        subjectNames: subject.trim() ? [subject.trim()] : undefined,
      });

      if (res.success) {
        toast.success('Challenge created for your arena!');
        setTitle('');
        setSubject('');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(res.error || 'Failed to create challenge');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Quick Add Challenge
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Add a high-priority goal to today’s arena. You can start focus mode instantly after creating.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Challenge Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Calculus Integration Drill, LeetCode Binary Search"
              className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ChallengeCategory)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                {Object.values(ChallengeCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_METADATA[cat].label} ({CATEGORY_METADATA[cat].banglaLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject (Optional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics, Math"
                className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Duration
              </Label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value={15}>15 Minutes</option>
                <option value={25}>25 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
                <option value={120}>120 Minutes</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Priority
              </Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ChallengePriority)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value={ChallengePriority.LOW}>Low</option>
                <option value={ChallengePriority.MEDIUM}>Medium</option>
                <option value={ChallengePriority.HIGH}>High</option>
                <option value={ChallengePriority.URGENT}>Urgent</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? 'Adding...' : 'Add to Arena'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
