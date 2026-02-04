import React from 'react';
import { SeatAssignment, ExamDetails } from '@/utils/exam-management';

interface SeatLabelProps {
    assignment: SeatAssignment;
    exam: ExamDetails;
}

export const SeatLabelTemplate = ({ assignment, exam }: SeatLabelProps) => {
    return (
        <div className="w-full h-full border border-black p-2 flex flex-col justify-center items-center text-center bg-white relative">
            {/* Small branding */}
            <div className="text-[8px] uppercase font-bold text-slate-600 absolute top-1 left-0 w-full text-center">
                {exam.schoolName}
            </div>

            <div className="mt-2">
                <span className="block text-[10px] uppercase tracking-wider font-semibold">Seat Number</span>
                <span className="block text-3xl font-bold leading-none">{assignment.seatNumber}</span>
            </div>

            <div className="mt-1 w-full border-t border-dashed border-slate-300 pt-1">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-semibold">Roll: {assignment.student.roll}</span>
                    <span className="text-[10px] font-mono text-slate-500">{assignment.student.registrationId}</span>
                </div>
                <div className="text-[9px] font-bold truncate px-1 mt-0.5">
                    {assignment.student.name}
                </div>
            </div>

            <div className="absolute bottom-0.5 right-1 text-[6px] text-slate-400">
                Room: {assignment.roomNumber}
            </div>
        </div>
    );
};

export default SeatLabelTemplate;
