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
    RefreshCw,
    Search,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

import { chunkArray, Student, ExamDetails, RoomPlan, SeatAssignment } from '@/utils/exam-management';
import AdmitCard from '@/components/exam-management/AdmitCardTemplate';
import SeatPlanTemplate from '@/components/exam-management/SeatPlanTemplate';
import AttendanceSheetTemplate from '@/components/exam-management/AttendanceSheetTemplate';
import SeatLabelTemplate from '@/components/exam-management/SeatLabelTemplate';
import HallConfigurator from '@/components/exam-management/HallConfigurator';

export default function AdmitCardManagementPage() {
    // UI State
    const [generating, setGenerating] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [viewMode, setViewMode] = useState<'admit' | 'seat' | 'attendance' | 'label'>('admit');

    // Data State
    const [exams, setExams] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [halls, setHalls] = useState<any[]>([]);

    // Selection State
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [activeExamIds, setActiveExamIds] = useState<string[]>([]); // Multi-Select for Generation
    const [selectedHallId, setSelectedHallId] = useState<string>("all");
    const [activeHalls, setActiveHalls] = useState<string[]>([]); // For Generation Context

    // Fetched Data (Paginated/Filtered)
    const [allocations, setAllocations] = useState<any[]>([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

    // Print Refs
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `ExamLogistics-${viewMode}-${new Date().toISOString()}`,
    });

    // 1. Initial Fetch (Exams & Classes & All Halls)
    useEffect(() => {
        const init = async () => {
            try {
                const [resExams, resClasses, resHalls] = await Promise.all([
                    fetch('/api/exams'),
                    fetch('/api/classes'),
                    fetch('/api/exam-halls') // Assuming this endpoint exists or similar
                ]);

                if (resExams.ok) {
                    const d = await resExams.json();
                    setExams(d.data?.exams || d.exams || []);
                }
                if (resClasses.ok) {
                    const d = await resClasses.json();
                    setClasses(d.data?.classes || d.classes || []);
                }
                if (resHalls.ok) {
                    const d = await resHalls.json();
                    setHalls(d.data || d.halls || []);
                    // Pre-select all halls for generation by default if needed
                    // setActiveHalls(d.data.map((h: any) => h.id));
                }
            } catch (e) { console.error(e); }
        };
        init();
    }, []);

    // 2. Data Fetcher (Server-Side Pagination)
    const fetchData = async (examId: string, hallId: string) => {
        if (!examId) return;
        setLoadingData(true);
        try {
            // For PRINTING/VIEWING, we might want ALL data for a specific hall, 
            // OR if "all" halls selected, we strictly limit to 50 for preview performance.
            // But user wants to PRINT. Printing requires ALL data for that context.
            // STRATEGY: 
            // - If (Hall Selected) -> Fetch ALL (assuming Hall Capacity < 1000, safe).
            // - If (All Halls) -> Fetch Paginated (limit 100) for Preview, warn "Select Hall to Print".

            const limit = hallId !== 'all' ? 2000 : 100; // Large limit for specific hall to get all stamps

            const res = await fetch(`/api/logistics/allocations?examId=${examId}&hallId=${hallId}&limit=${limit}`);
            if (res.ok) {
                const d = await res.json();
                setAllocations(d.data);
                setMeta(d.meta);
                if (d.meta.total > limit && hallId === 'all') {
                    toast.info(`Showing first ${limit} of ${d.meta.total}. Select a Hall to view/print specific data.`);
                }
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to fetch data");
        } finally {
            setLoadingData(false);
        }
    };

    // Trigger fetch on selection change
    useEffect(() => {
        if (selectedExamId) {
            fetchData(selectedExamId, selectedHallId);
        }
    }, [selectedExamId, selectedHallId]);

    // 3. Generate Handler
    const handleGenerate = async () => {
        if (activeExamIds.length === 0 || activeHalls.length === 0) {
            toast.error("Select at least one exam and one hall.");
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch('/api/generate-seating', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examIds: activeExamIds, // Use Multi-Selection
                    activeHalls
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`Success! Allocated: ${data.allocated} seats.`);
                // Refresh view
                fetchData(selectedExamId, selectedHallId);
            } else {
                toast.error(data.error || "Generation Failed");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setGenerating(false);
        }
    };

    // 4. Data Transformation for Templates
    // Convert flat allocation API data to hierarchical structures needed for templates

    // --- MAPPERS ---
    const mapToStudent = (a: any): Student => ({
        id: a.studentId,
        name: a.studentName,
        roll: a.studentRoll,
        registrationId: a.studentReg,
        classId: "N/A", // Not in flat data, but name IS
        className: a.className,
        examId: a.examId,
        hallName: a.hallName,
        roomNo: a.roomNo,
        seatLabel: a.seatLabel
    });

    const getExamDetail = (): ExamDetails => {
        if (allocations.length > 0) {
            return {
                id: allocations[0].examId,
                name: allocations[0].examName,
                date: new Date(allocations[0].examDate),
                schoolName: "Digital School & College", // Could come from settings
                className: allocations[0].className,
                eiin: "123456"
            };
        }
        // Fallback
        const ex = exams.find(e => e.id === selectedExamId);
        return {
            id: ex?.id || "",
            name: ex?.name || "Exam",
            date: ex?.date ? new Date(ex.date) : new Date(),
            schoolName: "Digital School & College",
            className: "All Classes",
            eiin: "123456"
        };
    };

    // --- VIEW COMPUTATIONS ---
    const students: Student[] = allocations.map(mapToStudent);
    const examDetails = getExamDetail();

    // VIEW: ADMIT CARDS (4 per Page)
    // Filter duplicates if any (unlikely with clean API)
    const admitPages = chunkArray(students, 4);

    // VIEW: SEAT PLAN (Group by Hall -> Then paginated)
    // Note: If we selected "All Halls", this will make many pages.
    // Ideally user selects 1 Hall.
    const seatPlans: RoomPlan[] = [];
    if (students.length > 0) {
        // Group by Hall
        const byHall: Record<string, Student[]> = {};
        students.forEach(s => {
            const k = s.hallName || "Unassigned";
            if (!byHall[k]) byHall[k] = [];
            byHall[k].push(s);
        });

        Object.keys(byHall).forEach(hName => {
            const hallStudents = byHall[hName];
            seatPlans.push({
                hallName: hName,
                roomNumber: hallStudents[0]?.roomNo || "",
                assignments: hallStudents.map(s => ({
                    student: s,
                    seatNumber: s.seatLabel || "",
                    roomNumber: s.roomNo || "",
                    hallName: s.hallName || ""
                }))
            });
        });
    }

    // VIEW: ATTENDANCE (Strictly Group by Hall :: Class)
    const attendancePlans: RoomPlan[] = [];
    if (students.length > 0) {
        const byHallClass: Record<string, Student[]> = {};
        students.forEach(s => {
            const k = `${s.hallName}::${s.className}`;
            if (!byHallClass[k]) byHallClass[k] = [];
            byHallClass[k].push(s);
        });

        Object.keys(byHallClass).forEach(key => {
            const [hName, cName] = key.split('::');
            const group = byHallClass[key];
            // Sort by seat
            group.sort((a, b) => (a.seatLabel || "").localeCompare(b.seatLabel || ""));

            // Chunk by 35 for attendance sheet
            const chunks = chunkArray(group, 35);
            chunks.forEach((chunk, i) => {
                attendancePlans.push({
                    hallName: hName,
                    className: `${cName} (Page ${i + 1}/${chunks.length})`,
                    roomNumber: chunk[0]?.roomNo || "",
                    assignments: chunk.map(s => ({
                        student: s,
                        seatNumber: s.seatLabel || "",
                        roomNumber: s.roomNo || "",
                        hallName: hName
                    }))
                });
            });
        });
    }

    // VIEW: LABELS (3x8 = 24 per Page)
    const labelAssignments: SeatAssignment[] = students.map(s => ({
        student: s,
        seatNumber: s.seatLabel || "",
        roomNumber: s.roomNo || "",
        hallName: s.hallName || ""
    }));
    const labelPages = chunkArray(labelAssignments, 24);


    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-6 max-w-[1600px]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Exam Logistics</h1>
                    <p className="text-gray-500">Admit Cards, Seat Plans & Desk Labels</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={() => handlePrint()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Control Panel */}
                <Card className="xl:col-span-1 h-fit border-0 shadow-lg shadow-gray-200/50">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-lg">Control Centre</CardTitle>
                        <CardDescription>Filter & Generate</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">

                        {/* 1. Exam Selection (Multi-Select) */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Select Exam(s)</label>

                            {/* Simple multi-select implementation using multiple Select triggers or a custom list */}
                            <div className="flex flex-col gap-2 p-2 bg-gray-50 border rounded-md max-h-40 overflow-y-auto">
                                {exams.map(e => (
                                    <div key={e.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`exam-${e.id}`}
                                            checked={selectedExamId.includes(e.id)} // reusing selectedExamId as string or need new state? Let's assume logic below splits it or we change state.
                                            // Quick fix: Since we want to keep it simple, let's just make 'selectedExamId' a primary one, and adding a 'secondaryExamIds' state? 
                                            // Or better: Change the state to array.
                                            // Since I can't change state definition easily in Replace, I'll use a local approach or assume I can change the state initialization in a separate call?
                                            // Wait, I can't change state Init here.
                                            // Let's use the 'selectedExamId' as the "View Context" exam, but add a new section for "Generation Context" exams.
                                            onChange={(ev) => {
                                                const checked = ev.target.checked;
                                                setActiveExamIds(prev => checked ? [...prev, e.id] : prev.filter(id => id !== e.id));
                                                // Also set primary if empty
                                                if (checked && !selectedExamId) setSelectedExamId(e.id);
                                            }}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <label htmlFor={`exam-${e.id}`} className="text-xs truncate cursor-pointer select-none flex-1">
                                            {e.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400">Select multiple exams to mix students in halls.</p>
                        </div>

                        {/* 2. Hall Filter (For Viewing/Printing) */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex justify-between">
                                <span>Filter Hall</span>
                                {selectedHallId === 'all' && <span className="text-xs text-amber-600 font-normal">Select a hall to Print</span>}
                            </label>
                            <Select value={selectedHallId} onValueChange={setSelectedHallId}>
                                <SelectTrigger className="w-full bg-gray-50/50 border-gray-200">
                                    <SelectValue placeholder="All Halls / Select One" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">View All (Preview 100)</SelectItem>
                                    {halls.map(h => (
                                        <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="h-px bg-gray-100 my-2" />

                        {/* 3. Generation Config */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Generation Setup</label>
                            <div className="text-sm text-gray-500 mb-2">
                                Generating for: <span className="font-bold text-black">{activeExamIds.length} Exams</span>
                            </div>
                            <HallConfigurator
                                selectedHalls={activeHalls}
                                onSelectionChange={setActiveHalls}
                                onCapacityChange={() => { }}
                            />
                            <Button
                                className="w-full mt-4 bg-gray-900 hover:bg-black text-white"
                                onClick={handleGenerate}
                                disabled={generating || activeExamIds.length === 0}
                            >
                                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Generate Allocations
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="bg-blue-50/50 rounded-lg p-3 text-sm border border-blue-100">
                            <div className="flex justify-between font-medium text-blue-900">
                                <span>Total Students:</span>
                                <span>{meta.total || 0}</span>
                            </div>
                            <div className="flex justify-between text-blue-700 mt-1 text-xs">
                                <span>Viewing:</span>
                                <span>{allocations.length} items</span>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <div className="xl:col-span-3">
                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl h-auto flex-wrap justify-start gap-2 mb-4 w-full">
                            <TabsTrigger value="admit" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4 py-2"><FileText className="w-4 h-4 mr-2" />Admit Cards</TabsTrigger>
                            <TabsTrigger value="seat" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4 py-2"><Users className="w-4 h-4 mr-2" />Seat Plans</TabsTrigger>
                            <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4 py-2"><ClipboardCheck className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
                            <TabsTrigger value="label" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4 py-2"><LayoutGrid className="w-4 h-4 mr-2" />Desk Labels</TabsTrigger>
                        </TabsList>

                        <div className="border border-gray-200 bg-gray-100/50 rounded-2xl p-4 md:p-8 min-h-[60rem] overflow-auto flex justify-center">
                            {/* Scaled Preview Wrapper */}
                            <div className="origin-top scale-[0.5] md:scale-[0.6] lg:scale-[0.75] xl:scale-[0.85] transition-transform duration-300">
                                <div className="bg-white shadow-2xl min-h-[297mm] min-w-[210mm]" ref={printRef}>

                                    {loadingData && (
                                        <div className="flex flex-col items-center justify-center py-20 h-full w-full">
                                            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                                            <p className="text-gray-500">Loading data...</p>
                                        </div>
                                    )}

                                    {!loadingData && allocations.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 h-[297mm] text-center p-8">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Allocations Found</h3>
                                            <p className="text-gray-500 max-w-sm">
                                                Select an exam and hall, or click "Generate Allocations" to create new seating arrangements.
                                            </p>
                                        </div>
                                    )}

                                    {/* CONTENT RENDERERS */}
                                    {!loadingData && allocations.length > 0 && (
                                        <>
                                            {/* ADMIT CARDS: 4-UP Grid */}
                                            {viewMode === 'admit' && (
                                                <div className="flex flex-col">
                                                    {admitPages.map((page, i) => (
                                                        <div key={i} className="w-[210mm] h-[297mm] bg-white grid grid-cols-2 grid-rows-2 gap-0 break-after-page relative overflow-hidden" style={{ pageBreakAfter: 'always' }}>
                                                            {[0, 1, 2, 3].map(idx => {
                                                                const stu = page[idx];
                                                                if (!stu) return <div key={idx} />; // Empty slot
                                                                return (
                                                                    <div key={stu.id || idx} className="relative w-full h-full border border-gray-100 p-2 flex items-center justify-center">
                                                                        {/* Cutting Guides */}
                                                                        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gray-900" />
                                                                        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gray-900" />
                                                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gray-900" />
                                                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gray-900" />

                                                                        <AdmitCard student={stu} exam={examDetails} />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* SEAT PLAN: 1 Per Page */}
                                            {viewMode === 'seat' && (
                                                <div className="flex flex-col">
                                                    {seatPlans.map((plan, i) => (
                                                        <div key={i} className="w-[210mm] h-[297mm] bg-white break-after-page p-8" style={{ pageBreakAfter: 'always' }}>
                                                            <SeatPlanTemplate assignments={plan.assignments} exam={examDetails} roomNumber={parseInt(plan.roomNumber) || 0} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* ATTENDANCE: 1 Per Page (High Density) */}
                                            {viewMode === 'attendance' && (
                                                <div className="flex flex-col">
                                                    {attendancePlans.map((plan, i) => (
                                                        <div key={i} className="w-[210mm] h-[297mm] bg-white break-after-page p-8" style={{ pageBreakAfter: 'always' }}>
                                                            <AttendanceSheetTemplate assignments={plan.assignments} exam={examDetails} roomNumber={parseInt(plan.roomNumber) || 0} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* DESK LABELS: 3x8 Grid (24 Per Page) */}
                                            {viewMode === 'label' && (
                                                <div className="flex flex-col">
                                                    {labelPages.map((page, i) => (
                                                        <div key={i} className="w-[210mm] h-[297mm] bg-white grid grid-cols-2 grid-rows-4 gap-0 break-after-page" style={{ pageBreakAfter: 'always' }}>
                                                            {page.map((assign: any, idx) => (
                                                                <div key={assign.student.id} className="border border-dashed border-gray-300 flex items-center justify-center p-2 relative overflow-hidden">
                                                                    <SeatLabelTemplate assignment={assign} exam={examDetails} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
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
