"use client";

import { useInView } from "@/lib/hooks/use-in-view";

interface CaseStudy {
  industry: string;
  challenge: string;
  approach: string;
  result: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    industry: "Enterprise Freight Carrier",
    challenge: "Stalled outbound — reps sending generic emails to a cold list with <5% open rates.",
    approach: "Signal audit identified 23 accounts with active buying intent. Battlecards built. Proposals personalized to each account's gap.",
    result: "23 target accounts identified · 8 proposals shipped · 3 meetings booked in 30 days",
  },
  {
    industry: "Regional 3PL Provider",
    challenge: "Marketing spend with no attribution. No visibility into which channels drove pipeline.",
    approach: "GTM engine mapped all inbound signals to source. Rebuilt ICP. Reallocated budget toward highest-signal accounts.",
    result: "38 proposals shipped · 40 unique opens · $635K active pipeline in Q1",
  },
];

function CaseStudyCard({ study, index }: { study: CaseStudy; index: number }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`rounded-lg border border-border/50 bg-surface p-6 space-y-4 transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="font-mono text-xs text-accent uppercase tracking-wider">{study.industry}</div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-text-muted text-[11px] font-mono uppercase tracking-wider mb-1">Challenge</div>
          <p className="text-text-secondary">{study.challenge}</p>
        </div>
        <div>
          <div className="text-text-muted text-[11px] font-mono uppercase tracking-wider mb-1">Approach</div>
          <p className="text-text-secondary">{study.approach}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-border/50">
        <div className="font-mono text-xs text-accent">{study.result}</div>
      </div>
    </div>
  );
}

export function ProofSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">Results.</h2>
          <p className="text-text-muted mt-2 text-sm font-mono">Anonymized. Real data. Q1 2026.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {CASE_STUDIES.map((study, i) => (
            <CaseStudyCard key={study.industry} study={study} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
