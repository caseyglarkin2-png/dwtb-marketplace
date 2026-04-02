"use client";

import { AnimatedCounter } from "@/components/animated-counter";
import { FALLBACK_STATS } from "@/lib/constants";

const TIMELINE = [
  { date: "Q1 2026", event: "DWTB?! Studios launched" },
  { date: "Q1 2026", event: "Brush Pass data acquired" },
  { date: "Q1 2026", event: "Machine live" },
  { date: "April 2026", event: "Private bid window open" },
];

export function Receipts() {
  const stats = FALLBACK_STATS;

  return (
    <section id="receipts" className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-12">Proof.</h2>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-16">
          <StatCard
            end={stats.proposalsSent}
            label="Proposals Sent"
          />
          <StatCard
            end={stats.totalViews}
            label="Total Views"
          />
          <StatCard
            end={stats.viewRate}
            suffix="%"
            label="View Rate"
          />
          <StatCard
            end={stats.pipelineValue}
            prefix="$"
            label="Pipeline"
            formatFn={(n) =>
              n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString()
            }
          />
          <StatCard
            end={stats.strikeNow}
            label="STRIKE_NOW"
            className="col-span-2 md:col-span-1"
          />
        </div>

        {/* Timeline */}
        <div className="border-l-2 border-border pl-6 space-y-6">
          {TIMELINE.map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-accent border-2 border-surface" />
              <div className="font-mono text-sm text-accent">{item.date}</div>
              <div className="text-text-secondary mt-1">{item.event}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  end,
  prefix,
  suffix,
  label,
  className = "",
  formatFn,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  label: string;
  className?: string;
  formatFn?: (n: number) => string;
}) {
  return (
    <div
      className={`bg-surface-raised border border-border rounded-lg p-6 text-center ${className}`}
    >
      <AnimatedCounter
        end={end}
        prefix={prefix}
        suffix={suffix}
        formatFn={formatFn}
        className="text-3xl md:text-4xl font-bold font-mono text-accent"
      />
      <div className="text-text-muted text-sm mt-2 font-mono">{label}</div>
    </div>
  );
}
