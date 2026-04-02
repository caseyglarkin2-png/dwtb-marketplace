const EVENTS_KEY = "dwtb_analytics_queue";

type EventName =
  | "page_load"
  | "cta_click"
  | "bid_start"
  | "bid_step"
  | "contract_open"
  | "consent_given"
  | "signature_complete"
  | "bid_submit_success"
  | "bid_submit_fail";

interface AnalyticsEvent {
  event: EventName;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

let queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (queue.length === 0) return;
  const batch = [...queue];
  queue = [];

  // Fire-and-forget to audit endpoint
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics",
      JSON.stringify({ events: batch })
    );
  } else {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    }).catch(() => {
      // Re-queue on failure
      queue.push(...batch);
    });
  }
}

export function track(event: EventName, properties?: Record<string, string | number | boolean>) {
  const entry: AnalyticsEvent = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  };

  queue.push(entry);

  // Debounce flush to batch events
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 2000);
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
