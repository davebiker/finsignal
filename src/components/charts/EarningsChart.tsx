'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts'
import { EarningsSnapshot } from '@/types'
import { formatLargeNumber } from '@/lib/utils'

interface EarningsChartProps {
  data: EarningsSnapshot[]
  metric?: 'revenue' | 'eps'
}

const GREEN = '#00d4aa'
const RED = '#ff4d6d'
const GOLD = '#f5a623'
const DIM = '#21262d'
const TEXT_DIM = '#8b949e'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border-bright rounded-lg p-3 shadow-xl text-xs font-mono space-y-1.5 min-w-[180px]">
      <p className="text-text-secondary font-semibold">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-text-primary">
            {entry.name.includes('EPS')
              ? `$${Number(entry.value).toFixed(2)}`
              : formatLargeNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function EarningsChart({ data, metric = 'revenue' }: EarningsChartProps) {
  const sorted = [...data].sort((a, b) => {
    if (a.fiscal_year !== b.fiscal_year) return a.fiscal_year - b.fiscal_year
    const qOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 }
    return (qOrder[a.quarter as keyof typeof qOrder] ?? 0) -
           (qOrder[b.quarter as keyof typeof qOrder] ?? 0)
  })

  const chartData = sorted.map((d) => {
    const label = `${d.quarter} ${d.fiscal_year}`
    if (metric === 'revenue') {
      return {
        label,
        actual: d.revenue_actual,
        estimate: d.revenue_estimate,
        beatPct: d.revenue_beat_pct,
      }
    } else {
      return {
        label,
        actual: d.eps_actual,
        estimate: d.eps_estimate,
        beatPct: d.eps_beat_pct,
      }
    }
  })

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={DIM} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={metric === 'revenue' ? formatLargeNumber : (v) => `$${v.toFixed(2)}`}
          width={metric === 'revenue' ? 60 : 50}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke={DIM} />

        <Bar dataKey="actual" name={metric === 'revenue' ? 'Revenue (Actual)' : 'EPS (Actual)'} radius={[3, 3, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.beatPct == null ? GOLD :
                entry.beatPct > 1 ? GREEN :
                entry.beatPct < -1 ? RED : GOLD
              }
            />
          ))}
        </Bar>

        <Line
          type="monotone"
          dataKey="estimate"
          name={metric === 'revenue' ? 'Revenue (Est.)' : 'EPS (Est.)'}
          stroke={GOLD}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={{ fill: GOLD, r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ── Revenue trend line chart ─────────────────────────────────

export function RevenueTrendChart({ data }: { data: EarningsSnapshot[] }) {
  const sorted = [...data].sort((a, b) => {
    if (a.fiscal_year !== b.fiscal_year) return a.fiscal_year - b.fiscal_year
    const qOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 }
    return (qOrder[a.quarter as keyof typeof qOrder] ?? 0) -
           (qOrder[b.quarter as keyof typeof qOrder] ?? 0)
  })

  const chartData = sorted.map((d, i) => {
    const prev = sorted[i - 4]  // YoY: compare to same quarter last year
    const yoyGrowth = prev?.revenue_actual && d.revenue_actual
      ? ((d.revenue_actual - prev.revenue_actual) / prev.revenue_actual) * 100
      : null

    return {
      label: `${d.quarter} ${d.fiscal_year}`,
      revenue: d.revenue_actual,
      yoyGrowth,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={DIM} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatLargeNumber}
          width={60}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: TEXT_DIM, fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v.toFixed(0)}%`}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={GREEN} opacity={0.6} radius={[2, 2, 0, 0]} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="yoyGrowth"
          name="YoY Growth %"
          stroke={GOLD}
          strokeWidth={2}
          dot={{ fill: GOLD, r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
