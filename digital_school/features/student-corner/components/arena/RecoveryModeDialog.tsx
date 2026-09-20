'use client';

import React, { useState } from 'react';
import {
  LifeBuoy,
  Calendar,
  CheckCircle2,
  Trash2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { bulkOperationsAction } from '../../actions/arena-actions';

interface RecoveryChallengeItem {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  priority: string;
  originalDate: string;
}

interface RecoveryModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backlogItems: RecoveryChallengeItem[];
  onResolved: () => void;
}

export function RecoveryModeDialog({
  open,
  onOpenChange,
  backlogItems,
  onResolved,
}: RecoveryModeDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(backlogItems.map((b) => b.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleMoveToToday = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await bulkOperationsAction(selectedIds, 'MOVE_TO_DATE', { targetDate: todayStr });
      if (res.success) {
        toast.success(`${selectedIds.length} challenge(s) moved to Today’s Arena`);
        onResolved();
        onOpenChange(false);
      } else {
        toast.error(res.error || 'Failed to move challenges');
      }
    } catch {
      toast.error('An error occurred during recovery');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDropTasks = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await bulkOperationsAction(selectedIds, 'DELETE');
      if (res.success) {
        toast.success(`Dropped ${selectedIds.length} challenge(s) peacefully without guilt`);
        onResolved();
        onOpenChange(false);
      } else {
        toast.error(res.error || 'Failed to drop challenges');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                Recovery Mode
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                You have {backlogItems.length} unfinished challenge(s) from recent days.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Recovery Philosophy Alert (Item 46) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white mb-1">
              Guilt-Free Planning
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Never blindly dump past unfinished work onto tomorrow. Choose what truly matters now, reschedule what is essential, or peacefully drop what is no longer relevant.
            </p>
          </div>

          {/* Selection Toolbar */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">
              {selectedIds.length} of {backlogItems.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Select All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-slate-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Backlog Item List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {backlogItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-semibold">{item.category}</span>
                        <span>•</span>
                        <span>{item.durationMinutes}m</span>
                        <span>•</span>
                        <span>From {item.originalDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handleMoveToToday}
              disabled={selectedIds.length === 0 || isProcessing}
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Prioritize Today ({selectedIds.length})</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleDropTasks}
              disabled={selectedIds.length === 0 || isProcessing}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold gap-1.5 hover:text-rose-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Peacefully Drop</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
