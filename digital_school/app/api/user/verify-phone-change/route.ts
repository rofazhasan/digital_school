import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { getDatabaseClient } from "@/lib/db-init";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
    otp: z.string().length(6),
});

/**
 * POST /api/user/verify-phone-change
 * Verifies the OTP sent to the new phone number and finalizes the change.
 */
export async function POST(request: NextRequest) {
    try {
        const authData = await getTokenFromRequest(request);
        if (!authData) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const { otp } = schema.parse(body);

        const prismadb = await getDatabaseClient();
        const user = await (prismadb.user as any).findUnique({
            where: { id: authData.user.id }
        });

        if (!user || !user.pendingPhone || !user.phoneOtp) {
            return NextResponse.json({ error: "No pending phone change request found." }, { status: 400 });
        }

        // Check expiry
        if (user.phoneOtpExpiry && new Date() > new Date(user.phoneOtpExpiry)) {
            return NextResponse.json({ error: "OTP has expired. Please request the change again." }, { status: 400 });
        }

        // Verify OTP
        const isValid = await bcrypt.compare(otp, user.phoneOtp);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
        }

        // Check if the new phone is already in use by another user (safety check)
        const phoneInUse = await (prismadb.user as any).findFirst({
            where: {
                phone: user.pendingPhone,
                NOT: { id: user.id }
            }
        });

        if (phoneInUse) {
            return NextResponse.json({ error: "This phone number is now in use by another account." }, { status: 400 });
        }

        // Finalize change
        await (prismadb.user as any).update({
            where: { id: user.id },
            data: {
                phone: user.pendingPhone,
                pendingPhone: null,
                phoneOtp: null,
                phoneOtpExpiry: null
            }
        });

        return NextResponse.json({
            success: true,
            message: "Phone number updated successfully!",
            newPhone: user.pendingPhone
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
        }
        console.error("[VERIFY-PHONE-CHANGE] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
