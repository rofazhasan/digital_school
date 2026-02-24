'use client';

import React, { useState, useTransition } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Eye, EyeOff, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { triggerHaptic, ImpactStyle } from '@/lib/haptics';
import { motion } from 'framer-motion';

const securitySchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

type TSecuritySchema = z.infer<typeof securitySchema>;

export function SecuritySettings() {
    const [isPending, startTransition] = useTransition();
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const { toast } = useToast();
    const [success, setSuccess] = useState(false);

    const form = useForm<TSecuritySchema>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    });

    const onSubmit = (data: TSecuritySchema) => {
        triggerHaptic(ImpactStyle.Medium);
        startTransition(async () => {
            try {
                const response = await fetch('/api/user/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (!response.ok) {
                    triggerHaptic(ImpactStyle.Heavy);
                    toast({
                        title: 'Error',
                        description: result.message || 'Failed to update password',
                        variant: 'destructive',
                    });
                } else {
                    triggerHaptic(ImpactStyle.Medium);
                    setSuccess(true);
                    toast({
                        title: 'Success',
                        description: 'Your password has been updated securely.',
                    });
                    form.reset();
                    setTimeout(() => setSuccess(false), 5000);
                }
            } catch (error) {
                triggerHaptic(ImpactStyle.Heavy);
                toast({
                    title: 'System Error',
                    description: 'Failed to connect to security services.',
                    variant: 'destructive',
                });
            }
        });
    };

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Security Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage your account credentials</p>
                </div>
            </div>

            {success && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-600 dark:text-green-400 mb-6"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Password changed successfully!</span>
                </motion.div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Input
                                            type={showPasswords.current ? "text" : "password"}
                                            className="h-11 pl-10 pr-10"
                                            placeholder="••••••••"
                                            {...field}
                                        />
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1 h-9 w-9"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                        >
                                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Input
                                            type={showPasswords.new ? "text" : "password"}
                                            className="h-11 pl-10 pr-10"
                                            placeholder="••••••••"
                                            {...field}
                                        />
                                        <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1 h-9 w-9"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                        >
                                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            className="h-11 pl-10 pr-10"
                                            placeholder="••••••••"
                                            {...field}
                                        />
                                        <CheckCircle2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1 h-9 w-9"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        >
                                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/20"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating Security...
                            </>
                        ) : (
                            'Update Password'
                        )}
                    </Button>
                </form>
            </Form>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    Security Recommendations
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Use at least 8 characters</li>
                    <li>Include at least one uppercase letter (A-Z)</li>
                    <li>Include at least one number (0-9)</li>
                    <li>Avoid common passwords or personal information</li>
                </ul>
            </div>
        </div>
    );
}
