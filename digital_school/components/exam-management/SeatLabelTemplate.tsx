import React from 'react';
import { SeatAssignment, ExamDetails } from '@/utils/exam-management';
import { QRCodeSVG } from 'qrcode.react';

interface SeatLabelProps {
    assignment: SeatAssignment;
    exam: ExamDetails;
    position?: 'L' | 'R' | 'S'; // Left, Right, Single (Passed from Core Engine)
    benchLabel?: string;        // "Row 1 • Bench 2" (Passed from Core Engine)
}

export const SeatLabelTemplate = ({ assignment, exam, position, benchLabel }: SeatLabelProps) => {
    // Fallback logic if props not passed (Core Engine Sync Safety)
    const m = assignment.seatNumber.match(/C(\d+)-R(\d+)-S(\d+)/);
    const row = m ? m[2] : '?';
    const col = m ? m[1] : '?';

    // Aesthetic "Swiss" Typography Class
    const fontMain = "font-sans tracking-tight";

    return (
        <div className="w-full h-full flex flex-row bg-black text-white overflow-hidden relative break-inside-avoid border border-slate-800">

            {/* LEFT: The "Info Block" (White on Black) */}
            <div className="w-[40%] h-full flex flex-col justify-between p-3 border-r border-slate-800 relative">
                {/* School & Exam */}
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        {exam.schoolName}
                    </div>
                    <div className="text-[8px] font-medium uppercase text-slate-500 leading-tight">
                        {exam.name}
                    </div>
                </div>

                {/* Coordinates (The "Navigator") */}
                <div className="flex flex-col gap-2 my-1">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[8px] uppercase font-bold text-slate-500">ROW</span>
                        <span className="text-xl font-bold leading-none">{row}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[8px] uppercase font-bold text-slate-500">BENCH</span>
                        <span className="text-xl font-bold leading-none">{col}</span>
                    </div>
                </div>

                {/* QR Verification (Placeholder for "Scan to Verify") */}
                <div className="mt-auto">
                    <div className="bg-white p-1 w-fit rounded-sm">
                        <QRCodeSVG
                            value={JSON.stringify({ id: assignment.student.id, roll: assignment.student.roll })}
                            size={32}
                            level="L"
                        />
                    </div>
                    <div className="text-[6px] uppercase font-bold text-slate-600 mt-1 tracking-wider">
                        SCAN TO VERIFY
                    </div>
                </div>
            </div>

            {/* RIGHT: The "Candidate Block" (Inverted Area) */}
            <div className="flex-1 h-full bg-white text-black relative flex flex-col p-3">

                {/* Position Badge (Floating) */}
                <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-lg">
                    {position === 'L' ? 'LEFT' : position === 'R' ? 'RIGHT' : 'SINGLE'}
                </div>

                {/* Seat Number (Massive) */}
                <div className="flex-1 flex flex-col justify-center items-center mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-[-5px]">SEAT</span>
                    <span className="text-[5rem] font-bold leading-none tracking-tighter">
                        {assignment.seatNumber.match(/S(\d+)/)?.[1]}
                    </span>
                </div>

                {/* Candidate Details */}
                <div className="mt-auto border-t-2 border-black pt-2">
                    <div className="flex justify-between items-end">
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="text-[8px] font-bold uppercase text-slate-500 tracking-wider mb-0.5">Candidate</div>
                            <div className="text-sm font-black uppercase truncate leading-none">
                                {assignment.student.name}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[8px] font-bold uppercase text-slate-500 tracking-wider mb-0.5">Roll No</div>
                            <div className="text-xl font-mono font-bold leading-none">
                                {assignment.student.roll}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* CUT GUIDES */}
            <div className="absolute inset-0 border border-dashed border-white/20 pointer-events-none"></div>
        </div>
    );
};

export default SeatLabelTemplate;
