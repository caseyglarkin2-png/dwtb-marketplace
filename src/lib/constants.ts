// Fallback stats — real numbers from the DWTB machine
export const FALLBACK_STATS = {
  proposalsSent: 30,
  totalViews: 47,
  viewRate: 64,
  pipelineValue: 485000,
  strikeNow: 17,
} as const;

// Fallback market data — used when Railway API is unavailable
export const FALLBACK_MARKET_DATA = {
  status: "open" as const,
  allocations: { total: 3, remaining: 2, accepted: 1 },
  floor_price: 15000,
  deadline: "2026-04-07T03:59:00Z",
  depth: [
    { range: "$15K – $20K", count: 3 },
    { range: "$20K – $30K", count: 2 },
    { range: "$30K – $50K", count: 1 },
    { range: "$50K+", count: 0 },
  ],
  activity: [
    { type: "new_request" as const, ago: "2h" },
    { type: "amount_updated" as const, ago: "6h" },
    { type: "new_request" as const, ago: "1d" },
  ],
  total_requests: 6,
  last_activity: "2026-04-02T14:30:00Z",
} as const;

// Deadline: Monday, April 6 at 11:59 PM ET = UTC 2026-04-07T03:59:00Z
export const DEADLINE_UTC = "2026-04-07T03:59:00Z";

// Slot defaults
export const DEFAULT_TOTAL_SLOTS = 3;
export const DEFAULT_ACCEPTED_SLOTS = 0;

// Contract
export const CONTRACT_VERSION = "Q2-2026-v2.0";

// Accent color
export const ACCENT = "#00FFC2";

// ── Tier Definitions ──────────────────────────────────────────────
export type TierId = "founding" | "growth" | "enterprise";

export interface TierDef {
  id: TierId;
  name: string;
  slotLabel: string;
  bidFloor: number;        // per month
  buyItNow: number;        // per month
  termMonths: number;
  signalPages: number;
  targetAudits: number;
  emailsGenerated: string;
  contentPerMonth: number;
  creativePerMonth: number;
  servicePackages: string;
  reporting: string;
  competitorAudits: string;
  caseyAccess: string;
  rescoring: string;
  highlights: string[];     // short bullet highlights for tier cards
}

export const TIERS: Record<TierId, TierDef> = {
  founding: {
    id: "founding",
    name: "Founding Partner",
    slotLabel: "Slot 1",
    bidFloor: 7500,
    buyItNow: 15000,
    termMonths: 3,
    signalPages: 15,
    targetAudits: 15,
    emailsGenerated: "60+",
    contentPerMonth: 10,
    creativePerMonth: 10,
    servicePackages: "1 included",
    reporting: "Weekly digest + dashboard",
    competitorAudits: "—",
    caseyAccess: "Weekly sync",
    rescoring: "—",
    highlights: [
      "15 micro landing pages per quarter",
      "15 target account or segment briefs",
      "5 launches per month",
      "Monthly strategy review + scorecard",
      "Async revisions within scope",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth Partner",
    slotLabel: "Slot 2",
    bidFloor: 10000,
    buyItNow: 20000,
    termMonths: 3,
    signalPages: 25,
    targetAudits: 25,
    emailsGenerated: "100+",
    contentPerMonth: 20,
    creativePerMonth: 20,
    servicePackages: "1 (priority scheduling)",
    reporting: "Daily brief + weekly digest + dashboard",
    competitorAudits: "—",
    caseyAccess: "Weekly sync + priority",
    rescoring: "Quarterly",
    highlights: [
      "30 micro landing pages per quarter",
      "30 target account or segment briefs",
      "10 launches per month",
      "Monthly campaign review",
      "Quarterly message re-score",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Partner",
    slotLabel: "Slot 3",
    bidFloor: 15000,
    buyItNow: 30000,
    termMonths: 3,
    signalPages: 35,
    targetAudits: 35,
    emailsGenerated: "140+",
    contentPerMonth: 30,
    creativePerMonth: 30,
    servicePackages: "2 (priority + on-call)",
    reporting: "Daily + weekly + monthly exec + Slack/Teams",
    competitorAudits: "3–5 included",
    caseyAccess: "On-call + direct line",
    rescoring: "Quarterly + exec summary",
    highlights: [
      "75 micro landing pages per quarter",
      "75 target account or segment briefs",
      "25 launches per month",
      "Executive ghostwriting + PR support",
      "Casey review + priority queue",
    ],
  },
} as const;

export const TIER_ORDER: TierId[] = ["founding", "growth", "enterprise"];
export const DEFAULT_MIN_BID = TIERS.founding.bidFloor;
export const DEFAULT_MIN_INCREMENT = 500;
