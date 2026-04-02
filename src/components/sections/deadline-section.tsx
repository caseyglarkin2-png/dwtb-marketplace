"use client";

import { Countdown } from "@/components/countdown";
import { DEADLINE } from "@/lib/deadline";

export function DeadlineSection() {
  return (
    <section id="deadline" className="py-24 md:py-32 px-6 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-12">Bids Close In</h2>

        <Countdown deadline={DEADLINE} />

        <p className="mt-8 text-text-secondary text-lg max-w-xl mx-auto">
          After 11:59 PM ET on Monday, April 6, this bid window closes. Late
          submissions may not receive the same consideration. No extensions.
        </p>

        <a
          href="#bid"
          className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-accent text-surface font-semibold text-lg rounded-lg hover:bg-accent/90 transition-colors"
        >
          Submit Your Bid Now
        </a>
      </div>
    </section>
  );
}
