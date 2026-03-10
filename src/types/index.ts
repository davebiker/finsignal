// ============================================================
// FinSignal — Core TypeScript Types
// ============================================================

export interface WatchlistItem {
  id: string
  user_id: string
  ticker: string
  company_name: string
  sector: string | null
  added_at: string
}

export interface EarningsSnapshot {
  id: string
  ticker: string
  quarter: string
  fiscal_year: number
  revenue_actual: number | null
  revenue_estimate: number | null
  eps_actual: number | null
  eps_estimate: number | null
  revenue_beat_pct: number | null
  eps_beat_pct: number | null
  guidance_direction: 'raised' | 'maintained' | 'lowered' | 'withdrawn' | 'none' | null
  report_date: string | null
  created_at: string
}

export interface AiAnalysis {
  id: string
  ticker: string
  quarter: string
  fiscal_year: number
  analysis_text: string | null
  bull_case: string | null
  base_case: string | null
  bear_case: string | null
  key_risks: string[]
  key_catalysts: string[]
  consensus_pt: number | null
  created_at: string
}

export interface PriceSnapshot {
  id: string
  ticker: string
  price: number | null
  market_cap: number | null
  pe_ratio: number | null
  ev_ebitda: number | null
  recorded_at: string
}

// ── Market data ──────────────────────────────────────────────

export interface MarketIndex {
  name: string
  symbol: string
  value: number
  change: number
  changePct: number
}

export interface CompanyQuote {
  ticker: string
  name: string
  price: number
  change: number
  changePct: number
  marketCap: number
  pe: number | null
  eps: number | null
  volume: number
  avgVolume: number
  weekHigh52: number
  weekLow52: number
  sector: string
  exchange: string
}

export interface EarningsEvent {
  ticker: string
  companyName: string
  reportDate: string
  epsEstimate: number | null
  revenueEstimate: number | null
  period: string
  time: 'BMO' | 'AMC' | 'TNS' // Before Market Open / After Market Close / Time Not Supplied
  sector: string
  marketCap: number
}

// ── AI Analysis Response ─────────────────────────────────────

export interface AiAnalysisResponse {
  bull_case: string
  base_case: string
  bear_case: string
  key_catalysts: string[]
  key_risks: string[]
  eps_outlook_next_q: string
  eps_outlook_q_plus_2: string
  summary: string
  sentiment: 'bullish' | 'neutral' | 'bearish'
  consensus_pt: number | null
}

// ── API responses ────────────────────────────────────────────

export interface AlphaVantageEarnings {
  symbol: string
  annualEarnings: Array<{
    fiscalDateEnding: string
    reportedEPS: string
  }>
  quarterlyEarnings: Array<{
    fiscalDateEnding: string
    reportedDate: string
    reportedEPS: string
    estimatedEPS: string
    surprise: string
    surprisePercentage: string
  }>
}

export interface FMPEarningsResult {
  date: string
  symbol: string
  eps: number
  epsEstimated: number
  revenue: number
  revenueEstimated: number
  period: string
  fiscalYear?: string
  updatedFromDate?: string
}

export interface FMPAnalystEstimate {
  symbol: string
  date: string
  estimatedRevenueLow: number
  estimatedRevenueHigh: number
  estimatedRevenueAvg: number
  estimatedEbitdaLow: number
  estimatedEbitdaHigh: number
  estimatedEbitdaAvg: number
  estimatedEpsLow: number
  estimatedEpsHigh: number
  estimatedEpsAvg: number
  numberAnalystEstimatedRevenue: number
  numberAnalystsEstimatedEps: number
}

export interface FMPEarningsCalendar {
  date: string
  symbol: string
  eps: number | null
  epsEstimated: number | null
  time: string
  revenue: number | null
  revenueEstimated: number | null
  fiscalDateEnding: string
  updatedFromDate: string
}

export type BeatMissLabel = 'beat' | 'miss' | 'inline' | 'n/a'
export type GuidanceDirection = 'raised' | 'maintained' | 'lowered' | 'withdrawn' | 'none'
