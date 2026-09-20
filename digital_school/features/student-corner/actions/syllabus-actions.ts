'use server';

import { requireStudentAuth } from './auth-helper';
import {
  getSyllabusMatrix,
  updateTopicSyllabusProgress,
  recordChapterRevision,
  addChapterToTodayArena,
} from '../services/syllabus-service';
import { revalidatePath } from 'next/cache';

export async function getSyllabusMatrixAction(filter?: {
  subjectId?: string;
  paper?: string;
  masteryStatus?: string;
  search?: string;
}) {
  try {
    const student = await requireStudentAuth();
    const matrix = await getSyllabusMatrix(student.studentProfileId, filter);

    return {
      success: true,
      matrix,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to load syllabus matrix',
    };
  }
}

export async function updateTopicSyllabusAction(
  topicId: string,
  data: {
    theoryCompleted?: boolean;
    qbSolved?: boolean;
    confidenceLevel?: number;
    masteryStatus?: string;
    leitnerBox?: number;
    paper?: string;
    chapterNumber?: number;
  }
) {
  try {
    const student = await requireStudentAuth();
    const updated = await updateTopicSyllabusProgress(student.studentProfileId, topicId, data);
    revalidatePath('/student/student-corner/syllabus');

    return { success: true, topic: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update topic' };
  }
}

export async function recordChapterRevisionAction(
  topicId: string,
  performance: 'FAILED' | 'HARD' | 'GOOD' | 'EASY',
  newConfidence?: number
) {
  try {
    const student = await requireStudentAuth();
    const updated = await recordChapterRevision(student.studentProfileId, topicId, performance, newConfidence);
    revalidatePath('/student/student-corner/syllabus');
    revalidatePath('/student/student-corner/arena');

    return { success: true, topic: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record chapter revision' };
  }
}

export async function addChapterToTodayArenaAction(topicId: string, durationMinutes: number = 45) {
  try {
    const student = await requireStudentAuth();
    const challenge = await addChapterToTodayArena(student.studentProfileId, topicId, durationMinutes);
    revalidatePath('/student/student-corner/arena');
    revalidatePath('/student/student-corner/syllabus');

    return { success: true, challenge };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add chapter to Today Arena' };
  }
}
