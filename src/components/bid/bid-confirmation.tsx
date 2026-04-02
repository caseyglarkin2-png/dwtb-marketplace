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

  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#00FFC2]/30 bg-[#00FFC2]/10 px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-[#00FFC2] animate-pulse" />
        <span className="font-mono text-xs text-[#00FFC2] uppercase tracking-wider">
          {status === "waitlisted" ? "Waitlisted" : "Bid Submitted"}
        </span>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {status === "waitlisted"
            ? "Your Bid Is On the Waitlist"
            : "Your Bid Has Been Received"}
        </h2>
        <p className="text-white/60 max-w-md mx-auto">
          {status === "waitlisted"
            ? "All Q2 slots are currently spoken for. If a slot opens, you will be contacted immediately."
            : "Casey will review your submission and respond within 24 hours."}
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-6 max-w-sm mx-auto text-left space-y-3">
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

      <p className="text-xs text-white/30 font-mono">
        A confirmation email has been sent to your address.
        <br />
        Save your reference ID: {bidId.slice(0, 8)}
      </p>

      {bidderEmail && (
        <a
          href={`/api/bids/receipt/${bidId}?email=${encodeURIComponent(bidderEmail)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg border border-[#00FFC2]/30 bg-[#00FFC2]/10 px-6 py-3 font-semibold text-[#00FFC2] text-sm transition-opacity hover:opacity-80"
        >
          Download Signed Contract (PDF)
        </a>
      )}
    </div>
  );
}
