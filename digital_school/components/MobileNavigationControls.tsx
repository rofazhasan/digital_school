'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import {
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';

export default function MobileNavigationControls() {
    const router = useRouter();
    const pathname = usePathname();
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    if (!isNative) return null;

    // Don't show on login/signup pages or online exams to keep it clean and focused
    if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/exams/online/')) return null;

    const handleAction = (action: () => void) => {
        triggerHaptic(ImpactStyle.Light);
        action();
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 bg-background/60 backdrop-blur-xl border border-border/50 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-primary/10 active:scale-90 transition-all"
                onClick={() => handleAction(() => router.back())}
                title="Back"
            >
                <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="h-6 w-[1px] bg-border/50 mx-1" />

            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-primary/10 active:scale-90 transition-all"
                onClick={() => handleAction(() => router.push('/teacher/dashboard'))}
                title="Dashboard"
            >
                <LayoutDashboard className="h-5 w-5" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-primary/10 active:scale-90 transition-all font-bold"
                onClick={() => handleAction(() => window.location.reload())}
                title="Refresh"
            >
                <RotateCw className="h-5 w-5 text-primary" />
            </Button>

            <div className="h-6 w-[1px] bg-border/50 mx-1" />

            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-primary/10 active:scale-90 transition-all"
                onClick={() => handleAction(() => router.forward())}
                title="Forward"
            >
                <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
    );
}
