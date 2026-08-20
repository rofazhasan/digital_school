import { DigitBubbleReader } from '../lib/omr/digit-bubble-reader';
import { CellROI, BENGALI_DIGITS } from '../lib/omr/geometry-template';
import { StudentIdentityResolver } from '../lib/omr/student-identity-resolver';

describe('OMR Roll & Registration Digit Processing & Identity Unit Tests', () => {
  const WIDTH = 300;
  const HEIGHT = 500;

  function createDigitCells(numColumns: number, type: 'ROLL' | 'REG'): CellROI[] {
    const cells: CellROI[] = [];
    const cellWidth = 30;
    const cellHeight = 30;
    const radius = 10;

    for (let col = 0; col < numColumns; col++) {
      for (let digit = 0; digit <= 9; digit++) {
        const cx = 20 + col * 40 + cellWidth / 2;
        const cy = 20 + digit * 40 + cellHeight / 2;
        cells.push({
          id: `${type}_c${col}_r${digit}`,
          type,
          colIndex: col,
          rowIndex: digit,
          optionLabel: digit.toString(),
          center: { x: cx, y: cy },
          radius,
          bounds: { x: 20 + col * 40, y: 20 + digit * 40, width: cellWidth, height: cellHeight },
          printedChar: BENGALI_DIGITS[digit] || digit.toString()
        });
      }
    }
    return cells;
  }

  function renderMatrixBuffer(
    cells: CellROI[],
    targetDigits: number[]
  ): Uint8ClampedArray {
    const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
    data.fill(255); // White background

    cells.forEach(cell => {
      const col = cell.colIndex ?? 0;
      const row = cell.rowIndex ?? 0;
      const isTarget = targetDigits[col] === row;

      const cx = cell.center.x;
      const cy = cell.center.y;
      const r = cell.radius;

      for (let y = Math.max(0, Math.floor(cy - r - 2)); y <= Math.min(HEIGHT - 1, Math.ceil(cy + r + 2)); y++) {
        for (let x = Math.max(0, Math.floor(cx - r - 2)); x <= Math.min(WIDTH - 1, Math.ceil(cx + r + 2)); x++) {
          const dist = Math.hypot(x - cx, y - cy);
          const idx = (y * WIDTH + x) * 4;

          if (isTarget && dist <= r) {
            // Filled bubble
            data[idx] = 10;
            data[idx + 1] = 10;
            data[idx + 2] = 10;
          } else if (Math.abs(dist - r) <= 1.5) {
            // Boundary ring
            data[idx] = 60;
            data[idx + 1] = 60;
            data[idx + 2] = 60;
          }
        }
      }
    });

    return data;
  }

  test('1. Reads every single digit 0 through 9 deterministically in Roll matrix', () => {
    const cells = createDigitCells(6, 'ROLL');
    const testCases = [
      [0, 1, 2, 3, 4, 5],
      [6, 7, 8, 9, 0, 1],
      [9, 8, 7, 6, 5, 4]
    ];

    for (const testDigits of testCases) {
      const expectedStr = testDigits.join('');
      const buffer = renderMatrixBuffer(cells, testDigits);
      const result = DigitBubbleReader.readMatrix(buffer, WIDTH, HEIGHT, 6, cells);

      expect(result.value).toBe(expectedStr);
      expect(result.isComplete).toBe(true);
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0.75);
    }
  });

  test('2. Roll number with all zeros (000000) and all nines (999999)', () => {
    const cells = createDigitCells(6, 'ROLL');

    // All zeros
    const zerosBuffer = renderMatrixBuffer(cells, [0, 0, 0, 0, 0, 0]);
    const zerosResult = DigitBubbleReader.readMatrix(zerosBuffer, WIDTH, HEIGHT, 6, cells);
    expect(zerosResult.value).toBe('000000');
    expect(zerosResult.isComplete).toBe(true);

    // All nines
    const ninesBuffer = renderMatrixBuffer(cells, [9, 9, 9, 9, 9, 9]);
    const ninesResult = DigitBubbleReader.readMatrix(ninesBuffer, WIDTH, HEIGHT, 6, cells);
    expect(ninesResult.value).toBe('999999');
    expect(ninesResult.isComplete).toBe(true);
  });

  test('3. 7-digit Registration number matrix reader', () => {
    const cells = createDigitCells(7, 'REG');
    const targetReg = [7, 8, 9, 0, 1, 2, 3];
    const buffer = renderMatrixBuffer(cells, targetReg);

    const result = DigitBubbleReader.readMatrix(buffer, WIDTH, HEIGHT, 7, cells);
    expect(result.value).toBe('7890123');
    expect(result.isComplete).toBe(true);
    expect(result.overallConfidence).toBeGreaterThanOrEqual(0.75);
  });

  test('4. Double mark detection in a digit column flags MULTIPLE status', () => {
    const cells = createDigitCells(6, 'ROLL');
    const buffer = renderMatrixBuffer(cells, [1, 2, 3, 4, 5, 6]);

    // Manually double-fill column 0 with both digit 1 and digit 7
    const col0Row7 = cells.find(c => c.colIndex === 0 && c.rowIndex === 7)!;
    const cx = col0Row7.center.x;
    const cy = col0Row7.center.y;
    for (let y = Math.floor(cy - col0Row7.radius); y <= Math.ceil(cy + col0Row7.radius); y++) {
      for (let x = Math.floor(cx - col0Row7.radius); x <= Math.ceil(cx + col0Row7.radius); x++) {
        if (Math.hypot(x - cx, y - cy) <= col0Row7.radius) {
          const idx = (y * WIDTH + x) * 4;
          buffer[idx] = 10;
          buffer[idx + 1] = 10;
          buffer[idx + 2] = 10;
        }
      }
    }

    const result = DigitBubbleReader.readMatrix(buffer, WIDTH, HEIGHT, 6, cells);
    expect(result.columns[0].status).toBe('MULTIPLE');
    expect(result.columns[0].selectedDigit).toBe('?');
    expect(result.isComplete).toBe(false);
  });

  test('5. Student Identity Resolver prevents silent mismatch and resolves correct student', async () => {
    const mockDb = {
      students: [
        {
          id: 'std_001',
          roll: '230145',
          registrationNo: '7890123',
          classId: 'class_science_12',
          sectionId: 'sec_a',
          user: { name: 'Rahim Ahmed' }
        },
        {
          id: 'std_002',
          roll: '230146',
          registrationNo: '7890124',
          classId: 'class_science_12',
          sectionId: 'sec_a',
          user: { name: 'Karim Ullah' }
        }
      ],
      exams: [
        {
          id: 'exam_phy_101',
          classId: 'class_science_12',
          sectionId: 'sec_a'
        }
      ],
      examSets: []
    };

    const resolved = await StudentIdentityResolver.resolve({
      qr: { examId: 'exam_phy_101', classId: 'class_science_12', sectionId: 'sec_a' },
      roll: '230145',
      registration: '7890123'
    }, mockDb);

    expect(resolved.success).toBe(true);
    expect(resolved.studentId).toBe('std_001');
    expect(resolved.studentName).toBe('Rahim Ahmed');

    const unknownRoll = await StudentIdentityResolver.resolve({
      qr: { examId: 'exam_phy_101', classId: 'class_science_12', sectionId: 'sec_a' },
      roll: '999999'
    }, mockDb);

    expect(unknownRoll.success).toBe(false);
    expect(unknownRoll.studentId).toBeNull();
  });
});
