import { CompanyQuote, EarningsSnapshot } from '@/types'
import { FMPProfile } from '@/lib/fmp'
import { AVOverview } from '@/lib/alphavantage'
import { formatLargeNumber, formatNumber, formatPercent } from '@/lib/utils'
import { calculateEpsTrend, epsTrendLabel, epsTrendColor, epsTrendBg } from '@/lib/signals'
import { cn } from '@/lib/utils'

interface Props {
  quote: CompanyQuote | null
  overview: AVOverview | null
  profile: FMPProfile | null
  description: string | null
  earnings?: EarningsSnapshot[]
  relativeStrength?: number | null
  stockYtd?: number | null
}

interface Metric {
  label: string
  value: string
  category: string
  badge?: { text: string; color: string; bg: string } | null
}

export function MetricsPanel({ quote, overview, profile, description, earnings = [], relativeStrength, stockYtd }: Props) {
  // Calculate EPS estimate trend from earnings data (already sorted newest-first)
  const epsEstimates = earnings.map((e) => e.eps_estimate)
  const epsTrend = calculateEpsTrend(epsEstimates)

  const metrics: Metric[] = [
    // Valuation
    {
      label: 'Market Cap',
      value: formatLargeNumber((quote?.marketCap ?? Number(overview?.MarketCapitalization ?? 0)) || null),
      category: 'Valuation',
    },
    {
      label: 'P/E (TTM)',
      value: quote?.pe ? formatNumber(quote.pe, 1) : overview?.PERatio ?? '—',
      category: 'Valuation',
    },
    {
      label: 'Forward P/E',
      value: overview?.ForwardPE ?? '—',
      category: 'Valuation',
    },
    {
      label: 'EV/EBITDA',
      value: overview?.EVToEBITDA ?? '—',
      category: 'Valuation',
    },
    {
      label: 'P/B Ratio',
      value: overview?.PriceToBookRatio ?? '—',
      category: 'Valuation',
    },
    // Financials
    {
      label: 'Revenue (TTM)',
      value: formatLargeNumber(Number(overview?.RevenueTTM ?? 0) || null),
      category: 'Financials',
    },
    {
      label: 'Gross Profit',
      value: formatLargeNumber(Number(overview?.GrossProfitTTM ?? 0) || null),
      category: 'Financials',
    },
    {
      label: 'EBITDA',
      value: formatLargeNumber(Number(overview?.EBITDA ?? 0) || null),
      category: 'Financials',
    },
    {
      label: 'Profit Margin',
      value: (() => {
        const raw = Number(overview?.ProfitMargin)
        return !isNaN(raw) && raw !== 0 ? formatPercent(raw * 100) : '—'
      })(),
      category: 'Financials',
    },
    // Per share
    {
      label: 'EPS (TTM)',
      value: overview?.EPS ? `$${overview.EPS}` : quote?.eps ? `$${quote.eps.toFixed(2)}` : '—',
      category: 'Per Share',
    },
    {
      label: 'Dividend Yield',
      value: (() => {
        const raw = Number(overview?.DividendYield)
        return !isNaN(raw) && raw > 0 ? formatPercent(raw * 100) : '—'
      })(),
      category: 'Per Share',
      badge: (() => {
        const divYield = Number(overview?.DividendYield)
        if (isNaN(divYield) || divYield <= 0) return null
        const payout = Number(overview?.PayoutRatio)
        if (isNaN(payout) || payout <= 0) return null
        const pctPayout = payout * 100
        if (pctPayout < 40) return { text: 'Safe', color: 'text-accent-green', bg: 'bg-accent-green-dim border-accent-green/20' }
        if (pctPayout <= 60) return { text: 'Moderate', color: 'text-accent-gold', bg: 'bg-accent-gold-dim border-accent-gold/20' }
        return { text: 'At Risk', color: 'text-accent-red', bg: 'bg-accent-red-dim border-accent-red/20' }
      })(),
    },
    {
      label: 'Analyst Target',
      value: overview?.AnalystTargetPrice ? `$${overview.AnalystTargetPrice}` : '—',
      category: 'Per Share',
    },
  ]

  const categories = Array.from(new Set(metrics.map((m) => m.category)))

  return (
    <div className="space-y-4">
      {/* Signal badges */}
      <div className="flex flex-wrap gap-3">
        {/* EPS Estimate Trend badge */}
        {epsTrend && (
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono font-semibold',
            epsTrendColor(epsTrend),
            epsTrendBg(epsTrend)
          )}>
            <span>{epsTrendLabel(epsTrend)}</span>
            <span className="text-xs opacity-70 font-normal">
              (based on last {Math.min(earnings.filter(e => e.eps_estimate != null).length, 3)} quarters)
            </span>
          </div>
        )}

        {/* Relative Strength vs S&P 500 */}
        {relativeStrength != null && (
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono font-semibold',
            relativeStrength > 0 ? 'text-accent-green bg-accent-green-dim border-accent-green/20' :
            relativeStrength < 0 ? 'text-accent-red bg-accent-red-dim border-accent-red/20' :
            'text-accent-gold bg-accent-gold-dim border-accent-gold/20'
          )}>
            <span>RS vs S&P: {relativeStrength > 0 ? '+' : ''}{relativeStrength.toFixed(1)}%</span>
            {stockYtd != null && (
              <span className="text-xs opacity-70 font-normal">
                (YTD {stockYtd > 0 ? '+' : ''}{stockYtd.toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat} className="card p-4">
            <p className="stat-label mb-3">{cat}</p>
            <div className="space-y-2.5">
              {metrics
                .filter((m) => m.category === cat)
                .map((m) => (
                  <div key={m.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-text-secondary">{m.label}</span>
                    <div className="flex items-center gap-1.5">
                      {m.badge && (
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border',
                          m.badge.color,
                          m.badge.bg
                        )}>
                          {m.badge.text}
                        </span>
                      )}
                      <span className="text-xs font-mono tabular-nums text-text-primary font-semibold">
                        {m.value}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Company description */}
      {description && (
        <div className="card p-4">
          <p className="stat-label mb-2">About</p>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      )}
    </div>
  )
}
