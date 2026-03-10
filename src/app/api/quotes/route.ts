import { fetchYahooQuote } from '@/lib/yahoo'
import { getCompanyOverview } from '@/lib/alphavantage'
import { createSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/quotes?tickers=AAPL,MSFT,NIO
export async function GET(req: NextRequest) {
  const tickersParam = req.nextUrl.searchParams.get('tickers')
  if (!tickersParam) {
    return NextResponse.json({ error: 'Missing tickers param' }, { status: 400 })
  }

  const tickers = tickersParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean).slice(0, 20)

  // Fetch Yahoo quotes for all tickers
  const yahooResults = await Promise.allSettled(
    tickers.map((t) => fetchYahooQuote(t))
  )

  // Fetch AV overview for analyst target + sector (limit to avoid rate limits)
  const avResults = await Promise.allSettled(
    tickers.slice(0, 5).map((t) => getCompanyOverview(t))
  )

  // Fetch last 4 quarters of earnings for beat ratio
  const supabase = createSupabaseAdmin()
  const earningsResults = await Promise.allSettled(
    tickers.map((t) =>
      supabase
        .from('earnings_snapshots')
        .select('eps_actual, eps_estimate')
        .eq('ticker', t)
        .order('fiscal_year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(4)
    )
  )

  const quotes: Record<string, {
    price: number | null
    changePct: number | null
    marketCap: number | null
    pe: number | null
    name: string | null
    analystTarget: number | null
    sector: string | null
    epsBeatRatio: number | null
  }> = {}

  tickers.forEach((ticker, i) => {
    const yResult = yahooResults[i]
    const q = yResult.status === 'fulfilled' ? yResult.value : null

    // AV data (only for first 5 tickers due to rate limits)
    const avResult = i < 5 && avResults[i]?.status === 'fulfilled'
      ? (avResults[i] as PromiseFulfilledResult<any>).value
      : null
    const analystTarget = avResult?.AnalystTargetPrice
      ? parseFloat(avResult.AnalystTargetPrice)
      : null
    const sector = avResult?.Sector ?? null

    // Earnings beat ratio
    const eResult = earningsResults[i]
    let epsBeatRatio: number | null = null
    if (eResult.status === 'fulfilled') {
      const rows = eResult.value.data ?? []
      if (rows.length > 0) {
        const beats = rows.filter(
          (r: any) => r.eps_actual != null && r.eps_estimate != null && r.eps_actual > r.eps_estimate
        ).length
        epsBeatRatio = beats / rows.length
      }
    }

    quotes[ticker] = {
      price: q?.regularMarketPrice ?? null,
      changePct: q?.regularMarketChangePercent ?? null,
      marketCap: q?.marketCap ?? null,
      pe: q?.trailingPE ?? null,
      name: q?.longName ?? q?.shortName ?? null,
      analystTarget: isNaN(analystTarget as number) ? null : analystTarget,
      sector,
      epsBeatRatio,
    }
  })

  return NextResponse.json({ quotes })
}
