export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-[#00FFC2] animate-pulse" />
        <span className="text-white/40 font-mono text-sm tracking-wide">
          Initializing Mission Control...
        </span>
      </div>
    </div>
  );
}
