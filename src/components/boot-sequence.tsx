"use client";

import { useState, useEffect, useCallback } from "react";
import { FALLBACK_STATS } from "@/lib/constants";

const BOOT_LINES = [
  { text: "DWTB?! STUDIOS // LIVE", delay: 0 },
  { text: "PRIVATE BID WINDOW ACTIVE", delay: 400 },
  { text: "2 Q2 SLOTS REMAINING", delay: 800 },
  { text: "CONTRACT ENGINE READY", delay: 1200 },
  {
    text: `[${FALLBACK_STATS.proposalsSent} proposals sent · $${(FALLBACK_STATS.pipelineValue / 1000).toFixed(0)}K pipeline · ${FALLBACK_STATS.strikeNow} active prospects]`,
    delay: 1600,
  },
  { text: "READY_", delay: 2200 },
];

const EXPIRED_BOOT_LINES = [
  { text: "DWTB?! STUDIOS // LIVE", delay: 0 },
  { text: "BID WINDOW CLOSED", delay: 400 },
  { text: "Q2 AT CAPACITY", delay: 800 },
  { text: "DWTB STUDIOS OPERATIONAL", delay: 1200 },
  { text: "READY_", delay: 1600 },
];

interface BootSequenceProps {
  expired?: boolean;
  onComplete: () => void;
}

export function BootSequence({ expired = false, onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [skipped, setSkipped] = useState(false);

  const lines = expired ? EXPIRED_BOOT_LINES : BOOT_LINES;

  const skip = useCallback(() => {
    setSkipped(true);
    sessionStorage.setItem("dwtb_boot_seen", "1");
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Skip if already seen this session
    if (sessionStorage.getItem("dwtb_boot_seen")) {
      skip();
      return;
    }

    const timers = lines.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(i + 1);
        if (i === lines.length - 1) {
          setTimeout(() => {
            sessionStorage.setItem("dwtb_boot_seen", "1");
            onComplete();
          }, 600);
        }
      }, line.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [lines, onComplete, skip]);

  // Listen for Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [skip]);

  if (skipped) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col items-center justify-center" role="status" aria-label="Loading DWTB Studios">
      <div className="font-mono text-sm md:text-base text-accent space-y-2 max-w-xl px-6">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className="animate-[fadeIn_0.3s_ease-out]"
          >
            <span className="text-text-muted mr-2">{">"}</span>
            {line.text}
          </div>
        ))}
        <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-1" />
      </div>

      {visibleLines >= 2 && (
        <button
          onClick={skip}
          className="absolute bottom-8 right-8 text-text-muted text-xs font-mono hover:text-text-secondary transition-colors"
        >
          Skip [Esc]
        </button>
      )}
    </div>
  );
}
