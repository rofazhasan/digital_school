'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]" />
            </div>

            <Card className="w-full max-w-md border-0 shadow-2xl glass-card text-center">
                <CardHeader className="space-y-4 pb-2">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-2">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Something went wrong!</CardTitle>
                    <p className="text-muted-foreground">
                        We encountered an unexpected error. Our team has been notified.
                    </p>
                </CardHeader>
                <CardContent className="pb-6">
                    <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono text-left break-all text-muted-foreground">
                        {error.message || "Unknown error occurred"}
                        {error.digest && (
                            <div className="mt-2 text-xs opacity-70">
                                Digest: {error.digest}
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={reset}
                        className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg shadow-red-500/20"
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" /> Try again
                    </Button>
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" /> Go Home
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
