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

        // Verify belongs to this site
        const existing = await prisma.hiredEmployee.findFirst({ where: { id, siteId: session.siteId } });
        if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

        const { employeeId, name, designation, shift, vendorId, project, status } = data;
        const updatedEmployee = await prisma.hiredEmployee.update({
            where: { id },
            data: { employeeId, name, designation, shift, vendorId, project, status },
            include: { vendor: true },
        });

        return NextResponse.json({ data: updatedEmployee });
    } catch (error: any) {
        if (error?.code === 'P2002') return NextResponse.json({ error: "An employee with this ID already exists." }, { status: 409 });
        return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const { id } = await context.params;

        // Verify belongs to this site
        const existing = await prisma.hiredEmployee.findFirst({ where: { id, siteId: session.siteId } });
        if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

        await prisma.hiredEmployee.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
    }
}
