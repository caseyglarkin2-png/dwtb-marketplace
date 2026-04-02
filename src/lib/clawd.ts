// Clawd Control Plane — Railway API client
// All marketplace data lives on Railway in JSONL on a volume.
// Auth: Authorization: Bearer {RAILWAY_API_TOKEN}

const getBaseUrl = () => {
  const url = process.env.RAILWAY_API_URL;
  if (!url) throw new Error("RAILWAY_API_URL is not configured");
  return url.replace(/\/+$/, "");
};

const getToken = () => {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) throw new Error("RAILWAY_API_TOKEN is not configured");
  return token;
};

async function clawdFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Clawd ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Intake / Leads ──────────────────────────────────────

export interface ClawdLead {
  id: string;
  source: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  intent: string;
  message: string;
  lead_score: number;
  status: string;
  campaign: string;
  owner: string;
  notes: string;
  fingerprint: string;
  attribution: Record<string, unknown>;
  meta: Record<string, unknown>;
  received_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  company: string;
  phone?: string;
  message?: string;
  source?: string;
  intent?: string;
  meta?: Record<string, unknown>;
}

export interface CreateLeadResponse {
  success: boolean;
  lead: ClawdLead;
}

export async function createLead(
  data: CreateLeadRequest
): Promise<CreateLeadResponse> {
  return clawdFetch<CreateLeadResponse>("/api/intake/leads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Lead Stats ──────────────────────────────────────────

export interface LeadStats {
  total: number;
  new: number;
  last_24h: number;
  top_source: string;
  by_source: Record<string, number>;
  by_intent: Record<string, number>;
}

export async function getLeadStats(
  source?: string
): Promise<LeadStats> {
  const qs = source ? `?source=${encodeURIComponent(source)}` : "";
  return clawdFetch<LeadStats>(`/api/intake/leads/stats${qs}`);
}

// ── Pipeline ────────────────────────────────────────────

export interface PipelineDeal {
  deal_id: string;
  company: string;
  domain: string;
  contact_name: string;
  contact_email: string;
  deal_value: number;
  stage: string;
  source: string;
  notes: string;
  audit_score: number;
  classification: string;
  strongest_gap: string;
  created_at: string;
  updated_at: string;
  stage_history: Array<{ stage: string; ts: string }>;
  meeting_prep?: string;
}

export interface PipelineStats {
  total_deals: number;
  by_stage: Record<string, number>;
  total_pipeline_value: number;
  active_pipeline_value: number;
  won_value: number;
  won_count: number;
  lost_count: number;
  win_rate_pct: number;
  stages: string[];
  stage_labels: Record<string, string>;
}

export interface PipelineResponse {
  deals: PipelineDeal[];
  total: number;
  stats: PipelineStats;
}

export async function getPipeline(): Promise<PipelineResponse> {
  return clawdFetch<PipelineResponse>("/api/dwtb-pipeline");
}

// ── Marketplace Bids ────────────────────────────────────
// Bids use Clawd's dedicated /api/marketplace/bid endpoints.
// Status transitions: pending → accepted → paid → onboarded
//                              → declined
//                              → waitlisted → accepted (if slot opens)

export type BidStatus =
  | "pending"
  | "submitted"
  | "accepted"
  | "paid"
  | "onboarded"
  | "declined"
  | "waitlisted"
  | "withdrawn"
  | "expired";

export interface ClawdBid {
  bid_id: string;
  company: string;
  name: string;
  email: string;
  title: string;
  bid_amount: number;
  message: string;
  status: BidStatus;
  status_note?: string;
  agreement_accepted: boolean;
  consent_hash: string;
  submitted_at: string;
  updated_at: string;
}

export interface BidRecord {
  bid_id: string;
  bidder_name: string;
  bidder_email: string;
  bidder_company: string;
  bidder_title: string;
  bid_amount: number;
  status: BidStatus;
  contract_version: string;
  signature_hash: string;
  signed_at: string;
  note?: string;
  submitted_at: string;
  accepted_at?: string;
  paid_at?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface CreateBidRequest {
  company: string;
  name: string;
  email: string;
  title: string;
  bid_amount: number;
  message?: string;
  agreement_accepted: boolean;
  consent_hash: string;
}

export async function createBid(data: CreateBidRequest): Promise<ClawdBid> {
  return clawdFetch<ClawdBid>("/api/marketplace/bid", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getBids(): Promise<{ total: number; bids: ClawdBid[] }> {
  return clawdFetch<{ total: number; bids: ClawdBid[] }>("/api/marketplace/bids");
}

export async function getBid(bidId: string): Promise<ClawdBid> {
  // The /status endpoint returns lite data (no email/name).
  // Fetch from the full bids list and find the matching bid.
  const { bids } = await getBids();
  const bid = bids.find((b) => b.bid_id === bidId);
  if (!bid) throw new Error(`Bid ${bidId} not found`);
  return bid;
}

export async function updateBid(
  bidId: string,
  update: { status?: string; status_note?: string }
): Promise<ClawdBid> {
  return clawdFetch<ClawdBid>(`/api/marketplace/bid/${encodeURIComponent(bidId)}`, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

// Convert ClawdBid to BidRecord for backward compatibility
export function toBidRecord(bid: ClawdBid, extra?: Record<string, unknown>): BidRecord {
  return {
    bid_id: bid.bid_id,
    bidder_name: bid.name,
    bidder_email: bid.email,
    bidder_company: bid.company,
    bidder_title: bid.title,
    bid_amount: bid.bid_amount,
    status: bid.status,
    contract_version: (extra?.contract_version as string) || "",
    signature_hash: bid.consent_hash,
    signed_at: bid.submitted_at,
    note: bid.message || bid.status_note || undefined,
    submitted_at: bid.submitted_at,
    accepted_at: extra?.accepted_at as string | undefined,
    paid_at: extra?.paid_at as string | undefined,
    ip_address: extra?.ip_address as string | undefined,
    user_agent: extra?.user_agent as string | undefined,
  };
}

// ── Slots ───────────────────────────────────────────────

export interface SlotInfo {
  id: string;
  status: string;
}

export interface SlotsStatus {
  slots: SlotInfo[];
  available: number;
  held: number;
  committed: number;
  sold: number;
  total: number;
  access_mode: string;
  quarter: string;
  price_monthly: number;
  engagement_months: number;
}

export async function getSlots(): Promise<SlotsStatus> {
  return clawdFetch<SlotsStatus>("/api/slots/status");
}
