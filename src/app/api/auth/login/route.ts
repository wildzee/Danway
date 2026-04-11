import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, COOKIE_NAME, MAX_AGE } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { loginId, password } = await request.json();

    if (!loginId || !password) {
      return NextResponse.json({ error: "Login ID and password are required" }, { status: 400 });
    }

    const adminLoginId = (process.env.ADMIN_LOGIN_ID ?? "admin").trim();
    const adminPassword = (process.env.ADMIN_PASSWORD ?? "").trim();

    // Check admin credentials first (plain comparison — Vercel encrypts env vars at rest)
    if (loginId === adminLoginId) {
      const valid = adminPassword.length > 0 && password === adminPassword;
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      const token = await createSessionToken({ role: "admin" });
      const response = NextResponse.json({ success: true, role: "admin" });
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: MAX_AGE,
        path: "/",
      });
      return response;
    }

    // Check site credentials
    const site = await prisma.site.findUnique({ where: { loginId } });
    if (!site) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, site.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken({
      role: "timekeeper",
      siteId: site.id,
      siteCode: site.code,
      siteName: site.name,
    });

    const response = NextResponse.json({ success: true, role: "timekeeper" });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: MAX_AGE,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
