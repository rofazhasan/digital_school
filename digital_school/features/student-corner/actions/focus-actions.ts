'use server';

import { requireStudentAuth } from './auth-helper';
import {
  startFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  completeFocusSession,
  getActiveFocusSession,
  StartFocusInput,
} from '../services/focus-service';
import { calculateStudentStreaks } from '../services/streak-service';
import { revalidatePath } from 'next/cache';

export async function startFocusSessionAction(input: StartFocusInput) {
  try {
    const student = await requireStudentAuth();
    const session = await startFocusSession(student.studentProfileId, input);
    revalidatePath('/student/student-corner');

    return {
      success: true,
      session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to start focus session',
    };
  }
}

export async function pauseFocusSessionAction(sessionId: string, secondsElapsed: number) {
  try {
    const student = await requireStudentAuth();
    const session = await pauseFocusSession(student.studentProfileId, sessionId, secondsElapsed);

    return {
      success: true,
      session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to pause focus session',
    };
  }
}

export async function resumeFocusSessionAction(sessionId: string) {
  try {
    const student = await requireStudentAuth();
    const session = await resumeFocusSession(student.studentProfileId, sessionId);

    return {
      success: true,
      session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to resume focus session',
    };
  }
}

export async function completeFocusSessionAction(sessionId: string, actualSeconds: number) {
  try {
    const student = await requireStudentAuth();
    const session = await completeFocusSession(student.studentProfileId, sessionId, actualSeconds);
    await calculateStudentStreaks(student.studentProfileId);

    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/arena');

    return {
      success: true,
      session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to complete focus session',
    };
  }
}

export async function getActiveFocusSessionAction() {
  try {
    const student = await requireStudentAuth();
    const session = await getActiveFocusSession(student.studentProfileId);

    return {
      success: true,
      session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to fetch active session',
    };
  }
}
