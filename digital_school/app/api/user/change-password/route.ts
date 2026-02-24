import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getTokenFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const auth = await getTokenFromRequest(request);

        if (!auth || !auth.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const sessionUser = auth.user;

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: 'Current and new passwords are required.' }, { status: 400 });
        }

        const user = await prismadb.user.findUnique({
            where: { id: sessionUser.id }
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 400 });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prismadb.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null
            } as any
        });

        return NextResponse.json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
