import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecretKey, JWT_ALGORITHM, JWTPayload } from './lib/auth-config';

// Define route permissions
const ROUTE_PERMISSIONS = {
  // Public routes (no auth required)
  public: [
    '/',
    '/login',
    '/signup',
    '/setup',
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/logout',
    '/api/auth/verify-email',
    '/api/setup/super-user',
    '/favicon.ico',
    '/_next',
    '/api/webhooks',
    '/maintenance',
    '/forgot-password',
    '/reset-password',
    '/auth/pending'
  ],

  // Super User routes
  superUser: [
    '/super-user',
    '/super-user/dashboard',
    '/super-user/institute',
    '/super-user/users',
    '/super-user/settings',
    '/super-user/billing',
    '/super-user/analytics',
    '/super-user/reports',
    '/test-ai-generator',
    '/question-bank',
    '/question-bank/', // <--- added trailing slash variant
    '/exams',
    '/exams/*',
    '/exams/results',
    '/exams/results/*',
    '/omr_scanner'
  ],

  // Admin routes
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/classes',
    '/admin/exams',
    '/admin/reports',
    '/admin/settings',
    '/admin/attendance',
    '/admin/notices',
    '/exams',
    '/exams/*',
    '/exams/results',
    '/exams/results/*',
    '/omr_scanner'
  ],

  // Teacher routes
  teacher: [
    '/teacher',
    '/teacher/dashboard',
    '/teacher/questions',
    '/exams',
    '/exams/*',
    '/teacher/evaluations',
    '/teacher/attendance',
    '/teacher/reports',
    '/teacher/students',
    '/exams/evaluations',
    '/exams/evaluations/*',
    '/exams/results',
    '/exams/results/*',
    '/omr_scanner'
  ],

  // Student routes
  student: [
    '/student',
    '/student/dashboard',
    '/student/exams',
    '/student/results',
    '/student/attendance',
    '/student/profile',
    '/student/chat',
    '/student/notices',
    '/student/prac-perfect',
    '/student/prac-perfect/*',
    '/exams',
    '/exams/online',
    '/exams/online/',
    '/exams/online/*',
    '/exams/results',
    '/exams/results/*',
    '/exams/practice',
    '/exams/practice/',
    '/exams/practice/*',
    '/exams/evaluations/*/print/*',
  ],

  // Shared routes (accessible by authenticated users)
  shared: [
    '/profile',
    '/settings',
    '/logout',
    '/question-bank',
    '/create-question',
    '/ai-question-generator',
    '/omr_scanner',
    '/api/user',
    '/api/profile',
    '/api/settings',
    '/api/institute',
    '/api/stats',
    '/api/questions',
    '/api/questions/bulk',
    '/api/questions/bulk-delete',
    '/api/questions/export',
    '/api/questions/*',
    '/api/ai/generate-questions',
    '/api/results',
    '/api/results/*',
    '/api/exam-submissions',
    '/api/exams/results',
    '/api/exams/results/*',
    '/api/exams/evaluations/*/review-requests/*'
  ]
} as const;

// Helper function to check if a path matches any route pattern
function pathMatches(pattern: string, path: string): boolean {
  if (pattern.endsWith('*')) {
    return path.startsWith(pattern.slice(0, -1));
  }
  return path === pattern;
}

// Helper function to check if user has permission for a route
function hasPermission(userRole: string, path: string): boolean {
  if (userRole === 'SUPER_USER') return true; // <--- TEMP: allow all for SUPER_USER
  // Check public routes first
  if (ROUTE_PERMISSIONS.public.some(route => pathMatches(route, path))) {
    return true;
  }

  // Map role to route permission key
  const roleKeyMap = {
    'SUPER_USER': 'superUser',
    'ADMIN': 'admin',
    'TEACHER': 'teacher',
    'STUDENT': 'student'
  };

  const roleKey = roleKeyMap[userRole as keyof typeof roleKeyMap];

  // Check role-specific routes
  if (roleKey && ROUTE_PERMISSIONS[roleKey as keyof typeof ROUTE_PERMISSIONS]) {
    const roleRoutes = ROUTE_PERMISSIONS[roleKey as keyof typeof ROUTE_PERMISSIONS];
    if (roleRoutes.some(route => pathMatches(route, path))) {
      return true;
    }
  }

  // Check shared routes
  if (ROUTE_PERMISSIONS.shared.some(route => pathMatches(route, path))) {
    return true;
  }

  // Check if user has higher role permissions
  const roleHierarchy = {
    SUPER_USER: ['SUPER_USER', 'ADMIN', 'TEACHER', 'STUDENT'],
    ADMIN: ['ADMIN', 'TEACHER', 'STUDENT'],
    TEACHER: ['TEACHER', 'STUDENT'],
    STUDENT: ['STUDENT']
  };

  const userHierarchy = roleHierarchy[userRole as keyof typeof roleHierarchy];
  if (userHierarchy) {
    for (const role of userHierarchy) {
      const roleKey = roleKeyMap[role as keyof typeof roleKeyMap];
      if (roleKey && ROUTE_PERMISSIONS[roleKey as keyof typeof ROUTE_PERMISSIONS]) {
        const roleRoutes = ROUTE_PERMISSIONS[roleKey as keyof typeof ROUTE_PERMISSIONS];
        if (roleRoutes.some(route => pathMatches(route, path))) {
          return true;
        }
      }
    }
  }

  return false;
}

// Helper function to get default redirect URL based on role
function getDefaultRedirectUrl(role: string): string {
  switch (role) {
    case 'SUPER_USER':
      return '/super-user/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    default:
      return '/dashboard';
  }
}

// Verify JWT token (middleware-safe)
async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: [JWT_ALGORITHM],
    });

    return payload as unknown as JWTPayload;
  } catch (error: any) {
    console.warn('[MIDDLEWARE] Token verification failed:', error.message);
    return null;
  }
}

// Get token from request (middleware-safe)
async function getTokenFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return await verifyToken(token);
    }

    // Check for session token in cookies
    const sessionToken = req.cookies.get('session-token')?.value;
    if (sessionToken) {
      return await verifyToken(sessionToken);
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and other assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  // Get user token and role using JWT verification only
  const userData = await getTokenFromRequest(request);
  console.log('[MIDDLEWARE] user role:', userData?.role, 'path:', pathname);

  // Handle public routes
  if (ROUTE_PERMISSIONS.public.some(route => pathMatches(route, pathname))) {
    const reason = request.nextUrl.searchParams.get('reason');

    // If user is authenticated and trying to access login/signup, redirect to dashboard
    // EXCEPTION: Allow access if there's a session-related reason (like mismatch/expiry)
    if (userData && (pathname === '/login' || pathname === '/signup') && !reason) {
      const redirectUrl = getDefaultRedirectUrl(userData.role);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Proactive cookie clearing: If we are on login/signup and have a session reason, 
    // clear the token server-side immediately.
    if ((pathname === '/login' || pathname === '/signup') && reason) {
      const response = NextResponse.next();
      response.cookies.delete('session-token');
      return response;
    }

    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!userData) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle pending verification/approval
  // Exclude Admins and Super Users from this check if needed, 
  // but strictly speaking, even they should be verified if self-signed up.
  // HOWEVER, the user said "admin/superuser can add user like previous with no code and nothing needed"
  // which I handled by setting their flags to true on creation.
  const isPending = userData.verified === false || userData.approved === false;
  if (isPending && pathname !== '/auth/pending' && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/auth/pending', request.url));
  }

  // Handle /dashboard route - redirect to role-specific dashboard
  if (pathname === '/dashboard') {
    const redirectUrl = getDefaultRedirectUrl(userData.role);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Check if user has permission for the requested route
  if (!hasPermission(userData.role, pathname)) {
    // Redirect to appropriate dashboard based on role
    const redirectUrl = getDefaultRedirectUrl(userData.role);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Add user role to headers for use in API routes
  const response = NextResponse.next();
  response.headers.set('x-user-role', userData.role);
  response.headers.set('x-user-id', userData.userId);

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};