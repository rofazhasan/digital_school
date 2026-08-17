import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { ExamResultEmail } from "@/components/emails/ExamResultEmail";
import { generateStudentScriptPDF } from "@/lib/script-pdf-generator";

export async function POST(req: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !["SUPER_USER", "ADMIN"].includes(tokenData.user.role)) {
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

    // Early Check: If all results are already published, return immediately
    const allPublished = exam.results.length > 0 && exam.results.every(r => r.isPublished);
    if (allPublished) {
      return NextResponse.json({
        success: true,
        message: "Results are already released and up to date.",
        alreadyPublished: true
      });
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
          select: {
            id: true,
            guardianEmail: true,
            guardianPhone: true,
            user: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        }
      },
      orderBy: {
        total: 'desc' // Higher marks first
      }
    });

    // Calculate ranks with proper tie handling
    const resultsWithRanks = allResults.map((result, index) => {
      const sameCount = allResults.filter(r => r.total === result.total).length;
      let rank = index + 1;
      if (sameCount > 1) {
        const firstIndex = allResults.findIndex(r => r.total === result.total);
        rank = firstIndex + 1;
      }

      return {
        ...result,
        rank
      };
    });

    // Update all results with ranks and publish them immediately
    await Promise.all(
      resultsWithRanks.map(result =>
        prisma.result.update({
          where: { id: result.id },
          data: {
            rank: result.rank,
            isPublished: true,
            publishedAt: new Date()
          }
        })
      )
    );

    // Fetch institute data for branding
    const institute = await prisma.institute.findFirst({
      select: { name: true, address: true, phone: true, logoUrl: true }
    });

    // Non-blocking background notification worker (Email + SMS)
    (async () => {
      let sentCount = 0;
      let failCount = 0;

      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const host = req.headers.get("host") || "localhost:3000";
      const baseUrl = `${protocol}://${host}`;

      for (let i = 0; i < resultsWithRanks.length; i++) {
        const result = resultsWithRanks[i];
        const emailToUse = result.student.guardianEmail || result.student.user?.email;
        const phoneToUse = result.student.guardianPhone || result.student.user?.phone;

        if (!emailToUse && !phoneToUse) continue;

        let emailSuccess = false;

        if (emailToUse && emailToUse.includes('@')) {
          try {
            const breakdown = [{
              subject: exam.name,
              marks: result.total,
              totalMarks: exam.totalMarks,
              grade: result.grade || 'N/A',
              mcqMarks: result.mcqMarks,
              sqMarks: result.sqMarks,
              cqMarks: result.cqMarks
            }];

            let attachments = [];
            try {
              const pdfBuffer = await generateStudentScriptPDF({
                examId: exam.id,
                studentId: result.studentId,
                baseUrl: baseUrl
              });
              if (pdfBuffer) {
                attachments.push({
                  filename: `${result.student.user.name.replace(/\s+/g, '_')}_Result.pdf`,
                  content: pdfBuffer
                });
              }
            } catch (pdfErr) {
              console.error("PDF generation skipped/failed:", pdfErr);
            }

            await sendEmail({
              to: emailToUse,
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
                studentId: result.studentId,
                baseUrl: baseUrl
              }) as any,
              attachments
            });
            sentCount++;
            emailSuccess = true;
          } catch (err) {
            console.error(`❌ [EMAIL FAILED] Failed email to ${emailToUse}:`, err);
            emailSuccess = false;
          }
        }

        if (!emailSuccess && phoneToUse) {
          try {
            const firstName = result.student.user?.name?.split(' ')[0] || 'Student';
            const instName = institute?.name || 'School';
            const percentage = Math.round(result.percentage || 0);

            const smsMessage = `Dear ${firstName},\nExam Result ${exam.name}: ${result.total}/${exam.totalMarks} (${percentage}% ${result.grade || 'N/A'})${result.rank ? ` Rank:${result.rank}` : ''}\nGood Luck! - ${instName}`;

            const { sendSMS } = await import("@/lib/sms");
            const smsRes = await sendSMS(phoneToUse, smsMessage);
            if (smsRes.success) {
              sentCount++;
            } else {
              failCount++;
            }
          } catch (smsErr) {
            failCount++;
          }
        } else if (!emailSuccess) {
          failCount++;
        }

        if (i < resultsWithRanks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      console.log(`✉️ Background notification complete for ${exam.name}: Sent ${sentCount}, Failed ${failCount}`);
    })().catch(err => console.error("Background notification error:", err));

    return NextResponse.json({
      success: true,
      message: `Results released instantly for exam ${exam.name}! Notifications are being dispatched in background.`,
      publishedCount: resultsWithRanks.length,
      closedReviewsCount: updatedReviews.count
    });
  } catch (error) {
    console.error("Error releasing results:", error);
    return NextResponse.json({ error: "Failed to release results" }, { status: 500 });
  }
}