import { getCurrentUser } from './auth';

const allowedRoles = ['TEACHER', 'ADMIN', 'SUPER_USER'] as const;
export type AllowedRole = typeof allowedRoles[number];

export async function getRoleGuardedUser() {
  const user = await getCurrentUser();
  if (!user) return { redirect: '/login' as const };
  if (!allowedRoles.includes(user.role as AllowedRole)) return { redirect: '/dashboard' as const };
  // Narrow type for UI components
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email ?? '',
      role: user.role as AllowedRole,
      teacherProfile: user.teacherProfile,
    }
  };
} 