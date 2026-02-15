
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface OMRTemplateProps {
    examName?: string;
    studentName?: string;
}

export const OMRTemplate: React.FC<OMRTemplateProps> = ({ examName = "PHYSICS EXAM", studentName = "" }) => {
    // 4 Corner Anchors
    const anchors = {
        tl: { loc: "TL", v: 2 },
        tr: { loc: "TR", v: 2 },
        bl: { loc: "BL", v: 2 },
        br: { loc: "BR", v: 2 }
    };

    const renderAnswers = () => {
        const blocks = [];
        for (let b = 0; b < 4; b++) {
            const rows = [];
            for (let q = 0; q < 25; q++) {
                const qNum = (b * 25) + q + 1;
                rows.push(
                    <div key={q} className="flex items-center gap-2 mb-1.5">
                        <span className="w-6 text-xs font-bold text-gray-700 text-right">{qNum}</span>
                        <div className="flex gap-2">
                            {['A', 'B', 'C', 'D'].map(opt => (
                                <div key={opt} className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
            blocks.push(
                <div key={b} className="flex flex-col">
                    {rows}
                </div>
            );
        }
        return blocks;
    };

    return (
        <div className="w-[210mm] h-[297mm] bg-white relative p-10 mx-auto border border-gray-200 print:border-none">
            {/* CORNER ANCHORS */}
            <div className="absolute top-8 left-8">
                <QRCodeSVG value={JSON.stringify(anchors.tl)} size={50} level="M" />
            </div>
            <div className="absolute top-8 right-8">
                <QRCodeSVG value={JSON.stringify(anchors.tr)} size={50} level="M" />
            </div>
            <div className="absolute bottom-8 left-8">
                <QRCodeSVG value={JSON.stringify(anchors.bl)} size={50} level="M" />
            </div>
            <div className="absolute bottom-8 right-8">
                <QRCodeSVG value={JSON.stringify(anchors.br)} size={50} level="M" />
            </div>

            {/* HEADER */}
            <div className="mt-16 mb-8 text-center">
                <h1 className="text-3xl font-bold text-black uppercase tracking-wider mb-2">{examName}</h1>
                <p className="text-sm text-gray-600">Please fill the bubbles completely. Use Black/Blue Ballpoint Pen.</p>
            </div>

            {/* IDENTITY SECTION (ROLL / SET) */}
            <div className="flex justify-center gap-16 mb-10">
                {/* ROLL NUMBER (6 Digits) */}
                <div className="flex flex-col items-center">
                    <h3 className="font-bold mb-2">ROLL NUMBER</h3>
                    <div className="flex gap-2 border-2 border-black p-2 rounded-lg">
                        {Array.from({ length: 6 }).map((_, col) => (
                            <div key={col} className="flex flex-col gap-1">
                                <div className="w-6 h-8 border border-gray-400 mb-1"></div>
                                {Array.from({ length: 10 }).map((_, row) => (
                                    <div key={row} className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-[10px] text-gray-400">
                                        {row}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* SET CODE (1 Digit) */}
                <div className="flex flex-col items-center">
                    <h3 className="font-bold mb-2">SET</h3>
                    <div className="flex gap-2 border-2 border-black p-2 rounded-lg">
                        <div className="flex flex-col gap-1">
                            <div className="w-6 h-8 border border-gray-400 mb-1"></div>
                            {['A', 'B', 'C', 'D'].map((code) => (
                                <div key={code} className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-[10px] text-gray-400">
                                    {code}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ANSWERS GRID */}
            <div className="grid grid-cols-4 gap-8 px-4">
                {renderAnswers()}
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 w-full text-center left-0">
                <p className="text-xs text-gray-400">OMR 2.0 System Generated | Digital School</p>
            </div>
        </div>
    );
};
