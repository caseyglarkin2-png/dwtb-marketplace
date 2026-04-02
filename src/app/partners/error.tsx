"use client";

export default function PartnersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-sm font-mono font-medium tracking-wide">
            SYSTEM ERROR
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Something broke.
        </h1>
        <p className="text-sm text-white/40">
          The platform encountered an error. This has been logged.
        </p>
        {error.digest && (
          <p className="text-xs text-white/20 font-mono">ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00FFC2] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
