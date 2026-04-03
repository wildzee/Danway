const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
    try {
        console.log('🗑️  Starting database cleanup...\n');

        // Delete in correct order (due to foreign keys)
        console.log('Deleting attendance records...');
        const attendance = await prisma.attendanceRecord.deleteMany({});
        console.log(`✅ Deleted ${attendance.count} attendance records`);

        console.log('Deleting punch records...');
        const punches = await prisma.punchRecord.deleteMany({});
        console.log(`✅ Deleted ${punches.count} punch records`);

        console.log('Deleting import batches...');
        const batches = await prisma.importBatch.deleteMany({});
        console.log(`✅ Deleted ${batches.count} import batches`);

        console.log('Deleting employees...');
        const employees = await prisma.employee.deleteMany({});
        console.log(`✅ Deleted ${employees.count} employees`);

        console.log('\n✅ Database cleanup complete!');
    } catch (error) {
        console.error('❌ Error clearing database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearDatabase();
