// Email templates for DWTB?! Studios bid notifications
// HTML + plain text dual-format for email client compatibility

export interface BidConfirmationEmailParams {
  bidderName: string;
  bidderCompany: string;
  bidAmount: number;
  bidId: string;
  contractVersion: string;
  signedAt: string;
}

export interface StatusChangeEmailParams {
  bidderName: string;
  bidderCompany: string;
  bidId: string;
  newStatus: string;
  statusNote?: string;
  bidAmount: number;
}

export interface AdminNotificationEmailParams {
  bidderName: string;
  bidderTitle: string;
  bidderCompany: string;
  bidderEmail: string;
  bidAmount: number;
  bidId: string;
  contractVersion: string;
  signedAt: string;
  note?: string;
}

// ── Bid Confirmation (to bidder) ────────────────────────

export function renderBidConfirmationEmail(params: BidConfirmationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { bidderName, bidderCompany, bidAmount, bidId, contractVersion, signedAt } = params;
  const amountStr = `$${bidAmount.toLocaleString("en-US")}`;
  const refShort = bidId.slice(0, 8);
  const dateStr = new Date(signedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const statusUrl = `https://dwtb.dev/status`;

  const subject = `Allocation Request Received — DWTB?! Studios Q2 2026`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:monospace;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:40px auto;background:#111;border:1px solid #222;border-radius:8px;overflow:hidden;">
  <tr><td style="background:#0a0a0a;padding:24px 32px;border-bottom:1px solid #1a1a1a;">
    <span style="font-size:13px;color:#00FFC2;font-weight:700;letter-spacing:0.05em;">DWTB?! STUDIOS</span>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 8px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.1em;">Allocation Request Received</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;">You're In.</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#999;line-height:1.6;">
      Hi ${bidderName},<br><br>
      Your Q2 2026 allocation request from ${bidderCompany} has been received. Casey will review and respond within 24 hours.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:6px;margin:0 0 24px;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
        <span style="font-size:11px;color:#666;">Amount</span>
        <span style="float:right;font-size:12px;color:#00FFC2;font-weight:700;">${amountStr}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
        <span style="font-size:11px;color:#666;">Reference</span>
        <span style="float:right;font-size:12px;color:#fff;">${refShort}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
        <span style="font-size:11px;color:#666;">Contract</span>
        <span style="float:right;font-size:12px;color:#fff;">${contractVersion}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;">
        <span style="font-size:11px;color:#666;">Signed</span>
        <span style="float:right;font-size:12px;color:#fff;">${dateStr}</span>
      </td></tr>
    </table>

    <p style="margin:0 0 12px;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.08em;">What Happens Next</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="padding:8px 0;font-size:12px;color:#999;border-bottom:1px solid #1a1a1a;">
        <span style="color:#00FFC2;margin-right:12px;">Within 24h</span> Casey reviews your request
      </td></tr>
      <tr><td style="padding:8px 0;font-size:12px;color:#999;border-bottom:1px solid #1a1a1a;">
        <span style="color:#00FFC2;margin-right:12px;">Within 48h</span> If accepted: onboarding details + invoice
      </td></tr>
      <tr><td style="padding:8px 0;font-size:12px;color:#999;border-bottom:1px solid #1a1a1a;">
        <span style="color:#00FFC2;margin-right:12px;">7 days</span> First payment (50%) due on acceptance
      </td></tr>
      <tr><td style="padding:8px 0;font-size:12px;color:#999;">
        <span style="color:#00FFC2;margin-right:12px;">April 1</span> Q2 engagement begins
      </td></tr>
    </table>

    <a href="${statusUrl}" style="display:block;text-align:center;background:#00FFC2;color:#000;font-weight:700;font-size:13px;padding:14px;border-radius:6px;text-decoration:none;margin:0 0 24px;">
      Track Your Request Status →
    </a>

    <p style="margin:0;font-size:11px;color:#444;text-align:center;">
      Questions? <a href="mailto:casey@dwtb.dev" style="color:#00FFC2;text-decoration:none;">casey@dwtb.dev</a>
    </p>
  </td></tr>
  <tr><td style="padding:16px 32px;background:#0a0a0a;border-top:1px solid #1a1a1a;text-align:center;">
    <span style="font-size:10px;color:#333;">DWTB?! Studios LLC · Reference: ${refShort}</span>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `DWTB?! Studios — Allocation Request Received`,
    ``,
    `Hi ${bidderName},`,
    ``,
    `Your Q2 2026 allocation request from ${bidderCompany} has been received. Casey will review and respond within 24 hours.`,
    ``,
    `DETAILS`,
    `Amount: ${amountStr}`,
    `Reference: ${refShort}`,
    `Contract: ${contractVersion}`,
    `Signed: ${dateStr}`,
    ``,
    `WHAT HAPPENS NEXT`,
    `Within 24h — Casey reviews your request`,
    `Within 48h — If accepted: onboarding details + invoice`,
    `Within 7 days — First payment (50%) due on acceptance`,
    `April 1 — Q2 engagement begins`,
    ``,
    `Track your status: ${statusUrl}`,
    ``,
    `— Casey Glarkin, DWTB?! Studios`,
    `casey@dwtb.dev`,
  ].join("\n");

  return { subject, html, text };
}

// ── Status Change (to bidder) ───────────────────────────

export function renderStatusChangeEmail(params: StatusChangeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { bidderName, bidId, newStatus, statusNote, bidAmount } = params;
  const refShort = bidId.slice(0, 8);
  const amountStr = `$${bidAmount.toLocaleString("en-US")}`;
  const statusUrl = `https://dwtb.dev/status`;

  const STATUS_COPY: Record<string, { subject: string; headline: string; body: string }> = {
    accepted: {
      subject: `Your Allocation Has Been Approved — DWTB?! Studios Q2 2026`,
      headline: "You're approved.",
      body: `Congratulations — your Q2 2026 allocation request has been accepted. Onboarding details and payment instructions are on their way. Please watch your inbox.`,
    },
    declined: {
      subject: `Allocation Decision — DWTB?! Studios Q2 2026`,
      headline: "Not selected this round.",
      body: `Thank you for your interest in Q2 2026. Unfortunately your allocation was not selected. You'll be first in line for Q3 if you'd like to re-engage. Reply to this email or reach out directly.`,
    },
    waitlisted: {
      subject: `You're on the Waitlist — DWTB?! Studios Q2 2026`,
      headline: "You're on the waitlist.",
      body: `All Q2 2026 allocations are currently spoken for. You've been added to the waitlist and will be contacted immediately if a slot opens.`,
    },
    paid: {
      subject: `Payment Confirmed — DWTB?! Studios Q2 2026`,
      headline: "Payment received.",
      body: `Your payment has been confirmed. The kickoff call invitation and onboarding questionnaire are on their way. We're looking forward to Q2.`,
    },
  };

  const copy = STATUS_COPY[newStatus] ?? {
    subject: `Update on Your Allocation — DWTB?! Studios`,
    headline: "Status update.",
    body: `Your allocation request status has been updated to: ${newStatus}.`,
  };

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:monospace;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:40px auto;background:#111;border:1px solid #222;border-radius:8px;overflow:hidden;">
  <tr><td style="background:#0a0a0a;padding:24px 32px;border-bottom:1px solid #1a1a1a;">
    <span style="font-size:13px;color:#00FFC2;font-weight:700;letter-spacing:0.05em;">DWTB?! STUDIOS</span>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 8px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.1em;">Allocation Update · ${refShort} · ${amountStr}</p>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;">${copy.headline}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#999;line-height:1.6;">Hi ${bidderName},<br><br>${copy.body}</p>
    ${statusNote ? `<p style="margin:0 0 24px;padding:16px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:6px;font-size:12px;color:#888;">"${statusNote}"</p>` : ""}
    <a href="${statusUrl}" style="display:block;text-align:center;background:#00FFC2;color:#000;font-weight:700;font-size:13px;padding:14px;border-radius:6px;text-decoration:none;margin:0 0 24px;">View Full Status →</a>
    <p style="margin:0;font-size:11px;color:#444;text-align:center;"><a href="mailto:casey@dwtb.dev" style="color:#00FFC2;text-decoration:none;">casey@dwtb.dev</a></p>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `DWTB?! Studios — ${copy.headline}`,
    ``,
    `Hi ${bidderName},`,
    ``,
    copy.body,
    statusNote ? `\nNote from Casey: "${statusNote}"` : "",
    ``,
    `View your status: ${statusUrl}`,
    ``,
    `— Casey Glarkin, DWTB?! Studios`,
  ].join("\n");

  return { subject: copy.subject, html, text };
}

// ── Admin Notification (to Casey) ──────────────────────

export function renderAdminNotificationEmail(params: AdminNotificationEmailParams): {
  subject: string;
  text: string;
} {
  const { bidderName, bidderTitle, bidderCompany, bidderEmail, bidAmount, bidId, contractVersion, signedAt, note } = params;

  const subject = `New Bid: $${bidAmount.toLocaleString()} from ${bidderCompany}`;

  const text = [
    `New bid submitted for ${contractVersion}`,
    ``,
    `Bidder: ${bidderName}`,
    `Title: ${bidderTitle}`,
    `Company: ${bidderCompany}`,
    `Email: ${bidderEmail}`,
    `Amount: $${bidAmount.toLocaleString()}`,
    `Note: ${note || "(none)"}`,
    ``,
    `Bid ID: ${bidId}`,
    `Submitted: ${new Date(signedAt).toLocaleString("en-US")}`,
    ``,
    `Admin: https://dwtb.dev/admin`,
  ].join("\n");

  return { subject, text };
}
