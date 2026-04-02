"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_MIN_BID,
  DEFAULT_MIN_INCREMENT,
  DEFAULT_ACCEPTED_SLOTS,
  DEFAULT_TOTAL_SLOTS,
  DEADLINE_UTC,
} from "@/lib/constants";
import BidFlow from "@/components/bid/bid-flow";
import { useInView } from "@/lib/hooks/use-in-view";

export function BidSection() {
  const { ref, isInView } = useInView();
  const [minBid, setMinBid] = useState(DEFAULT_MIN_BID);
  const [minIncrement, setMinIncrement] = useState(DEFAULT_MIN_INCREMENT);
  const [remainingSlots, setRemainingSlots] = useState(
    DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS
  );
  const [totalSlots, setTotalSlots] = useState(DEFAULT_TOTAL_SLOTS);
  const [deadline, setDeadline] = useState(DEADLINE_UTC);
  const [manuallyClosed, setManuallyClosed] = useState(false);
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/slots")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (typeof data.current_min_bid === "number")
            setMinBid(data.current_min_bid);
          if (typeof data.min_increment === "number")
            setMinIncrement(data.min_increment);
          if (typeof data.remaining_slots === "number")
            setRemainingSlots(data.remaining_slots);
          if (typeof data.total_slots === "number")
            setTotalSlots(data.total_slots);
          if (data.deadline) setDeadline(data.deadline);
          if (typeof data.manually_closed === "boolean")
            setManuallyClosed(data.manually_closed);
        }
      })
      .catch(() => {
        // Keep defaults
      })
      .finally(() => setSlotsLoaded(true));
  }, []);

  if (manuallyClosed) {
    return (
      <section id="bid" className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            Offering Closed
          </h2>
          <p className="text-white/50 text-lg">
            The Q2 2026 offering has been closed. Contact casey@dwtb.dev for
            inquiries.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="bid" ref={ref as React.RefObject<HTMLElement>} className={`py-24 md:py-32 px-6 transition-all duration-700 ease-out ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
          Request Allocation
        </h2>
        <p className="text-white/40 text-lg mb-12">
          4 steps. ~3 minutes. Plain-language agreement. No lawyers needed.
        </p>

        {!slotsLoaded ? (
          <div className="text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <p className="mt-3 text-text-muted text-sm font-mono">Loading offering details...</p>
          </div>
        ) : (
          <BidFlow
            minBid={minBid}
            minIncrement={minIncrement}
            remainingSlots={remainingSlots}
            totalSlots={totalSlots}
            deadline={deadline}
          />
        )}
      </div>
    </section>
  );
}
