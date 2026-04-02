"use client";

import {
  getContractSections,
  type ContractParams,
} from "@/lib/contract-text";
import { CONTRACT_VERSION } from "@/lib/constants";
import { useMemo, useState } from "react";

interface ContractPreviewProps {
  params: ContractParams;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ContractPreview({ params }: ContractPreviewProps) {
  const sections = useMemo(() => getContractSections(params), [params]);
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    return new Set(sections.filter((s) => s.defaultOpen).map((s) => s.id));
  });

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () =>
    setOpenSections(new Set(sections.map((s) => s.id)));
  const collapseAll = () => setOpenSections(new Set());

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-mono text-white/50 uppercase tracking-wider">
            Q2 2026 Partnership Agreement
          </h4>
          <p className="text-xs text-white/30 font-mono mt-0.5">
            Version {CONTRACT_VERSION} · 10 sections
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-white/30 hover:text-white/60 font-mono transition-colors"
          >
            Expand all
          </button>
          <span className="text-white/10">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-white/30 hover:text-white/60 font-mono transition-colors"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-1">
        {sections.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div
              key={section.id}
              className="rounded-lg border border-white/8 bg-white/[0.03] overflow-hidden transition-colors hover:border-white/12"
            >
              {/* Section header — always visible */}
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left group"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/8 flex items-center justify-center">
                  <span className="text-xs font-mono text-white/50">
                    {section.number}
                  </span>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                      {section.title}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">
                    {section.summary}
                  </p>
                </div>
                <ChevronIcon open={isOpen} />
              </button>

              {/* Section body — expandable */}
              {isOpen && (
                <div className="px-4 pb-4 pt-0">
                  <div className="pl-9">
                    <div className="border-t border-white/6 pt-3">
                      <pre className="whitespace-pre-wrap font-mono text-xs text-white/60 leading-relaxed">
                        {section.body}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Read-time estimate */}
      <p className="text-xs text-white/25 font-mono text-center pt-1">
        ~2 min read · Plain language · No surprises
      </p>
    </div>
  );
}
