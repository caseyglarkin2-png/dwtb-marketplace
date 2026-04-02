"use client";

import { useState } from "react";
import { TIERS, TIER_ORDER, type TierId } from "@/lib/constants";
import { useInView } from "@/lib/hooks/use-in-view";
import { TierRequestModal } from "@/components/offerings/tier-request";

const TIER_BADGES: Record<TierId, string | null> = {
  founding: null,
  growth: "MOST POPULAR",
  enterprise: "FEATURED",
};

function TierCard({
  tierId,
  index,
  onRequest,
}: {
  tierId: TierId;
  index: number;
  onRequest: (tier: TierId) => void;
}) {
  const tier = TIERS[tierId];
  const badge = TIER_BADGES[tierId];
  const isFeatured = tierId === "enterprise";

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 md:p-8 transition-all duration-300 hover:border-accent/40 ${
        isFeatured
          ? "border-accent/50 bg-accent/[0.03] ring-1 ring-accent/20"
          : "border-border bg-surface-raised/80 backdrop-blur-sm"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {badge && (
        <div className="absolute -top-3 left-6">
          <span className={`px-3 py-1 text-[10px] font-mono font-bold tracking-widest rounded-full ${
            isFeatured
              ? "bg-accent text-surface"
              : "bg-white/10 text-white/70 border border-white/10"
          }`}>
            {badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{tier.name}</h3>
        <p className="text-xs font-mono text-white/40">{tier.slotLabel}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl md:text-4xl font-bold text-white">
            ${(tier.bidFloor).toLocaleString()}
          </span>
          <span className="text-white/40 text-sm">/mo</span>
        </div>
        <p className="text-xs text-white/30 font-mono mt-1">
          {tier.termMonths}-month term · Buy It Now: ${(tier.buyItNow).toLocaleString()}/mo
        </p>
      </div>

      <ul className="flex-1 space-y-3 mb-8">
        {tier.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2 text-sm text-white/70">
            <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onRequest(tierId)}
        className={`block w-full text-center py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-300 active:scale-[0.98] min-h-[48px] flex items-center justify-center ${
          isFeatured
            ? "bg-accent text-surface hover:bg-accent/90 hover:shadow-[0_0_30px_rgba(0,255,194,0.2)]"
            : "border border-border text-white hover:border-accent/50 hover:text-accent"
        }`}
      >
        {isFeatured ? "Request Allocation" : "Select Tier"}
      </button>
    </div>
  );
}

export function Offerings() {
  const { ref, isInView } = useInView();
  const [requestTier, setRequestTier] = useState<TierId | null>(null);

  return (
    <section
      id="offerings"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-24 md:py-32 px-6 transition-all duration-700 ease-out ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
          The Offerings
        </h2>
        <p className="text-white/40 text-lg mb-4">
          Three tiers. Three slots. The full GTM engine pointed at your market.
        </p>
        <p className="text-white/30 text-sm font-mono mb-12">
          All tiers include a {TIERS.founding.termMonths}-month engagement · Competitive bid pricing
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {TIER_ORDER.map((tierId, i) => (
            <TierCard key={tierId} tierId={tierId} index={i} onRequest={setRequestTier} />
          ))}
        </div>
      </div>

      {requestTier && (
        <TierRequestModal tier={requestTier} onClose={() => setRequestTier(null)} />
      )}
    </section>
  );
}
