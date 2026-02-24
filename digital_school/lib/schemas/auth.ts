// lib/schemas/auth.ts
import { z } from 'zod';

export enum UserRole {
    SUPER_USER = 'SUPER_USER',
    ADMIN = 'ADMIN',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
}

export const signupSchema = z
    .object({
        name: z
            .string()
            .min(2, { message: 'Name must be at least 2 characters long.' })
            .max(50, { message: 'Name must be less than 50 characters.' })
            .trim(),
        email: z.string().email({ message: 'Please enter a valid email address.' }).trim().optional().or(z.literal('')),
        password: z
            .string()
            .min(8, { message: 'Password must be at least 8 characters long.' })
            .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
            .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
            .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
            .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character.' })
            .trim(),
        role: z.nativeEnum(UserRole, {
            errorMap: () => ({ message: "Please select a valid role." }),
        }),
        class: z.string().optional(),
        section: z.string().optional(),
        roll: z.coerce.number().int().positive().optional(),
        phone: z.string().optional().or(z.literal('')),
        instituteId: z.string().optional(),
    })
    .refine(
        (data) => {
            // Either email or phone must be provided (and not empty)
            const hasEmail = data.email && data.email.trim() !== '';
            const hasPhone = data.phone && data.phone.trim() !== '';
            return hasEmail || hasPhone;
        },
        {
            message: 'Please provide either an email address or phone number.',
            path: ['email'],
        }
    )
    .refine(
        (data) => {
            // Cannot provide both email and phone (and both not empty)
            const hasEmail = data.email && data.email.trim() !== '';
            const hasPhone = data.phone && data.phone.trim() !== '';
            return !(hasEmail && hasPhone);
        },
        {
            message: 'Please provide either an email address OR phone number, not both.',
            path: ['email'],
        }
    )
    .refine(
        (data) => {
            if (data.role === UserRole.STUDENT) {
                const hasEmail = data.email && data.email.trim() !== '';
                const hasPhone = data.phone && data.phone.trim() !== '';
                return !!data.class && !!data.section && !!data.roll && (hasEmail || hasPhone);
            }
            return true;
        },
        {
            message: 'Class, Section, Roll Number, and Email/Phone are required for students.',
            path: ['class'],
        }
    )
    .refine(
        (data) => {
            if (data.phone && data.phone.trim() !== '') {
                // More flexible phone validation for international numbers
                // Accepts: +8801712345678, 01712345678, 8801712345678, +1-234-567-8901, etc.
                const cleanedPhone = data.phone.replace(/[\s\-\(\)\.]/g, '');
                return /^\+?[\d]{7,15}$/.test(cleanedPhone);
            }
            return true;
        },
        {
            message: 'Please enter a valid phone number (7-15 digits, can include +, spaces, dashes, parentheses).',
            path: ['phone'],
        }
    );

export type TSignupSchema = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }).trim(),
});

export type TForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, { message: 'Password must be at least 8 characters long.' })
            .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
            .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
            .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
            .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character.' })
            .trim(),
        confirmPassword: z.string().trim(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match.",
        path: ['confirmPassword'],
    });

export type TResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
