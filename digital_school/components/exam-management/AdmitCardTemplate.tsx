/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Student, ExamDetails, generateQRPayload } from '@/utils/exam-management';

interface AdmitCardProps {
    student: Student;
    exam: ExamDetails;
}

const AdmitCard = ({ student, exam }: AdmitCardProps) => {
    const qrPayload = generateQRPayload(student, exam.id, exam.eiin);

    return (
        // Wrapper for Cut Lines (Full Cell Size)
        <div className="w-full h-full border-r border-b border-dashed border-slate-300 p-2 relative">
            {/* Actual Card Design - Compact A6 */}
            <div className="w-full h-full border-2 border-slate-900 bg-white p-2 relative flex flex-col font-serif overflow-hidden">

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                    <div className="text-[80px] font-bold text-slate-900 -rotate-45 whitespace-nowrap">DIGITAL SCHOOL</div>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-1 mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-slate-100 ring-offset-1">
                            DS
                        </div>
                        <div>
                            <h1 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-none mb-0.5 truncate max-w-[120px]">{exam.schoolName}</h1>
                            <div className="flex items-center gap-1">
                                <span className="bg-slate-900 text-white text-[8px] px-1 py-0.5 rounded-sm font-bold uppercase tracking-widest">Admit Card</span>
                                <span className="text-[8px] uppercase font-bold text-slate-600 truncate max-w-[80px]">{exam.name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="text-right leading-none">
                            <p className="text-[8px] font-bold text-slate-500">EIIN: {exam.eiin}</p>
                            <p className="text-[8px] font-bold text-slate-500">{new Date(exam.date).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-white p-0.5 border border-slate-200">
                            <QRCodeSVG value={qrPayload} size={36} />
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 flex flex-col relative z-10 gap-1">

                    {/* Student Details Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-1">

                        {/* Name Block */}
                        <div className="border-l-2 border-slate-900 pl-2 bg-slate-50/50 py-1 col-span-2">
                            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-0.5">Student Name</div>
                            <div className="text-xs font-black text-slate-900 uppercase leading-tight line-clamp-1">{student.name}</div>
                        </div>

                        {/* Stats - Compact Rows */}
                        <div className="space-y-2">
                            <div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Class</div>
                                <div className="text-[10px] font-bold text-slate-900 border-b border-slate-200 leading-tight">{exam.className}</div>
                            </div>
                            <div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Roll No</div>
                                <div className="text-sm font-black font-mono text-slate-900 border-b border-slate-200 leading-tight">{student.roll}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Reg / ID</div>
                                <div className="text-[10px] font-mono font-bold text-slate-800 border-b border-slate-200 leading-tight">{student.registrationId}</div>
                            </div>
                            <div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Session</div>
                                <div className="text-[10px] font-bold text-slate-900 border-b border-slate-200 leading-tight">{new Date().getFullYear()}</div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="col-span-2 mt-1">
                            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Allocation</div>
                            <div className="text-[10px] font-bold text-slate-900 flex items-center justify-between bg-slate-50 px-2 py-1.5 border border-slate-200 rounded-sm">
                                <div className="flex items-center gap-1.5">
                                    <span>📍</span>
                                    <div>
                                        <div className="text-[7px] text-slate-500 uppercase leading-none">Hall / Room</div>
                                        <div className="leading-tight text-[9px]">{student.hallName || "Unassigned"} ({student.roomNo})</div>
                                    </div>
                                </div>
                                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                <div className="text-right">
                                    <div className="text-[7px] text-slate-500 uppercase leading-none">Seat</div>
                                    <div className="text-xs font-black text-slate-900">{student.seatLabel?.split(' ')[1] || "N/A"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-2 grid grid-cols-2 gap-4 items-end relative z-10 border-t border-dashed border-slate-200">
                        <div className="text-[7px] text-slate-400 leading-tight">
                            <strong className="text-slate-600 block mb-0.5 uppercase">Rules:</strong>
                            1. No electronic devices.<br />
                            2. Arrive 30 mins early.<br />
                            3. Display card regarding.
                        </div>
                        <div className="text-center">
                            {/* Signature Placeholder */}
                            <div className="h-6 w-full flex items-end justify-center">
                                {/* Optional: <img src="/sig.png" className="h-full object-contain" /> */}
                            </div>
                            <div className="w-full border-b border-slate-900 mb-0.5"></div>
                            <p className="text-[7px] font-black uppercase text-slate-900 tracking-wider">Controller of Exams</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdmitCard;
