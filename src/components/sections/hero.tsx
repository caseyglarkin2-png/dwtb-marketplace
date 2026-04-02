"use client";

import { useCallback } from "react";
import { DEADLINE } from "@/lib/deadline";
import { track } from "@/lib/analytics";
import type { LiveData } from "@/app/partners/page";

interface HeroProps {
  liveData: LiveData;
}

export function Hero({ liveData }: HeroProps) {
  const { remainingSlots, totalSlots, stats } = liveData;
  const deadlineStr = DEADLINE.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <section
      id="hero"
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden"
      style={{ "--mouse-x": "50%", "--mouse-y": "50%" } as React.CSSProperties}
    >
      {/* Cursor glow — desktop only */}
      <div
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={{
          background: "radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(0,255,194,0.04), transparent 40%)",
        }}
      />
      {/* Status badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 mb-8">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-accent text-sm font-mono font-medium tracking-wide">
          Q2 2026 OFFERING — NOW OPEN
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl tracking-tight">
        {remainingSlots} of {totalSlots} Slots Open.{" "}
        <span className="text-accent">3 Tiers. 1 System.</span>
      </h1>

      {/* Subline */}
      <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed font-light tracking-wide">
        DWTB?! Studios is the signal-driven GTM engine for enterprise B2B
        freight marketing. 3 tiers — Founding, Growth, Enterprise — starting at $7,500/mo.
        {totalSlots - remainingSlots > 0 ? ` ${totalSlots - remainingSlots} ${totalSlots - remainingSlots === 1 ? "slot is" : "slots are"} spoken for.` : ""}
      </p>

      {/* CTA */}
      <a
        href="#bid"
        onClick={() => track("cta_click", { location: "hero" })}
        className="mt-10 inline-flex items-center gap-2 px-8 py-4 min-h-[48px] bg-accent text-surface font-semibold text-lg rounded-lg hover:bg-accent/90 transition-all duration-300 active:scale-[0.98] hover:shadow-[0_0_30px_rgba(0,255,194,0.2)]"
      >
        Choose Your Tier
      </a>

      {/* Social proof micro-copy */}
      <p className="mt-3 text-xs text-text-muted font-mono">
        {stats.strikeNow} accounts currently in the pipeline
      </p>

      {/* Secondary CTA — warm path */}
      <a
        href="mailto:casey@dwtb.dev?subject=Q2%20GTM%20Briefing%20Request"
        className="mt-3 inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg text-text-secondary text-sm hover:border-accent/50 hover:text-accent transition-all duration-300"
      >
        Or: Talk to Casey First →
      </a>

      {/* Deadline line */}
      <p className="mt-6 text-sm text-text-muted font-mono">
        Offering closes {deadlineStr} at 11:59 PM ET.
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
