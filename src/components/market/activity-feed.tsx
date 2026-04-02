"use client";

import type { MarketData } from "@/app/api/market/route";

const EVENT_LABELS: Record<string, string> = {
  new_request: "New allocation request",
  amount_updated: "Request amount updated",
  allocation_accepted: "Allocation accepted",
};

interface ActivityFeedProps {
  activity: MarketData["activity"];
}

export function ActivityFeed({ activity }: ActivityFeedProps) {
  if (activity.length === 0) {
    return (
      <div className="font-mono text-sm text-text-muted/50 py-4">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      <div className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">
        Activity
      </div>
      {activity.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 font-mono text-sm animate-[fadeIn_0.3s_ease-out]"
          style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
        >
          <span className="w-2 h-2 rounded-full bg-accent shrink-0 animate-pulse" />
          <span className="text-text-secondary">
            {EVENT_LABELS[item.type] || item.type}
          </span>
          <span className="text-text-muted ml-auto">{item.ago} ago</span>
        </div>
      ))}
    </div>
  );
}
