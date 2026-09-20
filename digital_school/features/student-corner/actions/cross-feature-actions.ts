'use server';

import { requireStudentAuth } from './auth-helper';
import {
  getNextBestActions,
  getTopicHubDetails,
  crossFeatureSearch,
  generateExamPreparationTasks,
} from '../services/cross-feature-service';
import {
  getCrossFeatureEcosystemAnalytics,
  getWeeklyEcosystemReview,
} from '../services/analytics-service';
import { addMistakeRetestToTodayArena } from '../services/mistake-service';
import { addRevisionToTodayArena } from '../services/revision-service';
import { addChapterToTodayArena } from '../services/syllabus-service';
import { revalidatePath } from 'next/cache';

/**
 * Action: Get deterministic Next Best Actions for student home
 */
export async function getNextBestActionsAction() {
  try {
    const student = await requireStudentAuth();
    const actions = await getNextBestActions(student.studentProfileId);
    return { success: true, actions };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch next best actions' };
  }
}

/**
 * Action: Get full cross-feature topic hub details
 */
export async function getTopicHubDetailsAction(topicId: string) {
  try {
    const student = await requireStudentAuth();
    const details = await getTopicHubDetails(student.studentProfileId, topicId);
    return { success: true, details };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch topic details' };
  }
}

/**
 * Action: Global cross-feature search across all models
 */
export async function crossFeatureSearchAction(query: string) {
  try {
    const student = await requireStudentAuth();
    const results = await crossFeatureSearch(student.studentProfileId, query);
    return { success: true, results };
  } catch (err: any) {
    return { success: false, error: err.message || 'Search failed' };
  }
}

/**
 * Action: Generate targeted exam preparation tasks in Today's Arena
 */
export async function generateExamPrepTasksAction(examId: string, topicIds: string[]) {
  try {
    const student = await requireStudentAuth();
    const challenges = await generateExamPreparationTasks(student.studentProfileId, examId, topicIds);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');
    revalidatePath('/student/student-corner/exams');
    return { success: true, count: challenges.length, challenges };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate exam tasks' };
  }
}

/**
 * Action: 1-Click quick add mistake retest to Arena
 */
export async function quickAddRetestToArenaAction(mistakeId: string) {
  try {
    const student = await requireStudentAuth();
    const challenge = await addMistakeRetestToTodayArena(student.studentProfileId, mistakeId);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');
    return { success: true, challenge };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add retest to Arena' };
  }
}

/**
 * Action: 1-Click quick add spaced revision item to Arena
 */
export async function quickAddRevisionToArenaAction(itemId: string) {
  try {
    const student = await requireStudentAuth();
    const challenge = await addRevisionToTodayArena(student.studentProfileId, itemId);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');
    return { success: true, challenge };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add revision to Arena' };
  }
}

/**
 * Action: 1-Click quick add syllabus chapter revision to Arena
 */
export async function quickAddTopicRevisionToArenaAction(topicId: string) {
  try {
    const student = await requireStudentAuth();
    const challenge = await addChapterToTodayArena(student.studentProfileId, topicId);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');
    return { success: true, challenge };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add syllabus chapter to Arena' };
  }
}

/**
 * Action: Get cross-feature ecosystem correlation analytics
 */
export async function getCrossFeatureAnalyticsAction() {
  try {
    const student = await requireStudentAuth();
    const analytics = await getCrossFeatureEcosystemAnalytics(student.studentProfileId);
    return { success: true, analytics };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch ecosystem analytics' };
  }
}

/**
 * Action: Get weekly ecosystem review
 */
export async function getWeeklyEcosystemReviewAction() {
  try {
    const student = await requireStudentAuth();
    const review = await getWeeklyEcosystemReview(student.studentProfileId);
    return { success: true, review };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch weekly review' };
  }
}
