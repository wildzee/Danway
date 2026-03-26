
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get("date"); // YYYY-MM-DD

        if (!date) {
            return NextResponse.json(
                { success: false, error: "Date is required" },
                { status: 400 }
            );
        }

        // Parse date for query
        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        // Fetch attendance records
        const records = await prisma.attendanceRecord.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                employee: true,
            },
            orderBy: {
                employee: {
                    employeeId: 'asc',
                },
            },
        });

        // Define Headers
        const header = [
            "Employee ID",
            "WBS Element",
            "Network",
            "Activity",
            "Element",
            "A/A Type",
            "Hours",
            "Name",
            "Designation",
            "Day shift/ Night Shift",
            "Mobile no.",
            "Remarks"
        ];

        // Map to Excel format
        const excelData = records.map(record => ({
            "Employee ID": record.employee.employeeId,
            "WBS Element": "",
            "Network": record.network,
            "Activity": record.activity,
            "Element": record.element,
            "A/A Type": record.aaType,
            "Hours": record.hours,
            "Name": record.employee.name,
            "Designation": record.employee.designation,
            "Day shift/ Night Shift": record.shift,
            "Mobile no.": record.employee.mobile || "",
            "Remarks": record.remarks || ""
        }));

        // Create workbook and worksheet with explicit header order
        const worksheet = XLSX.utils.json_to_sheet(excelData, { header });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

        // Generate buffer
        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        // Return as download
        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="D657-SAP Attendance-${date}.xlsx"`,
            },
        });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to export data" },
            { status: 500 }
        );
    }
}
