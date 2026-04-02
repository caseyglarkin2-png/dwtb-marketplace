"use client";

import { useState, useEffect } from "react";
import { isExpired } from "@/lib/deadline";
import { BootSequence } from "@/components/boot-sequence";
import { MarketTicker } from "@/components/market-ticker";
import { Hero } from "@/components/sections/hero";
import { VideoStage } from "@/components/sections/video-stage";
import { Receipts } from "@/components/sections/receipts";
import { BidSection } from "@/components/sections/bid-section";
import { DeadlineSection } from "@/components/sections/deadline-section";
import { ExpiredState } from "@/components/sections/expired-state";
import { OperatorClose } from "@/components/sections/operator-close";
import { track } from "@/lib/analytics";
import {
  FALLBACK_STATS,
  DEFAULT_TOTAL_SLOTS,
  DEFAULT_ACCEPTED_SLOTS,
} from "@/lib/constants";

export interface LiveData {
  remainingSlots: number;
  totalSlots: number;
  stats: {
    proposalsSent: number;
    totalViews: number;
    viewRate: number;
    pipelineValue: number;
    strikeNow: number;
  };
  loaded: boolean;
  _source?: "live" | "cached" | "fallback";
}

export default function PartnersPage() {
  const [bootComplete, setBootComplete] = useState(false);
  const expired = isExpired();
  const [liveData, setLiveData] = useState<LiveData>({
    remainingSlots: DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS,
    totalSlots: DEFAULT_TOTAL_SLOTS,
    stats: { ...FALLBACK_STATS },
    loaded: false,
  });

  // Fetch live slots + stats once at page level, share with children
  useEffect(() => {
    Promise.all([
      fetch("/api/slots").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/stats").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([slotData, statsData]) => {
      // Use the "worst" source between slots and stats
      const slotSource = slotData?._source || "fallback";
      const statSource = statsData?._source || "fallback";
      const source = slotSource === "fallback" || statSource === "fallback"
        ? "fallback"
        : slotSource === "cached" || statSource === "cached"
          ? "cached"
          : "live";

      setLiveData((prev) => ({
        ...prev,
        loaded: true,
        _source: source as LiveData["_source"],
        remainingSlots:
          slotData?.remaining_slots ?? prev.remainingSlots,
        totalSlots: slotData?.total_slots ?? prev.totalSlots,
        stats: {
          proposalsSent: statsData?.proposalsSent ?? prev.stats.proposalsSent,
          totalViews: statsData?.totalViews ?? prev.stats.totalViews,
          viewRate: statsData?.viewRate ?? prev.stats.viewRate,
          pipelineValue: statsData?.pipelineValue ?? prev.stats.pipelineValue,
          strikeNow: statsData?.strikeNow ?? prev.stats.strikeNow,
        },
      }));
    });
  }, []);

  useEffect(() => {
    track("page_load", { expired });
  }, [expired]);

  return (
    <>
      {!bootComplete && (
        <BootSequence
          expired={expired}
          onComplete={() => setBootComplete(true)}
          liveData={liveData}
        />
      )}

      {bootComplete && (
        <>
          <MarketTicker visible={bootComplete} />
          <main id="main-content" className="animate-[fadeIn_0.5s_ease-out] pt-10">
          <Hero liveData={liveData} />
          <div className="w-16 h-px bg-accent/40 mx-auto" />
          <VideoStage />
          <div className="w-16 h-px bg-accent/40 mx-auto" />
          <Receipts />
          <div className="w-16 h-px bg-accent/40 mx-auto" />

          {expired ? (
            <ExpiredState />
          ) : (
            <>
              <BidSection />
              <div className="w-16 h-px bg-accent/40 mx-auto" />
              <DeadlineSection />
            </>
          )}

          <div className="w-16 h-px bg-accent/40 mx-auto" />
          <OperatorClose />

          {/* Footer */}
          <footer className="py-8 px-6 text-center border-t border-border">
            <div className="text-xs font-mono text-text-muted space-x-3">
              <span>SHA-256 Secured</span>
              <span className="text-accent/40">·</span>
              <span>ESIGN Compliant</span>
              <span className="text-accent/40">·</span>
              <span>Invite-Only Platform</span>
            </div>
            <div className="mt-2 text-xs text-text-muted/50 font-mono">
              DWTB?! Studios © {new Date().getFullYear()}
            </div>
          </footer>
        </main>
        </>
      )}
    </>
  );
}
