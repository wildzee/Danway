import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";

// GET /api/holidays — List all public holidays
export async function GET(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;

    try {
        const holidays = await prisma.publicHoliday.findMany({
            orderBy: { date: "asc" },
        });
        return NextResponse.json({ success: true, data: holidays });
    } catch (error) {
        console.error("Error fetching holidays:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch holidays" }, { status: 500 });
    }
}

// POST /api/holidays — Create a new public holiday
// Body: { date: "YYYY-MM-DD", name: "Eid Al Fitr" }
export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;

    try {
        const body = await request.json();
        const { date, name } = body;

        if (!date || !name) {
            return NextResponse.json({ success: false, error: "Date and name are required" }, { status: 400 });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ success: false, error: "Invalid date format (YYYY-MM-DD)" }, { status: 400 });
        }

        // Save at 12:00 PM UTC to prevent timezone shifts (same pattern as Ramadan dates)
        const [year, month, day] = date.split("-").map(Number);
        const savedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

        const holiday = await prisma.publicHoliday.create({
            data: { date: savedDate, name: name.trim() },
        });

        return NextResponse.json({ success: true, data: holiday });
    } catch (error) {
        console.error("Error creating holiday:", error);
        return NextResponse.json({ success: false, error: "Failed to create holiday" }, { status: 500 });
    }
}

// DELETE /api/holidays?id=xxx — Delete a holiday by ID
export async function DELETE(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;

    try {
        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ success: false, error: "Holiday ID is required" }, { status: 400 });
        }

        await prisma.publicHoliday.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting holiday:", error);
        return NextResponse.json({ success: false, error: "Failed to delete holiday" }, { status: 500 });
    }
}
