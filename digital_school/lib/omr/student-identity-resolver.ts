/**
 * StudentIdentityResolver
 * 
 * Resolves and cross-validates student identity from QR code context and physical
 * Roll / Registration bubbles against the official database.
 */

export interface QRContext {
  examId?: string;
  setId?: string;
  examSetId?: string;
  classId?: string;
  sectionId?: string;
  uniqueCode?: string;
}

export interface StudentIdentityInput {
  qr: string | QRContext;
  roll?: string | null;
  registration?: string | null;
}

export type IdentityValidationStatus =
  | "VALID"
  | "STUDENT_NOT_FOUND"
  | "ROLL_MISMATCH"
  | "REGISTRATION_MISMATCH"
  | "CLASS_MISMATCH"
  | "SECTION_MISMATCH"
  | "EXAM_MISMATCH"
  | "AMBIGUOUS"
  | "INVALID_QR";

export interface ResolvedStudentIdentity {
  success: boolean;
  validationStatus: IdentityValidationStatus;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  registrationNo?: string;
  classId?: string;
  className?: string;
  examId?: string;
  examSetId?: string;
  confidence: number;
  error?: string;
  warnings?: string[];
}

export class StudentIdentityResolver {
  /**
   * Parses and validates raw QR data (JSON string, pipe-delimited string, or object)
   */
  public static parseQR(qr: string | QRContext): QRContext | null {
    if (!qr) return null;
    if (typeof qr === "object") return qr;

    const trimmed = qr.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }

    // Handle pipe-delimited barcode: examId|setId|classId
    if (trimmed.includes("|")) {
      const parts = trimmed.split("|");
      return {
        examId: parts[0] || undefined,
        setId: parts[1] || undefined,
        examSetId: parts[1] || undefined,
        classId: parts[2] || undefined
      };
    }

    return null;
  }

  /**
   * Resolves student identity from QR and physical bubble numbers
   */
  public static async resolve(
    input: StudentIdentityInput,
    mockDb?: { students: any[]; exams: any[]; examSets: any[] }
  ): Promise<ResolvedStudentIdentity> {
    const qr = this.parseQR(input.qr);
    if (!qr || (!qr.examId && !qr.classId)) {
      return {
        success: false,
        validationStatus: "INVALID_QR",
        confidence: 0,
        error: "QR code payload is invalid or missing exam/class context."
      };
    }

    const examId = qr.examId;
    const examSetId = qr.examSetId || qr.setId;
    const classId = qr.classId;
    const roll = input.roll?.replace(/\D/g, "").replace(/^0+/, "") || input.roll?.trim();
    const registration = input.registration?.replace(/\D/g, "").trim();

    if (!roll && !registration) {
      return {
        success: false,
        validationStatus: "STUDENT_NOT_FOUND",
        examId,
        examSetId,
        classId,
        confidence: 0,
        error: "Both Roll and Registration bubble numbers are missing or unreadable."
      };
    }

    // In-memory lookup if mockDb is provided (for fast unit testing & offline worker)
    if (mockDb) {
      const matchingStudents = mockDb.students.filter(s => {
        const sRoll = s.roll?.replace(/\D/g, "").replace(/^0+/, "");
        const sReg = s.registrationNo?.replace(/\D/g, "");
        const matchRoll = roll && sRoll === roll;
        const matchReg = registration && sReg === registration;
        const matchClass = !classId || s.classId === classId;
        return (matchRoll || matchReg) && matchClass;
      });

      if (matchingStudents.length === 0) {
        return {
          success: false,
          validationStatus: "STUDENT_NOT_FOUND",
          rollNumber: input.roll || undefined,
          registrationNo: registration || undefined,
          examId,
          examSetId,
          classId,
          confidence: 0,
          error: `No student found with Roll '${input.roll}' in class '${classId}'.`
        };
      }

      if (matchingStudents.length > 1) {
        return {
          success: false,
          validationStatus: "AMBIGUOUS",
          rollNumber: input.roll || undefined,
          registrationNo: registration || undefined,
          examId,
          examSetId,
          classId,
          confidence: 0.5,
          error: `Multiple students match Roll '${input.roll}' in class '${classId}'. Manual review required.`
        };
      }

      const student = matchingStudents[0];
      return {
        success: true,
        validationStatus: "VALID",
        studentId: student.id,
        studentName: student.name || student.user?.name,
        rollNumber: student.roll,
        registrationNo: student.registrationNo,
        classId: student.classId,
        className: student.className || student.class?.name,
        examId,
        examSetId,
        confidence: 0.99
      };
    }

    // Production Database Resolution
    try {
      const { default: prisma } = await import("@/lib/db");

      // Find candidates in the target class
      const candidates = await prisma.studentProfile.findMany({
        where: {
          AND: [
            classId ? { classId } : {},
            {
              OR: [
                roll ? { roll: { in: [roll, input.roll!, `0${roll}`, `00${roll}`] } } : {},
                registration ? { registrationNo: registration } : {}
              ]
            }
          ]
        },
        include: {
          user: { select: { id: true, name: true, isActive: true } },
          class: { select: { id: true, name: true, section: true } }
        }
      });

      if (candidates.length === 0) {
        return {
          success: false,
          validationStatus: "STUDENT_NOT_FOUND",
          rollNumber: input.roll || undefined,
          registrationNo: registration || undefined,
          examId,
          examSetId,
          classId,
          confidence: 0,
          error: `No registered student found with Roll '${input.roll}'${classId ? ` in class '${classId}'` : ""}.`
        };
      }

      if (candidates.length > 1) {
        // If registration is provided, try narrowing down by exact registration match
        if (registration) {
          const exactReg = candidates.find(c => c.registrationNo === registration);
          if (exactReg) {
            return {
              success: true,
              validationStatus: "VALID",
              studentId: exactReg.id,
              studentName: exactReg.user?.name,
              rollNumber: exactReg.roll,
              registrationNo: exactReg.registrationNo,
              classId: exactReg.classId,
              className: exactReg.class?.name,
              examId,
              examSetId,
              confidence: 0.98
            };
          }
        }

        return {
          success: false,
          validationStatus: "AMBIGUOUS",
          rollNumber: input.roll || undefined,
          registrationNo: registration || undefined,
          examId,
          examSetId,
          classId,
          confidence: 0.5,
          error: `Ambiguous identity: ${candidates.length} students matched Roll '${input.roll}'.`
        };
      }

      const student = candidates[0];
      return {
        success: true,
        validationStatus: "VALID",
        studentId: student.id,
        studentName: student.user?.name,
        rollNumber: student.roll,
        registrationNo: student.registrationNo,
        classId: student.classId,
        className: student.class?.name,
        examId,
        examSetId,
        confidence: 0.99
      };
    } catch (err: any) {
      console.error("[StudentIdentityResolver] Error:", err);
      return {
        success: false,
        validationStatus: "STUDENT_NOT_FOUND",
        confidence: 0,
        error: err.message || "Failed to resolve student identity."
      };
    }
  }
}
