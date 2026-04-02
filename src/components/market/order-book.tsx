"use client";

import type { MarketData } from "@/app/api/market/route";

interface OrderBookProps {
  data: MarketData;
}

function SlotIndicator({ total, remaining }: { total: number; remaining: number }) {
  const filled = total - remaining;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs md:text-sm">
      <span className="text-text-muted shrink-0">ALLOCATIONS:</span>
      <span className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`text-base ${i < filled ? "text-accent" : "text-text-muted/40"}`}
          >
            {i < filled ? "■" : "□"}
          </span>
        ))}
      </span>
      <span className="text-text-secondary text-xs">
        {remaining} of {total} remaining
      </span>
    </div>
  );
}

function DepthBar({ range, count, maxCount }: { range: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-2 md:gap-3 font-mono text-xs md:text-sm">
      <span className="w-24 md:w-32 text-text-muted shrink-0 truncate">{range}</span>
      <div className="flex-1 h-3 md:h-4 bg-surface-alt rounded-sm overflow-hidden min-w-0">
        <div
          className="h-full bg-accent/60 rounded-sm transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 md:w-16 text-right text-text-secondary shrink-0">
        {count} {count === 1 ? "bid" : "bids"}
      </span>
    </div>
  );
}

export function OrderBook({ data }: OrderBookProps) {
  const maxCount = Math.max(...data.depth.map((d) => d.count), 1);

  return (
    <div className="space-y-4 overflow-x-hidden">
      <SlotIndicator total={data.allocations.total} remaining={data.allocations.remaining} />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs md:text-sm">
        <div>
          <span className="text-text-muted">FLOOR: </span>
          <span className="text-accent font-bold">
            ${data.floor_price.toLocaleString()}
          </span>
        </div>
        {data.total_requests > 0 && (
          <div>
            <span className="text-text-muted">REQUESTS: </span>
            <span className="text-text-secondary">{data.total_requests}</span>
          </div>
        )}
      </div>

      <div className="mt-2 space-y-1.5">
        <div className="font-mono text-[10px] md:text-xs text-text-muted uppercase tracking-wider mb-2">
          Market Depth
        </div>
        {data.depth.map((bucket) => (
          <DepthBar
            key={bucket.range}
            range={bucket.range}
            count={bucket.count}
            maxCount={maxCount}
          />
        ))}
      </div>
    </div>
  );
}
