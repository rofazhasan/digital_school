'use server';

import { requireStudentAuth } from './auth-helper';
import db from '@/lib/db';
import { DayMode, ChallengeCategory } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface UpdateSettingsInput {
  timezone?: string;
  dailyGoalMinutes?: number;
  defaultDayMode?: DayMode;
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
  preferredCategories?: ChallengeCategory[];
  onboardingCompleted?: boolean;
}

export async function getStudentCornerSettingsAction() {
  try {
    const student = await requireStudentAuth();
    const profile = await db.studentCornerProfile.findUnique({
      where: { studentProfileId: student.studentProfileId },
    });

    return {
      success: true,
      settings: profile,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to fetch settings',
    };
  }
}

export async function updateStudentCornerSettingsAction(input: UpdateSettingsInput) {
  try {
    const student = await requireStudentAuth();
    const updated = await db.studentCornerProfile.update({
      where: { studentProfileId: student.studentProfileId },
      data: {
        timezone: input.timezone,
        dailyGoalMinutes: input.dailyGoalMinutes,
        defaultDayMode: input.defaultDayMode,
        soundEnabled: input.soundEnabled,
        notificationsEnabled: input.notificationsEnabled,
        preferredCategories: input.preferredCategories,
        onboardingCompleted: input.onboardingCompleted,
      },
    });

    revalidatePath('/student/student-corner');

    return {
      success: true,
      settings: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to update settings',
    };
  }
}
