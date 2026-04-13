import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const vendors = await prisma.vendor.findMany({
            where: { siteId: session.siteId ?? "" },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ data: vendors });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: "Failed to fetch vendors", details: msg }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const data = await request.json();
        const { name, code, contactPerson, contactNumber, status } = data;

        if (!name) {
            return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
        }

        const newVendor = await prisma.vendor.create({
            data: {
                name,
                code,
                contactPerson,
                contactNumber,
                status: status || "active",
                siteId: session.siteId ?? "",
            },
        });

        return NextResponse.json({ data: newVendor }, { status: 201 });
    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: "A company with this name already exists for this site." }, { status: 409 });
        }
        const msg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: "Failed to create vendor", details: msg }, { status: 500 });
    }
}
