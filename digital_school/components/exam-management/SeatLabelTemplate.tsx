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
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-[-5px]">Seat Number</span>
                <span className="text-[5rem] font-black tracking-tighter leading-none stroke-black">
                    {assignment.seatNumber.split(' ')[1]}
                </span>
            </div>

            {/* Student Info - Clean Typography */}
            <div className="flex-[2] px-3 pb-2 flex flex-col justify-center text-center space-y-1 bg-slate-50/50 border-t-2 border-black">
                <div className="w-full">
                    <div className="font-extrabold text-lg leading-tight break-words line-clamp-2 uppercase">
                        {assignment.student.name}
                    </div>
                </div>

                <div className="w-full flex justify-center gap-6 text-sm mt-1">
                    <div className="flex flex-col items-center">
                        <span className="text-[7px] uppercase font-bold text-slate-500">Roll No</span>
                        <span className="font-mono font-bold text-xl">{assignment.student.roll}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[7px] uppercase font-bold text-slate-500">Reg No</span>
                        <span className="font-mono font-bold text-xl">{assignment.student.registrationId}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeatLabelTemplate;
