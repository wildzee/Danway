import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get("date"); // YYYY-MM-DD string

        let startOfDay, endOfDay;
        let targetDate;

        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            // Parse YYYY-MM-DD strictly as UTC
            const [year, month, day] = date.split('-').map(Number);
            startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            targetDate = startOfDay;
        } else {
            // Fallback to today (UTC)
            const now = new Date();
            startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
            targetDate = startOfDay;
        }

        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                aaType: {
                    not: "EOT"
                }
            },
            include: {
                employee: true,
            },
            orderBy: [
                { employeeId: 'asc' },
                { aaType: 'asc' },
            ],
        });

        return NextResponse.json({
            success: true,
            data: attendanceRecords,
            count: attendanceRecords.length,
            date: targetDate.toISOString(),
        });
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch attendance records" },
            { status: 500 }
        );
    }
}
