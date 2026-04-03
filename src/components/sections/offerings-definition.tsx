"use client";

export default function OfferingsDefinition() {
  return (
    <section className="py-16 px-6 max-w-6xl mx-auto space-y-12">
      {/* Main Definition */}
      <div className="space-y-4">
        <h2 className="text-4xl font-extrabold text-white tracking-tight">
          What a Micro Landing Page Actually Is
        </h2>
        <p className="text-lg text-white/70 max-w-2xl leading-relaxed">
          A fast, focused page built for a named buyer, account, segment, or campaign angle — designed to make the fit obvious and turn attention into action.
        </p>
      </div>

      {/* What's Included Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <h3 className="text-sm font-mono font-semibold text-accent uppercase tracking-wider">
            Each Micro Landing Page Includes
          </h3>
          <ul className="space-y-3">
            {[
              "Tailored headline & subhead for the target",
              "Approved proof modules & credibility stack",
              "CTA and lead routing (email, Calendly, etc.)",
              "Analytics & event wiring (opens, clicks, conversions)",
              "One revision cycle",
              "Launched inside the DWTB design system",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm text-white/60">
                <span className="text-accent shrink-0 mt-1">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-4">
          <h3 className="text-sm font-mono font-semibold text-accent uppercase tracking-wider">
            Not Included (Scoped Separately)
          </h3>
          <ul className="space-y-3">
            {[
              "Full custom site builds or platform development",
              "Unlimited revision cycles",
              "Complete brand overhauls or visual identity redesigns",
              "Video production or animated assets",
              "15+ minute video content creation",
              "Process consulting or change management",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm text-white/60">
                <span className="text-white/30 shrink-0 mt-1">×</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Target Account Brief Definition */}
      <div className="border border-accent/20 rounded-lg p-8 bg-accent/5 space-y-4">
        <h3 className="text-lg font-bold text-white">What a Target Account or Segment Brief Includes</h3>
        <p className="text-sm text-white/60 leading-relaxed">
          The strategy layer that gives the micro landing pages teeth — every page is grounded in research and positioning.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {[
            "Who this target is and what they care about",
            "Likely pains, objections, and blind spots",
            "Positioning angle for your offer",
            "Value prop direction & proof points to lean on",
          ].map((item) => (
            <div key={item} className="flex gap-3 text-xs text-white/70">
              <span className="text-accent">■</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">The Workflow</h3>
          <p className="text-sm text-white/50 font-mono">How deliverables move from strategy to live in your market</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { step: "1", title: "Target Research", desc: "Deep ICP + signal match" },
            { step: "2", title: "Brief Strategy", desc: "Positioning + proof points" },
            { step: "3", title: "Page Build", desc: "Micro LP + messaging" },
            { step: "4", title: "Launch & Track", desc: "Live + analytics wired" },
          ].map((item) => (
            <div key={item.step} className="border border-white/10 rounded-lg p-4 space-y-2 bg-white/[0.02]">
              <div className="text-sm font-mono font-semibold text-accent">Step {item.step}</div>
              <div className="text-sm font-bold text-white">{item.title}</div>
              <div className="text-xs text-white/50">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
