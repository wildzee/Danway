import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        const where: any = { employee: { siteId: session.siteId } };

        if (dateStr) {
            const targetDate = new Date(dateStr);
            where.date = {
                gte: new Date(new Date(targetDate).setHours(0, 0, 0, 0)),
                lt: new Date(new Date(targetDate).setHours(23, 59, 59, 999)),
            };
        }

        const records = await prisma.attendanceRecord.findMany({
            where,
            include: { employee: true },
            orderBy: [{ date: 'desc' }, { employee: { employeeId: 'asc' } }],
            take: 500,
        });

        return NextResponse.json({ success: true, count: records.length, data: records });
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
    }
}
