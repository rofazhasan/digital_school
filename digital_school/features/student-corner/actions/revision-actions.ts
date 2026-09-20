'use server';

import { requireStudentAuth } from './auth-helper';
import {
  getAllRevisionItems,
  getDueRevisionItems,
  getRevisionDashboardStats,
  createRevisionItem,
  recordReviewResult,
  addRevisionToTodayArena,
} from '../services/revision-service';
import { revalidatePath } from 'next/cache';

export async function getRevisionDashboardAction(filter?: { vaultCategory?: string; leitnerBox?: number; search?: string }) {
  try {
    const student = await requireStudentAuth();
    const [items, stats] = await Promise.all([
      getAllRevisionItems(student.studentProfileId, filter),
      getRevisionDashboardStats(student.studentProfileId),
    ]);

    return {
      success: true,
      items,
      stats,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to load revision dashboard',
    };
  }
}

export async function createRevisionItemAction(data: {
  title: string;
  content?: string;
  vaultCategory?: string;
  subjectId?: string;
  topicId?: string;
  leitnerBox?: number;
  confidenceLevel?: number;
}) {
  try {
    const student = await requireStudentAuth();
    const item = await createRevisionItem(student.studentProfileId, data);
    revalidatePath('/student/student-corner/revision');
    revalidatePath('/student/student-corner/arena');

    return { success: true, item };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create revision item' };
  }
}

export async function recordReviewResultAction(
  itemId: string,
  performance: 'FAILED' | 'HARD' | 'GOOD' | 'EASY',
  confidence?: number
) {
  try {
    const student = await requireStudentAuth();
    const updated = await recordReviewResult(student.studentProfileId, itemId, performance, confidence);
    revalidatePath('/student/student-corner/revision');
    revalidatePath('/student/student-corner/arena');

    return { success: true, item: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record review' };
  }
}

export async function addRevisionToTodayArenaAction(
  itemId: string,
  activeRecallMethod: string = 'FEYNMAN',
  durationMinutes: number = 30
) {
  try {
    const student = await requireStudentAuth();
    const challenge = await addRevisionToTodayArena(
      student.studentProfileId,
      itemId,
      activeRecallMethod,
      durationMinutes
    );
    revalidatePath('/student/student-corner/arena');
    revalidatePath('/student/student-corner/revision');

    return { success: true, challenge };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add revision to Today Arena' };
  }
}
