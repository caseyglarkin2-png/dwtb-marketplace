"use client";

import { renderContractText, type ContractParams } from "@/lib/contract-text";
import { useMemo } from "react";

interface ContractPreviewProps {
  params: ContractParams;
}

export default function ContractPreview({ params }: ContractPreviewProps) {
  const text = useMemo(() => renderContractText(params), [params]);

  return (
    <div className="w-full rounded-lg border border-white/10 bg-white/5 p-4 md:p-6 overflow-y-auto max-h-[50vh] md:max-h-[60vh] -webkit-overflow-scrolling-touch">
      <pre
        className="whitespace-pre-wrap font-mono text-xs md:text-sm text-white/80 leading-relaxed"
        style={{ tabSize: 4 }}
      >
        {text}
      </pre>
    </div>
  );
}
