import db from '@/lib/db';

export const UNIVERSITY_PRESETS = [
  {
    universityName: 'BUET',
    clusterName: 'Bangladesh University of Engineering and Technology',
    examFormat: 'Written 400 Marks (Physics 133, Chemistry 133, Math 134)',
    historicalSafeCutoff: '260+ / 400 (~65%)',
    targetRank: 'Top 300',
    strategyNotes: 'Zero margin for careless arithmetic errors. Step-marking is generous for clean diagrams and first principles. Avoid getting bogged down on hard calculus questions.',
    subjectBreakdown: { Physics: 133, Chemistry: 133, Mathematics: 134 },
  },
  {
    universityName: 'Dhaka University (A Unit / Ka)',
    clusterName: 'University of Dhaka — Faculty of Science',
    examFormat: 'MCQ 60 Marks (45m) + Written 40 Marks (45m)',
    historicalSafeCutoff: '72+ / 100 (Safe for CSE/EEE)',
    targetRank: 'Top 500',
    strategyNotes: 'Extreme time pressure in MCQ (45 min for 60 questions). Written section demands concise mathematical steps without unnecessary prose.',
    subjectBreakdown: { Physics: 25, Chemistry: 25, Mathematics: 25, Biology_or_ICT: 25 },
  },
  {
    universityName: 'CKRUET Cluster',
    clusterName: 'CUET, KUET, RUET Combined Admission',
    examFormat: 'Written 500 Marks (Engineering)',
    historicalSafeCutoff: '320+ / 500 (~64%)',
    targetRank: 'Top 800',
    strategyNotes: 'Focus on high-speed problem solving. Large volume of questions testing direct application of standard engineering formulas.',
    subjectBreakdown: { Physics: 150, Chemistry: 150, Mathematics: 150, English: 50 },
  },
  {
    universityName: 'Government Medical Colleges (MBBS)',
    clusterName: 'DGHS Medical Admission',
    examFormat: 'MCQ 100 Marks (100 Questions, 60 Minutes, 0.25 Negative Marking)',
    historicalSafeCutoff: '74+ / 100 (Safe for DMC/SSMC)',
    targetRank: 'Top 400',
    strategyNotes: 'Biology memory recall and Chemistry inorganic trends are decisive. Negative marking punishment is severe—skip doubtful questions.',
    subjectBreakdown: { Biology: 30, Chemistry: 25, Physics: 20, English: 15, General_Knowledge: 10 },
  },
  {
    universityName: 'IUT (Islamic University of Technology)',
    clusterName: 'OIC International University',
    examFormat: 'MCQ 100 Marks (English Medium standard)',
    historicalSafeCutoff: '65+ / 100',
    targetRank: 'Top 250',
    strategyNotes: 'English question stem comprehension speed is paramount. Conceptual questions with multi-step mechanics.',
    subjectBreakdown: { Mathematics: 35, Physics: 35, Chemistry: 15, English: 15 },
  },
] as const;

export const APPLICATION_STATUSES = [
  { id: 'NOT_STARTED', label: 'Not Started', color: '#94a3b8' },
  { id: 'APPLICATION_OPEN', label: 'Application Open', color: '#3b82f6' },
  { id: 'SUBMITTED', label: 'Form Submitted', color: '#f59e0b' },
  { id: 'PAYMENT_PENDING', label: 'Payment Pending', color: '#ec4899' },
  { id: 'ADMIT_CARD_DOWNLOADED', label: 'Admit Card Ready', color: '#10b981' },
  { id: 'EXAM_COMPLETED', label: 'Exam Completed', color: '#6366f1' },
  { id: 'RESULT_PUBLISHED', label: 'Result Published', color: '#06b6d4' },
] as const;

/**
 * Retrieves all admission targets for a student
 */
export async function getAdmissionTargets(studentProfileId: string) {
  return await db.admissionTarget.findMany({
    where: { studentProfileId },
    orderBy: [{ examDate: 'asc' }, { createdAt: 'desc' }],
  });
}

/**
 * Initializes default university targets if the student has none
 */
export async function seedDefaultUniversityTargets(studentProfileId: string) {
  const existing = await db.admissionTarget.count({ where: { studentProfileId } });
  if (existing > 0) return;

  for (const preset of UNIVERSITY_PRESETS.slice(0, 3)) {
    await db.admissionTarget.create({
      data: {
        studentProfileId,
        universityName: preset.universityName,
        clusterName: preset.clusterName,
        examFormat: preset.examFormat,
        historicalSafeCutoff: preset.historicalSafeCutoff,
        targetRank: preset.targetRank,
        strategyNotes: preset.strategyNotes,
        subjectBreakdown: preset.subjectBreakdown as any,
      },
    });
  }
}

/**
 * Creates or updates an admission target
 */
export async function upsertAdmissionTarget(
  studentProfileId: string,
  data: {
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
  }
) {
  if (data.id) {
    return await db.admissionTarget.update({
      where: { id: data.id },
      data: {
        universityName: data.universityName.trim(),
        clusterName: data.clusterName?.trim() || null,
        examFormat: data.examFormat.trim(),
        historicalSafeCutoff: data.historicalSafeCutoff.trim(),
        targetRank: data.targetRank?.trim() || null,
        strategyNotes: data.strategyNotes?.trim() || null,
        applicationOpens: data.applicationOpens ?? null,
        applicationDeadline: data.applicationDeadline ?? null,
        examDate: data.examDate ?? null,
        applicationStatus: data.applicationStatus || 'NOT_STARTED',
        subjectBreakdown: data.subjectBreakdown ?? undefined,
      },
    });
  }

  return await db.admissionTarget.create({
    data: {
      studentProfileId,
      universityName: data.universityName.trim(),
      clusterName: data.clusterName?.trim() || null,
      examFormat: data.examFormat.trim(),
      historicalSafeCutoff: data.historicalSafeCutoff.trim(),
      targetRank: data.targetRank?.trim() || null,
      strategyNotes: data.strategyNotes?.trim() || null,
      applicationOpens: data.applicationOpens ?? null,
      applicationDeadline: data.applicationDeadline ?? null,
      examDate: data.examDate ?? null,
      applicationStatus: data.applicationStatus || 'NOT_STARTED',
      subjectBreakdown: data.subjectBreakdown ?? undefined,
    },
  });
}

/**
 * Deletes an admission target
 */
export async function deleteAdmissionTarget(studentProfileId: string, id: string) {
  return await db.admissionTarget.deleteMany({
    where: { id, studentProfileId },
  });
}
