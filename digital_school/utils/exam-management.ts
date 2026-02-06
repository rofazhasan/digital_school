
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
