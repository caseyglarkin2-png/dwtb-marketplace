import { DEADLINE_UTC } from "./constants";

export const DEADLINE = new Date(DEADLINE_UTC);

export function isExpired(now: Date = new Date()): boolean {
  return now >= DEADLINE;
}

export function getTimeRemaining(now: Date = new Date()) {
  const diff = DEADLINE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
