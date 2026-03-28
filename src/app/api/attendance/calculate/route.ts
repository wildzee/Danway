import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const calculateSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().nullable(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().nullable(),
});

// Helper: Determine shift based on punch range
function determineShift(punchInTime: string, punchOutTime?: string | null): string {
    const startHour = parseInt(punchInTime.split(':')[0]);

    // Base shift from start time
    // 5:00 AM to 5:00 PM = Day shift
    const isDayStart = startHour >= 5 && startHour < 17;

    if (punchOutTime) {
        const endHour = parseInt(punchOutTime.split(':')[0]);
        // Day&Night only if a Day-starting shift works past midnight (0-4 AM)
        // OR if a Night-starting shift extends well into the day (8 AM+)
        if (isDayStart && endHour < 5) {
            return "Day&Night"; // Worked past midnight
        }
        if (!isDayStart && endHour >= 8 && endHour < 17) {
            return "Day&Night";
        }
    }

    return isDayStart ? "Day shift" : "Night shift";
}

interface AttendanceSettings {
    lunchHours: number;
    isRamadan: boolean;
    ramadanBonus: number;
    ramadanLunchHours: number;
    siteStartTime: string | null;
}

// Helper: Calculate time difference in hours, capping early arrivals to site start time
function calculateHours(punchIn: string, punchOut: string, siteStartTime: string | null = null, isStitched: boolean = false): number {
    let effectivePunchIn = punchIn;

    if (siteStartTime) {
        const [actualH, actualM] = punchIn.split(':').map(Number);
        const [siteH, siteM] = siteStartTime.split(':').map(Number);

        if (actualH < siteH || (actualH === siteH && actualM < siteM)) {
            effectivePunchIn = siteStartTime;
        }
    }

    const [inH, inM] = effectivePunchIn.split(':').map(Number);
    const [outH, outM] = punchOut.split(':').map(Number);

    let hours = outH - inH;
    let minutes = outM - inM;

    if (minutes < 0) {
        hours -= 1;
        minutes += 60;
    }

    // Handle midnight crossing (night shift)
    if (hours < 0) {
        hours += 24;
    } else if (isStitched) { // Next day stitched!
        hours += 24;
    }

    return hours + (minutes / 60);
}

// Helper: Round hours based on minutes
// 0-24 mins -> 0.0
// 25-49 mins -> 0.5
// 50-59 mins -> 1.0
function roundWorkedHours(decimalHours: number): number {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    let fractionalPart = 0;
    if (minutes >= 50) {
        fractionalPart = 1.0;
    } else if (minutes >= 25) {
        fractionalPart = 0.5;
    } else {
        fractionalPart = 0.0;
    }

    return hours + fractionalPart;
}

// Helper: Calculate attendance for a punch record
function calculateAttendance(
    punchRecord: any,
    nextDayPunch: any | null,
    employee: any,
    settings: AttendanceSettings = { lunchHours: 1, isRamadan: false, ramadanBonus: 2, ramadanLunchHours: 0.5, siteStartTime: null },
    consumedPunches?: Set<string>
) {
    const records = [];
    const { lunchHours, isRamadan, ramadanBonus, ramadanLunchHours, siteStartTime } = settings;
    const effectiveLunchHours = isRamadan ? ramadanLunchHours : lunchHours;

    // --- NIGHT SHIFT STITCHING LOGIC ---
    let effectivePunchIn = punchRecord.punchIn;
    let effectivePunchOut = punchRecord.punchOut;
    let isStitched = false;

    // If missing Out on Day 1, check Day 2
    if (effectivePunchIn && !effectivePunchOut && nextDayPunch) {
        let candidateOut = null;
        
        if (nextDayPunch.punchIn) {
            const nextInHour = parseInt(nextDayPunch.punchIn.split(':')[0]);
            // Only steal the next day's punchIn if it's early (before 12) AND the next day doesn't have its own punchOut.
            // If nextDayPunch has BOTH in and out, the 'in' is almost certainly their arrival for the new day's shift!
            if (nextInHour < 12 && !nextDayPunch.punchOut) {
                candidateOut = nextDayPunch.punchIn;
            }
        } else if (nextDayPunch.punchOut) {
            const nextOutHour = parseInt(nextDayPunch.punchOut.split(':')[0]);
            if (nextOutHour < 12) {
                candidateOut = nextDayPunch.punchOut;
            }
        }

        if (candidateOut) {
            effectivePunchOut = candidateOut;
            isStitched = true;
            if (consumedPunches && nextDayPunch?.id) {
                consumedPunches.add(nextDayPunch.id); // Mark the next day's punch as consumed so it isn't processed again
            }
        }
    }

    // Case 1 & Stitched Logic: Has both punch in and out
    if (effectivePunchIn && effectivePunchOut) {
        const isSunday = new Date(punchRecord.date).getDay() === 0;
        const grossHours = calculateHours(effectivePunchIn, effectivePunchOut, siteStartTime, isStitched);

        const shift = determineShift(effectivePunchIn, effectivePunchOut);

        // Calculate shift-specific deductions
        // Day shift: uses configured effectiveLunchHours (e.g. 0.5 or 1.0)
        // Night shift: strictly 1.0 hour always
        // Day & Night (continuous): deducts both configured Day lunch AND 1.0 Night lunch
        let totalDeduction = 0;
        if (shift === "Day shift") {
            totalDeduction = effectiveLunchHours;
        } else if (shift === "Night shift") {
            totalDeduction = 1.0;
        } else if (shift === "Day&Night") {
            totalDeduction = effectiveLunchHours + 1.0;
        }

        // Sunday: No lunch deduction. Other days: Deduct the calculated lunch hours.
        let rawNetHours = isSunday ? grossHours : (grossHours - totalDeduction);

        // Apply rounding rules to Net Hours
        const netHours = roundWorkedHours(rawNetHours);

        // Check for late arrival (after 12 PM)
        const punchInHour = parseInt(effectivePunchIn.split(':')[0]);
        const isLateArrival = punchInHour >= 12;

        let normalHours = 0;
        let otHours = 0;
        let eotHours = 0;
        let remarks: string | null = isStitched ? "Night shift (stitched with next day)" : null;

        if (isStitched && grossHours >= 16 && nextDayPunch) {
            // It's a 24-hour continuous shift! 
            // We must split the Net Hours across Day 1 and Day 2 correctly.
            const nextDate = new Date(punchRecord.date);
            nextDate.setDate(nextDate.getDate() + 1);
            const isSunday1 = isSunday;
            const isSunday2 = nextDate.getDay() === 0;

            // Day 1 can take a maximum of 10 Net Hours (8 Normal + 2 OT). 
            // Exception: If Day 1 is Sunday, all 10 hours go to EOT.
            let day1Net = Math.min(10, netHours);
            let day2Net = Math.max(0, netHours - day1Net);

            // Create Day 1 records
            if (isSunday1 && employee.allowOvertime) {
                records.push({
                    employeeId: employee.id, date: punchRecord.date, network: employee.network, activity: employee.activity, element: employee.element,
                    aaType: "EOT", hours: day1Net, shift: "Day&Night", remarks: "Continuous work (Sunday Day 1)", needsReview: true, reviewReason: "CONTINUOUS_WORK"
                });
            } else {
                const norm1 = Math.min(8, day1Net);
                const ot1 = employee.allowOvertime ? day1Net - norm1 : 0;
                records.push({
                    employeeId: employee.id, date: punchRecord.date, network: employee.network, activity: employee.activity, element: employee.element,
                    aaType: "0600", hours: norm1, shift: "Day&Night", remarks: "Continuous work Day 1", needsReview: true, reviewReason: "CONTINUOUS_WORK"
                });
                if (ot1 > 0) {
                    records.push({
                        employeeId: employee.id, date: punchRecord.date, network: employee.network, activity: employee.activity, element: employee.element,
                        aaType: "0801", hours: ot1, shift: "Day&Night", remarks: "Continuous work Day 1 OT", needsReview: true, reviewReason: "CONTINUOUS_WORK"
                    });
                }
            }

            // Create Day 2 records
            if (day2Net > 0) {
                if (isSunday2 && employee.allowOvertime) {
                    records.push({
                        employeeId: employee.id, date: nextDate, network: employee.network, activity: employee.activity, element: employee.element,
                        aaType: "EOT", hours: day2Net, shift: "Day&Night", remarks: "Continuous work (Sunday Day 2)", needsReview: true, reviewReason: "CONTINUOUS_WORK"
                    });
                } else {
                    const norm2 = Math.min(8, day2Net);
                    const otAndEot2 = day2Net - norm2;
                    const ot2 = employee.allowOvertime ? Math.min(2, otAndEot2) : 0;
                    const eot2 = employee.allowOvertime ? parseFloat((otAndEot2 - ot2).toFixed(2)) : 0;

                    records.push({
                        employeeId: employee.id, date: nextDate, network: employee.network, activity: employee.activity, element: employee.element,
                        aaType: "0600", hours: norm2, shift: "Day&Night", remarks: "Continuous work Day 2", needsReview: true, reviewReason: "CONTINUOUS_WORK"
                    });
                    if (ot2 > 0) {
                        records.push({
                            employeeId: employee.id, date: nextDate, network: employee.network, activity: employee.activity, element: employee.element,
                            aaType: "0801", hours: ot2, shift: "Day&Night", remarks: "Continuous work Day 2 OT", needsReview: true, reviewReason: "CONTINUOUS_WORK"
                        });
                    }
                    if (eot2 > 0) {
                        records.push({
                            employeeId: employee.id, date: nextDate, network: employee.network, activity: employee.activity, element: employee.element,
                            aaType: "EOT", hours: eot2, shift: "Day&Night", remarks: "Extra Overtime Day 2", needsReview: true, reviewReason: "EOT_APPROVAL"
                        });
                    }
                }
            }
        } else {
            // standard stitched or single-day calculation
            if (isSunday && !employee.allowOvertime) {
                normalHours = 8;
                otHours = 0;
                eotHours = 0;
                remarks = remarks ? `${remarks} | Sunday (OT not allowed)` : "Sunday (OT not allowed - capped 8h)";
            } else if (isSunday && employee.allowOvertime) {
                normalHours = 0;
                otHours = 0;
                eotHours = netHours;
                remarks = remarks ? `${remarks} | Sunday Work (All EOT)` : "Sunday Work (All EOT)";
            } else if (netHours < 7.5) {
                normalHours = 4;
                otHours = 0;
                eotHours = 0;
                remarks = "Half day - Less than 7.5 hours";
            } else if (netHours >= 7.5 && netHours <= 8) {
                normalHours = 8;
                otHours = 0;
                eotHours = 0;
            } else {
                normalHours = 8;
                if (employee.allowOvertime) {
                    const totalOvertime = netHours - 8;
                    if (totalOvertime <= 2) {
                        otHours = totalOvertime;
                        eotHours = 0;
                    } else {
                        otHours = 2;
                        eotHours = totalOvertime - 2;
                    }
                } else {
                    otHours = 0;
                    eotHours = 0;
                }
            }

            if (isRamadan && !isSunday) {
                remarks = remarks ? `${remarks} | Ramadan` : "Ramadan";
                if (employee.allowOvertime) {
                    const effectiveTotal = Math.max(8, netHours + ramadanBonus);
                    const otWithBonus = effectiveTotal - 8;
                    otHours = Math.min(2, otWithBonus);
                } else {
                    normalHours = 8;
                    otHours = 0;
                }
            }

            records.push({
                employeeId: employee.id, date: punchRecord.date, network: employee.network, activity: employee.activity, element: employee.element,
                aaType: "0600", hours: normalHours, shift: shift, remarks: remarks, needsReview: false, reviewReason: null
            });

            if (otHours > 0) {
                records.push({
                    employeeId: employee.id, date: punchRecord.date, network: employee.network, activity: employee.activity, element: employee.element,
                    aaType: "0801", hours: parseFloat(otHours.toFixed(2)), shift: shift, remarks: isRamadan ? "Overtime (incl. Ramadan bonus)" : "Overtime", needsReview: false, reviewReason: null
                });
            }

            if (eotHours > 0) {
                records.push({
                    employeeId: employee.id, date: punchRecord.date, network: employee.network, activity: employee.activity, element: employee.element,
                    aaType: "EOT", hours: parseFloat(eotHours.toFixed(2)), shift: shift, remarks: "Extra Overtime", needsReview: true, reviewReason: "EOT_APPROVAL"
                });
            }
        }
    }

    // Case 2: Missing punch out AND could not be stitched
    else if (effectivePunchIn && !effectivePunchOut && nextDayPunch) {
        const nextPunchHour = parseInt(nextDayPunch.punchIn.split(':')[0]);

        if (nextPunchHour < 5) {
            // Continuous work (Day & Night shift) - split into 2 days: 8+2 each
            const isSunday1 = new Date(punchRecord.date).getDay() === 0;
            const norm1 = (isSunday1 && employee.allowOvertime) ? 0 : 8;
            const total1 = 10;
            const ot1 = (isSunday1 && employee.allowOvertime) ? 0 : (!employee.allowOvertime ? 0 : 2);
            const eot1 = (isSunday1 && employee.allowOvertime) ? total1 : 0;

            if (norm1 > 0) {
                records.push({
                    employeeId: employee.id,
                    date: punchRecord.date,
                    network: employee.network,
                    activity: employee.activity,
                    element: employee.element,
                    aaType: "0600",
                    hours: norm1,
                    shift: "Day&Night",
                    remarks: "Continuous work - Day 1",
                    needsReview: true,
                    reviewReason: "CONTINUOUS_WORK",
                });
            }

            if (ot1 > 0) {
                records.push({
                    employeeId: employee.id,
                    date: punchRecord.date,
                    network: employee.network,
                    activity: employee.activity,
                    element: employee.element,
                    aaType: "0801",
                    hours: ot1,
                    shift: "Day&Night",
                    remarks: "Continuous work OT - Day 1",
                    needsReview: true,
                    reviewReason: "CONTINUOUS_WORK",
                });
            }

            if (eot1 > 0) {
                records.push({
                    employeeId: employee.id,
                    date: punchRecord.date,
                    network: employee.network,
                    activity: employee.activity,
                    element: employee.element,
                    aaType: "EOT",
                    hours: eot1,
                    shift: "Day&Night",
                    remarks: "Continuous work EOT - Day 1 (Sunday)",
                    needsReview: true,
                    reviewReason: "EOT_APPROVAL",
                });
            }

            // Day 2 Logic
            const nextDate = new Date(punchRecord.date);
            nextDate.setDate(nextDate.getDate() + 1);

            const isSunday2 = nextDate.getDay() === 0;
            const norm2 = (isSunday2 && employee.allowOvertime) ? 0 : 8;
            const total2 = 10;
            const ot2 = (isSunday2 && employee.allowOvertime) ? 0 : (!employee.allowOvertime ? 0 : 2);
            const eot2 = (isSunday2 && employee.allowOvertime) ? total2 : 0;

            if (norm2 > 0) {
                records.push({
                    employeeId: employee.id,
                    date: nextDate,
                    network: employee.network,
                    activity: employee.activity,
                    element: employee.element,
                    aaType: "0600",
                    hours: norm2,
                    shift: "Day&Night",
                    remarks: "Continuous work - Day 2",
                    needsReview: true,
                    reviewReason: "CONTINUOUS_WORK",
                });
            }

            if (ot2 > 0) {
                records.push({
                    employeeId: employee.id,
                    date: nextDate,
                    network: employee.network,
                    activity: employee.activity,
                    element: employee.element,
                    aaType: "0801",
                    hours: ot2,
                    shift: "Day&Night",
                    remarks: "Continuous work OT - Day 2",
                    needsReview: true,
                    reviewReason: "CONTINUOUS_WORK",
                });
            }

            if (eot2 > 0) {
                records.push({
                    employeeId: employee.id,
                    date: nextDate,
                    network: employee.network,
                    activity: employee.activity,
                    element: employee.element,
                    aaType: "EOT",
                    hours: eot2,
                    shift: "Day&Night",
                    remarks: "Continuous work EOT - Day 2 (Sunday)",
                    needsReview: true,
                    reviewReason: "EOT_APPROVAL",
                });
            }
        } else {
            // Regular full day (assumed 8 hours) - FLAG FOR REVIEW
            records.push({
                employeeId: employee.id,
                date: punchRecord.date,
                network: employee.network,
                activity: employee.activity,
                element: employee.element,
                aaType: "0600",
                hours: 8,
                shift: determineShift(punchRecord.punchIn),
                remarks: "Missing punch out - assumed 8 hours",
                needsReview: true,
                reviewReason: "MISSING_PUNCH_OUT",
            });
        }
    }

    // Case 3: Only punch in, no next day data to stitch - FLAG FOR REVIEW
    else if (effectivePunchIn && !effectivePunchOut) {
        const punchInHour = parseInt(effectivePunchIn.split(':')[0]);
        const isLateArrival = punchInHour >= 12;

        records.push({
            employeeId: employee.id,
            date: punchRecord.date,
            network: employee.network,
            activity: employee.activity,
            element: employee.element,
            aaType: "0600",
            hours: isLateArrival ? 4 : 8,
            shift: determineShift(effectivePunchIn),
            remarks: isLateArrival
                ? "Missing punch out - Late arrival, assumed half day"
                : "Missing punch out - assumed 8 hours",
            needsReview: true,
            reviewReason: "MISSING_PUNCH_OUT",
        });
    }

    // Case 4: Only punch out (missing punch in) - IGNORE

    return records;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = calculateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: "Invalid parameters", details: validation.error.issues }, { status: 400 });
        }

        const { date, startDate, endDate } = validation.data;

        // Fetch global settings
        let dbSettings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
        if (!dbSettings) {
            dbSettings = await prisma.systemSettings.create({ data: { id: "global" } });
        }

        // Fetch public holidays and build a lookup Map keyed by "YYYY-MM-DD"
        const publicHolidaysRaw = await prisma.publicHoliday.findMany();
        const holidayMap = new Map<string, string>(); // date string -> holiday name
        for (const h of publicHolidaysRaw) {
            // Normalize to YYYY-MM-DD (date was saved at noon UTC)
            const dateStr = h.date.toISOString().split('T')[0];
            holidayMap.set(dateStr, h.name);
        }

        let startPeriod: Date, endPeriod: Date;

        if (startDate && endDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            const [sY, sM, sD] = startDate.split('-').map(Number);
            startPeriod = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0, 0));

            const [eY, eM, eD] = endDate.split('-').map(Number);
            endPeriod = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999));
        } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [year, month, day] = date.split('-').map(Number);
            startPeriod = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            endPeriod = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        } else {
            const now = new Date();
            startPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
            endPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        }

        // Determine fetch range (need next day for midnight crossing check)
        const fetchEnd = new Date(endPeriod);
        fetchEnd.setDate(fetchEnd.getDate() + 1);

        // Get all punch records for the range + 1 day
        const allPunches = await prisma.punchRecord.findMany({
            where: {
                date: {
                    gte: startPeriod,
                    lte: fetchEnd,
                },
            },
            include: {
                employee: true,
            },
        });

        // Organize punches by employee and date for fast lookup
        const punchesMap = new Map<string, any>();
        for (const p of allPunches) {
            const key = `${p.employeeId}-${p.date.toISOString().split('T')[0]}`;
            punchesMap.set(key, p);
        }

        const attendanceRecords = [];

        // Filter: only Danway employees (exclude Hired employees)
        const punchesToProcess = allPunches.filter(p =>
            p.date.getTime() <= endPeriod.getTime() &&
            p.employeeId !== null &&
            p.employee !== null
        );

        const consumedPunches = new Set<string>();

        for (const punch of punchesToProcess) {
            if (consumedPunches.has(punch.id)) continue;

            const nextDate = new Date(punch.date);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];
            const key = `${punch.employeeId}-${nextDateStr}`;
            const nextDayPunch = punchesMap.get(key);

            // Pass nextDayPunch object directly without prematurely strict checking
            const validNextDayPunch = nextDayPunch ? nextDayPunch : null;

            // Check if this date falls in the Ramadan period
            const punchTime = punch.date.getTime();
            const isRamadan = dbSettings.ramadanActive &&
                dbSettings.ramadanStart !== null &&
                dbSettings.ramadanEnd !== null &&
                punchTime >= dbSettings.ramadanStart!.getTime() &&
                punchTime <= dbSettings.ramadanEnd!.getTime();

            const attendanceSettings: AttendanceSettings = {
                lunchHours: dbSettings.lunchHours,
                isRamadan,
                ramadanBonus: 2,
                ramadanLunchHours: dbSettings.ramadanLunchHours,
                siteStartTime: (dbSettings as any).siteStartTime ?? null,
            };

            // --- PUBLIC HOLIDAY CHECK ---
            const punchDateStr = punch.date.toISOString().split('T')[0];
            const holidayName = holidayMap.get(punchDateStr);

            if (holidayName) {
                if (!punch.employee) continue; // Safety guard — should always exist due to filter above
                if (punch.employee.allowOvertime) {
                    // Worker on public holiday: ALL hours → EOT
                    const grossHours = (punch.punchIn && punch.punchOut) 
                        ? calculateHours(punch.punchIn, punch.punchOut, (dbSettings as any).siteStartTime ?? null, false)
                        : 8; // If missing punches, assume 8h
                    const netHours = Math.max(1, roundWorkedHours(grossHours));
                    const shift = (punch.punchIn && punch.punchOut) 
                        ? determineShift(punch.punchIn, punch.punchOut)
                        : determineShift(punch.punchIn || "06:00");

                    attendanceRecords.push({
                        employeeId: punch.employee.id,
                        date: punch.date,
                        network: punch.employee.network,
                        activity: punch.employee.activity,
                        element: punch.employee.element,
                        aaType: "EOT",
                        hours: netHours,
                        shift,
                        remarks: `Public Holiday – ${holidayName}`,
                        needsReview: true,
                        reviewReason: "HOLIDAY_WORK",
                    });
                }
                // Staff (allowOvertime=false) on holiday → skip entirely, nothing recorded
                continue;
            }
            // --- END HOLIDAY CHECK ---

            const records = calculateAttendance(punch, validNextDayPunch, punch.employee, attendanceSettings, consumedPunches);
            attendanceRecords.push(...records);
        }
        // Collect employee IDs who had a stitched shift extending past endPeriod
        const stitchedEmployeeIds = attendanceRecords
            .filter(r => r.date.getTime() > endPeriod.getTime())
            .map(r => r.employeeId);

        const deleteOps: any[] = [
            prisma.attendanceRecord.deleteMany({
                where: {
                    date: {
                        gte: startPeriod,
                        lte: endPeriod,
                    },
                },
            })
        ];

        // Also delete the next day for specific employees who stitched into it
        if (stitchedEmployeeIds.length > 0) {
            const nextDayStart = new Date(endPeriod);
            nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1);
            nextDayStart.setUTCHours(0, 0, 0, 0);

            const nextDayEnd = new Date(endPeriod);
            nextDayEnd.setUTCDate(nextDayEnd.getUTCDate() + 1);
            nextDayEnd.setUTCHours(23, 59, 59, 999);

            deleteOps.push(
                prisma.attendanceRecord.deleteMany({
                    where: {
                        date: {
                            gte: nextDayStart,
                            lte: nextDayEnd,
                        },
                        employeeId: {
                            in: stitchedEmployeeIds
                        }
                    }
                })
            );
        }

        // Transaction: Delete existing and create new (Danway employees only)
        await prisma.$transaction([
            ...deleteOps,
            prisma.attendanceRecord.createMany({
                data: attendanceRecords,
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: `Calculated attendance for range ${startPeriod.toISOString().split('T')[0]} to ${endPeriod.toISOString().split('T')[0]}`,
            recordsCreated: attendanceRecords.length,
            dateRange: {
                start: startPeriod.toISOString().split('T')[0],
                end: endPeriod.toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error("Error calculating attendance:", error);
        return NextResponse.json(
            { success: false, error: "Failed to calculate attendance", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
