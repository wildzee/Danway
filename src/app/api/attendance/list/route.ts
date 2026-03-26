import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        let targetDate: Date | undefined;
        if (dateStr) {
            targetDate = new Date(dateStr);
        }

        // Build query
        const where: any = {};
        if (targetDate) {
            where.date = {
                gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                lt: new Date(targetDate.setHours(23, 59, 59, 999)),
            };
        }

        // Fetch attendance records with employee data
        const records = await prisma.attendanceRecord.findMany({
            where,
            include: {
                employee: true,
            },
            orderBy: [
                { date: 'desc' },
                { employee: { employeeId: 'asc' } },
            ],
            take: 500, // Limit for performance
        });

        return NextResponse.json({
            success: true,
            count: records.length,
            data: records,
        });
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch attendance records',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
