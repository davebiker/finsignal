'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn, formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils'
import { Plus, ExternalLink, TrendingUp, TrendingDown, Trash2, RefreshCw } from 'lucide-react'

// Default watchlist tickers shown to all users
const DEFAULT_WATCHLIST = [
  { ticker: 'AAPL', company_name: 'Apple Inc.', sector: 'Technology' },
  { ticker: 'MSFT', company_name: 'Microsoft Corp.', sector: 'Technology' },
  { ticker: 'NVDA', company_name: 'NVIDIA Corp.', sector: 'Technology' },
  { ticker: 'GOOGL', company_name: 'Alphabet Inc.', sector: 'Communication Services' },
  { ticker: 'AMZN', company_name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
  { ticker: 'META', company_name: 'Meta Platforms', sector: 'Communication Services' },
  { ticker: 'TSLA', company_name: 'Tesla Inc.', sector: 'Consumer Cyclical' },
  { ticker: 'JPM', company_name: 'JPMorgan Chase', sector: 'Financial Services' },
]

// Mock price data for demo (in production, fetched from Yahoo via API)
const MOCK_PRICES: Record<string, { price: number; changePct: number; pe: number | null; ytd: number; marketCap: number }> = {
  AAPL:  { price: 189.30, changePct: 0.82,  pe: 28.4, ytd: 8.2,   marketCap: 2920e9 },
  MSFT:  { price: 415.50, changePct: 1.23,  pe: 36.1, ytd: 12.5,  marketCap: 3090e9 },
  NVDA:  { price: 875.40, changePct: 2.14,  pe: 72.5, ytd: 85.4,  marketCap: 2150e9 },
  GOOGL: { price: 172.80, changePct: -0.31, pe: 25.8, ytd: 15.3,  marketCap: 2150e9 },
  AMZN:  { price: 185.60, changePct: 0.95,  pe: 52.3, ytd: 22.8,  marketCap: 1940e9 },
  META:  { price: 494.20, changePct: 1.67,  pe: 28.9, ytd: 38.4,  marketCap: 1270e9 },
  TSLA:  { price: 174.30, changePct: -2.45, pe: 56.2, ytd: -18.7, marketCap:  554e9 },
  JPM:   { price: 196.80, changePct: 0.54,  pe: 12.1, ytd: 14.2,  marketCap:  563e9 },
}

export function WatchlistSection() {
  const [watchlist] = useState(DEFAULT_WATCHLIST)
  const [newTicker, setNewTicker] = useState('')

  function handleAddTicker(e: React.FormEvent) {
    e.preventDefault()
    if (newTicker.trim()) {
      window.location.href = `/company/${newTicker.trim().toUpperCase()}`
    }
  }

  return (
    <div className="space-y-3">
      {/* Add ticker form */}
      <form onSubmit={handleAddTicker} className="flex gap-2">
        <input
          type="text"
          placeholder="Add ticker (e.g. AAPL)…"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
          className="terminal-input flex-1 text-xs"
        />
        <button type="submit" className="btn-primary text-xs px-3">
          <Plus className="w-3.5 h-3.5" />
          View
        </button>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Ticker</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Price</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest hidden sm:table-cell">Chg%</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest hidden md:table-cell">Mkt Cap</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest hidden md:table-cell">P/E</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest hidden lg:table-cell">YTD</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item, i) => {
                const price = MOCK_PRICES[item.ticker]
                const isPos = (price?.changePct ?? 0) > 0
                const isNeg = (price?.changePct ?? 0) < 0

                return (
                  <tr
                    key={item.ticker}
                    className={cn(
                      'border-b border-border last:border-0 hover:bg-surface-2 transition-colors',
                      'animate-slide-up'
                    )}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-xs font-mono font-bold text-accent-blue shrink-0">
                          {item.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-mono font-semibold text-sm text-text-primary">{item.ticker}</p>
                          <p className="text-xs text-text-muted truncate max-w-[120px]">{item.company_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono tabular-nums text-text-primary">
                        {price ? formatCurrency(price.price) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className={cn(
                        'inline-flex items-center gap-0.5 font-mono tabular-nums text-xs',
                        isPos ? 'text-accent-green' : isNeg ? 'text-accent-red' : 'text-text-secondary'
                      )}>
                        {isPos && <TrendingUp className="w-3 h-3" />}
                        {isNeg && <TrendingDown className="w-3 h-3" />}
                        {price ? formatPercent(price.changePct) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="font-mono tabular-nums text-xs text-text-secondary">
                        {price ? formatLargeNumber(price.marketCap) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="font-mono tabular-nums text-xs text-text-secondary">
                        {price?.pe ? price.pe.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className={cn(
                        'font-mono tabular-nums text-xs',
                        (price?.ytd ?? 0) > 0 ? 'text-accent-green' : 'text-accent-red'
                      )}>
                        {price ? formatPercent(price.ytd) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/company/${item.ticker}`}
                        className="btn-ghost py-1 px-2 text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
