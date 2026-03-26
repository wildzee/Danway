import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const data = await request.json();
        const { employeeId, name, designation, shift, vendorId, project, status } = data;

        if (!id) {
            return NextResponse.json({ error: "Employee config ID is required" }, { status: 400 });
        }

        const updatedEmployee = await prisma.hiredEmployee.update({
            where: { id },
            data: {
                employeeId,
                name,
                designation,
                shift,
                vendorId,
                project,
                status,
            },
            include: {
                vendor: true,
            }
        });

        return NextResponse.json({ data: updatedEmployee });
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
            return NextResponse.json(
                { error: "An employee with this ID already exists." },
                { status: 409 }
            );
        }
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to update employee", details: errorMsg },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
        }

        await prisma.hiredEmployee.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to delete employee", details: errorMsg },
            { status: 500 }
        );
    }
}
