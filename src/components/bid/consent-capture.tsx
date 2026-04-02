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

  return (
    <div className="space-y-6">
      {/* Consent checkboxes */}
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={consent1}
            onChange={(e) => {
              setConsent1(e.target.checked);
              notifyParent({ c1: e.target.checked });
            }}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-[#00FFC2] focus:ring-[#00FFC2] focus:ring-offset-0"
          />
          <span className="text-sm text-white/70 group-hover:text-white/90">
            I have reviewed the Q2 Partnership Agreement and understand that
            this signed bid, if accepted by DWTB?! Studios, constitutes a
            binding agreement at the submitted bid amount.
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
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-[#00FFC2] focus:ring-[#00FFC2] focus:ring-offset-0"
          />
          <span className="text-sm text-white/70 group-hover:text-white/90">
            I consent to sign this agreement electronically in accordance with
            the ESIGN Act (15 U.S.C. § 7001 et seq.) and understand my
            electronic signature has the same legal effect as a handwritten
            signature.
          </span>
        </label>
      </div>

      {/* Typed name (F14: triple intent) */}
      <div>
        <label className="block text-sm text-white/60 font-mono uppercase tracking-wider mb-2">
          Type your full name to confirm
        </label>
        <input
          type="text"
          value={typedName}
          onChange={(e) => {
            setTypedName(e.target.value);
            notifyParent({ tn: e.target.value });
          }}
          placeholder={bidderName}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none focus:ring-1 focus:ring-[#00FFC2]"
        />
        {typedName.length > 0 && !nameMatch && (
          <p className="mt-1 text-sm text-red-400">
            Name does not match. Please type: {bidderName}
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

      {/* Validation indicator */}
      {!allValid && (
        <p className="text-xs text-white/40 font-mono">
          {!consent1 && "☐ Review consent required. "}
          {!consent2 && "☐ E-sign consent required. "}
          {!nameMatch && typedName.length > 0 && "☐ Name must match. "}
          {!signatureData && "☐ Signature required."}
        </p>
      )}
    </div>
  );
}
