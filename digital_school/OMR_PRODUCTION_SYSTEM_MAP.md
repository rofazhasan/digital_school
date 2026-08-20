# ROFAZ ACADEMY — OMR PRODUCTION SYSTEM MAP
**Architecture, Data Boundaries, and Component Lifecycle**

---

## 1. High-Level Pipeline Overview

The physical OMR examination workflow bridges physical paper examination with Rofaz Academy's canonical digital exam architecture:

```
[Teacher Creates Exam]
       ↓
[Question Bank Selection / AI Generation]
       ↓
[Exam & ExamSets Created (questionJSON)]
       ↓
[OMR Template Definition (C_11_12 / Dynamic V2)]
       ↓
[Print Paper (Fiducials + QR + Roll Matrix + Answers)]
       ↓
[Student Sits Physical Exam & Marks Bubbles]
       ↓
[Teacher Launches Scanner (PWA / Mobile / Desktop)]
       ↓
[Camera Feed / Upload → Auto-Capture / Frame Extraction]
       ↓
[Image Quality Pre-Check (Blur, Brightness, Contrast)]
       ↓
[Page & Corner Marker Detection (Homography & Warp)]
       ↓
[Template Registration & Semantic Region Projection]
       ↓
 ┌─────────────────┬───────────────────┬──────────────────────┐
 ↓                 ↓                   ↓                      ↓
[QR Decoder]    [Roll Matrix]     [Reg Matrix]      [100 Answer Bubbles]
 ↓                 ↓                   ↓                      ↓
[ExamSet / Meta] [Student Roll]   [Reg Number]      [Ink Scoring Engine]
 └─────────────────┴───────────────────┴──────────────────────┘
       ↓
[Student Identity & ExamSet Cross-Validation Resolver]
       ↓
[PhysicalResponseMapper (Stable Question IDs & Normalized Answers)]
       ↓
[OMRSubmissionAdapter (Canonical Submission Payload)]
       ↓
[Idempotent Submit API / Offline Outbox Sync Engine]
       ↓
[Authoritative Server Evaluation (evaluateSubmission in lib/exam-logic)]
       ↓
[Database Persistence (results, exam_submissions, omr_scans)]
       ↓
[Teacher Review Console & Audit Trail]
       ↓
[Student Result Dashboard (/exams/results/[id] & Analytics)]
```

---

## 2. Component Boundaries and Data Contracts

### 2.1 Exam Creation & Template Stage
| Stage | Input | Transformation / Process | Output / Boundary |
|---|---|---|---|
| **Question Bank** | Teacher selected questions or AI generated items | Tagging, difficulty assignment, standardizing options | `Question` records in DB |
| **Exam & ExamSet** | Questions, marks, duration, negative marking rules | Compiles questions into set variations with stable IDs | `ExamSet.questionsJson` |
| **OMR Template** | Layout Schema (Grid, Roll, Reg, QR, Corner Markers) | Mathematical geometry layout mapped to A4 canonical 2480×3508px | `GeometryTemplate` & SVG/Canvas Print Ready Sheet |
| **Physical Print** | Standard Laser/Inkjet printer on standard 70-80 GSM paper | Printed sheet with 4 corner black fiducials and micro-markers | Physical OMR Sheet |

### 2.2 Image Acquisition & Computer Vision Stage
| Stage | Input | Transformation / Process | Output / Boundary |
|---|---|---|---|
| **Capture Feed** | Phone camera (MediaStream) or uploaded image | Frame rate throttling, resolution normalization | Canvas Frame (RGBA Uint8ClampedArray) |
| **Quality Engine** | Raw Frame | Laplacian variance (blur), mean luminance, RMS contrast | `QualityMetrics` (blurScore, brightness, contrast) |
| **Marker Detector** | Grayscale thresholded frame | Contour detection, aspect-ratio & solidity filtering | 4 Corner Quad points: `TL, TR, BR, BL` |
| **Perspective Warp** | Raw Frame + Corner Quad | 3×3 Homography matrix calculation & bilinear interpolation | Canonical 2480×3508 Warped Image Buffer |

### 2.3 Feature Extraction & Classification Stage
| Stage | Input | Transformation / Process | Output / Boundary |
|---|---|---|---|
| **QR Decoder** | Top-right ROI from warped canvas | jsQR decoding + JSON payload validation | `QRContext` (examId, examSetId, classId, templateVer) |
| **Roll Matrix** | 6-column × 10-row bubble grid ROI | Bengali Subtraction background-subtracted ink density | 6-digit Roll String (e.g. "307418") + Confidence |
| **Registration Matrix**| 7-column × 10-row bubble grid ROI | Column-wise multi-candidate ink comparison | 7-digit Reg String (e.g. "7890123") + Confidence |
| **Answer Grid** | 100 question rows × 4/5 options | Inner core vs outer ring fill ratio, edge difference | `PhysicalAnswerEntry[]` (questionNo, selectedOption, conf) |

### 2.4 Semantic Mapping & Adapter Stage
| Stage | Input | Transformation / Process | Output / Boundary |
|---|---|---|---|
| **Identity Resolver** | QR + Roll + Registration | Database lookup with fallback and multi-signal cross-check | `ResolvedStudentIdentity` (studentId, studentName) |
| **ExamSet Resolver** | QR `examSetId` or Set Bubble | Fetches canonical question sequence from `ExamSet.questionsJson` | `CanonicalQuestionSet` |
| **Response Mapper** | `PhysicalAnswerEntry[]` + `CanonicalQuestionSet` | Maps 1-indexed sheet questions to stable DB question IDs | `Record<questionId, answer>` + validation stats |
| **Submission Adapter** | Identity + Mapped Answers + Scan Meta | Formats payload identical to online test submission | `CanonicalExamSubmissionPayload` |

### 2.5 Server Evaluation & Persistence Stage
| Stage | Input | Transformation / Process | Output / Boundary |
|---|---|---|---|
| **Submit Route API** | `POST /api/omr/submit` | Idempotency check via `scanUuid`, validation guard | HTTP 200 / Error response |
| **Authoritative Scorer**| `evaluateSubmission()` in `lib/exam-logic` | Scores MCQ, MMCQ, AR, SMCQ; applies negative marking | `ExamSubmission.score` & updated `answers` with marks |
| **Result Writer** | Score, Max Marks, Exam Grade Scale | Computes percentage, GPA, Grade (A+, A, etc.), pass/fail | `Result` upsert in Postgres |
| **Audit & Traceability**| Scan metadata, image metrics, answers | Links `Result.omrScanId` → `OMRScan` → `OMRScanAnswer[]` | Permanent physical-to-digital audit trail |

### 2.6 Offline Architecture & Synchronization
| Stage | Component | Resilience Guarantee |
|---|---|---|
| **Local Persistence** | Dexie.js (IndexedDB) `omr_scans_outbox` | Scans survive browser refresh, tab closure, and power loss |
| **Package Cache** | `OfflinePackageManager` via CacheStorage | Pre-caches Exam metadata, Student roster, and Template assets |
| **Sync Manager** | `SyncManager` with exponential backoff & jitter | Automatic background synchronization upon network reconnection |
| **Exact-Once Idempotency**| Server checks unique `scanUuid` | Retried or duplicate submissions never duplicate database records |

---

## 3. Physical → Digital Result Traceability Guarantee

Every question evaluated in the OMR system possesses a bidirectional trace:
1. **Paper Coordinate**: `(x, y, radius)` on A4 sheet
2. **Raw Bubble Metric**: `netInkScore` (0.0 to 1.0), `fillRatio`, `edgeDifference`
3. **Physical Decision**: Selected option (`A`/`B`/`C`/`D`), status (`ONE_SELECTED`/`BLANK`/`MULTIPLE`/`AMBIGUOUS`)
4. **Database Question ID**: Exact UUID from `ExamSet.questionsJson` (e.g. `q_phy_optics_042`)
5. **Evaluation Output**: `isCorrect`, marks awarded (e.g. `+1.0` or `-0.25`), explanation reference
6. **Student Result Portal**: Rendered seamlessly on `/exams/results/[id]` alongside online student attempts.
