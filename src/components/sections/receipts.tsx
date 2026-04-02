"use client";

import { useState, useEffect } from "react";
import { AnimatedCounter } from "@/components/animated-counter";
import { FALLBACK_STATS } from "@/lib/constants";
import { useInView } from "@/lib/hooks/use-in-view";

const TIMELINE = [
  { date: "Q1 2026", event: "DWTB?! Studios launched" },
  { date: "Q1 2026", event: "Brush Pass data acquired" },
  { date: "Q1 2026", event: "Machine live" },
  { date: "April 2026", event: "Q2 offering open" },
];

interface StatsData {
  proposalsSent: number;
  totalViews: number;
  viewRate: number;
  pipelineValue: number;
  strikeNow: number;
  asOf: string | null;
}

export function Receipts() {
  const [stats, setStats] = useState<StatsData>({
    ...FALLBACK_STATS,
    asOf: null,
  });
  const { ref, isInView } = useInView();

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.proposalsSent === "number") {
          setStats(data);
        }
      })
      .catch(() => {
        // Keep fallback stats
      });
  }, []);

  return (
    <section
      id="receipts"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-24 md:py-32 px-6 transition-all duration-700 ease-out ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-12 tracking-tight">Proof.</h2>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-16">
          <StatCard
            end={stats.proposalsSent}
            label="Proposals Sent"
            index={0}
            animate={isInView}
          />
          <StatCard
            end={stats.totalViews}
            label="Total Views"
            index={1}
            animate={isInView}
          />
          <StatCard
            end={stats.viewRate}
            suffix="%"
            label="View Rate"
            index={2}
            animate={isInView}
          />
          <StatCard
            end={stats.pipelineValue}
            prefix="$"
            label="Pipeline"
            formatFn={(n) =>
              n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString()
            }
            index={3}
            animate={isInView}
          />
          <StatCard
            end={stats.strikeNow}
            label="Active Pipeline"
            className="col-span-2 md:col-span-1"
            index={4}
            animate={isInView}
          />
        </div>

        {/* Compressed timeline — horizontal on desktop, vertical on mobile */}
        <div className="hidden md:flex items-center justify-between gap-2 py-4">
          {TIMELINE.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center text-center min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-accent mb-2" />
                <div className="font-mono text-xs text-accent whitespace-nowrap">{item.date}</div>
                <div className="text-text-muted text-xs mt-0.5 whitespace-nowrap">{item.event}</div>
              </div>
              {i < TIMELINE.length - 1 && (
                <div className="flex-1 h-px bg-border min-w-[24px] -mt-6" />
              )}
            </div>
          ))}
        </div>
        <div className="md:hidden border-l-2 border-border pl-5 space-y-4">
          {TIMELINE.map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-surface" />
              <div className="font-mono text-xs text-accent">{item.date}</div>
              <div className="text-text-muted text-xs mt-0.5">{item.event}</div>
            </div>
          ))}
        </div>

        {/* Stats freshness (F19) */}
        {stats.asOf && (
          <div className="mt-8 text-center">
            <span className="text-xs text-white/30 font-mono">
              As of{" "}
              {new Date(stats.asOf).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
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
  index = 0,
  animate = false,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  label: string;
  className?: string;
  formatFn?: (n: number) => string;
  index?: number;
  animate?: boolean;
}) {
  return (
    <div
      className={`bg-surface-raised/80 backdrop-blur-sm border border-border/50 rounded-lg p-4 md:p-5 text-center transition-all duration-500 ease-out ${
        animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <AnimatedCounter
        end={end}
        prefix={prefix}
        suffix={suffix}
        formatFn={formatFn}
        className="text-2xl md:text-3xl font-bold font-mono text-accent"
      />
      <div className="text-text-muted text-xs mt-1.5 font-mono uppercase tracking-wider">{label}</div>
    </div>
  );
}
