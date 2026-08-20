/**
 * OMRSubmissionAdapter
 * 
 * Converts an OMRScanResult into the EXACT canonical submission representation
 * required by the existing online examination and evaluation engine.
 * 
 * Guarantees that an identical physical paper scan yields the exact same canonical
 * submission representation as an online student test.
 */

import { StudentIdentityResolver, QRContext, ResolvedStudentIdentity } from "./student-identity-resolver";
import { ExamSetResolver, CanonicalQuestionSet } from "./exam-set-resolver";
import { PhysicalResponseMapper, PhysicalAnswerEntry, PhysicalMappingResult } from "./physical-response-mapper";

export interface OMRScanResult {
  scanId: string;
  qrPayload: string | QRContext;
  roll?: string | null;
  registration?: string | null;
  detectedSet?: string | null;
  physicalAnswers: PhysicalAnswerEntry[];
  confidence: number;
  imageQuality?: {
    blurScore: number;
    brightnessScore: number;
    contrastScore: number;
    isQualityPassed: boolean;
  };
  templateVersion?: number;
  scannerVersion?: string;
  scannedAt?: string | Date;
}

export interface CanonicalExamSubmissionPayload {
  studentId: string;
  examId: string;
  examSetId: string;
  answers: Record<string, any>; // Direct drop-in for ExamSubmission.answers
  source: "OMR";
  metadata: {
    scanUuid: string;
    scannerVersion: string;
    templateVersion: number;
    confidenceScore: number;
    qualityScore: number;
    rollNumber: string;
    registrationNo?: string;
    detectedSet?: string;
    scannedAt: string;
    validationStatus: string;
  };
  identity: ResolvedStudentIdentity;
  mappingResult: PhysicalMappingResult;
}

export interface AdaptResult {
  success: boolean;
  canonicalSubmission?: CanonicalExamSubmissionPayload;
  error?: string;
  warnings?: string[];
  status: "READY" | "REVIEW_REQUIRED" | "ERROR";
}

export class OMRSubmissionAdapter {
  /**
   * Adapts a raw OMRScanResult into a CanonicalExamSubmissionPayload
   */
  public static async adapt(
    scanResult: OMRScanResult,
    options?: {
      preResolvedSet?: CanonicalQuestionSet;
      mockDb?: { students: any[]; exams: any[]; examSets: any[] };
    }
  ): Promise<AdaptResult> {
    if (!scanResult || !scanResult.scanId) {
      return {
        success: false,
        status: "ERROR",
        error: "Invalid scan result: missing scanId."
      };
    }

    // 1. Resolve Student Identity
    const identity = await StudentIdentityResolver.resolve(
      {
        qr: scanResult.qrPayload,
        roll: scanResult.roll,
        registration: scanResult.registration
      },
      options?.mockDb
    );

    if (!identity.success || !identity.studentId || !identity.examId) {
      return {
        success: false,
        status: identity.validationStatus === "AMBIGUOUS" ? "REVIEW_REQUIRED" : "ERROR",
        error: identity.error || "Student identity could not be verified."
      };
    }

    // 2. Resolve Canonical Exam Set
    let questionSet: CanonicalQuestionSet | undefined = options?.preResolvedSet;

    if (!questionSet) {
      const examSetId = identity.examSetId;
      if (!examSetId) {
        return {
          success: false,
          status: "ERROR",
          error: "QR context did not provide an examSetId."
        };
      }

      const setRes = await ExamSetResolver.resolveById(examSetId, identity.examId);
      if (!setRes.success || !setRes.questionSet) {
        return {
          success: false,
          status: "ERROR",
          error: setRes.error || `Could not resolve ExamSet '${examSetId}'.`
        };
      }
      questionSet = setRes.questionSet;
    }

    // 3. Map Physical Bubble Responses to Stable Question IDs
    const mappingResult = PhysicalResponseMapper.mapResponses(
      questionSet,
      scanResult.physicalAnswers
    );

    if (mappingResult.validationStatus === "ERROR") {
      return {
        success: false,
        status: "ERROR",
        error: mappingResult.errors.join("; ")
      };
    }

    // 4. Construct Canonical Submission Payload
    const warnings = [...(identity.warnings || []), ...mappingResult.warnings];
    const status: "READY" | "REVIEW_REQUIRED" | "ERROR" =
      warnings.length > 0 || mappingResult.validationStatus === "WARNINGS"
        ? "REVIEW_REQUIRED"
        : "READY";

    const canonicalSubmission: CanonicalExamSubmissionPayload = {
      studentId: identity.studentId,
      examId: identity.examId,
      examSetId: questionSet.setId,
      answers: mappingResult.canonicalAnswers,
      source: "OMR",
      metadata: {
        scanUuid: scanResult.scanId,
        scannerVersion: scanResult.scannerVersion || "2.0.0",
        templateVersion: scanResult.templateVersion || 1,
        confidenceScore: scanResult.confidence,
        qualityScore: scanResult.imageQuality?.brightnessScore ? (scanResult.imageQuality.isQualityPassed ? 1.0 : 0.8) : 1.0,
        rollNumber: identity.rollNumber || scanResult.roll || "",
        registrationNo: identity.registrationNo || scanResult.registration || undefined,
        detectedSet: questionSet.setName || scanResult.detectedSet || undefined,
        scannedAt: typeof scanResult.scannedAt === "string" ? scanResult.scannedAt : (scanResult.scannedAt?.toISOString() || new Date().toISOString()),
        validationStatus: status
      },
      identity,
      mappingResult
    };

    return {
      success: true,
      canonicalSubmission,
      warnings,
      status
    };
  }
}
