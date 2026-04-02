"use client";

import { useState } from "react";
import SignaturePad from "./signature-pad";

interface ConsentCaptureProps {
  bidderName: string;
  onComplete: (data: {
    typedName: string;
    consentGiven: boolean;
    signatureData: string;
  }) => void;
  isValid: boolean;
}

export default function ConsentCapture({
  bidderName,
  onComplete,
  isValid: _parentIsValid,
}: ConsentCaptureProps) {
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const nameMatch =
    typedName.toLowerCase() === bidderName.toLowerCase();
  const allValid = consent1 && consent2 && nameMatch && !!signatureData;

  // Notify parent whenever state changes
  const notifyParent = (updates: {
    c1?: boolean;
    c2?: boolean;
    tn?: string;
    sig?: string | null;
  }) => {
    const c1 = updates.c1 ?? consent1;
    const c2 = updates.c2 ?? consent2;
    const tn = updates.tn ?? typedName;
    const sig = updates.sig !== undefined ? updates.sig : signatureData;
    const nm = tn.toLowerCase() === bidderName.toLowerCase();

    if (c1 && c2 && nm && sig) {
      onComplete({
        typedName: tn,
        consentGiven: true,
        signatureData: sig,
      });
    }
  };

  // Count completed steps for progress
  const completedCount = [consent1, consent2, nameMatch && typedName.length > 0, !!signatureData].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 w-6 rounded-full transition-all ${
                i < completedCount ? "bg-[#00FFC2]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-white/30 font-mono">
          {completedCount}/4
        </span>
      </div>

      {/* Consent checkboxes — simplified language */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={consent1}
            onChange={(e) => {
              setConsent1(e.target.checked);
              notifyParent({ c1: e.target.checked });
            }}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-[#00FFC2] focus:ring-[#00FFC2] focus:ring-offset-0"
          />
          <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
            I&apos;ve reviewed the agreement and understand this becomes binding if accepted.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={consent2}
            onChange={(e) => {
              setConsent2(e.target.checked);
              notifyParent({ c2: e.target.checked });
            }}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-[#00FFC2] focus:ring-[#00FFC2] focus:ring-offset-0"
          />
          <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
            I consent to e-sign per the ESIGN Act.{" "}
            <span className="text-white/30">
              (Same legal weight as ink on paper.)
            </span>
          </span>
        </label>
      </div>

      {/* Typed name */}
      <div>
        <label className="block text-sm text-white/50 font-mono uppercase tracking-wider mb-1.5">
          Type your full name
        </label>
        <input
          type="text"
          value={typedName}
          onChange={(e) => {
            setTypedName(e.target.value);
            notifyParent({ tn: e.target.value });
          }}
          placeholder={bidderName}
          className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-white placeholder:text-white/15 focus:outline-none focus:ring-1 transition-colors ${
            nameMatch && typedName.length > 0
              ? "border-[#00FFC2]/40 focus:border-[#00FFC2] focus:ring-[#00FFC2]"
              : "border-white/20 focus:border-[#00FFC2] focus:ring-[#00FFC2]"
          }`}
        />
        {typedName.length > 0 && !nameMatch && (
          <p className="mt-1 text-xs text-white/40">
            Must match: <span className="text-white/60">{bidderName}</span>
          </p>
        )}
        {nameMatch && typedName.length > 0 && (
          <p className="mt-1 text-xs text-[#00FFC2]/60">
            ✓ Name confirmed
          </p>
        )}
      </div>

      {/* Signature pad */}
      <SignaturePad
        onChange={(data) => {
          setSignatureData(data);
          notifyParent({ sig: data });
        }}
      />

      {/* Completion indicator */}
      {allValid && (
        <p className="text-xs text-[#00FFC2]/70 font-mono text-center">
          ✓ Ready to proceed
        </p>
      )}
    </div>
  );
}
