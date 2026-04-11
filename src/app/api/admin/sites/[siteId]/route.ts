import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";
import { generatePassword, hashPassword } from "@/lib/auth/password";

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
  return NextResponse.json(site);
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
    await prisma.site.update({ where: { id: siteId }, data: { passwordHash } });
    return NextResponse.json({ success: true, plainPassword });
  }

  if (action === "set-password") {
    const { password } = body;
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    await prisma.site.update({ where: { id: siteId }, data: { passwordHash } });
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

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  // Prevent deleting sites with employees
  const empCount = await prisma.employee.count({ where: { siteId } });
  if (empCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete site with active employees" },
      { status: 409 }
    );
  }

  await prisma.site.delete({ where: { id: siteId } });
  return NextResponse.json({ success: true });
}
