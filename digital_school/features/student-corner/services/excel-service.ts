import ExcelJS from 'exceljs';
import { ChallengeCategory, ChallengePriority, DayMode } from '@prisma/client';
import db from '@/lib/db';
import { startOfDay } from 'date-fns';
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

  // Intelligently select the target challenge worksheet (handles Apple Numbers and multi-sheet exports)
  let worksheet = workbook.worksheets.find((ws) => {
    const name = ws.name.toLowerCase();
    return name.includes('challenge') || name.includes('daily');
  });

  if (!worksheet) {
    worksheet = workbook.worksheets.find((ws) => {
      const name = ws.name.toLowerCase();
      if (name.includes('summary') || name.includes('reference')) return false;
      const r1 = ws.getRow(1);
      const text = [1, 2, 3, 4, 5, 6].map((c) => r1.getCell(c).text?.toLowerCase() || '').join(' ');
      return text.includes('challenge') || (text.includes('date') && text.includes('category'));
    });
  }

  if (!worksheet) {
    worksheet = workbook.worksheets.find(
      (ws) => !ws.name.toLowerCase().includes('summary') && !ws.name.toLowerCase().includes('reference')
    ) || workbook.worksheets[0];
  }

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

    // Extract cell values with support for Date objects from Numbers / Excel
    const cellVal1 = row.getCell(1).value;
    let rawDate = '';
    if (cellVal1 instanceof Date) {
      rawDate = cellVal1.toISOString().slice(0, 10);
    } else if (typeof cellVal1 === 'string') {
      rawDate = cellVal1.trim();
    } else if (row.getCell(1).text) {
      rawDate = row.getCell(1).text.trim();
    }

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
    } else {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        parsedDateStr = parsed.toISOString().slice(0, 10);
      }
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
 * Commits a list of validated parsed rows into the student's arenas in a high-performance batch.
 * Pre-caches arenas, subjects, and topics to avoid sequential roundtrips.
 */
export async function commitBatchImport(studentProfileId: string, rows: ParsedImportRow[]) {
  if (!rows || rows.length === 0) {
    return { success: true, count: 0 };
  }

  // 1. Group rows by canonical date
  const dateMap = new Map<string, ParsedImportRow[]>();
  for (const row of rows) {
    const canonical = startOfDay(new Date(row.date)).toISOString().slice(0, 10);
    const list = dateMap.get(canonical) || [];
    list.push(row);
    dateMap.set(canonical, list);
  }

  // 2. Fetch or create DailyArena for all unique dates in this batch
  const canonicalDates = Array.from(dateMap.keys()).map((d) => startOfDay(new Date(d)));

  const existingArenas = await db.dailyArena.findMany({
    where: {
      studentProfileId,
      date: { in: canonicalDates },
    },
    select: {
      id: true,
      date: true,
      mode: true,
      isLocked: true,
      totalCount: true,
    },
  });

  const arenaByDateStr = new Map<string, typeof existingArenas[0]>();
  for (const a of existingArenas) {
    arenaByDateStr.set(startOfDay(new Date(a.date)).toISOString().slice(0, 10), a);
  }

  // Find profile defaultDayMode once
  let defaultMode = DayMode.NORMAL;
  const profile = await db.studentCornerProfile.findUnique({
    where: { studentProfileId },
    select: { defaultDayMode: true },
  });
  if (profile?.defaultDayMode) defaultMode = profile.defaultDayMode;

  // Create any missing arenas
  for (const dateKey of dateMap.keys()) {
    if (!arenaByDateStr.has(dateKey)) {
      const canonicalDate = startOfDay(new Date(dateKey));
      const newArena = await db.dailyArena.create({
        data: {
          studentProfileId,
          date: canonicalDate,
          mode: defaultMode,
          isLocked: defaultMode === DayMode.LOCKED,
        },
        select: {
          id: true,
          date: true,
          mode: true,
          isLocked: true,
          totalCount: true,
        },
      });
      arenaByDateStr.set(dateKey, newArena);
    }
  }

  // 3. Batch cache subjects and topics
  const allSubjectNames = Array.from(
    new Set(
      rows
        .map((r) => r.subject?.trim())
        .filter((s): s is string => Boolean(s))
    )
  );

  const subjectMap = new Map<string, string>(); // name -> id
  if (allSubjectNames.length > 0) {
    const existingSubs = await db.studentCornerSubject.findMany({
      where: {
        studentProfileId,
        name: { in: allSubjectNames },
      },
      select: { id: true, name: true },
    });
    for (const sub of existingSubs) {
      subjectMap.set(sub.name, sub.id);
    }

    // Create missing subjects
    for (const subName of allSubjectNames) {
      if (!subjectMap.has(subName)) {
        const createdSub = await db.studentCornerSubject.create({
          data: { studentProfileId, name: subName },
          select: { id: true, name: true },
        });
        subjectMap.set(createdSub.name, createdSub.id);
      }
    }
  }

  // Topic cache: "subjectId:topicName" -> topicId
  const topicCache = new Map<string, string>();
  const allTopicPairs: { subjectId: string; topicName: string }[] = [];
  for (const row of rows) {
    if (row.subject && row.topics && row.topics.length > 0) {
      const subId = subjectMap.get(row.subject.trim());
      if (subId) {
        for (const top of row.topics) {
          const trimmed = top.trim();
          if (trimmed) allTopicPairs.push({ subjectId: subId, topicName: trimmed });
        }
      }
    }
  }

  for (const pair of allTopicPairs) {
    const key = `${pair.subjectId}:${pair.topicName}`;
    if (!topicCache.has(key)) {
      const top = await db.studentCornerTopic.upsert({
        where: {
          subjectId_name: {
            subjectId: pair.subjectId,
            name: pair.topicName,
          },
        },
        create: {
          subjectId: pair.subjectId,
          name: pair.topicName,
        },
        update: {},
        select: { id: true },
      });
      topicCache.set(key, top.id);
    }
  }

  // 4. Insert Challenges and count per arena
  let insertedCount = 0;
  const affectedArenaIds = new Set<string>();

  // Track order index per arena
  const arenaOrderIndex = new Map<string, number>();
  for (const [dateKey, arena] of arenaByDateStr.entries()) {
    arenaOrderIndex.set(arena.id, arena.totalCount || 0);
  }

  for (const row of rows) {
    const canonical = startOfDay(new Date(row.date)).toISOString().slice(0, 10);
    const arena = arenaByDateStr.get(canonical);
    if (!arena) continue;

    // Skip if day is locked
    if (arena.isLocked || arena.mode === DayMode.LOCKED) continue;

    const currentOrder = arenaOrderIndex.get(arena.id) || 0;
    arenaOrderIndex.set(arena.id, currentOrder + 1);
    affectedArenaIds.add(arena.id);

    const subId = row.subject ? subjectMap.get(row.subject.trim()) : undefined;
    const topIds: string[] = [];
    if (subId && row.topics) {
      for (const t of row.topics) {
        const id = topicCache.get(`${subId}:${t.trim()}`);
        if (id) topIds.push(id);
      }
    }

    await db.arenaChallenge.create({
      data: {
        arenaId: arena.id,
        studentProfileId,
        title: row.title.trim(),
        category: row.category,
        durationMinutes: Math.max(1, Math.min(1440, row.durationMinutes || 30)),
        scheduledTime: row.scheduledTime ?? null,
        priority: row.priority || ChallengePriority.MEDIUM,
        notes: row.notes ?? null,
        orderIndex: currentOrder,
        subjects: subId ? { create: [{ subjectId: subId }] } : undefined,
        topics: topIds.length > 0 ? { create: topIds.map((tId) => ({ topicId: tId })) } : undefined,
      },
      select: { id: true },
    });

    insertedCount++;
  }

  // 5. Update aggregated stats for all affected arenas in one pass
  for (const arenaId of affectedArenaIds) {
    const aggregate = await db.arenaChallenge.aggregate({
      where: { arenaId },
      _count: { id: true },
      _sum: {
        durationMinutes: true,
        actualMinutesSpent: true,
      },
    });

    const completedCount = await db.arenaChallenge.count({
      where: { arenaId, status: 'COMPLETED' },
    });

    await db.dailyArena.update({
      where: { id: arenaId },
      data: {
        totalCount: aggregate._count.id || 0,
        completedCount,
        totalPlannedMinutes: aggregate._sum.durationMinutes || 0,
        totalCompletedMinutes: aggregate._sum.actualMinutesSpent || 0,
      },
    });
  }

  return {
    success: true,
    count: insertedCount,
  };
}
