import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { calculateGrade, calculatePercentage, getPassPercentage } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (tokenData.user.role === "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let classId = searchParams.get("classId");
    const rawExamIds = searchParams.get("examIds");
    const requestedExamIds = rawExamIds ? rawExamIds.split(",").map(id => id.trim()).filter(Boolean) : [];

    // Fetch all active classes
    const classes = await prisma.class.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        section: true,
        shift: true,
        institute: {
          select: {
            id: true,
            name: true,
            address: true,
            email: true,
            phone: true,
            logoUrl: true
          }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: [{ name: "asc" }, { section: "asc" }]
    });

    // If no classId provided but examIds provided, discover classId from first exam
    if (!classId && requestedExamIds.length > 0) {
      const firstExam = await prisma.exam.findFirst({
        where: { id: { in: requestedExamIds } },
        select: { classId: true }
      });
      if (firstExam?.classId) {
        classId = firstExam.classId;
      }
    }

    // Default to first class if none specified
    if (!classId && classes.length > 0) {
      classId = classes[0].id;
    }

    const currentClass = classes.find(c => c.id === classId) || classes[0] || null;
    const institute = currentClass?.institute || null;

    // Fetch all students in the selected class
    let students: any[] = [];
    if (classId) {
      const studentProfiles = await prisma.studentProfile.findMany({
        where: {
          classId: classId,
          user: { isActive: true }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: [{ roll: "asc" }]
      });

      students = studentProfiles.map(sp => ({
        id: sp.id,
        userId: sp.userId,
        name: sp.user.name || "Student",
        roll: sp.roll || "",
        registrationNo: sp.registrationNo || "",
        email: sp.user.email || "",
        avatar: sp.user.avatar || null
      }));
    }

    // Fetch lightweight list of all available exams for this class so teacher can easily search, filter, and pick
    let availableClassExams: any[] = [];
    if (classId) {
      availableClassExams = await prisma.exam.findMany({
        where: { classId },
        select: {
          id: true,
          name: true,
          date: true,
          totalMarks: true,
          passMarks: true,
          cqTotalQuestions: true,
          sqTotalQuestions: true
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }]
      });
    }

    // Target exam IDs to load results for:
    // If requestedExamIds were given, use them; otherwise default to top 8 most recent exams for snappy load
    const activeExamIds = requestedExamIds.length > 0
      ? requestedExamIds
      : availableClassExams.slice(0, 8).map(e => e.id);

    // Fetch active exams with metadata only (avoiding heavy generatedSet / questions payloads)
    const rawExams = activeExamIds.length > 0 ? await prisma.exam.findMany({
      where: { id: { in: activeExamIds } },
      select: {
        id: true,
        name: true,
        date: true,
        totalMarks: true,
        passMarks: true,
        classId: true,
        cqTotalQuestions: true,
        cqRequiredQuestions: true,
        sqTotalQuestions: true,
        sqRequiredQuestions: true,
        cqSubsections: true
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }]
    }) : [];

    // Fetch Results for the active exams
    const results = activeExamIds.length > 0 ? await prisma.result.findMany({
      where: {
        examId: { in: activeExamIds }
      },
      select: {
        id: true,
        examId: true,
        studentId: true,
        mcqMarks: true,
        cqMarks: true,
        sqMarks: true,
        total: true,
        percentage: true,
        grade: true,
        isPublished: true
      }
    }) : [];

    // Process exams and determine question type presence (CQ, SQ, Objective) without heavy question tree queries
    const processedExams = rawExams.map(exam => {
      const examResults = results.filter(r => r.examId === exam.id);
      const hasResultCQ = examResults.some(r => (r.cqMarks ?? 0) > 0);
      const hasResultSQ = examResults.some(r => (r.sqMarks ?? 0) > 0);
      const hasResultMCQ = examResults.some(r => (r.mcqMarks ?? 0) > 0);

      const hasCQ = (exam.cqTotalQuestions ?? 0) > 0 || (exam.cqRequiredQuestions ?? 0) > 0 || hasResultCQ;
      const hasSQ = (exam.sqTotalQuestions ?? 0) > 0 || (exam.sqRequiredQuestions ?? 0) > 0 || hasResultSQ;
      const hasDescriptive = false;
      const hasObjective = hasResultMCQ || (!hasCQ && !hasSQ) || ((exam.totalMarks || 100) > ((exam.cqTotalQuestions ?? 0) * 10 + (exam.sqTotalQuestions ?? 0) * 2));

      return {
        id: exam.id,
        name: exam.name,
        subject: (exam as any).subject || exam.name || 'General',
        date: exam.date,
        totalMarks: exam.totalMarks,
        passMarks: exam.passMarks || 33,
        classId: exam.classId,
        cqSubsections: exam.cqSubsections,
        hasCQ,
        hasSQ,
        hasDescriptive,
        hasObjective,
        cqMax: (exam.cqRequiredQuestions || exam.cqTotalQuestions || 0) * 10,
        sqMax: (exam.sqRequiredQuestions || exam.sqTotalQuestions || 0) * 2,
        descMax: 0,
        objMax: Math.max(0, (exam.totalMarks || 100) - ((exam.cqRequiredQuestions || exam.cqTotalQuestions || 0) * 10 + (exam.sqRequiredQuestions || exam.sqTotalQuestions || 0) * 2))
      };
    });

    // Fetch Submissions without heavy answers JSON payload for blazing fast response
    const submissions = activeExamIds.length > 0 ? await prisma.examSubmission.findMany({
      where: {
        examId: { in: activeExamIds }
      },
      select: {
        id: true,
        examId: true,
        studentId: true,
        status: true,
        score: true,
        evaluatedAt: true
      }
    }) : [];

    // Build Student-Exam Result Map
    // Structure: { [studentId]: { [examId]: { mcqMarks, cqMarks, sqMarks, descMarks, total, percentage, grade } } }
    const studentResultsMap: Record<string, Record<string, any>> = {};

    results.forEach(res => {
      if (!studentResultsMap[res.studentId]) {
        studentResultsMap[res.studentId] = {};
      }
      studentResultsMap[res.studentId][res.examId] = {
        mcqMarks: res.mcqMarks ?? 0,
        cqMarks: res.cqMarks ?? 0,
        sqMarks: res.sqMarks ?? 0,
        descMarks: 0,
        total: res.total ?? 0,
        percentage: res.percentage ?? 0,
        grade: res.grade || "F",
        isPublished: res.isPublished
      };
    });

    // Enrich with submission fallback if no result record was generated
    submissions.forEach(sub => {
      if (!studentResultsMap[sub.studentId]) {
        studentResultsMap[sub.studentId] = {};
      }

      const existing = studentResultsMap[sub.studentId][sub.examId];
      if (!existing && sub.score != null) {
        const exam = processedExams.find(e => e.id === sub.examId);
        const passMark = getPassPercentage(exam?.passMarks, exam?.totalMarks);
        const totalMarks = exam?.totalMarks || 100;
        const earned = sub.score ?? 0;
        const pct = totalMarks > 0 ? calculatePercentage(earned, totalMarks) : 0;
        const grade = calculateGrade(pct, passMark, totalMarks);

        studentResultsMap[sub.studentId][sub.examId] = {
          mcqMarks: 0,
          cqMarks: earned,
          sqMarks: 0,
          descMarks: 0,
          total: earned,
          percentage: pct,
          grade: grade,
          isPublished: false
        };
      }
    });

    return NextResponse.json({
      classes,
      selectedClassId: classId,
      currentClass,
      institute,
      students,
      availableExams: availableClassExams,
      exams: processedExams,
      results: studentResultsMap
    });
  } catch (error) {
    console.error("GET /api/exams/bulk-result Error:", error);
    return NextResponse.json({ error: "Failed to fetch bulk results data" }, { status: 500 });
  }
}
