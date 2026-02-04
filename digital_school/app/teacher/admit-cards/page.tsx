'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Printer,
    Download,
    Search,
    Users,
    FileText,
    ClipboardCheck,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
    sortStudents,
    generateSeatPlan,
    chunkArray,
    Student,
    ExamDetails
} from '@/utils/exam-management';
import AdmitCard from '@/components/exam-management/AdmitCardTemplate';
import SeatPlanTemplate from '@/components/exam-management/SeatPlanTemplate';
import AttendanceSheetTemplate from '@/components/exam-management/AttendanceSheetTemplate';


// Mock Data (Replace with API calls)
const MOCK_STUDENTS: Student[] = Array.from({ length: 45 }).map((_, i) => ({
    id: `STU${1000 + i}`,
    name: `Student Name ${i + 1}`,
    roll: (i + 1).toString().padStart(2, '0'),
    registrationId: `REG${2024000 + i}`,
    classId: 'CLASS-8',
    gender: i % 2 === 0 ? 'Male' : 'Female'
}));

const MOCK_EXAM: ExamDetails = {
    id: 'EXAM001',
    name: 'Half Yearly Examination 2026',
    date: new Date('2026-06-15'),
    schoolName: 'Digital School & College',
    eiin: '134567',
    className: 'Class 8',
    hallName: 'Main Building'
};

export default function AdmitCardManagementPage() {
    const [selectedExam, setSelectedExam] = useState<string>('EXAM001');
    const [selectedClass, setSelectedClass] = useState<string>('CLASS-8');
    const [viewMode, setViewMode] = useState<'admit' | 'seat' | 'attendance'>('admit');

    // State for fetched data
    const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
    const [examDetails, setExamDetails] = useState<ExamDetails>(MOCK_EXAM);

    // Computed chunks based on view mode
    const sortedStudents = sortStudents(students);
    const admitCardPages = chunkArray(sortedStudents, 4); // 4 per page
    const seatPlans = generateSeatPlan(sortedStudents, 24); // 24 per page
    const attendancePlans = generateSeatPlan(sortedStudents, 30); // 30 per page

    const printRef = useRef(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `${viewMode}-print-${new Date().toISOString()}`,
    });

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exam Management</h1>
                    <p className="text-slate-500">Generate Official Admit Cards, Seat Plans & Attendance Sheets</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handlePrint()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print / PDF
                    </Button>
                    {/* <Button>
                <Download className="w-4 h-4 mr-2" />
                Download All
            </Button> */}
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Select Exam</label>
                            <Select value={selectedExam} onValueChange={setSelectedExam}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Exam" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXAM001">Half Yearly Examination 2026</SelectItem>
                                    <SelectItem value="EXAM002">Annual Examination 2026</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Select Class</label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CLASS-8">Class 8</SelectItem>
                                    <SelectItem value="CLASS-9">Class 9</SelectItem>
                                    <SelectItem value="CLASS-10">Class 10</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <Search className="w-4 h-4 mr-2" />
                                Load Data
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* View Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="admit" className="gap-2">
                        <FileText className="w-4 h-4" /> Admit Cards
                    </TabsTrigger>
                    <TabsTrigger value="seat" className="gap-2">
                        <Users className="w-4 h-4" /> Seat Plan
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="gap-2">
                        <ClipboardCheck className="w-4 h-4" /> Attendance
                    </TabsTrigger>
                </TabsList>

                <div className="border rounded-xl bg-slate-100/50 p-4 min-h-[500px] overflow-auto">
                    {/* Print Preview Area */}
                    <div className="mx-auto max-w-[210mm] transition-all transform origin-top" ref={printRef}>

                        {viewMode === 'admit' && (
                            <div className="flex flex-col gap-8 print:block">
                                {admitCardPages.map((page, pageIndex) => (
                                    <div
                                        key={pageIndex}
                                        className="bg-white shadow-xl print:shadow-none w-[210mm] h-[297mm] p-[10mm] grid grid-cols-2 grid-rows-2 gap-4 break-after-page mb-8 print:mb-0"
                                        style={{ pageBreakAfter: 'always' }}
                                    >
                                        {page.map((student) => (
                                            <AdmitCard key={student.id} student={student} exam={examDetails} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'seat' && (
                            <div className="flex flex-col gap-8 print:block">
                                {seatPlans.map((plan, index) => (
                                    <div
                                        key={index}
                                        className="bg-white shadow-xl print:shadow-none w-[210mm] h-[297mm] break-after-page mb-8 print:mb-0 overflow-hidden"
                                        style={{ pageBreakAfter: 'always' }}
                                    >
                                        <SeatPlanTemplate
                                            assignments={plan.assignments}
                                            exam={examDetails}
                                            roomNumber={plan.roomNumber}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'attendance' && (
                            <div className="flex flex-col gap-8 print:block">
                                {attendancePlans.map((plan, index) => (
                                    <div
                                        key={index}
                                        className="bg-white shadow-xl print:shadow-none w-[210mm] h-[297mm] break-after-page mb-8 print:mb-0 overflow-hidden"
                                        style={{ pageBreakAfter: 'always' }}
                                    >
                                        <AttendanceSheetTemplate
                                            assignments={plan.assignments}
                                            exam={examDetails}
                                            roomNumber={plan.roomNumber}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </Tabs>
        </div>
    );
}

// Global Style for Print
const globalCSS = `
  @media print {
    body {
        background: white;
    }
    .print-hidden {
        display: none !important;
    }
    /* Ensure background colors print */
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
  }
`;
