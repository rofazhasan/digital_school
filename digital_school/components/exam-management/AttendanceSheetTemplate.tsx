import React, { useMemo } from 'react';
import { SeatAssignment, ExamDetails, generateRoomLayout } from '@/utils/exam-management';

interface AttendanceSheetProps {
    assignments: SeatAssignment[];
    exam: ExamDetails;
    roomNumber: number;
}

export const AttendanceSheetTemplate = ({ assignments, exam, roomNumber }: AttendanceSheetProps) => {
    // USE CORE SYNC ENGINE
    const layout = useMemo(() => generateRoomLayout(assignments), [assignments]);
    const { sortedAll } = layout;

    return (
        <div className="w-[297mm] h-[210mm] p-6 bg-white text-black font-sans relative flex flex-col mx-auto break-after-page landscape-print">
            <style jsx global>{`
                @media print {
                    @page { 
                        size: landscape; 
                        margin: 0;
                    }
                    .landscape-print {
                        width: 100% !important;
                        height: 100vh !important;
                    }
                }
            `}</style>

            {/* Swiss Header */}
            <div className="flex justify-between items-end mb-6 border-b-4 border-black pb-2">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Attendance Register</div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">{exam.schoolName}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="px-2 py-0.5 bg-black text-white text-sm font-bold uppercase tracking-widest">
                            {exam.name}
                        </div>
                        <div className="text-sm font-bold uppercase text-slate-900">
                            Hall / Room {roomNumber}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-black tracking-tighter text-slate-200 leading-none">
                        {new Date(exam.date).getDate()}
                    </div>
                </div>
            </div>

            {/* Swiss Table */}
            <div className="flex-1">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left font-black uppercase tracking-widest py-2 w-16">No.</th>
                            <th className="text-left font-black uppercase tracking-widest py-2 w-24">Bench</th>
                            <th className="text-left font-black uppercase tracking-widest py-2 w-24">Roll</th>
                            <th className="text-left font-black uppercase tracking-widest py-2">Candidate</th>
                            {/* Hidden Image Col - Space optimized */}
                            <th className="text-center font-black uppercase tracking-widest py-2 w-32">OMR Code</th>
                            <th className="text-center font-black uppercase tracking-widest py-2 w-48">Signature</th>
                            <th className="text-center font-black uppercase tracking-widest py-2 w-24">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAll.map((assignment, idx) => {
                            const m = assignment.seatNumber.match(/C(\d+)-R(\d+)/);
                            const benchId = m ? `R${m[2]} • B${m[1]}` : '-';

                            return (
                                <tr key={idx} className="border-b border-slate-200 h-10 hover:bg-slate-50 transition-colors">
                                    <td className="font-mono font-bold text-slate-400">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </td>
                                    <td className="font-bold text-slate-900">
                                        {benchId}
                                    </td>
                                    <td className="font-mono font-bold text-lg text-slate-900">
                                        {assignment.student.roll}
                                    </td>
                                    <td className="py-1">
                                        <div className="font-bold uppercase leading-none">{assignment.student.name}</div>
                                        <div className="text-[9px] text-slate-500 uppercase mt-0.5 tracking-wider">
                                            ID: {assignment.student.registrationId}
                                        </div>
                                    </td>
                                    <td className="text-center align-middle">
                                        {/* Blank box for OMR */}
                                        <div className="w-20 h-6 border border-slate-300 mx-auto bg-slate-50"></div>
                                    </td>
                                    <td className="text-center align-middle">
                                        <div className="w-full h-px bg-slate-300"></div>
                                    </td>
                                    <td className="text-center align-middle">
                                        <div className="flex gap-1 justify-center">
                                            <div className="w-6 h-6 border border-black rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-black hover:text-white cursor-pointer transition-colors">P</div>
                                            <div className="w-6 h-6 border border-slate-200 text-slate-300 rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-500 hover:text-white cursor-pointer transition-colors">A</div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t-2 border-black flex justify-between">
                <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-500">
                    <span>Total Students: {sortedAll.length}</span>
                    <span>Printed: {new Date().toLocaleString()}</span>
                </div>
                <div className="flex gap-12">
                    <div className="flex flex-col text-right">
                        <div className="w-40 border-b border-black mb-1"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Invigilator</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <div className="w-40 border-b border-black mb-1"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Chief Superintendent</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AttendanceSheetTemplate;
