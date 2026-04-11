import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");
        const date = searchParams.get("date");

        let startOfDay, endOfDay, targetDate;

        if (startDateParam && endDateParam && /^\d{4}-\d{2}-\d{2}$/.test(startDateParam) && /^\d{4}-\d{2}-\d{2}$/.test(endDateParam)) {
            const [sY, sM, sD] = startDateParam.split('-').map(Number);
            const [eY, eM, eD] = endDateParam.split('-').map(Number);
            startOfDay = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999));
            targetDate = startOfDay;
        } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [year, month, day] = date.split('-').map(Number);
            startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            targetDate = startOfDay;
        } else {
            const now = new Date();
            startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
            targetDate = startOfDay;
        }

        const eotRecords = await prisma.attendanceRecord.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
                aaType: "EOT",
                employee: { siteId: session.siteId },
            },
            include: { employee: true },
            orderBy: [{ employeeId: 'asc' }],
        });

        return NextResponse.json({ success: true, data: eotRecords, count: eotRecords.length, date: targetDate.toISOString() });
    } catch (error) {
        console.error("Error fetching EOT records:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch EOT records" }, { status: 500 });
    }
}
