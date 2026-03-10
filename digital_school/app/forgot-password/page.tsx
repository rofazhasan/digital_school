'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, TForgotPasswordSchema } from '@/lib/schemas/auth';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Mail, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic, ImpactStyle } from '@/lib/haptics';

export default function ForgotPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [step, setStep] = useState<'request' | 'otp' | 'pending_approval' | 'done'>('request');
    const [identifier, setIdentifier] = useState('');
    const [isPending, startTransition] = useTransition();

    const form = useForm<TForgotPasswordSchema>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            identifier: '',
        },
    });

    const onSubmit = (data: TForgotPasswordSchema) => {
        triggerHaptic(ImpactStyle.Medium);
        setError(null);
        setIdentifier(data.identifier);
        console.log('[FORGOT_PASSWORD] Submitting identifier:', data.identifier);

        startTransition(async () => {
            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await response.json();

                console.log('[FORGOT_PASSWORD] Server response:', response.status, result);

                if (!response.ok) {
                    triggerHaptic(ImpactStyle.Heavy);
                    setError(result.message || 'An unexpected error occurred.');
                } else {
                    triggerHaptic(ImpactStyle.Medium);
                    if (result.type === 'phone' || result.type === 'otp') {
                        console.log('[FORGOT_PASSWORD] Phone flow detected, showing OTP step');
                        setStep('otp');
                    } else if (result.status === 'pending_approval') {
                        console.log('[FORGOT_PASSWORD] Pending approval flow');
                        setStep('pending_approval');
                    } else {
                        console.log('[FORGOT_PASSWORD] Email flow successful');
                        setStep('done');
                        setSuccess(true);
                    }
                }
            } catch (err) {
                console.error('[FORGOT_PASSWORD] Network error:', err);
                triggerHaptic(ImpactStyle.Heavy);
                setError('Failed to connect to the server. Please try again.');
            }
        });
    };

    const onOtpSubmit = (otp: string) => {
        triggerHaptic(ImpactStyle.Medium);
        // Redirect to reset password with the OTP as token
        window.location.href = `/reset-password?token=${otp}`;
    };

    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Left Side - Visual & Branding (Matching Login) */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 text-white items-center justify-center p-12">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                </div>

                <div className="relative z-10 max-w-lg space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Elite Exam System</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                            Secure Account <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Recovery</span>
                        </h1>
                        <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                            Don't worry, it happens to the best of us. Let's get you back into your workspace securely.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
                <Button variant="ghost" className="absolute top-6 left-6" asChild>
                    <Link href="/login">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                </Button>

                <div className="w-full max-w-[420px] space-y-8">
                    <AnimatePresence mode="wait">
                        {step === 'request' && (
                            <motion.div
                                key="request-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center lg:text-left">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Forgot Password?</h2>
                                    <p className="mt-2 text-muted-foreground">Enter your email or phone number and we'll help you recover your account.</p>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        {error && (
                                            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        )}

                                        <FormField
                                            control={form.control}
                                            name="identifier"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-foreground/80">Email or Phone</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Input
                                                                placeholder="name@example.com or 01XXXXXXXXX"
                                                                {...field}
                                                                disabled={isPending}
                                                                className="h-12 pl-10 bg-muted/30 border-input group-hover:border-primary/50 transition-colors"
                                                            />
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary/70 transition-colors">
                                                                <Mail className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
                                            disabled={isPending}
                                        >
                                            {isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Searching account...
                                                </>
                                            ) : (
                                                <>
                                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </motion.div>
                        )}

                        {step === 'otp' && (
                            <motion.div
                                key="otp-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center lg:text-left">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Verify Identity</h2>
                                    <p className="mt-2 text-muted-foreground">We've sent a 6-digit OTP to your phone number <strong>{identifier}</strong>.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground/80">6-Digit OTP</label>
                                        <Input
                                            type="text"
                                            maxLength={6}
                                            placeholder="XXXXXX"
                                            className="h-14 text-center text-2xl tracking-[1em] font-mono"
                                            autoFocus
                                            onChange={(e) => {
                                                if (e.target.value.length === 6) {
                                                    onOtpSubmit(e.target.value);
                                                }
                                            }}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-xl"
                                        onClick={() => setStep('request')}
                                    >
                                        Change Phone Number
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'pending_approval' && (
                            <motion.div
                                key="pending-approval"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6 py-8"
                            >
                                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-foreground">Approval Pending</h2>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    SMS delivery failed. Your password reset request has been sent to an administrator for manual approval.
                                </p>
                                <div className="p-4 bg-muted/30 rounded-lg border border-border text-sm text-left">
                                    <p className="font-semibold mb-1">What happens next?</p>
                                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                        <li>An admin will review your request.</li>
                                        <li>Once approved, you will be able to reset your password.</li>
                                        <li>Please contact your institute for faster processing.</li>
                                    </ul>
                                </div>
                                <Button variant="outline" className="w-full h-12 rounded-xl" asChild>
                                    <Link href="/login">Return to Login</Link>
                                </Button>
                            </motion.div>
                        )}

                        {step === 'done' && (
                            <motion.div
                                key="success-message"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6 py-8"
                            >
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-foreground">Next Step</h2>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    We've sent a password recovery link to <strong>{identifier}</strong>.
                                    Please check your inbox and follow the instructions.
                                </p>
                                <Button variant="outline" className="w-full h-12 rounded-xl" asChild>
                                    <Link href="/login">Return to Login</Link>
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Didn't receive it? Check your spam folder or{' '}
                                    <button
                                        onClick={() => setStep('request')}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        try again
                                    </button>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
