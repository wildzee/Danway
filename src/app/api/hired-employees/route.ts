import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');

        const where: any = { siteId: session.siteId };
        if (vendorId) where.vendorId = vendorId;

        const hiredEmployees = await prisma.hiredEmployee.findMany({
            where,
            include: { vendor: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ data: hiredEmployees });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch hired employees" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    if (!session.siteId) {
        return NextResponse.json({ error: "No site context in session" }, { status: 403 });
    }

    try {
        const data = await request.json();
        const { employeeId, name, designation, shift, vendorId, status } = data;

        if (!employeeId || !name || !designation || !shift || !vendorId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newHiredEmployee = await prisma.hiredEmployee.create({
            data: {
                employeeId,
                name,
                designation,
                shift,
                vendorId,
                siteId: session.siteId,
                project: session.siteCode || "D657",
                status: status || "active",
            },
            include: { vendor: true },
        });

        return NextResponse.json({ data: newHiredEmployee }, { status: 201 });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: "An employee with this ID already exists in this site." }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create hired employee" }, { status: 500 });
    }
}
