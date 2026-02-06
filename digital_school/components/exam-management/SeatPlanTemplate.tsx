import React from 'react';
import { SeatPlanProps } from '@/utils/exam-management';

export const SeatPlanTemplate = ({ assignments, exam, roomNumber }: SeatPlanProps) => {
    // Group by Bench (C-R) to visualize "Real Benches"
    const benches: Record<string, typeof assignments> = {};
    assignments.forEach(a => {
        // Extract C and R
        const m = a.seatNumber.match(/C(\d+)-R(\d+)/);
        if (m) {
            const key = `R${m[2]}-C${m[1]}`; // Key by Row-Col
            if (!benches[key]) benches[key] = [];
            benches[key].push(a);
        }
    });

    // Sort Benches Spatially: Row 1 (C1, C2...) -> Row 2...
    const sortedBenchKeys = Object.keys(benches).sort((a, b) => {
        const [rA, cA] = a.replace('R', '').split('-C').map(Number);
        const [rB, cB] = b.replace('R', '').split('-C').map(Number);
        if (rA !== rB) return rA - rB;
        return cA - cB;
    });

    // Calculate Max Cols dynamically
    let maxCol = 1;
    sortedBenchKeys.forEach(k => {
        const c = parseInt(k.split('-C')[1]);
        if (c > maxCol) maxCol = c;
    });

    return (
        <div className="h-full flex flex-col p-6 font-sans">
            {/* Header */}
            <div className="border-b-2 border-black pb-2 mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-wider">{exam.schoolName}</h1>
                    <div className="text-sm font-bold mt-1">SEAT PLAN / ROOM: {roomNumber}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold bg-black text-white px-2 py-1 inline-block mb-1">
                        {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Room Grid - Benches */}
            <div className="grid gap-6 content-start" style={{ gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))` }}>
                {sortedBenchKeys.map((key) => {
                    const benchSeats = benches[key];
                    // Sort seats in bench (S1, S2)
                    benchSeats.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));

                    const [row, col] = key.replace('R', '').split('-C');

                    return (
                        <div key={key} className="border-2 border-slate-800 bg-slate-50 p-2 flex flex-col gap-2 rounded-sm shadow-sm">
                            <div className="text-[10px] font-bold text-center uppercase text-slate-400 tracking-widest mb-1 border-b border-slate-200">
                                Bench R{row}-C{col}
                            </div>
                            <div className="flex gap-2">
                                {benchSeats.map((assignment, idx) => (
                                    <div key={idx} className="flex-1 border border-slate-300 bg-white p-2 min-w-[60px] flex flex-col items-center justify-center text-center">
                                        <div className="text-2xl font-black leading-none mb-1">
                                            {assignment.seatNumber.match(/S(\d+)/)?.[1] || '?'}
                                        </div>
                                        <div className="text-[9px] font-bold uppercase leading-tight truncate w-full">
                                            {assignment.student.className}
                                        </div>
                                        <div className="text-sm font-bold font-mono">
                                            {assignment.student.roll}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Summary */}
            <div className="mt-auto pt-4 border-t-2 border-black flex justify-between items-center text-xs font-bold">
                <div>Invigilator Signature: _______________________</div>
                <div>Total Candidates: {assignments.length}</div>
            </div>
        </div>
    );
};

export default SeatPlanTemplate;
