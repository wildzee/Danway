import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";
import { generatePassword, hashPassword } from "@/lib/auth/password";
import { encryptPassword, decryptPassword } from "@/lib/auth/encrypt";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const result = await requireSession(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const { siteId } = await params;

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      sapMappings: { orderBy: { designation: "asc" } },
      _count: { select: { employees: true, hiredEmployees: true } },
    },
  });

  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  return NextResponse.json({
    ...site,
    plainPassword: site.encryptedPassword ? decryptPassword(site.encryptedPassword) : null,
    encryptedPassword: undefined,
    passwordHash: undefined,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const result = await requireSession(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const { siteId } = await params;
  const body = await request.json();
  const { action } = body;

  if (action === "reset-password") {
    const plainPassword = generatePassword(10);
    const passwordHash = await hashPassword(plainPassword);
    const encryptedPassword = encryptPassword(plainPassword);
    await prisma.site.update({ where: { id: siteId }, data: { passwordHash, encryptedPassword } });
    return NextResponse.json({ success: true, plainPassword });
  }

  if (action === "set-password") {
    const { password } = body;
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    const encryptedPassword = encryptPassword(password);
    await prisma.site.update({ where: { id: siteId }, data: { passwordHash, encryptedPassword } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const result = await requireSession(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const { siteId } = await params;

  try {
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    // Get employee and hired employee IDs for cascading deletes
    const employees = await prisma.employee.findMany({ where: { siteId }, select: { id: true } });
    const hiredEmployees = await prisma.hiredEmployee.findMany({ where: { siteId }, select: { id: true } });
    const empIds = employees.map((e) => e.id);
    const hiredIds = hiredEmployees.map((e) => e.id);

    // Cascade delete everything in a transaction
    await prisma.$transaction([
      // Attendance records for employees
      prisma.attendanceRecord.deleteMany({ where: { employeeId: { in: empIds } } }),
      // Punch records for employees and hired employees
      prisma.punchRecord.deleteMany({
        where: {
          OR: [
            { employeeId: { in: empIds } },
            { hiredEmployeeId: { in: hiredIds } },
          ],
        },
      }),
      // Hired timesheets
      prisma.hiredTimesheet.deleteMany({ where: { hiredEmployeeId: { in: hiredIds } } }),
      // Employees and hired employees
      prisma.employee.deleteMany({ where: { siteId } }),
      prisma.hiredEmployee.deleteMany({ where: { siteId } }),
      // SAP code mappings
      prisma.sAPCodeMapping.deleteMany({ where: { siteId } }),
      // Finally the site itself
      prisma.site.delete({ where: { id: siteId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to delete site", details: msg }, { status: 500 });
  }
}
