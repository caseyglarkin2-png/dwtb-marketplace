"use client";

import {
  DEFAULT_MIN_BID,
  DEFAULT_MIN_INCREMENT,
  DEFAULT_ACCEPTED_SLOTS,
  DEFAULT_TOTAL_SLOTS,
  DEADLINE_UTC,
} from "@/lib/constants";
import BidFlow from "@/components/bid/bid-flow";

export function BidSection() {
  const remainingSlots = DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS;

  return (
    <section id="bid" className="py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-12">
          Place Your Bid
        </h2>

        <BidFlow
          minBid={DEFAULT_MIN_BID}
          minIncrement={DEFAULT_MIN_INCREMENT}
          remainingSlots={remainingSlots}
          deadline={DEADLINE_UTC}
        />
      </div>
    </section>
  );
}
