import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export interface AuthenticatedStudentContext {
  userId: string;
  studentProfileId: string;
  name: string;
  classId: string;
}

/**
 * Server-side authorization guard for Student Corner.
 * Derives studentProfileId securely from the session token. Never trusts client-sent student IDs.
 */
export async function requireStudentAuth(): Promise<AuthenticatedStudentContext> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    throw new Error('UNAUTHORIZED: Please sign in to access Student Corner.');
  }

  // Check role or profile
  const studentProfile = user.studentProfile || await db.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, classId: true },
  });

  if (!studentProfile || !studentProfile.id) {
    throw new Error('FORBIDDEN: Student Corner is only accessible for active student accounts.');
  }

  // Ensure StudentCornerProfile exists
  let cornerProfile = await db.studentCornerProfile.findUnique({
    where: { studentProfileId: studentProfile.id },
    select: { id: true },
  });

  if (!cornerProfile) {
    await db.studentCornerProfile.create({
      data: {
        studentProfileId: studentProfile.id,
      },
    });
  }

  return {
    userId: user.id,
    studentProfileId: studentProfile.id,
    name: user.name || 'Student',
    classId: studentProfile.classId,
  };
}
