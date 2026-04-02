"use client";

import { useState, useEffect, useCallback } from "react";
import { getTimeRemaining } from "@/lib/deadline";
import {
  DEFAULT_TOTAL_SLOTS,
  DEFAULT_ACCEPTED_SLOTS,
  DEFAULT_MIN_BID,
} from "@/lib/constants";
import { isExpired } from "@/lib/deadline";

interface MarketTickerProps {
  visible: boolean;
}

export function MarketTicker({ visible }: MarketTickerProps) {
  const [remaining, setRemaining] = useState(
    DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS
  );
  const [floor, setFloor] = useState(DEFAULT_MIN_BID);
  const [time, setTime] = useState(getTimeRemaining());
  const [heroVisible, setHeroVisible] = useState(true);
  const [bidVisible, setBidVisible] = useState(false);

  // Fetch live slot data
  useEffect(() => {
    fetch("/api/slots")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (typeof data.remaining_slots === "number")
            setRemaining(data.remaining_slots);
          if (typeof data.current_min_bid === "number")
            setFloor(data.current_min_bid);
        }
      })
      .catch(() => {});
  }, []);

  // Countdown tick
  const tick = useCallback(() => {
    setTime(getTimeRemaining());
  }, []);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Track hero and bid section visibility for sticky CTA
  useEffect(() => {
    const heroEl = document.getElementById("hero");
    const bidEl = document.getElementById("bid");
    if (!heroEl) return;

    const heroObs = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    heroObs.observe(heroEl);

    let bidObs: IntersectionObserver | undefined;
    if (bidEl) {
      bidObs = new IntersectionObserver(
        ([entry]) => setBidVisible(entry.isIntersecting),
        { threshold: 0.1 }
      );
      bidObs.observe(bidEl);
    }

    return () => {
      heroObs.disconnect();
      bidObs?.disconnect();
    };
  }, []);

  const expired = isExpired();
  if (!visible || expired) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const showCta = !heroVisible && !bidVisible;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-10 bg-surface-raised/90 backdrop-blur-sm border-b border-border/30 flex items-center justify-between px-4 md:px-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center gap-3 font-mono text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-accent font-medium">OFFERING OPEN</span>
        </span>
        <span className="text-text-muted hidden sm:inline">·</span>
        <span className="hidden sm:inline">
          {remaining} OF {DEFAULT_TOTAL_SLOTS} ALLOC
        </span>
        <span className="text-text-muted hidden md:inline">·</span>
        <span className="hidden md:inline">
          FLOOR ${(floor / 1000).toFixed(0)}K
        </span>
        <span className="text-text-muted hidden lg:inline">·</span>
        <span className="hidden lg:inline">
          CLOSES {pad(time.days)}d {pad(time.hours)}h {pad(time.minutes)}m{" "}
          {pad(time.seconds)}s
        </span>
      </div>

      {showCta && (
        <a
          href="#bid"
          className="flex items-center gap-1.5 px-3 py-1 bg-accent text-surface text-xs font-semibold rounded hover:bg-accent/90 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,194,0.2)] active:scale-[0.97]"
        >
          Request Allocation →
        </a>
      )}
    </div>
  );
}
