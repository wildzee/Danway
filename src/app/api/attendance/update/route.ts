import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
    employeeId: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}T?\S*$/, "Invalid date format"),
    type: z.enum(['hours', 'ot']),
    value: z.union([z.string(), z.number()]),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = updateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: "Invalid parameters", details: validation.error.issues }, { status: 400 });
        }

        const { employeeId, date, type, value } = validation.data;

        // Determine AA Type (0600 = Normal, 0801 = OT)
        const aaType = type === 'hours' ? '0600' : '0801';
        const hours = parseFloat(String(value)); // Ensure number

        if (isNaN(hours)) {
            return NextResponse.json({ success: false, error: "Invalid hours value" }, { status: 400 });
        }

        // Find Employee (by numeric ID "100...")
        const employee = await prisma.employee.findUnique({
            where: { employeeId: employeeId }
        });

        if (!employee) {
            return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
        }

        // Date Logic (Ensure correct UTC day match)
        // Assume date is YYYY-MM-DD string
        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        // Find existing record
        const existingRecord = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId: employee.id, // Use CUID here
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                aaType: aaType,
            },
        });

        if (existingRecord) {
            if (hours > 0) {
                // Update
                await prisma.attendanceRecord.update({
                    where: { id: existingRecord.id },
                    data: { hours: hours, remarks: "Manual Edit" },
                });
            } else {
                // Delete if 0? Or keep as 0? Usually keep as 0 if user wants to clear.
                // But if logic expects missing record = 0, deleting is cleaner.
                await prisma.attendanceRecord.delete({
                    where: { id: existingRecord.id },
                });
            }
        } else if (hours > 0) {
            // Create new record
            await prisma.attendanceRecord.create({
                data: {
                    employeeId: employee.id,
                    date: startOfDay,
                    aaType: aaType,
                    hours: hours,
                    shift: employee.shift || "Day shift",
                    network: employee.network,
                    activity: employee.activity,
                    element: employee.element,
                    remarks: "Manual Add",
                },
            });
        }

        return NextResponse.json({ success: true, message: "Updated successfully" });

    } catch (error) {
        console.error("Error updating attendance:", error);
        return NextResponse.json(
            { success: false, error: "Update failed", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
