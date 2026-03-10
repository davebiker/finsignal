import Link from 'next/link'
import { CompanyQuote } from '@/types'
import { FMPProfile } from '@/lib/fmp'
import { AVOverview } from '@/lib/alphavantage'
import {
  cn, formatCurrency, formatPercent, formatLargeNumber, changeColor, sectorColor
} from '@/lib/utils'
import { TrendingUp, TrendingDown, ArrowLeft, RefreshCw, Globe } from 'lucide-react'
import { SyncButton } from './SyncButton'

interface Props {
  ticker: string
  name: string
  sector: string
  exchange: string
  quote: CompanyQuote | null
  profile: FMPProfile | null
  overview: AVOverview | null
}

export function CompanyHeader({ ticker, name, sector, exchange, quote, profile, overview }: Props) {
  const price = quote?.price
  const changePct = quote?.changePct
  const change = quote?.change
  const isPos = (changePct ?? 0) > 0
  const isNeg = (changePct ?? 0) < 0

  const week52High = quote?.weekHigh52 ?? Number(overview?.['52WeekHigh'] ?? 0)
  const week52Low = quote?.weekLow52 ?? Number(overview?.['52WeekLow'] ?? 0)
  const range52Pct = week52High > week52Low && price
    ? ((price - week52Low) / (week52High - week52Low)) * 100
    : null

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Dashboard
        </Link>
        <span className="text-border-bright">/</span>
        <span className="text-text-secondary">{ticker}</span>
      </div>

      {/* Main header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Company logo placeholder */}
          {profile?.image ? (
            <img
              src={profile.image}
              alt={name}
              className="w-12 h-12 rounded-xl border border-border bg-surface-2 object-contain p-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl border border-border bg-surface-2 flex items-center justify-center text-sm font-mono font-bold text-accent-blue shrink-0">
              {ticker.slice(0, 2)}
            </div>
          )}

          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary leading-tight">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="font-mono text-sm font-semibold text-accent-blue">{ticker}</span>
              <span className="text-border-bright">·</span>
              <span className={cn('text-xs font-mono', sectorColor(sector))}>{sector}</span>
              <span className="text-border-bright">·</span>
              <span className="text-xs font-mono text-text-muted">{exchange}</span>
              {profile?.website && (
                <>
                  <span className="text-border-bright">·</span>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    Website
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Price block */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="sm:text-right">
            <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-text-primary">
              {price ? formatCurrency(price) : '—'}
            </div>
            {changePct != null && (
              <div className={cn(
                'flex items-center justify-end gap-1.5 mt-1 text-sm font-mono tabular-nums',
                changeColor(changePct)
              )}>
                {isPos && <TrendingUp className="w-4 h-4" />}
                {isNeg && <TrendingDown className="w-4 h-4" />}
                {change != null && `${change > 0 ? '+' : ''}${formatCurrency(change)} `}
                ({formatPercent(changePct)})
              </div>
            )}
          </div>

          <SyncButton ticker={ticker} />
        </div>
      </div>

      {/* 52-week range bar */}
      {week52High > 0 && week52Low > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-xs font-mono text-text-muted mb-2">
            <span>{formatCurrency(week52Low)}</span>
            <span className="text-text-secondary hidden sm:inline">52-Week Range</span>
            <span>{formatCurrency(week52High)}</span>
          </div>
          <div className="relative h-2 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-red via-accent-gold to-accent-green rounded-full opacity-30"
              style={{ width: '100%' }}
            />
            {range52Pct != null && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-text-primary border-2 border-accent-green shadow-glow-green"
                style={{ left: `calc(${Math.min(Math.max(range52Pct, 2), 98)}% - 6px)` }}
              />
            )}
          </div>
          {price && (
            <p className="text-center text-xs font-mono text-text-secondary mt-1.5">
              Current: {formatCurrency(price)} · {range52Pct?.toFixed(1)}% from 52W low
            </p>
          )}
        </div>
      )}
    </div>
  )
}
