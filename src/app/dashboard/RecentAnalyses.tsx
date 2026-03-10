import Link from 'next/link'
import { AiAnalysis } from '@/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Brain, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'

function SentimentIcon({ text }: { text: string | null }) {
  if (!text) return <Minus className="w-3 h-3 text-text-muted" />
  const lower = text.toLowerCase()
  if (lower.includes('bull')) return <TrendingUp className="w-3 h-3 text-accent-green" />
  if (lower.includes('bear')) return <TrendingDown className="w-3 h-3 text-accent-red" />
  return <Minus className="w-3 h-3 text-accent-gold" />
}

function sentimentBg(text: string | null) {
  if (!text) return 'bg-surface-3'
  const lower = text.toLowerCase()
  if (lower.includes('bull')) return 'bg-accent-green/10 border border-accent-green/20'
  if (lower.includes('bear')) return 'bg-accent-red/10 border border-accent-red/20'
  return 'bg-accent-gold/10 border border-accent-gold/20'
}

export function RecentAnalyses({ analyses }: { analyses: AiAnalysis[] }) {
  if (!analyses.length) {
    return (
      <div className="card p-8 text-center">
        <Brain className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-20" />
        <p className="text-sm text-text-muted">No analyses yet.</p>
        <p className="text-xs text-text-muted mt-1">
          Visit a company page and click "Generate Analysis" to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {analyses.map((analysis) => (
        <Link
          key={analysis.id}
          href={`/company/${analysis.ticker}`}
          className="card-hover p-4 block group animate-fade-in"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-xs font-mono font-bold text-accent-blue">
                {analysis.ticker.slice(0, 2)}
              </div>
              <div>
                <p className="font-mono font-semibold text-sm text-text-primary">{analysis.ticker}</p>
                <p className="text-[10px] font-mono text-text-muted">
                  {analysis.quarter} {analysis.fiscal_year}
                </p>
              </div>
            </div>
            <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs', sentimentBg(analysis.analysis_text))}>
              <SentimentIcon text={analysis.analysis_text} />
            </div>
          </div>

          <p className="text-xs text-text-secondary line-clamp-2 mb-3">
            {analysis.base_case ?? analysis.analysis_text ?? 'No summary available.'}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-text-muted">
              {formatDate(analysis.created_at)}
            </span>
            <span className="text-[10px] font-mono text-accent-green flex items-center gap-0.5 group-hover:gap-1 transition-all">
              View <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
