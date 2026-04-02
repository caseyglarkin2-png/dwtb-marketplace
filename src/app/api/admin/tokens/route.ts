import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { DEADLINE_UTC } from "@/lib/constants";

// Generate a cryptographically random 24-char alphanumeric code
function generateTokenCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(values)
    .map((v) => chars[v % chars.length])
    .join("");
}

// GET /api/admin/tokens — list all invite tokens
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("invite_tokens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }

  return NextResponse.json({ tokens: data });
}

// POST /api/admin/tokens — create a new invite token
export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    invitee_email?: string;
    expires_at?: string;
    max_uses?: number;
    access_mode?: string;
  };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const code = generateTokenCode();
  const expiresAt = body.expires_at || DEADLINE_UTC;
  const maxUses = body.max_uses || 1;
  const accessMode = body.access_mode || "private";

  if (!["private", "public", "vip"].includes(accessMode)) {
    return NextResponse.json(
      { error: "Invalid access_mode" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("invite_tokens")
    .insert({
      code,
      invitee_email: body.invitee_email || null,
      expires_at: expiresAt,
      max_uses: maxUses,
      access_mode: accessMode,
    })
    .select()
    .single();

  if (error) {
    console.error("Token creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dwtb.dev";
  const inviteUrl = `${siteUrl}/partners?token=${code}`;

  return NextResponse.json({ token: data, invite_url: inviteUrl }, { status: 201 });
}

// DELETE /api/admin/tokens — revoke a token
export async function DELETE(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("id");
  if (!tokenId) {
    return NextResponse.json({ error: "Missing token id" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("invite_tokens")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", tokenId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to revoke token" },
      { status: 500 }
    );
  }

  return NextResponse.json({ revoked: true });
}
