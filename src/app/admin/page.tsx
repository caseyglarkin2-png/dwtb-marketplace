"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Bid {
  id: string;
  bidder_name: string;
  bidder_title: string;
  bidder_company: string;
  bidder_email: string;
  bid_amount: number;
  note: string | null;
  status: string;
  contract_version: string;
  notification_sent: boolean;
  created_at: string;
  contracts: Array<{
    id: string;
    signed_at: string;
    signature_hash: string;
  }>;
}

interface SlotConfig {
  id: string;
  quarter?: string;
  total_slots: number;
  accepted_slots: number;
  pending_slots: number;
  current_min_bid: number;
  min_increment: number;
  deadline: string;
  manually_closed: boolean;
}

interface Token {
  id: string;
  code: string;
  invitee_email: string | null;
  access_mode: string;
  status: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  created_at: string;
}

interface AuditEntry {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_email: string | null;
  actor_ip: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

type Tab = "bids" | "tokens" | "slots" | "audit" | "stats";

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bids");
  const [bids, setBids] = useState<Bid[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [slotConfig, setSlotConfig] = useState<SlotConfig | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [authError, setAuthError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [bidsRes, tokensRes, slotsRes, auditRes] = await Promise.all([
        fetch("/api/admin/bids"),
        fetch("/api/admin/tokens"),
        fetch("/api/admin/slots"),
        fetch("/api/admin/audit?limit=50"),
      ]);

      if (bidsRes.status === 401) {
        setAuthError(true);
        return;
      }

      const [bidsData, tokensData, slotsData, auditData] = await Promise.all([
        bidsRes.json(),
        tokensRes.json(),
        slotsRes.json(),
        auditRes.json(),
      ]);

      setBids(bidsData.bids || []);
      setTokens(tokensData.tokens || []);
      setSlotConfig(slotsData.slot_config || null);
      setAudit(auditData.entries || []);
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (authError) {
    router.push("/admin/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <span className="text-white/40 font-mono">Loading...</span>
      </div>
    );
  }

  const unnotifiedCount = bids.filter((b) => !b.notification_sent).length;
  const statusCounts = bids.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">DWTB?! Admin</h1>
          <div className="flex items-center gap-4 text-sm">
            {slotConfig && (
              <span className="text-white/40 font-mono">
                Slots: {slotConfig.accepted_slots}/{slotConfig.total_slots}{" "}
                filled
                {slotConfig.pending_slots > 0 &&
                  ` · ${slotConfig.pending_slots} pending`}
              </span>
            )}
            <span className="text-white/40 font-mono">
              {bids.length} bid{bids.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      {/* Unnotified banner */}
      {unnotifiedCount > 0 && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-3">
          <div className="max-w-7xl mx-auto text-sm text-yellow-400 font-mono">
            {unnotifiedCount} bid{unnotifiedCount !== 1 ? "s" : ""} with
            undelivered notifications
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10 px-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          {(
            [
              ["bids", "Bids"],
              ["tokens", "Tokens"],
              ["slots", "Slots"],
              ["stats", "Stats"],
              ["audit", "Audit"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3 text-sm font-mono border-b-2 transition-colors ${
                tab === key
                  ? "border-[#00FFC2] text-[#00FFC2]"
                  : "border-transparent text-white/40 hover:text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === "bids" && (
          <BidsTab
            bids={bids}
            statusCounts={statusCounts}
            onRefresh={fetchData}
          />
        )}
        {tab === "tokens" && (
          <TokensTab tokens={tokens} onRefresh={fetchData} />
        )}
        {tab === "slots" && slotConfig && (
          <SlotsTab slotConfig={slotConfig} onRefresh={fetchData} />
        )}
        {tab === "stats" && <StatsTab onRefresh={fetchData} />}
        {tab === "audit" && <AuditTab entries={audit} />}
      </div>
    </div>
  );
}

// ============================================
// BIDS TAB
// ============================================

function BidsTab({
  bids,
  statusCounts,
  onRefresh,
}: {
  bids: Bid[];
  statusCounts: Record<string, number>;
  onRefresh: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);

  const updateStatus = async (bidId: string, newStatus: string) => {
    setUpdating(bidId);
    try {
      const res = await fetch(`/api/admin/bids/${bidId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onRefresh();
      else {
        const data = await res.json();
        alert(data.message || data.error || "Failed");
      }
    } catch {
      alert("Network error");
    } finally {
      setUpdating(null);
    }
  };

  const resendNotification = async (bidId: string) => {
    try {
      await fetch(`/api/admin/bids/${bidId}/notify`, { method: "POST" });
      onRefresh();
    } catch {
      // silent
    }
  };

  const statusColors: Record<string, string> = {
    submitted: "bg-blue-500/20 text-blue-400",
    pending_review: "bg-yellow-500/20 text-yellow-400",
    accepted: "bg-green-500/20 text-green-400",
    declined: "bg-red-500/20 text-red-400",
    waitlisted: "bg-orange-500/20 text-orange-400",
    expired: "bg-white/10 text-white/40",
  };

  const nextActions: Record<string, string[]> = {
    submitted: ["pending_review", "accepted", "declined", "waitlisted"],
    pending_review: ["accepted", "declined", "waitlisted"],
    waitlisted: ["accepted", "declined"],
    accepted: ["declined"],
  };

  return (
    <div className="space-y-6">
      {/* Status summary */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div
            key={status}
            className={`px-3 py-1 rounded text-xs font-mono ${
              statusColors[status] || "bg-white/10 text-white/40"
            }`}
          >
            {status}: {count}
          </div>
        ))}
      </div>

      {/* Bid table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 font-mono text-xs uppercase">
              <th className="py-3 px-3 text-left">Company</th>
              <th className="py-3 px-3 text-left">Name</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-center">Notified</th>
              <th className="py-3 px-3 text-left">Submitted</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => (
              <tr
                key={bid.id}
                className="border-b border-white/5 hover:bg-white/5"
              >
                <td className="py-3 px-3">
                  <div className="font-medium">{bid.bidder_company}</div>
                  <div className="text-white/30 text-xs">{bid.bidder_email}</div>
                </td>
                <td className="py-3 px-3 text-white/70">
                  <div>{bid.bidder_name}</div>
                  <div className="text-white/30 text-xs">{bid.bidder_title}</div>
                </td>
                <td className="py-3 px-3 text-right font-mono text-[#00FFC2]">
                  ${Number(bid.bid_amount).toLocaleString()}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      statusColors[bid.status] || "bg-white/10 text-white/40"
                    }`}
                  >
                    {bid.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  {bid.notification_sent ? (
                    <span className="text-green-400">&#10003;</span>
                  ) : (
                    <button
                      onClick={() => resendNotification(bid.id)}
                      className="text-yellow-400 hover:text-yellow-300 text-xs font-mono"
                    >
                      resend
                    </button>
                  )}
                </td>
                <td className="py-3 px-3 text-white/40 text-xs font-mono">
                  {new Date(bid.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-3 px-3 text-right">
                  {updating === bid.id ? (
                    <span className="text-white/30 text-xs">...</span>
                  ) : (
                    <div className="flex gap-1 justify-end flex-wrap">
                      {(nextActions[bid.status] || []).map((action) => (
                        <button
                          key={action}
                          onClick={() => updateStatus(bid.id, action)}
                          className={`px-2 py-1 rounded text-xs font-mono ${
                            action === "accepted"
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              : action === "declined"
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              : "bg-white/10 text-white/50 hover:bg-white/20"
                          }`}
                        >
                          {action.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {bids.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-white/30">
                  No bids submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// TOKENS TAB
// ============================================

function TokensTab({
  tokens,
  onRefresh,
}: {
  tokens: Token[];
  onRefresh: () => void;
}) {
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const createToken = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitee_email: email || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastUrl(data.invite_url);
        setEmail("");
        onRefresh();
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  const revokeToken = async (id: string) => {
    try {
      await fetch(`/api/admin/tokens?id=${id}`, { method: "DELETE" });
      onRefresh();
    } catch {
      // silent
    }
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    used: "bg-white/10 text-white/40",
    revoked: "bg-red-500/20 text-red-400",
    expired: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <div className="space-y-6">
      {/* Create token */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-white/40 font-mono mb-1">
            Invitee Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="buyer@company.com"
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white text-sm placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none"
          />
        </div>
        <button
          onClick={createToken}
          disabled={creating}
          className="rounded-lg bg-[#00FFC2] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-30"
        >
          {creating ? "..." : "Generate Token"}
        </button>
      </div>

      {lastUrl && (
        <div className="rounded-lg border border-[#00FFC2]/20 bg-[#00FFC2]/5 p-4">
          <div className="text-xs text-white/40 font-mono mb-1">
            Invite URL — copy and send:
          </div>
          <div className="text-sm text-[#00FFC2] font-mono break-all select-all">
            {lastUrl}
          </div>
        </div>
      )}

      {/* Token list */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 font-mono text-xs uppercase">
              <th className="py-3 px-3 text-left">Code</th>
              <th className="py-3 px-3 text-left">Email</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-center">Uses</th>
              <th className="py-3 px-3 text-left">Expires</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr
                key={token.id}
                className="border-b border-white/5 hover:bg-white/5"
              >
                <td className="py-3 px-3 font-mono text-xs">
                  {token.code.slice(0, 8)}...
                </td>
                <td className="py-3 px-3 text-white/50 text-xs">
                  {token.invitee_email || "—"}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      statusColors[token.status] || "bg-white/10 text-white/40"
                    }`}
                  >
                    {token.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-center font-mono text-xs text-white/40">
                  {token.used_count}/{token.max_uses}
                </td>
                <td className="py-3 px-3 text-white/40 text-xs font-mono">
                  {new Date(token.expires_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="py-3 px-3 text-right">
                  {token.status === "active" && (
                    <button
                      onClick={() => revokeToken(token.id)}
                      className="px-2 py-1 rounded text-xs font-mono bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-white/30">
                  No tokens created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// SLOTS TAB
// ============================================

function SlotsTab({
  slotConfig,
  onRefresh,
}: {
  slotConfig: SlotConfig;
  onRefresh: () => void;
}) {
  const [minBid, setMinBid] = useState(slotConfig.current_min_bid);
  const [manuallyClosed, setManuallyClosed] = useState(
    slotConfig.manually_closed
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_min_bid: minBid,
          manually_closed: manuallyClosed,
        }),
      });
      if (res.ok) onRefresh();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Quarter</span>
          <span className="text-white font-mono">{slotConfig.quarter || "Q2-2026"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Total Slots</span>
          <span className="text-white font-mono">{slotConfig.total_slots}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Accepted</span>
          <span className="text-[#00FFC2] font-mono">
            {slotConfig.accepted_slots}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Pending</span>
          <span className="text-yellow-400 font-mono">
            {slotConfig.pending_slots}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Remaining</span>
          <span className="text-white font-mono">
            {slotConfig.total_slots - slotConfig.accepted_slots}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-white/40 font-mono mb-1">
            Current Min Bid ($)
          </label>
          <input
            type="number"
            value={minBid}
            onChange={(e) => setMinBid(Number(e.target.value))}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white font-mono text-sm focus:border-[#00FFC2] focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={manuallyClosed}
            onChange={(e) => setManuallyClosed(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#00FFC2]"
          />
          <span className="text-sm text-white/70">
            Manually close bidding window
          </span>
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#00FFC2] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-30"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ============================================
// STATS TAB
// ============================================

function StatsTab({ onRefresh }: { onRefresh: () => void }) {
  const [proposals, setProposals] = useState(38);
  const [views, setViews] = useState(54);
  const [viewRate, setViewRate] = useState(142);
  const [pipeline, setPipeline] = useState(635000);
  const [strikeNow, setStrikeNow] = useState(6);
  const [saving, setSaving] = useState(false);

  // Load current stats
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats?.[0]) {
          const s = data.stats[0];
          setProposals(s.proposals_sent);
          setViews(s.total_views);
          setViewRate(Number(s.view_rate));
          setPipeline(Number(s.pipeline_value));
          setStrikeNow(s.strike_now);
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposals_sent: proposals,
          total_views: views,
          view_rate: viewRate,
          pipeline_value: pipeline,
          strike_now: strikeNow,
        }),
      });
      if (res.ok) onRefresh();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      {[
        { label: "Proposals Sent", value: proposals, set: setProposals },
        { label: "Total Views", value: views, set: setViews },
        { label: "View Rate (%)", value: viewRate, set: setViewRate },
        { label: "Pipeline Value ($)", value: pipeline, set: setPipeline },
        { label: "STRIKE_NOW", value: strikeNow, set: setStrikeNow },
      ].map(({ label, value, set }) => (
        <div key={label}>
          <label className="block text-xs text-white/40 font-mono mb-1">
            {label}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => set(Number(e.target.value))}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white font-mono text-sm focus:border-[#00FFC2] focus:outline-none"
          />
        </div>
      ))}

      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-[#00FFC2] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-30"
      >
        {saving ? "Saving..." : "Update Stats"}
      </button>
    </div>
  );
}

// ============================================
// AUDIT TAB
// ============================================

function AuditTab({ entries }: { entries: AuditEntry[] }) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-lg border border-white/5 bg-white/5 p-3 text-xs font-mono"
        >
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[#00FFC2]">{entry.event_type}</span>
            <span className="text-white/20">
              {entry.entity_type}:{entry.entity_id.slice(0, 8)}
            </span>
            <span className="text-white/20 ml-auto">
              {new Date(entry.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          {entry.actor_email && (
            <div className="text-white/30">{entry.actor_email}</div>
          )}
          {entry.payload && (
            <div className="text-white/20 mt-1 break-all">
              {JSON.stringify(entry.payload)}
            </div>
          )}
        </div>
      ))}
      {entries.length === 0 && (
        <div className="py-12 text-center text-white/30">
          No audit entries yet.
        </div>
      )}
    </div>
  );
}
