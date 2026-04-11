import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { parsePunchReport } from "@/lib/attendance/excel-parser";
import { requireSession } from "@/lib/auth/api-auth";

export async function POST(request: NextRequest) {
  const result = await requireSession(request);
  if (result instanceof NextResponse) return result;
  const { session } = result;

  try {
    const { blobUrl, fileName } = await request.json();

    if (!blobUrl || !fileName) {
      return NextResponse.json(
        { success: false, error: "blobUrl and fileName are required" },
        { status: 400 }
      );
    }

    // Download file from Vercel Blob
    const blobRes = await fetch(blobUrl);
    if (!blobRes.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to download file from storage" },
        { status: 500 }
      );
    }
    const buffer = Buffer.from(await blobRes.arrayBuffer());

    // Delete the blob now that we have the buffer (fire and forget)
    del(blobUrl).catch(() => {});

    // Parse Excel file
    const { records: punchRecords, metrics } = await parsePunchReport(buffer);

    // Create import batch
    const batch = await prisma.importBatch.create({
      data: {
        fileName,
        recordCount: punchRecords.length,
        status: "processing",
      },
    });

    // Filter out records with no punch data
    const validRecords = punchRecords.filter((r) => r.punchIn || r.punchOut);

    if (validRecords.length === 0) {
      await prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: "completed", recordCount: 0 },
      });
      return NextResponse.json({
        success: true,
        message: "Punch report processed successfully",
        data: {
          batchId: batch.id,
          totalRecords: punchRecords.length,
          processedCount: 0,
          errorCount: 0,
          skippedEmployees: 0,
          skippedEmployeeIds: [],
          dateRange: { start: null, end: null },
          metrics: {
            totalRowsInFile: metrics.totalRows,
            validRowsParsed: metrics.validRows,
            invalidRowsSkipped: metrics.invalidRows,
          },
        },
      });
    }

    // Collect unique userIds and date range
    const allUserIds = [...new Set(validRecords.map((r) => r.userId))];
    let minDate: Date = validRecords[0].processDate;
    let maxDate: Date = validRecords[0].processDate;
    for (const r of validRecords) {
      if (r.processDate < minDate) minDate = r.processDate;
      if (r.processDate > maxDate) maxDate = r.processDate;
    }

    // Bulk-fetch employees (scoped to site)
    const siteFilter = session.siteId ? { siteId: session.siteId } : {};
    const [employees, hiredEmployees] = await Promise.all([
      prisma.employee.findMany({ where: { employeeId: { in: allUserIds }, ...siteFilter } }),
      prisma.hiredEmployee.findMany({ where: { employeeId: { in: allUserIds }, ...siteFilter } }),
    ]);

    const employeeMap = new Map(employees.map((e) => [e.employeeId, e]));
    const hiredEmployeeMap = new Map(hiredEmployees.map((e) => [e.employeeId, e]));

    const employeeIds = employees.map((e) => e.id);
    const hiredEmployeeIds = hiredEmployees.map((e) => e.id);

    // Bulk-fetch existing punch records for the date range
    const existingPunches = await prisma.punchRecord.findMany({
      where: {
        date: { gte: minDate, lte: maxDate },
        OR: [
          ...(employeeIds.length > 0 ? [{ employeeId: { in: employeeIds } }] : []),
          ...(hiredEmployeeIds.length > 0 ? [{ hiredEmployeeId: { in: hiredEmployeeIds } }] : []),
        ],
      },
      select: {
        id: true,
        employeeId: true,
        hiredEmployeeId: true,
        date: true,
        punchIn: true,
        punchOut: true,
        workTime: true,
        status: true,
      },
    });

    const existingPunchMap = new Map<string, (typeof existingPunches)[0]>();
    for (const p of existingPunches) {
      const dateStr = p.date.toISOString().split("T")[0];
      const internalId = p.employeeId ?? p.hiredEmployeeId ?? "";
      existingPunchMap.set(`${internalId}-${dateStr}`, p);
    }

    // Categorise records into creates and updates
    const toCreate: any[] = [];
    const toUpdate: Array<{ id: string; data: any }> = [];
    const skippedEmployees: string[] = [];
    let errorCount = 0;

    for (const record of validRecords) {
      const employee = employeeMap.get(record.userId) ?? null;
      const hiredEmployee = !employee ? (hiredEmployeeMap.get(record.userId) ?? null) : null;

      if (!employee && !hiredEmployee) {
        if (!skippedEmployees.includes(record.userId)) skippedEmployees.push(record.userId);
        errorCount++;
        continue;
      }

      const internalId = employee ? employee.id : hiredEmployee!.id;
      const dateStr = record.processDate.toISOString().split("T")[0];
      const key = `${internalId}-${dateStr}`;
      const existing = existingPunchMap.get(key);

      if (existing) {
        toUpdate.push({
          id: existing.id,
          data: {
            punchIn: record.punchIn || existing.punchIn,
            punchOut: record.punchOut || existing.punchOut,
            workTime: record.workTime !== "00:00" ? record.workTime : existing.workTime,
            status:
              record.status !== "AB" && record.status !== "Missing"
                ? record.status
                : existing.status,
            importBatchId: batch.id,
          },
        });
      } else {
        toCreate.push({
          employeeId: employee?.id ?? null,
          hiredEmployeeId: hiredEmployee?.id ?? null,
          date: record.processDate,
          punchIn: record.punchIn,
          punchOut: record.punchOut,
          workTime: record.workTime,
          status: record.status,
          importBatchId: batch.id,
        });
      }
    }

    // Execute all DB writes
    const updatePromises = toUpdate.map((u) =>
      prisma.punchRecord.update({ where: { id: u.id }, data: u.data })
    );

    await Promise.all([
      toCreate.length > 0 ? prisma.punchRecord.createMany({ data: toCreate }) : Promise.resolve(),
      ...updatePromises,
    ]);

    const processedCount = toCreate.length + toUpdate.length;

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: "completed", recordCount: processedCount },
    });

    return NextResponse.json({
      success: true,
      message: "Punch report processed successfully",
      data: {
        batchId: batch.id,
        totalRecords: punchRecords.length,
        processedCount,
        errorCount,
        skippedEmployees: skippedEmployees.length,
        skippedEmployeeIds: skippedEmployees,
        dateRange: {
          start: minDate ? minDate.toISOString().split("T")[0] : null,
          end: maxDate ? maxDate.toISOString().split("T")[0] : null,
        },
        metrics: {
          totalRowsInFile: metrics.totalRows,
          validRowsParsed: metrics.validRows,
          invalidRowsSkipped: metrics.invalidRows,
        },
      },
    });
  } catch (error) {
    console.error("Error processing punch report:", error);
    return NextResponse.json(
      {
        error: "Failed to process punch report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
