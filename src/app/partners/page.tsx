"use client";

import { useState, useEffect } from "react";
import { isExpired } from "@/lib/deadline";
import { BootSequence } from "@/components/boot-sequence";
import { Hero } from "@/components/sections/hero";
import { VideoStage } from "@/components/sections/video-stage";
import { Receipts } from "@/components/sections/receipts";
import { BidSection } from "@/components/sections/bid-section";
import { DeadlineSection } from "@/components/sections/deadline-section";
import { ExpiredState } from "@/components/sections/expired-state";
import { OperatorClose } from "@/components/sections/operator-close";
import { track } from "@/lib/analytics";

export default function PartnersPage() {
  const [bootComplete, setBootComplete] = useState(false);
  const expired = isExpired();

  useEffect(() => {
    track("page_load", { expired });
  }, [expired]);

  return (
    <>
      {!bootComplete && (
        <BootSequence
          expired={expired}
          onComplete={() => setBootComplete(true)}
        />
      )}

      {bootComplete && (
        <main id="main-content" className="animate-[fadeIn_0.5s_ease-out]">
          <Hero />
          <VideoStage />
          <Receipts />

          {expired ? (
            <ExpiredState />
          ) : (
            <>
              <BidSection />
              <DeadlineSection />
            </>
          )}

          <OperatorClose />

          {/* Footer */}
          <footer className="py-8 px-6 text-center text-text-muted text-sm font-mono border-t border-border">
            DWTB?! Studios © {new Date().getFullYear()} · Private platform ·
            Not a public offering
          </footer>
        </main>
      )}
    </>
  );
}
