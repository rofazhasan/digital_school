'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Printer,
    FileText,
    Users,
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
    CardTitle
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    const [generating, setGenerating] = useState(false);

    // Data
    const [exams, setExams] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    // Selection
    const [selectedExams, setSelectedExams] = useState<string[]>([]); // Array for Multi-Select
    const [activeHalls, setActiveHalls] = useState<string[]>([]);

    const [viewMode, setViewMode] = useState<'admit' | 'seat' | 'attendance' | 'label'>('admit');

    // Computed chunks
    const [admitPages, setAdmitPages] = useState<Student[][]>([]);
    const [roomPlans, setRoomPlans] = useState<RoomPlan[]>([]);
    const [seatLabelPages, setSeatLabelPages] = useState<SeatAssignment[][]>([]);
    const [attendancePlans, setAttendancePlans] = useState<RoomPlan[]>([]);

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

    // Toggle Exam Selection
    const toggleExam = (examId: string) => {
        setSelectedExams(prev =>
            prev.includes(examId)
                ? prev.filter(id => id !== examId)
                : [...prev, examId]
        );
    };

    const handleGenerate = async () => {
        console.log("🖱️ Handle Generate Clicked");
        console.log("State:", { selectedExams, activeHalls });

        if (selectedExams.length === 0 || activeHalls.length === 0) {
            toast.error("Please select at least one Exam and one Hall.");
            console.error("❌ Validation Failed: Missing Exams or Halls");
            return;
        }

        setGenerating(true);
        try {
            const payload = {
                examIds: selectedExams, // Send Array
                activeHalls
            };
            console.log("📤 Sending Payload:", payload);

            const res = await fetch('/api/generate-seating', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            console.log("📥 Response Status:", res.status);
            const data = await res.json();
            console.log("📥 Response Data:", data);

            if (res.ok) {
                toast.success(`Generated! Allocated: ${data.allocated}`);
                if (data.allocations) {
                    processData(data.allocations);
                } else {
                    toast.warning("No allocations returned.");
                }
            } else {
                toast.error(data.error || "Generation Failed");
                console.error("❌ API Error:", data);
            }
        } catch (e) {
            console.error("❌ NETWORK/OFFLINE ERROR:", e);
            toast.error("Failed to connect to server.");
        } finally {
            setGenerating(false);
        }
    };

    const processData = (allocations: any[]) => {
        if (!allocations || allocations.length === 0) return;

        // 1. Sort by Roll Number Ascending (Global)
        const sorted = [...allocations].sort((a, b) => {
            const rollA = parseInt(a.student.roll) || 0;
            const rollB = parseInt(b.student.roll) || 0;
            return rollA - rollB;
        });

        const mappedStudents: Student[] = sorted.map((a: any) => ({
            id: a.student.id,
            name: a.student.name,
            roll: a.student.roll,
            registrationId: a.student.registrationNo,
            classId: a.student.classId,
            className: classes.find(c => c.id === a.student.classId)?.name || 'Class',
            examId: a.examId,
            hallName: a.hall.name,
            roomNo: a.hall.roomNo,
            seatLabel: a.seatLabel
        }));

        // 2. Admit Cards (A4 Standard: 2x2 = 4 per page)
        setAdmitPages(chunkArray(mappedStudents, 4));

        // 3. Seat Plans (Group by Hall) - Mixed Classes OK for Seat Plan (Physical Room View)
        const seatPlanGroups: Record<string, any[]> = {};
        mappedStudents.forEach((s) => {
            const key = s.hallName || "Unassigned";
            if (!seatPlanGroups[key]) seatPlanGroups[key] = [];
            seatPlanGroups[key].push(s);
        });

        const physicalPlans: RoomPlan[] = Object.keys(seatPlanGroups).map(hallName => {
            const hallStudents = seatPlanGroups[hallName];
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
        setRoomPlans(physicalPlans);

        // 4. Attendance Sheets (Group by Hall AND Class) - STRICT CLASS SEPARATION
        const attendanceGroups: Record<string, any[]> = {};
        mappedStudents.forEach((s) => {
            const key = `${s.hallName}::${s.className}`; // Composite Key
            if (!attendanceGroups[key]) attendanceGroups[key] = [];
            attendanceGroups[key].push(s);
        });

        const ATTENDANCE_CAPACITY = 35; // High Density Limit
        const attPlans: RoomPlan[] = [];

        Object.keys(attendanceGroups).forEach(key => {
            const [hallName, className] = key.split('::');
            const groupStudents = attendanceGroups[key];

            // Sort Attendance List by Bench (Spatial: Row -> Col -> Seat)
            const sortedGroup = [...groupStudents].sort((a, b) => {
                const parse = (s: Student) => {
                    const m = s.seatLabel?.match(/C(\d+)-R(\d+)-S(\d+)/);
                    if (!m) return { c: 999, r: 999, s: 999 };
                    return { c: parseInt(m[1]), r: parseInt(m[2]), s: parseInt(m[3]) };
                };
                const pA = parse(a);
                const pB = parse(b);
                if (pA.r !== pB.r) return pA.r - pB.r;
                if (pA.c !== pB.c) return pA.c - pB.c;
                return pA.s - pB.s;
            });

            // Pagination Logic
            if (sortedGroup.length > ATTENDANCE_CAPACITY) {
                const chunks = chunkArray(sortedGroup, ATTENDANCE_CAPACITY);
                chunks.forEach((chunk, idx) => {
                    attPlans.push({
                        hallName,
                        roomNumber: chunk[0]?.roomNo || "",
                        className: `${className} (Part ${idx + 1}/${chunks.length})`,
                        assignments: chunk.map((s: Student) => ({
                            student: s,
                            seatNumber: s.seatLabel || "",
                            roomNumber: s.roomNo || "",
                            hallName: s.hallName || ""
                        }))
                    });
                });
            } else {
                attPlans.push({
                    hallName,
                    roomNumber: sortedGroup[0]?.roomNo || "",
                    className,
                    assignments: sortedGroup.map((s: Student) => ({
                        student: s,
                        seatNumber: s.seatLabel || "",
                        roomNumber: s.roomNo || "",
                        hallName: s.hallName || ""
                    }))
                });
            }
        });
        setAttendancePlans(attPlans);

        // 5. Desk Labels (High Density Legal: 3x6 = 18 per page)
        // Collect all assignments to print in batch
        const allAssignments = physicalPlans.flatMap(p => p.assignments);

        // Sort Desk Labels Logically (1, 2, 3...) based on explicit Seat Label if possible
        // Expected format: "Seat 1 (C1-R1-S1)" or just "Seat 1"
        allAssignments.sort((a, b) => {
            // Extract numeric "Seat X" 
            const getSeatInt = (s: string) => {
                // Match "Seat 1" or just start with number
                const m = s.match(/Seat\s+(\d+)/);
                if (m) return parseInt(m[1]);
                return 999999;
            };

            const seatA = getSeatInt(a.seatNumber);
            const seatB = getSeatInt(b.seatNumber);

            if (seatA !== 999999 && seatB !== 999999) {
                return seatA - seatB;
            }

            // Fallback to strict spatial if no "Seat X" found
            const parse = (s: string) => {
                const m = s.match(/C(\d+)-R(\d+)-S(\d+)/);
                if (!m) return { c: 999, r: 999, s: 999 };
                return { c: parseInt(m[1]), r: parseInt(m[2]), s: parseInt(m[3]) };
            };
            const pA = parse(a.seatNumber || "");
            const pB = parse(b.seatNumber || "");

            if (pA.r !== pB.r) return pA.r - pB.r;
            if (pA.c !== pB.c) return pA.c - pB.c;
            return pA.s - pB.s;
        });

        setSeatLabelPages(chunkArray(allAssignments, 18));
    }

    // Capacity Calculation
    const [totalCapacity, setTotalCapacity] = useState(0);
    const getStudentCount = () => {
        let count = 0;
        selectedExams.forEach(eid => {
            const ex = exams.find(e => e.id === eid);
            if (ex) {
                const cls = classes.find(c => c.id === ex.classId);
                count += (cls?._count?.students || 0);
            }
        });
        return count;
    };
    const studentCount = getStudentCount();
    const isCapacityInsufficient = activeHalls.length > 0 && selectedExams.length > 0 && totalCapacity < studentCount;

    // Helper for Templates (Just picks first exam for header info)
    const getExamDetails = (examId?: string): ExamDetails => {
        const targetId = examId || selectedExams[0];
        const exam = exams.find(e => e.id === targetId);
        const cls = classes.find(c => c.id === exam?.classId);
        return {
            id: targetId,
            name: exam?.name || 'Exam',
            date: exam?.date ? new Date(exam.date) : new Date(),
            schoolName: cls?.institute?.name || 'Digital School & College',
            className: cls?.name || '',
            eiin: cls?.institute?.id ? `ID-${cls.institute.id.substring(0, 6)}` : '134567' // Fallback or use ID as makeshift EIIN if field missing
        };
    };

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exam Management</h1>
                    <p className="text-slate-500">Admit Cards, Seating & Attendance (Multi-Exam Support)</p>
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

                            {/* Multi-Select Exams */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-slate-500">Select Exam(s)</label>
                                <div className="border rounded-md bg-white max-h-48 overflow-y-auto p-2 space-y-1">
                                    {exams.length === 0 && <div className="text-xs text-slate-400 p-2">No exams found</div>}
                                    {exams.map(e => {
                                        const cls = classes.find(c => c.id === e.classId);
                                        return (
                                            <div key={e.id} className="flex items-start gap-2 p-1 hover:bg-slate-50 rounded">
                                                <input
                                                    type="checkbox"
                                                    id={`exam-${e.id}`}
                                                    checked={selectedExams.includes(e.id)}
                                                    onChange={() => toggleExam(e.id)}
                                                    className="mt-1"
                                                />
                                                <label htmlFor={`exam-${e.id}`} className="text-xs cursor-pointer flex-1 select-none">
                                                    <div className="font-semibold">{e.name}</div>
                                                    <div className="text-slate-500">{cls?.name || 'Class N/A'}</div>
                                                </label>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="text-[10px] text-right text-slate-400">
                                    {selectedExams.length} selected
                                </div>
                            </div>

                            <div className="border-t pt-2">
                                <HallConfigurator
                                    selectedHalls={activeHalls}
                                    onSelectionChange={setActiveHalls}
                                    onCapacityChange={setTotalCapacity}
                                />
                            </div>

                            {/* Capacity Status */}
                            {selectedExams.length > 0 && activeHalls.length > 0 && (
                                <div className={`p-3 rounded-md text-sm font-medium border ${isCapacityInsufficient
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-green-50 text-green-700 border-green-200'
                                    }`}>
                                    <div className="flex justify-between mb-1">
                                        <span>Total Students:</span>
                                        <span>{studentCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Capacity:</span>
                                        <span>{totalCapacity}</span>
                                    </div>
                                    {isCapacityInsufficient && (
                                        <div className="mt-2 text-xs font-bold text-red-600">
                                            ⚠️ Insufficient Capacity
                                        </div>
                                    )}
                                </div>
                            )}

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

                        <div className="mt-4 border rounded-lg bg-slate-100/50 p-6 min-h-[600px] overflow-auto flex justify-center relative">
                            {/* Responsive Scaler Wrapper */}
                            <div className="origin-top scale-[0.4] sm:scale-[0.5] md:scale-[0.7] lg:scale-[0.8] xl:scale-100 transition-transform duration-300 ease-in-out">
                                <div className="bg-white shadow-2xl" ref={printRef}>

                                    {/* ADMIT CARDS VIEW (A4 Standard: 2x2 = 4 per page) - ZERO GAP */}
                                    {viewMode === 'admit' && (
                                        <div className="flex flex-col gap-0 print:block">
                                            {admitPages.map((page, i) => (
                                                <div key={i} className="w-[210mm] h-[297mm] bg-white grid grid-cols-2 grid-rows-2 gap-0 break-after-page mb-8 print:mb-0 shadow-lg relative" style={{ pageBreakAfter: 'always' }}>
                                                    {page.map(stu => (
                                                        <AdmitCard
                                                            key={stu.id}
                                                            student={stu}
                                                            exam={getExamDetails(stu.examId)}
                                                        />
                                                    ))}
                                                    {/* Outer Border (Top/Left) since component handles Right/Bottom */}
                                                    <div className="absolute top-0 left-0 w-full h-full border-t border-l border-dashed border-slate-300 pointer-events-none"></div>
                                                </div>
                                            ))}
                                            {admitPages.length === 0 && <div className="w-[210mm] h-[297mm] bg-white flex items-center justify-center text-slate-400">No Data Generated</div>}
                                        </div>
                                    )}

                                    {/* SEAT PLAN VIEW */}
                                    {viewMode === 'seat' && (
                                        <div className="flex flex-col gap-0 print:block">
                                            {roomPlans.map((plan, i) => (
                                                <div key={i} className="w-[216mm] h-[356mm] bg-white break-after-page mb-0 print:mb-0 shadow-lg" style={{ pageBreakAfter: 'always' }}>
                                                    <SeatPlanTemplate
                                                        assignments={plan.assignments}
                                                        exam={getExamDetails(plan.assignments[0]?.student.examId)}
                                                        roomNumber={parseInt(plan.roomNumber) || 0}
                                                    />
                                                </div>
                                            ))}
                                            {roomPlans.length === 0 && <div className="w-[216mm] h-[356mm] bg-white flex items-center justify-center text-slate-400">No Data Generated</div>}
                                        </div>
                                    )}

                                    {/* ATTENDANCE VIEW */}
                                    {viewMode === 'attendance' && (
                                        <div className="flex flex-col gap-0 print:block">
                                            {attendancePlans.map((plan, i) => (
                                                <div key={i} className="w-[216mm] h-[356mm] bg-white break-after-page mb-0 print:mb-0 shadow-lg" style={{ pageBreakAfter: 'always' }}>
                                                    <AttendanceSheetTemplate
                                                        assignments={plan.assignments}
                                                        exam={getExamDetails(plan.assignments[0]?.student.examId)}
                                                        roomNumber={parseInt(plan.roomNumber) || 0}
                                                    />
                                                </div>
                                            ))}
                                            {attendancePlans.length === 0 && <div className="w-[216mm] h-[356mm] bg-white flex items-center justify-center text-slate-400">No Data Generated</div>}
                                        </div>
                                    )}

                                    {/* SEAT LABEL VIEW (STICKERS) - OPTIMIZED LEGAL PAGE */}
                                    {viewMode === 'label' && (
                                        <div className="flex flex-col gap-0 print:block">
                                            {seatLabelPages.map((page, i) => (
                                                <div key={i} className="w-[216mm] h-[356mm] bg-white grid grid-cols-3 grid-rows-6 gap-0 break-after-page mb-0 print:mb-0 shadow-lg" style={{ pageBreakAfter: 'always' }}>
                                                    {page.map((assignment, idx) => (
                                                        <div key={assignment.student.id} className="border-r border-b border-dashed border-slate-400 p-0 overflow-hidden relative">
                                                            {/* Cut Directions (Tiny corner marks) */}
                                                            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-black opacity-20"></div>
                                                            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-black opacity-20"></div>

                                                            <SeatLabelTemplate
                                                                assignment={assignment}
                                                                exam={getExamDetails(assignment.student.examId)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                            {seatLabelPages.length === 0 && <div className="w-[216mm] h-[356mm] bg-white flex items-center justify-center text-slate-400">No Data Generated</div>}
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
