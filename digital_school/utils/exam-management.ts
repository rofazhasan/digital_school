
// Types mirroring DB + UI needs

export interface Student {
    id: string;
    name: string;
    roll: string;
    registrationId: string;
    classId: string;
    className?: string; // e.g. "Class 8"
    examId?: string; // Linked exam for this student
    sectionId?: string;
    gender?: string;
    // Allocation info (joined)
    seatLabel?: string;
    hallName?: string;
    roomNo?: string;
}

export interface ExamDetails {
    id: string;
    name: string;
    date: Date;
    schoolName: string;
    eiin?: string; // from Institute
    className: string;
    hallName?: string; // Global hall name or Specific
}

export interface SeatAssignment {
    student: Student;
    seatNumber: string; // "Seat 1" or "R1-B1"
    roomNumber: string; // "101"
    hallName: string;   // "Main Hall"
}

export interface RoomPlan {
    roomNumber: string;
    hallName: string;
    className?: string; // For attendance splitting
    assignments: SeatAssignment[];
}

export interface SeatPlanProps {
    assignments: SeatAssignment[];
    exam: ExamDetails;
    roomNumber: number;
}

export const sortStudents = (students: Student[]): Student[] => {
    return [...students].sort((a, b) => {
        const rollA = parseInt(a.roll) || 0;
        const rollB = parseInt(b.roll) || 0;
        if (rollA !== rollB) return rollA - rollB;
        return a.name.localeCompare(b.name);
    });
};

/**
 * Groups items into chunks (pages).
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

/**
 * Generates QR Payload
 */
export const generateQRPayload = (student: Student, examId: string, schoolEiin: string = '123456'): string => {
    return JSON.stringify({
        school_eiin: schoolEiin,
        exam_id: examId,
        student_id: student.id,
        roll: student.roll
    });
};

// --- CORE SYNC ENGINE ---

export interface BenchAssignment {
    key: string;       // "R1-C1"
    row: number;
    col: number;
    students: {
        raw: SeatAssignment;
        position: 'L' | 'R' | 'S'; // Left, Right, Single
        benchLabel: string; // "Row 1 - Bench 1"
    }[];
}

export interface RoomLayout {
    benches: BenchAssignment[];
    sortedAll: SeatAssignment[]; // For Attendance (Walk Path)
    maxRow: number;
    maxCol: number;
    totalStudents: number;
}

/**
 * THE SINGLE SOURCE OF TRUTH for Room Visuals & Logistics.
 * Guarantees "Bench 1 Left" is the SAME student on Sticker, Map, and Sheet.
 */
export const generateRoomLayout = (assignments: SeatAssignment[]): RoomLayout => {
    const benchMap: Record<string, SeatAssignment[]> = {};
    let maxRow = 0;
    let maxCol = 0;

    // 1. Group Raw Assignments by Bench Key (R-C)
    assignments.forEach(a => {
        const m = a.seatNumber.match(/C(\d+)-R(\d+)/);
        if (m) {
            const col = parseInt(m[1]);
            const row = parseInt(m[2]);
            const key = `R${row}-C${col}`;

            if (!benchMap[key]) benchMap[key] = [];
            benchMap[key].push(a);

            if (row > maxRow) maxRow = row;
            if (col > maxCol) maxCol = col;
        }
    });

    // 2. Process Benches (Deterministic Sort & Position)
    const benches: BenchAssignment[] = Object.entries(benchMap).map(([key, students]) => {
        const [rStr, cStr] = key.replace('R', '').split('-C');
        const row = parseInt(rStr);
        const col = parseInt(cStr);

        // DETERMINISTIC SORT: By Roll Number (Numerically)
        // This ensures the Student with lower roll is ALWAYS Left (or Seat 1)
        students.sort((a, b) => (parseInt(a.student.roll) || 0) - (parseInt(b.student.roll) || 0));

        const processedStudents = students.map((s, idx) => ({
            raw: s,
            position: students.length === 1 ? 'S' : (idx === 0 ? 'L' : 'R') as 'L' | 'R' | 'S',
            benchLabel: `Row ${row} • Bench ${col}`
        }));

        return {
            key,
            row,
            col,
            students: processedStudents
        };
    });

    // 3. Sort Benches Spatially (Row 1 L->R, Row 2 L->R...)
    benches.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });

    // 4. Flatten for Attendance Sheet (Walk Path Order)
    // Because 'benches' is already sorted by Walk Path (Row->Col), 
    // and students inside are sorted L->R, this flat list is perfect.
    const sortedAll = benches.flatMap(b => b.students.map(s => s.raw));

    return {
        benches,
        sortedAll,
        maxRow,
        maxCol,
        totalStudents: assignments.length
    };
};
