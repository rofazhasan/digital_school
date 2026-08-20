/**
 * Dynamic OMR Template Schema & Intelligence Model
 * 
 * Provides extensible semantic region definitions, normalized [0.0..1.0] coordinate spaces,
 * relationships, auto-detection algorithms, and template auto-validation rules.
 */

export type SemanticRegionType =
  | 'PAGE'
  | 'FIDUCIAL'
  | 'QR'
  | 'BARCODE'
  | 'ROLL'
  | 'REGISTRATION'
  | 'STUDENT_ID'
  | 'SET_ID'
  | 'MCQ'
  | 'MMCQ'
  | 'MTF'
  | 'INTEGER'
  | 'AR'
  | 'CMA'
  | 'MPC'
  | 'TEXT'
  | 'DATE'
  | 'SIGNATURE'
  | 'CUSTOM_BUBBLE_MATRIX'
  | 'CUSTOM_GRID'
  | 'IGNORE';

export type ProcessingStrategy =
  | 'QR_DECODER'
  | 'BUBBLE_MATRIX'
  | 'BUBBLE_GRID'
  | 'INTEGER_DIGIT_GRID'
  | 'MATCHING_COLUMN'
  | 'OCR_TEXT'
  | 'PASS_THROUGH';

export interface NormalizedGeometry {
  x: number; // 0.0 - 1.0 relative to canonical page width
  y: number; // 0.0 - 1.0 relative to canonical page height
  width: number; // 0.0 - 1.0
  height: number; // 0.0 - 1.0
  polygonPoints?: Array<{ x: number; y: number }>;
}

export interface SemanticRegionDefinition {
  id: string;
  type: SemanticRegionType;
  name: string;
  geometry: NormalizedGeometry;
  processingStrategy: ProcessingStrategy;
  questionRange?: {
    start: number;
    end: number;
  };
  optionConfiguration?: {
    optionCount: number; // e.g. 4
    labels: string[]; // ["A", "B", "C", "D"] or ["ক", "খ", "গ", "ঘ"]
    orientation: 'HORIZONTAL' | 'VERTICAL';
    bubbleRadiusNormalized: number;
    spacingNormalized: { x: number; y: number };
  };
  matrixConfiguration?: {
    columns: number;
    rows: number;
    digitZeroToNine: boolean;
  };
  confidenceRequirements: {
    minFillThreshold: number; // e.g. 0.35
    minMarginThreshold: number; // e.g. 0.20
    requiredConfidence: number; // e.g. 0.85
  };
  relationships?: {
    resolves?: 'STUDENT_IDENTITY' | 'EXAM_CONTEXT' | 'QUESTION_RESPONSES';
    mapsToQuestionIds?: string[];
    linkedRegionId?: string;
  };
}

export interface DynamicOMRTemplate {
  templateId: string;
  templateVersion: string; // e.g. "2.0.0"
  name: string;
  canonicalWidth: number; // Standard 2480 for A4 300DPI
  canonicalHeight: number; // Standard 3508 for A4 300DPI
  schemaVersion: string; // "v2_semantic"
  createdAt: string;
  updatedAt: string;
  fiducials: {
    tl: { x: number; y: number; size: number };
    tr: { x: number; y: number; size: number };
    bl: { x: number; y: number; size: number };
    br: { x: number; y: number; size: number };
  };
  regions: SemanticRegionDefinition[];
  metadata?: Record<string, any>;
}

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING';
  code: string;
  message: string;
  regionId?: string;
}

export interface TemplateValidationReport {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  totalRegions: number;
  coveragePercentage: number;
}

export class TemplateValidator {
  /**
   * Validates a dynamic template against geometric and semantic constraints.
   */
  public static validate(template: DynamicOMRTemplate): TemplateValidationReport {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    if (!template.templateId) {
      errors.push({ severity: 'ERROR', code: 'MISSING_ID', message: 'Template ID is required.' });
    }

    if (!template.regions || template.regions.length === 0) {
      errors.push({ severity: 'ERROR', code: 'EMPTY_REGIONS', message: 'Template must contain at least one semantic region.' });
      return { isValid: false, errors, warnings, totalRegions: 0, coveragePercentage: 0 };
    }

    // Check Fiducials
    if (!template.fiducials || !template.fiducials.tl || !template.fiducials.tr || !template.fiducials.bl || !template.fiducials.br) {
      errors.push({ severity: 'ERROR', code: 'MISSING_FIDUCIALS', message: 'All 4 corner fiducials (TL, TR, BL, BR) must be defined.' });
    }

    // Check for essential regions
    const hasQR = template.regions.some(r => r.type === 'QR');
    const hasRoll = template.regions.some(r => r.type === 'ROLL');
    const hasAnswers = template.regions.some(r => ['MCQ', 'MMCQ', 'AR', 'INTEGER', 'MTF'].includes(r.type));

    if (!hasQR) {
      warnings.push({ severity: 'WARNING', code: 'NO_QR_REGION', message: 'Template lacks a QR context region. Context resolution will require manual selection.' });
    }

    if (!hasRoll) {
      warnings.push({ severity: 'WARNING', code: 'NO_ROLL_REGION', message: 'Template lacks a candidate Roll number region.' });
    }

    if (!hasAnswers) {
      errors.push({ severity: 'ERROR', code: 'NO_ANSWER_REGIONS', message: 'Template must define at least one answer response region (MCQ, MMCQ, etc.).' });
    }

    // Validate each region's normalized coordinates
    template.regions.forEach(region => {
      const g = region.geometry;
      if (g.x < 0 || g.y < 0 || g.width <= 0 || g.height <= 0 || (g.x + g.width) > 1.01 || (g.y + g.height) > 1.01) {
        errors.push({
          severity: 'ERROR',
          code: 'OUT_OF_BOUNDS',
          message: `Region '${region.name}' (${region.id}) extends outside the normalized page boundary [0.0, 1.0].`,
          regionId: region.id
        });
      }

      if (region.type === 'QR' && (g.width < 0.05 || g.height < 0.05)) {
        warnings.push({
          severity: 'WARNING',
          code: 'QR_TOO_SMALL',
          message: `QR region '${region.name}' is smaller than 5% of page width, which may impede camera decoding.`,
          regionId: region.id
        });
      }
    });

    // Check for critical overlapping regions
    for (let i = 0; i < template.regions.length; i++) {
      for (let j = i + 1; j < template.regions.length; j++) {
        const r1 = template.regions[i];
        const r2 = template.regions[j];
        if (r1.type === 'IGNORE' || r2.type === 'IGNORE') continue;

        const overlapX = Math.max(0, Math.min(r1.geometry.x + r1.geometry.width, r2.geometry.x + r2.geometry.width) - Math.max(r1.geometry.x, r2.geometry.x));
        const overlapY = Math.max(0, Math.min(r1.geometry.y + r1.geometry.height, r2.geometry.y + r2.geometry.height) - Math.max(r1.geometry.y, r2.geometry.y));
        const overlapArea = overlapX * overlapY;

        if (overlapArea > 0.005) {
          warnings.push({
            severity: 'WARNING',
            code: 'REGION_OVERLAP',
            message: `Region '${r1.name}' and '${r2.name}' overlap by ${(overlapArea * 100).toFixed(2)}% of the page area.`,
            regionId: r1.id
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalRegions: template.regions.length,
      coveragePercentage: 100
    };
  }
}

export class AutoDetectorAssistant {
  /**
   * Automatically estimates bubble rows, columns, radius, and spacing within a drawn bounding box.
   */
  public static detectBubbleGridStructure(
    bounds: NormalizedGeometry,
    questionCount: number = 25,
    optionsPerQuestion: number = 4
  ): {
    estimatedColumns: number;
    estimatedRows: number;
    bubbleRadiusNormalized: number;
    spacingNormalized: { x: number; y: number };
    cells: Array<{ questionNo: number; option: string; x: number; y: number }>;
  } {
    const columns = optionsPerQuestion;
    const rows = questionCount;

    const spacingX = bounds.width / columns;
    const spacingY = bounds.height / rows;
    const radius = Math.min(spacingX, spacingY) * 0.35;

    const cells: Array<{ questionNo: number; option: string; x: number; y: number }> = [];
    const optionLetters = ['A', 'B', 'C', 'D', 'E'];

    for (let r = 0; r < rows; r++) {
      const qNo = r + 1;
      for (let c = 0; c < columns; c++) {
        const cx = bounds.x + (c + 0.5) * spacingX;
        const cy = bounds.y + (r + 0.5) * spacingY;
        cells.push({
          questionNo: qNo,
          option: optionLetters[c] || 'A',
          x: cx,
          y: cy
        });
      }
    }

    return {
      estimatedColumns: columns,
      estimatedRows: rows,
      bubbleRadiusNormalized: radius,
      spacingNormalized: { x: spacingX, y: spacingY },
      cells
    };
  }
}
