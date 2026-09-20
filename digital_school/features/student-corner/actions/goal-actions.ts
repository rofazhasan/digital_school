'use server';

import { requireStudentAuth } from './auth-helper';
import {
  createStudentGoal,
  updateGoalProgress,
  getStudentGoals,
  deleteStudentGoal,
  CreateGoalInput,
  UpdateGoalProgressInput,
} from '../services/goal-service';
import { revalidatePath } from 'next/cache';

export async function createGoalAction(input: CreateGoalInput) {
  try {
    const student = await requireStudentAuth();
    const goal = await createStudentGoal(student.studentProfileId, input);
    revalidatePath('/student/student-corner/goals');
    revalidatePath('/student/student-corner');
    return { success: true, goal };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create goal' };
  }
}

export async function updateGoalProgressAction(input: UpdateGoalProgressInput) {
  try {
    const student = await requireStudentAuth();
    const result = await updateGoalProgress(student.studentProfileId, input);
    revalidatePath('/student/student-corner/goals');
    revalidatePath('/student/student-corner');
    return { success: true, ...result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update goal progress' };
  }
}

export async function getStudentGoalsAction() {
  try {
    const student = await requireStudentAuth();
    const goals = await getStudentGoals(student.studentProfileId);
    return { success: true, goals };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch goals' };
  }
}

export async function deleteGoalAction(goalId: string) {
  try {
    const student = await requireStudentAuth();
    await deleteStudentGoal(student.studentProfileId, goalId);
    revalidatePath('/student/student-corner/goals');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete goal' };
  }
}
