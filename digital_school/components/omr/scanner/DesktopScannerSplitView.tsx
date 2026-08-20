"use client";

import React from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PendingScanRecord } from '@/lib/omr/scan-outbox';

export interface DesktopScannerSplitViewProps {
  recentScans: PendingScanRecord[];
  activeExamName?: string;
  activeExamSet?: string;
}

export const DesktopScannerSplitView: React.FC<DesktopScannerSplitViewProps> = ({
  recentScans,
  activeExamName,
  activeExamSet
}) => {
  return (
    <aside className="hidden lg:flex w-96 flex-col bg-zinc-950 border-l border-zinc-800 text-white p-5 gap-5 overflow-y-auto">
      {/* Session Context Header */}
      <div className="flex flex-col gap-1.5 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-bold text-sm tracking-wide">Live Scan Stream</h2>
            <p className="text-xs text-zinc-400">
              {activeExamName || 'Physics Model Test'} (Set {activeExamSet || 'C'})
            </p>
          </div>
        </div>
      </div>

      {/* Recent Scans Feed */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>Recent Sheets</span>
          </span>
          <span>{recentScans.length} scanned</span>
        </div>

        {recentScans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs gap-2">
            <Users className="w-8 h-8 opacity-40" />
            <span>No papers scanned in this session yet. Point camera at an OMR sheet to begin.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentScans.map((scan, idx) => (
              <div
                key={scan.scanUuid || idx}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col gap-2 transition-all hover:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono font-bold text-sm text-white">Roll {scan.roll}</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-mono text-[10px]">
                    {Math.round((scan.confidence || 0.98) * 100)}% Confident
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Reg: {scan.registration}</span>
                  <span>Set: {scan.detectedSet || 'C'}</span>
                  <span className="text-zinc-500">
                    {new Date(scan.localCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
