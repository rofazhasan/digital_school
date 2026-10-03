import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { calculateGrade, calculatePercentage } from "@/lib/utils";

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

    // Fetch exams for this class
    const examWhere: any = {};
    if (classId) {
      examWhere.classId = classId;
    }
    if (requestedExamIds.length > 0) {
      examWhere.id = { in: requestedExamIds };
    }

    const rawExams = await prisma.exam.findMany({
      where: examWhere,
      select: {
        id: true,
        name: true,
        subject: true,
        date: true,
        totalMarks: true,
        passMarks: true,
        classId: true,
        cqTotalQuestions: true,
        cqRequiredQuestions: true,
        sqTotalQuestions: true,
        sqRequiredQuestions: true,
        cqSubsections: true,
        generatedSet: true,
        examSets: {
          select: {
            id: true,
            name: true,
            questionsJson: true
          }
        }
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }]
    });

    // Also get all available exams for this class so teacher can pick and choose
    let availableClassExams: any[] = [];
    if (classId) {
      availableClassExams = await prisma.exam.findMany({
        where: { classId },
        select: {
          id: true,
          name: true,
          subject: true,
          date: true,
          totalMarks: true,
          passMarks: true
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }]
      });
    }

    // Target exam IDs to load results for:
    // If requestedExamIds were given, use them; otherwise use all exams found for the class
    const activeExamIds = requestedExamIds.length > 0
      ? requestedExamIds
      : rawExams.map(e => e.id);

    // Process exams and determine question type presence (CQ, SQ, Descriptive, Objective)
    const objectiveTypes = ['mcq', 'mc', 'ar', 'mtf', 'int', 'numeric', 'smcq', 'cma', 'mpc'];

    const processedExams = rawExams.map(exam => {
      const allQuestions: any[] = [];
      if (Array.isArray(exam.generatedSet)) {
        exam.generatedSet.forEach((s: any) => {
          if (Array.isArray(s?.questions)) allQuestions.push(...s.questions);
          else if (s?.type || s?.questionType) allQuestions.push(s);
        });
      } else if (exam.generatedSet && Array.isArray((exam.generatedSet as any).questions)) {
        allQuestions.push(...(exam.generatedSet as any).questions);
      }

      if (allQuestions.length === 0 && exam.examSets && exam.examSets.length > 0) {
        exam.examSets.forEach((es: any) => {
          if (es.questionsJson) {
            try {
              const parsed = typeof es.questionsJson === 'string' ? JSON.parse(es.questionsJson) : es.questionsJson;
              if (Array.isArray(parsed)) allQuestions.push(...parsed);
            } catch {}
          }
        });
      }

      const hasCQ = (exam.cqTotalQuestions ?? 0) > 0 || allQuestions.some((q: any) => (q.type || q.questionType || '').toLowerCase() === 'cq');
      const hasSQ = (exam.sqTotalQuestions ?? 0) > 0 || allQuestions.some((q: any) => (q.type || q.questionType || '').toLowerCase() === 'sq');
      const hasDescriptive = allQuestions.some((q: any) => (q.type || q.questionType || '').toLowerCase() === 'descriptive');
      const hasObjective = allQuestions.some((q: any) => objectiveTypes.includes((q.type || q.questionType || '').toLowerCase())) || (!hasCQ && !hasSQ && !hasDescriptive);

      // Estimate max marks per section
      let cqMax = 0;
      let sqMax = 0;
      let descMax = 0;
      let objMax = 0;

      allQuestions.forEach((q: any) => {
        const type = (q.type || q.questionType || '').toLowerCase();
        const m = Number(q.marks) || 1;
        if (type === 'cq') cqMax += m;
        else if (type === 'sq') sqMax += m;
        else if (type === 'descriptive') descMax += m;
        else if (objectiveTypes.includes(type)) objMax += m;
      });

      return {
        id: exam.id,
        name: exam.name,
        subject: exam.subject || 'General',
        date: exam.date,
        totalMarks: exam.totalMarks,
        passMarks: exam.passMarks || 33,
        classId: exam.classId,
        cqSubsections: exam.cqSubsections,
        hasCQ,
        hasSQ,
        hasDescriptive,
        hasObjective,
        cqMax,
        sqMax,
        descMax,
        objMax
      };
    });

    // Fetch Results for the active exams
    const results = await prisma.result.findMany({
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
    });

    // Fetch Submissions to extract descriptive marks and fallback marks
    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: { in: activeExamIds }
      },
      select: {
        id: true,
        examId: true,
        studentId: true,
        answers: true,
        status: true,
        score: true,
        evaluatedAt: true
      }
    });

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

    // Enrich with submission data and calculate descriptive marks if present
    submissions.forEach(sub => {
      if (!studentResultsMap[sub.studentId]) {
        studentResultsMap[sub.studentId] = {};
      }

      let descMarks = 0;
      const answers = (sub.answers as Record<string, any>) || {};

      // Sum up descriptive marks from answers keys ending with _marks or _desc_*_marks
      Object.keys(answers).forEach(k => {
        if (k.includes('_desc_') && k.endsWith('_marks') && typeof answers[k] === 'number') {
          descMarks += answers[k];
        }
      });

      const existing = studentResultsMap[sub.studentId][sub.examId];
      if (existing) {
        existing.descMarks = descMarks;
      } else {
        // Fallback if no result record was generated
        const exam = processedExams.find(e => e.id === sub.examId);
        const passMark = exam?.passMarks || 33;
        const totalMarks = exam?.totalMarks || 100;
        const earned = sub.score ?? 0;
        const pct = totalMarks > 0 ? calculatePercentage(earned, totalMarks) : 0;
        const grade = calculateGrade(pct, passMark);

        studentResultsMap[sub.studentId][sub.examId] = {
          mcqMarks: 0,
          cqMarks: 0,
          sqMarks: 0,
          descMarks: descMarks,
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
