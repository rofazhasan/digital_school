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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, AlertCircle, LogIn, Home, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ControllerRenderProps } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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

    const [sessionAlert, setSessionAlert] = useState<{ device: string, ip: string, time: string } | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        setMounted(true);

        // Handle session invalidated reason
        const reason = searchParams.get('reason');
        const info = searchParams.get('info');

        if (reason === 'session_invalidated' || reason === 'session_expired') {
            // Clear the session cookie to prevent middleware redirect loops 
            // and ensure a clean login state
            document.cookie = 'session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

            if (reason === 'session_invalidated' && info) {
                try {
                    const decoded = JSON.parse(atob(info));
                    setSessionAlert(decoded);

                    // Auto-fadeOut after 6 seconds
                    const timer = setTimeout(() => {
                        setSessionAlert(null);
                    }, 6000);

                    return () => clearTimeout(timer);
                } catch (e) {
                    console.error('Failed to decode session info');
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
                    setError(result.message || 'An unexpected error occurred.');
                } else {
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
                setError('Failed to connect to the server. Please try again.');
            }
        });
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-2">
                    <img src="/logo.png" alt="Digital School" className="h-8 w-auto" />
                    <span className="font-semibold text-lg">Digital School</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/">
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </Link>
                </Button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm"
                >
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="space-y-1 pb-8">
                            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
                                <LogIn className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-semibold text-center">
                                Welcome back
                            </CardTitle>
                            <CardDescription className="text-center">
                                Sign in to your account to continue
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <AnimatePresence>
                                {sessionAlert && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 mb-4 space-y-2 text-sm shadow-sm">
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
                            {/* Login Method Toggle */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                                <Button
                                    type="button"
                                    variant={loginMethod === 'email' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setLoginMethod('email')}
                                    className="h-9"
                                >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email
                                </Button>
                                <Button
                                    type="button"
                                    variant={loginMethod === 'phone' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setLoginMethod('phone')}
                                    className="h-9"
                                >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Phone
                                </Button>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="identifier"
                                        render={({ field }: { field: ControllerRenderProps<TLoginSchema, 'identifier'> }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {loginMethod === 'email' ? 'Email' : 'Phone number'}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type={loginMethod === 'email' ? 'email' : 'tel'}
                                                        placeholder={
                                                            loginMethod === 'email'
                                                                ? 'Enter your email'
                                                                : 'Enter your phone'
                                                        }
                                                        {...field}
                                                        disabled={isPending}
                                                    />
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
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Enter your password"
                                                            {...field}
                                                            disabled={isPending}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                                    <Button type="submit" className="w-full" disabled={isPending}>
                                        {isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Signing in...
                                            </>
                                        ) : (
                                            'Sign in'
                                        )}
                                    </Button>
                                </form>
                            </Form>

                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Don&apos;t have an account?{' '}
                                    <Link
                                        href="/signup"
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
