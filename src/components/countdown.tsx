"use client";

import { useState, useEffect, useCallback } from "react";
import { getTimeRemaining } from "@/lib/deadline";

interface CountdownProps {
  deadline: Date;
  onExpire?: () => void;
}

export function Countdown({ deadline, onExpire }: CountdownProps) {
  const [time, setTime] = useState(getTimeRemaining(new Date()));

  const tick = useCallback(() => {
    const remaining = getTimeRemaining(new Date());
    setTime(remaining);
    if (remaining.total <= 0 && onExpire) {
      onExpire();
    }
  }, [onExpire]);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (time.total <= 0) {
    return (
      <div className="font-mono text-4xl md:text-6xl font-bold text-danger tracking-wider">
        CLOSED
      </div>
    );
  }

  return (
    <div className="font-mono text-4xl md:text-7xl font-bold tracking-wider text-text-primary" role="timer" aria-label={`${time.days} days ${time.hours} hours ${time.minutes} minutes ${time.seconds} seconds remaining`}>
      <span>{pad(time.days)}</span>
      <span className="text-text-muted mx-1 md:mx-3">:</span>
      <span>{pad(time.hours)}</span>
      <span className="text-text-muted mx-1 md:mx-3">:</span>
      <span>{pad(time.minutes)}</span>
      <span className="text-text-muted mx-1 md:mx-3">:</span>
      <span>{pad(time.seconds)}</span>
      <div className="flex justify-between text-xs md:text-sm text-text-muted mt-2 font-sans font-normal max-w-[480px] mx-auto">
        <span className="w-12 text-center">DAYS</span>
        <span className="w-12 text-center">HRS</span>
        <span className="w-12 text-center">MIN</span>
        <span className="w-12 text-center">SEC</span>
      </div>
    </div>
  );
}
