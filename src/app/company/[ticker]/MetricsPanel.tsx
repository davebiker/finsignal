import { CompanyQuote } from '@/types'
import { FMPProfile } from '@/lib/fmp'
import { AVOverview } from '@/lib/alphavantage'
import { formatLargeNumber, formatNumber, formatPercent } from '@/lib/utils'

interface Props {
  quote: CompanyQuote | null
  overview: AVOverview | null
  profile: FMPProfile | null
  description: string | null
}

interface Metric {
  label: string
  value: string
  category: string
}

export function MetricsPanel({ quote, overview, profile, description }: Props) {
  const metrics: Metric[] = [
    // Valuation
    {
      label: 'Market Cap',
      value: formatLargeNumber(quote?.marketCap ?? Number(overview?.MarketCapitalization ?? 0) || null),
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
      value: overview?.ProfitMargin
        ? formatPercent(Number(overview.ProfitMargin) * 100)
        : '—',
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
      value: overview?.DividendYield
        ? formatPercent(Number(overview.DividendYield) * 100)
        : '—',
      category: 'Per Share',
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat} className="card p-4">
            <p className="stat-label mb-3">{cat}</p>
            <div className="space-y-2.5">
              {metrics
                .filter((m) => m.category === cat)
                .map((m) => (
                  <div key={m.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-text-secondary">{m.label}</span>
                    <span className="text-xs font-mono tabular-nums text-text-primary font-semibold">
                      {m.value}
                    </span>
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
