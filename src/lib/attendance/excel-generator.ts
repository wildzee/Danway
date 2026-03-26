/**
 * Excel Generator
 * Generate SAP-formatted Excel files
 */

import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface SAPExportRow {
    employeeId: string;
    wbsElement: string;
    network: string;
    activity: string;
    element: string;
    aaType: string;
    hours: number;
    name: string;
    designation: string;
    shift: string;
    mobile: string;
    remarks: string;
}

/**
 * Generate SAP Excel file from attendance records
 */
export async function generateSAPExcel(
    records: SAPExportRow[],
    date: Date
): Promise<Buffer> {
    try {
        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Prepare data for sheet
        const sheetData: any[][] = [];

        // Add headers
        sheetData.push([
            'Employee ID',
            'WBS Element',
            'Network',
            'Activity',
            'Element',
            'A/A Type',
            'Hours',
            'Name',
            'Designation',
            'Day shift/ Night Shift',
            'Mobile no.',
            'Remarks',
        ]);

        // Add data rows
        for (const record of records) {
            sheetData.push([
                record.employeeId,
                record.wbsElement || '',
                record.network,
                record.activity,
                record.element,
                record.aaType,
                record.hours,
                record.name,
                record.designation,
                record.shift,
                record.mobile || '',
                record.remarks || '',
            ]);
        }

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 12 }, // Employee ID
            { wch: 12 }, // WBS Element
            { wch: 10 }, // Network
            { wch: 10 }, // Activity
            { wch: 10 }, // Element
            { wch: 10 }, // A/A Type
            { wch: 8 },  // Hours
            { wch: 25 }, // Name
            { wch: 20 }, // Designation
            { wch: 15 }, // Shift
            { wch: 15 }, // Mobile
            { wch: 20 }, // Remarks
        ];

        // Add worksheet to workbook
        const sheetName = `SAP Attendance-D657`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Add empty CODE sheet (placeholder)
        const codeSheet = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, codeSheet, 'CODE-');

        // Generate buffer
        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
        });

        return buffer;
    } catch (error) {
        console.error('Error generating SAP Excel:', error);
        throw new Error(`Failed to generate SAP Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generate filename for SAP export
 */
export function generateSAPFilename(date: Date): string {
    const dateStr = format(date, 'dd-MM-yyyy');
    return `D657-SAP-Attendance-${dateStr}.xlsx`;
}
