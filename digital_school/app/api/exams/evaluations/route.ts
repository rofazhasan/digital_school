import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

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
    const name = searchParams.get("name");
    const classId = searchParams.get("classId");
    const subject = searchParams.get("subject");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
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

    let exams;
    let totalCount = 0;

    if (tokenData.user.role === "SUPER_USER" || tokenData.user.role === "ADMIN") {
      // Super user and Admin sees all exams (active and inactive) with evaluation assignments
      totalCount = await prisma.exam.count({ where: commonWhere });
      exams = await prisma.exam.findMany({
        where: commonWhere,
        include: {
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
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      });
    } else {
      // Evaluators (TEACHER/ADMIN) see assigned exams
      const evaluatorWhere = {
        ...commonWhere,
        evaluationAssignments: {
          some: {
            evaluatorId: tokenData.user.id,
            ...(status && status !== "ALL" && { status: status as any })
          }
        }
      };

      totalCount = await prisma.exam.count({ where: evaluatorWhere });
      exams = await prisma.exam.findMany({
        where: evaluatorWhere,
        include: {
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
            where: { evaluatorId: tokenData.user.id },
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
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      });
    }

    // Auto-release trigger check for finished/expired exams
    try {
      const { finalizeAndReleaseExam } = await import("@/lib/exam-logic");
      for (const exam of exams) {
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

    console.log('Processing exams:', exams.length, 'Total matching:', totalCount);
    const formattedExams = exams.map((exam: any) => {
      // Calculate evaluation status based on submissions
      let evaluationStatus = "UNASSIGNED";
      const totalClassStudents = exam.class?._count?.students || exam.examStudentMaps?.length || 0;
      const submittedSubmissions = exam.examSubmissions.filter((s: any) => s.status === 'SUBMITTED' || s.evaluatedAt !== null);
      const submittedCount = submittedSubmissions.length;
      const totalEnrolled = totalClassStudents > 0 ? totalClassStudents : (exam.examStudentMaps?.length || exam.examSubmissions.length);

      if (exam.evaluationAssignments.length > 0) {
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

      return {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        date: exam.date.toISOString(),
        type: exam.type,
        totalMarks: exam.totalMarks,
        isActive: exam.isActive,
        class: exam.class,
        createdBy: exam.createdBy,
        totalStudents: totalEnrolled,
        submittedStudents: submittedCount,
        publishedResults: (exam as any)._count?.results || 0,
        evaluationAssignments: exam.evaluationAssignments,
        mcqNegativeMarking: exam.mcqNegativeMarking,
        mcNegativeMarking: exam.mcNegativeMarking,
        status: evaluationStatus
      };
    });

    return NextResponse.json({
      exams: formattedExams,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount
    });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
}
 