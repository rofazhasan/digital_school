import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

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
        results: true
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