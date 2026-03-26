import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parsePunchReport } from '@/lib/attendance/excel-parser';
// Force TS server reload
export async function POST(request: NextRequest) {
    try {
        // Get uploaded file
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Parse Excel file
        const buffer = Buffer.from(await file.arrayBuffer());

        // Parse punch report
        const { records: punchRecords, metrics } = await parsePunchReport(buffer);

        // Create import batch
        const batch = await prisma.importBatch.create({
            data: {
                fileName: file.name,
                recordCount: punchRecords.length,
                status: 'processing',
            },
        });

        let processedCount = 0;
        let errorCount = 0;
        const skippedEmployees: string[] = [];
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        // Process each punch record
        for (const record of punchRecords) {
            try {
                // Skip records that have no punch data at all
                if (!record.punchIn && !record.punchOut) {
                    continue;
                }

                // Update date range
                if (!minDate || record.processDate < minDate) minDate = record.processDate;
                if (!maxDate || record.processDate > maxDate) maxDate = record.processDate;

                // Find employee (must exist in master data or hired employees)
                const employee = await prisma.employee.findUnique({
                    where: { employeeId: record.userId },
                });

                let hiredEmployee = null;
                if (!employee) {
                    hiredEmployee = await prisma.hiredEmployee.findUnique({
                        where: { employeeId: record.userId },
                    });
                }

                if (!employee && !hiredEmployee) {
                    // Skip if employee not found in either master data or hired employees
                    if (!skippedEmployees.includes(record.userId)) {
                        skippedEmployees.push(record.userId);
                    }
                    errorCount++;
                    continue;
                }

                // Save punch record only (no attendance calculation here)
                await prisma.punchRecord.create({
                    data: {
                        employeeId: employee ? employee.id : undefined,
                        hiredEmployeeId: hiredEmployee ? hiredEmployee.id : undefined,
                        date: record.processDate,
                        punchIn: record.punchIn,
                        punchOut: record.punchOut,
                        workTime: record.workTime,
                        status: record.status,
                        importBatchId: batch.id,
                    },
                });

                processedCount++;
            } catch (error) {
                console.error('Error processing record:', error);
                errorCount++;
            }
        }

        // Update batch status
        await prisma.importBatch.update({
            where: { id: batch.id },
            data: {
                status: 'completed',
                recordCount: processedCount,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Punch report processed successfully',
            data: {
                batchId: batch.id,
                totalRecords: punchRecords.length,
                processedCount,
                errorCount,
                skippedEmployees: skippedEmployees.length,
                skippedEmployeeIds: skippedEmployees,
                dateRange: {
                    start: minDate ? minDate.toISOString().split('T')[0] : null,
                    end: maxDate ? maxDate.toISOString().split('T')[0] : null,
                },
                metrics: {
                    totalRowsInFile: metrics.totalRows,
                    validRowsParsed: metrics.validRows,
                    invalidRowsSkipped: metrics.invalidRows
                }
            },
        });
    } catch (error) {
        console.error('Error processing punch report:', error);
        return NextResponse.json(
            {
                error: 'Failed to process punch report',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
