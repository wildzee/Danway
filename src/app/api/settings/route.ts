import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: "global" },
        });

        // Create defaults if not exist
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: "global" },
            });
        }

        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { lunchHours, ramadanLunchHours, ramadanActive, ramadanStart, ramadanEnd, siteStartTime } = body;

        const updateData: any = {};

        if (lunchHours !== undefined) {
            updateData.lunchHours = parseFloat(lunchHours);
        }
        if (ramadanLunchHours !== undefined) {
            updateData.ramadanLunchHours = parseFloat(ramadanLunchHours);
        }
        if (ramadanActive !== undefined) {
            updateData.ramadanActive = Boolean(ramadanActive);
        }
        if (siteStartTime !== undefined) {
            updateData.siteStartTime = siteStartTime || null;
        }
        if (ramadanStart !== undefined) {
            if (ramadanStart && /^\d{4}-\d{2}-\d{2}$/.test(ramadanStart)) {
                const [y, m, d] = ramadanStart.split('-').map(Number);
                updateData.ramadanStart = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
            } else {
                updateData.ramadanStart = null;
            }
        }
        if (ramadanEnd !== undefined) {
            if (ramadanEnd && /^\d{4}-\d{2}-\d{2}$/.test(ramadanEnd)) {
                const [y, m, d] = ramadanEnd.split('-').map(Number);
                updateData.ramadanEnd = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
            } else {
                updateData.ramadanEnd = null;
            }
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: "global" },
            create: { id: "global", ...updateData },
            update: updateData,
        });

        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
