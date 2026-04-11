import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireSession } from "@/lib/auth/api-auth";

const updateSchema = z.object({
    employeeId: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}T?\S*$/, "Invalid date format"),
    type: z.enum(['hours', 'ot']),
    value: z.union([z.string(), z.number()]),
});

export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const body = await request.json();
        const validation = updateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: "Invalid parameters", details: validation.error.issues }, { status: 400 });
        }

        const { employeeId, date, type, value } = validation.data;
        const aaType = type === 'hours' ? '0600' : '0801';
        const hours = parseFloat(String(value));

        if (isNaN(hours)) {
            return NextResponse.json({ success: false, error: "Invalid hours value" }, { status: 400 });
        }

        // Find employee scoped to this site
        const employee = await prisma.employee.findFirst({
            where: { employeeId, siteId: session.siteId },
        });

        if (!employee) {
            return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
        }

        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        const existingRecord = await prisma.attendanceRecord.findFirst({
            where: { employeeId: employee.id, date: { gte: startOfDay, lte: endOfDay }, aaType },
        });

        if (existingRecord) {
            if (hours > 0) {
                await prisma.attendanceRecord.update({ where: { id: existingRecord.id }, data: { hours, remarks: "Manual Edit" } });
            } else {
                await prisma.attendanceRecord.delete({ where: { id: existingRecord.id } });
            }
        } else if (hours > 0) {
            await prisma.attendanceRecord.create({
                data: {
                    employeeId: employee.id, date: startOfDay, aaType, hours, shift: employee.shift || "Day shift",
                    network: employee.network, activity: employee.activity, element: employee.element, remarks: "Manual Add",
                },
            });
        }

        return NextResponse.json({ success: true, message: "Updated successfully" });
    } catch (error) {
        console.error("Error updating attendance:", error);
        return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
    }
}
