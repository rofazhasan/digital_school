
export interface Student {
    id: string;
    name: string;
    roll: string;
    registrationId: string;
    classId: string;
    sectionId?: string;
    gender?: string;
}

export interface ExamDetails {
    id: string;
    name: string;
    date: Date;
    schoolName: string;
    eiin?: string;
    className: string;
    hallName?: string;
}

export interface SeatAssignment {
    roomNumber: number;
    seatNumber: number;
    student: Student;
}

export interface RoomPlan {
    roomNumber: number;
    assignments: SeatAssignment[];
}

/**
 * Sorts students by class, section, then roll.
 * Can be extended for anti-cheating (odd/even) sorting.
 */
export const sortStudents = (students: Student[], strategy: 'sequential' | 'odd-even' = 'sequential'): Student[] => {
    const sorted = [...students].sort((a, b) => {
        // Primary: Roll number (numeric comparison if possible)
        const rollA = parseInt(a.roll) || 0;
        const rollB = parseInt(b.roll) || 0;
        if (rollA !== rollB) return rollA - rollB;
        return a.name.localeCompare(b.name);
    });

    if (strategy === 'odd-even') {
        const odds = sorted.filter((s, i) => i % 2 === 0); // Logic depends on how we view "odd". Here index 0, 2, 4...
        const evens = sorted.filter((s, i) => i % 2 !== 0);
        // Merge alternately? Or Odds then Evens?
        // User said: "odd rolls first -> even rolls later" OR "merge(odd, even alternately)"
        // Let's implement odd rolls then even rolls for simple separation as requested in user prompt.
        // "Odd rolls first -> Even rolls later"
        const oddRolls = sorted.filter(s => (parseInt(s.roll) || 0) % 2 !== 0);
        const evenRolls = sorted.filter(s => (parseInt(s.roll) || 0) % 2 === 0);
        return [...oddRolls, ...evenRolls];
    }

    return sorted;
};

/**
 * Assigns seats to students based on room capacity.
 */
export const generateSeatPlan = (students: Student[], seatsPerRoom: number = 24): RoomPlan[] => {
    const plans: RoomPlan[] = [];

    if (students.length === 0) return plans;

    let currentRoom = 1;
    let currentSeat = 1;
    let currentRoomAssignments: SeatAssignment[] = [];

    students.forEach((student) => {
        currentRoomAssignments.push({
            roomNumber: currentRoom,
            seatNumber: currentSeat,
            student,
        });

        currentSeat++;

        if (currentSeat > seatsPerRoom) {
            plans.push({
                roomNumber: currentRoom,
                assignments: currentRoomAssignments,
            });
            currentRoom++;
            currentSeat = 1;
            currentRoomAssignments = [];
        }
    });

    // Push remaining
    if (currentRoomAssignments.length > 0) {
        plans.push({
            roomNumber: currentRoom,
            assignments: currentRoomAssignments,
        });
    }

    return plans;
};

/**
 * Generates the QR payload string.
 */
export const generateQRPayload = (student: Student, examId: string, schoolEiin: string = '123456'): string => {
    return JSON.stringify({
        school_eiin: schoolEiin,
        exam_id: examId,
        student_id: student.id,
        class_id: student.classId
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
