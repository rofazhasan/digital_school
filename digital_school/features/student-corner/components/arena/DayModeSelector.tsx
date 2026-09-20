'use client';

import React, { useState } from 'react';
import { DayMode } from '@prisma/client';
import { Lock, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
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
import { toast } from 'sonner';
import { setDayModeAction } from '../../actions/arena-actions';

interface DayModeSelectorProps {
  arenaId: string;
  currentMode: DayMode;
  isLocked: boolean;
  onModeChanged?: (newMode: DayMode) => void;
}

export function DayModeSelector({
  arenaId,
  currentMode,
  isLocked,
  onModeChanged,
}: DayModeSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<DayMode>(currentMode);
  const [overrideReason, setOverrideReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApply = async () => {
    if (isLocked && selectedMode !== DayMode.LOCKED && !overrideReason.trim()) {
      toast.error('Emergency reason is required to unlock a sealed day.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await setDayModeAction(arenaId, selectedMode, overrideReason.trim() || undefined);
      if (res.success) {
        toast.success(`Day mode switched to ${selectedMode}`);
        setModalOpen(false);
        setOverrideReason('');
        onModeChanged?.(selectedMode);
      } else {
        toast.error(res.error || 'Failed to update day mode');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating mode');
    } finally {
      setIsUpdating(false);
    }
  };

  const modeBadgeConfig = {
    NORMAL: {
      label: 'Normal Mode',
      color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
      icon: Sparkles,
      desc: 'Flexible mode. You can freely edit, add, or reorder challenges anytime.',
    },
    STRICT: {
      label: 'Strict Mode',
      color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
      icon: ShieldAlert,
      desc: 'Integrity mode. Once the day begins, challenge details cannot be altered.',
    },
    LOCKED: {
      label: 'Locked Mode (DND)',
      color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
      icon: Lock,
      desc: 'Hardcore commitment. Day plan becomes immutable. Zero edits or reordering.',
    },
  };

  const CurrentIcon = modeBadgeConfig[currentMode].icon;

  return (
    <>
      <button
        onClick={() => {
          setSelectedMode(currentMode);
          setModalOpen(true);
        }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs hover:opacity-90 ${modeBadgeConfig[currentMode].color}`}
        title="Click to adjust Day Commitment Mode"
      >
        <CurrentIcon className="w-3.5 h-3.5" />
        <span>{modeBadgeConfig[currentMode].label}</span>
      </button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Day Commitment Mode
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Choose how strictly your daily arena commitments are enforced.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {(['NORMAL', 'STRICT', 'LOCKED'] as DayMode[]).map((mode) => {
              const cfg = modeBadgeConfig[mode];
              const Icon = cfg.icon;
              const isSelected = selectedMode === mode;

              return (
                <div
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl ${
                          mode === 'LOCKED'
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                            : mode === 'STRICT'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{cfg.label}</span>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Selected</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 pl-1">{cfg.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Audit Reason if unlocking a locked day */}
          {isLocked && selectedMode !== DayMode.LOCKED && (
            <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Audit Trail Warning</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                This day was sealed in Locked Mode. Downgrading will be permanently logged in your integrity audit history.
              </p>
              <Input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for emergency override..."
                className="bg-white dark:bg-slate-900 text-xs rounded-xl border-amber-300 dark:border-amber-700"
              />
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={isUpdating}
              className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isUpdating ? 'Saving...' : 'Apply Mode'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
