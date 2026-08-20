import { classifyBubbleROI } from '../lib/omr/bengali-subtraction-classifier';
import { CellROI } from '../lib/omr/geometry-template';

describe('OMR Bubble Ink Classifier — Comprehensive Synthetic Unit Tests', () => {
  const WIDTH = 100;
  const HEIGHT = 100;
  const CELL_ROI: CellROI = {
    id: 'ans_1_A',
    type: 'ANSWER',
    qNo: 1,
    optionLabel: 'A',
    center: { x: 50, y: 50 },
    radius: 20,
    bounds: { x: 30, y: 30, width: 40, height: 40 },
    printedChar: 'A'
  };

  /**
   * Helper to generate a synthetic RGBA image buffer
   */
  function createSyntheticBuffer(
    drawFn: (x: number, y: number, cx: number, cy: number, r: number) => number
  ): Uint8ClampedArray {
    const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
    const cx = CELL_ROI.center.x;
    const cy = CELL_ROI.center.y;
    const r = CELL_ROI.radius;

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const val = drawFn(x, y, cx, cy, r);
        const idx = (y * WIDTH + x) * 4;
        data[idx] = val;     // R
        data[idx + 1] = val; // G
        data[idx + 2] = val; // B
        data[idx + 3] = 255; // A
      }
    }
    return data;
  }

  test('1. Empty bubble (white/blank page with outer ring)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const dist = Math.hypot(x - cx, y - cy);
      // Ring boundary is dark (~50), interior is white (~255)
      if (Math.abs(dist - r) <= 2) return 50;
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.status).toBe('EMPTY');
    expect(result.fillRatio).toBeLessThan(0.15);
    expect(result.netInkScore).toBeLessThan(0.15);
  });

  test('2. Dark mark (fully filled bubble with high opacity)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r) return 20; // Dark pencil/pen ink
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.status).toBe('FILLED');
    expect(result.fillRatio).toBeGreaterThanOrEqual(0.70);
    expect(result.netInkScore).toBeGreaterThanOrEqual(0.50);
  });

  test('3. Very dark mark (black 2B/4B pencil / deep ballpoint)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r) return 5; // Ultra black
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.status).toBe('FILLED');
    expect(result.fillRatio).toBeGreaterThanOrEqual(0.85);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  test('4. Medium mark (typical HB pencil marking)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r * 0.9) return 70; // Medium gray ink
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.status).toBe('FILLED');
    expect(result.netInkScore).toBeGreaterThanOrEqual(0.28);
  });

  test('5. Light mark (faint pencil mark)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r * 0.8) return 130; // Light gray mark
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.netInkScore).toBeGreaterThan(0.18);
  });

  test('6. Partial fill (center core filled)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r * 0.5) return 20; // Center dot
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.netInkScore).toBeGreaterThan(0.12);
  });

  test('7. Outside mark (stray mark outside bubble border)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > r + 5 && dist < r + 15 && x > cx) return 20; // Stray mark outside
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.status).toBe('EMPTY');
    expect(result.fillRatio).toBeLessThan(0.20);
  });

  test('8. Erased mark (residual faint smudging ~210 luminance)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r) return 210; // Erased graphite smudge
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.status).toBe('EMPTY');
    expect(result.netInkScore).toBeLessThan(0.20);
  });

  test('9. Tick mark (thin line passing through center)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const isTick = (x >= cx - 10 && x <= cx + 15) && (Math.abs(y - (cy + (x - cx))) <= 2);
      if (isTick) return 30;
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.fillRatio).toBeLessThan(0.35);
  });

  test('10. Cross mark (X through bubble)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const isCross = Math.abs((x - cx) - (y - cy)) <= 2 || Math.abs((x - cx) + (y - cy)) <= 2;
      if (isCross && Math.hypot(x - cx, y - cy) <= r) return 30;
      return 255;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.fillRatio).toBeLessThan(0.40);
  });

  test('11. Uneven shadow across sheet (gradient illumination)', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const shadow = 180 + (x / WIDTH) * 70; // 180 at left, 250 at right
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r) return 20; // Solid mark
      return shadow;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.status).toBe('FILLED');
    expect(result.netInkScore).toBeGreaterThanOrEqual(0.40);
  });

  test('12. High glare spot near bubble', () => {
    const buffer = createSyntheticBuffer((x, y, cx, cy, r) => {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r) return 255; // White blank bubble
      return 240;
    });

    const result = classifyBubbleROI(buffer, WIDTH, HEIGHT, CELL_ROI);
    expect(result.status).toBe('EMPTY');
  });
});
