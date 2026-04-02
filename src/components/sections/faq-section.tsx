"use client";

import { useState } from "react";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "What exactly am I bidding on?",
    a: "A Q2 2026 partnership slot with DWTB?! Studios — a 90-day GTM engagement covering signal intelligence, proposal production, content, creative, and campaign execution. Three slots exist. Bidding is competitive. The highest bids that Casey accepts win allocation.",
  },
  {
    q: "Why is this a competitive bid?",
    a: "Scarcity is real, not manufactured. Casey personally delivers and co-signs every engagement. Three partners per quarter is a hard ceiling. The bid structure creates genuine price discovery and ensures the partners who win are the ones most invested in the outcome.",
  },
  {
    q: "What happens if my bid isn't accepted?",
    a: "You'll be notified within 48 hours. If your bid is strong but there's no slot available, you'll be offered the waitlist. If a slot opens, you're first. You can also opt in for Q3 priority notification by emailing casey@dwtb.dev.",
  },
  {
    q: "How is my data protected?",
    a: "All submissions are SHA-256 hashed at signing. Your contract is stored with a tamper-evident integrity hash. PII is never exposed in market depth data. All API traffic is encrypted. Governing law is New York State.",
  },
  {
    q: "Can I start with a smaller engagement?",
    a: "Yes. The Founding Partner tier starts at a $7,500/mo floor — that's a 3-month commitment totaling $22,500 at minimum. If you want to start with a fixed-price deliverable before committing to a full quarter, reach out directly to discuss a custom arrangement.",
  },
  {
    q: "What does the payment schedule look like?",
    a: "50% upon acceptance, 50% by May 15, 2026. Accepted payment methods: Zelle (preferred), Venmo, or wire/ACH. Full payment instructions are sent with the acceptance email.",
  },
  {
    q: "Who is Casey Glarkin?",
    a: "GTM engineer, freight industry specialist, and founder of DWTB?! Studios. Former freight broker turned marketing operator. Built the signal intelligence engine that powers this platform. More in the video above — or skip to the bottom for the full operator note.",
  },
];

function FAQRow({ item, defaultOpen }: { item: FAQItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border-b border-border/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="font-mono text-sm text-text-secondary group-hover:text-white transition-colors">
          {item.q}
        </span>
        <svg
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 pr-8 font-mono text-sm text-text-muted leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-10">Questions.</h2>

        {/* Schema.org FAQ structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />

        <div className="divide-y-0">
          {FAQS.map((item, i) => (
            <FAQRow key={item.q} item={item} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
