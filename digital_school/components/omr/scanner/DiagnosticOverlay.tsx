"use client";

import React from 'react';
import { Activity, Cpu, Eye, Gauge, Layers, Terminal } from 'lucide-react';
import { QualityMetrics } from '@/lib/omr/quality-engine';
import { CornerQuad } from '@/lib/omr/perspective-warp';

export interface DiagnosticOverlayProps {
  isVisible: boolean;
  onToggle: () => void;
  fps: number;
  latencyMs: number;
  qualityMetrics: QualityMetrics | null;
  corners: CornerQuad | null;
  deviceTier: string;
  workerCount: number;
}

export const DiagnosticOverlay: React.FC<DiagnosticOverlayProps> = ({
  isVisible,
  onToggle,
  fps,
  latencyMs,
  qualityMetrics,
  corners,
  deviceTier,
  workerCount
}) => {
  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 p-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white/70 hover:text-white active:scale-95 transition-all text-xs font-mono flex items-center gap-1.5"
        title="Open Diagnostic HUD"
      >
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span className="hidden sm:inline">Diagnostics</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] bg-black/90 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl text-white font-mono text-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/15 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold font-sans">Vision Engine Telemetry</span>
        </div>
        <button
          onClick={onToggle}
          className="text-white/50 hover:text-white px-2 py-0.5 rounded bg-white/10"
        >
          Close
        </button>
      </div>

      {/* Real-time Performance Metrics */}
      <div className="grid grid-cols-2 gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/10">
        <div>
          <span className="text-[10px] text-white/50 uppercase block">Live Preview</span>
          <span className="font-bold text-emerald-400">{fps} FPS</span>
        </div>
        <div>
          <span className="text-[10px] text-white/50 uppercase block">Inference Time</span>
          <span className="font-bold text-cyan-400">{latencyMs} ms</span>
        </div>
        <div>
          <span className="text-[10px] text-white/50 uppercase block">Hardware Tier</span>
          <span className="font-bold text-amber-300">{deviceTier}</span>
        </div>
        <div>
          <span className="text-[10px] text-white/50 uppercase block">Parallel Workers</span>
          <span className="font-bold text-indigo-300">{workerCount}</span>
        </div>
      </div>

      {/* Image Quality Breakdown */}
      {qualityMetrics && (
        <div className="flex flex-col gap-1.5 bg-white/5 p-2.5 rounded-2xl border border-white/10 text-[11px]">
          <div className="flex justify-between">
            <span className="text-white/60">Laplacian Sharpness:</span>
            <span className={qualityMetrics.blurScore >= 80 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {Math.round(qualityMetrics.blurScore)} (min 80)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Brightness (Avg):</span>
            <span className="text-white font-bold">{Math.round(qualityMetrics.brightnessScore)} / 255</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Contrast (STD):</span>
            <span className="text-white font-bold">{Math.round(qualityMetrics.contrastScore)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Specular Glare:</span>
            <span className={qualityMetrics.glareRatio <= 0.12 ? "text-emerald-400" : "text-rose-400"}>
              {Math.round(qualityMetrics.glareRatio * 100)}% (max 12%)
            </span>
          </div>
        </div>
      )}

      {/* Quad Coordinates */}
      {corners && (
        <div className="text-[10px] text-white/50 bg-white/5 p-2 rounded-xl border border-white/5">
          <div>TL: ({Math.round(corners.tl.x)}, {Math.round(corners.tl.y)}) | TR: ({Math.round(corners.tr.x)}, {Math.round(corners.tr.y)})</div>
          <div>BL: ({Math.round(corners.bl.x)}, {Math.round(corners.bl.y)}) | BR: ({Math.round(corners.br.x)}, {Math.round(corners.br.y)})</div>
        </div>
      )}
    </div>
  );
};
