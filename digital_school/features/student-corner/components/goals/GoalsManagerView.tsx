'use client';

import React, { useState } from 'react';
import { StudentGoalItem } from '../../types';
import {
  Target,
  Plus,
  Trophy,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  createGoalAction,
  updateGoalProgressAction,
  deleteGoalAction,
} from '../../actions/goal-actions';

interface GoalsManagerViewProps {
  initialGoals: StudentGoalItem[];
}

export function GoalsManagerView({ initialGoals }: GoalsManagerViewProps) {
  const [goals, setGoals] = useState<StudentGoalItem[]>(initialGoals);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState<StudentGoalItem | null>(null);
  const [progressInput, setProgressInput] = useState<number>(0);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Study');
  const [targetType, setTargetType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'CUSTOM'>('MONTHLY');
  const [targetValue, setTargetValue] = useState(100);
  const [unit, setUnit] = useState('problems');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createGoalAction({
        title,
        category,
        targetType: targetType as any,
        targetValue,
        unit,
        targetDate: targetDate || undefined,
      });

      if (res.success && res.goal) {
        setGoals((prev) => [res.goal, ...prev]);
        toast.success('Goal created successfully!');
        setIsAddOpen(false);
        setTitle('');
      } else {
        toast.error(res.error || 'Failed to create goal');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!activeGoal) return;
    setIsSubmitting(true);
    try {
      const res = await updateGoalProgressAction({
        goalId: activeGoal.id,
        currentValue: progressInput,
      });

      if (res.success && 'goal' in res && res.goal) {
        setGoals((prev) => prev.map((g) => (g.id === (res as any).goal.id ? (res as any).goal : g)));
        if ((res as any).newlyPassedMilestones && (res as any).newlyPassedMilestones.length > 0) {
          const highest = Math.max(...(res as any).newlyPassedMilestones);
          toast.success(`🎉 Milestone Reached: ${highest}%!`);
        } else {
          toast.success('Progress updated');
        }
        setIsUpdateOpen(false);
      } else {
        toast.error(res.error || 'Failed to update progress');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      const res = await deleteGoalAction(goalId);
      if (res.success) {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        toast.success('Goal deleted');
      }
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const openProgressModal = (goal: StudentGoalItem) => {
    setActiveGoal(goal);
    setProgressInput(goal.currentValue);
    setIsUpdateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Goals & Academic Milestones
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set intentional semester, monthly, or habit targets with automated milestone celebrations.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </Button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
          <Target className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
            No goals set yet
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first semester or monthly goal (e.g., "Complete 150 LeetCode problems" or "Study 60 hours of Physics").
          </p>
          <Button
            onClick={() => setIsAddOpen(true)}
            variant="outline"
            className="rounded-xl text-xs font-bold"
          >
            Create Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const isComplete = goal.status === 'COMPLETED' || goal.progressPercentage >= 100;
            return (
              <div
                key={goal.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  isComplete
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {goal.targetType}
                    </span>

                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                    {goal.title}
                  </h3>

                  {goal.category && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      {goal.category}
                    </p>
                  )}

                  {/* Progress Bar & Counter */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400">
                        {goal.progressPercentage}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${goal.progressPercentage}%` }}
                      />
                    </div>

                    {/* Milestone Markers (25%, 50%, 75%, 100%) */}
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1">
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {isComplete ? 'Goal Completed 🎉' : 'In Progress'}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openProgressModal(goal)}
                    className="h-7 text-[11px] font-bold rounded-xl"
                  >
                    Log Progress
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Create Goal</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Define a clear target and track incremental milestones.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 my-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Goal Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete 150 LeetCode problems"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Type
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="SEMESTER">Semester</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Coding / Study"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Value *
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. problems, hours, chapters"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Update Progress</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {activeGoal?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Completed Value ({activeGoal?.unit})
              </label>
              <input
                type="number"
                min="0"
                value={progressInput}
                onChange={(e) => setProgressInput(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-base font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Target: {activeGoal?.targetValue} {activeGoal?.unit}
              </span>
            </div>

            <Button
              onClick={handleUpdateProgress}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Save Progress
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
