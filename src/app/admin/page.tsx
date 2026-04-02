"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DEADLINE_UTC } from "@/lib/constants";

// ─── Types matching actual API responses ────────────────

interface Bid {
  id: string;
  bidder_name: string;
  bidder_email: string;
  bidder_company: string;
  bid_amount: number;
  status: string;
  source: string;
  audit_score: number;
  classification: string;
  notes: string;
  domain: string;
  strongest_gap: string;
  stage_history: Array<{ stage: string; ts: string }>;
  created_at: string;
  updated_at: string;
}

interface SlotConfig {
  total_slots: number;
  accepted_slots: number;
  current_min_bid: number;
  min_increment: number;
  deadline: string;
  manually_closed: boolean;
}

interface Stats {
  proposals_sent: number;
  total_views: number;
  view_rate: number;
  pipeline_value: number;
  strike_now: number;
  total_leads: number;
  new_leads: number;
  last_24h: number;
  as_of: string;
  source: string;
}

interface GeneratedToken {
  code: string;
  invite_url: string;
  invitee_email?: string;
  created_at: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

type SortKey = "bid_amount" | "created_at" | "bidder_company" | "status";
type SortDir = "asc" | "desc";

// Status transitions — matches API VALID_TRANSITIONS exactly
const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ["accepted", "declined", "waitlisted"],
  waitlisted: ["accepted", "declined"],
  accepted: ["paid", "declined"],
  paid: ["onboarded"],
  declined: [],
  onboarded: [],
  expired: [],
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-500/20 text-blue-400",
  accepted: "bg-green-500/20 text-green-400",
  declined: "bg-red-500/20 text-red-400",
  waitlisted: "bg-orange-500/20 text-orange-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  onboarded: "bg-[#00FFC2]/20 text-[#00FFC2]",
  expired: "bg-white/10 text-white/40",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  accepted: "Accepted",
  declined: "Declined",
  waitlisted: "Waitlisted",
  paid: "Paid",
  onboarded: "Onboarded",
  expired: "Expired",
};

export default function MissionControl() {
  const router = useRouter();

  // ─── Data state ──────
  const [bids, setBids] = useState<Bid[]>([]);
  const [slotConfig, setSlotConfig] = useState<SlotConfig | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ─── UI state ──────
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [confirmAction, setConfirmAction] = useState<{
    bid: Bid;
    status: string;
  } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  // ─── Token state (persisted across polls via ref) ──────
  const [showTokenGen, setShowTokenGen] = useState(false);
  const [tokenEmail, setTokenEmail] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);
  const [generatedTokens, setGeneratedTokens] = useState<GeneratedToken[]>(
    []
  );

  // ─── Email compose state ──────
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const prevSelectedBidId = useRef<string | null>(null);

  // ─── Countdown state ──────
  const [countdown, setCountdown] = useState("");

  // ─── Clear email compose when switching bids (W10) ──────
  useEffect(() => {
    if (selectedBid?.id !== prevSelectedBidId.current) {
      prevSelectedBidId.current = selectedBid?.id ?? null;
      setEmailSubject("");
      setEmailBody("");
    }
  }, [selectedBid]);

  // ─── Toast helper ──────
  const addToast = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

  // ─── Data fetching ──────
  const fetchData = useCallback(async () => {
    try {
      const [bidsRes, slotsRes, statsRes] = await Promise.all([
        fetch("/api/admin/bids"),
        fetch("/api/admin/slots"),
        fetch("/api/admin/stats"),
      ]);

      if (bidsRes.status === 401) {
        setAuthError(true);
        return;
      }

      const [bidsData, slotsData, statsData] = await Promise.all([
        bidsRes.json(),
        slotsRes.json(),
        statsRes.json(),
      ]);

      const newBids = bidsData.bids || [];
      setBids(newBids);
      setSlotConfig(slotsData.slot_config || null);
      setStats(statsData.stats?.[0] || null);
      setLastRefresh(new Date());
      // Sync selected bid with fresh data
      setSelectedBid((prev) =>
        prev ? newBids.find((b: Bid) => b.id === prev.id) ?? null : null
      );
    } catch {
      addToast("Failed to refresh data", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Countdown timer ──────
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const deadline = new Date(DEADLINE_UTC).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setCountdown("EXPIRED");
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setCountdown(
        days > 0
          ? `${days}d ${hours}h ${minutes}m ${seconds}s`
          : `${hours}h ${minutes}m ${seconds}s`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Auth redirect ──────
  if (authError) {
    router.push("/admin/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <span className="text-white/40 font-mono text-sm">
          Initializing Mission Control...
        </span>
      </div>
    );
  }

  // ─── Computed values ──────
  const totalPipeline = bids.reduce((sum, b) => sum + b.bid_amount, 0);
  const topBid =
    bids.length > 0 ? Math.max(...bids.map((b) => b.bid_amount)) : 0;
  const avgBid =
    bids.length > 0 ? Math.round(totalPipeline / bids.length) : 0;
  const acceptedCount = bids.filter((b) => b.status === "accepted").length;
  const pendingCount = bids.filter((b) =>
    ["submitted", "waitlisted"].includes(b.status)
  ).length;
  const slotsRemaining = slotConfig
    ? slotConfig.total_slots - slotConfig.accepted_slots
    : 0;

  const statusCounts = bids.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  // ─── Filtered & sorted bids ──────
  const filteredBids = statusFilter
    ? bids.filter((b) => b.status === statusFilter)
    : bids;

  const sortedBids = [...filteredBids].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "bid_amount":
        cmp = a.bid_amount - b.bid_amount;
        break;
      case "created_at":
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "bidder_company":
        cmp = a.bidder_company.localeCompare(b.bidder_company);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  // ─── Actions ──────
  const updateStatus = async (bidId: string, newStatus: string) => {
    setUpdating(bidId);
    try {
      const res = await fetch(`/api/admin/bids/${bidId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Optimistic update
        const updated = { status: newStatus, updated_at: new Date().toISOString() };
        setBids((prev) =>
          prev.map((b) => (b.id === bidId ? { ...b, ...updated } : b))
        );
        setSelectedBid((prev) =>
          prev?.id === bidId ? { ...prev, ...updated } : prev
        );
        addToast(
          `Status → ${STATUS_LABELS[newStatus] || newStatus}`,
          "success"
        );
        fetchData(); // Also refresh from server
      } else {
        const data = await res.json();
        addToast(data.message || data.error || "Status update failed", "error");
      }
    } catch {
      addToast("Network error — status update failed", "error");
    } finally {
      setUpdating(null);
      setConfirmAction(null);
    }
  };

  const sendCustomEmail = async (bidId: string) => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      addToast("Subject and body are required", "error");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/admin/bids/${bidId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: emailSubject, body: emailBody }),
      });

      if (res.ok) {
        const data = await res.json();
        addToast(`Email sent to ${data.to}`, "success");
        setEmailSubject("");
        setEmailBody("");
      } else {
        const data = await res.json();
        addToast(data.error || "Email failed to send", "error");
      }
    } catch {
      addToast("Network error — email failed", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const resendNotification = async (bidId: string) => {
    try {
      const res = await fetch(`/api/admin/bids/${bidId}/notify`, {
        method: "POST",
      });
      if (res.ok) {
        addToast("Notification resent", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Notification failed", "error");
      }
    } catch {
      addToast("Network error", "error");
    }
  };

  const generateToken = async () => {
    setCreatingToken(true);
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitee_email: tokenEmail || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        const newToken: GeneratedToken = {
          code: data.token.code,
          invite_url: data.invite_url,
          invitee_email: tokenEmail || undefined,
          created_at: data.token.created_at,
        };
        setGeneratedTokens((prev) => [newToken, ...prev]);
        setTokenEmail("");
        addToast("Invite token generated", "success");
      } else {
        addToast("Failed to generate token", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setCreatingToken(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("Copied to clipboard", "success");
    } catch {
      addToast("Copy failed — select manually", "error");
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "bid_amount" ? "desc" : "asc");
    }
  };

  // ─── Render ──────
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ═══ HEADER ═══ */}
      <header className="border-b border-white/10 bg-[#0A0A0A] sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-wider">
              MISSION CONTROL
            </h1>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  countdown === "EXPIRED"
                    ? "bg-red-500"
                    : "bg-[#00FFC2] animate-pulse"
                }`}
              />
              <span className="text-sm font-mono text-white/60">
                {countdown === "EXPIRED" ? "WINDOW CLOSED" : countdown}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {slotConfig && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                slotsRemaining <= 0
                  ? "border-red-500/30 bg-red-500/10"
                  : slotConfig.manually_closed
                    ? "border-yellow-500/30 bg-yellow-500/10"
                    : "border-white/10 bg-white/5"
              }`}>
                {slotConfig.manually_closed && (
                  <span className="text-xs text-yellow-400 font-mono">CLOSED</span>
                )}
                <span className="text-xs text-white/40">SLOTS</span>
                <span className={`text-sm font-mono font-bold ${
                  slotsRemaining <= 0 ? "text-red-400" : "text-[#00FFC2]"
                }`}>
                  {acceptedCount}/{slotConfig.total_slots}
                </span>
                {pendingCount > 0 && (
                  <span className="text-xs text-yellow-400 font-mono">
                    +{pendingCount} pending
                  </span>
                )}
                {slotsRemaining <= 0 && (
                  <span className="text-xs text-red-400 font-mono">FULL</span>
                )}
              </div>
            )}

            <button
              onClick={() => setShowTokenGen(!showTokenGen)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#00FFC2]/10 text-[#00FFC2] border border-[#00FFC2]/20 hover:bg-[#00FFC2]/20 transition-colors"
            >
              + INVITE
            </button>

            {lastRefresh && (
              <span className="text-xs text-white/20 font-mono">
                {lastRefresh.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ═══ TOKEN GENERATOR (collapsible) ═══ */}
      {showTokenGen && (
        <div className="border-b border-white/10 bg-white/[0.02]">
          <div className="max-w-[1440px] mx-auto px-6 py-4">
            <div className="flex gap-3 items-end mb-3">
              <div className="flex-1 max-w-sm">
                <label className="block text-xs text-white/40 font-mono mb-1">
                  Invitee Email (optional)
                </label>
                <input
                  type="email"
                  value={tokenEmail}
                  onChange={(e) => setTokenEmail(e.target.value)}
                  placeholder="buyer@company.com"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white text-sm placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && generateToken()}
                />
              </div>
              <button
                onClick={generateToken}
                disabled={creatingToken}
                className="rounded-lg bg-[#00FFC2] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-30"
              >
                {creatingToken ? "..." : "Generate"}
              </button>
            </div>

            {generatedTokens.length > 0 && (
              <div className="space-y-2">
                {generatedTokens.map((t) => (
                  <div
                    key={t.code}
                    className="flex items-center gap-3 rounded-lg border border-[#00FFC2]/20 bg-[#00FFC2]/5 px-3 py-2"
                  >
                    <span className="text-xs text-[#00FFC2] font-mono flex-1 truncate">
                      {t.invite_url}
                    </span>
                    {t.invitee_email && (
                      <span className="text-xs text-white/30">
                        {t.invitee_email}
                      </span>
                    )}
                    <button
                      onClick={() => copyToClipboard(t.invite_url)}
                      className="text-xs px-2 py-1 rounded bg-white/10 text-white/60 hover:bg-white/20 font-mono shrink-0"
                    >
                      COPY
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ METRICS STRIP ═══ */}
      <div className="border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: "PIPELINE",
              value: `$${totalPipeline.toLocaleString()}`,
              accent: true,
            },
            {
              label: "TOP BID",
              value: `$${topBid.toLocaleString()}`,
              accent: true,
            },
            { label: "AVG BID", value: `$${avgBid.toLocaleString()}` },
            { label: "TOTAL BIDS", value: String(bids.length) },
            { label: "ACCEPTED", value: String(acceptedCount) },
            {
              label: "REMAINING",
              value:
                slotsRemaining <= 0
                  ? "FULL"
                  : `${slotsRemaining} slot${slotsRemaining !== 1 ? "s" : ""}`,
              accent: slotsRemaining > 0,
              warn: slotsRemaining <= 0,
            },
          ].map(({ label, value, accent, warn }) => (
            <div
              key={label}
              className={`rounded-lg border px-4 py-3 ${
                warn
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="text-[10px] font-mono text-white/30 tracking-wider mb-1">
                {label}
              </div>
              <div
                className={`text-lg font-mono font-bold ${
                  warn
                    ? "text-red-400"
                    : accent
                      ? "text-[#00FFC2]"
                      : "text-white"
                }`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STATUS FILTERS ═══ */}
      <div className="border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
              !statusFilter
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/40 hover:bg-white/10"
            }`}
          >
            All ({bids.length})
          </button>
          {Object.entries(statusCounts)
            .sort(([a], [b]) => {
              const order = [
                "submitted",
                "waitlisted",
                "accepted",
                "paid",
                "onboarded",
                "declined",
                "expired",
              ];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([status, count]) => (
              <button
                key={status}
                onClick={() =>
                  setStatusFilter(statusFilter === status ? null : status)
                }
                className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                  statusFilter === status
                    ? STATUS_COLORS[status] || "bg-white/20 text-white"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                {STATUS_LABELS[status] || status} ({count})
              </button>
            ))}
        </div>
      </div>

      {/* ═══ BID TABLE + SIDE PANEL ═══ */}
      <div className="max-w-[1440px] mx-auto flex">
        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 font-mono text-xs uppercase">
                {(
                  [
                    ["bidder_company", "Company"],
                    ["bid_amount", "Amount"],
                    ["status", "Status"],
                    ["created_at", "Submitted"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="py-3 px-4 text-left cursor-pointer hover:text-white/60 transition-colors select-none"
                  >
                    {label}
                    {sortKey === key && (
                      <span className="ml-1 text-[#00FFC2]">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBids.map((bid) => (
                <tr
                  key={bid.id}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                    selectedBid?.id === bid.id ? "bg-white/[0.07]" : ""
                  }`}
                  onClick={() =>
                    setSelectedBid(
                      selectedBid?.id === bid.id ? null : bid
                    )
                  }
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-white hover:text-[#00FFC2] transition-colors">
                      {bid.bidder_company}
                    </div>
                    <div className="text-white/30 text-xs">
                      {bid.bidder_name} · {bid.bidder_email}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#00FFC2] font-bold">
                    ${Number(bid.bid_amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        STATUS_COLORS[bid.status] ||
                        "bg-white/10 text-white/40"
                      }`}
                    >
                      {STATUS_LABELS[bid.status] || bid.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/40 text-xs font-mono">
                    {new Date(bid.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {updating === bid.id ? (
                      <span className="text-white/30 text-xs font-mono">
                        updating...
                      </span>
                    ) : (
                      <div className="flex gap-1 justify-end flex-wrap">
                        {(VALID_TRANSITIONS[bid.status] || []).map(
                          (action) => (
                            <button
                              key={action}
                              onClick={() =>
                                setConfirmAction({ bid, status: action })
                              }
                              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                                action === "accepted" ||
                                action === "paid" ||
                                action === "onboarded"
                                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                  : action === "declined"
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    : "bg-white/10 text-white/50 hover:bg-white/20"
                              }`}
                            >
                              {STATUS_LABELS[action] || action}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {sortedBids.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="text-white/30 font-mono text-sm">
                      {statusFilter
                        ? `No ${statusFilter} bids`
                        : "Waiting for first bid..."}
                    </div>
                    {!statusFilter && countdown !== "EXPIRED" && (
                      <div className="text-white/20 font-mono text-xs mt-2">
                        Window closes in {countdown}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ═══ SIDE PANEL ═══ */}
        {selectedBid && (
          <div className="w-[420px] shrink-0 border-l border-white/10 bg-white/[0.02] overflow-y-auto max-h-[calc(100vh-280px)] sticky top-[53px]">
            <div className="p-6 space-y-6">
              {/* Panel header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {selectedBid.bidder_company}
                  </h2>
                  <div className="text-sm text-white/50">
                    {selectedBid.bidder_name}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBid(null)}
                  className="text-white/30 hover:text-white text-lg leading-none"
                  aria-label="Close panel"
                >
                  ×
                </button>
              </div>

              {/* Bid details */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Amount</span>
                  <span className="font-mono text-[#00FFC2] font-bold">
                    ${Number(selectedBid.bid_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono ${STATUS_COLORS[selectedBid.status]}`}
                  >
                    {STATUS_LABELS[selectedBid.status] || selectedBid.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Email</span>
                  <button
                    onClick={() => copyToClipboard(selectedBid.bidder_email)}
                    className="text-white/70 hover:text-[#00FFC2] text-xs font-mono transition-colors"
                    title="Click to copy"
                  >
                    {selectedBid.bidder_email}
                  </button>
                </div>
                {selectedBid.domain && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Domain</span>
                    <span className="text-white/70 text-xs font-mono">
                      {selectedBid.domain}
                    </span>
                  </div>
                )}
                {selectedBid.source && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Source</span>
                    <span className="text-white/70 text-xs font-mono">
                      {selectedBid.source}
                    </span>
                  </div>
                )}
                {selectedBid.audit_score > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Audit Score</span>
                    <span className="text-white/70 font-mono">
                      {selectedBid.audit_score}
                    </span>
                  </div>
                )}
                {selectedBid.classification && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Classification</span>
                    <span className="text-white/70 text-xs font-mono">
                      {selectedBid.classification}
                    </span>
                  </div>
                )}
                {selectedBid.strongest_gap && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Strongest Gap</span>
                    <span className="text-white/70 text-xs">
                      {selectedBid.strongest_gap}
                    </span>
                  </div>
                )}
              </div>

              {/* Stage history */}
              {selectedBid.stage_history.length > 0 && (
                <div>
                  <div className="text-xs text-white/30 font-mono mb-2">
                    STAGE HISTORY
                  </div>
                  <div className="space-y-1">
                    {selectedBid.stage_history.map((sh, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#00FFC2]/50" />
                        <span className="text-white/50 font-mono">
                          {sh.stage}
                        </span>
                        <span className="text-white/20 font-mono ml-auto">
                          {new Date(sh.ts).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBid.notes && (
                <div>
                  <div className="text-xs text-white/30 font-mono mb-2">
                    NOTES
                  </div>
                  <div className="text-xs text-white/50 rounded-lg bg-white/5 p-3">
                    {selectedBid.notes}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => resendNotification(selectedBid.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                >
                  Resend Notification
                </button>
                <button
                  onClick={() => copyToClipboard(selectedBid.bidder_email)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                >
                  Copy Email
                </button>
              </div>

              {/* Email compose */}
              <div>
                <div className="text-xs text-white/30 font-mono mb-2">
                  COMPOSE EMAIL
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white text-sm placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none"
                  />
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your message..."
                    rows={4}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white text-sm placeholder:text-white/20 focus:border-[#00FFC2] focus:outline-none resize-none"
                  />
                  <button
                    onClick={() => sendCustomEmail(selectedBid.id)}
                    disabled={
                      sendingEmail ||
                      !emailSubject.trim() ||
                      !emailBody.trim()
                    }
                    className="w-full rounded-lg bg-[#00FFC2] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-30 transition-opacity"
                  >
                    {sendingEmail
                      ? "Sending..."
                      : `Send to ${selectedBid.bidder_email}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ OUTREACH METRICS FOOTER ═══ */}
      {stats && (
        <div className="border-t border-white/10 mt-8">
          <div className="max-w-[1440px] mx-auto px-6 py-4">
            <div className="text-xs text-white/20 font-mono mb-2">
              OUTREACH METRICS
            </div>
            <div className="flex gap-6 flex-wrap text-xs font-mono text-white/40">
              <span>
                Proposals Sent:{" "}
                <span className="text-white/60">{stats.proposals_sent}</span>
              </span>
              <span>
                Total Views:{" "}
                <span className="text-white/60">{stats.total_views}</span>
              </span>
              <span>
                View Rate:{" "}
                <span className="text-white/60">{stats.view_rate}%</span>
              </span>
              <span>
                Total Leads:{" "}
                <span className="text-white/60">{stats.total_leads}</span>
              </span>
              <span>
                New Leads:{" "}
                <span className="text-white/60">{stats.new_leads}</span>
              </span>
              <span>
                Last 24h:{" "}
                <span className="text-white/60">{stats.last_24h}</span>
              </span>
              {stats.source && (
                <span className="text-white/15">src: {stats.source}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CONFIRMATION MODAL ═══ */}
      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="bg-[#141414] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2">
              {confirmAction.status === "accepted"
                ? "Accept"
                : confirmAction.status === "declined"
                  ? "Decline"
                  : confirmAction.status === "paid"
                    ? "Mark Paid"
                    : confirmAction.status === "onboarded"
                      ? "Mark Onboarded"
                      : "Waitlist"}{" "}
              {confirmAction.bid.bidder_company}?
            </h3>
            <p className="text-sm text-white/50 mb-1">
              {confirmAction.bid.bidder_name} · $
              {Number(confirmAction.bid.bid_amount).toLocaleString()}
            </p>
            <p className="text-sm text-white/40 mb-6">
              {confirmAction.status === "accepted" && slotsRemaining <= 0
                ? `⚠ ALL SLOTS ARE FULL. Accepting will over-allocate. This will email ${confirmAction.bid.bidder_email} the signed contract PDF and payment instructions.`
                : confirmAction.status === "accepted"
                ? `This will email ${confirmAction.bid.bidder_email} the signed contract PDF and payment instructions.`
                : confirmAction.status === "declined"
                  ? `This will email ${confirmAction.bid.bidder_email} a decline notification. This action cannot be undone.`
                  : confirmAction.status === "paid"
                    ? "This marks payment as received. No email is sent."
                    : confirmAction.status === "onboarded"
                      ? "This marks the partner as onboarded."
                      : `This will email ${confirmAction.bid.bidder_email} a waitlist notification.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateStatus(confirmAction.bid.id, confirmAction.status)
                }
                disabled={!!updating}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-30 ${
                  confirmAction.status === "declined"
                    ? "bg-red-500 text-white"
                    : "bg-[#00FFC2] text-black"
                }`}
              >
                {updating ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TOASTS ═══ */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`px-4 py-2 rounded-lg text-sm font-mono shadow-lg ${
              toast.type === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : toast.type === "error"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/10 text-white/60 border border-white/10"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
