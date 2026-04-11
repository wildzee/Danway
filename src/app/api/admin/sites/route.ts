import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/api-auth";
import { generatePassword, hashPassword } from "@/lib/auth/password";
import { encryptPassword, decryptPassword } from "@/lib/auth/encrypt";

export async function GET(request: NextRequest) {
  const result = await requireSession(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { employees: true, hiredEmployees: true, sapMappings: true },
      },
    },
  });

  // Decrypt passwords for admin display
  const sitesWithPasswords = sites.map((s) => ({
    ...s,
    plainPassword: s.encryptedPassword ? decryptPassword(s.encryptedPassword) : null,
    encryptedPassword: undefined,
    passwordHash: undefined,
  }));

  return NextResponse.json(sitesWithPasswords);
}

export async function POST(request: NextRequest) {
  const result = await requireSession(request, ["admin"]);
  if (result instanceof NextResponse) return result;

  const { code, name } = await request.json();

  if (!code || !name) {
    return NextResponse.json({ error: "code and name are required" }, { status: 400 });
  }

  const siteCode = code.trim().toUpperCase();

  const existing = await prisma.site.findFirst({
    where: { OR: [{ code: siteCode }, { loginId: siteCode }] },
  });
  if (existing) {
    return NextResponse.json({ error: "A site with this code already exists" }, { status: 409 });
  }

  const plainPassword = generatePassword(10);
  const passwordHash = await hashPassword(plainPassword);
  const encryptedPassword = encryptPassword(plainPassword);

  const site = await prisma.site.create({
    data: {
      code: siteCode,
      name: name.trim(),
      loginId: siteCode,
      passwordHash,
      encryptedPassword,
    },
  });

  return NextResponse.json({ ...site, plainPassword, passwordHash: undefined, encryptedPassword: undefined }, { status: 201 });
}
