
"use client";

import React from 'react';
import { OMRTemplate } from '@/components/omr/OMRTemplate';

export default function TemplatePage() {
    return (
        <div className="min-h-screen bg-gray-100 py-10 print:p-0 print:bg-white">
            <div className="max-w-[210mm] mx-auto print:max-w-none print:mx-0">
                <div className="mb-4 text-center print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                        Print Template
                    </button>
                    <p className="text-sm text-gray-500 mt-2">Print at 100% scale (A4 size)</p>
                </div>
                <OMRTemplate />
            </div>
        </div>
    );
}
