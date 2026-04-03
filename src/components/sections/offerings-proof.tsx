"use client";

export default function OfferingsProof() {
  return (
    <section className="py-16 px-6 max-w-6xl mx-auto space-y-12">
      {/* Headline */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          What the System Actually Does
        </h2>
        <p className="text-white/50 font-mono text-sm">
          We measure commercial outcomes, not vanity metrics.
        </p>
      </div>

      {/* Proof Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Engagement Response */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
              Cold Engagement Response Rate
            </p>
            <p className="text-3xl font-bold text-accent font-mono">64%</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Of cold-contact proposals triggered measurable engagement (view, click, or response). This is the signal/noise threshold.
          </p>
          <div className="pt-2 text-xs text-white/40 border-t border-white/5">
            Industry benchmark: 2–5% for standard cold outreach
          </div>
        </div>

        {/* Card 2: Pipeline Influenced */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
              Pipeline Influenced (14 days)
            </p>
            <p className="text-3xl font-bold text-accent font-mono">$485K</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            In qualified pipeline detected and routed within 2 weeks of first contact. From accounts with zero prior brand awareness.
          </p>
          <div className="pt-2 text-xs text-white/40 border-t border-white/5">
            Stage on contact: evaluation → decision phase
          </div>
        </div>

        {/* Card 3: Decision-Phase Detection */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
              Active Buyer Detection
            </p>
            <p className="text-3xl font-bold text-accent font-mono">17 accounts</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            In decision-phase momentum (multi-touch engagement, proposal review, meeting request) within 72 hours. Velocity matters.
          </p>
          <div className="pt-2 text-xs text-white/40 border-t border-white/5">
            Routing accuracy: matched to buying committee
          </div>
        </div>

        {/* Card 4: Message-to-Buyer Match */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
              Message Match Response Lift
            </p>
            <p className="text-3xl font-bold text-accent font-mono">3x</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Higher engagement when using signal-matched messaging vs. generic cold outreach. Same offer, different frame.
          </p>
          <div className="pt-2 text-xs text-white/40 border-t border-white/5">
            Test: controlled frame variation within same cohort
          </div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="bg-white/[0.02] rounded-lg p-6 border border-white/5 space-y-3">
        <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Research Methodology</p>
        <p className="text-xs text-white/60 leading-relaxed">
          <strong>Sample:</strong> 30 cold freight companies, zero warm intros, zero brand awareness. <strong>Timeframe:</strong> Q1 2026. <strong>Measurement:</strong> Signal-matched routing + real-time engagement tracking. <strong>Note:</strong> Your results will vary based on ICP clarity and market conditions.
        </p>
      </div>
    </section>
  );
}
