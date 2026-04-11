import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireSession } from "@/lib/auth/api-auth";

const approveSchema = z.object({
    recordIds: z.array(z.string()).min(1, "No record IDs provided"),
});

export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;

    try {
        const body = await request.json();
        const validation = approveSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: "Invalid parameters", details: validation.error.issues }, { status: 400 });
        }

        const { recordIds } = validation.data;

        const updatedRecords = await prisma.attendanceRecord.updateMany({
            where: { id: { in: recordIds }, aaType: "EOT" },
            data: { needsReview: false, reviewReason: null, reviewedBy: "Timekeeper", reviewedAt: new Date() },
        });

        return NextResponse.json({ success: true, message: `Successfully approved ${updatedRecords.count} EOT records`, count: updatedRecords.count });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to approve EOT records" }, { status: 500 });
    }
}
