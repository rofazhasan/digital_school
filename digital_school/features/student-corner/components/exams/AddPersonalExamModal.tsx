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
import { ChallengePriority } from '@prisma/client';
import { createPersonalExamAction } from '../../actions/exam-actions';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface AddPersonalExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExamAdded?: () => void;
}

export function AddPersonalExamModal({
  open,
  onOpenChange,
  onExamAdded,
}: AddPersonalExamModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<ChallengePriority>(ChallengePriority.HIGH);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) {
      toast.error('Title and Subject are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPersonalExamAction({
        title: title.trim(),
        subject: subject.trim(),
        examDate,
        startTime: startTime || undefined,
        location: location.trim() || undefined,
        priority,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success('Personal exam scheduled!');
        setTitle('');
        setSubject('');
        setLocation('');
        setNotes('');
        onOpenChange(false);
        onExamAdded?.();
      } else {
        toast.error(res.error || 'Failed to create exam');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error scheduling exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Add Personal Exam
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Schedule an external exam, coaching mock test, or competitive admission exam with automated countdowns.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Exam Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Model Test 3, BUET Admission Mock"
              className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics & Chemistry Combined"
              className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Exam Date</Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location / Hall</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Center Room 402"
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
                <option value={ChallengePriority.MEDIUM}>Medium</option>
                <option value={ChallengePriority.HIGH}>High</option>
                <option value={ChallengePriority.URGENT}>Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes / Syllabus (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chapters included, admit card reminder, calculator rules..."
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
              {isSubmitting ? 'Saving...' : 'Save Exam'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
