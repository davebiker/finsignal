import { AVOverview } from '@/lib/alphavantage'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Users, Target } from 'lucide-react'

interface Props {
  ticker: string
  overview: AVOverview | null
}

function safeInt(val: string | undefined | null): number {
  const n = parseInt(val ?? '', 10)
  return isNaN(n) ? 0 : n
}

export function AnalystPanel({ ticker, overview }: Props) {
  const targetPrice = overview?.AnalystTargetPrice
    ? Number(overview.AnalystTargetPrice)
    : null
  const validTarget = targetPrice && !isNaN(targetPrice) && targetPrice > 0

  const strongBuy = safeInt(overview?.AnalystRatingStrongBuy)
  const buy = safeInt(overview?.AnalystRatingBuy)
  const hold = safeInt(overview?.AnalystRatingHold)
  const sell = safeInt(overview?.AnalystRatingSell)
  const strongSell = safeInt(overview?.AnalystRatingStrongSell)
  const total = strongBuy + buy + hold + sell + strongSell

  const positiveCount = strongBuy + buy
  const neutralCount = hold
  const negativeCount = sell + strongSell

  const sentimentPct = total > 0 ? (positiveCount / total) * 100 : null

  return (
    <div className="space-y-4">
      {/* Consensus PT */}
      {validTarget && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-3.5 h-3.5 text-text-secondary" />
            <p className="stat-label">Analyst Consensus PT</p>
          </div>
          <p className="font-display text-2xl font-bold text-accent-gold">
            {formatCurrency(targetPrice)}
          </p>
          <p className="text-xs text-text-muted mt-1">Average 12-month price target</p>
        </div>
      )}

      {/* Ratings distribution */}
      {total > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-text-secondary" />
            <p className="stat-label">Analyst Ratings</p>
          </div>

          <div className="text-center mb-4">
            <p className={cn(
              'font-display text-lg font-bold',
              sentimentPct && sentimentPct > 60 ? 'text-accent-green' :
              sentimentPct && sentimentPct < 40 ? 'text-accent-red' : 'text-accent-gold'
            )}>
              {sentimentPct && sentimentPct > 60 ? 'BULLISH' :
               sentimentPct && sentimentPct < 40 ? 'BEARISH' : 'NEUTRAL'}
            </p>
            <p className="text-xs text-text-muted">{total} analysts covering</p>
          </div>

          {/* Stacked bar */}
          <div className="h-3 rounded-full overflow-hidden flex mb-4">
            {strongBuy > 0 && (
              <div className="bg-accent-green" style={{ width: `${(strongBuy / total) * 100}%` }} />
            )}
            {buy > 0 && (
              <div className="bg-emerald-500" style={{ width: `${(buy / total) * 100}%` }} />
            )}
            {hold > 0 && (
              <div className="bg-accent-gold" style={{ width: `${(hold / total) * 100}%` }} />
            )}
            {sell > 0 && (
              <div className="bg-orange-500" style={{ width: `${(sell / total) * 100}%` }} />
            )}
            {strongSell > 0 && (
              <div className="bg-accent-red" style={{ width: `${(strongSell / total) * 100}%` }} />
            )}
          </div>

          <div className="space-y-2">
            {[
              { label: 'Strong Buy', value: strongBuy, color: 'bg-accent-green' },
              { label: 'Buy', value: buy, color: 'bg-emerald-500' },
              { label: 'Hold', value: hold, color: 'bg-accent-gold' },
              { label: 'Sell', value: sell, color: 'bg-orange-500' },
              { label: 'Strong Sell', value: strongSell, color: 'bg-accent-red' },
            ].map(({ label, value, color }) => (
              value > 0 && (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', color)}
                      style={{ width: `${(value / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono tabular-nums text-text-muted w-6 text-right shrink-0">
                    {value}
                  </span>
                </div>
              )
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs font-mono text-text-muted">
            <span className="text-accent-green">{positiveCount} Buy</span>
            <span className="text-accent-gold">{neutralCount} Hold</span>
            <span className="text-accent-red">{negativeCount} Sell</span>
          </div>
        </div>
      )}

      {total === 0 && !validTarget && (
        <div className="card p-6 text-center">
          <p className="text-sm text-text-muted">No analyst data available.</p>
          <p className="text-xs text-text-muted mt-1">Analyst data from Alpha Vantage OVERVIEW.</p>
        </div>
      )}
    </div>
  )
}
