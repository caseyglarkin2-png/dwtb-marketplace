"use client";

import {
  DEFAULT_MIN_BID,
  DEFAULT_MIN_INCREMENT,
  DEFAULT_ACCEPTED_SLOTS,
  DEFAULT_TOTAL_SLOTS,
} from "@/lib/constants";
import { DEADLINE } from "@/lib/deadline";
import { BidForm } from "@/components/bid/bid-form";

export function BidSection() {
  const remainingSlots = DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS;
  const deadlineStr = DEADLINE.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  return (
    <section id="bid" className="py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-12">
          Place Your Bid
        </h2>

        {/* Offer summary */}
        <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8 mb-12">
          <h3 className="text-lg font-semibold mb-4 text-accent font-mono">
            Q2 2026 PARTNERSHIP SLOT
          </h3>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex items-start gap-3">
              <span className="text-accent mt-0.5">→</span>
              <span>
                Privileged access to the DWTB?! Studios GTM engine for Q2 2026
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent mt-0.5">→</span>
              <span>
                Account research, signal monitoring, asset production, campaign
                direction
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent mt-0.5">→</span>
              <span>
                1 of {DEFAULT_TOTAL_SLOTS} total Q2 client slots ·{" "}
                <span className="text-accent font-semibold">
                  {remainingSlots} remaining
                </span>
              </span>
            </li>
          </ul>
          <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
            <div>
              <div className="text-text-muted">MINIMUM BID</div>
              <div className="text-xl font-bold">
                ${DEFAULT_MIN_BID.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-text-muted">MIN INCREMENT</div>
              <div className="text-xl font-bold">
                ${DEFAULT_MIN_INCREMENT.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-text-muted">DEADLINE</div>
              <div className="text-xl font-bold">
                {deadlineStr}
              </div>
            </div>
          </div>
        </div>

        {/* Bid form shell */}
        <BidForm
          minBid={DEFAULT_MIN_BID}
          minIncrement={DEFAULT_MIN_INCREMENT}
        />
      </div>
    </section>
  );
}
