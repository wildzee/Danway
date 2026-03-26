import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');

        const hiredEmployees = await prisma.hiredEmployee.findMany({
            where: vendorId ? { vendorId } : undefined,
            include: {
                vendor: true
            },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ data: hiredEmployees });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to fetch hired employees", details: errorMsg },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { employeeId, name, designation, shift, vendorId, project, status } = data;

        if (!employeeId || !name || !designation || !shift || !vendorId) {
            return NextResponse.json(
                { error: "Missing required fields (employeeId, name, designation, shift, vendorId)" },
                { status: 400 }
            );
        }

        const newHiredEmployee = await prisma.hiredEmployee.create({
            data: {
                employeeId,
                name,
                designation,
                shift,
                vendorId,
                project: project || "D657",
                status: status || "active",
            },
            include: {
                vendor: true,
            }
        });

        return NextResponse.json({ data: newHiredEmployee }, { status: 201 });
    } catch (error) {
        // Check if error is a Prisma Client Known Request Error
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
            return NextResponse.json(
                { error: "An employee with this ID already exists." },
                { status: 409 }
            );
        }
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to create hired employee", details: errorMsg },
            { status: 500 }
        );
    }
}
