"use client";

import { useState, useEffect, useCallback } from "react";
import ContractPreview from "./contract-preview";
import ConsentCapture from "./consent-capture";
import BidConfirmation from "./bid-confirmation";
import { track } from "@/lib/analytics";
import { TIERS, TIER_ORDER, type TierId } from "@/lib/constants";

interface BidFlowProps {
  remainingSlots: number;
  totalSlots: number;
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
    localStorage.removeItem("dwtb_bid_tier");
  } catch {
    // Ignore
  }
}

export default function BidFlow({
  remainingSlots,
  totalSlots,
  deadline,
}: BidFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<TierId | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const v = localStorage.getItem("dwtb_bid_tier");
      if (v === "founding" || v === "growth" || v === "enterprise") return v;
    } catch {}
    return null;
  });
  const [isBuyItNow, setIsBuyItNow] = useState(false);
  const [bidder, setBidder] = useState<BidderInfo>(() => {
    const draft = loadDraft();
    return {
      name: draft.name || "",
      title: draft.title || "",
      company: draft.company || "",
      email: draft.email || "",
      amount: draft.amount || 0,
      note: draft.note || "",
    };
  });
  const [signData, setSignData] = useState<SignData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitRetryable, setSubmitRetryable] = useState(false);
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

  const tierFloor = selectedTier ? TIERS[selectedTier].bidFloor : 0;

  // Save tier choice
  useEffect(() => {
    if (selectedTier) {
      try { localStorage.setItem("dwtb_bid_tier", selectedTier); } catch {}
    }
  }, [selectedTier]);

  // Step 2 validation (details + amount)
  const detailsValid =
    bidder.name.length >= 2 &&
    bidder.title.length >= 2 &&
    bidder.company.length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bidder.email) &&
    bidder.amount >= tierFloor &&
    tierFloor > 0;

  const handleSubmit = async () => {
    if (!signData) return;
    if (submitting) return; // prevent double submit
    setSubmitting(true);
    setSubmitError(null);
    setSubmitRetryable(false);
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
          tier: selectedTier,
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
          setSubmitError("This request has already been submitted.");
        } else if (res.status === 429) {
          setSubmitError("Too many attempts. Please wait a moment and try again.");
        } else if (res.status === 403) {
          setSubmitError("The offering period has closed. Requests are no longer accepted.");
        } else {
          setSubmitError(
            data.message || data.error || "Submission failed. Try again."
          );
          if (data.retry) setSubmitRetryable(true);
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
      setSubmitRetryable(true);
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
    <>
      {/* Focus mode overlay — dims the page when user is in the deal room */}
      {step >= 2 && step < 5 && (
        <div className="fixed inset-0 bg-black/30 z-30 pointer-events-none animate-[fadeIn_0.3s_ease-out]" />
      )}

      <div className={`space-y-8 relative ${step >= 2 && step < 5 ? "z-35" : ""}`}>
        {/* Step label */}
        <div className="text-center">
          <span className="font-mono text-xs text-accent tracking-widest">
            STEP {step} OF 4
          </span>
        </div>

        {/* Step indicator */}
      <nav aria-label={`Step ${step} of 4`} className="flex items-center justify-center gap-2">
        {[
          { n: 1, label: "Tier" },
          { n: 2, label: "Details" },
          { n: 3, label: "Agreement" },
          { n: 4, label: "Confirm" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  n === step
                    ? "bg-accent ring-2 ring-accent/30"
                    : n < step
                    ? "bg-accent/50"
                    : "bg-white/10"
                }`}
              />
              <span className={`text-[10px] font-mono tracking-wider transition-colors ${
                n === step ? "text-accent" : "text-white/25"
              }`}>
                {label}
              </span>
            </div>
            {n < 4 && <div className="w-8 h-px bg-white/10 mb-4" />}
          </div>
        ))}
      </nav>

      {/* Step 1: Choose Tier */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Select Your Tier</h3>
            <p className="text-sm text-white/40 mt-1">
              {remainingSlots} of {totalSlots} slots remaining · Closes {deadlineFormatted}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIER_ORDER.map((tid) => {
              const t = TIERS[tid];
              const isSelected = selectedTier === tid;
              return (
                <div
                  key={tid}
                  className={`relative rounded-lg border p-5 space-y-4 transition-all cursor-pointer ${
                    isSelected
                      ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                  onClick={() => {
                    setSelectedTier(tid);
                    setIsBuyItNow(false);
                    setBidder((prev) => ({ ...prev, amount: t.bidFloor }));
                  }}
                >
                  {tid === "growth" && (
                    <span className="absolute -top-2.5 left-4 bg-accent text-black text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
                      Most Popular
                    </span>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-white">{t.name}</h4>
                    <p className="text-xs text-white/30 font-mono">{t.slotLabel} · {t.termMonths}-month term</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-white font-mono">
                      ${t.bidFloor.toLocaleString()}<span className="text-sm text-white/40 font-normal">/mo</span>
                    </p>
                    <p className="text-xs text-white/30 font-mono">Floor — or bid higher</p>
                  </div>
                  <ul className="space-y-1.5">
                    {t.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs text-white/60">
                        <span className="text-accent text-xs mt-0.5">✓</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier(tid);
                        setIsBuyItNow(false);
                        setBidder((prev) => ({ ...prev, amount: t.bidFloor }));
                        setStep(2);
                      }}
                      className={`w-full rounded-lg px-4 py-2.5 min-h-[44px] font-semibold text-sm transition-all ${
                        isSelected
                          ? "bg-accent text-black hover:opacity-90"
                          : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      Select & Continue →
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier(tid);
                        setIsBuyItNow(true);
                        setBidder((prev) => ({ ...prev, amount: t.buyItNow }));
                        setStep(2);
                      }}
                      className="w-full rounded-lg border border-accent/30 px-4 py-2 min-h-[40px] text-accent text-xs font-mono hover:bg-accent/5 transition-all"
                    >
                      Buy It Now · ${t.buyItNow.toLocaleString()}/mo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Your Details + Amount */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Your Details</h3>
            <p className="text-sm text-white/40 mt-1">
              Takes about 60 seconds. Your draft auto-saves.
            </p>
          </div>

          {/* Selected tier banner */}
          {selectedTier && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-white/40 font-mono uppercase tracking-wider">Selected tier</span>
                <p className="text-sm text-white font-semibold">{TIERS[selectedTier].name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white font-mono">
                  {isBuyItNow ? `$${TIERS[selectedTier].buyItNow.toLocaleString()}/mo` : `$${tierFloor.toLocaleString()}/mo floor`}
                </p>
                {isBuyItNow && <span className="text-[10px] text-accent font-mono">BUY IT NOW</span>}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bidder-name" className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  id="bidder-name"
                  type="text"
                  value={bidder.name}
                  onChange={(e) => updateBidder("name", e.target.value)}
                  aria-required="true"
                  autoComplete="name"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Jane Smith"
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
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="VP of Marketing"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bid-amount" className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-1">
                Your Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono">
                  $
                </span>
                <input
                  id="bid-amount"
                  type="number"
                  value={bidder.amount}
                  onChange={(e) =>
                    updateBidder("amount", Number(e.target.value))
                  }
                  min={tierFloor}
                  step={500}
                  aria-required="true"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 pl-8 text-white text-lg font-mono placeholder:text-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <p className="mt-1 text-xs text-white/30 font-mono">
                {selectedTier && TIERS[selectedTier].name} floor: ${tierFloor.toLocaleString()}/mo · 50% on acceptance, 50% at midpoint
              </p>
              {bidder.amount > 0 && bidder.amount < tierFloor && (
                <p className="mt-1 text-sm text-red-400">
                  Floor price for this tier is ${tierFloor.toLocaleString()}/mo
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bid-note" className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-1">
                Note to Casey <span className="text-white/30">(optional)</span>
              </label>
              <textarea
                id="bid-note"
                value={bidder.note}
                onChange={(e) => updateBidder("note", e.target.value)}
                rows={2}
                maxLength={2000}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                placeholder="Context about your goals, timeline, or what you're looking for"
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
              disabled={!detailsValid}
              className="flex-1 rounded-lg bg-accent px-6 py-3 min-h-[48px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Review Agreement →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review + Sign */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">
              Partnership Agreement
            </h3>
            <p className="text-sm text-white/40 mt-1">
              10 sections, plain language, no legalese. Expand any section to read the full terms.
            </p>
          </div>

          {/* Quick summary bar */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Term", value: "Q2 2026 (90 days)" },
              { label: "Amount", value: amountFormatted },
              { label: "Payment", value: "50/50 split" },
              { label: "Exit", value: "30 days notice" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md bg-white/5 border border-white/8 px-3 py-1.5">
                <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">{label}</span>
                <p className="text-xs text-white/70 font-mono">{value}</p>
              </div>
            ))}
          </div>

          <ContractPreview
            params={{
              bidderName: bidder.name,
              bidderTitle: bidder.title,
              bidderCompany: bidder.company,
              bidAmount: bidder.amount,
              tier: selectedTier || undefined,
              date: new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
            }}
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30 font-mono uppercase tracking-wider">Sign below</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

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
              className="flex-1 rounded-lg bg-accent px-6 py-3 min-h-[48px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Review + Submit →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm + Submit */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Final Review</h3>
            <p className="text-sm text-white/40 mt-1">
              Confirm everything looks right, then submit.
            </p>
          </div>

          <div className="rounded-lg border border-accent/20 bg-accent/5 p-8 text-center space-y-2">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
              {selectedTier ? TIERS[selectedTier].name : "Allocation request"}{isBuyItNow ? " · Buy It Now" : ""}
            </p>
            <p className="text-4xl font-bold text-white font-mono">
              {amountFormatted}<span className="text-lg text-white/40">/mo</span>
            </p>
            <p className="text-sm text-white/40">
              {selectedTier ? `${TIERS[selectedTier].termMonths}-month term` : ""} · Binding if accepted · 50% due on acceptance · 50% May 15
            </p>
          </div>

          {/* High-value confirmation (F10) */}
          {bidder.amount > 50000 && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={highValueConfirmed}
                onChange={(e) => setHighValueConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-offset-0"
              />
              <span className="text-sm text-white/70">
                I confirm this allocation request of {amountFormatted} is intentional.
              </span>
            </label>
          )}

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 text-sm">
            {selectedTier && (
              <div className="flex justify-between">
                <span className="text-white/40">Tier</span>
                <span className="text-white">{TIERS[selectedTier].name}{isBuyItNow ? " (BIN)" : ""}</span>
              </div>
            )}
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
              <span className="text-white/40">Amount</span>
              <span className="text-white font-mono">{amountFormatted}</span>
            </div>
          </div>

          {/* What happens next */}
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4 space-y-3">
            <p className="text-xs text-white/50 font-mono uppercase tracking-wider">
              After you submit
            </p>
            <div className="space-y-2">
              {[
                { step: "1", text: "Casey reviews your request within 24 hours" },
                { step: "2", text: "If accepted, onboarding details within 48 hours" },
                { step: "3", text: "Engagement begins upon mutual confirmation" },
              ].map(({ step: s, text }) => (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/8 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-white/40">{s}</span>
                  </span>
                  <span className="text-white/50">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {submitError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {submitError}
              {submitRetryable && submitAttempts < 3 && (
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
              className="flex-1 rounded-lg bg-accent px-6 py-3 min-h-[48px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting
                ? "Submitting..."
                : "Submit Allocation Request"}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
