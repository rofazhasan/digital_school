import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

function getExamTiming(exam: { date: Date | string; startTime?: Date | string | null; endTime?: Date | string | null; duration?: number | null }): { start: Date; end: Date } {
  let start: Date;
  let end: Date;

  if (exam.startTime && !isNaN(new Date(exam.startTime).getTime())) {
    start = new Date(exam.startTime);
  } else if (exam.date && !isNaN(new Date(exam.date).getTime())) {
    start = new Date(exam.date);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date();
  }

  if (exam.endTime && !isNaN(new Date(exam.endTime).getTime())) {
    end = new Date(exam.endTime);
  } else if (exam.duration && exam.duration > 0 && exam.startTime && !isNaN(new Date(exam.startTime).getTime())) {
    end = new Date(new Date(exam.startTime).getTime() + exam.duration * 60000);
  } else if (exam.date && !isNaN(new Date(exam.date).getTime())) {
    end = new Date(exam.date);
    end.setHours(23, 59, 59, 999);
  } else {
    end = new Date(start.getTime() + 60 * 60000);
  }

  return { start, end };
}

function getExamTimingRank(exam: any, now: Date = new Date()): number {
  const { start, end } = getExamTiming(exam);
  if (now >= start && now <= end) {
    return 0; // Live: ending date not passed, already started
  }
  if (now < start) {
    return 1; // Upcoming: start date not reached
  }
  return 2; // Passed / Ended: ending date passed
}

export async function GET(req: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Students are NOT allowed to access evaluations
    if (tokenData.user.role === "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const timing = searchParams.get("timing"); // "ALL" | "LIVE" | "UPCOMING" | "PASSED"
    const name = searchParams.get("name");
    const classId = searchParams.get("classId");
    const subject = searchParams.get("subject");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const commonWhere: any = {
      ...(status && status !== "ALL" && { evaluationAssignments: { some: { status: status as any } } }),
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(classId && { classId }),
      ...(subject && {
        examSets: {
          some: {
            questions: {
              some: {
                subject: { contains: subject, mode: 'insensitive' }
              }
            }
          }
        }
      })
    };

    let rawExams: any[] = [];

    const examInclude = {
      class: {
        select: {
          id: true,
          name: true,
          section: true,
          _count: { select: { students: true } }
        }
      },
      createdBy: {
        select: { name: true, email: true }
      },
      evaluationAssignments: {
        include: {
          evaluator: {
            select: { name: true, email: true, role: true }
          },
          assignedBy: {
            select: { name: true, email: true }
          }
        }
      },
      examStudentMaps: { select: { id: true } },
      examSubmissions: {
        select: {
          id: true,
          status: true,
          objectiveStatus: true,
          cqSqStatus: true,
          evaluatedAt: true,
          evaluatorNotes: true
        }
      },
      _count: {
        select: {
          results: { where: { isPublished: true } }
        }
      }
    };

    if (tokenData.user.role === "SUPER_USER" || tokenData.user.role === "ADMIN") {
      // Super user and Admin sees all exams (active and inactive) with evaluation assignments
      rawExams = await prisma.exam.findMany({
        where: commonWhere,
        include: examInclude,
        orderBy: { date: "asc" },
      });
    } else {
      // Evaluators (TEACHER) see assigned exams
      const evaluatorWhere = {
        ...commonWhere,
        evaluationAssignments: {
          some: {
            evaluatorId: tokenData.user.id,
            ...(status && status !== "ALL" && { status: status as any })
          }
        }
      };

      rawExams = await prisma.exam.findMany({
        where: evaluatorWhere,
        include: {
          ...examInclude,
          evaluationAssignments: {
            where: { evaluatorId: tokenData.user.id },
            include: {
              evaluator: {
                select: { name: true, email: true, role: true }
              },
              assignedBy: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { date: "asc" },
      });
    }

    // Auto-release trigger check for finished/expired exams
    try {
      const { finalizeAndReleaseExam } = await import("@/lib/exam-logic");
      for (const exam of rawExams) {
        const isTimeOver = exam.endTime && new Date() > new Date(exam.endTime);
        const totalClassStudents = exam.class?._count?.students || exam.examStudentMaps?.length || 0;
        const finishedSubmissions = exam.examSubmissions.filter((s: any) => s.status === 'SUBMITTED' || s.evaluatedAt !== null).length;
        const allClassFinished = totalClassStudents > 0 && finishedSubmissions >= totalClassStudents;
        const publishedCount = (exam as any)._count?.results || 0;

        if ((isTimeOver || allClassFinished) && publishedCount < finishedSubmissions) {
          finalizeAndReleaseExam(exam.id).catch(err => console.error(`[AutoRelease] Background release failed for ${exam.id}:`, err));
        }
      }
    } catch (e) {
      console.error("[AutoRelease] Failed auto-release sweep:", e);
    }

    const now = new Date();

    const formattedExams = rawExams.map((exam: any) => {
      // Calculate evaluation status based on submissions
      let evaluationStatus = "UNASSIGNED";
      const totalClassStudents = exam.class?._count?.students || exam.examStudentMaps?.length || 0;
      const submittedSubmissions = exam.examSubmissions.filter((s: any) => s.status === 'SUBMITTED' || s.evaluatedAt !== null);
      const submittedCount = submittedSubmissions.length;
      const totalEnrolled = totalClassStudents > 0 ? totalClassStudents : (exam.examStudentMaps?.length || exam.examSubmissions.length);

      if (exam.evaluationAssignments && exam.evaluationAssignments.length > 0) {
        const totalSubmissions = exam.examSubmissions.length;
        const evaluatedCount = exam.examSubmissions.filter((s: any) => s.evaluatedAt !== null).length;
        const inProgressCount = exam.examSubmissions.filter((s: any) => s.evaluatedAt === null && s.evaluatorNotes).length;

        if (evaluatedCount === totalSubmissions && totalSubmissions > 0) {
          evaluationStatus = "COMPLETED";
        } else if (evaluatedCount > 0 || inProgressCount > 0) {
          evaluationStatus = "IN_PROGRESS";
        } else {
          evaluationStatus = "PENDING";
        }
      }

      const { start, end } = getExamTiming(exam);
      let timingState: "live" | "upcoming" | "finished" = "finished";
      if (now >= start && now <= end) {
        timingState = "live";
      } else if (now < start) {
        timingState = "upcoming";
      } else {
        timingState = "finished";
      }

      return {
        id: exam.id,
        name: exam.name,
        description: exam.description || "",
        date: exam.date ? new Date(exam.date).toISOString() : start.toISOString(),
        startTime: exam.startTime ? new Date(exam.startTime).toISOString() : start.toISOString(),
        endTime: exam.endTime ? new Date(exam.endTime).toISOString() : end.toISOString(),
        duration: exam.duration || 0,
        type: exam.type || "OFFLINE",
        totalMarks: exam.totalMarks || 0,
        passMarks: exam.passMarks || 0,
        isActive: Boolean(exam.isActive),
        class: exam.class,
        createdBy: exam.createdBy,
        totalStudents: totalEnrolled,
        submittedStudents: submittedCount,
        publishedResults: (exam as any)._count?.results || 0,
        evaluationAssignments: exam.evaluationAssignments || [],
        mcqNegativeMarking: exam.mcqNegativeMarking,
        mcNegativeMarking: exam.mcNegativeMarking,
        status: evaluationStatus,
        timingState,
        startTimestamp: start.getTime(),
        endTimestamp: end.getTime(),
      };
    });

    // Precise Sorting:
    // 1. Live exams first (Rank 0)
    // 2. Upcoming exams next (Rank 1)
    // 3. Passed / Finished exams last (Rank 2)
    // Within each category: Date Ascending order (earliest start date first)
    formattedExams.sort((a, b) => {
      const rankA = getExamTimingRank(a, now);
      const rankB = getExamTimingRank(b, now);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Date Ascending
      const startA = a.startTimestamp;
      const startB = b.startTimestamp;
      if (startA !== startB) {
        return startA - startB;
      }

      const endA = a.endTimestamp;
      const endB = b.endTimestamp;
      if (endA !== endB) {
        return endA - endB;
      }

      return (a.name || "").localeCompare(b.name || "");
    });

    // Filter by timing query parameter if specified
    let filteredExams = formattedExams;
    if (timing && timing !== "ALL") {
      if (timing === "LIVE") {
        filteredExams = formattedExams.filter(e => e.timingState === "live");
      } else if (timing === "UPCOMING") {
        filteredExams = formattedExams.filter(e => e.timingState === "upcoming");
      } else if (timing === "PASSED" || timing === "FINISHED") {
        filteredExams = formattedExams.filter(e => e.timingState === "finished");
      }
    }

    const totalCount = filteredExams.length;
    const paginatedExams = limit > 0 ? filteredExams.slice(skip, skip + limit) : filteredExams;

    return NextResponse.json({
      exams: paginatedExams,
      allExams: formattedExams, // Return all for smooth client-side filtering/caching
      totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
      currentPage: page,
      totalCount,
      timingCounts: {
        all: formattedExams.length,
        live: formattedExams.filter(e => e.timingState === "live").length,
        upcoming: formattedExams.filter(e => e.timingState === "upcoming").length,
        passed: formattedExams.filter(e => e.timingState === "finished").length,
      }
    });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
}