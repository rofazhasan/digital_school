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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Archive, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { bulkArchiveCompletedChallengesAction } from '../../actions/arena-actions';

interface ManageCompletedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arenaId: string;
  completedChallenges: any[];
  activeCount: number;
  onSuccess?: () => void;
}

export function ManageCompletedModal({
  open,
  onOpenChange,
  arenaId,
  completedChallenges,
  activeCount,
  onSuccess,
}: ManageCompletedModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      setSelectedIds(completedChallenges.map((c) => c.id));
      setIsAllSelected(true);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      setIsAllSelected(next.length === completedChallenges.length);
      return next;
    });
  };

  const handleExecuteRemoval = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    setConfirmOpen(false);

    try {
      const res = await bulkArchiveCompletedChallengesAction(arenaId, selectedIds);
      if (res.success) {
        toast.success(`Removed ${res.count} completed challenges from active Arena.`);
        setSelectedIds([]);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(res.error || 'Failed to remove challenges');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing cleanup');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveAll = () => {
    setSelectedIds(completedChallenges.map((c) => c.id));
    setConfirmOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">
                  Completed Challenge Cleanup
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {activeCount} Active • {completedChallenges.length} Completed
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Explanation Banner */}
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300">
            Removing completed challenges cleans your active workspace. Your streaks, heatmaps, and focus time are 100% preserved.
          </div>

          {/* List of Completed Challenges */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2 max-h-[45vh] scrollbar-thin">
            {completedChallenges.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No completed challenges to clean up.
              </div>
            ) : (
              completedChallenges.map((task) => {
                const isChecked = selectedIds.includes(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleSelect(task.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleSelect(task.id)}
                        className="rounded-md"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{task.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.durationMinutes}m
                          </span>
                        </div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {completedChallenges.length > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs font-bold rounded-xl"
                >
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </Button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAll}
                    disabled={isProcessing}
                    className="text-xs font-bold rounded-xl"
                  >
                    Remove All ({completedChallenges.length})
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    disabled={selectedIds.length === 0 || isProcessing}
                    className="text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Remove Selected ({selectedIds.length})
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-xl text-xs font-bold"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove completed challenges?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-slate-600 dark:text-slate-400">
              <p>
                Remove {selectedIds.length} completed challenge{selectedIds.length > 1 ? 's' : ''} from your active Arena?
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Your progress history, streaks, and heatmap will remain 100% intact.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteRemoval}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Confirm Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
