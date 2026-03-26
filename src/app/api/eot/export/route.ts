import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");
        const date = searchParams.get("date"); // YYYY-MM-DD

        let startOfDay, endOfDay;
        let filenameDate = "";

        if (startDateParam && endDateParam && /^\d{4}-\d{2}-\d{2}$/.test(startDateParam) && /^\d{4}-\d{2}-\d{2}$/.test(endDateParam)) {
            const [sYear, sMonth, sDay] = startDateParam.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDateParam.split('-').map(Number);
            startOfDay = new Date(Date.UTC(sYear, sMonth - 1, sDay, 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(eYear, eMonth - 1, eDay, 23, 59, 59, 999));
            filenameDate = `${startDateParam}_to_${endDateParam}`;
        } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [year, month, day] = date.split('-').map(Number);
            startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            filenameDate = date;
        } else {
            return NextResponse.json(
                { success: false, error: "Date or date range is required" },
                { status: 400 }
            );
        }

        // Fetch attendance records that are EOT and APPROVED
        const records = await prisma.attendanceRecord.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                aaType: "EOT",
                needsReview: false // ONLY APPROVED
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
            "Date",
            "Employee ID",
            "WBS Element",
            "Network",
            "Activity",
            "Element",
            "A/A Type",
            "Hours",
            "Name",
            "Designation",
            "Remarks"
        ];

        // Map to Excel format
        const excelData = records.map(record => ({
            "Date": record.date.toISOString().split('T')[0],
            "Employee ID": record.employee.employeeId,
            "WBS Element": "",
            "Network": record.network,
            "Activity": record.activity,
            "Element": record.element,
            "A/A Type": "0801", // Convert EOT back to 0801 for Excel
            "Hours": record.hours,
            "Name": record.employee.name,
            "Designation": record.employee.designation,
            "Remarks": record.remarks || ""
        }));

        // Create workbook and worksheet with explicit header order
        const worksheet = XLSX.utils.json_to_sheet(excelData, { header });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "EOT");

        // Generate buffer
        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        // Return as download
        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="D657-SAP EOT-${filenameDate}.xlsx"`,
                "Cache-Control": "no-store, max-age=0",
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
