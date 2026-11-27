export const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not configured in production.');
        }
        return new TextEncoder().encode('dev-only-local-jwt-secret-do-not-use-in-prod');
    }
    return new TextEncoder().encode(secret);
};

export const JWT_ALGORITHM = 'HS256';

export interface JWTPayload {
    userId: string;
    email: string;
    role: 'SUPER_USER' | 'ADMIN' | 'TEACHER' | 'STUDENT';
    instituteId?: string;
    sid: string;
    verified?: boolean;
    approved?: boolean;
    iat: number;
    exp: number;
}
