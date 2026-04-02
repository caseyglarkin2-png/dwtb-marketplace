"use client";

import { useInView } from "@/lib/hooks/use-in-view";

const BADGES = [
  {
    label: "ESIGN Act Compliant",
    detail: "15 U.S.C. § 7001",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "SHA-256 Contract Binding",
    detail: "Tamper-evident hash",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    label: "NY State Governing Law",
    detail: "Jurisdiction: New York",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.71.71M18.36 18.36l.71.71M1 12h1M21 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    label: "SOC 2 Aligned Practices",
    detail: "Security-first operations",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Full Audit Trail",
    detail: "Every action timestamped",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export function TrustSignals() {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-8 px-6 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {BADGES.map((badge, i) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 text-white/30 transition-all duration-500"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="text-white/20">{badge.icon}</span>
              <div>
                <div className="font-mono text-[11px] text-white/50">{badge.label}</div>
                <div className="font-mono text-[10px] text-white/25">{badge.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
