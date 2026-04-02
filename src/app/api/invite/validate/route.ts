import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { appendAuditEntry } from "@/lib/audit";

// POST /api/invite/validate — validate an invite token
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

  const supabase = createServiceClient();

  const { data: token, error } = await supabase
    .from("invite_tokens")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !token) {
    return NextResponse.json(
      { valid: false, error: "Token not found" },
      { status: 404 }
    );
  }

  // Check status
  if (token.status !== "active") {
    return NextResponse.json(
      { valid: false, error: `Token is ${token.status}` },
      { status: 403 }
    );
  }

  // Check expiry
  if (new Date(token.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from("invite_tokens")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", token.id);

    return NextResponse.json(
      { valid: false, error: "Token has expired" },
      { status: 403 }
    );
  }

  // Check max uses
  if (token.used_count >= token.max_uses) {
    await supabase
      .from("invite_tokens")
      .update({ status: "used", updated_at: new Date().toISOString() })
      .eq("id", token.id);

    return NextResponse.json(
      { valid: false, error: "Token has been fully used" },
      { status: 403 }
    );
  }

  // Increment usage count
  await supabase
    .from("invite_tokens")
    .update({
      used_count: token.used_count + 1,
      status: token.used_count + 1 >= token.max_uses ? "used" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", token.id);

  await appendAuditEntry({
    eventType: "invite_used",
    entityType: "invite_token",
    entityId: token.id,
    actorIp: ip,
    actorUa: ua,
    payload: {
      code: code.slice(0, 4) + "****",
      access_mode: token.access_mode,
    },
  });

  return NextResponse.json({
    valid: true,
    access_mode: token.access_mode,
    invitee_email: token.invitee_email,
  });
}
