import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSAPAttendanceFile } from '@/lib/attendance/excel-parser';
import { extractProjectCode } from '@/lib/utils/project-utils';

export async function POST(request: NextRequest) {
    try {
        // Get uploaded file
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Parse SAP attendance file
        const sapRecords = await parseSAPAttendanceFile(buffer);

        // Deduplicate employees - keep only first occurrence of each employee ID
        const uniqueEmployees = new Map<string, typeof sapRecords[0]>();
        for (const record of sapRecords) {
            if (record.employeeId && !uniqueEmployees.has(record.employeeId)) {
                uniqueEmployees.set(record.employeeId, record);
            }
        }

        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        let skippedDuplicates = sapRecords.length - uniqueEmployees.size;

        // Prepare payload array
        const upsertPromises = [];
        for (const record of uniqueEmployees.values()) {
            if (!record.employeeId) continue;

            const designation = record.designation || 'WORKER';
            const isEng = designation.toLowerCase().includes('engineer') || designation.toLowerCase().includes('manager') || designation.toLowerCase().includes('officer');
            // By default setting OT opposite of Engineer status for initial imports
            const allowOvertime = !isEng;

            const employeeData = {
                employeeId: record.employeeId,
                name: record.name,
                designation: designation,
                mobile: record.mobile || null,
                shift: record.shift || 'Day shift',
                isEngineer: isEng,
                allowOvertime: allowOvertime,
                project: extractProjectCode('D657'), // Default project
                network: record.network || '5001323',
                activity: record.activity || '0010',
                element: record.element || '0102',
            };

            upsertPromises.push(
                prisma.employee.upsert({
                    where: { employeeId: record.employeeId },
                    update: employeeData,
                    create: employeeData,
                })
            );
        }

        // Execute in chunks to avoid overwhelming the database connection pool
        const chunkSize = 100;
        for (let i = 0; i < upsertPromises.length; i += chunkSize) {
            const chunk = upsertPromises.slice(i, i + chunkSize);
            try {
                await Promise.all(chunk);
                updatedCount += chunk.length; // Counting all as processed (created/updated)
            } catch (error) {
                console.error(`Error processing chunk ${i}-${i + chunkSize}:`, error);
                errorCount += chunk.length;
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Employees imported successfully',
            data: {
                totalRecords: sapRecords.length,
                uniqueEmployees: uniqueEmployees.size,
                skippedDuplicates,
                createdCount,
                updatedCount,
                errorCount,
            },
        });
    } catch (error) {
        console.error('Error importing employees:', error);
        return NextResponse.json(
            {
                error: 'Failed to import employees',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// GET endpoint to list all employees
export async function GET() {
    try {
        const employees = await prisma.employee.findMany({
            orderBy: { employeeId: 'asc' },
        });

        return NextResponse.json({
            success: true,
            count: employees.length,
            data: employees,
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch employees',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
