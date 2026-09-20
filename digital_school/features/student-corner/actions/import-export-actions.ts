'use server';

import { requireStudentAuth } from './auth-helper';
import {
  generateStudentCornerExcelTemplate,
  validateImportedExcel,
  commitBatchImport,
  ParsedImportRow,
} from '../services/excel-service';
import { revalidatePath } from 'next/cache';

export async function downloadExcelTemplateAction() {
  try {
    const buffer = await generateStudentCornerExcelTemplate();
    const base64 = buffer.toString('base64');
    return {
      success: true,
      data: base64,
      fileName: 'student_corner_template.xlsx',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate template',
    };
  }
}

export async function validateExcelUploadAction(base64Content: string) {
  try {
    await requireStudentAuth();
    const buffer = Buffer.from(base64Content, 'base64');
    const result = await validateImportedExcel(buffer);

    return {
      success: true,
      totalRows: result.totalRows,
      validRows: result.validRows,
      errors: result.errors,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to validate spreadsheet',
    };
  }
}

export async function commitExcelImportAction(rows: ParsedImportRow[]) {
  try {
    const student = await requireStudentAuth();
    const result = await commitBatchImport(student.studentProfileId, rows);

    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');

    return {
      success: true,
      count: result.count,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to import challenges',
    };
  }
}
