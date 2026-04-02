import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/clawd";

const RequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  company: z.string().min(2).max(100),
  tier: z.enum(["founding", "growth", "enterprise"]),
  message: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { name, email, company, tier, message } = parsed.data;

  // Forward to Railway leads intake (best-effort, fail silently)
  await createLead({
    name,
    email,
    company,
    message: message || "",
    source: "tier-request",
    intent: "partnership",
    meta: { tier },
  }).catch(() => {
    // Intake endpoint may not exist yet — non-fatal
  });

  // Admin notification via Resend API (best-effort)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const adminEmail = process.env.ADMIN_EMAIL || "casey@dwtb.dev";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@dwtb.dev",
        to: adminEmail,
        subject: `[DWTB] Tier Request — ${tier.toUpperCase()} from ${company}`,
        text: [
          `New tier request received.`,
          ``,
          `Name:    ${name}`,
          `Email:   ${email}`,
          `Company: ${company}`,
          `Tier:    ${tier}`,
          `Message: ${message || "(none)"}`,
          ``,
          `Review in admin: ${process.env.NEXT_PUBLIC_SITE_URL || "https://dwtb.dev"}/admin`,
        ].join("\n"),
      }),
    }).catch(() => {
      // Email failure is non-fatal
    });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
