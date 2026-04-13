import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const { id } = await context.params;
        const data = await request.json();
        const { name, code, contactPerson, contactNumber, status } = data;

        if (!id) {
            return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        // Verify vendor belongs to this site
        const vendor = await prisma.vendor.findFirst({ where: { id, siteId: session.siteId ?? "" } });
        if (!vendor) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        const updatedVendor = await prisma.vendor.update({
            where: { id },
            data: {
                name,
                code,
                contactPerson,
                contactNumber,
                status,
            },
        });

        return NextResponse.json({ data: updatedVendor });
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
            return NextResponse.json(
                { error: "A vendor with this name already exists." },
                { status: 409 }
            );
        }
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to update vendor", details: errorMsg },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        // Verify vendor belongs to this site
        const vendor = await prisma.vendor.findFirst({ where: { id, siteId: session.siteId ?? "" } });
        if (!vendor) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        await prisma.vendor.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2003') {
            return NextResponse.json(
                { error: "Cannot delete this company because employees are assigned to it. Remove or reassign the employees first." },
                { status: 409 }
            );
        }
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: "Failed to delete vendor", details: errorMsg }, { status: 500 });
    }
}
