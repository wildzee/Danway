import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const loginId = process.env.ADMIN_LOGIN_ID ?? "";
  const valid = await verifyPassword(password, hash);
  return NextResponse.json({
    hashLength: hash.length,
    hashPrefix: hash.slice(0, 7),
    loginId,
    valid,
  });
}
