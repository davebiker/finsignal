'use client'

import { useState } from 'react'
import { AiAnalysis } from '@/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Brain, Zap, TrendingUp, TrendingDown, Minus,
  Shield, Rocket, AlertTriangle, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'
import { Spinner } from '@/components/ui'

interface Props {
  ticker: string
  existingAnalysis: AiAnalysis | null
}

export function AiAnalysisPanel({ ticker, existingAnalysis }: Props) {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(existingAnalysis)
  const [longTermRec, setLongTermRec] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  async function generateAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          quarter: null,
          fiscalYear: new Date().getFullYear(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Analysis failed')
      }

      const data = await res.json()
      
      // Map response to AiAnalysis shape
      const mapped: AiAnalysis = {
        id: data.saved?.id ?? 'temp',
        ticker,
        quarter: data.saved?.quarter ?? 'Q?',
        fiscal_year: data.saved?.fiscal_year ?? new Date().getFullYear(),
        analysis_text: data.analysis?.summary ?? null,
        bull_case: data.analysis?.bull_case ?? null,
        base_case: data.analysis?.base_case ?? null,
        bear_case: data.analysis?.bear_case ?? null,
        key_risks: data.analysis?.key_risks ?? [],
        key_catalysts: data.analysis?.key_catalysts ?? [],
        consensus_pt: data.analysis?.consensus_pt ?? null,
        created_at: new Date().toISOString(),
      }
      setAnalysis(mapped)
      setLongTermRec(data.analysis?.long_term_recommendation ?? null)
      setExpanded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-border cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-accent-green" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-sm text-text-primary">
              AI Investment Analysis
            </h2>
            <p className="text-xs text-text-muted">
              {analysis
                ? `Generated ${formatDate(analysis.created_at)}`
                : 'Claude-powered financial analysis'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysis && (
            <button
              onClick={(e) => { e.stopPropagation(); generateAnalysis() }}
              className="btn-ghost text-xs gap-1.5"
              disabled={loading}
            >
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
              Refresh
            </button>
          )}
          {!analysis && !loading && (
            <button
              onClick={(e) => { e.stopPropagation(); generateAnalysis() }}
              className="btn-primary text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              Generate Analysis
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner />
              <p className="text-sm text-text-secondary">Analyzing {ticker} with Claude AI…</p>
              <p className="text-xs text-text-muted">Fetching earnings data, analyst estimates, company overview…</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-accent-red-dim border border-accent-red/20 rounded-lg text-sm text-accent-red">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-semibold">Analysis failed</p>
                <p className="text-xs mt-0.5 opacity-80">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !analysis && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-3 border border-border flex items-center justify-center">
                <Brain className="w-7 h-7 text-text-muted opacity-40" />
              </div>
              <div className="text-center">
                <p className="text-sm text-text-secondary font-semibold">No analysis yet</p>
                <p className="text-xs text-text-muted mt-1">
                  Generate an AI-powered investment thesis with bull, base, and bear scenarios.
                </p>
              </div>
              <button onClick={generateAnalysis} className="btn-primary">
                <Zap className="w-3.5 h-3.5" />
                Generate Analysis
              </button>
            </div>
          )}

          {!loading && !error && analysis && (
            <div className="space-y-5">
              
              {/* Summary */}
              {analysis.analysis_text && (
                <div className="p-4 bg-surface-2 rounded-xl border border-border">
                  <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">Executive Summary</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{analysis.analysis_text}</p>
                  {analysis.consensus_pt && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-text-muted">Consensus PT:</span>
                      <span className="text-sm font-mono font-semibold text-accent-gold">
                        ${analysis.consensus_pt.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Bull / Base / Bear */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Bull Case',
                    text: analysis.bull_case,
                    icon: TrendingUp,
                    color: 'accent-green',
                    border: 'border-accent-green/20',
                    bg: 'bg-accent-green/5',
                  },
                  {
                    label: 'Base Case',
                    text: analysis.base_case,
                    icon: Minus,
                    color: 'accent-gold',
                    border: 'border-accent-gold/20',
                    bg: 'bg-accent-gold/5',
                  },
                  {
                    label: 'Bear Case',
                    text: analysis.bear_case,
                    icon: TrendingDown,
                    color: 'accent-red',
                    border: 'border-accent-red/20',
                    bg: 'bg-accent-red/5',
                  },
                ].map(({ label, text, icon: Icon, color, border, bg }) => (
                  <div key={label} className={cn('rounded-xl p-4 border', bg, border)}>
                    <div className={cn('flex items-center gap-2 mb-2 text-' + color)}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-mono font-semibold uppercase tracking-wide">{label}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {text ?? 'No data available.'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Catalysts & Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Catalysts */}
                {analysis.key_catalysts?.length > 0 && (
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket className="w-3.5 h-3.5 text-accent-green" />
                      <span className="text-xs font-mono font-semibold text-accent-green uppercase tracking-wide">
                        Key Catalysts
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {analysis.key_catalysts.map((cat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <span className="w-4 h-4 rounded-full bg-accent-green/20 text-accent-green flex items-center justify-center text-[9px] font-mono shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {cat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {analysis.key_risks?.length > 0 && (
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-3.5 h-3.5 text-accent-red" />
                      <span className="text-xs font-mono font-semibold text-accent-red uppercase tracking-wide">
                        Key Risks
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {analysis.key_risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <span className="w-4 h-4 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center text-[9px] font-mono shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Long-term recommendation */}
              {longTermRec && (
                <div className="p-4 bg-accent-blue/5 rounded-xl border border-accent-blue/20">
                  <div className="flex items-center gap-2 mb-2 text-accent-blue">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono font-semibold uppercase tracking-wide">
                      Long-Term Outlook (3-5 Years)
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {longTermRec}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
