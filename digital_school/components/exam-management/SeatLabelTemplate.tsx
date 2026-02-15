import React from 'react';
import { SeatAssignment, ExamDetails } from '@/utils/exam-management';

interface SeatLabelProps {
    assignment: SeatAssignment;
    exam: ExamDetails;
}

export const SeatLabelTemplate = ({ assignment, exam }: SeatLabelProps) => {
    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden relative text-black pt-1">

            {/* Header */}
            <div className="flex justify-between items-center px-2 py-1 border-b-2 border-black bg-slate-50">
                <span className="text-[8px] uppercase font-bold tracking-widest text-slate-600">{exam.schoolName}</span>
                <span className="text-[8px] font-bold bg-black text-white px-1.5 py-0.5 rounded-sm">{exam.name}</span>
            </div>

            {/* Massive Seat Number - High Contrast (Black on White) */}
            <div className="flex-[3] flex flex-col items-center justify-center relative my-1">
                <span className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-300 mb-[-10px]">SEAT</span>
                <span className="text-[6rem] font-black tracking-tighter leading-none text-black drop-shadow-sm">
                    {assignment.seatNumber.split(' ')[1]}
                </span>
            </div>

            {/* Student Info - Clean Typography */}
            <div className="flex-[2] px-3 pb-2 flex flex-col justify-center text-center space-y-1 bg-slate-100 border-t-4 border-black relative">
                {/* ID Arrow */}
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-black"></div>

                <div className="w-full">
                    <div className="font-black text-xl leading-tight break-words line-clamp-2 uppercase">
                        {assignment.student.name}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">{exam.className} | {exam.name}</div>
                </div>

                <div className="w-full flex justify-center gap-6 text-sm mt-2 border-t border-slate-300 pt-2">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Roll No</span>
                        <span className="font-mono font-black text-2xl">{assignment.student.roll}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Reg No</span>
                        <span className="font-mono font-bold text-xl text-slate-700">{assignment.student.registrationId}</span>
                    </div>
                </div>
            </div>

            {/* Cut Lines */}
            <div className="absolute inset-0 border border-dashed border-slate-300 pointer-events-none"></div>
        </div>
    );
};

export default SeatLabelTemplate;
