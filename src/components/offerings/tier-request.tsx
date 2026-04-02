"use client";

import { useState, useEffect, useRef } from "react";
import type { TierId } from "@/lib/constants";
import { TIERS } from "@/lib/constants";

interface TierRequestProps {
  tier: TierId;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  brief: string;
}

export function TierRequestModal({ tier, onClose }: TierRequestProps) {
  const [form, setForm] = useState<FormState>({ name: "", email: "", company: "", brief: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input on mount; close on Escape
  useEffect(() => {
    firstInputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const selectedTier = TIERS[tier];

  const isValid =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.company.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          tier,
          message: form.brief.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Request info — ${selectedTier.name}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <p className="text-xs font-mono text-accent tracking-widest mb-1">TIER REQUEST</p>
            <h2 className="text-xl font-bold text-white">{selectedTier.name}</h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">
              ${selectedTier.bidFloor.toLocaleString()}/mo · {selectedTier.termMonths}-month term
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1 -mr-1 -mt-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-accent" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Request received.</h3>
                <p className="text-sm text-white/50">
                  We'll be in touch at <span className="text-white/70">{form.email}</span> within 24 hours.
                </p>
              </div>
              <div className="pt-2">
                <p className="text-xs text-white/30 mb-3">Ready to lock in your allocation?</p>
                <a
                  href="#bid"
                  onClick={onClose}
                  className="inline-block text-sm font-semibold text-accent border border-accent/30 rounded-lg px-5 py-2.5 hover:bg-accent/10 transition-colors"
                >
                  Start full application →
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/50 mb-1.5" htmlFor="tr-name">
                  Full Name *
                </label>
                <input
                  ref={firstInputRef}
                  id="tr-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-surface-raised border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="Casey Smith"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/50 mb-1.5" htmlFor="tr-email">
                  Work Email *
                </label>
                <input
                  id="tr-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-surface-raised border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="casey@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/50 mb-1.5" htmlFor="tr-company">
                  Company *
                </label>
                <input
                  id="tr-company"
                  type="text"
                  autoComplete="organization"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full bg-surface-raised border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="Acme Logistics LLC"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/50 mb-1.5" htmlFor="tr-brief">
                  What's your goal? <span className="text-white/20">(optional)</span>
                </label>
                <textarea
                  id="tr-brief"
                  rows={3}
                  value={form.brief}
                  onChange={(e) => setForm((f) => ({ ...f, brief: e.target.value }))}
                  className="w-full bg-surface-raised border border-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                  placeholder="We want to reach freight decision-makers in the Midwest..."
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full py-3 px-6 rounded-lg font-semibold text-sm bg-accent text-surface hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {submitting ? "Sending…" : "Request Info"}
              </button>

              <p className="text-xs text-white/25 text-center">
                No commitment. We'll reach out to discuss fit before you sign anything.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
