"use client";

interface BidConfirmationProps {
  bidId: string;
  bidAmount: number;
  status: string;
  contractVersion: string;
  signedAt: string;
  signatureHash: string;
  bidderEmail?: string;
}

export default function BidConfirmation({
  bidId,
  bidAmount,
  status,
  contractVersion,
  signedAt,
  bidderEmail,
}: BidConfirmationProps) {
  const amountFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(bidAmount);

  const isWaitlisted = status === "waitlisted";

  return (
    <div className="text-center space-y-8">
      {/* Status badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <span className="font-mono text-xs text-accent uppercase tracking-wider">
          {isWaitlisted ? "Waitlisted" : "Request Submitted"}
        </span>
      </div>

      {/* Heading */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {isWaitlisted
            ? "You're on the Waitlist"
            : "You're In."}
        </h2>
        <p className="text-white/50 max-w-md mx-auto">
          {isWaitlisted
            ? "All Q2 allocations are currently spoken for. If a slot opens, you'll be contacted immediately."
            : "Casey will review your request and respond within 24 hours."}
        </p>
      </div>

      {/* Receipt card */}
      <div className="rounded-lg border border-accent/20 bg-gradient-to-b from-accent/5 to-transparent p-6 max-w-sm mx-auto text-left space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-white/40 font-mono">Amount</span>
          <span className="text-sm text-white font-mono">{amountFormatted}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-white/40 font-mono">Reference</span>
          <span className="text-sm text-white font-mono truncate ml-4">
            {bidId.slice(0, 8)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-white/40 font-mono">Contract</span>
          <span className="text-sm text-white font-mono">{contractVersion}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-white/40 font-mono">Signed</span>
          <span className="text-sm text-white font-mono">
            {new Date(signedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* What happens next */}
      {!isWaitlisted && (
        <div className="max-w-sm mx-auto text-left rounded-lg border border-white/8 bg-white/[0.02] p-5 space-y-3">
          <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
            What happens next
          </p>
          <div className="space-y-3">
            {[
              { time: "Within 24h", text: "Casey reviews your request" },
              { time: "Within 48h", text: "If accepted: onboarding details + invoice sent" },
              { time: "Within 7 days", text: "First payment (50%) due upon acceptance" },
              { time: "April 1", text: "Q2 engagement begins" },
            ].map(({ time, text }) => (
              <div key={time} className="flex items-start gap-3">
                <span className="flex-shrink-0 text-[10px] font-mono text-accent/60 uppercase w-16 pt-0.5">
                  {time}
                </span>
                <span className="text-sm text-white/50">{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-white/25 font-mono">
        Confirmation sent to your email · Reference ID: {bidId.slice(0, 8)}
      </p>

      {/* Status portal link */}
      <a
        href="/status"
        className="inline-block text-sm text-accent/60 font-mono hover:text-accent transition-colors"
      >
        Track your request status →
      </a>

      {bidderEmail && (
        <a
          href={`/api/bids/receipt/${bidId}?email=${encodeURIComponent(bidderEmail)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg border border-accent/30 bg-accent/10 px-6 py-3 min-h-[48px] font-semibold text-accent text-sm transition-opacity hover:opacity-80 active:scale-[0.98]"
        >
          Download Signed Agreement (PDF)
        </a>
      )}
    </div>
  );
}
