import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SessionPayload, COOKIE_NAME } from "./session";

type AllowedRole = "admin" | "timekeeper";

interface RequireSessionResult {
  session: SessionPayload;
}

/**
 * Extract and verify session from a Route Handler request.
 * Returns the session or a 401/403 NextResponse.
 *
 * Usage:
 *   const result = await requireSession(request);
 *   if (result instanceof NextResponse) return result;
 *   const { session } = result;
 */
export async function requireSession(
  request: NextRequest,
  allowedRoles?: AllowedRole[]
): Promise<RequireSessionResult | NextResponse> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session };
}
