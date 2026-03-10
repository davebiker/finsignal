import { FMPAnalystRec } from '@/lib/fmp'
import { AVOverview } from '@/lib/alphavantage'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Users, Target } from 'lucide-react'

interface Props {
  ticker: string
  analystRec: FMPAnalystRec | null
  overview: AVOverview | null
}

export function AnalystPanel({ ticker, analystRec, overview }: Props) {
  const targetPrice = overview?.AnalystTargetPrice ? Number(overview.AnalystTargetPrice) : null

  const buy = analystRec?.analystRatingbuy ?? 0
  const strongBuy = analystRec?.analystRatingStrongBuy ?? 0
  const hold = analystRec?.analystRatingHold ?? 0
  const sell = analystRec?.analystRatingSell ?? 0
  const strongSell = analystRec?.analystRatingStrongSell ?? 0
  const total = buy + strongBuy + hold + sell + strongSell

  const positiveCount = buy + strongBuy
  const neutralCount = hold
  const negativeCount = sell + strongSell

  const sentimentPct = total > 0 ? (positiveCount / total) * 100 : null

  return (
    <div className="space-y-4">
      {/* Consensus */}
      {targetPrice && (
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
      {analystRec && total > 0 && (
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

      {!analystRec && !targetPrice && (
        <div className="card p-6 text-center">
          <p className="text-sm text-text-muted">No analyst data available.</p>
          <p className="text-xs text-text-muted mt-1">Click "Sync Data" to fetch from FMP.</p>
        </div>
      )}
    </div>
  )
}
