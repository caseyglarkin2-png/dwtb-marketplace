export function ExpiredState() {
  return (
    <section className="py-24 md:py-32 px-6 text-center">
      <div className="max-w-3xl mx-auto">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-danger/30 bg-danger/5 mb-8">
          <span className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-danger text-sm font-mono font-medium tracking-wide">
            Q2 2026 OFFERING CLOSED
          </span>
        </div>

        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          The Q2 Offering Has Closed.
        </h2>

        <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
          DWTB?! Studios is now operating at full capacity for Q2 2026. New
          allocation requests are not being accepted. Watch for the Q3 offering
          announcement.
        </p>
      </div>
    </section>
  );
}
