"use client";

import type { MarketData } from "@/app/api/market/route";

interface OrderBookProps {
  data: MarketData;
}

function SlotIndicator({ total, remaining }: { total: number; remaining: number }) {
  const filled = total - remaining;
  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="text-text-muted">ALLOCATIONS:</span>
      <span className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={i < filled ? "text-accent" : "text-text-muted/40"}
          >
            {i < filled ? "■" : "□"}
          </span>
        ))}
      </span>
      <span className="text-text-secondary">
        {remaining} of {total} remaining
      </span>
    </div>
  );
}

function DepthBar({ range, count, maxCount }: { range: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3 font-mono text-sm">
      <span className="w-32 text-text-muted shrink-0">{range}</span>
      <div className="flex-1 h-4 bg-surface-alt rounded-sm overflow-hidden">
        <div
          className="h-full bg-accent/60 rounded-sm transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-16 text-right text-text-secondary">
        {count} {count === 1 ? "bid" : "bids"}
      </span>
    </div>
  );
}

export function OrderBook({ data }: OrderBookProps) {
  const maxCount = Math.max(...data.depth.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      <SlotIndicator total={data.allocations.total} remaining={data.allocations.remaining} />

      <div className="flex items-center gap-6 font-mono text-sm">
        <div>
          <span className="text-text-muted">FLOOR PRICE: </span>
          <span className="text-accent font-bold">
            ${data.floor_price.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <div className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">
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
