import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getStockEarnings } from '@/lib/finnhub'
import { getIncomeStatement, getEarningsHistory } from '@/lib/alphavantage'
import { fetchYahooQuote } from '@/lib/yahoo'
import { GuidanceDirection } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  const supabase = createSupabaseAdmin()

  try {
    // Fetch all data sources in parallel
    const [quoteResult, finnhubResult, incomeResult, avEarningsResult] = await Promise.allSettled([
      fetchYahooQuote(ticker),
      getStockEarnings(ticker),
      getIncomeStatement(ticker),
      getEarningsHistory(ticker),
    ])

    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
    const finnhubEarnings = finnhubResult.status === 'fulfilled' ? finnhubResult.value : []
    const income = incomeResult.status === 'fulfilled' ? incomeResult.value : null
    const avEarnings = avEarningsResult.status === 'fulfilled' ? avEarningsResult.value : null

    // 1. Save price snapshot
    if (quote) {
      await supabase.from('price_snapshots').insert({
        ticker,
        price: quote.regularMarketPrice ?? null,
        market_cap: quote.marketCap ?? null,
        pe_ratio: quote.trailingPE ?? null,
        ev_ebitda: null,
      })
    }

    // 2. Build revenue lookup from AV INCOME_STATEMENT quarterly reports
    const revenueByDate = new Map<string, number>()
    const revenueByYQ = new Map<string, number>()
    if (income?.quarterlyReports) {
      for (const report of income.quarterlyReports) {
        const rev = parseFloat(report.totalRevenue)
        if (isNaN(rev) || rev <= 0) continue
        revenueByDate.set(report.fiscalDateEnding, rev)

        const date = new Date(report.fiscalDateEnding)
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        let q = 1
        if (month >= 4 && month <= 6) q = 2
        else if (month >= 7 && month <= 9) q = 3
        else if (month >= 10) q = 4
        revenueByYQ.set(`${year}-Q${q}`, rev)
      }
    }

    // 3. Build EPS lookup from Finnhub (has surprise data)
    //    Key: "YYYY-Q#" → FinnhubEarningsResult
    const finnhubByYQ = new Map(
      finnhubEarnings.map((e) => [`${e.year}-Q${e.quarter}`, e])
    )

    // 4. Merge: use AV EARNINGS as base (more history, 8+ quarters),
    //    enrich with Finnhub surprise data and AV revenue
    interface MergedQuarter {
      quarter: string
      fiscal_year: number
      report_date: string
      eps_actual: number | null
      eps_estimate: number | null
      eps_beat_pct: number | null
      revenue_actual: number | null
    }

    const merged: MergedQuarter[] = []
    const seen = new Set<string>()

    // AV EARNINGS quarterly data (typically 12+ quarters)
    if (avEarnings?.quarterlyEarnings) {
      for (const qe of avEarnings.quarterlyEarnings.slice(0, 12)) {
        const date = new Date(qe.fiscalDateEnding)
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        let q = 1
        if (month >= 4 && month <= 6) q = 2
        else if (month >= 7 && month <= 9) q = 3
        else if (month >= 10) q = 4

        const key = `${year}-Q${q}`
        if (seen.has(key)) continue
        seen.add(key)

        const epsActual = parseFloat(qe.reportedEPS)
        const epsEst = parseFloat(qe.estimatedEPS)
        const finnhub = finnhubByYQ.get(key)

        const actual = !isNaN(epsActual) ? epsActual : finnhub?.actual ?? null
        const estimate = !isNaN(epsEst) ? epsEst : finnhub?.estimate ?? null

        let epsBeatPct: number | null = null
        if (actual != null && estimate != null && estimate !== 0) {
          epsBeatPct = ((actual - estimate) / Math.abs(estimate)) * 100
        }

        const revenueActual =
          revenueByDate.get(qe.fiscalDateEnding) ??
          revenueByYQ.get(key) ??
          null

        merged.push({
          quarter: `Q${q}`,
          fiscal_year: year,
          report_date: qe.reportedDate || qe.fiscalDateEnding,
          eps_actual: actual,
          eps_estimate: estimate,
          eps_beat_pct: epsBeatPct,
          revenue_actual: revenueActual,
        })
      }
    }

    // Fill in any Finnhub quarters not covered by AV
    for (const e of finnhubEarnings) {
      const key = `${e.year}-Q${e.quarter}`
      if (seen.has(key)) continue
      seen.add(key)

      const epsBeatPct = e.estimate != null && e.actual != null && e.estimate !== 0
        ? ((e.actual - e.estimate) / Math.abs(e.estimate)) * 100
        : null

      merged.push({
        quarter: `Q${e.quarter}`,
        fiscal_year: e.year,
        report_date: e.period,
        eps_actual: e.actual,
        eps_estimate: e.estimate,
        eps_beat_pct: epsBeatPct,
        revenue_actual:
          revenueByDate.get(e.period) ??
          revenueByYQ.get(key) ??
          null,
      })
    }

    // Sort by year desc, quarter desc
    merged.sort((a, b) => {
      if (a.fiscal_year !== b.fiscal_year) return b.fiscal_year - a.fiscal_year
      return parseInt(b.quarter.slice(1)) - parseInt(a.quarter.slice(1))
    })

    // 5. Derive guidance_direction by comparing EPS estimates across quarters.
    //    If current quarter estimate > previous quarter estimate → "raised"
    //    If lower → "lowered", if same → "maintained", if no data → "none"
    const snapshots = merged.slice(0, 12).map((m, i) => {
      let guidance: GuidanceDirection = 'none'
      if (i < merged.length - 1) {
        const prev = merged[i + 1]
        if (m.eps_estimate != null && prev.eps_estimate != null) {
          const diff = m.eps_estimate - prev.eps_estimate
          const threshold = Math.abs(prev.eps_estimate) * 0.02 // 2% threshold
          if (diff > threshold) guidance = 'raised'
          else if (diff < -threshold) guidance = 'lowered'
          else guidance = 'maintained'
        }
      }

      return {
        ticker,
        quarter: m.quarter,
        fiscal_year: m.fiscal_year,
        revenue_actual: m.revenue_actual,
        revenue_estimate: null,
        eps_actual: m.eps_actual,
        eps_estimate: m.eps_estimate,
        revenue_beat_pct: null,
        eps_beat_pct: m.eps_beat_pct,
        guidance_direction: guidance,
        report_date: m.report_date,
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
