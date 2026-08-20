"use client";

import React, { RefObject } from 'react';
import {
  Camera,
  Flashlight,
  Volume2,
  VolumeX,
  ArrowLeft,
  RefreshCw,
  Scan,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LiveGuidancePill } from './LiveGuidancePill';
import { BatchScanHUD } from './BatchScanHUD';

export interface ScannerViewfinderProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  scannerStatus: string;
  guidanceMessage: string;
  alignmentQuality: number;
  qualityScore?: number;
  torchOn: boolean;
  onToggleTorch: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isBatchMode: boolean;
  onToggleBatch: () => void;
  scannedCount: number;
  syncedCount: number;
  pendingCount: number;
  isOnline: boolean;
  onManualCapture: () => void;
  isProcessing: boolean;
}

export const ScannerViewfinder: React.FC<ScannerViewfinderProps> = ({
  videoRef,
  canvasRef,
  scannerStatus,
  guidanceMessage,
  alignmentQuality,
  qualityScore,
  torchOn,
  onToggleTorch,
  soundEnabled,
  onToggleSound,
  isBatchMode,
  onToggleBatch,
  scannedCount,
  syncedCount,
  pendingCount,
  isOnline,
  onManualCapture,
  isProcessing
}) => {
  const isAligned = alignmentQuality >= 0.75;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-black select-none touch-none">
      {/* Background Camera Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Hidden Working Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Navigation & Status Bar */}
      <header className="relative z-30 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <Link
            href="/exams"
            className="p-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/15 text-white/80 active:scale-95 transition-transform"
            title="Back to Exams"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <BatchScanHUD
            isBatchMode={isBatchMode}
            onToggleBatch={onToggleBatch}
            scannedCount={scannedCount}
            syncedCount={syncedCount}
            pendingCount={pendingCount}
            isOnline={isOnline}
          />
        </div>

        {/* Hardware Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTorch}
            className={cn(
              "p-2.5 rounded-2xl border backdrop-blur-md transition-all active:scale-95",
              torchOn
                ? "bg-amber-500/20 border-amber-400 text-amber-300"
                : "bg-black/60 border-white/15 text-white/80"
            )}
            title="Toggle Flashlight"
          >
            <Flashlight className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleSound}
            className={cn(
              "p-2.5 rounded-2xl border backdrop-blur-md transition-all active:scale-95",
              soundEnabled
                ? "bg-black/60 border-white/15 text-white/80"
                : "bg-rose-500/20 border-rose-400 text-rose-300"
            )}
            title="Toggle Audio Feedback"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Center Framing Reticle & Guides */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-sm sm:max-w-md aspect-[1/1.414] max-h-[68vh] flex items-center justify-center pointer-events-none">
          {/* Outer Scanner Reticle Corners */}
          <div
            className={cn(
              "absolute inset-0 rounded-3xl border-2 transition-all duration-300",
              isAligned
                ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.35)]"
                : alignmentQuality > 0.40
                ? "border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                : "border-white/30"
            )}
          >
            {/* 4 Corner High-Contrast Accent Crossbars */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-current rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-current rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-current rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-current rounded-br-xl" />
          </div>

          {/* Subdued Scanning Horizon Beam */}
          {scannerStatus === 'ALIGNING' || scannerStatus === 'CHECKING_ALIGNMENT' ? (
            <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-bounce" />
          ) : null}

          {/* Centered Guidance Pill */}
          <div className="absolute -bottom-14 inset-x-0 flex justify-center pointer-events-auto">
            <LiveGuidancePill
              status={scannerStatus}
              message={guidanceMessage}
              qualityScore={qualityScore}
            />
          </div>
        </div>
      </main>

      {/* Bottom Shutter & Manual Capture Controls */}
      <footer className="relative z-30 p-6 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-8">
        <button
          onClick={onManualCapture}
          disabled={isProcessing}
          className={cn(
            "relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 shadow-2xl",
            isAligned
              ? "border-emerald-400 bg-emerald-500/20 shadow-emerald-500/40 animate-pulse"
              : "border-white/60 bg-white/10 hover:border-white shadow-black/50"
          )}
          title="Capture OMR Sheet"
        >
          <div
            className={cn(
              "w-14 h-14 rounded-full transition-transform",
              isProcessing
                ? "bg-cyan-400 scale-75 animate-ping"
                : isAligned
                ? "bg-emerald-400 scale-100"
                : "bg-white"
            )}
          />
        </button>
      </footer>
    </div>
  );
};
