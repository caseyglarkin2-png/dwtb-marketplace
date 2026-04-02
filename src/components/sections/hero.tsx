import { DEADLINE } from "@/lib/deadline";

export function Hero() {
  const deadlineStr = DEADLINE.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Scarcity badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 mb-8">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-accent text-sm font-mono font-medium tracking-wide">
          PRIVATE BID WINDOW ACTIVE
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl">
        2 Q2 Slots Remain.{" "}
        <span className="text-accent">This Is the Bid Window.</span>
      </h1>

      {/* Subline */}
      <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed">
        DWTB?! Studios runs the signal-driven GTM engine for enterprise B2B
        freight marketing. 3 total client slots per quarter. 1 is filled. You
        are looking at the last 2.
      </p>

      {/* CTA */}
      <a
        href="#bid"
        className="mt-10 inline-flex items-center gap-2 px-8 py-4 bg-accent text-surface font-semibold text-lg rounded-lg hover:bg-accent/90 transition-colors"
      >
        Review Offer + Place Your Bid
      </a>

      {/* Deadline line */}
      <p className="mt-6 text-sm text-text-muted font-mono">
        Bids close {deadlineStr} at 11:59 PM ET. No extensions.
      </p>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 animate-bounce">
        <svg
          className="w-6 h-6 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}
