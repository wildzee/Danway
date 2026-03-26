import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");
        const date = searchParams.get("date"); // YYYY-MM-DD string

        let startOfDay, endOfDay;
        let targetDate;

        if (startDateParam && endDateParam && /^\d{4}-\d{2}-\d{2}$/.test(startDateParam) && /^\d{4}-\d{2}-\d{2}$/.test(endDateParam)) {
            const [sYear, sMonth, sDay] = startDateParam.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateParam.split('-').map(Number);
            startOfDay = new Date(Date.UTC(sYear, sMonth - 1, sDay, 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(eYear, eMonth - 1, eDay, 23, 59, 59, 999));
            targetDate = startOfDay;
        } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
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

        const eotRecords = await prisma.attendanceRecord.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                aaType: "EOT"
            },
            include: {
                employee: true,
            },
            orderBy: [
                { employeeId: 'asc' },
            ],
        });

        return NextResponse.json({
            success: true,
            data: eotRecords,
            count: eotRecords.length,
            date: targetDate.toISOString(),
        });
    } catch (error) {
        console.error("Error fetching EOT records:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch EOT records" },
            { status: 500 }
        );
    }
}
