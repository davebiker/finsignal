// ── Value Score / Investment Signal Engine ────────────────────

export type ValueSignal = 'BUY' | 'HOLD' | 'SELL'

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
