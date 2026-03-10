import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BeatMissLabel } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Number formatting ────────────────────────────────────────

export function formatNumber(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—'
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatLargeNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toFixed(2)
}

export function formatPercent(n: number | null | undefined, showSign = true): string {
  if (n == null) return '—'
  const sign = showSign && n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export function formatCurrency(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—'
  return `$${formatNumber(n, decimals)}`
}

// ── Beat/Miss logic ──────────────────────────────────────────

export function getBeatMissLabel(
  actual: number | null,
  estimate: number | null,
  threshold = 1
): BeatMissLabel {
  if (actual == null || estimate == null) return 'n/a'
  const pct = ((actual - estimate) / Math.abs(estimate)) * 100
  if (pct > threshold) return 'beat'
  if (pct < -threshold) return 'miss'
  return 'inline'
}

export function beatMissColor(label: BeatMissLabel): string {
  switch (label) {
    case 'beat': return 'text-accent-green'
    case 'miss': return 'text-accent-red'
    case 'inline': return 'text-accent-gold'
    default: return 'text-text-secondary'
  }
}

export function beatMissBg(label: BeatMissLabel): string {
  switch (label) {
    case 'beat': return 'bg-accent-green-dim text-accent-green border border-accent-green/20'
    case 'miss': return 'bg-accent-red-dim text-accent-red border border-accent-red/20'
    case 'inline': return 'bg-accent-gold-dim text-accent-gold border border-accent-gold/20'
    default: return 'bg-surface-3 text-text-secondary'
  }
}

export function guidanceColor(dir: string | null): string {
  switch (dir) {
    case 'raised': return 'text-accent-green'
    case 'maintained': return 'text-accent-gold'
    case 'lowered': return 'text-accent-red'
    case 'withdrawn': return 'text-text-secondary'
    default: return 'text-text-muted'
  }
}

export function changeColor(value: number | null): string {
  if (value == null) return 'text-text-secondary'
  if (value > 0) return 'text-accent-green'
  if (value < 0) return 'text-accent-red'
  return 'text-text-secondary'
}

// ── Date helpers ─────────────────────────────────────────────

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function quarterLabel(quarter: string, year: number): string {
  return `${quarter} ${year}`
}

// ── Sector colors ────────────────────────────────────────────

export function sectorColor(sector: string): string {
  const map: Record<string, string> = {
    'Technology': 'text-accent-blue',
    'Consumer Cyclical': 'text-accent-gold',
    'Communication Services': 'text-accent-purple',
    'Healthcare': 'text-emerald-400',
    'Financial Services': 'text-amber-400',
    'Industrials': 'text-slate-300',
    'Energy': 'text-orange-400',
    'Real Estate': 'text-rose-400',
    'Utilities': 'text-cyan-400',
    'Basic Materials': 'text-lime-400',
    'Consumer Defensive': 'text-pink-300',
  }
  return map[sector] ?? 'text-text-secondary'
}
