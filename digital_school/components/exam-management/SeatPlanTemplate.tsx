import React, { useMemo } from 'react';
import { SeatPlanProps, generateRoomLayout, BenchAssignment } from '@/utils/exam-management';

export const SeatPlanTemplate = ({ assignments, exam, roomNumber }: SeatPlanProps) => {
    // USE CORE SYNC ENGINE
    const layout = useMemo(() => generateRoomLayout(assignments), [assignments]);
    const { benches, maxRow, maxCol } = layout;

    // Helper to render a physical bench (CAD Style)
    const renderBench = (row: number, col: number) => {
        // Find bench in layout (Optimized lookups could be done but N is small)
        const bench = benches.find(b => b.row === row && b.col === col);

        if (!bench) {
            return <div key={`empty - ${row} -${col} `} className="border-r border-b border-gray-100/10"></div>;
        }

        return (
            <div key={bench.key} className="w-full h-full border-2 border-black bg-white rounded-sm flex flex-col relative group overflow-hidden">
                {/* Bench Header (The "Steel Beam") */}
                <div className="bg-black text-white text-[8px] font-bold text-center py-0.5 tracking-widest uppercase">
                    Bench {col}
                </div>

                {/* Seats Container */}
                <div className="flex-1 flex divide-x-2 divide-black">
                    {bench.students.map((studentItem, idx) => (
                        <div key={idx} className="flex-1 flex flex-col justify-center items-center text-center relative p-1">
                            {/* Position Marker */}
                            <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-black text-white text-[6px] font-bold flex items-center justify-center rounded-full">
                                {studentItem.position}
                            </div>

                            <div className="font-mono text-2xl font-bold leading-none mt-1">
                                {studentItem.raw.seatNumber.match(/S(\d+)/)?.[1]}
                            </div>
                            <div className="text-[8px] font-bold uppercase truncate w-full mt-1 bg-slate-100 px-1">
                                {studentItem.raw.student.roll}
                            </div>
                        </div>
                    ))}
                    {/* Fill empty slot if bench has only 1 student but is a double bench? 
                        (Usually not needed physically, but visually good for "vacancy") 
                    */}
                    {bench.students.length === 1 && (
                        <div className="flex-1 bg-slate-100 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-slate-300 uppercase rotate-45">Empty</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col gap-8 break-inside-avoid print-container-A4">

            {/* VIEW 1: ARCHITECTURAL BLUEPRINT (The "CAD" View) */}
            <div className="flex flex-col h-[297mm] p-8 font-sans break-after-page relative bg-slate-50">
                {/* CAD Grid Background */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.1]"
                    style={{
                        backgroundImage: `linear - gradient(#000 1px, transparent 1px), linear - gradient(90deg, #000 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}>
                </div>

                {/* 1. Technical Header */}
                <div className="border border-black bg-white p-4 mb-8 z-10 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Project</div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-black">{exam.schoolName}</h1>
                            <div className="text-sm font-bold uppercase text-slate-900 mt-0.5">{exam.name}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Layout Plan</div>
                            <div className="text-4xl font-black text-black leading-none">RM {roomNumber}</div>
                        </div>
                    </div>
                </div>

                {/* 2. Room Blueprint */}
                <div className="flex-1 flex flex-col z-10 relative px-4">

                    {/* FRONT WALL */}
                    <div className="w-full h-2 bg-black mb-4 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 border border-black text-[8px] font-bold uppercase tracking-widest">
                            Blackboard / Instructional Wall
                        </div>
                    </div>

                    {/* TEACHER ZONE */}
                    <div className="w-full flex justify-center mb-8">
                        <div className="w-32 h-12 border-2 border-dashed border-black flex items-center justify-center bg-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Invigilator Desk</span>
                        </div>
                    </div>

                    {/* SEATING GRID */}
                    <div className="flex-1 relative">
                        {/* Axes Labels */}
                        <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-around py-4">
                            {Array.from({ length: maxRow }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-black w-4 text-center">{i + 1}</span>
                                    <div className="w-2 h-px bg-black"></div>
                                </div>
                            ))}
                        </div>
                        <div className="absolute -top-8 left-0 right-0 flex justify-around px-4">
                            {Array.from({ length: maxCol }).map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-bold text-black">{i + 1}</span>
                                    <div className="h-2 w-px bg-black"></div>
                                </div>
                            ))}
                        </div>

                        {/* The Grid Itself */}
                        <div className="grid gap-x-8 gap-y-6 h-full w-full"
                            style={{
                                gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
                                gridTemplateRows: `repeat(${maxRow}, minmax(0, 1fr))`
                            }}>
                            {Array.from({ length: maxRow }).flatMap((_, rIdx) =>
                                Array.from({ length: maxCol }).map((_, cIdx) => {
                                    return renderBench(rIdx + 1, cIdx + 1);
                                })
                            )}
                        </div>
                    </div>

                </div>

                {/* 3. Footer Legend */}
                <div className="mt-8 border-t-2 border-black pt-2 flex justify-between items-center bg-white p-2">
                    <div className="flex gap-4 text-[10px] font-bold uppercase">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-black rounded-full text-white flex items-center justify-center text-[6px]">L</div>
                            <span>Left Seat</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-black rounded-full text-white flex items-center justify-center text-[6px]">R</div>
                            <span>Right Seat</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono">
                        Generated: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* VIEW 2: DOOR LIST (Unchanged but ensures same key) -> Can be kept as High Visibility list */}
            {/* ... (Existing Door List logic can remain or be simplified) ... */}
            {/* For brevity, I'll keep the basic door list implementation but ensure it matches the visuals */}
            <div className="flex flex-col h-[297mm] p-10 font-sans bg-white break-after-page relative">
                {/* Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-black text-slate-50 -z-10 -rotate-45 select-none">
                    SEAT LIST
                </div>

                {/* Header */}
                <div className="text-center mb-8 border-b-8 border-black pb-4">
                    <h1 className="text-5xl font-black uppercase mb-2 text-slate-900">{exam.schoolName}</h1>
                    <div className="inline-flex items-center gap-4 bg-slate-900 text-white px-6 py-2 rounded-full">
                        <span className="text-2xl font-bold uppercase tracking-widest opacity-80">{exam.name}</span>
                        <span className="w-px h-8 bg-white/30"></span>
                        <span className="text-3xl font-black">ROOM {roomNumber}</span>
                    </div>
                </div>

                {/* Two-Column List */}
                <div className="flex-1 columns-2 gap-12 fill-balance">
                    {/* Reuse the pre-sorted list passed or sort again carefully if needed */}
                    {[...assignments].sort((a, b) => (parseInt(a.student.roll) || 0) - (parseInt(b.student.roll) || 0)).map((st, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b-2 border-slate-100 break-inside-avoid hover:bg-slate-50 transition-colors px-2">
                            <div className="flex items-center gap-4">
                                <span className="font-mono text-2xl font-bold text-slate-400 w-24">
                                    {st.student.roll}
                                </span>
                                <div className="flex flex-col">
                                    <span className="font-bold text-lg leading-none uppercase text-slate-900">
                                        {st.student.name}
                                    </span>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-slate-900">
                                {st.seatNumber.split(' ')[1]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default SeatPlanTemplate;
