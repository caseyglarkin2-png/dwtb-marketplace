import { NextRequest, NextResponse } from "next/server";
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

// GET /api/admin/tokens — invite tokens are validated at the gate only
// No persistent token store — any valid-format token is accepted
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    tokens: [],
    note: "Tokens are gate-validated only (any valid-format token accepted). No persistent token store.",
  });
}

// POST /api/admin/tokens — generate a new invite token + URL
export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = generateTokenCode();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dwtb.dev";
  const inviteUrl = `${siteUrl}/partners?token=${code}`;

  return NextResponse.json(
    {
      token: {
        code,
        expires_at: DEADLINE_UTC,
        access_mode: "private",
        created_at: new Date().toISOString(),
      },
      invite_url: inviteUrl,
    },
    { status: 201 }
  );
}

// DELETE /api/admin/tokens — no persistent store to revoke from
export async function DELETE(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Token revocation is not available without a persistent token store." },
    { status: 501 }
  );
}
