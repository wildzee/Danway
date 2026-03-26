import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const vendors = await prisma.vendor.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ data: vendors });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to fetch vendors", details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
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
            },
        });

        return NextResponse.json({ data: newVendor }, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A vendor with this name already exists." },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create vendor", details: error.message },
            { status: 500 }
        );
    }
}
