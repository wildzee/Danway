import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const today = new Date();
        const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

        // 1. Total Manpower (Active Danway + Active Hired)
        const [danwayCount, hiredCount] = await Promise.all([
            prisma.employee.count({ where: { status: 'active' } }),
            prisma.hiredEmployee.count({ where: { status: 'active' } })
        ]);
        const totalManpower = danwayCount + hiredCount;

        // 2. Currently Present (Employees with ANY punch record today)
        const presentRecords = await prisma.punchRecord.groupBy({
            by: ['employeeId', 'hiredEmployeeId'],
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                }
            }
        });
        const currentlyPresent = presentRecords.length;

        // 3. Late Arrivals & Missing Punches
        // For Danway employees, we can check AttendanceRecord
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                }
            },
            select: { remarks: true, needsReview: true, reviewReason: true }
        });

        let lateArrivals = 0;
        let missingPunches = 0;

        attendanceRecords.forEach(record => {
            if (record.remarks?.toLowerCase().includes("late")) {
                lateArrivals++;
            }
            if (record.needsReview && record.reviewReason === "MISSING_PUNCH_OUT") {
                missingPunches++;
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                totalManpower,
                currentlyPresent,
                lateArrivals,
                missingPunches,
                attendanceRate: totalManpower > 0 ? Math.round((currentlyPresent / totalManpower) * 100) : 0,
                date: startOfDay.toISOString()
            }
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
