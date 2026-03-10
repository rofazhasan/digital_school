'use client';

import React, { useState, useRef, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, ShieldCheck, Loader2, ArrowLeft, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

function VerifyPhonePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const phone = searchParams.get('phone') || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendCooldown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter all 6 digits.');
            return;
        }
        setError(null);
        startTransition(async () => {
            try {
                const res = await fetch('/api/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, otp: code }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || 'Verification failed. Please try again.');
                } else {
                    setSuccess(true);
                    setTimeout(() => router.push('/login'), 2000);
                }
            } catch {
                setError('Failed to connect to the server.');
            }
        });
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || resending) return;
        setResending(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to resend OTP.');
            } else {
                setResendCooldown(60);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch {
            setError('Failed to connect to the server.');
        } finally {
            setResending(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="w-full max-w-md text-center border-0 shadow-2xl">
                        <CardHeader>
                            <motion.div
                                className="mx-auto mb-4 w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5 }}
                            >
                                <CheckCircle className="w-10 h-10 text-emerald-500" />
                            </motion.div>
                            <CardTitle className="text-2xl font-bold text-emerald-600">Phone Verified!</CardTitle>
                            <CardDescription className="text-base">Your account is now active. Redirecting to login…</CardDescription>
                        </CardHeader>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="border-0 shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <motion.div
                            className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <Phone className="w-8 h-8 text-white" />
                        </motion.div>
                        <CardTitle className="text-2xl font-bold">Verify Your Phone</CardTitle>
                        <CardDescription className="mt-1">
                            We sent a 6-digit code to<br />
                            <span className="font-semibold text-foreground">{phone}</span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-6">
                        {/* OTP Input */}
                        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-muted/30 outline-none transition-all focus:border-primary focus:bg-primary/5 ${error ? 'border-destructive' : digit ? 'border-primary/50' : 'border-border'
                                        }`}
                                    disabled={isPending}
                                />
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        {/* Verify Button */}
                        <Button
                            onClick={handleVerify}
                            disabled={isPending || otp.join('').length !== 6}
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                        >
                            {isPending ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying…</>
                            ) : (
                                <><ShieldCheck className="mr-2 h-5 w-5" /> Verify &amp; Activate Account</>
                            )}
                        </Button>

                        {/* Resend */}
                        <div className="text-center space-y-3">
                            <p className="text-sm text-muted-foreground">Didn&apos;t receive the code?</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || resending}
                                className="text-primary hover:text-primary/80"
                            >
                                {resending ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                                ) : resendCooldown > 0 ? (
                                    <>Resend in {resendCooldown}s</>
                                ) : (
                                    <><RotateCcw className="mr-2 h-4 w-4" /> Resend OTP</>
                                )}
                            </Button>
                        </div>

                        <div className="border-t border-dashed pt-4">
                            <Button variant="ghost" asChild className="w-full text-muted-foreground hover:text-foreground">
                                <Link href="/signup">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign Up
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <VerifyPhonePage />
        </Suspense>
    );
}
