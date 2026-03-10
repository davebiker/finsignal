-- ============================================================
-- FinSignal Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- WATCHLIST — per-user, RLS enforced
-- ============================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker      TEXT NOT NULL,
  company_name TEXT NOT NULL,
  sector      TEXT,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- EARNINGS SNAPSHOTS — shared among all authenticated users
-- ============================================================
CREATE TABLE IF NOT EXISTS earnings_snapshots (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker              TEXT NOT NULL,
  quarter             TEXT NOT NULL,          -- e.g. "Q1", "Q2"
  fiscal_year         INTEGER NOT NULL,
  revenue_actual      NUMERIC,
  revenue_estimate    NUMERIC,
  eps_actual          NUMERIC,
  eps_estimate        NUMERIC,
  revenue_beat_pct    NUMERIC,
  eps_beat_pct        NUMERIC,
  guidance_direction  TEXT CHECK (guidance_direction IN ('raised','maintained','lowered','withdrawn','none')),
  report_date         DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticker, quarter, fiscal_year)
);

ALTER TABLE earnings_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view earnings"
  ON earnings_snapshots FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can insert earnings"
  ON earnings_snapshots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth users can update earnings"
  ON earnings_snapshots FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- AI ANALYSES — shared among all authenticated users
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_analyses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker          TEXT NOT NULL,
  quarter         TEXT NOT NULL,
  fiscal_year     INTEGER NOT NULL,
  analysis_text   TEXT,
  bull_case       TEXT,
  base_case       TEXT,
  bear_case       TEXT,
  key_risks       JSONB DEFAULT '[]',
  key_catalysts   JSONB DEFAULT '[]',
  consensus_pt    NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticker, quarter, fiscal_year)
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view analyses"
  ON ai_analyses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can insert analyses"
  ON ai_analyses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth users can update analyses"
  ON ai_analyses FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- PRICE SNAPSHOTS — shared among all authenticated users
-- ============================================================
CREATE TABLE IF NOT EXISTS price_snapshots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker      TEXT NOT NULL,
  price       NUMERIC,
  market_cap  NUMERIC,
  pe_ratio    NUMERIC,
  ev_ebitda   NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view prices"
  ON price_snapshots FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can insert prices"
  ON price_snapshots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Index for fast ticker lookups
CREATE INDEX IF NOT EXISTS idx_earnings_ticker ON earnings_snapshots(ticker, fiscal_year DESC, quarter DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_ticker ON ai_analyses(ticker, fiscal_year DESC);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_ticker ON price_snapshots(ticker, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
