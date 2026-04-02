-- DWTB?! Studios — /partners Bid + Contract Platform
-- Migration 001: Initial schema
-- Sprint Plan v2.0

-- ============================================
-- INVITE TOKENS
-- ============================================
CREATE TABLE invite_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(32) UNIQUE NOT NULL,
  invitee_email VARCHAR(255),
  access_mode   VARCHAR(20) DEFAULT 'private'
                CHECK (access_mode IN ('private', 'public', 'vip')),
  status        VARCHAR(20) DEFAULT 'active'
                CHECK (status IN ('active', 'used', 'revoked', 'expired')),
  expires_at    TIMESTAMPTZ NOT NULL,
  max_uses      INT DEFAULT 1,
  used_count    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BIDS
-- ============================================
CREATE TABLE bids (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key   VARCHAR(64) UNIQUE,
  bidder_name       VARCHAR(255) NOT NULL,
  bidder_title      VARCHAR(255) NOT NULL,
  bidder_company    VARCHAR(255) NOT NULL,
  bidder_email      VARCHAR(255) NOT NULL,
  bid_amount        DECIMAL(12,2) NOT NULL,
  note              TEXT,
  contract_version  VARCHAR(20) NOT NULL,
  slot_intent       INT DEFAULT 1,
  status            VARCHAR(20) DEFAULT 'draft'
                    CHECK (status IN (
                      'draft', 'submitted', 'pending_review',
                      'accepted', 'declined', 'waitlisted', 'expired'
                    )),
  notification_sent BOOLEAN DEFAULT FALSE,
  invite_token_id   UUID REFERENCES invite_tokens(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_bid_per_email UNIQUE (bidder_email, contract_version)
);

-- ============================================
-- CONTRACTS
-- ============================================
CREATE TABLE contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_version  VARCHAR(20) NOT NULL,
  bid_id            UUID NOT NULL REFERENCES bids(id),
  signer_name       VARCHAR(255) NOT NULL,
  signer_title      VARCHAR(255) NOT NULL,
  signer_company    VARCHAR(255) NOT NULL,
  signer_email      VARCHAR(255) NOT NULL,
  typed_name        VARCHAR(255) NOT NULL,
  consent_given     BOOLEAN NOT NULL DEFAULT FALSE,
  signed_at         TIMESTAMPTZ NOT NULL,
  signature_hash    VARCHAR(128) NOT NULL,
  signature_data    TEXT,
  ip_address        INET,
  user_agent        TEXT,
  receipt_ref       VARCHAR(64),
  receipt_url       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT TRAIL (append-only)
-- ============================================
CREATE TABLE audit_trail (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  VARCHAR(50) NOT NULL,
  entity_type VARCHAR(20) NOT NULL,
  entity_id   UUID NOT NULL,
  actor_email VARCHAR(255),
  actor_ip    INET,
  actor_ua    TEXT,
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SLOT STATE
-- ============================================
CREATE TABLE slot_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter         VARCHAR(10) NOT NULL,
  total_slots     INT NOT NULL DEFAULT 3,
  accepted_slots  INT NOT NULL DEFAULT 1,
  pending_slots   INT NOT NULL DEFAULT 0,
  current_min_bid DECIMAL(12,2) NOT NULL,
  min_increment   DECIMAL(12,2) NOT NULL DEFAULT 500.00,
  deadline        TIMESTAMPTZ NOT NULL,
  manually_closed BOOLEAN DEFAULT FALSE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STATS (admin-controlled source of truth)
-- ============================================
CREATE TABLE stats_snapshot (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposals_sent  INT NOT NULL,
  total_views     INT NOT NULL,
  view_rate       DECIMAL(5,1) NOT NULL,
  pipeline_value  DECIMAL(12,2) NOT NULL,
  strike_now      INT NOT NULL,
  as_of           TIMESTAMPTZ DEFAULT NOW(),
  source          VARCHAR(50) DEFAULT 'manual'
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_snapshot ENABLE ROW LEVEL SECURITY;

-- slot_config: public read (limited)
CREATE POLICY "Public read slot_config" ON slot_config
  FOR SELECT USING (true);

-- stats_snapshot: public read (latest only)
CREATE POLICY "Public read stats_snapshot" ON stats_snapshot
  FOR SELECT USING (true);

-- audit_trail: no public access
-- (service role bypasses RLS)

-- bids: no public access
-- (service role bypasses RLS)

-- contracts: no public access
-- (service role bypasses RLS)

-- invite_tokens: no public access
-- (service role bypasses RLS)

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_bids_email ON bids(bidder_email);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_idempotency ON bids(idempotency_key);
CREATE INDEX idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_invite_code ON invite_tokens(code);
CREATE INDEX idx_stats_as_of ON stats_snapshot(as_of DESC);

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO slot_config (quarter, total_slots, accepted_slots, pending_slots, current_min_bid, min_increment, deadline)
VALUES ('Q2-2026', 3, 1, 0, 15000.00, 500.00, '2026-04-07T03:59:00Z');

INSERT INTO stats_snapshot (proposals_sent, total_views, view_rate, pipeline_value, strike_now, source)
VALUES (38, 54, 142.0, 635000.00, 6, 'manual');
