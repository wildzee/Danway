import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const mappings = await prisma.sAPCodeMapping.findMany({
            where: { siteId: session.siteId },
            orderBy: { designation: "asc" },
            select: { designation: true, network: true, activity: true, element: true },
        });

        return NextResponse.json({ success: true, data: mappings });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch designations" }, { status: 500 });
    }
}
