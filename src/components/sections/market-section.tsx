"use client";

import { useState, useEffect } from "react";
import { OrderBook } from "@/components/market/order-book";
import { ActivityFeed } from "@/components/market/activity-feed";
import { FALLBACK_MARKET_DATA, DEADLINE_UTC } from "@/lib/constants";
import { useInView } from "@/lib/hooks/use-in-view";
import type { MarketData } from "@/app/api/market/route";

const POLL_INTERVAL = 60_000; // 60 seconds

function MarketSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-48 bg-surface-alt rounded" />
      <div className="h-4 w-64 bg-surface-alt rounded" />
      <div className="space-y-2 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 bg-surface-alt rounded" />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_MARKET_DATA: MarketData = {
  ...FALLBACK_MARKET_DATA,
  deadline: DEADLINE_UTC,
  _source: "fallback",
  depth: [...FALLBACK_MARKET_DATA.depth.map((d) => ({ ...d }))],
  activity: [...FALLBACK_MARKET_DATA.activity.map((a) => ({ ...a }))],
  allocations: { ...FALLBACK_MARKET_DATA.allocations },
};

export function MarketSection() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const { ref, isInView } = useInView(0.1);

  useEffect(() => {
    let mounted = true;

    async function fetchMarket() {
      try {
        const res = await fetch("/api/market");
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setData(DEFAULT_MARKET_DATA);
          setLoading(false);
        }
      }
    }

    fetchMarket();
    const interval = setInterval(fetchMarket, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayData = data || DEFAULT_MARKET_DATA;

  return (
    <section
      ref={ref}
      className={`py-16 px-6 max-w-3xl mx-auto transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="mb-8">
        <h2 className="font-mono text-xl text-accent font-bold tracking-tight">
          Market Depth
        </h2>
        <p className="font-mono text-sm text-text-muted mt-1">
          Live allocation request data. Anonymized. Updated every 60 seconds.
        </p>
      </div>

      <div className="border border-dashed border-accent/30 rounded-lg bg-surface p-6 space-y-6">
        {/* Status line */}
        <div className="flex items-center gap-2 font-mono text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              displayData.status === "open"
                ? "bg-accent animate-pulse"
                : "bg-red-500"
            }`}
          />
          <span className="text-text-secondary uppercase tracking-wider">
            Offering {displayData.status}
          </span>
          <span className="text-text-muted ml-auto">
            {displayData.total_requests} total requests
          </span>
        </div>

        {loading ? (
          <MarketSkeleton />
        ) : (
          <>
            <OrderBook data={displayData} />
            <div className="border-t border-border my-4" />
            <ActivityFeed activity={displayData.activity} />
          </>
        )}
      </div>
    </section>
  );
}
