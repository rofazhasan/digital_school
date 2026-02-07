"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Monitor, Smartphone, Clock, MapPin, LogOut } from 'lucide-react';

interface LogoutData {
    message: string;
    info: {
        device?: string;
        ip?: string;
        time?: string;
        userAgent?: string;
    };
}

export default function SessionGuard() {
    const [logoutData, setLogoutData] = useState<LogoutData | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const isShowingModal = useRef(false);

    // Don't run on public pages
    const isPublicPage = ['/login', '/signup', '/setup', '/maintenance'].includes(pathname);

    useEffect(() => {
        if (isPublicPage || isShowingModal.current) return;

        let activeSocket: Socket | null = null;
        let pollInterval: NodeJS.Timeout | null = null;

        const handleForcedLogout = (data: any) => {
            if (isShowingModal.current) return;
            isShowingModal.current = true;

            // Format data if it comes from socket vs api
            const formattedData = data.info ? data : {
                message: "Session invalidated",
                info: data.lastSessionInfo
            };

            setLogoutData(formattedData as LogoutData);
        };

        const checkSession = async () => {
            try {
                const res = await fetch('/api/auth/session', { cache: 'no-store' });
                const data = await res.json();

                if (!res.ok || data.status === 'mismatched') {
                    if (data.status === 'mismatched') {
                        handleForcedLogout(data);
                    } else if (data.status === 'invalid' || data.status === 'no_token') {
                        // Just redirect if it's a general invalid session
                        router.push('/login?reason=session_expired');
                    }
                }
            } catch (error) {
                console.error('[SessionGuard] Polling failed:', error);
            }
        };

        const initializeSession = async () => {
            try {
                // Initial check
                await checkSession();
                if (isShowingModal.current) return;

                // Setup WebSocket for immediate notification (if supported)
                const socketUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                activeSocket = io(socketUrl, {
                    auth: {
                        token: document.cookie.split('; ').find(row => row.startsWith('session-token='))?.split('=')[1]
                    },
                    reconnectionAttempts: 3
                });

                activeSocket.on('forced-logout', handleForcedLogout);
                activeSocket.on('notification', (data: any) => {
                    if (data.type === 'forced-logout') handleForcedLogout(data);
                });

                // Setup Polling as fallback (every 5 seconds)
                pollInterval = setInterval(checkSession, 5000);

            } catch (error) {
                console.error('[SessionGuard] Initialization failed:', error);
            }
        };

        initializeSession();

        return () => {
            if (activeSocket) activeSocket.disconnect();
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [pathname, isPublicPage, router]);

    const handleRedirect = () => {
        window.location.href = '/login?reason=session_invalidated';
    };

    if (!logoutData) return null;

    return (
        <AlertDialog open={!!logoutData}>
            <AlertDialogContent className="max-w-md border-2 border-primary/20 shadow-2xl z-[9999]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                        <LogOut className="w-6 h-6" />
                        Security Alert
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4 pt-2">
                        <p className="text-foreground font-medium">
                            A new device has logged into your account. You have been automatically logged out for security.
                        </p>

                        {logoutData.info && (
                            <div className="bg-muted/50 p-4 rounded-xl border space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background rounded-lg border">
                                        {logoutData.info.device?.includes('Phone') ? <Smartphone className="w-4 h-4 text-primary" /> : <Monitor className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Device Name</div>
                                        <div className="font-bold">{logoutData.info.device || 'Unknown Device'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background rounded-lg border">
                                        <MapPin className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">IP Address</div>
                                        <div className="font-bold">{logoutData.info.ip || 'Unknown IP'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background rounded-lg border">
                                        <Clock className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Login Time</div>
                                        <div className="font-bold">{logoutData.info.time ? new Date(logoutData.info.time).toLocaleString() : 'Just now'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-200 dark:border-yellow-900/30">
                            If this wasn't you, please change your password immediately after logging back in.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={handleRedirect}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl transition-all hover:scale-[1.02]"
                    >
                        I Understand, Take me to Login
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
