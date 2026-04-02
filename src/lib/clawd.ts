// Clawd Control Plane — Railway API client
// All marketplace data lives on Railway in JSONL on a volume.
// Auth: Authorization: Bearer {RAILWAY_API_TOKEN}

// ── Configuration ───────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 8000;
const RETRY_STATUS_CODES = [502, 503, 504];
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 1; // GET only

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

function generateRequestId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Core Fetch ──────────────────────────────────────────

export interface ClawdFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

async function clawdFetch<T>(
  path: string,
  options: ClawdFetchOptions = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT_MS, retries, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();
  const requestId = generateRequestId();
  const maxRetries = retries ?? (method === "GET" ? MAX_RETRIES : 0);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      if (attempt > 0) {
        console.warn(`[Clawd][${requestId}] Retry ${attempt}/${maxRetries} ${method} ${path}`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }

      const url = `${getBaseUrl()}${path}`;
      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          ...fetchOptions.headers,
        },
      });

      const elapsed = Date.now() - start;

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[Clawd][${requestId}] ${method} ${path} → ${res.status} (${elapsed}ms)`);

        // Retry on transient errors for GET
        if (RETRY_STATUS_CODES.includes(res.status) && attempt < maxRetries) {
          // Handle 429 with Retry-After
          if (res.status === 429) {
            const retryAfter = res.headers.get("Retry-After");
            const waitMs = retryAfter ? Math.min(parseInt(retryAfter, 10) * 1000, 5000) : 2000;
            await new Promise((r) => setTimeout(r, waitMs));
          }
          lastError = new Error(`Clawd ${res.status}: ${text}`);
          continue;
        }

        throw new Error(`Clawd ${res.status}: ${text}`);
      }

      const elapsed2 = Date.now() - start;
      console.log(`[Clawd][${requestId}] ${method} ${path} → ${res.status} (${elapsed2}ms)`);
      return res.json() as Promise<T>;
    } catch (err) {
      const elapsed = Date.now() - start;
      if (err instanceof DOMException && err.name === "AbortError") {
        console.warn(`[Clawd][${requestId}] ${method} ${path} → TIMEOUT (${elapsed}ms)`);
        lastError = new Error(`Clawd timeout: ${method} ${path} (${timeout}ms)`);
        if (attempt < maxRetries) continue;
        throw lastError;
      }
      if (err instanceof Error && err.message.startsWith("Clawd ")) {
        throw err;
      }
      console.warn(`[Clawd][${requestId}] ${method} ${path} → FAILED (${elapsed}ms): ${err instanceof Error ? err.message : err}`);
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) continue;
      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error(`Clawd fetch failed: ${path}`);
}

// ── Connection Check ────────────────────────────────────

export async function checkClawdConnection(): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await getSlots();
    return { connected: true, latency: Date.now() - start };
  } catch (err) {
    return {
      connected: false,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
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
  tier?: string;
  agreement_accepted: boolean;
  consent_hash: string;
  signature_hash?: string;
  contract_version?: string;
  submitted_at: string;
  created_at?: string;
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

// Lite endpoint — returns bid_id, company, status, bid_amount, timestamps only (no PII)
export async function getBidStatus(
  bidId: string
): Promise<{ bid_id: string; company: string; status: string; bid_amount: number; created_at: string; updated_at: string }> {
  return clawdFetch(`/api/marketplace/bid/${encodeURIComponent(bidId)}/status`);
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
