import { format, addDays, parseISO, isSameDay } from 'date-fns'
import { getEarningsCalendar, FinnhubEarningsEvent } from '@/lib/finnhub'
import { formatLargeNumber } from '@/lib/utils'
import Link from 'next/link'
import { Calendar, Clock, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

function groupByDate(events: FinnhubEarningsEvent[]) {
  const groups: Record<string, FinnhubEarningsEvent[]> = {}
  for (const event of events) {
    if (!groups[event.date]) groups[event.date] = []
    groups[event.date].push(event)
  }
  return groups
}

export default async function EarningsCalendarPage() {
  const now = new Date()
  const from = format(now, 'yyyy-MM-dd')
  const to = format(addDays(now, 21), 'yyyy-MM-dd')

  let events: FinnhubEarningsEvent[] = []
  try {
    const raw = await getEarningsCalendar(from, to)
    events = raw
      .filter((e) => e.symbol && e.date)
      .sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date)
        if (dateComp !== 0) return dateComp
        return (b.revenueEstimate ?? 0) - (a.revenueEstimate ?? 0)
      })
  } catch (e) {
    console.error('Failed to load earnings calendar:', e)
  }

  const grouped = groupByDate(events)
  const dates = Object.keys(grouped).sort()

  const timeLabel = (t: string) => {
    if (t === 'bmo') return { label: 'Pre-Market', color: 'text-accent-blue' }
    if (t === 'amc') return { label: 'After-Close', color: 'text-accent-purple' }
    return { label: 'TBD', color: 'text-text-muted' }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-accent-green" />
          <span className="text-xs font-mono text-accent-green uppercase tracking-widest">
            Earnings Calendar
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Upcoming Earnings
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Next 21 days · {events.length} events · {from} → {to}
        </p>
      </div>

      {dates.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-20" />
          <p className="text-text-muted">No earnings events found. Check your Finnhub API key.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => {
            const dayEvents = grouped[date]
            const parsedDate = parseISO(date)
            const isToday = isSameDay(parsedDate, now)

            return (
              <div key={date} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className={`
                    px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold
                    ${isToday
                      ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
                      : 'bg-surface-2 border-border text-text-secondary'
                    }
                  `}>
                    {isToday ? 'TODAY' : format(parsedDate, 'EEE, MMM d')}
                  </div>
                  <span className="text-xs font-mono text-text-muted">
                    {dayEvents.length} report{dayEvents.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Events grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {dayEvents.map((event) => {
                    const timing = timeLabel(event.hour)
                    const hasEstimates = event.epsEstimate != null || event.revenueEstimate != null

                    return (
                      <Link
                        key={`${event.symbol}-${event.date}`}
                        href={`/company/${event.symbol}`}
                        className="card-hover p-3.5 block group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-[10px] font-mono font-bold text-accent-blue shrink-0">
                              {event.symbol?.slice(0, 2)}
                            </div>
                            <span className="font-mono font-semibold text-sm text-text-primary">
                              {event.symbol}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono ${timing.color} flex items-center gap-0.5`}>
                            <Clock className="w-2.5 h-2.5" />
                            {timing.label}
                          </span>
                        </div>

                        {hasEstimates ? (
                          <div className="space-y-1">
                            {event.epsEstimate != null && (
                              <div className="flex justify-between text-xs">
                                <span className="text-text-muted font-mono">EPS Est.</span>
                                <span className="font-mono tabular-nums text-text-secondary">
                                  ${event.epsEstimate.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {event.revenueEstimate != null && (
                              <div className="flex justify-between text-xs">
                                <span className="text-text-muted font-mono">Rev. Est.</span>
                                <span className="font-mono tabular-nums text-text-secondary">
                                  {formatLargeNumber(event.revenueEstimate)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-text-muted font-mono">
                            Estimates pending
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
