import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, createAdminSession } from "@/lib/admin-auth";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { appendAuditEntry } from "@/lib/audit";

// POST /api/admin/login — admin password auth
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ua = request.headers.get("user-agent") || "unknown";

  // Rate limit: 5 attempts per minute per IP
  const rlKey = rateLimitKey(ip, ua);
  const { allowed, retryAfter } = await checkRateLimit(rlKey);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      {
        status: 429,
        headers: retryAfter
          ? { "Retry-After": String(Math.ceil(retryAfter / 1000)) }
          : {},
      }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.password || typeof body.password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  if (!checkAdminPassword(body.password)) {
    await appendAuditEntry({
      eventType: "admin_login",
      entityType: "admin",
      entityId: "login_failed",
      actorIp: ip,
      actorUa: ua,
      payload: { success: false },
    });
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  // Set httpOnly cookie
  await createAdminSession();

  await appendAuditEntry({
    eventType: "admin_login",
    entityType: "admin",
    entityId: "login_success",
    actorIp: ip,
    actorUa: ua,
    payload: { success: true },
  });

  return NextResponse.json({ authenticated: true });
}
