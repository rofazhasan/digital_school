import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let exams;

    if (tokenData.user.role === "SUPER_USER" || tokenData.user.role === "ADMIN") {
      // Super user and Admin sees all exams (active and inactive) with evaluation assignments
      exams = await prisma.exam.findMany({
        where: {
          ...(status && status !== "ALL" && { evaluationAssignments: { some: { status: status as any } } })
        },
        include: {
          class: true,
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
          examSubmissions: {
            include: {
              student: {
                include: {
                  user: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          results: {
            where: { isPublished: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      // Evaluators (TEACHER/ADMIN) see assigned exams
      exams = await prisma.exam.findMany({
        where: {
          evaluationAssignments: {
            some: {
              evaluatorId: tokenData.user.id,
              ...(status && status !== "ALL" && { status: status as any })
            }
          }
        },
        include: {
          class: true,
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
          examSubmissions: {
            include: {
              student: {
                include: {
                  user: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          results: {
            where: { isPublished: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    console.log('Processing exams:', exams.length);
    const formattedExams = await Promise.all(exams.map(async exam => {
      // Calculate evaluation status based on submissions
      let evaluationStatus = "UNASSIGNED";

      if (exam.evaluationAssignments.length > 0) {
        // Check if any submissions have been evaluated
        const evaluatedSubmissions = exam.examSubmissions.filter(submission =>
          submission.evaluatedAt !== null
        );

        const inProgressSubmissions = exam.examSubmissions.filter(submission => {
          // Check if any questions have manual marks or evaluator notes
          const answers = submission.answers as any;
          const hasManualGrading = answers && Object.keys(answers).some(key =>
            key.endsWith('_marks') && typeof answers[key] === 'number' && answers[key] > 0
          );
          return hasManualGrading || submission.evaluatorNotes;
        });

        if (evaluatedSubmissions.length === exam.examSubmissions.length && exam.examSubmissions.length > 0) {
          evaluationStatus = "COMPLETED";
        } else if (inProgressSubmissions.length > 0) {
          evaluationStatus = "IN_PROGRESS";
        } else {
          evaluationStatus = "PENDING";
        }
      }

      const formattedExam = {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        date: exam.date.toISOString(),
        type: exam.type,
        totalMarks: exam.totalMarks,
        isActive: exam.isActive,
        class: exam.class,
        createdBy: exam.createdBy,
        totalStudents: exam.examSubmissions.length,
        submittedStudents: exam.examSubmissions.length,
        publishedResults: exam.results.length,
        evaluationAssignments: exam.evaluationAssignments,
        status: evaluationStatus
      };
      console.log(`Exam ${exam.name}: status=${evaluationStatus}, submissions=${exam.examSubmissions.length}, assignments=${exam.evaluationAssignments.length}`);
      return formattedExam;
    }));

    return NextResponse.json(formattedExams);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
} 