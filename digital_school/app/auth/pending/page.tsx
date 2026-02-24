"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Clock, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PendingPage() {
    const [status, setStatus] = useState<'loading' | 'email' | 'approval' | 'active'>('loading');
    const [user, setUser] = useState<any>(null);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const checkStatus = async (isPoll = false) => {
        try {
            const res = await fetch('/api/auth/session');
            if (!res.ok) {
                if (res.status === 401 && !isPoll) router.push('/login');
                return;
            }
            const data = await res.json();

            if (data.status === 'valid') {
                router.push('/dashboard');
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
            if (!isPoll) setError("Failed to connect to server. Please refresh.");
        }
    };

    useEffect(() => {
        let timer: any;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    // Initial check and Polling
    useEffect(() => {
        checkStatus();
        const pollInterval = setInterval(() => checkStatus(true), 10000); // Poll every 10s
        return () => clearInterval(pollInterval);
    }, []);

    const handleResendEmail = async () => {
        if (cooldown > 0) return;
        setResending(true);
        try {
            const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
            if (res.ok) {
                setCooldown(60); // 60 seconds cooldown
                alert("Verification email resent successfully!");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to resend email.");
            }
        } catch (err) {
            console.error('Failed to resend email:', err);
            alert("An error occurred. Please try again later.");
        } finally {
            setResending(false);
        }
    };

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (res.ok) {
                router.push('/login');
            }
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    if (status === 'loading' && !error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-500 animate-pulse">Checking your status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="max-w-md w-full shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        {status === 'email' ? (
                            <Mail className="h-8 w-8 text-primary" />
                        ) : (
                            <Clock className="h-8 w-8 text-primary" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {status === 'email' ? 'Verify Your Email' : 'Account Pending Approval'}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        {status === 'email'
                            ? "We've sent a verification link to your email address. Please click it to activate your account."
                            : "Your account is currently waiting for administrator approval. You'll be able to access the dashboard once approved."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-50 p-3 rounded-lg flex items-center gap-3 text-red-800 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}
                    {user?.email && status === 'email' && (
                        <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3 text-blue-800 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Sent to: <strong>{user.email}</strong></span>
                        </div>
                    )}
                    {user?.phone && status === 'approval' && (
                        <div className="bg-amber-50 p-3 rounded-lg flex items-center gap-3 text-amber-800 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>Account identifier: <strong>{user.phone}</strong></span>
                        </div>
                    )}

                    {status === 'email' && (
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                onClick={handleResendEmail}
                                disabled={resending || cooldown > 0}
                                className="w-full h-10 gap-2 font-medium"
                            >
                                {resending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : <Mail className="h-4 w-4" />}
                                {cooldown > 0 ? `Resend again in ${cooldown}s` : 'Resend Verification Email'}
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-center pt-2">
                        <button
                            onClick={() => checkStatus()}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <Loader2 className={`h-3 w-3 ${status === 'loading' ? 'animate-spin' : ''}`} />
                            Refresh Status
                        </button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        asChild
                        variant="ghost"
                        className="w-full h-10 text-sm text-gray-500"
                    >
                        <Link href="/login">Return to Login</Link>
                    </Button>
                    <Button
                        onClick={handleLogout}
                        variant="secondary"
                        className="w-full h-11 text-base font-semibold"
                    >
                        Log Out
                    </Button>
                    <p className="text-center text-xs text-gray-500">
                        Once verified or approved, this page will refresh automatically.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
