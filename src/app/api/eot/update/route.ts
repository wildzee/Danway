import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireSession } from "@/lib/auth/api-auth";

const updateSchema = z.object({
    recordId: z.string().min(1, "Record ID is required"),
    hours: z.number().min(0).optional(),
    remarks: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;

    try {
        const body = await request.json();
        const validation = updateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Invalid parameters", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { recordId, hours, remarks } = validation.data;
        
        const updateData: any = {};
        if (hours !== undefined) updateData.hours = hours;
        if (remarks !== undefined) updateData.remarks = remarks;

        // Update record
        const updatedRecord = await prisma.attendanceRecord.update({
            where: {
                id: recordId,
                aaType: "EOT", // safety check
            },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            data: updatedRecord,
            message: "Successfully updated EOT record",
        });
    } catch (error) {
        console.error("Error updating EOT:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update EOT record" },
            { status: 500 }
        );
    }
}
