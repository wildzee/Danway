import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBulkSchema = z.object({
    recordIds: z.array(z.string()).min(1, "No record IDs provided"),
    hours: z.number().min(0).optional(),
    remarks: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = updateBulkSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Invalid parameters", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { recordIds, hours, remarks } = validation.data;
        
        const updateData: any = {};
        if (hours !== undefined) updateData.hours = hours;
        if (remarks !== undefined) updateData.remarks = remarks;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: true, message: "Nothing to update", count: 0 });
        }

        // Update records in bulk
        const updatedRecords = await prisma.attendanceRecord.updateMany({
            where: {
                id: {
                    in: recordIds,
                },
                aaType: "EOT", // safety check
            },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            count: updatedRecords.count,
            message: `Successfully updated ${updatedRecords.count} EOT records`,
        });
    } catch (error) {
        console.error("Error bulk updating EOT:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update EOT records" },
            { status: 500 }
        );
    }
}
