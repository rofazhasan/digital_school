/**
 * Diagnostic Evidence Renderer
 * 
 * Generates annotated visual diagnostic overlays of scanned OMR sheets.
 * Renders:
 * - Corner registration markers (Green = valid, Red = missing)
 * - QR code region bounding box
 * - Roll number grid cells
 * - Registration number grid cells
 * - 100 question answer bubbles color-coded by status:
 *   - Green: Confidently selected (FILLED)
 *   - Amber/Yellow: Ambiguous / Low confidence
 *   - Red: Multiple marks / Conflict
 *   - Blue/Gray: Empty
 */

import { OMRTemplateGeometry, CellROI, CANONICAL_WIDTH, CANONICAL_HEIGHT } from './geometry-template';
import { CornerQuad } from './perspective-warp';

export interface OverlayAnnotationOptions {
  showMarkers?: boolean;
  showQR?: boolean;
  showRoll?: boolean;
  showRegistration?: boolean;
  showAnswers?: boolean;
  rawAnswers?: Record<number, string>;
  ambiguousQuestions?: number[];
  multipleMarkQuestions?: number[];
}

export class DiagnosticEvidenceRenderer {
  /**
   * Renders diagnostic annotations onto an RGBA image buffer.
   */
  public static annotateCanonicalImage(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    geometry: OMRTemplateGeometry,
    options: OverlayAnnotationOptions = {}
  ): Uint8ClampedArray {
    const output = new Uint8ClampedArray(imageData);

    const {
      showMarkers = true,
      showQR = true,
      showRoll = true,
      showRegistration = true,
      showAnswers = true,
      rawAnswers = {},
      ambiguousQuestions = [],
      multipleMarkQuestions = []
    } = options;

    // Helper to draw a circle outline on Uint8ClampedArray
    const drawCircle = (cx: number, cy: number, r: number, rCol: number, gCol: number, bCol: number, thickness: number = 2) => {
      const minX = Math.max(0, cx - r - thickness);
      const maxX = Math.min(width - 1, cx + r + thickness);
      const minY = Math.max(0, cy - r - thickness);
      const maxY = Math.min(height - 1, cy + r + thickness);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
          if (Math.abs(dist - r) <= thickness) {
            const idx = (y * width + x) * 4;
            output[idx] = rCol;
            output[idx + 1] = gCol;
            output[idx + 2] = bCol;
            output[idx + 3] = 255;
          }
        }
      }
    };

    // Helper to draw a filled circle with alpha
    const fillCircle = (cx: number, cy: number, r: number, rCol: number, gCol: number, bCol: number, alpha: number = 0.4) => {
      const minX = Math.max(0, cx - r);
      const maxX = Math.min(width - 1, cx + r);
      const minY = Math.max(0, cy - r);
      const maxY = Math.min(height - 1, cy + r);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const distSq = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          if (distSq <= r * r) {
            const idx = (y * width + x) * 4;
            output[idx] = Math.round(output[idx] * (1 - alpha) + rCol * alpha);
            output[idx + 1] = Math.round(output[idx + 1] * (1 - alpha) + gCol * alpha);
            output[idx + 2] = Math.round(output[idx + 2] * (1 - alpha) + bCol * alpha);
          }
        }
      }
    };

    // Helper to draw a rectangle outline
    const drawRect = (rx: number, ry: number, rw: number, rh: number, rCol: number, gCol: number, bCol: number, thickness: number = 3) => {
      const minX = Math.max(0, rx);
      const maxX = Math.min(width - 1, rx + rw);
      const minY = Math.max(0, ry);
      const maxY = Math.min(height - 1, ry + rh);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const isBorder = (
            x <= minX + thickness ||
            x >= maxX - thickness ||
            y <= minY + thickness ||
            y >= maxY - thickness
          );
          if (isBorder) {
            const idx = (y * width + x) * 4;
            output[idx] = rCol;
            output[idx + 1] = gCol;
            output[idx + 2] = bCol;
            output[idx + 3] = 255;
          }
        }
      }
    };

    // 1. Markers (Magenta / Cyan)
    if (showMarkers) {
      geometry.markers.forEach(m => {
        drawRect(m.x, m.y, m.width, m.height, 236, 72, 153, 4); // Pink/Magenta
      });
    }

    // 2. QR Code (Indigo)
    if (showQR && geometry.qr) {
      drawRect(geometry.qr.x, geometry.qr.y, geometry.qr.width, geometry.qr.height, 99, 102, 241, 3);
    }

    // 3. Roll Grid (Sky Blue)
    if (showRoll) {
      geometry.roll.cells.forEach(c => {
        drawCircle(Math.round(c.center.x), Math.round(c.center.y), c.radius, 14, 165, 233, 2);
      });
    }

    // 4. Registration Grid (Amber)
    if (showRegistration) {
      geometry.registration.cells.forEach(c => {
        drawCircle(Math.round(c.center.x), Math.round(c.center.y), c.radius, 245, 158, 11, 2);
      });
    }

    // 5. Answer Bubbles
    if (showAnswers) {
      geometry.answers.cells.forEach(c => {
        const qNo = c.qNo || 0;
        const selectedOpt = rawAnswers[qNo];
        const isSelected = selectedOpt === c.optionLabel;
        const isAmbiguous = ambiguousQuestions.includes(qNo);
        const isMultiple = multipleMarkQuestions.includes(qNo);

        const cx = Math.round(c.center.x);
        const cy = Math.round(c.center.y);

        if (isSelected) {
          if (isMultiple) {
            // Red (Multiple)
            drawCircle(cx, cy, c.radius, 239, 68, 68, 3);
            fillCircle(cx, cy, c.radius, 239, 68, 68, 0.4);
          } else if (isAmbiguous) {
            // Yellow / Amber (Ambiguous)
            drawCircle(cx, cy, c.radius, 234, 179, 8, 3);
            fillCircle(cx, cy, c.radius, 234, 179, 8, 0.4);
          } else {
            // Green (Confident selection)
            drawCircle(cx, cy, c.radius, 34, 197, 94, 3);
            fillCircle(cx, cy, c.radius, 34, 197, 94, 0.4);
          }
        } else {
          // Unselected neutral outline
          drawCircle(cx, cy, c.radius, 100, 116, 139, 1);
        }
      });
    }

    return output;
  }
}
