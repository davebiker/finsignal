import { fetchYahooQuote, fetchYtdChange } from '@/lib/yahoo'
import { getCompanyOverview } from '@/lib/alphavantage'
import { createSupabaseAdmin } from '@/lib/supabase'
import { calculateEpsTrend, type EpsTrend } from '@/lib/signals'
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

  // Fetch Yahoo quotes + YTD for all tickers, plus S&P 500 YTD
  const [yahooResults, ytdResults, spYtdResult] = await Promise.all([
    Promise.allSettled(tickers.map((t) => fetchYahooQuote(t))),
    Promise.allSettled(tickers.map((t) => fetchYtdChange(t))),
    fetchYtdChange('^GSPC').catch(() => null),
  ])

  // Fetch AV overview for analyst target + sector (limit to avoid rate limits)
  const avResults = await Promise.allSettled(
    tickers.slice(0, 5).map((t) => getCompanyOverview(t))
  )

  // Fetch last 4 quarters of earnings for beat ratio + EPS trend
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

  const spYtd = spYtdResult

  const quotes: Record<string, {
    price: number | null
    changePct: number | null
    marketCap: number | null
    pe: number | null
    name: string | null
    analystTarget: number | null
    sector: string | null
    epsBeatRatio: number | null
    epsTrend: EpsTrend | null
    ytdPct: number | null
    relativeStrength: number | null
    week52Pct: number | null
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

    // Earnings beat ratio + EPS estimate trend
    const eResult = earningsResults[i]
    let epsBeatRatio: number | null = null
    let epsTrend: EpsTrend | null = null
    if (eResult.status === 'fulfilled') {
      const rows = eResult.value.data ?? []
      if (rows.length > 0) {
        const beats = rows.filter(
          (r: any) => r.eps_actual != null && r.eps_estimate != null && r.eps_actual > r.eps_estimate
        ).length
        epsBeatRatio = beats / rows.length
        // Calculate EPS estimate trend (rows are newest-first)
        const estimates = rows.map((r: any) => r.eps_estimate as number | null)
        epsTrend = calculateEpsTrend(estimates)
      }
    }

    // YTD and relative strength vs S&P 500
    const ytdResult = ytdResults[i]
    const ytdPct = ytdResult.status === 'fulfilled' ? ytdResult.value : null
    const relativeStrength = ytdPct != null && spYtd != null ? ytdPct - spYtd : null

    // 52-week range position
    const w52High = q?.fiftyTwoWeekHigh ?? null
    const w52Low = q?.fiftyTwoWeekLow ?? null
    const curPrice = q?.regularMarketPrice ?? null
    const week52Pct = w52High && w52Low && curPrice && w52High > w52Low
      ? ((curPrice - w52Low) / (w52High - w52Low)) * 100
      : null

    quotes[ticker] = {
      price: curPrice,
      changePct: q?.regularMarketChangePercent ?? null,
      marketCap: q?.marketCap ?? null,
      pe: q?.trailingPE ?? null,
      name: q?.longName ?? q?.shortName ?? null,
      analystTarget: isNaN(analystTarget as number) ? null : analystTarget,
      sector,
      epsBeatRatio,
      epsTrend,
      ytdPct,
      relativeStrength,
      week52Pct,
    }
  })

  return NextResponse.json({ quotes, spYtd })
}
