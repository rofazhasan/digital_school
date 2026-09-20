'use server';

import { requireStudentAuth } from './auth-helper';
import {
  getAdmissionTargets,
  upsertAdmissionTarget,
  deleteAdmissionTarget,
  seedDefaultUniversityTargets,
} from '../services/admission-service';
import { revalidatePath } from 'next/cache';

export async function getAdmissionTargetsAction() {
  try {
    const student = await requireStudentAuth();
    await seedDefaultUniversityTargets(student.studentProfileId);
    const targets = await getAdmissionTargets(student.studentProfileId);

    return {
      success: true,
      targets,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to load admission targets',
    };
  }
}

export async function upsertAdmissionTargetAction(data: {
  id?: string;
  universityName: string;
  clusterName?: string;
  examFormat: string;
  historicalSafeCutoff: string;
  targetRank?: string;
  strategyNotes?: string;
  applicationOpens?: Date | null;
  applicationDeadline?: Date | null;
  examDate?: Date | null;
  applicationStatus?: string;
  subjectBreakdown?: any;
}) {
  try {
    const student = await requireStudentAuth();
    const target = await upsertAdmissionTarget(student.studentProfileId, data);
    revalidatePath('/student/student-corner/admission');

    return { success: true, target };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save admission target' };
  }
}

export async function deleteAdmissionTargetAction(id: string) {
  try {
    const student = await requireStudentAuth();
    await deleteAdmissionTarget(student.studentProfileId, id);
    revalidatePath('/student/student-corner/admission');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete target' };
  }
}
