'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Printer,
    Search,
    Users,
    FileText,
    ClipboardCheck,
    LayoutGrid,
    Loader2,
    RefreshCw
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
import { toast } from 'sonner';

import {
    chunkArray,
    Student,
    ExamDetails,
    SeatAssignment,
    RoomPlan
} from '@/utils/exam-management';
import AdmitCard from '@/components/exam-management/AdmitCardTemplate';
import SeatPlanTemplate from '@/components/exam-management/SeatPlanTemplate';
import AttendanceSheetTemplate from '@/components/exam-management/AttendanceSheetTemplate';
import SeatLabelTemplate from '@/components/exam-management/SeatLabelTemplate';
import HallConfigurator from '@/components/exam-management/HallConfigurator';

export default function AdmitCardManagementPage() {
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Data
    const [exams, setExams] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    // Selection
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [activeHalls, setActiveHalls] = useState<string[]>([]);

    const [viewMode, setViewMode] = useState<'admit' | 'seat' | 'attendance' | 'label'>('admit');

    // Computed chunks
    const [admitPages, setAdmitPages] = useState<Student[][]>([]);
    const [roomPlans, setRoomPlans] = useState<RoomPlan[]>([]);
    const [seatLabelPages, setSeatLabelPages] = useState<SeatAssignment[][]>([]); // For stickers

    const printRef = useRef(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `ExamDocs-${viewMode}-${new Date().toISOString()}`,
    });

    // Fetch Initial Data (Exams, Classes)
    useEffect(() => {
        const init = async () => {
            try {
                const [resExams, resClasses] = await Promise.all([
                    fetch('/api/exams'),
                    fetch('/api/classes')
                ]);

                if (resExams.ok) {
                    const d = await resExams.json();
                    // Handle createApiResponse structure (d.data.exams) or direct (d.exams)
                    const examList = d.data?.exams || d.exams || [];
                    setExams(examList);
                }
                if (resClasses.ok) {
                    const d = await resClasses.json();
                    const classList = d.data?.classes || d.classes || [];
                    setClasses(classList);
                }
            } catch (e) { console.error(e); }
        };
        init();
    }, []);

    const handleGenerate = async () => {
        if (!selectedExam || !selectedClass || activeHalls.length === 0) {
            toast.error("Please select Exam, Class and Halls");
            return;
        }
        setGenerating(true);
        try {
            const res = await fetch('/api/generate-seating', {
                method: 'POST',
                body: JSON.stringify({
                    examId: selectedExam,
                    classId: selectedClass,
                    activeHalls
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Seating Generated! Allocated: ${data.allocated}`);

                if (data.allocations) {
                    processData(data.allocations, data.examName, data.className);
                } else {
                    // Fallback if allocations missing? Should not happen with fixed API
                    toast.warning("No allocation data returned");
                }
            } else {
                toast.error(data.error);
            }
        } catch (e) { console.error(e); toast.error("Failed"); }
        setGenerating(false);
    };

    const processData = (allocations: any[], examName?: string, className?: string) => {
        if (!allocations || allocations.length === 0) return;

        const mappedStudents: Student[] = allocations.map((a: any) => ({
            id: a.student.id,
            name: a.student.name,
            roll: a.student.roll,
            registrationId: a.student.registrationNo,
            classId: a.student.classId || selectedClass,
            hallName: a.hall.name,
            roomNo: a.hall.roomNo,
            seatLabel: a.seatLabel
        }));

        // Update Admit Pages
        setAdmitPages(chunkArray(mappedStudents, 8)); // 8 per page

        // Group by Hall for Seat Plans
        const groupedByHall: Record<string, any[]> = {};
        mappedStudents.forEach((s) => {
            const key = s.hallName || "Unassigned";
            if (!groupedByHall[key]) groupedByHall[key] = [];
            groupedByHall[key].push(s);
        });

        const plans: RoomPlan[] = Object.keys(groupedByHall).map(hallName => {
            const hallStudents = groupedByHall[hallName];
            return {
                hallName,
                roomNumber: hallStudents[0]?.roomNo || "",
                assignments: hallStudents.map((s: Student) => ({
                    student: s,
                    seatNumber: s.seatLabel || "",
                    roomNumber: s.roomNo || "",
                    hallName: s.hallName || ""
                }))
            };
        });
        setRoomPlans(plans);

        // Sticker Pages (24 per page)
        const allAssignments = plans.flatMap(p => p.assignments);
        setSeatLabelPages(chunkArray(allAssignments, 24));
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exam Management</h1>
                    <p className="text-slate-500">Admit Cards, Seating & Attendance (Real Data)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handlePrint()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Control Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-md">Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-slate-500">Exam</label>
                                <Select value={selectedExam} onValueChange={setSelectedExam}>
                                    <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
                                    <SelectContent>
                                        {exams.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-slate-500">Class</label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-t pt-2">
                                <HallConfigurator
                                    selectedHalls={activeHalls}
                                    onSelectionChange={setActiveHalls}
                                />
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                                onClick={handleGenerate}
                                disabled={generating}
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                Generate Seating
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Preview Panel */}
                <div className="lg:col-span-3">
                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                        <TabsList className="w-full justify-start overflow-x-auto">
                            <TabsTrigger value="admit" className="gap-2"><FileText className="w-4 h-4" /> Admit Cards</TabsTrigger>
                            <TabsTrigger value="seat" className="gap-2"><Users className="w-4 h-4" /> Seat Plan</TabsTrigger>
                            <TabsTrigger value="attendance" className="gap-2"><ClipboardCheck className="w-4 h-4" /> Attendance</TabsTrigger>
                            <TabsTrigger value="label" className="gap-2"><LayoutGrid className="w-4 h-4" /> Desk Labels</TabsTrigger>
                        </TabsList>

                        <div className="mt-4 border rounded-lg bg-slate-100/50 p-6 min-h-[600px] overflow-auto flex justify-center">
                            <div className="bg-white shadow-2xl transition-transform origin-top scale-[0.8] md:scale-100" ref={printRef}>

                                {/* ADMIT CARDS VIEW */}
                                {viewMode === 'admit' && (
                                    <div className="flex flex-col gap-0 print:block">
                                        {admitPages.map((page, i) => (
                                            <div key={i} className="w-[210mm] h-[297mm] bg-white p-[10mm] grid grid-cols-2 grid-rows-4 gap-4 break-after-page mb-8 print:mb-0" style={{ pageBreakAfter: 'always' }}>
                                                {page.map(stu => (
                                                    <AdmitCard
                                                        key={stu.id}
                                                        student={stu}
                                                        exam={{
                                                            id: selectedExam,
                                                            name: exams.find(e => e.id === selectedExam)?.name || '',
                                                            date: new Date(),
                                                            schoolName: 'Digital School',
                                                            className: classes.find(c => c.id === selectedClass)?.name || '',
                                                            eiin: '123456'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                        {admitPages.length === 0 && <div className="p-10 text-center text-slate-400">No Data Generated</div>}
                                    </div>
                                )}

                                {/* SEAT PLAN VIEW */}
                                {viewMode === 'seat' && (
                                    <div className="flex flex-col gap-0 print:block">
                                        {roomPlans.map((plan, i) => (
                                            <div key={i} className="w-[210mm] h-[297mm] bg-white break-after-page mb-8 print:mb-0" style={{ pageBreakAfter: 'always' }}>
                                                <SeatPlanTemplate
                                                    assignments={plan.assignments}
                                                    exam={{
                                                        id: selectedExam,
                                                        name: exams.find(e => e.id === selectedExam)?.name || '',
                                                        date: new Date(),
                                                        schoolName: 'Digital School',
                                                        className: classes.find(c => c.id === selectedClass)?.name || '',
                                                        eiin: '123456'
                                                    }}
                                                    roomNumber={parseInt(plan.roomNumber) || 0}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ATTENDANCE VIEW */}
                                {viewMode === 'attendance' && (
                                    <div className="flex flex-col gap-0 print:block">
                                        {roomPlans.map((plan, i) => (
                                            <div key={i} className="w-[210mm] h-[297mm] bg-white break-after-page mb-8 print:mb-0" style={{ pageBreakAfter: 'always' }}>
                                                <AttendanceSheetTemplate
                                                    assignments={plan.assignments}
                                                    exam={{
                                                        id: selectedExam,
                                                        name: exams.find(e => e.id === selectedExam)?.name || '',
                                                        date: new Date(),
                                                        schoolName: 'Digital School',
                                                        className: classes.find(c => c.id === selectedClass)?.name || '',
                                                        eiin: '123456'
                                                    }}
                                                    roomNumber={parseInt(plan.roomNumber) || 0}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* SEAT LABEL VIEW (STICKERS) */}
                                {viewMode === 'label' && (
                                    <div className="flex flex-col gap-0 print:block">
                                        {seatLabelPages.map((page, i) => (
                                            <div key={i} className="w-[210mm] h-[297mm] bg-white p-[5mm] grid grid-cols-3 grid-rows-8 gap-1 break-after-page mb-8 print:mb-0" style={{ pageBreakAfter: 'always' }}>
                                                {page.map(assignment => (
                                                    <SeatLabelTemplate
                                                        key={assignment.student.id}
                                                        assignment={assignment}
                                                        exam={{
                                                            id: selectedExam,
                                                            name: exams.find(e => e.id === selectedExam)?.name || '',
                                                            date: new Date(),
                                                            schoolName: 'Digital School',
                                                            className: classes.find(c => c.id === selectedClass)?.name || '',
                                                            eiin: '123456'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
