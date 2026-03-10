'use client'

import { useState, useMemo } from 'react'
import { format, parseISO, isSameDay } from 'date-fns'
import { FinnhubEarningsEvent } from '@/lib/finnhub'
import { formatLargeNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Calendar, Clock, Search, SlidersHorizontal } from 'lucide-react'

const MARKET_CAP_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Large', value: 'large', desc: '>$10B rev' },
  { label: 'Mid', value: 'mid', desc: '$1B–10B' },
  { label: 'Small', value: 'small', desc: '<$1B' },
] as const

type CapFilter = typeof MARKET_CAP_FILTERS[number]['value']

const SECTORS = [
  'All',
  'Technology',
  'Healthcare',
  'Financials',
  'Consumer Cyclical',
  'Energy',
  'Industrials',
  'Communication Services',
] as const

interface Props {
  events: FinnhubEarningsEvent[]
  from: string
  to: string
}

function timeLabel(t: string) {
  if (t === 'bmo') return { label: 'Pre-Market', color: 'text-accent-blue' }
  if (t === 'amc') return { label: 'After-Close', color: 'text-accent-purple' }
  return { label: 'TBD', color: 'text-text-muted' }
}

export function EarningsCalendarClient({ events, from, to }: Props) {
  const [search, setSearch] = useState('')
  const [capFilter, setCapFilter] = useState<CapFilter>('all')
  const [sector, setSector] = useState('All')

  const now = new Date()

  const filtered = useMemo(() => {
    let result = events

    // Search filter
    if (search.trim()) {
      const q = search.trim().toUpperCase()
      result = result.filter((e) => e.symbol.includes(q))
    }

    // Market cap filter (using revenueEstimate as proxy)
    if (capFilter !== 'all') {
      result = result.filter((e) => {
        const rev = e.revenueEstimate
        if (rev == null) return capFilter === 'small' // no estimate → small
        if (capFilter === 'large') return rev >= 10e9
        if (capFilter === 'mid') return rev >= 1e9 && rev < 10e9
        if (capFilter === 'small') return rev < 1e9
        return true
      })
    }

    return result
  }, [events, search, capFilter])

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, FinnhubEarningsEvent[]> = {}
    for (const event of filtered) {
      if (!groups[event.date]) groups[event.date] = []
      groups[event.date].push(event)
    }
    return groups
  }, [filtered])

  const dates = Object.keys(grouped).sort()

  return (
    <>
      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search ticker (e.g. AAPL, MSFT)…"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            className="terminal-input pl-9 w-full text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sector dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="terminal-input text-xs py-1.5 pr-8"
              title="Sector filter (requires per-ticker data)"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>
              ))}
            </select>
          </div>

          {/* Market cap buttons */}
          <div className="flex items-center gap-1 bg-surface-3 rounded-lg p-0.5">
            {MARKET_CAP_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setCapFilter(value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-mono transition-all',
                  capFilter === value
                    ? 'bg-surface text-text-primary border border-border'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Result count */}
          <span className="text-xs font-mono text-text-muted ml-auto">
            {filtered.length} of {events.length} events
          </span>
        </div>
      </div>

      {/* Results */}
      {dates.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-20" />
          <p className="text-text-muted">
            {events.length === 0
              ? 'No earnings events found. Check your Finnhub API key.'
              : 'No events match your filters.'}
          </p>
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
                  <div className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold',
                    isToday
                      ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
                      : 'bg-surface-2 border-border text-text-secondary'
                  )}>
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
    </>
  )
}
