import db from '@/lib/db';
import { CombinedExamItem } from '../types';
import { ChallengePriority } from '@prisma/client';
import { differenceInDays, startOfDay } from 'date-fns';

export interface CreatePersonalExamInput {
  title: string;
  subject: string;
  examDate: string | Date;
  startTime?: string;
  location?: string;
  priority?: ChallengePriority;
  notes?: string;
}

/**
 * Retrieves a unified list of upcoming exams:
 * 1. LMS exams scheduled for the student's assigned class
 * 2. Personal exams created by the student
 */
export async function getUpcomingExams(studentProfileId: string): Promise<CombinedExamItem[]> {
  const student = await db.studentProfile.findUnique({
    where: { id: studentProfileId },
    select: { classId: true },
  });

  if (!student) {
    throw new Error('Student profile not found.');
  }

  const today = startOfDay(new Date());

  // 1. Fetch LMS Exams for student's class
  const lmsExams = await db.exam.findMany({
    where: {
      classId: student.classId,
      date: { gte: today },
      isActive: true,
    },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      name: true,
      date: true,
      startTime: true,
      endTime: true,
      duration: true,
      totalMarks: true,
      passMarks: true,
      subjectsConfig: true,
    },
    take: 15,
  });

  // 2. Fetch Personal Exams
  const personalExams = await db.personalExam.findMany({
    where: {
      studentProfileId,
      isCompleted: false,
      examDate: { gte: today },
    },
    orderBy: { examDate: 'asc' },
  });

  const combined: CombinedExamItem[] = [];

  // Map LMS exams
  for (const exam of lmsExams) {
    const examDate = new Date(exam.date);
    const daysRemaining = differenceInDays(examDate, today);

    // Extract subject label from subjectsConfig or name
    let subjectName = 'General';
    if (exam.subjectsConfig && typeof exam.subjectsConfig === 'object') {
      const cfg = exam.subjectsConfig as any;
      if (Array.isArray(cfg.subjects) && cfg.subjects.length > 0) {
        subjectName = cfg.subjects.map((s: any) => s.name || s).join(', ');
      }
    }

    combined.push({
      id: `lms-${exam.id}`,
      title: exam.name,
      subject: subjectName,
      examDate: exam.date,
      startTime: exam.startTime ? new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      endTime: exam.endTime ? new Date(exam.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      durationMinutes: exam.duration,
      location: 'Digital School Online / Campus Hall',
      isLmsExam: true,
      priority: ChallengePriority.HIGH,
      totalMarks: exam.totalMarks,
      passMarks: exam.passMarks,
      daysRemaining: Math.max(0, daysRemaining),
      isOverdue: daysRemaining < 0,
    });
  }

  // Map Personal exams
  for (const pExam of personalExams) {
    const examDate = new Date(pExam.examDate);
    const daysRemaining = differenceInDays(examDate, today);

    combined.push({
      id: pExam.id,
      title: pExam.title,
      subject: pExam.subject,
      examDate: pExam.examDate,
      startTime: pExam.startTime,
      location: pExam.location,
      isLmsExam: false,
      priority: pExam.priority,
      daysRemaining: Math.max(0, daysRemaining),
      isOverdue: daysRemaining < 0,
    });
  }

  // Sort chronologically
  combined.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  return combined;
}

/**
 * Creates a personal exam for the student.
 */
export async function createPersonalExam(studentProfileId: string, input: CreatePersonalExamInput) {
  return await db.personalExam.create({
    data: {
      studentProfileId,
      title: input.title.trim(),
      subject: input.subject.trim(),
      examDate: new Date(input.examDate),
      startTime: input.startTime ?? null,
      location: input.location ?? null,
      priority: input.priority || ChallengePriority.HIGH,
      notes: input.notes ?? null,
    },
  });
}

/**
 * Toggles a personal exam completed.
 */
export async function togglePersonalExamComplete(studentProfileId: string, examId: string) {
  const exam = await db.personalExam.findFirst({
    where: { id: examId, studentProfileId },
  });

  if (!exam) {
    throw new Error('Personal exam not found or unauthorized.');
  }

  return await db.personalExam.update({
    where: { id: examId },
    data: { isCompleted: !exam.isCompleted },
  });
}

/**
 * Deletes a personal exam.
 */
export async function deletePersonalExam(studentProfileId: string, examId: string) {
  const exam = await db.personalExam.findFirst({
    where: { id: examId, studentProfileId },
  });

  if (!exam) {
    throw new Error('Personal exam not found or unauthorized.');
  }

  return await db.personalExam.delete({
    where: { id: examId },
  });
}
