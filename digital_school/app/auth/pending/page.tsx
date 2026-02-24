"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Clock, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, LogOut, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PendingPage() {
    const [status, setStatus] = useState<'loading' | 'email' | 'approval' | 'active'>('loading');
    const [user, setUser] = useState<any>(null);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    const checkStatus = useCallback(async (isPoll = false) => {
        if (!isPoll) setIsRefreshing(true);
        try {
            const res = await fetch('/api/auth/session', { cache: 'no-store' });
            if (!res.ok) {
                if (res.status === 401 && !isPoll) router.push('/login');
                return;
            }
            const data = await res.json();

            if (data.status === 'valid') {
                setStatus('active');
                setTimeout(() => router.push('/dashboard'), 1500);
                return;
            }

            if (data.status === 'pending') {
                setStatus(data.reason || 'approval');
                setUser(data.user);
                setError(null);
            } else if (!isPoll) {
                router.push('/login');
            }
        } catch (err) {
            console.error('Failed to check status:', err);
            if (!isPoll) setError("Connection lost. Please check your internet.");
        } finally {
            if (!isPoll) setIsRefreshing(false);
        }
    }, [router]);

    useEffect(() => {
        let timer: any;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    useEffect(() => {
        checkStatus();
        const pollInterval = setInterval(() => checkStatus(true), 8000);
        return () => clearInterval(pollInterval);
    }, [checkStatus]);

    const handleResendEmail = async () => {
        if (cooldown > 0) return;
        setResending(true);
        try {
            const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
            if (res.ok) {
                setCooldown(60);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to resend. Please try again.");
            }
        } catch (err) {
            setError("Service temporarily unavailable.");
        } finally {
            setResending(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (err) {
            router.push('/login');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b14] overflow-hidden relative">
                <div className="aurora-bg opacity-30"></div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex flex-col items-center gap-6"
                >
                    <div className="relative">
                        <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse"></div>
                        <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                    </div>
                    <p className="text-gray-400 font-medium tracking-wide animate-pulse">Syncing with Digital School...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#070b14] p-4 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="aurora-bg opacity-40"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={status}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-lg z-10"
                >
                    <div className="glass-heavy border-white/5 bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                        {/* Progress Header */}
                        <div className="bg-white/[0.02] border-b border-white/5 p-8 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg leading-none">Onboarding</h2>
                                    <p className="text-gray-400 text-xs mt-1">Digital School Security</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => checkStatus()}
                                disabled={isRefreshing}
                                className="h-10 w-10 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        <div className="p-8 pt-10">
                            {/* Icon Animation */}
                            <div className="flex justify-center mb-10">
                                <div className="relative">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"
                                    ></motion.div>
                                    <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-inner relative z-10">
                                        {status === 'active' ? (
                                            <CheckCircle2 className="h-12 w-12 text-green-400" />
                                        ) : status === 'email' ? (
                                            <Mail className="h-12 w-12 text-primary" />
                                        ) : (
                                            <Clock className="h-12 w-12 text-amber-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="text-center space-y-3 mb-10">
                                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                                    {status === 'active' ? 'Welcome Aboard!' :
                                        status === 'email' ? 'Verify Your Identity' : 'Under Review'}
                                </h1>
                                <p className="text-gray-400 text-lg leading-relaxed px-4">
                                    {status === 'active' ? 'Verification successful. Redirecting you to your workspace...' :
                                        status === 'email' ? `We've sent a secure link to ${user?.email || 'your email'}.` :
                                            "Our administrators are currently reviewing your account setup."}
                                </p>
                            </div>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-8"
                                    >
                                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <p className="font-medium">{error}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actions */}
                            <div className="space-y-4">
                                {status === 'email' && (
                                    <Button
                                        onClick={handleResendEmail}
                                        disabled={resending || cooldown > 0}
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-lg shadow-primary/20 border-0"
                                    >
                                        {resending ? (
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        ) : (
                                            <Mail className="h-5 w-5 mr-2" />
                                        )}
                                        {cooldown > 0 ? `Retry in ${cooldown}s` : 'Resend Verification Link'}
                                    </Button>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-14 border-white/5 bg-white/[0.02] text-white hover:bg-white/10 hover:text-white rounded-2xl font-semibold transition-all"
                                    >
                                        <Link href="/login">Help Center</Link>
                                    </Button>
                                    <Button
                                        onClick={handleLogout}
                                        variant="outline"
                                        className="h-14 border-white/5 bg-white/[0.02] text-red-400/80 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 rounded-2xl font-semibold transition-all group"
                                    >
                                        <LogOut className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                        Sign Out
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Notification */}
                        <div className="bg-white/[0.02] border-t border-white/5 p-6 text-center">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.1em] flex items-center justify-center gap-2">
                                <span className="h-1 w-1 rounded-full bg-primary animate-ping"></span>
                                System Auto-Sync Active
                            </p>
                        </div>
                    </div>

                    {/* Branding */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center mt-12"
                    >
                        <p className="text-sm font-medium text-gray-600 flex items-center justify-center gap-2">
                            Powered by <span className="text-white/40 font-bold uppercase tracking-wider">Digital School v4.0</span>
                        </p>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
