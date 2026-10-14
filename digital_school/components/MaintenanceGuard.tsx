'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    role: string;
}

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        // Skip check on maintenance page itself or login
        if (pathname === '/maintenance' || pathname === '/login') return;

        const checkStatus = async () => {
            if (document.hidden) return;
            try {
                setChecking(true);
                const maintenanceRes = await fetch('/api/maintenance', { next: { revalidate: 60 } });

                if (maintenanceRes.ok) {
                    const maintenanceData = await maintenanceRes.json();

                    if (maintenanceData.maintenanceMode) {
                        // Only fetch user profile when maintenance mode is active to check for exemption
                        const userRes = await fetch('/api/user', { cache: 'no-store' });
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            const role = userData.user?.role;

                            // If user is Admin or Super User, DO NOT redirect
                            if (role === 'ADMIN' || role === 'SUPER_USER') {
                                return;
                            }

                            // Force logout for restricted users
                            try {
                                await fetch('/api/auth/logout', { method: 'POST' });
                            } catch (e) {
                                console.error('Logout failed', e);
                            }
                        }

                        // Otherwise, redirect to maintenance page
                        router.push('/maintenance');
                    }
                }
            } catch (error) {
                console.error('Maintenance check failed', error);
            } finally {
                setChecking(false);
            }
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkStatus();
            }
        };

        // Check on mount and periodically
        checkStatus();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        const interval = setInterval(() => {
            if (!document.hidden) {
                checkStatus();
            }
        }, 180000); // Check every 3 minutes while tab is active

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(interval);
        };
    }, [pathname, router]);

    return <>{children}</>;
}
