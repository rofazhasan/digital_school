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
            {/* Header */}
            <div className="border-b-4 border-black pb-4 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {/* Logo Placeholder */}
                    <div className="w-16 h-16 border-2 border-slate-900 rounded-full flex items-center justify-center font-bold text-2xl text-slate-300 bg-slate-50">
                        DS
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight leading-none">{exam.schoolName}</h1>
                        <div className="text-lg font-bold uppercase mt-1 text-slate-700">ATTENDANCE REGISTER</div>
                    </div>
                </div>

                <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-bold uppercase text-slate-500">Exam:</span>
                        <span className="font-bold">{exam.name}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-bold uppercase text-slate-500">Date:</span>
                        <span className="font-bold">{new Date(exam.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-bold uppercase text-slate-500">Hall:</span>
                        <span className="font-black bg-black text-white px-2 rounded-sm">{roomNumber.toString().padStart(2, '0')}</span>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-visible">
                <table className="w-full border-collapse border border-slate-900 text-[10px]">
                    <thead>
                        <tr className="bg-slate-800 text-white h-8">
                            <th className="border border-slate-600 w-10 text-center uppercase">Seat</th>
                            <th className="border border-slate-600 w-16 text-center uppercase">Roll</th>
                            <th className="border border-slate-600 w-12 text-center uppercase">Photo</th>
                            <th className="border border-slate-600 px-2 text-left uppercase">Candidate Identity</th>
                            <th className="border border-slate-600 w-24 text-center uppercase">OMR Sheet No.</th>
                            <th className="border border-slate-600 w-32 text-center uppercase">Candidate Signature</th>
                            <th className="border border-slate-600 w-24 text-center uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAssignments.map((assignment, idx) => (
                            <tr key={idx} className="h-10 border-b border-slate-300">
                                <td className="border-r border-slate-300 text-center font-bold text-lg text-slate-400">
                                    {assignment.seatNumber.match(/S(\d+)/)?.[1]}
                                </td>
                                <td className="border-r border-slate-300 text-center font-mono font-bold text-sm">
                                    {assignment.student.roll}
                                </td>
                                <td className="border-r border-slate-300 text-center p-1">
                                    {/* Photo Placeholder */}
                                    <div className="w-8 h-8 bg-slate-100 mx-auto rounded-sm border border-slate-200"></div>
                                </td>
                                <td className="border-r border-slate-300 px-2 align-middle">
                                    <div className="font-bold truncate leading-none mb-0.5 text-xs uppercase">{assignment.student.name}</div>
                                    <div className="font-mono text-[9px] text-slate-500">ID: {assignment.student.registrationId} | {assignment.student.className}</div>
                                </td>
                                <td className="border-r border-slate-300 text-center">
                                    <div className="w-full h-6 border-b border-dashed border-slate-300"></div>
                                </td>
                                <td className="border-r border-slate-300"></td>
                                <td className="border-r border-slate-300 text-center px-1">
                                    <div className="flex gap-2 justify-center">
                                        <div className="w-4 h-4 border border-slate-400 rounded-full"></div>
                                        <span className="text-[8px] text-slate-400">P / A</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* High-Efficiency Summary Block */}
            <div className="mt-auto pt-4 border-t-4 border-black flex items-start gap-8 text-xs font-bold">
                <div className="flex-1 grid grid-cols-3 gap-0 border-2 border-slate-900 bg-slate-50">
                    <div className="flex flex-col border-r border-slate-300 p-2 text-center">
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider">Total Allocated</span>
                        <span className="text-2xl font-black">{assignments.length}</span>
                    </div>
                    <div className="flex flex-col border-r border-slate-300 p-2 text-center">
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider">Present</span>
                        <span className="text-2xl font-black text-transparent border-b border-slate-900 w-12 mx-auto mt-1">_</span>
                    </div>
                    <div className="flex flex-col p-2 text-center">
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider">Absent</span>
                        <span className="text-2xl font-black text-transparent border-b border-slate-900 w-12 mx-auto mt-1">_</span>
                    </div>
                </div>

                <div className="flex-1 flex justify-end gap-12 pt-4">
                    <div className="text-center">
                        <div className="w-48 border-b-2 border-slate-900 mb-1"></div>
                        <div className="uppercase text-[9px] tracking-widest font-bold text-slate-900">Invigilator Signature</div>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b-2 border-slate-900 mb-1"></div>
                        <div className="uppercase text-[9px] tracking-widest font-bold text-slate-900">Center Superintendent</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceSheetTemplate;
