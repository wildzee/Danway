import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    role: session.role,
    siteCode: session.siteCode,
    siteName: session.siteName,
    siteId: session.siteId,
  });
}
