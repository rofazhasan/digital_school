import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { ExamResultEmail } from "@/components/emails/ExamResultEmail";
import { generateStudentScriptPDF } from "@/lib/script-pdf-generator";

export async function POST(req: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || tokenData.user.role !== "SUPER_USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { examId } = await req.json();

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        results: true,
        class: true,
        examSets: {
          include: {
            questions: true
          }
        },
        examSubmissions: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Close all pending review requests for this exam
    const updatedReviews = await (prisma as any).resultReview.updateMany({
      where: {
        examId,
        status: { in: ['PENDING', 'UNDER_REVIEW'] }
      },
      data: {
        status: 'COMPLETED',
        reviewedAt: new Date()
      }
    });

    // Get all results for this exam to calculate ranks
    const allResults = await prisma.result.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        total: 'desc' // Higher marks first
      }
    });

    // Calculate ranks with proper tie handling
    const resultsWithRanks = allResults.map((result, index) => {
      // Find how many students have the same or higher marks
      const sameOrHigherCount = allResults.filter(r => r.total >= result.total).length;
      // Find how many students have exactly the same marks
      const sameCount = allResults.filter(r => r.total === result.total).length;

      // If multiple students have the same marks, they get the same rank
      let rank = index + 1;
      if (sameCount > 1) {
        // Find the first occurrence of this score
        const firstIndex = allResults.findIndex(r => r.total === result.total);
        rank = firstIndex + 1;
      }

      return {
        ...result,
        rank
      };
    });

    console.log(`📊 Rank Calculation Debug:`, {
      examId,
      totalResults: allResults.length,
      resultsWithRanks: resultsWithRanks.map(r => ({
        studentName: r.student.user.name,
        total: r.total,
        rank: r.rank
      }))
    });

    // Update all results with ranks and publish them
    const updatePromises = resultsWithRanks.map(result =>
      prisma.result.update({
        where: { id: result.id },
        data: {
          rank: result.rank,
          isPublished: true,
          publishedAt: new Date()
        }
      })
    );

    await Promise.all(updatePromises);

    // Send Emails in background (don't block the response)
    const sendResultEmails = async () => {
      try {
        // Fetch institute data for branding
        const institute = await prisma.institute.findFirst({
          select: { name: true, address: true, phone: true, logoUrl: true }
        });

        const emailPromises = resultsWithRanks.map(result => {
          if (!result.student.user.email) return Promise.resolve();

          // Map complete breakdown for accuracy
          const breakdown = [{
            subject: exam.name,
            marks: result.total,
            totalMarks: exam.totalMarks,
            grade: result.grade || 'N/A',
            mcqMarks: result.mcqMarks,
            sqMarks: result.sqMarks,
            cqMarks: result.cqMarks
          }];

          return (async () => {
            try {
              // Find the specific submission for this student to get answers and notes
              const studentSubmission = exam.examSubmissions.find(s => s.studentId === result.studentId);

              // Generate PDF Attachment
              const pdfBuffer = await generateStudentScriptPDF({
                studentName: result.student.user.name,
                studentRoll: result.student.roll,
                examName: exam.name,
                examDate: exam.date.toLocaleDateString(),
                subject: exam.name,
                className: (exam as any).class?.name || "N/A",
                results: {
                  total: result.total,
                  totalMarks: exam.totalMarks,
                  grade: result.grade || 'N/A',
                  rank: result.rank || undefined,
                  mcqMarks: result.mcqMarks,
                  sqMarks: result.sqMarks,
                  cqMarks: result.cqMarks,
                  percentage: result.percentage || 0
                },
                institute: {
                  name: institute?.name || "Digital School",
                  address: institute?.address || undefined,
                  logoUrl: institute?.logoUrl || undefined
                },
                // Pass questions and student answers
                questions: exam.examSets.flatMap(set => set.questions),
                submission: studentSubmission ? {
                  answers: studentSubmission.answers as any,
                  evaluatorNotes: studentSubmission.evaluatorNotes || undefined
                } : undefined
              });

              return sendEmail({
                to: result.student.user.email!,
                subject: `Exam Result Released: ${exam.name}`,
                react: ExamResultEmail({
                  studentName: result.student.user.name,
                  examName: exam.name,
                  results: breakdown,
                  totalPercentage: result.percentage || 0,
                  finalGrade: result.grade || 'N/A',
                  rank: result.rank || undefined,
                  institute: institute as any,
                  examDate: exam.date.toLocaleDateString(),
                  remarks: result.comment || undefined,
                  examId: exam.id,
                  studentId: result.studentId
                }) as any,
                attachments: [
                  {
                    filename: `${result.student.user.name.replace(/\s+/g, '_')}_Result.pdf`,
                    content: pdfBuffer
                  }
                ]
              });
            } catch (err) {
              console.error(`Failed to send email to ${result.student.user.email}:`, err);
              return Promise.resolve();
            }
          })();
        });

        await Promise.allSettled(emailPromises);
      } catch (err) {
        console.error('Failed to send result emails:', err);
      }
    };

    // Trigger email sending
    sendResultEmails();

    const updatedResults = { count: resultsWithRanks.length };

    return NextResponse.json({
      success: true,
      message: `Results released for exam ${exam.name}. ${updatedReviews.count} review requests closed.`,
      publishedCount: updatedResults.count,
      closedReviewsCount: updatedReviews.count
    });
  } catch (error) {
    console.error("Error releasing results:", error);
    return NextResponse.json({ error: "Failed to release results" }, { status: 500 });
  }
} 