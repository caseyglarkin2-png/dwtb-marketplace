"use client";

import { useState, useEffect } from "react";
import { useInView } from "@/lib/hooks/use-in-view";

export function VideoStage() {
  const envUrl = process.env.NEXT_PUBLIC_VIDEO_URL;
  const [videoUrl, setVideoUrl] = useState(envUrl || "");
  const { ref, isInView } = useInView();

  // Allow admin-configured video URL override
  useEffect(() => {
    if (envUrl) return; // env var takes precedence
    fetch("/api/slots")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.video_url) setVideoUrl(data.video_url);
      })
      .catch(() => {});
  }, [envUrl]);

  return (
    <section
      id="machine"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-24 md:py-32 px-6 transition-opacity duration-700 ${isInView ? "opacity-100" : "opacity-0"}`}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h2 className="text-3xl md:text-5xl font-bold mb-4">The Machine</h2>

        {/* Signal loop */}
        <div className="font-mono text-sm md:text-base text-accent tracking-widest mb-8">
          SIGNAL → RESEARCH → FRAME → BUILD → DEPLOY → TRACK
        </div>

        {/* Supporting copy */}
        <p className="text-text-secondary text-lg max-w-3xl mb-12 leading-relaxed">
          DWTB?! Studios identifies the gap between your operational reality and
          your digital presence. Then it closes the gap with account-specific
          assets, proposals, and campaign direction that convert to signed
          business.
        </p>

        {/* Video container */}
        <div className="relative w-full aspect-video bg-surface-raised rounded-lg border border-border overflow-hidden">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              loading="lazy"
              title="Casey Glarkin — The Freight Marketer"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-2xl md:text-3xl font-bold mb-2">
                Casey Glarkin
              </div>
              <div className="text-text-secondary text-lg">
                The Freight Marketer
              </div>
              <div className="mt-4 text-text-muted text-sm font-mono">
                [Video dropping soon]
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
