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
import { AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { resetDailyArenaAction } from '../../actions/arena-actions';

interface ResetArenaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arenaId: string;
  onSuccess?: () => void;
}

export function ResetArenaModal({
  open,
  onOpenChange,
  arenaId,
  onSuccess,
}: ResetArenaModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmInput, setConfirmInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    setStep(1);
    setConfirmInput('');
    onOpenChange(false);
  };

  const handleExecuteReset = async () => {
    if (confirmInput.trim() !== 'RESET ARENA') return;
    setIsProcessing(true);

    try {
      const res = await resetDailyArenaAction(arenaId, 'RESET ARENA');
      if (res.success) {
        toast.success('✨ Fresh start ready. Your Arena is clear.');
        handleClose();
        onSuccess?.();
      } else {
        toast.error(res.error || 'Failed to reset arena');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing reset');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-3xl p-6 select-none">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {step === 1 ? 'Start Fresh?' : 'Confirm Arena Reset'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {step === 1 ? 'Clear your active workspace to restart planning from zero.' : 'Final confirmation required.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 my-3 text-xs">
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              This will remove all current Arena challenges from your active workspace so you can start planning today's mission afresh.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Will be removed */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 space-y-2">
                <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <XCircle className="w-3.5 h-3.5" />
                  Will be removed
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 pl-1 list-disc list-inside text-[11px]">
                  <li>Current active challenges</li>
                  <li>Pending custom tasks</li>
                  <li>Active day plan</li>
                </ul>
              </div>

              {/* Will remain */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Will remain intact
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 pl-1 list-disc list-inside text-[11px]">
                  <li>Historical completion data</li>
                  <li>Streak milestones</li>
                  <li>Heatmap consistency</li>
                  <li>Study statistics & focus time</li>
                  <li>LMS exams & Quran content</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Continue to Reset
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Step 2: Verification Input */
          <div className="space-y-4 my-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
              Type <strong className="font-mono text-rose-600 dark:text-rose-400">RESET ARENA</strong> below to confirm.
            </div>

            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="RESET ARENA"
              className="font-mono text-center tracking-widest uppercase font-black text-sm h-11 rounded-xl"
              autoFocus
            />

            <DialogFooter className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isProcessing}
                className="rounded-xl text-xs font-bold"
              >
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleClose} className="rounded-xl text-xs font-bold">
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteReset}
                  disabled={confirmInput.trim() !== 'RESET ARENA' || isProcessing}
                  className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                >
                  {isProcessing ? 'Resetting...' : 'RESET ARENA'}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
