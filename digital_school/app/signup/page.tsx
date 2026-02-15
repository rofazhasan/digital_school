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
import { Eye, EyeOff, Loader2, PartyPopper, AlertCircle, Home, Mail, Phone, Building, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ControllerRenderProps } from 'react-hook-form';

export default function SignupPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [institutes, setInstitutes] = useState<Array<{id: string, name: string}>>([]);
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
        setContactMethod(method);
        if (method === 'email') {
            form.setValue('phone', '');
        } else {
            form.setValue('email', '');
        }
    };

    const onSubmit = (data: TSignupSchema) => {
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
                    setError(result.message || 'An unexpected error occurred.');
                } else {
                    setSuccess(true);
                    form.reset();
                }
            } catch {
                setError('Failed to connect to the server. Please try again.');
            }
        });
    };

    // Don't render until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <Card className="w-full max-w-lg shadow-xl">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="w-full max-w-md text-center">
                        <CardHeader>
                            <motion.div
                                className="mx-auto"
                                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
                            >
                                <PartyPopper className="h-16 w-16 text-green-500" />
                            </motion.div>
                            <CardTitle className="text-2xl font-bold text-green-600">Account Created!</CardTitle>
                            <CardDescription>
                                Welcome aboard! Your account has been successfully created.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>You can now proceed to login with your new credentials.</p>
                            <Button asChild className="mt-6 w-full">
                                <Link href="/login">Go to Login</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            {/* Home Button */}
            <Button
                asChild
                variant="ghost"
                className="absolute top-4 left-4 z-10"
            >
                <Link href="/">
                    <Home className="h-5 w-5 mr-2" />
                    Home
                </Link>
            </Button>

            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Create your Account</CardTitle>
                    <CardDescription>Enter your details below to register.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
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
                                                <Input placeholder="John Doe" {...field} disabled={isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                {/* Contact Method Toggle */}
                                <div className="space-y-2">
                                    <FormLabel>Contact Method</FormLabel>
                                    <div className="flex rounded-lg border p-1 bg-muted/50">
                                        <button
                                            type="button"
                                            onClick={() => handleContactMethodChange('email')}
                                            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                                                contactMethod === 'email'
                                                    ? 'bg-background text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <Mail className="h-4 w-4 mr-2" />
                                            Email
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleContactMethodChange('phone')}
                                            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                                                contactMethod === 'phone'
                                                    ? 'bg-background text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <Phone className="h-4 w-4 mr-2" />
                                            Phone
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
                                                <Input 
                                                    type="email"
                                                    placeholder="john.doe@example.com"
                                                    {...field} 
                                                    disabled={isPending} 
                                                />
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
                                                <Input 
                                                    type="tel"
                                                    placeholder="+8801712345678"
                                                    {...field} 
                                                    disabled={isPending} 
                                                />
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
                                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isPending} />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
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
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
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
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={loadingInstitutes ? "Loading institutes..." : "Select an institute"} />
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
                                        transition={{ duration: 0.3, ease: "easeInOut" as const }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-4 rounded-md border bg-muted/50 p-4 mt-4">
                                            {/* Class Selection */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-medium">Class & Section</h4>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowCreateClass(!showCreateClass)}
                                                        disabled={!selectedInstituteId || loadingClasses}
                                                    >
                                                        {showCreateClass ? 'Cancel' : 'Create New Class'}
                                                    </Button>
                                                </div>

                                                {!showCreateClass ? (
                                                    // Existing Class Selection
                                                    <div className="space-y-4">
                                                        {selectedInstituteId ? (
                                                            <div className="space-y-2">
                                                                <FormLabel>Select Class</FormLabel>
                                                                {loadingClasses ? (
                                                                    <div className="flex items-center justify-center p-4">
                                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                        Loading classes...
                                                                    </div>
                                                                ) : classes.length > 0 ? (
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {classes.map((cls) => (
                                                                            <div
                                                                                key={cls.id}
                                                                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                                                                    form.watch('class') === cls.name && form.watch('section') === cls.section
                                                                                        ? 'border-primary bg-primary/5'
                                                                                        : 'border-border hover:border-primary/50'
                                                                                }`}
                                                                                onClick={() => {
                                                                                    form.setValue('class', cls.name);
                                                                                    form.setValue('section', cls.section);
                                                                                }}
                                                                            >
                                                                                <div>
                                                                                    <div className="font-medium">{cls.displayName}</div>
                                                                                    <div className="text-sm text-muted-foreground">
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
                                                                    <div className="text-center p-4 text-muted-foreground">
                                                                        <p>No classes found in this institute.</p>
                                                                        <p className="text-sm">Click "Create New Class" to add one.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center p-4 text-muted-foreground">
                                                                <p>Please select an institute first.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Create New Class Form
                                                    <div className="space-y-4 p-4 border rounded-lg bg-background">
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            <FormField
                                                                control={form.control}
                                                                name="class"
                                                                render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'class'> }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Class Name *</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="e.g., 10" {...field} disabled={isPending} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name="section"
                                                                render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'section'> }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Section *</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="e.g., A" {...field} disabled={isPending} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
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
                                                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Create Class
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => setShowCreateClass(false)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Roll Number */}
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <FormField control={form.control} name="roll" render={({ field }: { field: ControllerRenderProps<TSignupSchema, 'roll'> }) => (
                                                    <FormItem><FormLabel>Roll Number *</FormLabel><FormControl><Input type="number" placeholder="e.g., 25" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                                <div className="flex items-center justify-center">
                                                    <div className="text-sm text-muted-foreground text-center">
                                                        <p>Registration number will be</p>
                                                        <p>automatically generated</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </form>
                    </Form>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
