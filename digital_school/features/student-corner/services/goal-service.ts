import db from '@/lib/db';
import { StudentGoalItem } from '../types';
import { GoalTargetType, GoalStatus } from '@prisma/client';

export interface CreateGoalInput {
  title: string;
  category?: string;
  targetType: GoalTargetType;
  targetValue: number;
  unit: string;
  targetDate?: Date | string;
  notes?: string;
}

export interface UpdateGoalProgressInput {
  goalId: string;
  currentValue: number;
}

const GOAL_MILESTONES = [25, 50, 75, 100];

/**
 * Creates a new student goal
 */
export async function createStudentGoal(
  studentProfileId: string,
  input: CreateGoalInput
): Promise<StudentGoalItem> {
  const goal = await db.studentGoal.create({
    data: {
      studentProfileId,
      title: input.title.trim(),
      category: input.category?.trim() || null,
      targetType: input.targetType,
      targetValue: Math.max(1, input.targetValue),
      unit: input.unit.trim() || 'tasks',
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      notes: input.notes?.trim() || null,
      currentValue: 0,
      status: 'ACTIVE',
      milestonesPassed: [],
    },
  });

  return {
    ...goal,
    progressPercentage: 0,
  };
}

/**
 * Updates goal progress and records newly reached milestones
 */
export async function updateGoalProgress(
  studentProfileId: string,
  input: UpdateGoalProgressInput
): Promise<{ goal: StudentGoalItem; newlyPassedMilestones: number[] }> {
  const existing = await db.studentGoal.findFirst({
    where: { id: input.goalId, studentProfileId },
  });

  if (!existing) throw new Error('Goal not found');

  const newCurrent = Math.max(0, input.currentValue);
  const progressPercent = Math.min(100, Math.round((newCurrent / existing.targetValue) * 100));

  const alreadyPassed = new Set(existing.milestonesPassed);
  const newlyPassed: number[] = [];

  for (const ms of GOAL_MILESTONES) {
    if (progressPercent >= ms && !alreadyPassed.has(ms)) {
      newlyPassed.push(ms);
      alreadyPassed.add(ms);
    }
  }

  const isCompleted = progressPercent >= 100;

  const updated = await db.studentGoal.update({
    where: { id: input.goalId },
    data: {
      currentValue: newCurrent,
      milestonesPassed: Array.from(alreadyPassed),
      status: isCompleted ? 'COMPLETED' : existing.status,
      completedAt: isCompleted ? new Date() : existing.completedAt,
    },
  });

  // If newly reached 100% or significant milestone, create in-app notification
  if (newlyPassed.length > 0) {
    const highestMs = Math.max(...newlyPassed);
    await db.studentCornerNotification.create({
      data: {
        studentProfileId,
        title: highestMs === 100 ? '🎉 Goal Completed!' : `🎯 Milestone Reached: ${highestMs}%`,
        message: `You reached ${highestMs}% on your goal "${existing.title}". Keep up the great consistency!`,
        type: 'MILESTONE',
        actionUrl: '/student/student-corner/goals',
      },
    });
  }

  return {
    goal: {
      ...updated,
      progressPercentage: progressPercent,
    },
    newlyPassedMilestones: newlyPassed,
  };
}

/**
 * Fetches all goals for a student
 */
export async function getStudentGoals(studentProfileId: string): Promise<StudentGoalItem[]> {
  const goals = await db.studentGoal.findMany({
    where: { studentProfileId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return goals.map((g) => {
    const progress = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
    return {
      ...g,
      progressPercentage: progress,
    };
  });
}

/**
 * Deletes a student goal
 */
export async function deleteStudentGoal(studentProfileId: string, goalId: string) {
  const existing = await db.studentGoal.findFirst({
    where: { id: goalId, studentProfileId },
  });

  if (!existing) throw new Error('Goal not found');

  return db.studentGoal.delete({
    where: { id: goalId },
  });
}
