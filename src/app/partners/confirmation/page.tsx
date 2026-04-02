"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface BidStatus {
  bid_id: string;
  status: string;
  bid_amount: number;
  company: string;
  contract_version: string;
  submitted_at: string;
  signed_at: string | null;
  receipt_url: string | null;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const email = searchParams.get("email");
  const [bidStatus, setBidStatus] = useState<BidStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref || !email) {
      setError("Missing bid reference or email.");
      setLoading(false);
      return;
    }

    fetch(`/api/bids/status?ref=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Bid not found");
        return r.json();
      })
      .then(setBidStatus)
      .catch(() => setError("Bid not found. Check your reference and email."))
      .finally(() => setLoading(false));
  }, [ref, email]);

  const statusDisplay: Record<string, { label: string; color: string }> = {
    submitted: { label: "Submitted", color: "text-[#00FFC2]" },
    pending_review: { label: "Under Review", color: "text-yellow-400" },
    accepted: { label: "Accepted", color: "text-green-400" },
    declined: { label: "Declined", color: "text-red-400" },
    waitlisted: { label: "Waitlisted", color: "text-orange-400" },
    expired: { label: "Expired", color: "text-white/40" },
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-bold text-white mb-8">Bid Status</h1>

        {loading && (
          <div className="text-white/50 font-mono">Loading...</div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-400">
            {error}
          </div>
        )}

        {bidStatus && (
          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Reference</span>
                <span className="text-white font-mono text-xs">
                  {bidStatus.bid_id}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Status</span>
                <span
                  className={`font-bold ${
                    statusDisplay[bidStatus.status]?.color || "text-white"
                  }`}
                >
                  {statusDisplay[bidStatus.status]?.label || bidStatus.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Bid Amount</span>
                <span className="text-white font-mono">
                  $
                  {Number(bidStatus.bid_amount).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Company</span>
                <span className="text-white">{bidStatus.company}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Submitted</span>
                <span className="text-white/70 text-xs font-mono">
                  {new Date(bidStatus.submitted_at).toLocaleString("en-US", {
                    timeZone: "America/New_York",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              {bidStatus.signed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Signed</span>
                  <span className="text-white/70 text-xs font-mono">
                    {new Date(bidStatus.signed_at).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </div>

            {bidStatus.receipt_url && (
              <a
                href={bidStatus.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-[#00FFC2] px-6 py-3 font-semibold text-black text-center transition-opacity hover:opacity-90"
              >
                Download Signed Contract
              </a>
            )}

            <p className="text-sm text-white/30 text-center">
              Status updates will be sent to your email on file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <span className="text-white/40 font-mono">Loading...</span>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
