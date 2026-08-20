/**
 * Multi-Stage Alignment & Sub-Pixel Refinement Engine
 * 
 * Implements:
 * 1. Coarse Alignment: Quad detection & homography warp.
 * 2. Fine Alignment: Sub-pixel corner fiducial marker centroid refinement.
 * 3. Local Bubble Refinement: Bounded local search (±3px) to estimate true inked center
 *    without colliding with adjacent bubbles.
 */

import { Point2D, CornerQuad, warpPerspectiveImage } from '../perspective-warp';
import { detectCornerMarkers, CornerMarkerResult } from '../marker-detector';

export interface AlignedPageResult {
  isAligned: boolean;
  confidence: number;
  corners: CornerQuad;
  canonicalBuffer?: Uint8ClampedArray;
  skewAngleDegrees: number;
  alignmentErrorPx: number;
}

export class AlignmentEngine {
  /**
   * Stage 1: Coarse Alignment — Fast corner marker detection & perspective transformation
   */
  public static performCoarseAlignment(
    imageData: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
    targetCanonicalWidth: number = 2480,
    targetCanonicalHeight: number = 3508
  ): AlignedPageResult {
    const markerResult = detectCornerMarkers(imageData, width, height);
    const quad = markerResult.quad || (markerResult.detectedCorners?.tl && markerResult.detectedCorners?.tr && markerResult.detectedCorners?.bl && markerResult.detectedCorners?.br ? {
      tl: markerResult.detectedCorners.tl,
      tr: markerResult.detectedCorners.tr,
      bl: markerResult.detectedCorners.bl,
      br: markerResult.detectedCorners.br
    } : null);

    if (!markerResult.isValid || markerResult.confidence < 0.65 || !quad) {
      const fallbackQuad: CornerQuad = quad || {
        tl: { x: 0, y: 0 },
        tr: { x: width, y: 0 },
        br: { x: width, y: height },
        bl: { x: 0, y: height }
      };
      return {
        isAligned: false,
        confidence: markerResult.confidence,
        corners: fallbackQuad,
        skewAngleDegrees: 0,
        alignmentErrorPx: 999
      };
    }

    // Refine corner positions sub-pixel using local gradient moments
    const refinedCorners = this.refineFiducialCentroids(imageData, width, height, quad);

    // Compute Skew Angle
    const dx = refinedCorners.tr.x - refinedCorners.tl.x;
    const dy = refinedCorners.tr.y - refinedCorners.tl.y;
    const skewAngleRad = Math.atan2(dy, dx);
    const skewAngleDeg = (skewAngleRad * 180) / Math.PI;

    // Warp into canonical page coordinate space
    const warpResult = warpPerspectiveImage(
      imageData,
      width,
      height,
      refinedCorners,
      targetCanonicalWidth,
      targetCanonicalHeight
    );

    return {
      isAligned: true,
      confidence: markerResult.confidence,
      corners: refinedCorners,
      canonicalBuffer: warpResult.data,
      skewAngleDegrees: skewAngleDeg,
      alignmentErrorPx: 0
    };
  }

  /**
   * Stage 2: Fine Alignment — Sub-pixel centroid refinement on 4 corner markers
   */
  public static refineFiducialCentroids(
    imageData: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
    coarseQuad: CornerQuad
  ): CornerQuad {
    const refineSingleCorner = (pt: Point2D): Point2D => {
      const radius = 12;
      const minX = Math.max(0, Math.round(pt.x - radius));
      const maxX = Math.min(width - 1, Math.round(pt.x + radius));
      const minY = Math.max(0, Math.round(pt.y - radius));
      const maxY = Math.min(height - 1, Math.round(pt.y + radius));

      let m00 = 0;
      let m10 = 0;
      let m01 = 0;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = (y * width + x) * 4;
          const gray = (imageData[idx] * 299 + imageData[idx + 1] * 587 + imageData[idx + 2] * 114) / 1000;
          // Invert so dark marker pixels have high weight
          const weight = Math.max(0, 255 - gray);
          if (weight > 120) {
            m00 += weight;
            m10 += x * weight;
            m01 += y * weight;
          }
        }
      }

      if (m00 > 0) {
        return {
          x: m10 / m00,
          y: m01 / m00
        };
      }
      return pt;
    };

    return {
      tl: refineSingleCorner(coarseQuad.tl),
      tr: refineSingleCorner(coarseQuad.tr),
      br: refineSingleCorner(coarseQuad.br),
      bl: refineSingleCorner(coarseQuad.bl)
    };
  }

  /**
   * Stage 3: Local Sub-Pixel Bubble Centroid Refinement
   * Searches a strictly bounded window (±maxShiftPx, default 3px) around expected (x, y)
   * to align with the actual printed/filled ink center without drifting to neighbors.
   */
  public static refineBubbleCenter(
    canonicalBuffer: Uint8ClampedArray,
    canonicalWidth: number,
    canonicalHeight: number,
    expectedX: number,
    expectedY: number,
    radius: number,
    maxShiftPx: number = 3
  ): { x: number; y: number; localDriftPx: number } {
    let bestX = expectedX;
    let bestY = expectedY;
    let maxDarkness = -1;

    const minX = Math.max(radius, Math.round(expectedX - maxShiftPx));
    const maxX = Math.min(canonicalWidth - radius - 1, Math.round(expectedX + maxShiftPx));
    const minY = Math.max(radius, Math.round(expectedY - maxShiftPx));
    const maxY = Math.min(canonicalHeight - radius - 1, Math.round(expectedY + maxShiftPx));

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const shiftDistSq = (cx - expectedX) * (cx - expectedX) + (cy - expectedY) * (cy - expectedY);
        if (shiftDistSq > maxShiftPx * maxShiftPx) continue;

        // Measure darkness of small core circle (radius * 0.5)
        let sumDarkness = 0;
        let count = 0;
        const innerR = Math.max(2, Math.round(radius * 0.5));

        for (let dy = -innerR; dy <= innerR; dy++) {
          for (let dx = -innerR; dx <= innerR; dx++) {
            if (dx * dx + dy * dy <= innerR * innerR) {
              const py = cy + dy;
              const px = cx + dx;
              const idx = (py * canonicalWidth + px) * 4;
              const gray = (canonicalBuffer[idx] * 299 + canonicalBuffer[idx + 1] * 587 + canonicalBuffer[idx + 2] * 114) / 1000;
              sumDarkness += (255 - gray);
              count++;
            }
          }
        }

        const avgDarkness = count > 0 ? sumDarkness / count : 0;
        if (avgDarkness > maxDarkness) {
          maxDarkness = avgDarkness;
          bestX = cx;
          bestY = cy;
        }
      }
    }

    const drift = Math.sqrt(
      Math.pow(bestX - expectedX, 2) + Math.pow(bestY - expectedY, 2)
    );

    return {
      x: bestX,
      y: bestY,
      localDriftPx: drift
    };
  }
}
