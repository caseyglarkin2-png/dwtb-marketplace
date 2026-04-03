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
            <p className="text-3xl font-bold text-accent font-mono">$635K</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            In qualified pipeline identified across three engagement tiers within the measurement window. From accounts with zero prior brand awareness.
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
            <p className="text-3xl font-bold text-accent font-mono">14 accounts</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            In active buyer momentum (STRIKE_NOW and WATCH classifications showing multi-touch engagement and proposal review) within 72 hours.
          </p>
          <div className="pt-2 text-xs text-white/40 border-t border-white/5">
            Routing accuracy: matched to buying committee
          </div>
        </div>

        {/* Card 4: Pipeline Velocity */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
              Pipeline Velocity
            </p>
            <p className="text-3xl font-bold text-accent font-mono">38 prospects</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Cold freight companies targeted with zero warm intros. The system identified, audited, and deployed personalized outreach across the full cohort.
          </p>
          <div className="pt-2 text-xs text-white/40 border-t border-white/5">
            41 unique email opens, 13 clicks, 7 STRIKE_NOW
          </div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="bg-white/[0.02] rounded-lg p-6 border border-white/5 space-y-3">
        <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Research Methodology</p>
        <p className="text-xs text-white/60 leading-relaxed">
          <strong>Sample:</strong> 38 cold freight companies, zero warm intros, zero brand awareness. <strong>Timeframe:</strong> March 29 – April 3, 2026. <strong>Measurement:</strong> Email tracking (opens, clicks) + proposal page analytics (views, return visits). <strong>Note:</strong> Pipeline valuations estimated from target account profiles. Your results will vary based on ICP clarity and market conditions.
        </p>
      </div>
    </section>
  );
}
