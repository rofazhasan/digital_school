import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

// Server-side in-memory cache for ultra-fast (0ms) responses
const memoryCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds

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
    const status = searchParams.get("status") || "ALL";
    const timing = searchParams.get("timing") || "ALL";
    const name = searchParams.get("name") || "";
    const classId = searchParams.get("classId") || "";
    const subject = searchParams.get("subject") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "500");
    const skip = (page - 1) * limit;

    const cacheKey = `evals:${tokenData.user.id}:${tokenData.user.role}:${status}:${timing}:${name}:${classId}:${subject}:${page}:${limit}`;
    const cached = memoryCache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "private, s-maxage=10, stale-while-revalidate=60",
          "X-Cache": "HIT"
        }
      });
    }

    const commonWhere: any = {
      ...(status && status !== "ALL" && { evaluationAssignments: { some: { status: status as any } } }),
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(classId && classId !== "ALL" && { classId }),
      ...(subject && subject !== "ALL" && {
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

    // Streamlined and fast projection
    const examSelect = {
      id: true,
      name: true,
      description: true,
      date: true,
      startTime: true,
      endTime: true,
      duration: true,
      type: true,
      totalMarks: true,
      passMarks: true,
      isActive: true,
      mcqNegativeMarking: true,
      mcNegativeMarking: true,
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
        select: {
          id: true,
          status: true,
          evaluatorId: true,
          evaluator: {
            select: { name: true, email: true, role: true }
          },
          assignedBy: {
            select: { name: true, email: true }
          }
        }
      },
      examSubmissions: {
        select: {
          id: true,
          status: true,
          evaluatedAt: true,
          evaluatorNotes: true
        }
      },
      _count: {
        select: {
          examStudentMaps: true,
          results: { where: { isPublished: true } }
        }
      }
    };

    if (tokenData.user.role === "SUPER_USER" || tokenData.user.role === "ADMIN") {
      rawExams = await prisma.exam.findMany({
        where: commonWhere,
        select: examSelect,
        orderBy: { date: "asc" },
      });
    } else {
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
        select: examSelect,
        orderBy: { date: "asc" },
      });
    }

    const now = new Date();

    const formattedExams = rawExams.map((exam: any) => {
      let evaluationStatus = "UNASSIGNED";
      const totalClassStudents = exam.class?._count?.students || exam._count?.examStudentMaps || 0;
      const submissions = exam.examSubmissions || [];
      const submittedSubmissions = submissions.filter((s: any) => s.status === 'SUBMITTED' || s.evaluatedAt !== null);
      const submittedCount = submittedSubmissions.length;
      const totalEnrolled = totalClassStudents > 0 ? totalClassStudents : (exam._count?.examStudentMaps || submissions.length);

      if (exam.evaluationAssignments && exam.evaluationAssignments.length > 0) {
        const totalSubmissions = submissions.length;
        const evaluatedCount = submissions.filter((s: any) => s.evaluatedAt !== null).length;
        const inProgressCount = submissions.filter((s: any) => s.evaluatedAt === null && s.evaluatorNotes).length;

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
        publishedResults: exam._count?.results || 0,
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

    const responsePayload = {
      exams: paginatedExams,
      allExams: formattedExams,
      totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
      currentPage: page,
      totalCount,
      timingCounts: {
        all: formattedExams.length,
        live: formattedExams.filter(e => e.timingState === "live").length,
        upcoming: formattedExams.filter(e => e.timingState === "upcoming").length,
        passed: formattedExams.filter(e => e.timingState === "finished").length,
      }
    };

    // Store in memory cache
    memoryCache.set(cacheKey, {
      data: responsePayload,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    // Clean memory cache if it grows large
    if (memoryCache.size > 200) {
      const nowMs = Date.now();
      for (const [k, v] of memoryCache.entries()) {
        if (v.expiresAt < nowMs) memoryCache.delete(k);
      }
    }

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "private, s-maxage=10, stale-while-revalidate=60",
        "X-Cache": "MISS"
      }
    });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
}