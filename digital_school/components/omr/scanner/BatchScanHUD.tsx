"use client";

import React from 'react';
import { Layers, Zap, Wifi, WifiOff, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BatchScanHUDProps {
  isBatchMode: boolean;
  onToggleBatch: () => void;
  scannedCount: number;
  syncedCount: number;
  pendingCount: number;
  isOnline: boolean;
}

export const BatchScanHUD: React.FC<BatchScanHUDProps> = ({
  isBatchMode,
  onToggleBatch,
  scannedCount,
  syncedCount,
  pendingCount,
  isOnline
}) => {
  return (
    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 text-xs text-white/90">
      <button
        onClick={onToggleBatch}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-medium transition-all active:scale-95",
          isBatchMode
            ? "bg-indigo-600/80 text-white border border-indigo-400/40 shadow-sm shadow-indigo-500/30"
            : "bg-white/10 text-white/70 hover:text-white"
        )}
      >
        <Zap className={cn("w-3.5 h-3.5", isBatchMode ? "text-amber-300" : "text-white/60")} />
        <span>{isBatchMode ? 'Batch ON' : 'Single'}</span>
      </button>

      <div className="h-4 w-px bg-white/20" />

      <div className="flex items-center gap-3 font-mono">
        <span className="flex items-center gap-1 text-emerald-300" title="Scanned this session">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {scannedCount}
        </span>

        {pendingCount > 0 && (
          <span className="flex items-center gap-1 text-amber-300" title="Pending Sync Outbox">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            {pendingCount}
          </span>
        )}

        <span
          className={cn(
            "flex items-center gap-1",
            isOnline ? "text-cyan-300" : "text-rose-300"
          )}
          title={isOnline ? "Online (Auto-Syncing)" : "Offline (Queued locally in IndexedDB)"}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        </span>
      </div>
    </div>
  );
};
