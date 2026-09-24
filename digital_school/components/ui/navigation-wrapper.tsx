"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    // Update current path when pathname changes
    setCurrentPath(pathname);
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    // Listen for navigation events
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);

    // Add event listeners for navigation
    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleComplete);

    // Filter out known third-party browser extension errors (e.g., Urban VPN / proxy extensions injecting 200.js and throwing M_ID)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message || '';
      const stack = event?.reason?.stack || '';
      if (msg.includes('M_ID') || stack.includes('200.js')) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleComplete);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Show loading state during navigation
  if (isNavigating && currentPath !== pathname) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 