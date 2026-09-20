'use server';

import { requireStudentAuth } from './auth-helper';
import {
  getUpcomingExams,
  createPersonalExam,
  togglePersonalExamComplete,
  deletePersonalExam,
  CreatePersonalExamInput,
} from '../services/exam-service';
import { revalidatePath } from 'next/cache';

export async function getUpcomingExamsAction() {
  try {
    const student = await requireStudentAuth();
    const exams = await getUpcomingExams(student.studentProfileId);

    return {
      success: true,
      exams,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to fetch upcoming exams',
    };
  }
}

export async function createPersonalExamAction(input: CreatePersonalExamInput) {
  try {
    const student = await requireStudentAuth();
    const exam = await createPersonalExam(student.studentProfileId, input);
    revalidatePath('/student/student-corner');
    revalidatePath('/student/student-corner/exams');

    return {
      success: true,
      exam,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create personal exam',
    };
  }
}

export async function togglePersonalExamCompleteAction(examId: string) {
  try {
    const student = await requireStudentAuth();
    const updated = await togglePersonalExamComplete(student.studentProfileId, examId);
    revalidatePath('/student/student-corner/exams');

    return {
      success: true,
      exam: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to toggle personal exam',
    };
  }
}

export async function deletePersonalExamAction(examId: string) {
  try {
    const student = await requireStudentAuth();
    await deletePersonalExam(student.studentProfileId, examId);
    revalidatePath('/student/student-corner/exams');

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to delete personal exam',
    };
  }
}
