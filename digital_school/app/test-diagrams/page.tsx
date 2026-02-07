'use client';

import React, { useMemo } from 'react';
import { UniversalMathJax } from '@/app/components/UniversalMathJax';
import { getAvailablePresets } from '@/utils/diagrams';
import { MathJaxContext } from 'better-react-mathjax';

export default function TestDiagramsPage() {
    const presets = useMemo(() => getAvailablePresets(), []);

    // Repeat presets 3 times to reach ~1062 diagrams (more stable than 3000+)
    const repeatedPresets = useMemo(() => {
        const result = [];
        for (let i = 0; i < 3; i++) {
            result.push(...presets);
        }
        return result;
    }, [presets]);

    return (
        <MathJaxContext>
            <div className="p-8 bg-gray-50 min-h-screen">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold text-blue-900 mb-2">🚀 Diagram System Stress Test</h1>
                    <p className="text-lg text-gray-600">Rendering {repeatedPresets.length} World-Class Diagrams Locally</p>
                    <div className="mt-4 flex justify-center gap-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Presets: {presets.length}
                        </span>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Total Instances: {repeatedPresets.length}
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {repeatedPresets.map((preset, index) => (
                        <div
                            key={`${preset}-${index}`}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center justify-between min-h-[250px]"
                        >
                            <div className="w-full flex-grow flex items-center justify-center mb-4">
                                <UniversalMathJax inline={false}>
                                    {`##PRESET:${preset}##`}
                                </UniversalMathJax>
                            </div>
                            <div className="text-center">
                                <code className="text-xs font-mono text-gray-400 block mb-1">#{index + 1}</code>
                                <span className="text-sm font-bold text-gray-800 break-all">{preset}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="mt-16 text-center text-gray-400 text-sm">
                    Digital School Diagram Engine - World-Class Verification
                </footer>
            </div>
        </MathJaxContext>
    );
}
