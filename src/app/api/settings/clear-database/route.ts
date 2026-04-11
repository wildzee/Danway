import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth/api-auth';

export async function POST(request: NextRequest) {
    const result = await requireSession(request, ['admin']);
    if (result instanceof NextResponse) return result;

    try {
        // Run as a transaction to ensure all or nothing deletes
        // We delete strictly calculator data. We keep Settings, Vendors, and PublicHolidays.
        await prisma.$transaction([
            prisma.punchRecord.deleteMany({}),
            prisma.attendanceRecord.deleteMany({}),
            prisma.hiredTimesheet.deleteMany({}),
            prisma.employee.deleteMany({}),
            prisma.hiredEmployee.deleteMany({})
        ]);

        return NextResponse.json({
            success: true,
            message: 'All calculator memory (Employees, Punches, Attendance) has been successfully cleared.'
        });
    } catch (error) {
        console.error('Error clearing database:', error);
        return NextResponse.json(
            { error: 'Failed to clear database memory. Please try again.' },
            { status: 500 }
        );
    }
}
