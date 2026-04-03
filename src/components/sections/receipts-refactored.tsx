"use client";

export default function ReceiptsRefactored() {
  return (
    <section className="py-16 px-6 max-w-6xl mx-auto space-y-12">
      {/* Headline */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          What the System Actually Does
        </h2>
        <p className="text-white/50 font-mono text-sm">
          We measure outcomes, not dashboards.
        </p>
      </div>

      {/* Proof Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Engagement Response */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
              Cold Engagement Response
            </p>
            <p className="text-3xl font-bold text-accent font-mono">64%</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Of cold-contact proposals triggered measurable engagement (click, view, or contact attempt). This is the baseline threshold that separates signal from noise.
          </p>
          <div className="pt-2 text-xs text-white/40 border-t border-white/5">
            Industry benchmark: 2–5% for unsolicited outreach
          </div>
        </div>

        {/* Card 2: Pipeline Influenced */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
              Pipeline Influenced
            </p>
            <p className="text-3xl font-bold text-accent font-mono">$635K</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            In qualified pipeline identified across three engagement tiers within the measurement window. From accounts with zero prior brand awareness.
          </p>
          <div className="pt-2 text-xs text-white/40 border-t border-white/5">
            Average deal stage: evaluation phase → negotiation phase
          </div>
        </div>

        {/* Card 3: Intent Detection Speed */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
              Decision-Phase Detection
            </p>
            <p className="text-3xl font-bold text-accent font-mono">14 accounts</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            In active buyer momentum (STRIKE_NOW and WATCH classifications showing multi-touch engagement and proposal review) within 72 hours.
          </p>
          <div className="pt-2 text-xs text-white/40 border-t border-white/5">
            Routing accuracy: matched to documented buying committee
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
            41 unique opens, 13 clicks, 7 in STRIKE_NOW tier
          </div>
        </div>
      </div>

      {/* Commercial Example */}
      <div className="border border-accent/20 rounded-lg p-8 bg-accent/5 space-y-6">
        <div className="space-y-2">
          <p className="text-xs text-accent font-mono font-semibold uppercase tracking-wider">
            Example: From Cold to Commercial
          </p>
          <h3 className="text-xl font-bold text-white">One Email. One Signal. One Account.</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono">Hour 0</p>
            <p className="text-white/80">Signal detected: hiring surge + new tech stack</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono">Hour 2</p>
            <p className="text-white/80">Message routed to VP of Ops (not generic inbox)</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono">Hour 6</p>
            <p className="text-white/80">Prospect opens email, clicks, replies</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/40 font-mono">Day 14</p>
            <p className="text-white/80">Entered your sales process at decision stage</p>
          </div>
        </div>

        <div className="border-t border-accent/20 pt-4">
          <p className="text-xs text-white/50 leading-relaxed">
            Commercial impact: Compressed 60-day research phase into 14 days. Routed to the right buyer. No generic follow-up sequence needed. This is the operating edge.
          </p>
        </div>
      </div>

      {/* Methodology & Caveats */}
      <div className="bg-white/[0.02] rounded-lg p-6 border border-white/5 space-y-3">
        <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Research Methodology</p>
        <p className="text-xs text-white/60 leading-relaxed">
          <strong>Sample:</strong> 38 freight and logistics companies, zero warm introductions, zero prior brand awareness. <strong>Timeframe:</strong> March 29 – April 3, 2026. <strong>Measurement:</strong> Email tracking (opens, clicks) + proposal page analytics (views, return visits). <strong>Scope:</strong> Cold outreach only; all prospects were unknown to DWTB?! Studios at contact time.
        </p>
        <p className="text-xs text-white/50 italic pt-2">
          Note: These are operational results, not benchmarks. Your results will vary based on ICP clarity, market conditions, and message fit.
        </p>
      </div>
    </section>
  );
}
