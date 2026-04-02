"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="text-[#00FFC2] font-mono text-xs tracking-widest">
          SYSTEM ERROR
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Something went wrong
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="text-white/20 font-mono text-xs">
            ref: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-[#00FFC2] px-6 py-3 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <a
            href="/"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
