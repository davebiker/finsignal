import { format, addDays } from 'date-fns'
import { getEarningsCalendar, FinnhubEarningsEvent } from '@/lib/finnhub'
import { Calendar } from 'lucide-react'
import { EarningsCalendarClient } from './EarningsCalendarClient'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

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

      <EarningsCalendarClient events={events} from={from} to={to} />
    </div>
  )
}
