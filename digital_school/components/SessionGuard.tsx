"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function SessionGuard() {
    const pathname = usePathname();
    const isShowingModal = useRef(false);

    // Don't run on public pages
    const isPublicPage = ['/login', '/signup', '/setup', '/maintenance'].includes(pathname);

    const handleForcedLogout = (data: any) => {
        if (isShowingModal.current) return;
        isShowingModal.current = true;

        // Extract session info
        const info = data.info || data.lastSessionInfo || {};

        // Encode info for the URL (Base64)
        try {
            const infoObj = {
                device: info.device || 'Unknown',
                ip: info.ip || 'Unknown',
                time: info.time || new Date().toISOString()
            };
            const encodedInfo = btoa(JSON.stringify(infoObj));

            // NOTE: The session-token is HttpOnly, so it cannot be deleted here.
            // We rely on the Middleware to delete it when it sees the 'reason' parameter.

            window.location.href = `/login?reason=session_invalidated&info=${encodedInfo}`;
        } catch (e) {
            window.location.href = `/login?reason=session_invalidated`;
        }
    };

    const checkSession = async () => {
        try {
            const res = await fetch('/api/auth/session', { cache: 'no-store' });
            const data = await res.json();

            if (!res.ok || data.status === 'mismatched') {
                if (data.status === 'mismatched') {
                    handleForcedLogout(data);
                } else if (data.status === 'invalid' || data.status === 'no_token') {
                    window.location.href = '/login?reason=session_expired';
                }
            }
        } catch (error) {
            console.error('[SessionGuard] Polling failed:', error);
        }
    };

    useEffect(() => {
        if (isPublicPage || isShowingModal.current) return;

        let activeSocket: Socket | null = null;
        let pollInterval: NodeJS.Timeout | null = null;

        const initializeSession = async () => {
            try {
                // Initial check
                await checkSession();
                if (isShowingModal.current) return;

                // Setup WebSocket
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

                // Setup Polling
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
    }, [pathname, isPublicPage]);

    return null;
}
