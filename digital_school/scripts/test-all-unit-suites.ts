/**
 * ROFAZ ACADEMY — RUN ALL UNIT SUITES
 * Directly executes all unit test suites in __tests__/ with rich assertions.
 */

import { generateTemplateGeometry, CANONICAL_WIDTH, CANONICAL_HEIGHT } from '../lib/omr/geometry-template';
import { classifyBubbleROI } from '../lib/omr/bengali-subtraction-classifier';
import { DigitBubbleReader } from '../lib/omr/digit-bubble-reader';
import { StudentIdentityResolver } from '../lib/omr/student-identity-resolver';

let passed = 0;
let total = 0;

function it(name: string, fn: () => void | Promise<void>) {
  total++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        passed++;
        console.log(`  ✓ [PASS] ${name}`);
      }).catch(err => {
        console.error(`  ✗ [FAIL] ${name}:`, err.message);
      });
    } else {
      passed++;
      console.log(`  ✓ [PASS] ${name}`);
    }
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${name}:`, err.message);
  }
}

async function run() {
  console.log('=== RUNNING OMR UNIT TEST SUITES (BUBBLE, DIGIT, TEMPLATE, QR) ===\n');

  console.log('1. BUBBLE CLASSIFIER SUITE:');
  const dummyCell = {
    id: 'c1', type: 'ANSWER' as const, qNo: 1, optionLabel: 'A',
    center: { x: 50, y: 50 }, radius: 20, bounds: { x: 30, y: 30, width: 40, height: 40 }, printedChar: 'A'
  };
  const W = 100, H = 100;
  const makeBuf = (fn: (x: number, y: number, cx: number, cy: number, r: number) => number) => {
    const d = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const v = fn(x, y, 50, 50, 20);
        const idx = (y * W + x) * 4;
        d[idx] = v; d[idx + 1] = v; d[idx + 2] = v; d[idx + 3] = 255;
      }
    }
    return d;
  };

  it('Empty bubble is EMPTY', () => {
    const res = classifyBubbleROI(makeBuf((x, y, cx, cy, r) => Math.abs(Math.hypot(x - cx, y - cy) - r) <= 2 ? 50 : 255), W, H, dummyCell);
    if (res.status !== 'EMPTY') throw new Error(`Expected EMPTY got ${res.status}`);
  });

  it('Dark pencil mark is FILLED', () => {
    const res = classifyBubbleROI(makeBuf((x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) <= r ? 20 : 255), W, H, dummyCell);
    if (res.status !== 'FILLED') throw new Error(`Expected FILLED got ${res.status}`);
  });

  it('Medium mark is FILLED', () => {
    const res = classifyBubbleROI(makeBuf((x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) <= r * 0.9 ? 70 : 255), W, H, dummyCell);
    if (res.status !== 'FILLED') throw new Error(`Expected FILLED got ${res.status}`);
  });

  it('Erased smudge is EMPTY', () => {
    const res = classifyBubbleROI(makeBuf((x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) <= r ? 210 : 255), W, H, dummyCell);
    if (res.status !== 'EMPTY') throw new Error(`Expected EMPTY got ${res.status}`);
  });

  console.log('\n2. ROLL & REGISTRATION SUITE:');
  const createCells = (numCols: number, type: 'ROLL' | 'REG') => {
    const cells: any[] = [];
    for (let c = 0; c < numCols; c++) {
      for (let d = 0; d <= 9; d++) {
        cells.push({
          id: `${type}_${c}_${d}`, type, colIndex: c, rowIndex: d, optionLabel: d.toString(),
          center: { x: 20 + c * 30 + 10, y: 20 + d * 30 + 10 }, radius: 10, bounds: { x: 20 + c * 30, y: 20 + d * 30, width: 20, height: 20 }, printedChar: d.toString()
        });
      }
    }
    return cells;
  };

  const renderBuf = (cells: any[], digits: number[], w: number, h: number) => {
    const d = new Uint8ClampedArray(w * h * 4);
    d.fill(255);
    cells.forEach(cell => {
      const isTarget = digits[cell.colIndex] === cell.rowIndex;
      const cx = cell.center.x, cy = cell.center.y, r = cell.radius;
      for (let y = Math.max(0, cy - r); y <= Math.min(h - 1, cy + r); y++) {
        for (let x = Math.max(0, cx - r); x <= Math.min(w - 1, cx + r); x++) {
          if (Math.hypot(x - cx, y - cy) <= r) {
            const idx = (y * w + x) * 4;
            if (isTarget) { d[idx] = 10; d[idx + 1] = 10; d[idx + 2] = 10; }
          }
        }
      }
    });
    return d;
  };

  it('Extracts 6-digit Roll "307418"', () => {
    const rollCells = createCells(6, 'ROLL');
    const buf = renderBuf(rollCells, [3, 0, 7, 4, 1, 8], 200, 350);
    const res = DigitBubbleReader.readMatrix(buf, 200, 350, 6, rollCells);
    if (res.value !== '307418') throw new Error(`Expected 307418 got ${res.value}`);
  });

  it('Extracts 7-digit Registration "7890123"', () => {
    const regCells = createCells(7, 'REG');
    const buf = renderBuf(regCells, [7, 8, 9, 0, 1, 2, 3], 250, 350);
    const res = DigitBubbleReader.readMatrix(buf, 250, 350, 7, regCells);
    if (res.value !== '7890123') throw new Error(`Expected 7890123 got ${res.value}`);
  });

  console.log('\n3. TEMPLATE & QR SECURITY SUITE:');
  it('Validates C_11_12 geometry dimensions', () => {
    const t = generateTemplateGeometry('C_11_12');
    if (t.canonical.width !== CANONICAL_WIDTH || t.canonical.height !== CANONICAL_HEIGHT) {
      throw new Error(`Unexpected dimensions`);
    }
  });

  await it('Rejects tampered QR payload mismatch', async () => {
    const mockDb = {
      students: [{ id: 's1', roll: '101', classId: 'cls_A', user: { name: 'A' } }],
      exams: [{ id: 'e1', classId: 'cls_B' }],
      examSets: []
    };
    const res = await StudentIdentityResolver.resolve({
      qr: { examId: 'e1', classId: 'cls_B' },
      roll: '101'
    }, mockDb);
    if (res.success || res.studentId) throw new Error(`Should have rejected`);
  });

  console.log(`\n=== UNIT SUITES SUMMARY: ${passed} / ${total} PASSED ===\n`);
}

run();
