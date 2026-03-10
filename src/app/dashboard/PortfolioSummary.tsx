'use client'

import { cn } from '@/lib/utils'
import type { WatchlistSignalSummary } from './WatchlistSection'
import { BarChart3, PieChart, TrendingUp } from 'lucide-react'

interface Props {
  summary: WatchlistSignalSummary | null
}

export function PortfolioSummary({ summary }: Props) {
  if (!summary || summary.total === 0) return null

  const { total, buy, hold, sell, avgPE, sectors } = summary

  // Sort sectors by count desc
  const sortedSectors = Object.entries(sectors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
  const maxSectorCount = sortedSectors[0]?.[1] ?? 1

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-3.5 h-3.5 text-text-secondary" />
        <h3 className="text-xs font-mono text-text-secondary uppercase tracking-widest font-semibold">
          Portfolio Summary
        </h3>
      </div>

      {/* Signal distribution */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <p className="font-display text-lg font-bold text-text-primary">{total}</p>
          <p className="text-[10px] font-mono text-text-muted">Tracked</p>
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-bold text-accent-green">{buy}</p>
          <p className="text-[10px] font-mono text-text-muted">BUY</p>
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-bold text-accent-gold">{hold}</p>
          <p className="text-[10px] font-mono text-text-muted">HOLD</p>
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-bold text-accent-red">{sell}</p>
          <p className="text-[10px] font-mono text-text-muted">SELL</p>
        </div>
      </div>

      {/* Signal bar */}
      {total > 0 && (
        <div className="h-2.5 rounded-full overflow-hidden flex">
          {buy > 0 && (
            <div className="bg-accent-green transition-all" style={{ width: `${(buy / total) * 100}%` }} />
          )}
          {hold > 0 && (
            <div className="bg-accent-gold transition-all" style={{ width: `${(hold / total) * 100}%` }} />
          )}
          {sell > 0 && (
            <div className="bg-accent-red transition-all" style={{ width: `${(sell / total) * 100}%` }} />
          )}
        </div>
      )}

      {/* Avg P/E */}
      {avgPE != null && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-text-muted" />
            <span className="text-xs text-text-secondary">Avg P/E</span>
          </div>
          <span className="text-xs font-mono font-semibold text-text-primary tabular-nums">
            {avgPE.toFixed(1)}
          </span>
        </div>
      )}

      {/* Sector distribution */}
      {sortedSectors.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-1">
            <PieChart className="w-3 h-3 text-text-muted" />
            <span className="text-xs text-text-secondary">Sectors</span>
          </div>
          {sortedSectors.map(([sector, count]) => (
            <div key={sector} className="flex items-center gap-2 px-1">
              <span className="text-[10px] text-text-muted w-24 truncate shrink-0">{sector}</span>
              <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-blue/60 rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxSectorCount) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-text-muted w-4 text-right shrink-0">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
