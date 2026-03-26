import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const data = await request.json();
        const { name, code, contactPerson, contactNumber, status } = data;

        if (!id) {
            return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
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

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        // Usually, we should handle if Vendor has restricted relation with employees, but Prisma configuration will throw an error if we try to delete a vendor with employees if `onDelete: Restrict` is set.
        await prisma.vendor.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2003') {
            return NextResponse.json(
                { error: "Cannot delete this company because there are employees assigned to it." },
                { status: 409 }
            );
        }
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to delete vendor", details: errorMsg },
            { status: 500 }
        );
    }
}
