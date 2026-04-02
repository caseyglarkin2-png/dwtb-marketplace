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

export function BidSection() {
  const [minBid, setMinBid] = useState(DEFAULT_MIN_BID);
  const [minIncrement, setMinIncrement] = useState(DEFAULT_MIN_INCREMENT);
  const [remainingSlots, setRemainingSlots] = useState(
    DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS
  );
  const [deadline, setDeadline] = useState(DEADLINE_UTC);
  const [manuallyClosed, setManuallyClosed] = useState(false);

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
          if (data.deadline) setDeadline(data.deadline);
          if (typeof data.manually_closed === "boolean")
            setManuallyClosed(data.manually_closed);
        }
      })
      .catch(() => {
        // Keep defaults
      });
  }, []);

  if (manuallyClosed) {
    return (
      <section id="bid" className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Window Closed
          </h2>
          <p className="text-white/50 text-lg">
            The bid window has been manually closed. Contact casey@dwtb.dev for
            inquiries.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="bid" className="py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-12">
          Place Your Bid
        </h2>

        <BidFlow
          minBid={minBid}
          minIncrement={minIncrement}
          remainingSlots={remainingSlots}
          deadline={deadline}
        />
      </div>
    </section>
  );
}
