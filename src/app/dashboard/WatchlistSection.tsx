'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { cn, formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils'
import { Plus, TrendingUp, TrendingDown, ChevronRight, X, Loader2 } from 'lucide-react'
import type { WatchlistItem } from '@/types'

interface QuoteData {
  price: number | null
  changePct: number | null
  marketCap: number | null
  pe: number | null
  name: string | null
}

export function WatchlistSection() {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [items, setItems] = useState<WatchlistItem[]>([])
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({})
  const [loading, setLoading] = useState(true)
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [newTicker, setNewTicker] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch quotes for a list of tickers
  const fetchQuotes = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return
    setQuotesLoading(true)
    try {
      const res = await fetch(`/api/quotes?tickers=${tickers.join(',')}`)
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes ?? {})
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err)
    }
    setQuotesLoading(false)
  }, [])

  // Load watchlist from Supabase
  const fetchWatchlist = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('watchlist')
      .select('*')
      .order('added_at', { ascending: true })

    if (fetchError) {
      console.error('Watchlist fetch error:', fetchError.message)
      setLoading(false)
      return
    }

    const watchlistItems = (data ?? []) as WatchlistItem[]
    setItems(watchlistItems)
    setLoading(false)

    // Fetch quotes for all tickers
    const tickers = watchlistItems.map((i) => i.ticker)
    fetchQuotes(tickers)
  }, [fetchQuotes])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const ticker = newTicker.trim().toUpperCase()
    if (!ticker) return

    if (items.some((r) => r.ticker === ticker)) {
      setError(`${ticker} is already in your watchlist`)
      setTimeout(() => setError(null), 3000)
      return
    }

    setAdding(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setAdding(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        ticker,
        company_name: ticker,
        sector: null,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        setError(`${ticker} is already in your watchlist`)
      } else {
        setError(insertError.message)
      }
      setTimeout(() => setError(null), 3000)
      setAdding(false)
      return
    }

    const newItem = data as WatchlistItem
    setItems((prev) => [...prev, newItem])
    setNewTicker('')
    setAdding(false)

    // Fetch quote for the new ticker and merge with existing quotes
    try {
      const res = await fetch(`/api/quotes?tickers=${ticker}`)
      if (res.ok) {
        const { quotes: newQuotes } = await res.json()
        setQuotes((prev) => ({ ...prev, ...newQuotes }))

        // Update company_name if we got a real name from Yahoo
        const name = newQuotes[ticker]?.name
        if (name && name !== ticker) {
          setItems((prev) =>
            prev.map((i) => i.id === newItem.id ? { ...i, company_name: name } : i)
          )
          // Also update in Supabase (fire and forget)
          supabase.from('watchlist').update({ company_name: name }).eq('id', newItem.id)
        }
      }
    } catch {}
  }

  async function handleDelete(id: string, ticker: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(id)

    const { error: deleteError } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(`Failed to remove ${ticker}`)
      setTimeout(() => setError(null), 3000)
      setDeleting(null)
      return
    }

    setItems((prev) => prev.filter((r) => r.id !== id))
    setDeleting(null)
  }

  return (
    <div className="space-y-3">
      {/* Add ticker form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Add ticker to watchlist (e.g. AAPL)…"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
          disabled={adding}
          className="terminal-input flex-1 text-xs"
        />
        <button type="submit" className="btn-primary text-xs px-3" disabled={adding || !newTicker.trim()}>
          {adding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          Add
        </button>
      </form>

      {error && (
        <div className="text-xs text-accent-red font-mono px-1">{error}</div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface-3 rounded-lg" />
                  <div className="space-y-1">
                    <div className="h-4 w-14 bg-surface-3 rounded" />
                    <div className="h-3 w-24 bg-surface-3 rounded" />
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="h-4 w-16 bg-surface-3 rounded" />
                  <div className="h-4 w-12 bg-surface-3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-text-muted text-sm">Your watchlist is empty.</p>
            <p className="text-text-muted text-xs mt-1">Add a ticker above to start tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Ticker</th>
                  <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest hidden sm:table-cell">Chg%</th>
                  <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest hidden md:table-cell">Mkt Cap</th>
                  <th className="text-right px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-widest hidden lg:table-cell">P/E</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const q = quotes[item.ticker]
                  const isPos = (q?.changePct ?? 0) > 0
                  const isNeg = (q?.changePct ?? 0) < 0
                  const displayName = q?.name ?? (item.company_name !== item.ticker ? item.company_name : null)

                  return (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/company/${item.ticker}`)}
                      className={cn(
                        'border-b border-border last:border-0 hover:bg-surface-2 transition-colors cursor-pointer',
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
                            {displayName && (
                              <p className="text-xs text-text-muted truncate max-w-[140px]">{displayName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {quotesLoading && !q ? (
                          <div className="h-4 w-16 bg-surface-3 rounded animate-pulse inline-block" />
                        ) : (
                          <span className="font-mono tabular-nums text-text-primary">
                            {q?.price ? formatCurrency(q.price) : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {quotesLoading && !q ? (
                          <div className="h-4 w-12 bg-surface-3 rounded animate-pulse inline-block" />
                        ) : (
                          <span className={cn(
                            'inline-flex items-center gap-0.5 font-mono tabular-nums text-xs',
                            isPos ? 'text-accent-green' : isNeg ? 'text-accent-red' : 'text-text-secondary'
                          )}>
                            {isPos && <TrendingUp className="w-3 h-3" />}
                            {isNeg && <TrendingDown className="w-3 h-3" />}
                            {q?.changePct != null ? formatPercent(q.changePct) : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        {quotesLoading && !q ? (
                          <div className="h-4 w-14 bg-surface-3 rounded animate-pulse inline-block" />
                        ) : (
                          <span className="font-mono tabular-nums text-xs text-text-secondary">
                            {q?.marketCap ? formatLargeNumber(q.marketCap) : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {quotesLoading && !q ? (
                          <div className="h-4 w-10 bg-surface-3 rounded animate-pulse inline-block" />
                        ) : (
                          <span className="font-mono tabular-nums text-xs text-text-secondary">
                            {q?.pe ? q.pe.toFixed(1) : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleDelete(item.id, item.ticker, e)}
                            disabled={deleting === item.id}
                            className="p-1 rounded hover:bg-accent-red-dim text-text-muted hover:text-accent-red transition-colors"
                            title={`Remove ${item.ticker}`}
                          >
                            {deleting === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
