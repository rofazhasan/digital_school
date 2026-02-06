import React from 'react';
import { SeatAssignment, ExamDetails } from '@/utils/exam-management';

interface AttendanceSheetProps {
    assignments: SeatAssignment[];
    exam: ExamDetails;
    roomNumber: number;
}

export const AttendanceSheetTemplate = ({ assignments, exam, roomNumber }: AttendanceSheetProps) => {
    // Sort assignments Spatially (Row -> Column -> Seat) to match walking path
    const sortedAssignments = [...assignments].sort((a, b) => {
        // Parse "C1-R1-S1" from "Seat X (C1-R1-S1)" or just "C1-R1-S1"
        const parse = (s: string) => {
            const m = s.match(/C(\d+)-R(\d+)-S(\d+)/);
            if (!m) return { c: 999, r: 999, s: 999 };
            return { c: parseInt(m[1]), r: parseInt(m[2]), s: parseInt(m[3]) };
        };
        const pA = parse(a.seatNumber);
        const pB = parse(b.seatNumber);

        // Sort: Row Asc (Front to Back), then Col Asc (Left to Right), then Seat
        if (pA.r !== pB.r) return pA.r - pB.r;
        if (pA.c !== pB.c) return pA.c - pB.c;
        return pA.s - pB.s;
    });

    return (
        <div className="w-full h-full p-2 bg-white text-slate-900 font-sans relative flex flex-col">
            {/* Ultra-Compact Header */}
            <div className="border-b-2 border-black pb-1 mb-1 flex justify-between items-end">
                <div>
                    <h1 className="text-lg font-black uppercase tracking-tight leading-none">{exam.schoolName}</h1>
                    <div className="text-xs font-bold uppercase mt-1 flex gap-4">
                        <span>{exam.name}</span>
                        <span>•</span>
                        <span>{new Date(exam.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Hall {roomNumber.toString().padStart(2, '0')}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-1 border border-slate-300 rounded">
                        {assignments[0]?.student.className || 'Class N/A'}
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-hidden">
                <table className="w-full border-collapse border border-slate-900 text-[10px]">
                    <thead>
                        <tr className="bg-slate-100 text-slate-900 h-6">
                            <th className="border border-slate-500 w-12 text-center uppercase">Seat</th>
                            <th className="border border-slate-500 w-16 text-center uppercase">Roll</th>
                            <th className="border border-slate-500 px-2 text-left uppercase">Candidate Identity</th>
                            <th className="border border-slate-500 w-40 text-center uppercase">Student Signature</th>
                            <th className="border border-slate-500 w-32 text-center uppercase">Invigilator Signature</th>
                            <th className="border border-slate-500 w-24 text-center uppercase">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAssignments.map((assignment, idx) => (
                            <tr key={idx} className="h-8 hover:bg-slate-50">
                                <td className="border border-slate-400 text-center font-bold">
                                    {assignment.seatNumber.replace('Seat ', '').replace('R', '').replace('C', '-').replace('S', '')}
                                </td>
                                <td className="border border-slate-400 text-center font-mono font-bold text-xs">
                                    {assignment.student.roll}
                                </td>
                                <td className="border border-slate-400 px-2 align-middle">
                                    <div className="font-bold truncate leading-none mb-0.5">{assignment.student.name}</div>
                                    <div className="font-mono text-[9px] text-slate-500">Reg: {assignment.student.registrationId}</div>
                                </td>
                                <td className="border border-slate-400"></td>
                                <td className="border border-slate-400"></td>
                                <td className="border border-slate-400"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* High-Efficiency Summary Block */}
            <div className="mt-auto pt-2 border-t-2 border-black flex items-start gap-4 text-xs font-bold">
                <div className="flex-1 grid grid-cols-4 gap-2 border border-slate-900 p-2">
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-slate-500">Total</span>
                        <span className="text-xl">{assignments.length}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-slate-500">Present</span>
                        <span className="text-xl text-green-700">_____</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-slate-500">Absent</span>
                        <span className="text-xl text-red-600">_____</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-slate-500">Expelled</span>
                        <span className="text-xl text-red-900">_____</span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-end text-right gap-4">
                    <div className="border-b border-black w-48 ml-auto"></div>
                    <div className="uppercase text-[9px] tracking-widest text-slate-500">Controller of Examinations</div>
                </div>
            </div>

            <div className="absolute bottom-1 left-2 text-[8px] text-slate-300 uppercase">
                Generated via Integrated Logistics Framework • {new Date().toISOString().split('T')[0]}
            </div>
        </div>
    );
};

export default AttendanceSheetTemplate;
