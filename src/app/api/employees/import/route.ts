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

        // Process each unique employee record
        for (const record of uniqueEmployees.values()) {
            try {
                // Skip if no employee ID
                if (!record.employeeId) {
                    errorCount++;
                    continue;
                }

                // Check if employee exists
                const existing = await prisma.employee.findUnique({
                    where: { employeeId: record.employeeId },
                });

                const designation = record.designation || 'WORKER';
                const isEng = designation.toLowerCase().includes('engineer') || designation.toLowerCase().includes('manager') || designation.toLowerCase().includes('officer');

                const employeeData = {
                    employeeId: record.employeeId,
                    name: record.name,
                    designation: designation,
                    mobile: record.mobile || null,
                    shift: record.shift || 'Day shift',
                    isEngineer: isEng,
                    project: extractProjectCode('D657'), // Default project
                    network: record.network || '5001323',
                    activity: record.activity || '0010',
                    element: record.element || '0102',
                };

                if (existing) {
                    // Update existing employee
                    await prisma.employee.update({
                        where: { employeeId: record.employeeId },
                        data: employeeData,
                    });
                    updatedCount++;
                } else {
                    // Create new employee
                    await prisma.employee.create({
                        data: employeeData,
                    });
                    createdCount++;
                }
            } catch (error) {
                console.error('Error processing employee:', error);
                errorCount++;
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
