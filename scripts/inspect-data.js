const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectData() {
    try {
        // Get distinct dates
        const dates = await prisma.punchRecord.groupBy({
            by: ['date'],
        });

        if (dates.length === 0) {
            console.log("No data found.");
            return;
        }

        const dateToInspect = dates[0].date;
        console.log(`Inspecting data for date: ${dateToInspect.toISOString()}`);

        // Get punch records
        const punches = await prisma.punchRecord.findMany({
            where: { date: dateToInspect },
            take: 5,
            include: { employee: true }
        });

        console.log("\n--- Punch Records (Sample 5) ---");
        console.table(punches.map(p => ({
            id: p.employeeId,
            in: p.punchIn,
            out: p.punchOut,
            status: p.status
        })));

        // Get attendance records
        const attendance = await prisma.attendanceRecord.findMany({
            where: { date: dateToInspect },
            take: 10, // take more to see potential duplicates
            include: { employee: true }
        });

        console.log("\n--- Attendance Records (Sample 10) ---");
        console.table(attendance.map(a => ({
            id: a.employeeId,
            type: a.aaType, // 0600 or 0801
            hours: a.hours,
            shift: a.shift,
            remarks: a.remarks
        })));

        // Check for specific employee if needed
        // const specificEmp = await prisma.attendanceRecord.findMany({ where: { employeeId: '...' } });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

inspectData();
