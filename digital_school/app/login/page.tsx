'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useToast } from "@/components/ui/use-toast";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Phone, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ControllerRenderProps } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { triggerHaptic, ImpactStyle } from '@/lib/haptics';
import { performBiometricAuth, checkBiometry } from '@/lib/native/auth';
import { openUrl } from '@/lib/native/interaction';
import { Capacitor } from '@capacitor/core';
import { Fingerprint } from 'lucide-react';


const loginSchema = z.object({
    identifier: z.string().min(1, { message: 'Email or phone number is required.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

type TLoginSchema = z.infer<typeof loginSchema>;

function LoginContent() {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
    const { toast } = useToast();

    const [sessionAlert, setSessionAlert] = useState<{ device: string, ip: string, time: string } | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        setMounted(true);

        const handleBiometricOnMount = async () => {
            if (Capacitor.isNativePlatform()) {
                const bio = await checkBiometry();
                if (bio.isAvailable) {
                    // We could auto-trigger or show a button
                }
            }
        };
        handleBiometricOnMount();

        const reason = searchParams.get('reason');
        const info = searchParams.get('info');

        if (reason === 'session_invalidated' || reason === 'session_expired') {
            if (reason === 'session_invalidated' && info) {
                try {
                    const decoded = JSON.parse(atob(info));
                    setSessionAlert(decoded);
                    const timer = setTimeout(() => {
                        setSessionAlert(null);
                    }, 8000);
                    return () => clearTimeout(timer);
                } catch (e) {
                    console.error('Failed to decode session info', e);
                }
            }
        }
    }, [searchParams]);

    const form = useForm<TLoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: '',
            password: '',
        },
    });

    const onSubmit = (data: TLoginSchema) => {
        triggerHaptic(ImpactStyle.Medium);
        setError(null);
        startTransition(async () => {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...data,
                        loginMethod
                    }),
                });
                const result = await response.json();
                if (!response.ok) {
                    triggerHaptic(ImpactStyle.Heavy);
                    setError(result.message || 'An unexpected error occurred.');
                } else {
                    triggerHaptic(ImpactStyle.Medium);
                    const userRole = result.user.role;
                    let redirectUrl = '/dashboard';

                    switch (userRole) {
                        case 'SUPER_USER':
                            redirectUrl = '/super-user/dashboard';
                            break;
                        case 'ADMIN':
                            redirectUrl = '/admin/dashboard';
                            break;
                        case 'TEACHER':
                            redirectUrl = '/teacher/dashboard';
                            break;
                        case 'STUDENT':
                            redirectUrl = '/student/dashboard';
                            break;
                        default:
                            redirectUrl = '/dashboard';
                    }

                    window.location.href = redirectUrl;
                }
            } catch {
                triggerHaptic(ImpactStyle.Heavy);
                setError('Failed to connect to the server. Please try again.');
            }
        });
    };


    if (!mounted) return null;

    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Left Side - Visual & Branding */}
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
                            Secure, Smart, &amp; <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Seamless Assessment</span>
                        </h1>
                        <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                            Experience the future of education with our AI-powered exam management platform. Designed for excellence, built for trust.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-2 gap-6 pt-8"
                    >
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <h3 className="font-semibold text-lg text-indigo-400">99.9%</h3>
                            <p className="text-sm text-slate-400">Uptime Reliability</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <h3 className="font-semibold text-lg text-purple-400">Secure</h3>
                            <p className="text-sm text-slate-400">End-to-End Encryption</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
                <Button variant="ghost" className="absolute top-6 left-6 lg:hidden" asChild>
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <Button variant="ghost" className="absolute top-6 right-6 lg:left-6 hidden lg:flex" asChild>
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </Button>

                <div className="w-full max-w-[420px] space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
                        <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
                    </div>

                    <div className="space-y-6">
                        <AnimatePresence>
                            {sessionAlert && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 space-y-2 text-sm shadow-sm">
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                                            <AlertCircle className="w-4 h-4" />
                                            New Login Detected
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            <div>
                                                <span className="font-semibold block uppercase text-[10px]">Device</span>
                                                <span className="text-foreground truncate block">{sessionAlert.device}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold block uppercase text-[10px]">IP Address</span>
                                                <span className="text-foreground block">{sessionAlert.ip}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="font-semibold block uppercase text-[10px]">Time</span>
                                                <span className="text-foreground block">{new Date(sessionAlert.time).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-1 bg-muted rounded-xl grid grid-cols-2 gap-1">
                            <button
                                type="button"
                                onClick={() => { triggerHaptic(ImpactStyle.Light); setLoginMethod('email'); }}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                    loginMethod === 'email'
                                        ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Mail className="w-4 h-4" /> Email
                            </button>
                            <button
                                type="button"
                                onClick={() => { triggerHaptic(ImpactStyle.Light); setLoginMethod('phone'); }}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                    loginMethod === 'phone'
                                        ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Phone className="w-4 h-4" /> Phone
                            </button>
                        </div>


                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                {error && (
                                    <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <FormField
                                    control={form.control}
                                    name="identifier"
                                    render={({ field }: { field: ControllerRenderProps<TLoginSchema, 'identifier'> }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground/80">
                                                {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Input
                                                        type={loginMethod === 'email' ? 'email' : 'tel'}
                                                        placeholder={
                                                            loginMethod === 'email'
                                                                ? 'name@example.com'
                                                                : '01XXXXXXXXX'
                                                        }
                                                        {...field}
                                                        disabled={isPending}
                                                        className="h-12 pl-10 bg-muted/30 border-input group-hover:border-primary/50 transition-colors"
                                                    />
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary/70 transition-colors">
                                                        {loginMethod === 'email' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }: { field: ControllerRenderProps<TLoginSchema, 'password'> }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-foreground/80">Password</FormLabel>
                                                <Link href="/forgot-password" title="Recover your account" className="text-xs font-medium text-primary hover:underline transition-all">
                                                    Forgot Password?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter your password"
                                                        {...field}
                                                        disabled={isPending}
                                                        className="h-12 pl-10 pr-10 bg-muted/30 border-input group-hover:border-primary/50 transition-colors"
                                                    />
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary/70 transition-colors">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
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
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign in <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>

                        {/* Biometric Login Button */}
                        {mounted && Capacitor.isNativePlatform() && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="pt-2"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-indigo-200 dark:border-indigo-900/30 flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400"
                                    onClick={async () => {
                                        const success = await performBiometricAuth();
                                        if (success) {
                                            toast({ title: 'Success', description: 'Biometric identity verified.' });
                                        }
                                    }}
                                >
                                    <Fingerprint className="w-5 h-5" />
                                    <span>Sign in with Biometrics</span>
                                </Button>
                            </motion.div>
                        )}

                        <div className="text-center space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Don&apos;t have an account?{' '}
                                <Link
                                    href="/signup"
                                    className="text-primary hover:underline font-semibold"
                                >
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
