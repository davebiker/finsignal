// ── Value Score / Investment Signal Engine ────────────────────

export type ValueSignal = 'BUY' | 'HOLD' | 'SELL'
export type EpsTrend = 'rising' | 'falling' | 'stable'

/** Calculate EPS estimate trend from recent quarters (newest first). */
export function calculateEpsTrend(
  estimates: (number | null)[] // newest-first, at least 2 values needed
): EpsTrend | null {
  const valid = estimates.filter((v): v is number => v != null)
  if (valid.length < 2) return null

  // Compare consecutive pairs (newest vs older)
  // valid[0] = most recent, valid[1] = previous, etc.
  let rising = 0
  let falling = 0
  const count = Math.min(valid.length - 1, 2) // up to 2 comparisons (3 quarters)
  for (let i = 0; i < count; i++) {
    const diff = valid[i] - valid[i + 1]
    if (diff > 0.005) rising++
    else if (diff < -0.005) falling++
  }

  if (rising > 0 && falling === 0) return 'rising'
  if (falling > 0 && rising === 0) return 'falling'
  return 'stable'
}

export function epsTrendLabel(trend: EpsTrend): string {
  switch (trend) {
    case 'rising': return '↑ Rising Estimates'
    case 'falling': return '↓ Falling Estimates'
    case 'stable': return '→ Stable'
  }
}

export function epsTrendColor(trend: EpsTrend): string {
  switch (trend) {
    case 'rising': return 'text-accent-green'
    case 'falling': return 'text-accent-red'
    case 'stable': return 'text-accent-gold'
  }
}

export function epsTrendBg(trend: EpsTrend): string {
  switch (trend) {
    case 'rising': return 'bg-accent-green-dim border-accent-green/20'
    case 'falling': return 'bg-accent-red-dim border-accent-red/20'
    case 'stable': return 'bg-accent-gold-dim border-accent-gold/20'
  }
}

export interface SignalInput {
  price: number | null
  analystTarget: number | null
  pe: number | null
  sector: string | null
  epsBeatRatio: number | null // 0-1 fraction of quarters that beat
}

// Rough sector average P/E ratios
const SECTOR_PE: Record<string, number> = {
  'Technology': 28,
  'Healthcare': 22,
  'Financial Services': 13,
  'Financials': 13,
  'Consumer Cyclical': 25,
  'Consumer Defensive': 22,
  'Energy': 12,
  'Industrials': 18,
  'Communication Services': 20,
  'Real Estate': 35,
  'Utilities': 18,
  'Basic Materials': 15,
}

const DEFAULT_SECTOR_PE = 20

export function getSectorAvgPE(sector: string | null): number {
  if (!sector) return DEFAULT_SECTOR_PE
  return SECTOR_PE[sector] ?? DEFAULT_SECTOR_PE
}

export function calculateSignal(input: SignalInput): {
  signal: ValueSignal
  upside: number | null
  peVsSector: number | null // ratio: pe / sectorAvg
} {
  const { price, analystTarget, pe, sector, epsBeatRatio } = input

  // Calculate upside %
  const upside = price && analystTarget && price > 0
    ? ((analystTarget - price) / price) * 100
    : null

  // P/E vs sector average
  const sectorAvg = getSectorAvgPE(sector)
  const peVsSector = pe != null ? pe / sectorAvg : null

  // SELL conditions: upside < 0% OR P/E > 2x sector average
  if (upside != null && upside < 0) {
    return { signal: 'SELL', upside, peVsSector }
  }
  if (peVsSector != null && peVsSector > 2) {
    return { signal: 'SELL', upside, peVsSector }
  }

  // BUY conditions: upside > 20% AND P/E below sector avg AND beat ratio > 50%
  const upsideOk = upside != null && upside > 20
  const peOk = peVsSector != null && peVsSector < 1
  const beatOk = epsBeatRatio != null && epsBeatRatio > 0.5

  if (upsideOk && peOk && beatOk) {
    return { signal: 'BUY', upside, peVsSector }
  }

  // Default: HOLD
  return { signal: 'HOLD', upside, peVsSector }
}

export function signalColor(signal: ValueSignal): string {
  switch (signal) {
    case 'BUY': return 'text-accent-green'
    case 'SELL': return 'text-accent-red'
    case 'HOLD': return 'text-accent-gold'
  }
}

export function signalBg(signal: ValueSignal): string {
  switch (signal) {
    case 'BUY': return 'bg-accent-green-dim border-accent-green/20'
    case 'SELL': return 'bg-accent-red-dim border-accent-red/20'
    case 'HOLD': return 'bg-accent-gold-dim border-accent-gold/20'
  }
}
