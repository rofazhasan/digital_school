import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET: Fetch all halls for the user's institute
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "TEACHER" && user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const instituteId = user.instituteId;
        if (!instituteId) {
            return NextResponse.json({ error: "Institute ID not found" }, { status: 400 });
        }

        const halls = await prisma.examHall.findMany({
            where: { instituteId },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ halls });
    } catch (error) {
        console.error("Error fetching exam halls:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new exam hall
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const instituteId = user.instituteId;
        if (!instituteId) {
            return NextResponse.json({ error: "Institute ID not found" }, { status: 400 });
        }

        const body = await req.json();
        const { name, roomNo, rows, columns, seatsPerBench } = body;

        if (!name || !rows || !columns || !seatsPerBench) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const capacity = rows * columns * seatsPerBench;

        const hall = await prisma.examHall.create({
            data: {
                name,
                roomNo,
                rows: parseInt(rows),
                columns: parseInt(columns),
                seatsPerBench: parseInt(seatsPerBench),
                capacity,
                instituteId
            }
        });

        return NextResponse.json({ hall });

    } catch (error) {
        console.error("Error creating exam hall:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
