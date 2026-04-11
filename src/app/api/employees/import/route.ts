import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSAPAttendanceFile } from '@/lib/attendance/excel-parser';
import { extractProjectCode } from '@/lib/utils/project-utils';
import { requireSession } from '@/lib/auth/api-auth';

export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    if (!session.siteId) {
        return NextResponse.json({ error: 'No site context in session' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const sapRecords = await parseSAPAttendanceFile(buffer);

        const uniqueEmployees = new Map<string, typeof sapRecords[0]>();
        for (const record of sapRecords) {
            if (record.employeeId && !uniqueEmployees.has(record.employeeId)) {
                uniqueEmployees.set(record.employeeId, record);
            }
        }

        let updatedCount = 0;
        let errorCount = 0;
        const skippedDuplicates = sapRecords.length - uniqueEmployees.size;

        const upsertPromises = [];
        for (const record of uniqueEmployees.values()) {
            if (!record.employeeId) continue;

            const designation = record.designation || 'WORKER';
            const isEng = designation.toLowerCase().includes('engineer') || designation.toLowerCase().includes('manager') || designation.toLowerCase().includes('officer');
            const allowOvertime = !isEng;

            const employeeData = {
                name: record.name,
                designation,
                mobile: record.mobile || null,
                shift: record.shift || 'Day shift',
                isEngineer: isEng,
                allowOvertime,
                siteId: session.siteId!,
                project: extractProjectCode(session.siteCode || 'D657'),
                network: record.network || '5001323',
                activity: record.activity || '0010',
                element: record.element || '0102',
            };

            upsertPromises.push(
                prisma.employee.upsert({
                    where: { siteId_employeeId: { siteId: session.siteId!, employeeId: record.employeeId } },
                    update: employeeData,
                    create: { employeeId: record.employeeId, ...employeeData },
                })
            );
        }

        const chunkSize = 100;
        for (let i = 0; i < upsertPromises.length; i += chunkSize) {
            const chunk = upsertPromises.slice(i, i + chunkSize);
            try {
                await Promise.all(chunk);
                updatedCount += chunk.length;
            } catch (error) {
                console.error(`Error processing chunk ${i}-${i + chunkSize}:`, error);
                errorCount += chunk.length;
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Employees imported successfully',
            data: { totalRecords: sapRecords.length, uniqueEmployees: uniqueEmployees.size, skippedDuplicates, updatedCount, errorCount },
        });
    } catch (error) {
        console.error('Error importing employees:', error);
        return NextResponse.json({ error: 'Failed to import employees', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const employees = await prisma.employee.findMany({
            where: { siteId: session.siteId },
            orderBy: { employeeId: 'asc' },
        });

        return NextResponse.json({ success: true, count: employees.length, data: employees });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}
