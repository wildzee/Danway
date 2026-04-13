import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireSession } from "@/lib/auth/api-auth";

const rowSchema = z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    name: z.string().min(1, "Name is required"),
    designation: z.string().min(1, "Designation is required"),
    shift: z.enum(["Day shift", "Night shift"]).catch("Day shift"),
    vendorId: z.string().min(1, "Vendor ID is required"),
    project: z.string().optional(),
});

export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    if (!session.siteId) {
        return NextResponse.json({ success: false, error: "No site context in session" }, { status: 403 });
    }

    try {
        const body = await request.json();

        if (!Array.isArray(body.records) || body.records.length === 0) {
            return NextResponse.json({ success: false, error: "No records provided" }, { status: 400 });
        }

        const vendorIds = [...new Set<string>(body.records.map((r: any) => r.vendorId))];
        const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds }, siteId: session.siteId }, select: { id: true } });
        const validVendorIds = new Set(vendors.map(v => v.id));

        const allEmployeeIds = body.records.map((r: any) => r.employeeId).filter(Boolean);
        const existingEmployees = await prisma.hiredEmployee.findMany({
            where: { employeeId: { in: allEmployeeIds }, siteId: session.siteId },
            select: { employeeId: true },
        });
        const existingIdSet = new Set(existingEmployees.map(e => e.employeeId));

        const results: Array<{ row: number; employeeId: string; name: string; status: "created" | "skipped" | "error"; reason?: string }> = [];
        const toCreate: any[] = [];

        for (let i = 0; i < body.records.length; i++) {
            const raw = body.records[i];
            const row = i + 1;

            const parsed = rowSchema.safeParse(raw);
            if (!parsed.success) {
                results.push({ row, employeeId: raw.employeeId || "—", name: raw.name || "—", status: "error", reason: parsed.error.issues.map(e => e.message).join("; ") });
                continue;
            }

            const data = parsed.data;

            if (!validVendorIds.has(data.vendorId)) {
                results.push({ row, employeeId: data.employeeId, name: data.name, status: "error", reason: "Vendor not found" });
                continue;
            }

            if (existingIdSet.has(data.employeeId)) {
                results.push({ row, employeeId: data.employeeId, name: data.name, status: "skipped", reason: "Employee ID already exists in this site" });
                continue;
            }

            existingIdSet.add(data.employeeId);
            toCreate.push({
                employeeId: data.employeeId,
                name: data.name,
                designation: data.designation,
                shift: data.shift,
                vendorId: data.vendorId,
                siteId: session.siteId,
                project: session.siteCode || "D657",
                status: "active",
            });
            results.push({ row, employeeId: data.employeeId, name: data.name, status: "created" });
        }

        if (toCreate.length > 0) {
            await prisma.hiredEmployee.createMany({ data: toCreate });
        }

        return NextResponse.json({
            success: true,
            created: toCreate.length,
            skipped: results.filter(r => r.status === "skipped").length,
            errors: results.filter(r => r.status === "error").length,
            results,
        });
    } catch (error) {
        console.error("Bulk import error:", error);
        return NextResponse.json({ success: false, error: "Bulk import failed" }, { status: 500 });
    }
}
