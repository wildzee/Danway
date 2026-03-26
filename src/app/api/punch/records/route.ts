import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get("date"); // YYYY-MM-DD string
        const employeeId = searchParams.get("employeeId"); // Optional

        let startOfDay, endOfDay;

        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            // Parse YYYY-MM-DD strictly as UTC
            const [year, month, day] = date.split('-').map(Number);
            startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        } else {
            // Fallback to today (UTC)
            const now = new Date();
            startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        }

        const targetDate = startOfDay; // For response consistency

        const where: any = {
            date: {
                gte: startOfDay,
                lte: endOfDay,
            },
        };

        if (employeeId) {
            where.employeeId = employeeId;
        }

        const punchRecords = await prisma.punchRecord.findMany({
            where,
            include: {
                employee: true,
                hiredEmployee: true,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return NextResponse.json({
            success: true,
            data: punchRecords,
            count: punchRecords.length,
            date: targetDate.toISOString(),
        });
    } catch (error) {
        console.error("Error fetching punch records:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch punch records" },
            { status: 500 }
        );
    }
}
