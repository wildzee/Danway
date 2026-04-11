import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const today = new Date();
        const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

        const siteFilter = session.siteId ? { siteId: session.siteId } : {};

        const [danwayCount, hiredCount] = await Promise.all([
            prisma.employee.count({ where: { status: 'active', ...siteFilter } }),
            prisma.hiredEmployee.count({ where: { status: 'active', ...siteFilter } })
        ]);
        const totalManpower = danwayCount + hiredCount;

        // Scoped punch records — filter via employee relation
        const siteEmployees = session.siteId
            ? await prisma.employee.findMany({ where: { siteId: session.siteId }, select: { id: true } })
            : [];
        const siteEmployeeIds = siteEmployees.map(e => e.id);

        const presentRecords = await prisma.punchRecord.groupBy({
            by: ['employeeId', 'hiredEmployeeId'],
            where: {
                date: { gte: startOfDay, lte: endOfDay },
                ...(session.siteId ? {
                    OR: [
                        { employeeId: { in: siteEmployeeIds } },
                        { hiredEmployee: { siteId: session.siteId } },
                    ]
                } : {}),
            }
        });
        const currentlyPresent = presentRecords.length;

        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
                ...(session.siteId ? { employee: { siteId: session.siteId } } : {}),
            },
            select: { remarks: true, needsReview: true, reviewReason: true }
        });

        let lateArrivals = 0;
        let missingPunches = 0;
        attendanceRecords.forEach(record => {
            if (record.remarks?.toLowerCase().includes("late")) lateArrivals++;
            if (record.needsReview && record.reviewReason === "MISSING_PUNCH_OUT") missingPunches++;
        });

        return NextResponse.json({
            success: true,
            data: { totalManpower, currentlyPresent, lateArrivals, missingPunches, attendanceRate: totalManpower > 0 ? Math.round((currentlyPresent / totalManpower) * 100) : 0, date: startOfDay.toISOString() }
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
