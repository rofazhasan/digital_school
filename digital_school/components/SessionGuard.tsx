"use client";

import { useEffect, useState } from 'react';
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
        device: string;
        ip: string;
        time: string;
        userAgent: string;
    };
}

export default function SessionGuard() {
    const [logoutData, setLogoutData] = useState<LogoutData | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Don't run on public pages
    const isPublicPage = ['/login', '/signup', '/setup', '/maintenance'].includes(pathname);

    useEffect(() => {
        if (isPublicPage) return;

        let activeSocket: Socket | null = null;

        const initializeSession = async () => {
            try {
                const res = await fetch('/api/auth/session');
                const session = await res.json();

                if (!session.authenticated) return;

                // Connect to socket for real-time logout notification
                const socketUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                activeSocket = io(socketUrl, {
                    auth: {
                        token: document.cookie.split('; ').find(row => row.startsWith('session-token='))?.split('=')[1]
                    }
                });

                activeSocket.on('notification', (data: any) => {
                    if (data.type === 'forced-logout') {
                        setLogoutData({
                            message: data.message,
                            info: data.info
                        });
                    }
                });

                activeSocket.on('forced-logout', (data: LogoutData) => {
                    setLogoutData(data);
                });

                setSocket(activeSocket);
            } catch (error) {
                console.error('[SessionGuard] Initialization failed:', error);
            }
        };

        initializeSession();

        return () => {
            if (activeSocket) activeSocket.disconnect();
        };
    }, [pathname, isPublicPage]);

    const handleRedirect = async () => {
        // Clear local state and redirect
        // The middleware and API routes will already prevent further access
        // because the sid in JWT won't match the new sid in DB
        router.push('/login?reason=session_invalidated');
        router.refresh();
    };

    if (!logoutData) return null;

    return (
        <AlertDialog open={!!logoutData}>
            <AlertDialogContent className="max-w-md border-2 border-primary/20 shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                        <LogOut className="w-6 h-6" />
                        Security Alert
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4 pt-2">
                        <p className="text-foreground font-medium">
                            A new device has logged into your account. You have been automatically logged out for security.
                        </p>

                        <div className="bg-muted/50 p-4 rounded-xl border space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg border">
                                    {logoutData.info.device.includes('Phone') ? <Smartphone className="w-4 h-4 text-primary" /> : <Monitor className="w-4 h-4 text-primary" />}
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Device Name</div>
                                    <div className="font-bold">{logoutData.info.device}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg border">
                                    <MapPin className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">IP Address</div>
                                    <div className="font-bold">{logoutData.info.ip}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg border">
                                    <Clock className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Login Time</div>
                                    <div className="font-bold">{new Date(logoutData.info.time).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

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
