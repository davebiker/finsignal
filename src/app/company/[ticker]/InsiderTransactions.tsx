'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Users, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { Spinner } from '@/components/ui'

interface Transaction {
  insiderName: string
  role: string
  transactionType: 'Buy' | 'Sell' | 'Other'
  shares: number
  pricePerShare: number | null
  date: string
  filingDate: string
}

interface InsiderData {
  ticker: string
  transactions: Transaction[]
  sentiment: 'buying' | 'selling' | 'neutral'
  recentBuys: number
  recentSells: number
}

function formatShares(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function formatDate(d: string): string {
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function InsiderTransactions({ ticker }: { ticker: string }) {
  const [data, setData] = useState<InsiderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const res = await fetch(`/api/insider?ticker=${ticker}`)
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? `Failed (${res.status})`)
        }
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [ticker])

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-border cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-sm text-text-primary">
              Insider Transactions
            </h2>
            <p className="text-xs text-text-muted">
              SEC Form 4 filings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sentiment badge */}
          {data && data.transactions.length > 0 && (
            <SentimentBadge
              sentiment={data.sentiment}
              buys={data.recentBuys}
              sells={data.recentSells}
            />
          )}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-text-muted" />
            : <ChevronDown className="w-4 h-4 text-text-muted" />
          }
        </div>
      </div>

      {expanded && (
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Spinner />
              <p className="text-sm text-text-secondary">Loading insider data from SEC EDGAR…</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-text-muted">Unable to load insider transactions.</p>
              <p className="text-xs text-text-muted mt-1 opacity-70">{error}</p>
            </div>
          )}

          {!loading && !error && data && data.transactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-text-muted">No recent insider transactions found.</p>
            </div>
          )}

          {!loading && !error && data && data.transactions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-xs font-mono text-text-muted uppercase tracking-widest">Insider</th>
                    <th className="text-left px-3 py-2 text-xs font-mono text-text-muted uppercase tracking-widest hidden sm:table-cell">Role</th>
                    <th className="text-center px-3 py-2 text-xs font-mono text-text-muted uppercase tracking-widest">Type</th>
                    <th className="text-right px-3 py-2 text-xs font-mono text-text-muted uppercase tracking-widest">Shares</th>
                    <th className="text-right px-3 py-2 text-xs font-mono text-text-muted uppercase tracking-widest hidden md:table-cell">Price</th>
                    <th className="text-right px-3 py-2 text-xs font-mono text-text-muted uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((txn, i) => (
                    <tr
                      key={`${txn.insiderName}-${txn.date}-${i}`}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-text-primary truncate max-w-[160px]">
                          {txn.insiderName}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        <span className="text-xs text-text-muted truncate max-w-[120px] block">
                          {txn.role}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                          txn.transactionType === 'Buy'
                            ? 'text-accent-green bg-accent-green-dim border-accent-green/20'
                            : 'text-accent-red bg-accent-red-dim border-accent-red/20'
                        )}>
                          {txn.transactionType === 'Buy'
                            ? <TrendingUp className="w-3 h-3" />
                            : <TrendingDown className="w-3 h-3" />
                          }
                          {txn.transactionType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-xs font-mono tabular-nums text-text-primary">
                          {formatShares(txn.shares)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right hidden md:table-cell">
                        <span className="text-xs font-mono tabular-nums text-text-secondary">
                          {txn.pricePerShare != null ? `$${txn.pricePerShare.toFixed(2)}` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-xs font-mono text-text-muted">
                          {formatDate(txn.date)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SentimentBadge({
  sentiment,
  buys,
  sells,
}: {
  sentiment: 'buying' | 'selling' | 'neutral'
  buys: number
  sells: number
}) {
  if (buys === 0 && sells === 0) return null

  const config = {
    buying: {
      label: 'Net Insider Buying',
      color: 'text-accent-green',
      bg: 'bg-accent-green-dim border-accent-green/20',
      icon: TrendingUp,
    },
    selling: {
      label: 'Net Insider Selling',
      color: 'text-accent-red',
      bg: 'bg-accent-red-dim border-accent-red/20',
      icon: TrendingDown,
    },
    neutral: {
      label: 'Mixed Activity',
      color: 'text-accent-gold',
      bg: 'bg-accent-gold-dim border-accent-gold/20',
      icon: Minus,
    },
  }[sentiment]

  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border',
        config.color,
        config.bg
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Icon className="w-3 h-3" />
      {config.label}
      <span className="opacity-70">({buys}B/{sells}S 90d)</span>
    </span>
  )
}
