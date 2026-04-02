"use client";

import { useState } from "react";

interface BidFormProps {
  minBid: number;
  minIncrement: number;
}

interface BidFormData {
  bidderName: string;
  bidderTitle: string;
  bidderCompany: string;
  bidderEmail: string;
  bidAmount: string;
  note: string;
}

export function BidForm({ minBid }: BidFormProps) {
  const [form, setForm] = useState<BidFormData>({
    bidderName: "",
    bidderTitle: "",
    bidderCompany: "",
    bidderEmail: "",
    bidAmount: "",
    note: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BidFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BidFormData, string>> = {};
    if (!form.bidderName.trim()) newErrors.bidderName = "Required";
    if (!form.bidderTitle.trim()) newErrors.bidderTitle = "Required";
    if (!form.bidderCompany.trim()) newErrors.bidderCompany = "Required";
    if (!form.bidderEmail.trim()) newErrors.bidderEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.bidderEmail))
      newErrors.bidderEmail = "Invalid email";

    const amount = parseFloat(form.bidAmount);
    if (!form.bidAmount) newErrors.bidAmount = "Required";
    else if (isNaN(amount) || amount < minBid)
      newErrors.bidAmount = `Minimum bid is $${minBid.toLocaleString()}`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Sprint 2: wire to bid flow
    // For now, advance to contract review step will go here
  };

  const update = (field: keyof BidFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Your Name"
          value={form.bidderName}
          onChange={(v) => update("bidderName", v)}
          error={errors.bidderName}
          required
        />
        <Field
          label="Title"
          value={form.bidderTitle}
          onChange={(v) => update("bidderTitle", v)}
          error={errors.bidderTitle}
          required
        />
        <Field
          label="Company"
          value={form.bidderCompany}
          onChange={(v) => update("bidderCompany", v)}
          error={errors.bidderCompany}
          required
        />
        <Field
          label="Email"
          type="email"
          value={form.bidderEmail}
          onChange={(v) => update("bidderEmail", v)}
          error={errors.bidderEmail}
          required
        />
      </div>

      <Field
        label="Bid Amount (USD)"
        type="number"
        value={form.bidAmount}
        onChange={(v) => update("bidAmount", v)}
        error={errors.bidAmount}
        prefix="$"
        required
      />

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Note (optional)
        </label>
        <textarea
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          rows={3}
          className="w-full bg-surface-raised border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
          placeholder="Anything else you want DWTB?! Studios to know"
        />
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-accent text-surface font-semibold text-lg rounded-lg hover:bg-accent/90 transition-colors"
      >
        Continue to Agreement Review →
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  required,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-surface-raised border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${
            prefix ? "pl-8" : ""
          } ${error ? "border-danger" : "border-border"}`}
        />
      </div>
      {error && (
        <p className="text-danger text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
