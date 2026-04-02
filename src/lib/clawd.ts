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

// ── Bid Persistence ─────────────────────────────────────
// Bids are stored on Clawd as enriched leads with bid-specific metadata.
// Status transitions: submitted → accepted → paid → onboarded
//                                → declined
//                                → waitlisted → accepted (if slot opens)

export type BidStatus =
  | "submitted"
  | "accepted"
  | "paid"
  | "onboarded"
  | "declined"
  | "waitlisted"
  | "expired";

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

export async function updateLeadMeta(
  leadId: string,
  meta: Record<string, unknown>
): Promise<ClawdLead> {
  return clawdFetch<ClawdLead>(`/api/intake/leads/${encodeURIComponent(leadId)}`, {
    method: "PATCH",
    body: JSON.stringify({ meta }),
  });
}

export async function updateLeadStatus(
  leadId: string,
  status: string,
  notes?: string
): Promise<ClawdLead> {
  const body: Record<string, unknown> = { status };
  if (notes) body.notes = notes;
  return clawdFetch<ClawdLead>(`/api/intake/leads/${encodeURIComponent(leadId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getLeadById(
  leadId: string
): Promise<ClawdLead> {
  return clawdFetch<ClawdLead>(`/api/intake/leads/${encodeURIComponent(leadId)}`);
}

export function extractBidRecord(lead: ClawdLead): BidRecord {
  const meta = (lead.meta || {}) as Record<string, unknown>;
  return {
    bid_id: lead.id,
    bidder_name: lead.name,
    bidder_email: lead.email,
    bidder_company: lead.company,
    bidder_title: (meta.bidder_title as string) || "",
    bid_amount: (meta.bid_amount as number) || 0,
    status: (meta.bid_status as BidStatus) || "submitted",
    contract_version: (meta.contract_version as string) || "",
    signature_hash: (meta.signature_hash as string) || "",
    signed_at: (meta.signed_at as string) || lead.created_at,
    note: lead.notes || undefined,
    submitted_at: lead.created_at,
    accepted_at: meta.accepted_at as string | undefined,
    paid_at: meta.paid_at as string | undefined,
    ip_address: meta.ip_address as string | undefined,
    user_agent: meta.user_agent as string | undefined,
  };
}
