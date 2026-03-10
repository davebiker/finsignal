import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getStockEarnings } from '@/lib/finnhub'
import { fetchYahooQuote } from '@/lib/yahoo'

export async function POST(
  req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  const supabase = createSupabaseAdmin()

  try {
    // 1. Fetch price snapshot from Yahoo Finance
    const quote = await fetchYahooQuote(ticker)
    if (quote) {
      await supabase.from('price_snapshots').insert({
        ticker,
        price: quote.regularMarketPrice ?? null,
        market_cap: quote.marketCap ?? null,
        pe_ratio: quote.trailingPE ?? null,
        ev_ebitda: null,
      })
    }

    // 2. Fetch earnings history from Finnhub
    const earnings = await getStockEarnings(ticker)

    const snapshots = earnings
      .filter((e) => e.period && e.year)
      .map((e) => {
        const epsBeatPct = e.estimate != null && e.actual != null && e.estimate !== 0
          ? ((e.actual - e.estimate) / Math.abs(e.estimate)) * 100
          : null

        return {
          ticker,
          quarter: `Q${e.quarter}`,
          fiscal_year: e.year,
          revenue_actual: null,
          revenue_estimate: null,
          eps_actual: e.actual,
          eps_estimate: e.estimate,
          revenue_beat_pct: null,
          eps_beat_pct: epsBeatPct,
          guidance_direction: 'none' as const,
          report_date: e.period,
        }
      })

    if (snapshots.length > 0) {
      const { error } = await supabase
        .from('earnings_snapshots')
        .upsert(snapshots, { onConflict: 'ticker,quarter,fiscal_year' })

      if (error) {
        console.error('Supabase upsert error:', error)
      }
    }

    return NextResponse.json({
      success: true,
      ticker,
      priceUpdated: !!quote,
      earningsCount: snapshots.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Sync error for ${ticker}:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
