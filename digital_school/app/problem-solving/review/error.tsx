"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Session Error</h2>
                <p className="text-gray-500 mb-8">
                    We encountered an issue loading the review session. This might be due to missing data or a temporary glitch.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => window.close()} variant="outline">
                        Close
                    </Button>
                    <Button onClick={() => reset()} className="bg-indigo-600 hover:bg-indigo-700">
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}
