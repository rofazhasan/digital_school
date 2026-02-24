export const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
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
