export function VideoStage() {
  const videoUrl = process.env.NEXT_PUBLIC_VIDEO_URL;

  return (
    <section id="machine" className="py-24 md:py-32 px-6">
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
              allow="autoplay; fullscreen"
              allowFullScreen
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
