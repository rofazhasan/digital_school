import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getTokenFromRequest } from "@/lib/auth";
import { getDatabaseClient } from "@/lib/db-init";
import { sendEmail } from "@/lib/email";
import { WelcomeEmail } from "@/components/emails/WelcomeEmail";

export async function POST(request: NextRequest) {
    try {
        const authData = await getTokenFromRequest(request);

        if (!authData) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const prismadb = await getDatabaseClient();

        // Fetch user with casting to 'any' to avoid stale field issues
        const user = await (prismadb.user as any).findUnique({
            where: { id: authData.user.id },
            include: {
                institute: { select: { name: true, address: true, phone: true, logoUrl: true } }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
        }

        if (!user.email) {
            return NextResponse.json({ error: "No email address associated with this account" }, { status: 400 });
        }

        // Generate new verification token
        const newVerificationToken = crypto.randomUUID();

        // Update user
        await (prismadb.user as any).update({
            where: { id: user.id },
            data: { verificationToken: newVerificationToken }
        });

        // Resend email
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${newVerificationToken}`;

        await sendEmail({
            to: user.email,
            subject: `Verify your email - ${user.institute?.name || 'Digital School'}`,
            react: WelcomeEmail({
                firstName: user.name.split(' ')[0],
                institute: user.institute as any,
                verificationLink
            }) as any,
        });

        return NextResponse.json({ message: "Verification email sent successfully" });

    } catch (error: any) {
        console.error("Resend verification error:", error);
        return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 });
    }
}
