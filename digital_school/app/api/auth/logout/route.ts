import { NextResponse } from "next/server";
import { invalidateSessionCache } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Create response
    const response = NextResponse.json({
      message: "Logout successful",
    });

    // Clear session token cookie and invalidate cache
    invalidateSessionCache();
    response.cookies.delete('session-token');

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 