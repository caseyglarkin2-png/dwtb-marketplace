import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { appendAuditEntry } from "@/lib/audit";

// POST /api/invite/validate — validate an invite token
// Without a database, all valid-format tokens are accepted (gate is REQUIRE_INVITE_TOKEN env var)
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ua = request.headers.get("user-agent") || "unknown";

  // Rate limit
  const rlKey = rateLimitKey(ip, ua);
  const { allowed, retryAfter } = await checkRateLimit(rlKey);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: retryAfter
          ? { "Retry-After": String(Math.ceil(retryAfter / 1000)) }
          : {},
      }
    );
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.code || typeof body.code !== "string") {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  // Sanitize: alphanumeric only, max 32 chars
  const code = body.code.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  if (code.length < 8) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await appendAuditEntry({
    eventType: "invite_used",
    entityType: "invite_token",
    entityId: code,
    actorIp: ip,
    actorUa: ua,
    payload: { code: code.slice(0, 4) + "****", access_mode: "private" },
  });

  return NextResponse.json({
    valid: true,
    access_mode: "private",
    invitee_email: null,
  });
}
