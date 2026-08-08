/**
 * Auto-Capture Stability Manager
 * 
 * Tracks frame stability across sequential camera frames to trigger auto-capture
 * when quality gates pass and the paper position remains steady.
 */

import { QualityMetrics } from './quality-engine';
import { CornerQuad } from './perspective-warp';

export interface AutoCaptureConfig {
  requiredStableDurationMs: number; // e.g. 500ms
  maxCornerMovementPx: number;      // e.g. 15px
}

export class AutoCaptureManager {
  private lastQuad: CornerQuad | null = null;
  private stableStartTime: number | null = null;
  private config: AutoCaptureConfig;

  constructor(config: Partial<AutoCaptureConfig> = {}) {
    this.config = {
      requiredStableDurationMs: config.requiredStableDurationMs ?? 450,
      maxCornerMovementPx: config.maxCornerMovementPx ?? 18
    };
  }

  /**
   * Processes a frame and determines whether auto-capture should trigger.
   */
  public evaluateFrame(
    quality: QualityMetrics,
    quad: CornerQuad | undefined,
    now: number = Date.now()
  ): { shouldCapture: boolean; progressRatio: number } {
    if (!quality.isQualityPassed || !quad) {
      this.reset();
      return { shouldCapture: false, progressRatio: 0 };
    }

    if (!this.lastQuad) {
      this.lastQuad = quad;
      this.stableStartTime = now;
      return { shouldCapture: false, progressRatio: 0.1 };
    }

    // Measure movement between current quad and last quad
    const deltaTL = distance(quad.tl, this.lastQuad.tl);
    const deltaTR = distance(quad.tr, this.lastQuad.tr);
    const deltaBL = distance(quad.bl, this.lastQuad.bl);
    const deltaBR = distance(quad.br, this.lastQuad.br);
    const maxDelta = Math.max(deltaTL, deltaTR, deltaBL, deltaBR);

    if (maxDelta > this.config.maxCornerMovementPx) {
      // Movement detected, reset timer
      this.lastQuad = quad;
      this.stableStartTime = now;
      return { shouldCapture: false, progressRatio: 0.1 };
    }

    // Steady frame
    const elapsed = now - (this.stableStartTime ?? now);
    const progressRatio = Math.min(1.0, elapsed / this.config.requiredStableDurationMs);

    if (elapsed >= this.config.requiredStableDurationMs) {
      this.reset();
      return { shouldCapture: true, progressRatio: 1.0 };
    }

    return { shouldCapture: false, progressRatio };
  }

  public reset(): void {
    this.lastQuad = null;
    this.stableStartTime = null;
  }
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
