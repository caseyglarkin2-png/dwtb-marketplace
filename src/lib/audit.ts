import { createServiceClient } from "./supabase/server";

export type AuditEventType =
  | "bid_submitted"
  | "bid_accepted"
  | "bid_declined"
  | "bid_waitlisted"
  | "bid_expired"
  | "contract_signed"
  | "email_sent"
  | "email_delivery_failed"
  | "invite_used"
  | "invite_revoked"
  | "admin_login"
  | "slot_config_updated"
  | "manual_close";

export async function appendAuditEntry(params: {
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  actorEmail?: string;
  actorIp?: string;
  actorUa?: string;
  payload?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("audit_trail").insert({
    event_type: params.eventType,
    entity_type: params.entityType,
    entity_id: params.entityId,
    actor_email: params.actorEmail ?? null,
    actor_ip: params.actorIp ?? null,
    actor_ua: params.actorUa ?? null,
    payload: params.payload ?? null,
  });

  if (error) {
    console.error("Audit trail write failed:", error);
  }
}
