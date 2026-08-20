/**
 * Offline Exam Package Manager
 * 
 * Handles downloading, caching, and validating complete offline exam packages.
 * Caches:
 * - Exam Metadata (title, duration, passMarks, negativeMarking rules)
 * - Template Geometry & Blank Reference Definition
 * - Answer Keys for all Sets (A, B, C, D)
 * - Enrolled Student Identity Registry (Roll, Registration No, Name)
 * - Package versioning and offline readiness status
 */

import { db, LocalExam, OfflineStudent, OfflineTemplate } from '../dexie-db';
import { generateTemplateGeometry, OMRTemplateGeometry } from './geometry-template';

export interface ExamPackagePayload {
  exam: {
    id: string;
    title: string;
    description?: string;
    date?: string;
    duration: number;
    passMarks: number;
    totalMarks: number;
    mcqNegativeMarking: number;
    type: string;
  };
  template: {
    templateId: string;
    version: number;
    name: string;
    geometry: OMRTemplateGeometry;
  };
  sets: {
    setId: string;
    setName: string;
    answerKey: Record<number, string>; // qNo -> correctOption
  }[];
  students: {
    id: string;
    roll: string;
    registrationNo: string;
    name: string;
    classId: string;
  }[];
  packageVersion: number;
  downloadedAt: string;
}

export class OfflinePackageManager {
  /**
   * Downloads and caches an exam package from the server into IndexedDB.
   */
  public static async downloadExamPackage(examId: string): Promise<{ success: boolean; error?: string; studentCount?: number }> {
    try {
      const res = await fetch(`/api/omr/packages/${examId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Failed to download exam package`);
      }

      const pkg: ExamPackagePayload = await res.json();

      // 1. Cache Exam record in IndexedDB
      await db.exams.put({
        id: pkg.exam.id,
        title: pkg.exam.title,
        templateJson: pkg.template,
        questionsJson: pkg.sets,
        answerKeyJson: pkg.sets,
        downloadedAt: new Date()
      });

      // 2. Cache Template Geometry
      await db.templates.put({
        templateId: pkg.template.templateId,
        version: pkg.template.version,
        name: pkg.template.name,
        geometry: pkg.template.geometry
      });

      // 3. Cache Students in IndexedDB for offline cross-validation
      if (Array.isArray(pkg.students) && pkg.students.length > 0) {
        await db.students.bulkPut(pkg.students);
      }

      return {
        success: true,
        studentCount: pkg.students?.length || 0
      };
    } catch (err: any) {
      console.error('[OfflinePackageManager] Download error:', err);
      return {
        success: false,
        error: err.message || String(err)
      };
    }
  }

  /**
   * Checks if an exam package is cached and ready for offline use.
   */
  public static async isExamReadyOffline(examId: string): Promise<boolean> {
    try {
      const localExam = await db.exams.get(examId);
      return !!localExam;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves cached exam details from IndexedDB.
   */
  public static async getCachedExam(examId: string): Promise<LocalExam | undefined> {
    return await db.exams.get(examId);
  }

  /**
   * Retrieves cached students for an exam.
   */
  public static async getCachedStudents(): Promise<OfflineStudent[]> {
    return await db.students.toArray();
  }

  /**
   * Validates a student roll and registration against offline cached roster.
   */
  public static async validateStudentOffline(roll: string, registrationNo?: string): Promise<OfflineStudent | null> {
    if (!roll && !registrationNo) return null;

    if (roll) {
      const student = await db.students.where('roll').equals(roll).first();
      if (student) return student;
    }

    if (registrationNo) {
      const student = await db.students.where('registrationNo').equals(registrationNo).first();
      if (student) return student;
    }

    return null;
  }
}
