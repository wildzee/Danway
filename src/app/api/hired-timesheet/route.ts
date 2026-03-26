import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
}

/**
 * Calculate the difference in decimal hours between two time strings (HH:mm or HH:mm:ss).
 */
function calcTimeDiffHours(punchIn: string, punchOut: string): number {
    const [inH, inM] = punchIn.split(':').map(Number);
    const [outH, outM] = punchOut.split(':').map(Number);
    if (isNaN(inH) || isNaN(outH)) return 0;
    const inMinutes = inH * 60 + (inM || 0);
    const outMinutes = outH * 60 + (outM || 0);
    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60; // crosses midnight
    return diff / 60;
}

/**
 * Round hours to the nearest 0.5 using the rule:
 *   0–24 min → .0   (e.g. 5h24m → 5)
 *   25–49 min → .5   (e.g. 5h30m → 5.5, 5h49m → 5.5)
 *   50–59 min → +1   (e.g. 5h51m → 6)
 */
function roundHalfHour(decimalHours: number): number {
    const wholeHours = Math.floor(decimalHours);
    const minutesPart = Math.round((decimalHours - wholeHours) * 60);
    if (minutesPart >= 50) return wholeHours + 1;
    if (minutesPart >= 25) return wholeHours + 0.5;
    return wholeHours;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');
        const monthStr = searchParams.get('month'); // format: YYYY-MM

        if (!vendorId || !monthStr) {
            return NextResponse.json({ error: "vendorId and month are required" }, { status: 400 });
        }

        const [year, month] = monthStr.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // 1. Fetch global settings for lunch deduction & Ramadan config
        const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
        const lunchDeduction = settings?.lunchHours ?? 1.0;
        const ramadanLunchDeduction = settings?.ramadanLunchHours ?? 0.5;
        const ramadanActive = settings?.ramadanActive ?? false;
        const ramadanStart = settings?.ramadanStart ? new Date(settings.ramadanStart) : null;
        const ramadanEnd = settings?.ramadanEnd ? new Date(settings.ramadanEnd) : null;
        const siteStartTime = (settings as any)?.siteStartTime ?? null;

        // 2. Fetch Hired Employees for this vendor
        const hiredEmployees = await prisma.hiredEmployee.findMany({
            where: { vendorId },
            orderBy: { name: 'asc' }
        });

        const employeeIds = hiredEmployees.map(e => e.id);

        // 3. Fetch existing HiredTimesheet records (manual overrides)
        const timesheetRecords = await prisma.hiredTimesheet.findMany({
            where: {
                hiredEmployeeId: { in: employeeIds },
                date: { gte: startDate, lte: endDate }
            }
        });

        // 4. Fetch PunchRecords for auto-calculation
        const punchRecords = await prisma.punchRecord.findMany({
            where: {
                hiredEmployeeId: { in: employeeIds },
                date: { gte: startDate, lte: endDate }
            }
        });

        const daysInMonth = getDaysInMonth(year, month);

        // Helper: check if a date falls within Ramadan period
        function isRamadanDay(d: Date): boolean {
            if (!ramadanActive || !ramadanStart || !ramadanEnd) return false;
            const dayOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const rStart = new Date(ramadanStart.getFullYear(), ramadanStart.getMonth(), ramadanStart.getDate());
            const rEnd = new Date(ramadanEnd.getFullYear(), ramadanEnd.getMonth(), ramadanEnd.getDate());
            return dayOnly >= rStart && dayOnly <= rEnd;
        }

        // Helper: cap punchIn time based on site start time
        function getEffectivePunchIn(actualPunchIn: string): string {
            if (!siteStartTime) return actualPunchIn;

            const [actualH, actualM] = actualPunchIn.split(':').map(Number);
            const [siteH, siteM] = siteStartTime.split(':').map(Number);

            if (actualH < siteH || (actualH === siteH && actualM < siteM)) {
                return siteStartTime; // Force start time instead of early punch
            }
            return actualPunchIn;
        }

        // 5. Build the final data structure
        const data = hiredEmployees.map(emp => {
            const records: Record<number, { hours: number | string | null, status: string }> = {};

            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(year, month - 1, day);
                const isSunday = currentDate.getDay() === 0;
                const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                // Priority 1: Sunday → blank/holiday
                if (isSunday) {
                    // Check if there's a manual override even on Sunday (user might have entered hours)
                    const tsRecord = timesheetRecords.find((t: any) =>
                        t.hiredEmployeeId === emp.id &&
                        `${t.date.getUTCFullYear()}-${String(t.date.getUTCMonth() + 1).padStart(2, '0')}-${String(t.date.getUTCDate()).padStart(2, '0')}` === dateString
                    );
                    if (tsRecord && tsRecord.status !== "present") {
                        // User explicitly set something on Sunday
                        records[day] = {
                            hours: tsRecord.status === "absent" ? "A" : (tsRecord.status === "holiday" ? "H" : tsRecord.hours),
                            status: tsRecord.status
                        };
                    } else {
                        records[day] = { hours: null, status: "holiday" };
                    }
                    continue;
                }

                // Priority 2: Check for manual override in HiredTimesheet table
                const tsRecord = timesheetRecords.find((t: any) =>
                    t.hiredEmployeeId === emp.id &&
                    `${t.date.getUTCFullYear()}-${String(t.date.getUTCMonth() + 1).padStart(2, '0')}-${String(t.date.getUTCDate()).padStart(2, '0')}` === dateString
                );

                if (tsRecord) {
                    records[day] = {
                        hours: tsRecord.status === "absent" ? "A" : (tsRecord.status === "holiday" ? "H" : tsRecord.hours),
                        status: tsRecord.status
                    };
                    continue;
                }

                // Priority 3: Auto-calculate from punch records
                const pRecords = punchRecords.filter((p: any) =>
                    p.hiredEmployeeId === emp.id &&
                    `${p.date.getUTCFullYear()}-${String(p.date.getUTCMonth() + 1).padStart(2, '0')}-${String(p.date.getUTCDate()).padStart(2, '0')}` === dateString
                );

                if (pRecords.length > 0) {
                    const validPunch = pRecords.find((p: any) => p.punchIn && p.punchOut);
                    if (validPunch) {
                        // Cap early punch-ins based on site start time
                        const effectivePunchIn = getEffectivePunchIn(validPunch.punchIn!);

                        // Calculate actual hours worked
                        const grossHours = calcTimeDiffHours(effectivePunchIn, validPunch.punchOut!);

                        // Determine lunch deduction — skip if employee left before 1 PM (no lunch break taken)
                        const punchOutHour = parseInt(validPunch.punchOut!.split(':')[0]);
                        const leftBeforeLunch = punchOutHour < 13;
                        const baseLunch = isRamadanDay(currentDate) ? ramadanLunchDeduction : lunchDeduction;
                        const lunch = leftBeforeLunch ? 0 : baseLunch;
                        const netHours = Math.max(0, grossHours - lunch);
                        // Round to nearest 0.5 using the custom rule
                        const roundedHours = roundHalfHour(netHours);
                        records[day] = { hours: roundedHours, status: "present" };
                    } else {
                        // Missing punchIn or punchOut → missed punch
                        records[day] = { hours: 5, status: "missed_punch" };
                    }
                } else {
                    // Priority 4: No punch, no override → Absent
                    records[day] = { hours: "A", status: "absent" };
                }
            }

            return {
                id: emp.id,
                employeeId: emp.employeeId,
                name: emp.name,
                designation: emp.designation,
                shift: emp.shift,
                records
            };
        });

        return NextResponse.json({ data });

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to fetch timesheet data", details: errorMsg },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { hiredEmployeeId, date, hours, status } = data; // date should be YYYY-MM-DD string

        if (!hiredEmployeeId || !date) {
            return NextResponse.json(
                { error: "hiredEmployeeId and date are required" },
                { status: 400 }
            );
        }

        // Parse local date explicitly avoiding UTC shift bounds
        const [year, month, day] = date.split('-').map(Number);
        const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        let parsedHours: number | null = null;
        let actualStatus = status || "present";

        if (hours !== null && hours !== undefined && hours !== "") {
            const strHours = String(hours).trim().toUpperCase();
            if (strHours === "A") {
                actualStatus = "absent";
            } else if (strHours === "H") {
                actualStatus = "holiday";
            } else {
                const parsed = parseFloat(strHours);
                if (!isNaN(parsed)) {
                    parsedHours = parsed;
                    if (parsedHours === 5 && !status) {
                        actualStatus = "missed_punch";
                    }
                } else {
                    // Non-numeric invalid input defaults to clearing the cell
                    parsedHours = null;
                }
            }
        }

        const record = await prisma.hiredTimesheet.upsert({
            where: {
                hiredEmployeeId_date: {
                    hiredEmployeeId,
                    date: targetDate
                }
            },
            update: {
                hours: parsedHours,
                status: actualStatus,
            },
            create: {
                hiredEmployeeId,
                date: targetDate,
                hours: parsedHours,
                status: actualStatus,
            }
        });

        return NextResponse.json({ data: record });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to update timesheet", details: errorMsg },
            { status: 500 }
        );
    }
}
