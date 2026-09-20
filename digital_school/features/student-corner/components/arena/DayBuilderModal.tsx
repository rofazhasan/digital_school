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
import { Textarea } from '@/components/ui/textarea';
import { ChallengeCategory, ChallengePriority } from '@prisma/client';
import { CATEGORY_METADATA } from '../../types/categories';
import { createChallengeAction } from '../../actions/arena-actions';
import { toast } from 'sonner';
import { Sparkles, Plus, X, Tag } from 'lucide-react';

interface DayBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: string; // YYYY-MM-DD
  onChallengeAdded?: () => void;
}

export function DayBuilderModal({
  open,
  onOpenChange,
  currentDate,
  onChallengeAdded,
}: DayBuilderModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChallengeCategory>(ChallengeCategory.STUDY);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [scheduledTime, setScheduledTime] = useState('');
  const [priority, setPriority] = useState<ChallengePriority>(ChallengePriority.MEDIUM);
  const [subject, setSubject] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [topicsList, setTopicsList] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTopic = () => {
    const trimmed = topicsInput.trim();
    if (trimmed && !topicsList.includes(trimmed)) {
      setTopicsList([...topicsList, trimmed]);
      setTopicsInput('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopicsList(topicsList.filter((t) => t !== topicToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a challenge title');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createChallengeAction({
        date: currentDate,
        title: title.trim(),
        category,
        durationMinutes: Number(durationMinutes) || 45,
        scheduledTime: scheduledTime || undefined,
        priority,
        notes: notes.trim() || undefined,
        subjectNames: subject.trim() ? [subject.trim()] : undefined,
        topicNames: topicsList.length > 0 ? topicsList : undefined,
      });

      if (res.success) {
        toast.success('Challenge added to arena!');
        setTitle('');
        setSubject('');
        setTopicsList([]);
        setNotes('');
        onOpenChange(false);
        onChallengeAdded?.();
      } else {
        toast.error(res.error || 'Failed to create challenge');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Day Builder — Plan Challenge
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Design your arena challenge for {currentDate}. Define subject, specific topics, and estimated focus time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Challenge Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electromagnetic Induction Concept Drill"
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
                className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                {Object.values(ChallengeCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_METADATA[cat].label} ({CATEGORY_METADATA[cat].banglaLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics 2nd Paper"
                className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
              />
            </div>
          </div>

          {/* Topics Sub-section */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Topics / Sub-units (Multiple Allowed)
            </Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                placeholder="Type topic & press Add (e.g. Faraday's Law, Lenz's Law)"
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTopic}
                className="rounded-xl text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>

            {topicsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {topicsList.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                  >
                    <Tag className="w-3 h-3 text-indigo-500" />
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(t)}
                      className="hover:text-rose-600 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Duration (Minutes)</Label>
              <Input
                type="number"
                min={1}
                max={1440}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scheduled Time</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ChallengePriority)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value={ChallengePriority.LOW}>Low</option>
                <option value={ChallengePriority.MEDIUM}>Medium</option>
                <option value={ChallengePriority.HIGH}>High</option>
                <option value={ChallengePriority.URGENT}>Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes / Criteria (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What specifically defines success for this session? (e.g. solve 15 questions without checking hints)"
              rows={2}
              className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
            />
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
              {isSubmitting ? 'Adding...' : 'Add Challenge'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
