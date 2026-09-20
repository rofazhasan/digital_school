import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';

export interface AuthenticatedStudentContext {
  userId: string;
  studentProfileId: string;
  name: string;
  classId: string;
}

/**
 * Server-side authorization guard for Student Corner.
 * Derives studentProfileId securely from the session token. Never trusts client-sent student IDs.
 * Automatically redirects unauthenticated/unauthorized users to /login or respective dashboards.
 */
export async function requireStudentAuth(): Promise<AuthenticatedStudentContext> {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    redirect('/login');
  }

  // Check role or profile
  const studentProfile = user.studentProfile || await db.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, classId: true },
  });

  if (!studentProfile || !studentProfile.id) {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      redirect('/admin');
    } else if (user.role === 'TEACHER') {
      redirect('/teacher');
    }
    redirect('/login');
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
