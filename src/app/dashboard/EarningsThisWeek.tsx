import Link from 'next/link'
import { FinnhubEarningsEvent } from '@/lib/finnhub'
import { formatLargeNumber } from '@/lib/utils'
import { Calendar, ChevronRight } from 'lucide-react'

export function EarningsThisWeek({ events }: { events: FinnhubEarningsEvent[] }) {
  const sorted = events
    .filter((e) => e.revenueEstimate && e.revenueEstimate > 1e8)
    .sort((a, b) => (b.revenueEstimate ?? 0) - (a.revenueEstimate ?? 0))
    .slice(0, 12)

  if (!sorted.length) {
    return (
      <div className="card p-6 text-center">
        <Calendar className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-30" />
        <p className="text-sm text-text-muted">No major earnings this week</p>
      </div>
    )
  }

  return (
    <div className="card divide-y divide-border overflow-hidden">
      {sorted.map((event) => (
        <Link
          key={`${event.symbol}-${event.date}`}
          href={`/company/${event.symbol}`}
          className="flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded bg-surface-3 border border-border flex items-center justify-center text-[10px] font-mono font-bold text-accent-blue shrink-0">
              {event.symbol.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold text-text-primary">{event.symbol}</p>
              <p className="text-[10px] font-mono text-text-muted">
                {event.date} · {event.hour === 'bmo' ? 'Pre-mkt' : event.hour === 'amc' ? 'Post-mkt' : 'TBD'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {event.revenueEstimate != null && (
              <span className="text-xs font-mono text-text-secondary">
                {formatLargeNumber(event.revenueEstimate)}
              </span>
            )}
            <ChevronRight className="w-3 h-3 text-text-muted group-hover:text-accent-green transition-colors" />
          </div>
        </Link>
      ))}
      <Link
        href="/earnings-calendar"
        className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-text-secondary hover:text-accent-green transition-colors font-mono"
      >
        View full calendar
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
