"use client";

import { useState, useEffect, useCallback } from "react";
import ContractPreview from "./contract-preview";
import ConsentCapture from "./consent-capture";
import BidConfirmation from "./bid-confirmation";
import { track } from "@/lib/analytics";

interface BidFlowProps {
  minBid: number;
  minIncrement: number;
  remainingSlots: number;
  deadline: string;
}

interface BidderInfo {
  name: string;
  title: string;
  company: string;
  email: string;
  amount: number;
  note: string;
}

interface SignData {
  typedName: string;
  consentGiven: boolean;
  signatureData: string;
}

interface SubmitResult {
  bid_id: string;
  status: string;
  signature_hash: string;
  contract_version: string;
  signed_at: string;
}

const DRAFT_KEY = "dwtb_bid_draft";
const IDEM_KEY = "dwtb_bid_idempotency_key";

function loadDraft(): Partial<BidderInfo> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Auto-expire after 24 hours
    if (parsed._ts && Date.now() - parsed._ts > 86400000) {
      localStorage.removeItem(DRAFT_KEY);
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveDraft(info: BidderInfo) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...info, _ts: Date.now() })
    );
  } catch {
    // Storage full or unavailable
  }
}

function getIdempotencyKey(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  let key = localStorage.getItem(IDEM_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(IDEM_KEY, key);
  }
  return key;
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(IDEM_KEY);
  } catch {
    // Ignore
  }
}

export default function BidFlow({
  minBid,
  minIncrement,
  remainingSlots,
  deadline,
}: BidFlowProps) {
  const [step, setStep] = useState(1);
  const [bidder, setBidder] = useState<BidderInfo>(() => {
    const draft = loadDraft();
    return {
      name: draft.name || "",
      title: draft.title || "",
      company: draft.company || "",
      email: draft.email || "",
      amount: draft.amount || minBid,
      note: draft.note || "",
    };
  });
  const [signData, setSignData] = useState<SignData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [highValueConfirmed, setHighValueConfirmed] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);

  // Draft persistence
  useEffect(() => {
    if (step < 4) saveDraft(bidder);
  }, [bidder, step]);

  // Back button history (F11)
  useEffect(() => {
    if (step === 5) return; // Confirmation — no back
    const handlePop = () => {
      setStep((s) => Math.max(1, s - 1));
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [step]);

  useEffect(() => {
    if (step > 1 && step < 5) {
      track("bid_step", { step });
      window.history.pushState({ step }, "", `?step=${step}`);
    }
  }, [step]);

  // Beforeunload guard (F11)
  useEffect(() => {
    if (step >= 2 && step < 5) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
  }, [step]);

  const updateBidder = useCallback(
    (field: keyof BidderInfo, value: string | number) => {
      setBidder((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Step 1 validation
  const step1Valid =
    bidder.name.length >= 2 &&
    bidder.title.length >= 2 &&
    bidder.company.length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bidder.email);

  // Step 2 validation
  const step2Valid = bidder.amount >= minBid;

  const handleSubmit = async () => {
    if (!signData) return;
    if (submitting) return; // prevent double submit
    setSubmitting(true);
    setSubmitError(null);
    setSubmitAttempts((a) => a + 1);

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidder_name: bidder.name,
          bidder_title: bidder.title,
          bidder_company: bidder.company,
          bidder_email: bidder.email,
          bid_amount: bidder.amount,
          note: bidder.note || undefined,
          typed_name: signData.typedName,
          consent_given: signData.consentGiven,
          signature_data: signData.signatureData,
          idempotency_key: getIdempotencyKey(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Duplicate / idempotent submission — treat as success
          if (data.bid_id) {
            setResult(data);
            setStep(5);
            clearDraft();
            window.history.replaceState({}, "", "?step=confirmed");
            return;
          }
          setSubmitError("This bid has already been submitted.");
        } else if (res.status === 429) {
          setSubmitError("Too many attempts. Please wait a moment and try again.");
        } else if (res.status === 403) {
          setSubmitError("The bid window has closed. Submissions are no longer accepted.");
        } else {
          setSubmitError(
            data.message || data.error || "Submission failed. Try again."
          );
        }
        return;
      }

      setResult(data);
      setStep(5);
      clearDraft();
      track("bid_submit_success", { bid_id: data.bid_id, amount: bidder.amount });
      window.history.replaceState({}, "", "?step=confirmed");
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
      track("bid_submit_fail", { error: "network", attempts: submitAttempts });
    } finally {
      setSubmitting(false);
    }
  };

  const amountFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(bidder.amount);

  const deadlineFormatted = new Date(deadline).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });

  // Step 5: Confirmation
  if (step === 5 && result) {
    return (
      <BidConfirmation
        bidId={result.bid_id}
        bidAmount={bidder.amount}
        status={result.status}
        contractVersion={result.contract_version}
        signedAt={result.signed_at}
        signatureHash={result.signature_hash}
        bidderEmail={bidder.email}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <nav aria-label={`Bid submission step ${step} of 4`} className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                s === step
                  ? "bg-[#00FFC2]"
                  : s < step
                  ? "bg-[#00FFC2]/40"
                  : "bg-white/10"
              }`}
            />
            {s < 4 && <div className="w-8 h-px bg-white/10" />}
          </div>
        ))}
      </nav>

      {/* Step 1: Review Offer */}
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Review the Offer</h3>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">What you get</span>
              <span className="text-white">
                DWTB?! Studios GTM engine — Q2 2026
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Slots remaining</span>
              <span className="text-[#00FFC2] font-mono">
                {remainingSlots} of 3
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Minimum bid</span>
              <span className="text-white font-mono">
                ${minBid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Increment</span>
              <span className="text-white font-mono">
                ${minIncrement.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Deadline</span>
              <span className="text-white font-mono">{deadlineFormatted}</span>
            </div>
          </div>

          <p className="text-sm text-white/50">
            Includes: account research, signal monitoring, asset production,
            campaign direction, and performance tracking for the full Q2 term.
          </p>

          <button
            onClick={() => setStep(2)}
            className="w-full rounded-lg bg-[#00FFC2] px-6 py-3 min-h-[48px] font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Continue to Bid Entry
          </button>
        </div>
      )}

      {/* Step 2: Enter Bid */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Enter Your Bid</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="bidder-name" className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                id="bidder-name"
                type="text"
                value={bidder.name}
                onChange={(e) => updateBidder("name", e.target.value)}
                aria-required="true"
                autoComplete="name"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none focus:ring-1 focus:ring-[#00FFC2]"
                placeholder="Casey Glarkin"
              />
            </div>

            <div>
              <label htmlFor="bidder-title" className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-1">
                Title
              </label>
              <input
                id="bidder-title"
                type="text"
                value={bidder.title}
                onChange={(e) => updateBidder("title", e.target.value)}
                aria-required="true"
                autoComplete="organization-title"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none focus:ring-1 focus:ring-[#00FFC2]"
                placeholder="VP of Marketing"
              />
            </div>

            <div>
              <label htmlFor="bidder-company" className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-1">
                Company
              </label>
              <input
                id="bidder-company"
                type="text"
                value={bidder.company}
                onChange={(e) => updateBidder("company", e.target.value)}
                aria-required="true"
                autoComplete="organization"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none focus:ring-1 focus:ring-[#00FFC2]"
                placeholder="Acme Freight"
              />
            </div>

            <div>
              <label htmlFor="bidder-email" className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                id="bidder-email"
                type="email"
                value={bidder.email}
                onChange={(e) => updateBidder("email", e.target.value)}
                aria-required="true"
                autoComplete="email"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none focus:ring-1 focus:ring-[#00FFC2]"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="bid-amount" className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-1">
                Bid Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  $
                </span>
                <input
                  id="bid-amount"
                  type="number"
                  value={bidder.amount}
                  onChange={(e) =>
                    updateBidder("amount", Number(e.target.value))
                  }
                  min={minBid}
                  step={minIncrement}
                  aria-required="true"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 pl-8 text-white font-mono placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none focus:ring-1 focus:ring-[#00FFC2]"
                />
              </div>
              {bidder.amount > 0 && bidder.amount < minBid && (
                <p className="mt-1 text-sm text-red-400">
                  Minimum bid is ${minBid.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bid-note" className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-1">
                Note (optional)
              </label>
              <textarea
                id="bid-note"
                value={bidder.note}
                onChange={(e) => updateBidder("note", e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none focus:ring-1 focus:ring-[#00FFC2] resize-none"
                placeholder="Anything Casey should know"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-white/20 px-6 py-3 min-h-[48px] text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!step1Valid || !step2Valid}
              className="flex-1 rounded-lg bg-[#00FFC2] px-6 py-3 min-h-[48px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Review + Sign Agreement
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review + Sign */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">
            Review + Sign Agreement
          </h3>

          <ContractPreview
            params={{
              bidderName: bidder.name,
              bidderTitle: bidder.title,
              bidderCompany: bidder.company,
              bidAmount: bidder.amount,
              date: new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
            }}
          />

          <ConsentCapture
            bidderName={bidder.name}
            onComplete={setSignData}
            isValid={!!signData}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-white/20 px-6 py-3 min-h-[48px] text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!signData}
              className="flex-1 rounded-lg bg-[#00FFC2] px-6 py-3 min-h-[48px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Continue to Confirm
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm + Submit */}
      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Confirm + Submit</h3>

          <div className="rounded-lg border border-[#00FFC2]/20 bg-[#00FFC2]/5 p-8 text-center space-y-2">
            <p className="text-sm text-white/50 font-mono uppercase tracking-wider">
              You are submitting an official bid of
            </p>
            <p className="text-4xl font-bold text-white font-mono">
              {amountFormatted}
            </p>
            <p className="text-sm text-white/40">
              This becomes binding if accepted by DWTB?! Studios.
            </p>
          </div>

          {/* High-value confirmation (F10) */}
          {bidder.amount > 50000 && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={highValueConfirmed}
                onChange={(e) => setHighValueConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-[#00FFC2] focus:ring-[#00FFC2] focus:ring-offset-0"
              />
              <span className="text-sm text-white/70">
                I confirm this high-value bid of {amountFormatted} is
                intentional.
              </span>
            </label>
          )}

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">Name</span>
              <span className="text-white">{bidder.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Company</span>
              <span className="text-white">{bidder.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Email</span>
              <span className="text-white">{bidder.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Bid</span>
              <span className="text-white font-mono">{amountFormatted}</span>
            </div>
          </div>

          {submitError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {submitError}
              {submitError.includes("Network error") && submitAttempts < 3 && (
                <button
                  onClick={handleSubmit}
                  className="block mt-2 text-accent underline text-xs hover:opacity-80"
                >
                  Retry submission
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="rounded-lg border border-white/20 px-6 py-3 min-h-[48px] text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                submitting || (bidder.amount > 50000 && !highValueConfirmed)
              }
              className="flex-1 rounded-lg bg-[#00FFC2] px-6 py-3 min-h-[48px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting
                ? "Submitting..."
                : "Submit Bid + Signed Agreement"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
