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
  accepted_at: string | null;
  paid_at: string | null;
  receipt_url: string | null;
}

const TIMELINE_STEPS = [
  { key: "submitted", label: "Submitted", icon: "01" },
  { key: "accepted", label: "Accepted", icon: "02" },
  { key: "paid", label: "Paid", icon: "03" },
  { key: "onboarded", label: "Onboarded", icon: "04" },
];

const STATUS_ORDER: Record<string, number> = {
  submitted: 0,
  accepted: 1,
  paid: 2,
  onboarded: 3,
  declined: -1,
  waitlisted: -2,
  expired: -3,
};

function StatusTimeline({ status }: { status: string }) {
  const currentIndex = STATUS_ORDER[status] ?? 0;
  const isTerminal = currentIndex < 0;

  if (isTerminal) {
    const terminalLabels: Record<string, { label: string; color: string }> = {
      declined: { label: "Declined", color: "text-red-400 border-red-400/40" },
      waitlisted: { label: "Waitlisted", color: "text-orange-400 border-orange-400/40" },
      expired: { label: "Expired", color: "text-white/40 border-white/10" },
    };
    const t = terminalLabels[status] || { label: status, color: "text-white/40 border-white/10" };
    return (
      <div className="flex items-center justify-center py-6">
        <div className={`rounded-full border-2 px-6 py-2 font-mono text-sm uppercase tracking-widest ${t.color}`}>
          {t.label}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-0 py-6 overflow-x-auto">
      {TIMELINE_STEPS.map((step, i) => {
        const stepIndex = STATUS_ORDER[step.key] ?? i;
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const isFuture = stepIndex > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-[#00FFC2] text-black"
                    : isCurrent
                      ? "border-2 border-[#00FFC2] text-[#00FFC2] shadow-[0_0_12px_rgba(0,255,194,0.3)]"
                      : "border border-white/15 text-white/25"
                }`}
              >
                {isCompleted ? "✓" : step.icon}
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider whitespace-nowrap ${
                  isCompleted
                    ? "text-[#00FFC2]/70"
                    : isCurrent
                      ? "text-white"
                      : "text-white/25"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 ${
                  isCompleted ? "bg-[#00FFC2]/50" : isFuture ? "bg-white/8" : "bg-white/15"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
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

  const showPaymentInfo = bidStatus && bidStatus.status === "accepted";

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[#00FFC2] font-mono text-xs uppercase tracking-[0.2em] mb-2">
            Allocation Status
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Your Partnership
          </h1>
        </div>

        {loading && (
          <div className="text-white/50 font-mono text-sm animate-pulse">
            Fetching status...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {bidStatus && (
          <div className="space-y-6">
            {/* Timeline */}
            <div className="rounded-lg border border-white/8 bg-white/[0.03] backdrop-blur-sm p-5">
              <StatusTimeline status={bidStatus.status} />
            </div>

            {/* Payment info — shown when accepted, awaiting payment */}
            {showPaymentInfo && (
              <div className="rounded-lg border border-[#00FFC2]/20 bg-[#00FFC2]/[0.03] p-5 space-y-3">
                <p className="text-[#00FFC2] font-mono text-xs uppercase tracking-wider">
                  Payment Instructions Sent
                </p>
                <p className="text-white/60 text-sm">
                  Check your email for the attached payment instructions PDF with
                  accepted methods (Zelle, Venmo, wire transfer) and payment schedule.
                </p>
                <div className="flex justify-between text-sm pt-2 border-t border-white/8">
                  <span className="text-white/35">Installment 1</span>
                  <span className="text-white/80 font-mono text-xs">
                    ${Math.round(bidStatus.bid_amount / 2).toLocaleString()} — due 7 days
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/35">Installment 2</span>
                  <span className="text-white/80 font-mono text-xs">
                    ${Math.round(bidStatus.bid_amount / 2).toLocaleString()} — due May 15
                  </span>
                </div>
              </div>
            )}

            {/* Details card */}
            <div className="rounded-lg border border-white/8 bg-white/[0.03] backdrop-blur-sm p-5 space-y-3">
              <DetailRow label="Reference" value={bidStatus.bid_id} mono />
              <DetailRow
                label="Allocation"
                value={`$${Number(bidStatus.bid_amount).toLocaleString("en-US")}`}
                mono
              />
              <DetailRow label="Company" value={bidStatus.company} />
              <DetailRow label="Contract" value={bidStatus.contract_version} mono />
              {bidStatus.submitted_at && (
                <DetailRow
                  label="Submitted"
                  value={formatDate(bidStatus.submitted_at)}
                  mono
                />
              )}
              {bidStatus.signed_at && (
                <DetailRow
                  label="Signed"
                  value={formatDate(bidStatus.signed_at)}
                  mono
                />
              )}
              {bidStatus.accepted_at && (
                <DetailRow
                  label="Accepted"
                  value={formatDate(bidStatus.accepted_at)}
                  mono
                />
              )}
              {bidStatus.paid_at && (
                <DetailRow
                  label="Fully Paid"
                  value={formatDate(bidStatus.paid_at)}
                  mono
                />
              )}
            </div>

            {/* Download contract */}
            {bidStatus.receipt_url && email && (
              <a
                href={`${bidStatus.receipt_url}?email=${encodeURIComponent(email)}`}
                className="block w-full rounded-lg bg-[#00FFC2] px-6 py-3 font-semibold text-black text-center transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(0,255,194,0.2)]"
              >
                Download Signed Contract
              </a>
            )}

            <p className="text-xs text-white/25 text-center font-mono">
              Status updates sent to your email on file · SHA-256 Secured
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm gap-4">
      <span className="text-white/35 shrink-0">{label}</span>
      <span
        className={`text-white/80 text-right truncate ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <span className="text-white/40 font-mono animate-pulse">
            Loading...
          </span>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
