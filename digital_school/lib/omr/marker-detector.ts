/**
 * 4-Corner Registration Marker Detector
 * 
 * Detects Top-Left (TL), Top-Right (TR), Bottom-Left (BL), and Bottom-Right (BR)
 * geometric anchor markers on the OMR sheet and validates corner geometry.
 */

import { CornerQuad, Point } from './perspective-warp';

export interface MarkerDetectionResult {
  isValid: boolean;
  quad?: CornerQuad;
  confidence: number;
  error?: string;
  detectedCorners?: {
    tl?: Point;
    tr?: Point;
    bl?: Point;
    br?: Point;
  };
}

export function detectCornerMarkers(
  imageData: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number
): MarkerDetectionResult {
  try {
    // Expected relative corner positions
    const searchCenters = {
      tl: { expectedX: width * 0.058, expectedY: height * 0.041 },
      tr: { expectedX: width * 0.941, expectedY: height * 0.041 },
      bl: { expectedX: width * 0.058, expectedY: height * 0.958 },
      br: { expectedX: width * 0.941, expectedY: height * 0.958 }
    };

    const searchRadiusX = width * 0.12;
    const searchRadiusY = height * 0.12;

    const corners: { [key: string]: Point } = {};

    for (const [key, center] of Object.entries(searchCenters)) {
      const reg = {
        minX: Math.max(0, Math.floor(center.expectedX - searchRadiusX)),
        maxX: Math.min(width, Math.ceil(center.expectedX + searchRadiusX)),
        minY: Math.max(0, Math.floor(center.expectedY - searchRadiusY)),
        maxY: Math.min(height, Math.ceil(center.expectedY + searchRadiusY))
      };

      const point = findCornerInRegion(imageData, width, height, reg);
      if (point) {
        corners[key] = point;
      }
    }

    if (!corners.tl || !corners.tr || !corners.bl || !corners.br) {
      const missing = ['tl', 'tr', 'bl', 'br'].filter(k => !corners[k]);
      return {
        isValid: false,
        confidence: 0,
        error: `Failed to detect corner markers: Missing ${missing.join(', ')}`,
        detectedCorners: corners
      };
    }

    const quad: CornerQuad = {
      tl: corners.tl,
      tr: corners.tr,
      bl: corners.bl,
      br: corners.br
    };

    // Validate geometry
    const topDist = distance(quad.tl, quad.tr);
    const bottomDist = distance(quad.bl, quad.br);
    const leftDist = distance(quad.tl, quad.bl);
    const rightDist = distance(quad.tr, quad.br);

    const topBottomRatio = Math.abs(topDist - bottomDist) / Math.max(topDist, bottomDist);
    const leftRightRatio = Math.abs(leftDist - rightDist) / Math.max(leftDist, rightDist);
    const aspectRatio = (topDist + bottomDist) / (leftDist + rightDist); // Expected ~0.707

    if (topBottomRatio > 0.15) {
      return {
        isValid: false,
        confidence: 0.3,
        error: `Geometry error: Top and bottom marker distances mismatch (${Math.round(topDist)} vs ${Math.round(bottomDist)})`,
        quad,
        detectedCorners: corners
      };
    }

    if (leftRightRatio > 0.15) {
      return {
        isValid: false,
        confidence: 0.3,
        error: `Geometry error: Left and right marker distances mismatch (${Math.round(leftDist)} vs ${Math.round(rightDist)})`,
        quad,
        detectedCorners: corners
      };
    }

    if (aspectRatio < 0.50 || aspectRatio > 0.90) {
      return {
        isValid: false,
        confidence: 0.4,
        error: `Geometry error: Invalid sheet aspect ratio (${aspectRatio.toFixed(2)})`,
        quad,
        detectedCorners: corners
      };
    }

    const confidence = Math.max(0, 1.0 - (topBottomRatio + leftRightRatio));

    return {
      isValid: true,
      quad,
      confidence,
      detectedCorners: corners
    };
  } catch (err: any) {
    return {
      isValid: false,
      confidence: 0,
      error: `Marker detection error: ${err.message || String(err)}`
    };
  }
}

function findCornerInRegion(
  imageData: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  reg: { minX: number; maxX: number; minY: number; maxY: number }
): Point | null {
  let darkPixelSumX = 0;
  let darkPixelSumY = 0;
  let darkPixelCount = 0;

  // Threshold for solid black marker
  const darkThreshold = 80;

  for (let y = reg.minY; y < reg.maxY; y++) {
    for (let x = reg.minX; x < reg.maxX; x++) {
      const idx = (y * width + x) * 4;
      const gray = (imageData[idx] * 299 + imageData[idx + 1] * 587 + imageData[idx + 2] * 114) / 1000;

      if (gray < darkThreshold) {
        darkPixelSumX += x;
        darkPixelSumY += y;
        darkPixelCount++;
      }
    }
  }

  if (darkPixelCount < 100) {
    return null;
  }

  return {
    x: Math.round(darkPixelSumX / darkPixelCount),
    y: Math.round(darkPixelSumY / darkPixelCount)
  };
}

function distance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
