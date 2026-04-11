import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";
import { z } from "zod";

const createSchema = z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    hours: z.number().min(0, "Hours must be positive"),
    remarks: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const body = await request.json();
        const validation = createSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Invalid parameters", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { employeeId, date, hours, remarks } = validation.data;

        // Verify employee exists within this site
        const employee = await prisma.employee.findFirst({
            where: { employeeId, siteId: session.siteId }
        });

        if (!employee) {
            return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
        }

        // Parse Date
        const [year, month, day] = date.split('-').map(Number);
        const recordDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)); // Store at noon UTC

        // Create EOT record
        const newRecord = await prisma.attendanceRecord.create({
            data: {
                employeeId: employee.id, // Relation ID
                date: recordDate,
                network: employee.network,
                activity: employee.activity,
                element: employee.element,
                aaType: "EOT",
                hours: hours,
                shift: employee.shift, // Use default shift
                remarks: remarks ? `${remarks} (Manual)` : "Manual Entry",
                needsReview: true, // Manual entries still require formal UI approval, or we can auto-approve. Let's make it pending by default for consistency.
                reviewReason: "MANUAL_ENTRY",
            }
        });

        return NextResponse.json({
            success: true,
            data: newRecord,
            message: "Successfully created manual EOT record",
        });
    } catch (error) {
        console.error("Error creating manual EOT:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create EOT record" },
            { status: 500 }
        );
    }
}
