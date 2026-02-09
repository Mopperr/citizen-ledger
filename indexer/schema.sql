-- ─────────────────────────────────────────────────────────────────────
-- Citizen Ledger Indexer – PostgreSQL Schema
-- Creates tables for the event indexer pipeline
-- ─────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Core Event Log ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS indexed_blocks (
    height       BIGINT PRIMARY KEY,
    block_hash   TEXT NOT NULL,
    timestamp    TIMESTAMPTZ NOT NULL,
    indexed_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_events (
    id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    block_height BIGINT NOT NULL REFERENCES indexed_blocks(height),
    tx_hash      TEXT NOT NULL,
    contract     TEXT NOT NULL,
    action       TEXT NOT NULL,
    attributes   JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_contract ON contract_events(contract);
CREATE INDEX idx_events_action   ON contract_events(action);
CREATE INDEX idx_events_height   ON contract_events(block_height);

-- ── Materialized Views for Dashboard ────────────────────────────────

CREATE TABLE IF NOT EXISTS citizen_credentials (
    holder       TEXT NOT NULL,
    cred_type    TEXT NOT NULL,
    issuer       TEXT NOT NULL,
    issued_at    BIGINT NOT NULL,
    revoked      BOOLEAN DEFAULT FALSE,
    revoked_at   BIGINT,
    PRIMARY KEY (holder, cred_type)
);

CREATE TABLE IF NOT EXISTS governance_proposals (
    id           BIGINT PRIMARY KEY,
    proposer     TEXT NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    status       TEXT NOT NULL,
    voting_method TEXT,
    start_height BIGINT,
    end_height   BIGINT,
    execute_at   BIGINT DEFAULT 0,
    votes_for    NUMERIC DEFAULT 0,
    votes_against NUMERIC DEFAULT 0,
    votes_abstain NUMERIC DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_votes (
    proposal_id  BIGINT NOT NULL REFERENCES governance_proposals(id),
    voter        TEXT NOT NULL,
    vote         TEXT NOT NULL,
    weight       NUMERIC DEFAULT 1,
    height       BIGINT NOT NULL,
    PRIMARY KEY (proposal_id, voter)
);

CREATE TABLE IF NOT EXISTS grant_records (
    id           BIGINT PRIMARY KEY,
    applicant    TEXT NOT NULL,
    title        TEXT NOT NULL,
    category     TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    disbursed    NUMERIC DEFAULT 0,
    status       TEXT NOT NULL,
    proposal_id  BIGINT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grant_milestones (
    grant_id     BIGINT NOT NULL REFERENCES grant_records(id),
    milestone_id INT NOT NULL,
    description  TEXT NOT NULL,
    amount       NUMERIC NOT NULL,
    completed    BOOLEAN DEFAULT FALSE,
    evidence     TEXT,
    approved_by  TEXT,
    PRIMARY KEY (grant_id, milestone_id)
);

CREATE TABLE IF NOT EXISTS slash_events (
    id           BIGINT PRIMARY KEY,
    staker       TEXT NOT NULL,
    amount       NUMERIC NOT NULL,
    reason       TEXT NOT NULL,
    height       BIGINT NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staker_snapshots (
    address      TEXT PRIMARY KEY,
    staked       NUMERIC DEFAULT 0,
    pending_rewards NUMERIC DEFAULT 0,
    last_claim_height BIGINT DEFAULT 0,
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Treasury ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS treasury_transactions (
    id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tx_type      TEXT NOT NULL, -- 'deposit' or 'spend'
    amount       NUMERIC NOT NULL,
    category     TEXT,
    recipient    TEXT,
    memo         TEXT,
    height       BIGINT NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Aggregation Views ───────────────────────────────────────────────

CREATE OR REPLACE VIEW v_treasury_summary AS
SELECT
    SUM(CASE WHEN tx_type = 'deposit' THEN amount ELSE 0 END) AS total_deposits,
    SUM(CASE WHEN tx_type = 'spend'   THEN amount ELSE 0 END) AS total_spent,
    SUM(CASE WHEN tx_type = 'deposit' THEN amount ELSE -amount END) AS balance,
    COUNT(*) AS total_transactions
FROM treasury_transactions;

CREATE OR REPLACE VIEW v_governance_summary AS
SELECT
    COUNT(*) AS total_proposals,
    COUNT(*) FILTER (WHERE status = 'Active')    AS active,
    COUNT(*) FILTER (WHERE status = 'Timelocked') AS timelocked,
    COUNT(*) FILTER (WHERE status = 'Passed')    AS passed,
    COUNT(*) FILTER (WHERE status = 'Executed')  AS executed,
    COUNT(*) FILTER (WHERE status = 'Rejected')  AS rejected
FROM governance_proposals;

CREATE OR REPLACE VIEW v_grants_summary AS
SELECT
    COUNT(*) AS total_grants,
    COUNT(*) FILTER (WHERE status = 'Approved' OR status = 'Active') AS active,
    COUNT(*) FILTER (WHERE status = 'Completed') AS completed,
    SUM(total_amount) AS total_committed,
    SUM(disbursed) AS total_disbursed
FROM grant_records;
