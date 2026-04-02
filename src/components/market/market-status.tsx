"use client";

import { useState, useEffect } from "react";
import type { MarketData } from "@/app/api/market/route";

interface MarketStatusProps {
  visible: boolean;
}

export function MarketStatus({ visible }: MarketStatusProps) {
  const [data, setData] = useState<MarketData | null>(null);

  useEffect(() => {
    if (!visible) return;

    let mounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/market");
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setData(json);
      } catch {
        // silent — banner is optional
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [visible]);

  if (!visible || !data) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:sticky md:top-0 md:bottom-auto">
      <div className="bg-surface/95 backdrop-blur-sm border-t md:border-b md:border-t-0 border-accent/20 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 font-mono text-xs">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                data.status === "open"
                  ? "bg-accent animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="uppercase tracking-wider text-text-secondary">
              Offering {data.status}
            </span>
          </span>

          <span className="text-accent/40">·</span>

          <span className="text-text-muted">
            {data.total_requests} requests received
          </span>

          <span className="text-accent/40">·</span>

          <span className="text-text-muted">
            Floor: <span className="text-accent">${data.floor_price.toLocaleString()}</span>
          </span>

          <span className="text-accent/40 hidden sm:inline">·</span>

          <span className="text-text-muted hidden sm:inline">
            {data.allocations.remaining} of {data.allocations.total} remaining
          </span>
        </div>
      </div>
    </div>
  );
}
