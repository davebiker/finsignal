'use client'

import { MarketIndex } from '@/types'
import { cn, formatPercent, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function MarketOverview({ indices }: { indices: MarketIndex[] }) {
  if (!indices.length) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-3 w-16 bg-surface-3 rounded mb-2" />
            <div className="h-6 w-24 bg-surface-3 rounded mb-1" />
            <div className="h-3 w-12 bg-surface-3 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {indices.map((idx) => {
        const isPos = idx.changePct > 0
        const isNeg = idx.changePct < 0

        return (
          <div
            key={idx.symbol}
            className={cn(
              'card p-4 relative overflow-hidden transition-all duration-200 hover:border-border-bright',
              isPos && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent-green after:opacity-50',
              isNeg && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent-red after:opacity-50',
            )}
          >
            <p className="text-xs font-mono text-text-muted mb-1">{idx.name}</p>
            <p className="font-display font-semibold text-lg tabular-nums text-text-primary">
              {idx.value > 0 ? formatNumber(idx.value, idx.value > 100 ? 2 : 2) : '—'}
            </p>
            <div className={cn(
              'flex items-center gap-1 text-xs font-mono tabular-nums mt-1',
              isPos ? 'text-accent-green' : isNeg ? 'text-accent-red' : 'text-text-secondary'
            )}>
              {isPos && <TrendingUp className="w-3 h-3" />}
              {isNeg && <TrendingDown className="w-3 h-3" />}
              {!isPos && !isNeg && <Minus className="w-3 h-3" />}
              {formatPercent(idx.changePct)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
