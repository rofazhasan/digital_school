'use server';

import { requireStudentAuth } from './auth-helper';
import {
  getOrCreateDailyArena,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  toggleChallengeCompletion,
  reorderChallenges,
  setDayMode,
  CreateChallengeInput,
  UpdateChallengeInput,
} from '../services/arena-service';
import { calculateStudentStreaks } from '../services/streak-service';
import { getLiveHijriDate } from '../services/ummah-api-service';
import { DayMode } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getTodayArenaAction(dateStr?: string) {
  try {
    const student = await requireStudentAuth();
    const arena = await getOrCreateDailyArena(student.studentProfileId, dateStr || new Date());
    const streakInfo = await calculateStudentStreaks(student.studentProfileId);
    const hijriDate = await getLiveHijriDate();

    return {
      success: true,
      arena,
      studentName: student.name,
      streakInfo,
      hijriDate,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to load today arena',
    };
  }
}

export async function createChallengeAction(input: CreateChallengeInput) {
  try {
    const student = await requireStudentAuth();
    const challenge = await createChallenge(student.studentProfileId, input);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');

    return {
      success: true,
      challenge,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create challenge',
    };
  }
}

export async function updateChallengeAction(input: UpdateChallengeInput) {
  try {
    const student = await requireStudentAuth();
    const updated = await updateChallenge(student.studentProfileId, input);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');

    return {
      success: true,
      challenge: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update challenge',
    };
  }
}

export async function toggleChallengeCompletionAction(challengeId: string) {
  try {
    const student = await requireStudentAuth();
    const updated = await toggleChallengeCompletion(student.studentProfileId, challengeId);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');

    return {
      success: true,
      challenge: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to toggle completion',
    };
  }
}

export async function deleteChallengeAction(challengeId: string, emergencyReason?: string) {
  try {
    const student = await requireStudentAuth();
    await deleteChallenge(student.studentProfileId, challengeId, emergencyReason);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to delete challenge',
    };
  }
}

export async function reorderChallengesAction(arenaId: string, orderedIds: string[]) {
  try {
    const student = await requireStudentAuth();
    await reorderChallenges(student.studentProfileId, arenaId, orderedIds);
    revalidatePath('/student/student-corner/arena');

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to reorder challenges',
    };
  }
}

export async function setDayModeAction(arenaId: string, mode: DayMode, reason?: string) {
  try {
    const student = await requireStudentAuth();
    const updated = await setDayMode(student.studentProfileId, arenaId, mode, reason);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');

    return {
      success: true,
      arena: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update day mode',
    };
  }
}

export async function duplicateDayAction(sourceDate: string, targetDate: string) {
  try {
    const student = await requireStudentAuth();
    const { duplicateDayRoutine } = await import('../services/arena-service');
    const targetArena = await duplicateDayRoutine(student.studentProfileId, sourceDate, targetDate);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');
    revalidatePath('/student/student-corner/calendar');
    return { success: true, arena: targetArena };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to duplicate day' };
  }
}

export async function bulkOperationsAction(
  challengeIds: string[],
  action: 'DELETE' | 'DUPLICATE' | 'CHANGE_CATEGORY' | 'MOVE_TO_DATE',
  payload?: any
) {
  try {
    const student = await requireStudentAuth();
    const { bulkChallengeOperations } = await import('../services/arena-service');
    const result = await bulkChallengeOperations(student.studentProfileId, challengeIds, action, payload);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');
    return { success: true, ...result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to perform bulk operation' };
  }
}

export async function getRecoveryBacklogAction() {
  try {
    const student = await requireStudentAuth();
    const { getRecoveryBacklog } = await import('../services/arena-service');
    const backlog = await getRecoveryBacklog(student.studentProfileId);
    return { success: true, backlog };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch recovery backlog' };
  }
}
