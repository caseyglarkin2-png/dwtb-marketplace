"use client";

import { Countdown } from "@/components/countdown";
import { DEADLINE } from "@/lib/deadline";
import { useInView } from "@/lib/hooks/use-in-view";

export function DeadlineSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="deadline" ref={ref as React.RefObject<HTMLElement>} className={`py-24 md:py-32 px-6 text-center transition-all duration-700 ease-out ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-12 tracking-tight">Offering Closes In</h2>

        <Countdown deadline={DEADLINE} />

        <p className="mt-8 text-text-secondary text-lg max-w-xl mx-auto">
          After 11:59 PM ET on Monday, April 6, the Q2 2026 offering period
          closes. Late requests may not receive the same consideration.
        </p>

        <a
          href="#bid"
          className="mt-8 inline-flex items-center gap-2 px-8 py-4 min-h-[48px] bg-accent text-surface font-semibold text-lg rounded-lg hover:bg-accent/90 transition-all duration-300 active:scale-[0.98] hover:shadow-[0_0_30px_rgba(0,255,194,0.2)]"
        >
          Request Allocation Now
        </a>
      </div>
    </section>
  );
}
