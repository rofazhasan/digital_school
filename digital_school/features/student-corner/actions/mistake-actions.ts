'use server';

import { requireStudentAuth } from './auth-helper';
import {
  getAllMistakes,
  getDueRetestMistakes,
  createMistakeRecord,
  resolveMistakeRetest,
  addMistakeRetestToTodayArena,
  getMistakeAnalytics,
  CreateMistakeInput,
} from '../services/mistake-service';
import { revalidatePath } from 'next/cache';

export async function getMistakeLabAction(filter?: {
  isResolved?: boolean;
  subjectName?: string;
  fallacyCategory?: string;
  search?: string;
}) {
  try {
    const student = await requireStudentAuth();
    const [mistakes, analytics, dueRetests] = await Promise.all([
      getAllMistakes(student.studentProfileId, filter),
      getMistakeAnalytics(student.studentProfileId),
      getDueRetestMistakes(student.studentProfileId),
    ]);

    return {
      success: true,
      mistakes,
      analytics,
      dueRetests,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to load mistake lab',
    };
  }
}

export async function createMistakeAction(input: CreateMistakeInput) {
  try {
    const student = await requireStudentAuth();
    const record = await createMistakeRecord(student.studentProfileId, input);
    revalidatePath('/student/student-corner/mistakes');
    revalidatePath('/student/student-corner/arena');

    return { success: true, record };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record mistake' };
  }
}

export async function resolveMistakeAction(mistakeId: string, retestScore?: number, notes?: string) {
  try {
    const student = await requireStudentAuth();
    const resolved = await resolveMistakeRetest(student.studentProfileId, mistakeId, retestScore, notes);
    revalidatePath('/student/student-corner/mistakes');
    revalidatePath('/student/student-corner/arena');

    return { success: true, record: resolved };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to resolve mistake' };
  }
}

export async function addMistakeRetestToTodayArenaAction(mistakeId: string, durationMinutes: number = 30) {
  try {
    const student = await requireStudentAuth();
    const challenge = await addMistakeRetestToTodayArena(
      student.studentProfileId,
      mistakeId,
      durationMinutes
    );
    revalidatePath('/student/student-corner/arena');
    revalidatePath('/student/student-corner/mistakes');

    return { success: true, challenge };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add retest to Today Arena' };
  }
}
