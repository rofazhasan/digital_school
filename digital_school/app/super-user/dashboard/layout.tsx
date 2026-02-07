import type { Metadata } from "next";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSession } from '@/lib/auth';

export const metadata: Metadata = {
    title: "Super User Dashboard | Digital School",
    description: "Multi-institute management and system administration",
};

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const sessionToken = (await cookies()).get('session-token')?.value;

    if (sessionToken) {
        const { status, lastSessionInfo } = await validateSession(sessionToken);
        if (status === 'mismatch') {
            const info = lastSessionInfo as any || {};
            const encodedInfo = Buffer.from(JSON.stringify({
                device: info.device || 'Unknown',
                ip: info.ip || 'Unknown',
                time: info.time || new Date().toISOString()
            })).toString('base64');
            redirect(`/login?reason=session_invalidated&info=${encodedInfo}`);
        }
    }

    return <>{children}</>;
}
