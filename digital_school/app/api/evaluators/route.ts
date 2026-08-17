import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(req);
    if (!tokenData || !["SUPER_USER", "ADMIN"].includes(tokenData.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const evaluators = await prisma.user.findMany({
      where: {
        role: { in: ["TEACHER", "ADMIN"] },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teacherProfile: {
          select: {
            department: true,
            subjects: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(evaluators, {
      headers: {
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=120"
      }
    });
  } catch (error) {
    console.error("Error fetching evaluators:", error);
    return NextResponse.json({ error: "Failed to fetch evaluators" }, { status: 500 });
  }
} 