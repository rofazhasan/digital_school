import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/db";
import { generateOMRTemplate } from "@/lib/omr-mapper";

export async function GET(req: NextRequest) {
    try {
        const exams = await prismadb.exam.findMany({
            where: { isActive: true },
            include: { examSets: true }
        });

        const syncData = exams.flatMap(exam =>
            exam.examSets.map(set => ({
                id: `${exam.id}_${set.id}`,
                examId: exam.id,
                setId: set.id,
                title: `${exam.name} - Set ${set.name}`,
                templateJson: generateOMRTemplate(exam.id, set.id, set.questionsJson)
            }))
        );

        return NextResponse.json(syncData);
    } catch (error) {
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
