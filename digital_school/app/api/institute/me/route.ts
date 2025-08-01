import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prismadb from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Only super users can access institute data
    if (user.role !== 'SUPER_USER') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!user.instituteId) {
      return NextResponse.json(
        { error: "User does not have an instituteId" },
        { status: 400 }
      );
    }

    const institute = await prismadb.institute.findFirst({
      where: { id: user.instituteId },
    });

    if (!institute) {
      return NextResponse.json(
        { error: "Institute not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      institute,
    });
  } catch (error) {
    console.error("Get institute error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
