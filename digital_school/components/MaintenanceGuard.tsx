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
            try {
                setChecking(true);
                const [maintenanceRes, userRes] = await Promise.all([
                    fetch('/api/maintenance', { cache: 'no-store' }),
                    fetch('/api/user', { cache: 'no-store' })
                ]);

                if (maintenanceRes.ok) {
                    const maintenanceData = await maintenanceRes.json();

                    if (maintenanceData.maintenanceMode) {
                        // Check if user is exempt
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

        // Check on mount and periodically
        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [pathname, router]);

    return <>{children}</>;
}
