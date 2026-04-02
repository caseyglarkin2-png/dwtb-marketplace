"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

interface BidStatus {
  bid_id: string;
  status: string;
  company: string;
  bid_amount: number;
  submitted_at: string;
  updated_at: string;
  receipt_url: string;
}

const STATUS_STEPS = ["submitted", "under_review", "decision", "onboarding"];

const STATUS_STEP_MAP: Record<string, number> = {
  submitted: 0,
  pending: 0,
  waitlisted: 1,
  accepted: 2,
  paid: 3,
  onboarded: 3,
  declined: 2,
  expired: 2,
};

const STATUS_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  submitted: { label: "Submitted", desc: "Your allocation request is in.", color: "text-blue-400" },
  pending: { label: "Submitted", desc: "Your allocation request is in.", color: "text-blue-400" },
  waitlisted: { label: "Waitlisted", desc: "You're on the waitlist. You'll be contacted if a slot opens.", color: "text-orange-400" },
  accepted: { label: "Accepted", desc: "Congrats — your allocation has been approved. Check your email for onboarding details.", color: "text-accent" },
  paid: { label: "Payment Received", desc: "Payment confirmed. Onboarding materials on their way.", color: "text-accent" },
  onboarded: { label: "Active", desc: "Q2 engagement is live.", color: "text-accent" },
  declined: { label: "Not Selected", desc: "This allocation was not selected. You'll be first in line for Q3.", color: "text-red-400" },
  expired: { label: "Expired", desc: "The offering window has closed.", color: "text-white/40" },
};

const STEP_LABELS = ["Submitted", "Under Review", "Decision", "Onboarding"];

function StatusTimeline({ status }: { status: string }) {
  const activeStep = STATUS_STEP_MAP[status] ?? 0;
  const isDeclined = status === "declined" || status === "expired";

  return (
    <div className="flex items-center gap-0 mt-6">
      {STEP_LABELS.map((label, i) => {
        const isPast = i < activeStep;
        const isCurrent = i === activeStep;
        const isFuture = i > activeStep;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-colors ${
                  isCurrent && isDeclined
                    ? "border-red-500 bg-red-500"
                    : isCurrent
                    ? "border-accent bg-accent"
                    : isPast
                    ? "border-accent bg-accent/30"
                    : "border-white/20 bg-transparent"
                }`}
              />
              <span
                className={`text-[10px] font-mono whitespace-nowrap ${
                  isCurrent
                    ? isDeclined
                      ? "text-red-400"
                      : "text-accent"
                    : isPast
                    ? "text-white/50"
                    : "text-white/20"
                } ${isFuture ? "" : ""}`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`flex-1 h-px mx-1 mt-[-14px] ${
                  isPast || isCurrent ? "bg-accent/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StatusPage() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BidStatus | null>(null);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/bids/status?ref=${encodeURIComponent(ref.trim())}&email=${encodeURIComponent(email.trim())}`
      );

      if (!res.ok) {
        setError("No allocation request found for this reference and email.");
        setResult(null);
      } else {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      setError("Unable to look up status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const statusInfo = result ? (STATUS_LABELS[result.status] ?? STATUS_LABELS["submitted"]) : null;

  return (
    <main className="min-h-screen bg-background text-white px-6 py-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/partners" className="text-xs text-white/30 font-mono hover:text-white/60 transition-colors">
            ← Back to offering
          </Link>
          <h1 className="text-3xl font-bold mt-4">Allocation Status</h1>
          <p className="text-white/50 mt-2 text-sm">
            Look up your request status using your reference ID and email.
          </p>
        </div>

        {/* Lookup form */}
        {!result && (
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-white/50 uppercase tracking-wider mb-2">
                Reference ID
              </label>
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="e.g. a1b2c3d4"
                required
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/60 transition-colors"
              />
              <p className="text-xs text-white/30 mt-1 font-mono">
                Found in your confirmation email or receipt PDF
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-white/50 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/60 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] rounded-lg bg-accent text-black font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Looking up..." : "Check Status"}
            </button>
          </form>
        )}

        {/* Result */}
        {result && statusInfo && (
          <div className="space-y-6">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${result.status === "accepted" || result.status === "paid" || result.status === "onboarded" ? "bg-accent animate-pulse" : result.status === "declined" || result.status === "expired" ? "bg-red-500" : "bg-blue-400"}`} />
              <span className={`font-mono text-sm font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            <p className="text-white/60 text-sm">{statusInfo.desc}</p>

            {/* Timeline */}
            <StatusTimeline status={result.status} />

            {/* Receipt card */}
            <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-white/40 font-mono">Reference</span>
                <span className="text-xs text-white font-mono">{result.bid_id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40 font-mono">Company</span>
                <span className="text-xs text-white font-mono">{result.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40 font-mono">Amount</span>
                <span className="text-xs text-accent font-mono font-bold">
                  ${result.bid_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40 font-mono">Submitted</span>
                <span className="text-xs text-white font-mono">
                  {new Date(result.submitted_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40 font-mono">Last Updated</span>
                <span className="text-xs text-white font-mono">
                  {new Date(result.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Context by status */}
            {result.status === "waitlisted" && (
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-orange-300/80">
                <p className="font-mono text-xs uppercase tracking-wider text-orange-400 mb-1">Waitlist Position</p>
                You will be contacted immediately if an allocation opens. Monitor your inbox including spam.
              </div>
            )}

            {(result.status === "accepted" || result.status === "paid") && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 text-sm text-white/70 space-y-2">
                <p className="font-mono text-xs uppercase tracking-wider text-accent mb-1">Onboarding Checklist</p>
                <ol className="list-decimal list-inside space-y-1 text-white/60 font-mono text-xs">
                  <li className={result.status === "paid" ? "line-through text-white/30" : ""}>Submit first payment (50% within 7 business days)</li>
                  <li>Schedule kickoff call with Casey</li>
                  <li>Complete ICP intake questionnaire</li>
                  <li>Q2 engagement begins April 1</li>
                </ol>
              </div>
            )}

            {(result.status === "declined" || result.status === "expired") && (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
                <p className="font-mono text-xs uppercase tracking-wider text-white/30 mb-1">Q3 2026 Availability</p>
                Want to be first in line for Q3? Email{" "}
                <a href="mailto:casey@dwtb.dev" className="text-accent hover:underline">
                  casey@dwtb.dev
                </a>
              </div>
            )}

            {/* PDF download (if accepted) */}
            {(result.status === "accepted" || result.status === "paid" || result.status === "onboarded") && (
              <a
                href={result.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center min-h-[48px] leading-[48px] rounded-lg border border-accent/30 bg-accent/10 font-semibold text-accent text-sm transition-opacity hover:opacity-80"
              >
                Download Signed Agreement (PDF)
              </a>
            )}

            {/* Look up another */}
            <button
              type="button"
              onClick={() => { setResult(null); setRef(""); setEmail(""); }}
              className="block w-full text-center text-xs text-white/30 font-mono hover:text-white/60 transition-colors"
            >
              Look up a different reference
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="mt-12 text-xs text-white/25 font-mono text-center">
          Questions? <a href="mailto:casey@dwtb.dev" className="text-accent/60 hover:text-accent">casey@dwtb.dev</a>
        </p>
      </div>
    </main>
  );
}
