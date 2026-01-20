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
                const res = await fetch('/api/maintenance');
                if (res.ok) {
                    const data = await res.json();
                    if (data.maintenanceMode) {
                        // Check user role if possible, or just strict redirect and let maintenance page handle logic
                        // Ideally we should check if user is admin, if not, redirect.
                        // Since we can't easily sync get user here without auth context, 
                        // we'll rely on the API to return maintenance mode AND maybe we need to check auth.

                        // Strategy: Redirect to /maintenance. The maintenance page will check if user is admin and redirect back if allowed.
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
