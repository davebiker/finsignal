import { cn } from '@/lib/utils'
import { BeatMissLabel, GuidanceDirection } from '@/types'
import { beatMissBg, guidanceColor, changeColor, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react'

// ── Loading spinner ──────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="w-6 h-6 rounded-full border-2 border-border-bright border-t-accent-green animate-spin" />
    </div>
  )
}

// ── Beat/Miss badge ──────────────────────────────────────────

export function BeatMissBadge({ label }: { label: BeatMissLabel }) {
  if (label === 'n/a') return <span className="text-text-muted text-xs font-mono">—</span>

  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono font-semibold', beatMissBg(label))}>
      {label === 'beat' && <TrendingUp className="w-2.5 h-2.5" />}
      {label === 'miss' && <TrendingDown className="w-2.5 h-2.5" />}
      {label === 'inline' && <Minus className="w-2.5 h-2.5" />}
      {label.toUpperCase()}
    </span>
  )
}

// ── Guidance badge ───────────────────────────────────────────

export function GuidanceBadge({ direction }: { direction: GuidanceDirection | null }) {
  if (!direction || direction === 'none') return <span className="text-text-muted text-xs">—</span>

  const icons: Record<string, React.ReactNode> = {
    raised: <ArrowUp className="w-3 h-3" />,
    lowered: <ArrowDown className="w-3 h-3" />,
    maintained: <Minus className="w-3 h-3" />,
    withdrawn: null,
  }

  const bgMap: Record<string, string> = {
    raised: 'bg-accent-green-dim border-accent-green/20',
    lowered: 'bg-accent-red-dim border-accent-red/20',
    maintained: 'bg-accent-gold-dim border-accent-gold/20',
    withdrawn: 'bg-surface-3 border-border',
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono font-semibold border',
      guidanceColor(direction),
      bgMap[direction] ?? 'bg-surface-3 border-border'
    )}>
      {icons[direction]}
      {direction.toUpperCase()}
    </span>
  )
}

// ── Change label ─────────────────────────────────────────────

export function ChangeLabel({
  value,
  suffix = '%',
  showArrow = true,
}: {
  value: number | null
  suffix?: string
  showArrow?: boolean
}) {
  if (value == null) return <span className="text-text-muted">—</span>
  return (
    <span className={cn('inline-flex items-center gap-0.5 tabular-nums', changeColor(value))}>
      {showArrow && value > 0 && <TrendingUp className="w-3 h-3" />}
      {showArrow && value < 0 && <TrendingDown className="w-3 h-3" />}
      {value > 0 ? '+' : ''}{value.toFixed(2)}{suffix}
    </span>
  )
}

// ── Metric card ──────────────────────────────────────────────

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  className,
}: {
  label: string
  value: string
  subValue?: string
  trend?: number
  className?: string
}) {
  return (
    <div className={cn('card p-4 space-y-1', className)}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {(subValue || trend != null) && (
        <div className="flex items-center gap-2">
          {subValue && <span className="text-xs text-text-secondary">{subValue}</span>}
          {trend != null && <ChangeLabel value={trend} />}
        </div>
      )}
    </div>
  )
}

// ── Section header ───────────────────────────────────────────

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="font-display font-semibold text-base text-text-primary">{title}</h2>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
      {icon && <div className="opacity-30 text-4xl">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ── Error state ──────────────────────────────────────────────

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-accent-red-dim border border-accent-red/20 rounded-lg text-sm text-accent-red">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  )
}

// ── Percentage bar ───────────────────────────────────────────

export function PercentBar({ value, max = 100, color = 'bg-accent-green' }: {
  value: number
  max?: number
  color?: string
}) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
