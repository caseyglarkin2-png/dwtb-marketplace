"use client";

export default function OfferingsFitFilter() {
  return (
    <section className="py-16 px-6 max-w-6xl mx-auto">
      <div className="space-y-8">
        {/* Headline */}
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Is This Right for You?</h2>
          <p className="text-white/50 font-mono text-sm">Good product fit matters. Here's how to tell.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Good Fit */}
          <div className="border border-green-500/30 rounded-lg p-6 bg-green-500/5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xl">✓</span>
              <h3 className="text-lg font-bold text-white">Good Fit</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Freight tech or logistics operators",
                "Supply chain software companies",
                "B2B service providers with commercial urgency",
                "3-month capacity for market tests",
                "Willing to move fast and iterate",
                "Markets with clear ICP + buyer personas",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-white/70">
                  <span className="text-green-400 shrink-0 mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not Fit */}
          <div className="border border-red-500/30 rounded-lg p-6 bg-red-500/5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-xl">×</span>
              <h3 className="text-lg font-bold text-white">Not a Fit</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Looking for cheap website refreshes",
                "Undefined ICP or unclear buyer personas",
                "Unlimited revision cycles expected",
                "Broad, non-freight random project work",
                "Need for net-new platform builds",
                "Cannot commit to 3-month minimum",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-white/70">
                  <span className="text-red-400 shrink-0 mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fit Assessment */}
        <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02] space-y-3">
          <p className="text-sm font-semibold text-white">Not sure? Let's talk.</p>
          <p className="text-sm text-white/60">
            We're specific about what works and what doesn't. If you're on the fence, email casey@dwtb.dev or schedule a 15-minute fit check.
          </p>
        </div>
      </div>
    </section>
  );
}
