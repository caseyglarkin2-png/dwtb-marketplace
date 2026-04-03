"use client";

export default function OfferingsOperatingModel() {
  return (
    <section className="py-16 px-6 max-w-6xl mx-auto">
      <div className="space-y-8">
        {/* Headline */}
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">How We Operate</h2>
          <p className="text-white/50 font-mono text-sm">Constraints that make the model real and the delivery sharp.</p>
        </div>

        {/* Constraints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "3-Month Minimum",
              desc: "All engagements run three months. That's the time window we need to build market traction and measure real results.",
            },
            {
              title: "Limited Concurrent Capacity",
              desc: "We hold 3 partner slots at a time. Not because of tooling constraints — because of operator constraints. Quality over volume.",
            },
            {
              title: "Built in the DWTB System",
              desc: "All micro landing pages, audits, and roofing are built in DWTB's design system. Consistent, fast, proven. No custom one-offs.",
            },
            {
              title: "Speed & Testing First",
              desc: "We optimize for fast deployment and campaign continuity. Five pages per month = five tests per month = five opportunities to measure what resonates.",
            },
            {
              title: "No Hidden Revision Inflation",
              desc: "One revision cycle per deliverable. Changes within agreed scope are free. Out-of-scope changes are billed separately or deferred to next quarter.",
            },
            {
              title: "Major Scope is Separate",
              desc: "Full brand repositions, net-new platform builds, and custom design systems are scoped separately. Not bundled into quarterly packages.",
            },
          ].map((item) => (
            <div key={item.title} className="border border-white/10 rounded-lg p-5 space-y-2 bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-white">{item.title}</h4>
              <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Why This Matters */}
        <div className="border border-accent/20 rounded-lg p-6 bg-accent/5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Why This Matters</h3>
          <p className="text-sm text-white/70 leading-relaxed">
            The market is full of agencies that take 3 clients and deliver sloppy work to all of them. We chose the opposite — 3 clients, Casey reviewing every page, fast testing cycles, and clear boundaries on what's in vs. what's out. That's how we stay sharp and how we deliver results.
          </p>
        </div>
      </div>
    </section>
  );
}
