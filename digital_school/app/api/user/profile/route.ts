import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getTokenFromRequest } from "@/lib/auth";
import { getDatabaseClient } from "@/lib/db-init";
import { sendEmail } from "@/lib/email";
import { ProfileUpdateEmail } from "@/components/emails/ProfileUpdateEmail";
import { z } from "zod";

const passwordSchema = z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(6),
});

const emailSchema = z.object({
    newEmail: z.string().email(),
    password: z.string().min(1),
});

const phoneSchema = z.object({
    newPhone: z.string().min(10),
    password: z.string().min(1),
});

export async function PATCH(request: NextRequest) {
    try {
        const authData = await getTokenFromRequest(request);
        if (!authData) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const { type } = body;

        const prismadb = await getDatabaseClient();
        const user = await (prismadb.user as any).findUnique({
            where: { id: authData.user.id },
            include: { institute: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (type === 'password') {
            const { oldPassword, newPassword } = passwordSchema.parse(body);
            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await (prismadb.user as any).update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });

            return NextResponse.json({ message: "Password updated successfully" });
        }

        if (type === 'email') {
            const { newEmail, password } = emailSchema.parse(body);
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Invalid password" }, { status: 400 });
            }

            // Check if email already exists
            const existingUser = await (prismadb.user as any).findUnique({ where: { email: newEmail } });
            if (existingUser) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }

            const emailChangeToken = crypto.randomUUID();
            await (prismadb.user as any).update({
                where: { id: user.id },
                data: {
                    pendingEmail: newEmail,
                    emailChangeToken
                }
            });

            const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email-change?token=${emailChangeToken}`;

            await sendEmail({
                to: newEmail,
                subject: `Verify your new email - ${user.institute?.name || 'Digital School'}`,
                react: ProfileUpdateEmail({
                    firstName: user.name.split(' ')[0],
                    updateType: 'email',
                    newValue: newEmail,
                    verificationLink,
                    institute: user.institute
                }) as any,
            });

            return NextResponse.json({ message: "Verification email sent to your new address" });
        }

        if (type === 'phone') {
            const { newPhone, password } = phoneSchema.parse(body);
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Invalid password" }, { status: 400 });
            }

            // Check if phone already exists
            const existingUser = await (prismadb.user as any).findUnique({ where: { phone: newPhone } });
            if (existingUser) {
                return NextResponse.json({ error: "Phone number already in use" }, { status: 400 });
            }

            await (prismadb.user as any).update({
                where: { id: user.id },
                data: { pendingPhone: newPhone }
            });

            return NextResponse.json({ message: "Phone change request submitted for admin approval" });
        }

        return NextResponse.json({ error: "Invalid update type" }, { status: 400 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
        }
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 });
    }
}
