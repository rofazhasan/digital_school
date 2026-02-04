import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Student, ExamDetails, generateQRPayload } from '@/utils/exam-management';

interface AdmitCardProps {
    student: Student;
    exam: ExamDetails;
}

export const AdmitCard = ({ student, exam }: AdmitCardProps) => {
    const qrData = generateQRPayload(student, exam.id, exam.eiin);

    return (
        <div className="border border-black p-2 h-full flex flex-col justify-between bg-white text-black relative print:break-inside-avoid overflow-hidden">
            {/* Cutoff Guides */}
            <div className="absolute -left-[1px] -top-[1px] w-2 h-2 border-l border-t border-black"></div>
            <div className="absolute -right-[1px] -top-[1px] w-2 h-2 border-r border-t border-black"></div>
            <div className="absolute -left-[1px] -bottom-[1px] w-2 h-2 border-l border-b border-black"></div>
            <div className="absolute -right-[1px] -bottom-[1px] w-2 h-2 border-r border-b border-black"></div>

            {/* Header - Compact */}
            <div className="text-center border-b border-black pb-1 mb-1">
                <h2 className="text-xs font-bold uppercase truncate leading-tight">{exam.schoolName}</h2>
                <div className="text-[9px] font-semibold">
                    ADMIT CARD | {exam.name}
                </div>
            </div>

            {/* Student Details & QR - Flex Row, very compact */}
            <div className="flex gap-2 flex-1 items-start">
                <div className="flex-1 space-y-1 text-[10px] leading-tight">
                    <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold">Name:</span>
                        <span className="font-bold truncate max-w-[80px]">{student.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold">Roll:</span>
                        <span className="font-bold">{student.roll}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold">ID:</span>
                        <span className="font-mono">{student.registrationId}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-0.5">
                        <span className="font-semibold">Class:</span>
                        <span>{exam.className}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                    <div className="border border-black p-0.5 bg-white">
                        <QRCodeSVG value={qrData} size={48} />
                    </div>
                </div>
            </div>

            {/* Footer Signatures - Minimal */}
            <div className="mt-2 pt-1 flex justify-between items-end">
                <div className="text-center w-16">
                    <div className="border-t border-black w-full mb-0.5"></div>
                    <p className="text-[7px] text-slate-500">Principal</p>
                </div>
                <div className="text-[7px] text-slate-400 self-end">
                    {new Date(exam.date).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
};

export default AdmitCard;
