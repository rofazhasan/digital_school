import ExcelJS from 'exceljs';
import { ChallengeCategory, ChallengePriority } from '@prisma/client';
import { createChallenge } from './arena-service';

export interface ParsedImportRow {
  rowNumber: number;
  date: string;
  title: string;
  category: ChallengeCategory;
  subject?: string;
  topics?: string[];
  durationMinutes: number;
  scheduledTime?: string;
  priority: ChallengePriority;
  notes?: string;
}

export interface ImportErrorItem {
  rowNumber: number;
  column: string;
  value: any;
  message: string;
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: ParsedImportRow[];
  errors: ImportErrorItem[];
}

const VALID_CATEGORIES = Object.values(ChallengeCategory);
const VALID_PRIORITIES = Object.values(ChallengePriority);

/**
 * Generates the official Student Corner Excel Challenge Template (.xlsx).
 */
export async function generateStudentCornerExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Digital School Student Corner';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Daily Challenges', {
    properties: { defaultRowHeight: 22 },
  });

  // Define Columns
  worksheet.columns = [
    { header: 'Date (YYYY-MM-DD)', key: 'date', width: 18 },
    { header: 'Challenge Title', key: 'title', width: 32 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Subject', key: 'subject', width: 22 },
    { header: 'Topics (Semicolon separated)', key: 'topics', width: 35 },
    { header: 'Duration Minutes', key: 'durationMinutes', width: 18 },
    { header: 'Scheduled Time (HH:mm)', key: 'scheduledTime', width: 22 },
    { header: 'Priority', key: 'priority', width: 16 },
    { header: 'Notes', key: 'notes', width: 35 },
  ];

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // Indigo-600
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Sample Rows
  const sampleRows = [
    {
      date: '2026-09-21',
      title: 'Fajr & Morning Adhkar',
      category: 'SALAT',
      subject: 'Islamic Routine',
      topics: 'Prayer; Sunnah; Adhkar',
      durationMinutes: 25,
      scheduledTime: '05:30',
      priority: 'HIGH',
      notes: 'Pray with concentration',
    },
    {
      date: '2026-09-21',
      title: 'Calculus Integration Practice',
      category: 'STUDY',
      subject: 'Higher Mathematics',
      topics: 'Definite Integrals; Area Calculation',
      durationMinutes: 60,
      scheduledTime: '08:30',
      priority: 'HIGH',
      notes: 'Solve Board Questions 2024',
    },
    {
      date: '2026-09-21',
      title: 'Binary Search Algorithm Mastery',
      category: 'CODING',
      subject: 'Data Structures & Algorithms',
      topics: 'Binary Search; Edge Cases',
      durationMinutes: 45,
      scheduledTime: '15:00',
      priority: 'MEDIUM',
      notes: 'Complete LeetCode 704 and 33',
    },
    {
      date: '2026-09-21',
      title: 'Quran Tadabbur: Surah Ash-Sharh',
      category: 'QURAN',
      subject: 'Quranic Reflection',
      topics: 'Surah Sharh 94:5-6; Tafsir',
      durationMinutes: 20,
      scheduledTime: '19:00',
      priority: 'MEDIUM',
      notes: 'Reflect on ease after hardship',
    },
    {
      date: '2026-09-21',
      title: 'Physics Chapter 4 Revision',
      category: 'REVISION',
      subject: 'Physics 1st Paper',
      topics: 'Newtonian Mechanics; Friction; Momentum',
      durationMinutes: 45,
      scheduledTime: '21:00',
      priority: 'HIGH',
      notes: 'Formulas and CQ problem drill',
    },
  ];

  sampleRows.forEach((row) => worksheet.addRow(row));

  // Add category reference sheet for student guidance
  const refSheet = workbook.addWorksheet('Allowed Values Reference');
  refSheet.columns = [
    { header: 'Allowed Categories', key: 'cat', width: 25 },
    { header: 'Allowed Priorities', key: 'pri', width: 25 },
  ];
  refSheet.getRow(1).font = { bold: true };
  const maxRows = Math.max(VALID_CATEGORIES.length, VALID_PRIORITIES.length);
  for (let i = 0; i < maxRows; i++) {
    refSheet.addRow({
      cat: VALID_CATEGORIES[i] || '',
      pri: VALID_PRIORITIES[i] || '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Validates an uploaded Excel file stream / buffer.
 */
export async function validateImportedExcel(buffer: Buffer): Promise<ImportValidationResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Spreadsheet does not contain any readable worksheets.');
  }

  const validRows: ParsedImportRow[] = [];
  const errors: ImportErrorItem[] = [];

  let rowCount = 0;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    // Guard against giant files exceeding 500 rows
    rowCount++;
    if (rowCount > 500) {
      errors.push({
        rowNumber,
        column: 'File',
        value: rowCount,
        message: 'Maximum batch limit of 500 rows exceeded.',
      });
      return;
    }

    const rawDate = row.getCell(1).text?.trim();
    const rawTitle = row.getCell(2).text?.trim();
    const rawCategory = row.getCell(3).text?.trim().toUpperCase();
    const rawSubject = row.getCell(4).text?.trim();
    const rawTopics = row.getCell(5).text?.trim();
    const rawDuration = row.getCell(6).value;
    const rawTime = row.getCell(7).text?.trim();
    const rawPriority = (row.getCell(8).text?.trim().toUpperCase() || 'MEDIUM') as ChallengePriority;
    const rawNotes = row.getCell(9).text?.trim();

    // Skip completely empty rows
    if (!rawDate && !rawTitle && !rawCategory) return;

    // Validate Date
    let parsedDateStr = rawDate;
    if (!rawDate || isNaN(Date.parse(rawDate))) {
      errors.push({
        rowNumber,
        column: 'Date',
        value: rawDate,
        message: 'Invalid date format. Expected YYYY-MM-DD.',
      });
    }

    // Validate Title
    if (!rawTitle || rawTitle.length < 2) {
      errors.push({
        rowNumber,
        column: 'Title',
        value: rawTitle,
        message: 'Challenge title must be at least 2 characters.',
      });
    }

    // Validate Category
    let category: ChallengeCategory = ChallengeCategory.STUDY;
    if (!rawCategory || !VALID_CATEGORIES.includes(rawCategory as ChallengeCategory)) {
      errors.push({
        rowNumber,
        column: 'Category',
        value: rawCategory,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    } else {
      category = rawCategory as ChallengeCategory;
    }

    // Validate Duration
    const durationNum = Number(rawDuration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 1440) {
      errors.push({
        rowNumber,
        column: 'Duration Minutes',
        value: rawDuration,
        message: 'Duration must be an integer between 1 and 1440 minutes.',
      });
    }

    // Validate Priority
    let priority: ChallengePriority = ChallengePriority.MEDIUM;
    if (rawPriority && !VALID_PRIORITIES.includes(rawPriority)) {
      errors.push({
        rowNumber,
        column: 'Priority',
        value: rawPriority,
        message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
      });
    } else if (rawPriority) {
      priority = rawPriority;
    }

    // Topics split
    const topicsList = rawTopics ? rawTopics.split(';').map((t) => t.trim()).filter(Boolean) : [];

    // If this row has no errors, push to valid
    const hasRowErrors = errors.some((e) => e.rowNumber === rowNumber);
    if (!hasRowErrors) {
      validRows.push({
        rowNumber,
        date: parsedDateStr,
        title: rawTitle,
        category,
        subject: rawSubject || undefined,
        topics: topicsList.length > 0 ? topicsList : undefined,
        durationMinutes: durationNum || 30,
        scheduledTime: rawTime || undefined,
        priority,
        notes: rawNotes || undefined,
      });
    }
  });

  return {
    totalRows: rowCount,
    validRows,
    errors,
  };
}

/**
 * Commits a list of validated parsed rows into the student's arenas.
 */
export async function commitBatchImport(studentProfileId: string, rows: ParsedImportRow[]) {
  const created: any[] = [];

  for (const row of rows) {
    const challenge = await createChallenge(studentProfileId, {
      date: row.date,
      title: row.title,
      category: row.category,
      durationMinutes: row.durationMinutes,
      scheduledTime: row.scheduledTime,
      priority: row.priority,
      notes: row.notes,
      subjectNames: row.subject ? [row.subject] : [],
      topicNames: row.topics || [],
    });
    created.push(challenge);
  }

  return {
    success: true,
    count: created.length,
  };
}
