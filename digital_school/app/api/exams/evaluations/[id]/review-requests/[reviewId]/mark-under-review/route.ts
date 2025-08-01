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

    // Update the review request to mark it as under review
    const updatedReview = await (db as any).resultReview.update({
      where: { id: reviewId },
      data: {
        status: 'UNDER_REVIEW',
        reviewedById: tokenData.user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: "Review marked as under review",
      review: updatedReview
    });

  } catch (error) {
    console.error('Error marking review as under review:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 