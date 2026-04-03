const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking Database Status...");

    const empCount = await prisma.employee.count();
    console.log(`👨‍🏭 Total Employees: ${empCount}`);

    const punchCount = await prisma.punchRecord.count();
    console.log(`⏱️  Total Punch Records: ${punchCount}`);

    if (punchCount > 0) {
        const punches = await prisma.punchRecord.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { employee: true }
        });

        console.log("\n📅 Recent Punch Records:");
        punches.forEach(p => {
            console.log(`   - [${p.date.toISOString().split('T')[0]}] ${p.employee ? p.employee.name : 'Unknown'} (${p.employeeId}): In=${p.punchIn}, Out=${p.punchOut}`);
        });

        console.log("\n💡 NOTE: The Manpower Report shows data for the SELECTED DATE.");
        console.log("   Make sure the date picker on the page matches these punch dates.");
    } else {
        console.log("\n⚠️  No punch records found!");
        console.log("   If you just cleared the database, you need to upload the Excel file again.");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
