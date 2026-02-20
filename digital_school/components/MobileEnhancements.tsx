'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { setupNetworkMonitoring } from '@/lib/native/network';
import { setupKeyboardManagement } from '@/lib/native/keyboard';
import { setupNotifications } from '@/lib/native/notifications';
import { getBatteryLevel, getDeviceInfo } from '@/lib/native/device';
import { checkBiometry, performBiometricAuth } from '@/lib/native/auth';
import { useRouter } from 'next/navigation';

export default function MobileEnhancements() {
    const { theme, resolvedTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // Add a class to the body to allow native-only CSS scoping
        document.body.classList.add('is-native');

        // --- Phase 1: Immediate Status Bar Sync ---
        const updateStatusBar = async () => {
            try {
                const currentTheme = resolvedTheme || theme;
                if (currentTheme === 'dark') {
                    await StatusBar.setStyle({ style: Style.Dark });
                    await StatusBar.setBackgroundColor({ color: '#000000' });
                } else {
                    await StatusBar.setStyle({ style: Style.Light });
                    await StatusBar.setBackgroundColor({ color: '#ffffff' });
                }
            } catch (err) {
                console.warn('StatusBar error:', err);
            }
        };
        updateStatusBar();

        // --- Phase 2: Deferred Heavy Infrastructure (500ms) ---
        const deferredSetup = setTimeout(() => {
            setupNetworkMonitoring();
            setupKeyboardManagement();
            setupNotifications();
            handleBiometricSession();
        }, 500);

        // --- Phase 3: Background Intelligence (2000ms) ---
        const backgroundPulse = setTimeout(() => {
            logDeviceContext();
            checkBattery();
        }, 2000);

        // --- Internal Logic Helpers ---
        const logDeviceContext = async () => {
            const info = await getDeviceInfo();
            console.log('Mobile Device Context:', info);
        };

        const checkBattery = async () => {
            const level = await getBatteryLevel();
            if (level !== null && level < 0.15) {
                toast.warning('Low Battery', {
                    description: `Your battery is at ${Math.round(level * 100)}%. Please plug in to avoid exam disruption.`,
                    duration: 10000,
                });
            }
        };

        const handleBiometricSession = async () => {
            const bio: any = await checkBiometry();
            if (bio && bio.isAvailable) {
                console.log('Biometrics available:', bio.biometryType);
            }
        };

        const batteryInterval = setInterval(checkBattery, 1000 * 60 * 5); // 5 mins

        return () => {
            clearTimeout(deferredSetup);
            clearTimeout(backgroundPulse);
            clearInterval(batteryInterval);
        };
    }, [theme, resolvedTheme]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // Monitor if student leaves the app during an exam
        const handleAppStateChange = async (state: { isActive: boolean }) => {
            const isExamPage = window.location.pathname.includes('/exams/online/');

            if (!state.isActive && isExamPage) {
                // Focus lost (user minimized app or checked notification)
                triggerHaptic(ImpactStyle.Heavy);
                toast.error('Security Violation: You left the app. This has been recorded.', {
                    duration: 5000,
                    className: 'bg-destructive text-destructive-foreground',
                });
            }
        };

        const appStateListener = App.addListener('appStateChange', handleAppStateChange);

        // --- Deep Link / Shortcut Handler ---
        const handleDeepLink = async (data: { url: string }) => {
            let slug = data.url.split('examify://').pop() || '';
            if (slug) {
                // Map shortcut aliases to actual routes
                if (slug === 'exams/live') slug = 'exams/evaluations';
                if (slug === 'dashboard') slug = 'teacher/dashboard';

                const targetPath = `/${slug.startsWith('/') ? slug.substring(1) : slug}`;
                console.log('🚀 Native Deep Link:', targetPath);

                // Use router.push for smooth SPA navigation
                router.push(targetPath);
            }
        };

        const appUrlListener = App.addListener('appUrlOpen', handleDeepLink);

        // Check for launch URL
        App.getLaunchUrl().then((url) => {
            if (url) handleDeepLink(url);
        });

        return () => {
            appStateListener.then(l => l.remove());
            appUrlListener.then(l => l.remove());
        };
    }, []);

    return null;
}

