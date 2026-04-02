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
  console.log(
    `[AUDIT] ${params.eventType} | ${params.entityType}:${params.entityId}`,
    params.payload ? JSON.stringify(params.payload) : ""
  );
}
