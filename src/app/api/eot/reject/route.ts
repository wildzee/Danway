import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireSession } from "@/lib/auth/api-auth";

const rejectSchema = z.object({
    recordIds: z.array(z.string()).min(1, "No record IDs provided"),
});

export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;

    try {
        const body = await request.json();
        const validation = rejectSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Invalid parameters", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { recordIds } = validation.data;

        // Perform bulk delete
        const deletedRecords = await prisma.attendanceRecord.deleteMany({
            where: {
                id: {
                    in: recordIds,
                },
                aaType: "EOT", // double check it's EOT to prevent accidental attendance deletion
            },
        });

        return NextResponse.json({
            success: true,
            message: `Successfully rejected and deleted ${deletedRecords.count} EOT records`,
            count: deletedRecords.count
        });
    } catch (error) {
        console.error("Error rejecting EOT records:", error);
        return NextResponse.json(
            { success: false, error: "Failed to reject EOT records" },
            { status: 500 }
        );
    }
}
