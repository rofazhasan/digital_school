// app/(auth)/signup/page.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, TSignupSchema, UserRole } from '@/lib/schemas/auth';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, PartyPopper, AlertCircle, Home, Mail, Phone, Building, CheckCircle, ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ControllerRenderProps } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { triggerHaptic, ImpactStyle } from '@/lib/haptics';


export default function SignupPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [institutes, setInstitutes] = useState<Array<{ id: string, name: string }>>([]);
    const [loadingInstitutes, setLoadingInstitutes] = useState(true);
    const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
    const [classes, setClasses] = useState<Array<{
        id: string;
        name: string;
        section: string;
        displayName: string;
        studentCount: number;
    }>>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [showCreateClass, setShowCreateClass] = useState(false);

    // Fix hydration mismatch
    useEffect(() => {
        setMounted(true);
        // Load institutes
        fetchInstitutes();
    }, []);

    const fetchInstitutes = async () => {
        try {
            const response = await fetch('/api/institute/public');
            if (response.ok) {
                const data = await response.json();
                setInstitutes(data.institutes || []);
            }
        } catch (error) {
            console.error('Failed to load institutes:', error);
        } finally {
            setLoadingInstitutes(false);
        }
    };

    const fetchClasses = async (instituteId: string) => {
        try {
            setLoadingClasses(true);
            const response = await fetch(`/api/institute/${instituteId}/classes`);
            if (response.ok) {
                const data = await response.json();
                setClasses(data.classes || []);
            } else {
                console.error('Failed to load classes:', response.status);
            }
        } catch (error) {
            console.error('Failed to load classes:', error);
        } finally {
            setLoadingClasses(false);
        }
    };

    const createClass = async (instituteId: string, name: string, section: string) => {
        try {
            const response = await fetch(`/api/institute/${instituteId}/classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, section })
            });

            if (response.ok) {
                const data = await response.json();
                setClasses(prev => [...prev, data.class]);
                setShowCreateClass(false);
                // Set the newly created class as selected
                form.setValue('class', data.class.name);
                form.setValue('section', data.class.section);
                return data.class;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create class');
            }
        } catch (error) {
            console.error('Failed to create class:', error);
            throw error;
        }
    };

    const form = useForm<TSignupSchema>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: undefined,
            class: '',
            section: '',
            roll: undefined,
            phone: '',
            instituteId: '',
        },
    });

    const selectedRole = form.watch('role');
    const selectedInstituteId = form.watch('instituteId');

    // Fetch classes when institute is selected
    useEffect(() => {
        if (selectedInstituteId && selectedRole === UserRole.STUDENT) {
            fetchClasses(selectedInstituteId);
        }
    }, [selectedInstituteId, selectedRole]);

    // Clear the other field when switching contact method
    const handleContactMethodChange = (method: 'email' | 'phone') => {
        triggerHaptic(ImpactStyle.Light);
        setContactMethod(method);
        if (method === 'email') {
            form.setValue('phone', '');
        } else {
            form.setValue('email', '');
        }
    };


    const onSubmit = (data: TSignupSchema) => {
        triggerHaptic(ImpactStyle.Medium);
        setError(null);
        setSuccess(false);
        startTransition(async () => {
            try {
                // Clean up the data - remove empty strings and set to undefined
                const cleanedData = {
                    ...data,
                    email: data.email && data.email.trim() !== '' ? data.email.trim() : undefined,
                    phone: data.phone && data.phone.trim() !== '' ? data.phone.trim() : undefined,
                };

                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanedData),
                });
                const result = await response.json();
                if (!response.ok) {
                    triggerHaptic(ImpactStyle.Heavy);
                    setError(result.message || 'An unexpected error occurred.');
                } else {
                    triggerHaptic(ImpactStyle.Medium);
                    setSuccess(true);
                    // Redirect to pending page after a short delay
                    setTimeout(() => {
                        window.location.href = '/auth/pending';
                    }, 1500);
                }
            } catch {
                triggerHaptic(ImpactStyle.Heavy);
                setError('Failed to connect to the server. Please try again.');
            }
        });
    };


    if (!mounted) return null;

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="w-full max-w-md text-center border-0 shadow-2xl glass-card">
                        <CardHeader>
                            <motion.div
                                className="mx-auto"
                                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
                            >
                                <PartyPopper className="h-20 w-20 text-green-500 drop-shadow-lg" />
                            </motion.div>
                            <CardTitle className="text-3xl font-bold text-green-600 mt-4">Account Created!</CardTitle>
                            <CardDescription className="text-lg">
                                Welcome aboard! Your account is ready.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-6">You can now proceed to login with your new credentials.</p>
                            <Button asChild className="w-full h-12 text-lg rounded-xl shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 text-white">
                                <Link href="/login">Go to Login <ArrowRight className="ml-2 w-5 h-5" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Left Side - Visuals (Desktop) */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-950 text-white items-center justify-center p-12">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                </div>

                <div className="relative z-10 max-w-lg space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Elite Exam System</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                            Join the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Revolution.</span>
                        </h1>
                        <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-md">
                            Create an account today and unlock a world of smart assessments, instant analytics, and seamless learning.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap gap-3 pt-4"
                    >
                        {['Smart Analytics', 'Secure Exams', 'Instant Results', 'AI Generation'].map((tag, i) => (
                            <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-slate-300 backdrop-blur-sm">
                                {tag}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col p-6 md:p-8 lg:p-12 overflow-y-auto h-screen">
                <div className="flex justify-between items-center mb-8">
                    <Button variant="ghost" asChild className="pl-0 hover:pl-2 transition-all">
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>
                    <div className="text-sm font-medium">
                        Already a member? <Link href="/login" className="text-primary hover:underline">Log in</Link>
                    </div>
                </div>

                <div className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Create your Account</h2>
                        <p className="mt-2 text-muted-foreground">Enter your details below to register.</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'name'> }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} disabled={isPending} className="h-11 bg-muted/30" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-2">
                                    <FormLabel>Contact Method</FormLabel>
                                    <div className="flex rounded-lg border p-1 bg-muted/50">
                                        <button
                                            type="button"
                                            onClick={() => handleContactMethodChange('email')}
                                            className={cn(
                                                "flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all",
                                                contactMethod === 'email'
                                                    ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <Mail className="h-4 w-4 mr-2" /> Email
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleContactMethodChange('phone')}
                                            className={cn(
                                                "flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all",
                                                contactMethod === 'phone'
                                                    ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <Phone className="h-4 w-4 mr-2" /> Phone
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Email or Phone Field */}
                            {contactMethod === 'email' ? (
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'email'> }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="email" placeholder="name@example.com" {...field} disabled={isPending} className="h-11 pl-10 bg-muted/30" />
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'phone'> }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="tel" placeholder="+8801..." {...field} disabled={isPending} className="h-11 pl-10 bg-muted/30" />
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'password'> }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isPending} className="h-11 pl-10 pr-10 bg-muted/30" />
                                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
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

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'role'> }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 bg-muted/30">
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
                                                    {/* Add other roles if needed */}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="instituteId"
                                    render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'instituteId'> }) => (
                                        <FormItem>
                                            <FormLabel>Institute</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending || loadingInstitutes}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 bg-muted/30">
                                                        <SelectValue placeholder={loadingInstitutes ? "Loading..." : "Select institute"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {institutes.map((institute) => (
                                                        <SelectItem key={institute.id} value={institute.id}>
                                                            <div className="flex items-center">
                                                                <Building className="h-4 w-4 mr-2" />
                                                                {institute.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <AnimatePresence>
                                {selectedRole === UserRole.STUDENT && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4 mt-2">
                                            {/* Class Selection */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                                        <Building className="w-4 h-4" /> Class Details
                                                    </h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowCreateClass(!showCreateClass)}
                                                        disabled={!selectedInstituteId || loadingClasses}
                                                        className="text-xs h-7"
                                                    >
                                                        {showCreateClass ? 'Cancel' : 'Create New'}
                                                    </Button>
                                                </div>

                                                {!showCreateClass ? (
                                                    <div className="space-y-4">
                                                        {selectedInstituteId ? (
                                                            <div className="space-y-2">
                                                                {loadingClasses ? (
                                                                    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                                                                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                                                        Loading classes...
                                                                    </div>
                                                                ) : classes.length > 0 ? (
                                                                    <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                                                        {classes.map((cls) => (
                                                                            <div
                                                                                key={cls.id}
                                                                                className={cn(
                                                                                    "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:scale-[1.01]",
                                                                                    form.watch('class') === cls.name && form.watch('section') === cls.section
                                                                                        ? 'border-primary bg-primary/10 shadow-sm'
                                                                                        : 'border-border hover:border-primary/50 bg-background'
                                                                                )}
                                                                                onClick={() => {
                                                                                    form.setValue('class', cls.name);
                                                                                    form.setValue('section', cls.section);
                                                                                }}
                                                                            >
                                                                                <div>
                                                                                    <div className="font-medium text-sm">{cls.displayName}</div>
                                                                                    <div className="text-xs text-muted-foreground">
                                                                                        {cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''}
                                                                                    </div>
                                                                                </div>
                                                                                {form.watch('class') === cls.name && form.watch('section') === cls.section && (
                                                                                    <CheckCircle className="h-4 w-4 text-primary" />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center p-4 text-muted-foreground text-sm">
                                                                        No classes found. Please create one.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center p-4 text-muted-foreground text-sm bg-muted/20 rounded-lg">
                                                                Please select an institute first.
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 p-3 border rounded-lg bg-background shadow-inner">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <FormField
                                                                control={form.control}
                                                                name="class"
                                                                render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'class'> }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">Class Name</FormLabel>
                                                                        <FormControl><Input placeholder="e.g. 10" {...field} className="h-8 text-sm" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name="section"
                                                                render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'section'> }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">Section</FormLabel>
                                                                        <FormControl><Input placeholder="e.g. A" {...field} className="h-8 text-sm" /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={async () => {
                                                                try {
                                                                    const classData = form.getValues();
                                                                    if (classData.class && classData.section && selectedInstituteId) {
                                                                        await createClass(selectedInstituteId, classData.class, classData.section);
                                                                    }
                                                                } catch (error) {
                                                                    setError(error instanceof Error ? error.message : 'Failed to create class');
                                                                }
                                                            }}
                                                            disabled={isPending || !form.watch('class') || !form.watch('section')}
                                                        >
                                                            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                            Confirm Create
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="border-t border-dashed border-primary/20 pt-4 mt-2">
                                                <FormField control={form.control} name="roll" render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'roll'> }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm">Roll Number</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" placeholder="e.g. 25" {...field} value={field.value ?? ''} disabled={isPending} className="h-10 bg-background" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-600/20 rounded-xl mt-4 transition-all hover:scale-[1.01] active:scale-[0.98]"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
