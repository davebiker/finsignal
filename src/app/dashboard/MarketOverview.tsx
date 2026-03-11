'use client'

import { useState } from 'react'
import { MarketIndex } from '@/types'
import { cn, formatPercent, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Gauge, Info } from 'lucide-react'
import {
  type FearGreedData,
  getFearGreedLevel,
  getFearGreedLabel,
  getFearGreedColor,
  getFearGreedBg,
} from '@/lib/feargreed'

interface Props {
  indices: MarketIndex[]
  fearGreed?: FearGreedData | null
}

export function MarketOverview({ indices, fearGreed }: Props) {
  if (!indices.length) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

      {/* Fear & Greed Index card */}
      {fearGreed && <FearGreedCard data={fearGreed} />}
    </div>
  )
}

function FearGreedCard({ data }: { data: FearGreedData }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const level = getFearGreedLevel(data.score)
  const label = getFearGreedLabel(level)
  const color = getFearGreedColor(level)
  const bg = getFearGreedBg(level)

  // Gauge arc: map 0-100 to rotation
  const gaugeRotation = (data.score / 100) * 180 - 90 // -90 to +90 degrees

  return (
    <div className={cn('card p-4 relative overflow-hidden transition-all duration-200 hover:border-border-bright border', bg)}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-mono text-text-muted">Fear & Greed</p>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-text-muted hover:text-text-secondary transition-colors"
          >
            <Info className="w-3 h-3" />
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-5 z-50 w-52 p-2.5 rounded-lg bg-surface-2 border border-border shadow-xl text-[10px] text-text-secondary leading-relaxed">
              Low scores = potential buying opportunity. High scores = consider caution.
              <div className="mt-1.5 space-y-0.5 text-text-muted">
                <div>0-25: Extreme Fear</div>
                <div>26-45: Fear</div>
                <div>46-55: Neutral</div>
                <div>56-75: Greed</div>
                <div>76-100: Extreme Greed</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Score gauge */}
      <div className="flex items-end gap-2">
        <div className="relative w-12 h-6 overflow-hidden">
          {/* Semi-circle background */}
          <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full border-4 border-surface-3"
            style={{ clipPath: 'inset(50% 0 0 0)' }}
          />
          {/* Gauge needle */}
          <div
            className="absolute bottom-0 left-1/2 origin-bottom h-5 w-0.5 rounded-full bg-text-primary transition-transform duration-500"
            style={{ transform: `translateX(-50%) rotate(${gaugeRotation}deg)` }}
          />
          {/* Center dot */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-text-primary" />
        </div>
        <div>
          <p className={cn('font-display font-bold text-xl tabular-nums leading-none', color)}>
            {data.score}
          </p>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <Gauge className={cn('w-3 h-3', color)} />
        <span className={cn('text-xs font-mono font-semibold', color)}>
          {label}
        </span>
      </div>
    </div>
  )
}
