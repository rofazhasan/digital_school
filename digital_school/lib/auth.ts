import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import prismadb from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

const JWT_ALGORITHM = 'HS256';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'SUPER_USER' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  instituteId?: string;
  sid: string;
  iat: number;
  exp: number;
}

// Create JWT token
export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
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
      user = await prismadb.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true, email: true, name: true, role: true, isActive: true,
          activeSessionId: true, lastSessionInfo: true, instituteId: true,
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
      return { status: 'valid', user: { id: payload.userId, role: payload.role } as any };
    }

    if (!user || !user.isActive) {
      return { status: 'invalid' };
    }

    // Single session validation
    if ((user as any).activeSessionId && (user as any).activeSessionId !== payload.sid) {
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
  if (status === 'valid') return user;
  return null;
}

// Get token from request (for API routes - includes database query)
export async function getTokenFromRequest(req: NextRequest): Promise<{
  user: any;
  token: string;
} | null> {
  try {
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