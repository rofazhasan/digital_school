import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import prismadb from './db';
import { getJwtSecretKey, JWT_ALGORITHM } from './auth-config';
import type { JWTPayload } from './auth-config';

export type { JWTPayload };
// Create JWT token
export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecretKey());

  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: [JWT_ALGORITHM],
    });

    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Validate session status
export async function validateSession(token: string) {
  try {
    const payload = await verifyToken(token);
    if (!payload) return { status: 'invalid' };

    // Defensive check for database query
    let user;
    try {
      // Use a minimal select to avoid triggering errors for missing columns
      user = await (prismadb.user as any).findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
          emailVerified: true,
          isApproved: true,
          activeSessionId: true,
          lastSessionInfo: true,
          createdAt: true,
          updatedAt: true,
          institute: { select: { id: true, name: true } },
          studentProfile: {
            select: {
              id: true, classId: true, roll: true, registrationNo: true,
              class: { select: { id: true, name: true, section: true } },
            },
          },
          teacherProfile: {
            select: { id: true, employeeId: true, department: true, subjects: true },
          },
        },
      });
    } catch (dbError: any) {
      console.warn('[AUTH] Session validation query failed. Likely missing schema fields.', dbError.message);
      // Fallback: If the structured query fails, try a direct findUnique with no select
      try {
        user = await (prismadb.user as any).findUnique({ where: { id: payload.userId } });
      } catch (innerError) {
        return { status: 'invalid' };
      }
    }

    if (!user) {
      return { status: 'invalid' };
    }

    // Safely check fields that might be missing in DB
    const isEmailVerified = (user as any).emailVerified !== false; // Default to true if missing or null, except if explicitly false
    const isApproved = (user as any).isApproved !== false;
    const isActive = (user as any).isActive !== false;

    const isPending = !isEmailVerified || !isApproved;
    if (isPending) {
      return {
        status: 'pending',
        user: { ...user } as any,
        reason: !user.emailVerified ? 'email' : 'approval'
      };
    }

    if (!user.isActive) {
      return { status: 'invalid' };
    }

    // Single session validation
    if ((user as any).activeSessionId && (user as any).activeSessionId !== payload.sid) {
      console.warn('[AUTH] Session mismatch detected:', {
        userId: user.id,
        dbSid: (user as any).activeSessionId,
        tokenSid: payload.sid,
        reason: 'mismatch'
      });
      return {
        status: 'mismatch',
        user,
        lastSessionInfo: (user as any).lastSessionInfo
      };
    }

    return {
      status: 'valid',
      user: {
        ...user,
        role: user.role as JWTPayload['role'],
      } as any
    };
  } catch (error) {
    console.error('Error validating session:', error);
    return { status: 'error' };
  }
}

// Get user from token (for API routes - includes database query)
export async function getUserFromToken(token: string) {
  const { status, user } = await validateSession(token);
  if (status === 'valid' || status === 'pending') return user;
  return null;
}

// Get token from request (for API routes - includes database query)
export async function getTokenFromRequest(req: NextRequest): Promise<{
  user: any;
  token: string;
} | null> {
  try {
    // INTERNAL BYPASS: Allow headless browsers (like Puppeteer) without a session cookie
    // to access protected APIs if they provide the valid internal secret.
    const internalSecret = req.headers.get('x-internal-secret');
    if (internalSecret && internalSecret === process.env.JWT_SECRET) {
      return {
        user: { id: "internal-system", role: "SUPER_USER", name: "System" },
        token: "internal-bypass-token"
      };
    }

    // Check for JWT token in Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await getUserFromToken(token);
      if (user) {
        return { user, token };
      }
    }

    // Check for session token in cookies
    const sessionToken = req.cookies.get('session-token')?.value;
    if (sessionToken) {
      const user = await getUserFromToken(sessionToken);
      if (user) {
        return { user, token: sessionToken };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting token from request:', error);
    return null;
  }
}

// Get current user (for server components)
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return null;
    }

    return await getUserFromToken(sessionToken);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Set session token in cookies
export async function setSessionToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

// Clear session token
export async function clearSessionToken() {
  const cookieStore = await cookies();
  cookieStore.delete('session-token');
}

// Check if user has permission for a specific action
export function hasPermission(
  userRole: JWTPayload['role'],
  requiredRole: JWTPayload['role']
): boolean {
  const roleHierarchy = {
    SUPER_USER: 4,
    ADMIN: 3,
    TEACHER: 2,
    STUDENT: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Check if user can access a specific route
export function canAccessRoute(
  userRole: JWTPayload['role'],
  route: string
): boolean {
  const routePermissions = {
    '/super-user': ['SUPER_USER'],
    '/admin': ['SUPER_USER', 'ADMIN'],
    '/teacher': ['SUPER_USER', 'ADMIN', 'TEACHER'],
    '/student': ['SUPER_USER', 'ADMIN', 'TEACHER', 'STUDENT'],
    '/dashboard': ['SUPER_USER', 'ADMIN', 'TEACHER', 'STUDENT'],
  };

  for (const [routePrefix, allowedRoles] of Object.entries(routePermissions)) {
    if (route.startsWith(routePrefix)) {
      return allowedRoles.includes(userRole);
    }
  }

  return true; // Default to allowing access
} 