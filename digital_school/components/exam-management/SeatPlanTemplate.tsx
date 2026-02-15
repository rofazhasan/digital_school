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

    // Sort for Door List (By Roll)
    const doorList = [...assignments].sort((a, b) => {
        return (parseInt(a.student.roll) || 0) - (parseInt(b.student.roll) || 0);
    });

    return (
        <div className="w-full h-full flex flex-col gap-8 break-inside-avoid">

            {/* VIEW 1: SEAT MAP (For Teacher/Inside Room) */}
            <div className="flex flex-col h-[297mm] p-6 font-sans break-after-page">
                {/* Header */}
                <div className="border-b-4 border-black pb-2 mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-wider">{exam.schoolName}</h1>
                        <div className="text-xl font-bold mt-1 bg-black text-white px-2 inline-block">SEAT PLAN / ROOM: {roomNumber}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold uppercase tracking-widest text-slate-500">Date</div>
                        <div className="text-lg font-bold">
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
                            <div key={key} className="border-2 border-slate-900 bg-slate-50 p-1 flex flex-col gap-1 rounded-sm shadow-sm">
                                <div className="text-[10px] font-bold text-center uppercase text-slate-400 tracking-widest border-b border-slate-200">
                                    R{row}-C{col}
                                </div>
                                <div className="flex gap-1">
                                    {benchSeats.map((assignment, idx) => (
                                        <div key={idx} className="flex-1 border border-slate-300 bg-white p-1 min-w-[50px] flex flex-col items-center justify-center text-center">
                                            <div className="text-xl font-black leading-none mb-0.5">
                                                {assignment.seatNumber.match(/S(\d+)/)?.[1] || '?'}
                                            </div>
                                            <div className="text-[8px] font-bold uppercase leading-tight truncate w-full px-1 bg-slate-100 rounded-sm mb-0.5">
                                                {assignment.student.className}
                                            </div>
                                            <div className="text-xs font-bold font-mono">
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

            {/* VIEW 2: DOOR LIST (For Students/Outside Door) */}
            <div className="flex flex-col h-[297mm] p-8 font-sans bg-white break-after-page relative">
                <div className="absolute top-2 right-2 text-[100px] font-black text-slate-100 -z-10 rotate-12">DOOR LIST</div>

                {/* Header */}
                <div className="border-b-4 border-black pb-4 mb-6 text-center">
                    <h1 className="text-4xl font-black uppercase tracking-wider mb-2">{exam.schoolName}</h1>
                    <div className="flex justify-center gap-4 items-center">
                        <div className="text-2xl font-bold bg-black text-white px-4 py-1">ROOM: {roomNumber}</div>
                        <div className="text-xl font-bold uppercase text-slate-600">Seat Allocation List</div>
                    </div>
                </div>

                {/* List Columns */}
                <div className="columns-2 gap-8 flex-1">
                    {doorList.map((st, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-300 py-2 break-inside-avoid">
                            <div className="flex items-center gap-4">
                                <div className="font-mono text-xl font-bold text-slate-500 w-16">{st.student.roll}</div>
                                <div>
                                    <div className="font-bold text-lg uppercase leading-none">{st.student.name}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">{st.student.className}</div>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-right min-w-[60px]">
                                {st.seatNumber.split(' ')[1]}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center font-bold uppercase text-slate-400">
                    Calculated & Generated by Digital School System
                </div>
            </div>

        </div>
    );
};

export default SeatPlanTemplate;
