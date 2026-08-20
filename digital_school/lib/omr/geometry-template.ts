/**
 * OMR Template Geometry Generator
 * 
 * Single source of truth for OMR sheet geometry definitions.
 * Canonical coordinate space: 2480 x 3508 (300 DPI A4/Legal page).
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Rect2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MarkerDef {
  id: 'TL' | 'TR' | 'BL' | 'BR';
  x: number;
  y: number;
  width: number;
  height: number;
  center: Point2D;
}

export interface CellROI {
  id: string;
  type: 'ROLL' | 'REG' | 'SET' | 'ANSWER';
  qNo?: number;
  colIndex?: number;
  rowIndex?: number;
  optionLabel: string;
  center: Point2D;
  radius: number;
  bounds: Rect2D;
  printedChar: string; // Bengali printed character (e.g. '০'-'৯' or 'ক'-'ঘ')
}

export interface OMRTemplateGeometry {
  templateId: string;
  version: number;
  name: string;
  canonical: {
    width: number;
    height: number;
  };
  markers: MarkerDef[];
  qr: Rect2D;
  roll: {
    rows: number;
    columns: number;
    cells: CellROI[];
  };
  registration: {
    rows: number;
    columns: number;
    cells: CellROI[];
  };
  answers: {
    questionCount: number;
    options: string[];
    bengaliOptions: string[];
    columns: number;
    questionsPerColumn: number;
    cells: CellROI[];
  };
  set: {
    options: string[];
    cells: CellROI[];
  };
}

export const CANONICAL_WIDTH = 2480;
export const CANONICAL_HEIGHT = 3508;

export const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const BENGALI_OPTIONS = ['ক', 'খ', 'গ', 'ঘ'];
export const ENGLISH_OPTIONS = ['A', 'B', 'C', 'D'];

/**
 * Generates exact versioned template geometry metadata.
 * Default templateId: "C_11_12" (Production Reference Template)
 */
export function generateTemplateGeometry(
  templateId: string = 'C_11_12',
  version: number = 1,
  examId?: string,
  setId?: string
): OMRTemplateGeometry {
  // 1. Four Corner Markers
  const markerSize = 90;
  const marginX = 100;
  const marginY = 100;

  const markers: MarkerDef[] = [
    {
      id: 'TL',
      x: marginX,
      y: marginY,
      width: markerSize,
      height: markerSize,
      center: { x: marginX + markerSize / 2, y: marginY + markerSize / 2 }
    },
    {
      id: 'TR',
      x: CANONICAL_WIDTH - marginX - markerSize,
      y: marginY,
      width: markerSize,
      height: markerSize,
      center: { x: CANONICAL_WIDTH - marginX - markerSize / 2, y: marginY + markerSize / 2 }
    },
    {
      id: 'BL',
      x: marginX,
      y: CANONICAL_HEIGHT - marginY - markerSize,
      width: markerSize,
      height: markerSize,
      center: { x: marginX + markerSize / 2, y: CANONICAL_HEIGHT - marginY - markerSize / 2 }
    },
    {
      id: 'BR',
      x: CANONICAL_WIDTH - marginX - markerSize,
      y: CANONICAL_HEIGHT - marginY - markerSize,
      width: markerSize,
      height: markerSize,
      center: { x: CANONICAL_WIDTH - marginX - markerSize / 2, y: CANONICAL_HEIGHT - marginY - markerSize / 2 }
    }
  ];

  // 2. QR Code ROI
  const qr: Rect2D = {
    x: 1950,
    y: 380,
    width: 260,
    height: 260
  };

  // 3. Set Code Cells (A, B, C, D)
  const setCells: CellROI[] = [];
  const setStartX = 1110;
  const setY = 460;
  const setStepX = 70;
  const bubbleRadius = 22;

  BENGALI_OPTIONS.forEach((bengaliLabel, idx) => {
    const cx = setStartX + idx * setStepX;
    const cy = setY;
    setCells.push({
      id: `set_${ENGLISH_OPTIONS[idx]}`,
      type: 'SET',
      optionLabel: ENGLISH_OPTIONS[idx],
      center: { x: cx, y: cy },
      radius: bubbleRadius,
      bounds: { x: cx - bubbleRadius, y: cy - bubbleRadius, width: bubbleRadius * 2, height: bubbleRadius * 2 },
      printedChar: bengaliLabel
    });
  });

  // 4. Roll Number Cells (6 Columns x 10 Rows)
  const rollCells: CellROI[] = [];
  const rollCols = 6;
  const rollRows = 10;
  const rollStartX = 300;
  const rollStartY = 850;
  const rollStepX = 100;
  const rollStepY = 62;

  for (let col = 0; col < rollCols; col++) {
    for (let digit = 0; digit < rollRows; digit++) {
      const cx = rollStartX + col * rollStepX;
      const cy = rollStartY + digit * rollStepY;
      rollCells.push({
        id: `roll_c${col}_d${digit}`,
        type: 'ROLL',
        colIndex: col,
        rowIndex: digit,
        optionLabel: digit.toString(),
        center: { x: cx, y: cy },
        radius: bubbleRadius,
        bounds: { x: cx - bubbleRadius, y: cy - bubbleRadius, width: bubbleRadius * 2, height: bubbleRadius * 2 },
        printedChar: BENGALI_DIGITS[digit]
      });
    }
  }

  // 5. Registration Number Cells (7 Columns x 10 Rows)
  const regCells: CellROI[] = [];
  const regCols = 7;
  const regRows = 10;
  const regStartX = 980;
  const regStartY = 850;
  const regStepX = 98;
  const regStepY = 62;

  for (let col = 0; col < regCols; col++) {
    for (let digit = 0; digit < regRows; digit++) {
      const cx = regStartX + col * regStepX;
      const cy = regStartY + digit * regStepY;
      regCells.push({
        id: `reg_c${col}_d${digit}`,
        type: 'REG',
        colIndex: col,
        rowIndex: digit,
        optionLabel: digit.toString(),
        center: { x: cx, y: cy },
        radius: bubbleRadius,
        bounds: { x: cx - bubbleRadius, y: cy - bubbleRadius, width: bubbleRadius * 2, height: bubbleRadius * 2 },
        printedChar: BENGALI_DIGITS[digit]
      });
    }
  }

  // 6. Answer Grid (4 Columns x 25 Questions x 4 Options)
  const answerCells: CellROI[] = [];
  const ansColumns = 4;
  const qsPerCol = 25;
  const colWidth = 510;
  const ansStartX = 240;
  const ansStartY = 1690;
  const optStartXInCol = 145;
  const optStepX = 76;
  const ansRowStepY = 61.5;

  for (let col = 0; col < ansColumns; col++) {
    for (let row = 0; row < qsPerCol; row++) {
      const qNo = col * qsPerCol + row + 1;
      for (let optIdx = 0; optIdx < 4; optIdx++) {
        const cx = ansStartX + col * colWidth + optStartXInCol + optIdx * optStepX;
        const cy = ansStartY + row * ansRowStepY;
        const optLabel = ENGLISH_OPTIONS[optIdx];
        const bengaliLabel = BENGALI_OPTIONS[optIdx];

        answerCells.push({
          id: `ans_q${qNo}_${optLabel}`,
          type: 'ANSWER',
          qNo,
          colIndex: col,
          rowIndex: row,
          optionLabel: optLabel,
          center: { x: cx, y: cy },
          radius: bubbleRadius,
          bounds: { x: cx - bubbleRadius, y: cy - bubbleRadius, width: bubbleRadius * 2, height: bubbleRadius * 2 },
          printedChar: bengaliLabel
        });
      }
    }
  }

  return {
    templateId: templateId + (setId ? `_${setId}` : ''),
    version,
    name: `Rofaz Academy OMR Template ${templateId}`,
    canonical: {
      width: CANONICAL_WIDTH,
      height: CANONICAL_HEIGHT
    },
    markers,
    qr,
    roll: {
      rows: rollRows,
      columns: rollCols,
      cells: rollCells
    },
    registration: {
      rows: regRows,
      columns: regCols,
      cells: regCells
    },
    answers: {
      questionCount: 100,
      options: ENGLISH_OPTIONS,
      bengaliOptions: BENGALI_OPTIONS,
      columns: ansColumns,
      questionsPerColumn: qsPerCol,
      cells: answerCells
    },
    set: {
      options: ENGLISH_OPTIONS,
      cells: setCells
    }
  };
}
