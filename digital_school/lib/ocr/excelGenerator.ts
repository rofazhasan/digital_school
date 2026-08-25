/**
 * Bulk Question Bank Excel (.xlsx) Generator
 * Generates standardized, formatted spreadsheets from extracted questions with LaTeX math support.
 */

import * as XLSX from 'xlsx';
import { ExtractedQuestion } from './questionParser';

export function generateQuestionBankExcel(
  questions: ExtractedQuestion[],
  fileName: string = 'Question_Bank_Extracted_Template.xlsx'
): { blob: Blob; fileName: string } {
  const rows = questions.map((q, idx) => {
    const optA = q.options.find(o => o.key === 'A')?.text || '';
    const optB = q.options.find(o => o.key === 'B')?.text || '';
    const optC = q.options.find(o => o.key === 'C')?.text || '';
    const optD = q.options.find(o => o.key === 'D')?.text || '';

    return {
      'Sl': idx + 1,
      'Question ID': q.id,
      'Question Text (LaTeX)': q.stem,
      'Option A': optA,
      'Option B': optB,
      'Option C': optC,
      'Option D': optD,
      'Correct Answer': q.correctAnswer || '',
      'Explanation / Solution': q.explanation || '',
      'Subject': q.subject || 'General Math',
      'Chapter / Topic': q.chapter || 'Main Topics',
      'Class Level': q.classLevel || 'Class 9-10 / SSC',
      'Difficulty': q.difficulty || 'MEDIUM',
      'Question Type': q.questionType || 'MCQ',
      'Language': q.language || 'Bangla',
      'Status': 'ACTIVE',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column width formatting
  const columnWidths = [
    { wch: 6 },  // Sl
    { wch: 22 }, // Question ID
    { wch: 50 }, // Question Text
    { wch: 25 }, // Option A
    { wch: 25 }, // Option B
    { wch: 25 }, // Option C
    { wch: 25 }, // Option D
    { wch: 15 }, // Correct Answer
    { wch: 40 }, // Explanation
    { wch: 18 }, // Subject
    { wch: 25 }, // Chapter
    { wch: 18 }, // Class Level
    { wch: 12 }, // Difficulty
    { wch: 14 }, // Question Type
    { wch: 12 }, // Language
    { wch: 10 }, // Status
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Question Bank');

  // Generate buffer and blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return { blob, fileName };
}

/**
 * Triggers in-browser download of the Excel file
 */
export function downloadExcelFile(blob: Blob, fileName: string) {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
