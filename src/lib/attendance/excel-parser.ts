/**
 * Excel Parser
 * Parse punch reports and SAP files
 */

import * as XLSX from 'xlsx';

export interface PunchReportRow {
    userId: string;
    userName: string;
    processDate: Date;
    project: string;
    branch: string;
    department: string;
    punchIn: string | null;
    punchOut: string | null;
    workTime: string;
    lateIn: string;
    status: string;
}

export interface SAPEmployeeRow {
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
 * Parse punch report Excel file
 */
export async function parsePunchReport(
    fileBuffer: Buffer
): Promise<{ records: PunchReportRow[], metrics: any }> {
    try {
        const workbook = XLSX.read(fileBuffer, {
            type: 'buffer',
            cellFormula: false,
            cellHTML: false,
            cellNF: false,
            sheetStubs: false,
            dense: true,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with raw strings to avoid date parsing issues
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        const records: PunchReportRow[] = [];
        let totalRows = rawData.length;
        let validRows = 0;
        let invalidRows = 0;

        for (const row of rawData) {
            // Flexible column mapping
            const userId = row['UserID'] || row['User ID'] || row['ID'];
            const dateStr = row['ProcessDate'] || row['Date'] || row['Process Date'];

            // Validation
            if (!userId || !dateStr) {
                invalidRows++;
                continue;
            }

            // Parse date
            let processDate: Date;
            // Handle DD/MM/YYYY text format (common in CSV/Excel text)
            if (typeof dateStr === 'string' && dateStr.includes('/')) {
                const parts = dateStr.trim().split('/');
                if (parts.length === 3) {
                    processDate = new Date(Date.UTC(
                        parseInt(parts[2]),
                        parseInt(parts[1]) - 1,
                        parseInt(parts[0])
                    ));
                } else {
                    invalidRows++;
                    continue;
                }
            } else if (!isNaN(Date.parse(dateStr))) {
                // ISO or other valid string
                processDate = new Date(dateStr);
            } else {
                invalidRows++;
                continue; // Skip invalid dates
            }

            records.push({
                userId: String(userId).trim(),
                userName: String(row['UserName'] || '').trim(),
                processDate,
                project: String(row['PROJECT'] || '').trim(),
                branch: String(row['BRANCH'] || '').trim(),
                department: String(row['Department'] || '').trim(),
                punchIn: row['PUNCH IN'] ? String(row['PUNCH IN']).trim() : null,
                punchOut: row['PUNCH OUT'] ? String(row['PUNCH OUT']).trim() : null,
                workTime: String(row['Work Time'] || '00:00').trim(),
                lateIn: String(row['LATE -IN'] || '00:00').trim(),
                status: String(row['Status'] || 'AB').trim(),
            });
            validRows++;
        }

        return {
            records,
            metrics: {
                totalRows,
                validRows,
                invalidRows,
            }
        };
    } catch (error) {
        console.error('Error parsing punch report:', error);
        throw new Error(`Failed to parse punch report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Parse SAP attendance file to import employees
 */
export async function parseSAPAttendanceFile(
    fileBuffer: Buffer
): Promise<SAPEmployeeRow[]> {
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // Find the SAP Attendance sheet
        let sheetName = workbook.SheetNames.find(name =>
            name.toLowerCase().includes('sap') || name.toLowerCase().includes('attendance')
        );

        if (!sheetName) {
            sheetName = workbook.SheetNames[0];
        }

        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const records: SAPEmployeeRow[] = [];

        for (const row of rawData) {
            records.push({
                employeeId: String(row['Employee ID'] || '').trim(),
                wbsElement: String(row['WBS Element'] || '').trim(),
                network: String(row['Network'] || '').trim(),
                activity: String(row['Activity'] || '').trim(),
                element: String(row['Element'] || '').trim(),
                aaType: String(row['A/A Type'] || '').trim(),
                hours: parseFloat(row['Hours'] || 0),
                name: String(row['Name'] || '').trim(),
                designation: String(row['Designation'] || '').trim(),
                shift: String(row['Day shift/ Night Shift'] || 'Day shift').trim(),
                mobile: String(row['Mobile no.'] || '').trim(),
                remarks: String(row['Remarks'] || '').trim(),
            });
        }

        return records;
    } catch (error) {
        console.error('Error parsing SAP file:', error);
        throw new Error(`Failed to parse SAP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Parse SAP CODE sheet for designation mappings
 */
export async function parseSAPCodeSheet(
    fileBuffer: Buffer
): Promise<Array<{
    designation: string;
    network: string;
    activity: string;
    element: string;
}>> {
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // Find the CODE sheet
        let sheetName = workbook.SheetNames.find(name =>
            name.toLowerCase().includes('code')
        );

        if (!sheetName) {
            throw new Error('CODE sheet not found in Excel file');
        }

        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const mappings: Array<{
            designation: string;
            network: string;
            activity: string;
            element: string;
        }> = [];

        // Parse the data (assuming format: Designation, Network Activity Element)
        for (const row of rawData) {
            if (!row[0] || !row[1]) continue; // Skip empty rows

            const designation = String(row[0]).trim();
            const codes = String(row[1]).trim().split(' ');

            if (codes.length >= 3) {
                mappings.push({
                    designation,
                    network: codes[0],
                    activity: codes[1],
                    element: codes[2],
                });
            }
        }

        return mappings;
    } catch (error) {
        console.error('Error parsing CODE sheet:', error);
        throw new Error(`Failed to parse CODE sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
