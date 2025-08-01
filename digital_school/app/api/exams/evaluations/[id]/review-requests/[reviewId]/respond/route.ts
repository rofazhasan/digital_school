import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id: examId, reviewId } = await params;
    const tokenData = await getTokenFromRequest(req);
    
    if (!tokenData || !tokenData.user || !tokenData.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is teacher, admin, or super user
    const allowedRoles = ['TEACHER', 'ADMIN', 'SUPER_USER'];
    if (!allowedRoles.includes(tokenData.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { response, status } = body;

    if (!response || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Update the review request - set status to COMPLETED if approved
    const finalStatus = status === 'APPROVED' ? 'COMPLETED' : status;
    
    const updatedReview = await (db as any).resultReview.update({
      where: { id: reviewId },
      data: {
        evaluatorComment: response,
        status: finalStatus,
        reviewedAt: new Date(),
        reviewedById: tokenData.user.id
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        exam: true
      }
    });

    // Create notification for the student
    await (db as any).notification.create({
      data: {
        userId: updatedReview.student.user.id,
        title: `Review ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your review request for exam "${updatedReview.exam.name}" has been ${status.toLowerCase()}. ${response ? `Comment: ${response}` : ''}`,
        type: 'REVIEW_RESPONSE',
        relatedId: reviewId,
        relatedType: 'result_review'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Review ${status.toLowerCase()} successfully`,
      review: updatedReview
    });

  } catch (error) {
    console.error('Error responding to review:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 