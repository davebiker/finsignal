import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getEarningsResults } from '@/lib/fmp'
import { fetchYahooQuote } from '@/lib/yahoo'
import { getBeatMissLabel } from '@/lib/utils'

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
        ev_ebitda: null, // Would need additional API call
      })
    }

    // 2. Fetch earnings results from FMP
    const earnings = await getEarningsResults(ticker, 8)

    const snapshots = earnings.map((e) => {
      const date = new Date(e.date)
      const month = date.getMonth() + 1

      // Determine quarter from month (approximate)
      let quarter = 'Q1'
      if (month >= 4 && month <= 6) quarter = 'Q2'
      else if (month >= 7 && month <= 9) quarter = 'Q3'
      else if (month >= 10) quarter = 'Q4'

      const revBeatPct = e.revenueEstimated && e.revenue
        ? ((e.revenue - e.revenueEstimated) / Math.abs(e.revenueEstimated)) * 100
        : null

      const epsBeatPct = e.epsEstimated && e.eps
        ? ((e.eps - e.epsEstimated) / Math.abs(e.epsEstimated)) * 100
        : null

      return {
        ticker,
        quarter,
        fiscal_year: date.getFullYear(),
        revenue_actual: e.revenue ?? null,
        revenue_estimate: e.revenueEstimated ?? null,
        eps_actual: e.eps ?? null,
        eps_estimate: e.epsEstimated ?? null,
        revenue_beat_pct: revBeatPct,
        eps_beat_pct: epsBeatPct,
        guidance_direction: 'none' as const,
        report_date: e.date,
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
