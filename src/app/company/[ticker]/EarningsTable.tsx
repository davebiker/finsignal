'use client'

import { useState } from 'react'
import { EarningsSnapshot } from '@/types'
import { getBeatMissLabel, formatLargeNumber, formatNumber, formatDate } from '@/lib/utils'
import { BeatMissBadge, GuidanceBadge, SectionHeader } from '@/components/ui'
import { EarningsChart } from '@/components/charts/EarningsChart'
import { BarChart2, Table } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  ticker: string
  earnings: EarningsSnapshot[]
}

type ViewMode = 'table' | 'chart-rev' | 'chart-eps'

export function EarningsTable({ ticker, earnings }: Props) {
  const [view, setView] = useState<ViewMode>('table')

  const sorted = [...earnings].sort((a, b) => {
    if (a.fiscal_year !== b.fiscal_year) return b.fiscal_year - a.fiscal_year
    const qOrder = { Q4: 1, Q3: 2, Q2: 3, Q1: 4 }
    return (qOrder[a.quarter as keyof typeof qOrder] ?? 0) -
           (qOrder[b.quarter as keyof typeof qOrder] ?? 0)
  })

  const hasData = sorted.length > 0

  return (
    <div className="card overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between gap-2">
        <SectionHeader
          title="Earnings History"
          subtitle={`Last ${sorted.length} quarters`}
        />
        <div className="flex items-center gap-1 bg-surface-3 rounded-lg p-0.5">
          {[
            { mode: 'table' as ViewMode, label: 'Table', icon: Table },
            { mode: 'chart-rev' as ViewMode, label: 'Revenue', icon: BarChart2 },
            { mode: 'chart-eps' as ViewMode, label: 'EPS', icon: BarChart2 },
          ].map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all',
                view === mode
                  ? 'bg-surface text-text-primary border border-border'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="p-8 text-center text-text-muted text-sm">
          No earnings data. Click "Sync Data" to fetch earnings history.
        </div>
      ) : view === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Period', 'Report Date', 'Revenue Actual', 'Rev. Est.', 'Rev. Beat', 'EPS Actual', 'EPS Est.', 'EPS Beat', 'Guidance'].map((h) => (
                  <th key={h} className="text-right first:text-left px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const revLabel = getBeatMissLabel(row.revenue_actual, row.revenue_estimate)
                const epsLabel = getBeatMissLabel(row.eps_actual, row.eps_estimate)

                return (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-text-primary whitespace-nowrap">
                      {row.quarter} {row.fiscal_year}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-text-secondary whitespace-nowrap">
                      {formatDate(row.report_date)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono tabular-nums text-text-primary whitespace-nowrap">
                      {row.revenue_actual ? formatLargeNumber(row.revenue_actual) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono tabular-nums text-text-secondary whitespace-nowrap">
                      {row.revenue_estimate ? formatLargeNumber(row.revenue_estimate) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <BeatMissBadge label={revLabel} />
                        {row.revenue_beat_pct != null && (
                          <span className="text-xs font-mono tabular-nums text-text-muted">
                            {row.revenue_beat_pct > 0 ? '+' : ''}{row.revenue_beat_pct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono tabular-nums text-text-primary whitespace-nowrap">
                      {row.eps_actual != null ? `$${row.eps_actual.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono tabular-nums text-text-secondary whitespace-nowrap">
                      {row.eps_estimate != null ? `$${row.eps_estimate.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <BeatMissBadge label={epsLabel} />
                        {row.eps_beat_pct != null && (
                          <span className="text-xs font-mono tabular-nums text-text-muted">
                            {row.eps_beat_pct > 0 ? '+' : ''}{row.eps_beat_pct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <GuidanceBadge direction={row.guidance_direction} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4">
          <EarningsChart
            data={earnings}
            metric={view === 'chart-eps' ? 'eps' : 'revenue'}
          />
        </div>
      )}
    </div>
  )
}
