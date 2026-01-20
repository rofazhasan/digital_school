'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function MaintenancePage() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const res = await fetch('/api/user');
            if (res.ok) {
                const data = await res.json();
                const role = data.user?.role;
                if (role === 'ADMIN' || role === 'SUPER_USER') {
                    setIsAdmin(true);
                    // Redirect admins back to dashboard if they land here
                    // router.push('/dashboard'); 
                } else if (role === 'STUDENT' || role === 'TEACHER') {
                    // Force logout for restricted users
                    await fetch('/api/auth/logout', { method: 'POST' });
                }
            }
        } catch (error) {
            console.error('Error checking user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminAccess = () => {
        router.push('/dashboard');
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-10 w-10 text-yellow-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900">System Under Maintenance</h1>

                <p className="text-gray-600 text-lg">
                    We are currently performing scheduled maintenance to improve our services.
                    Please check back later.
                </p>

                <div className="pt-4 space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-blue-800 text-sm">
                        <h3 className="font-semibold mb-1">Students & Teachers</h3>
                        <p>Access is temporarily suspended. You have been logged out for security.</p>
                    </div>

                    {isAdmin && (
                        <div className="p-4 bg-green-50 rounded-lg text-green-800 text-sm">
                            <h3 className="font-semibold mb-1">Administrative Access</h3>
                            <p>You have administrative privileges and can access the system.</p>
                            <Button onClick={handleAdminAccess} className="mt-2 w-full bg-green-600 hover:bg-green-700">
                                Enter Dashboard
                            </Button>
                        </div>
                    )}

                    {!isAdmin && (
                        <div className="space-y-3">
                            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Check Status
                            </Button>
                            <Button onClick={() => router.push('/login')} variant="ghost" className="w-full text-xs text-muted-foreground">
                                Admin Login
                            </Button>
                        </div>
                    )}
                </div>

                <p className="text-xs text-gray-400 mt-8">
                    Code: 503 • Service Unavailable
                </p>
            </div>
        </div>
    );
}
