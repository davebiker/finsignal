import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getEarningsResults, getAnalystEstimates, getConsensusPriceTarget, getCompanyProfile } from '@/lib/fmp'
import { getCompanyOverview } from '@/lib/alphavantage'
import { AiAnalysisResponse } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { ticker, quarter, fiscalYear } = await req.json()

  if (!ticker) {
    return NextResponse.json({ error: 'ticker is required' }, { status: 400 })
  }

  const upperTicker = ticker.toUpperCase()
  const supabase = createSupabaseAdmin()

  try {
    // 1. Gather financial data
    const [earnings, estimates, profile, consensusPT] = await Promise.allSettled([
      getEarningsResults(upperTicker, 8),
      getAnalystEstimates(upperTicker, 'quarter', 4),
      getCompanyProfile(upperTicker),
      getConsensusPriceTarget(upperTicker),
    ])

    let overviewData: Record<string, string> = {}
    try {
      const overview = await getCompanyOverview(upperTicker)
      overviewData = overview as unknown as Record<string, string>
    } catch {}

    const earningsData = earnings.status === 'fulfilled' ? earnings.value : []
    const estimatesData = estimates.status === 'fulfilled' ? estimates.value : []
    const profileData = profile.status === 'fulfilled' ? profile.value : null
    const consPT = consensusPT.status === 'fulfilled' ? consensusPT.value : null

    // 2. Determine quarter/year labels
    const targetQuarter = quarter ?? earningsData[0]?.period?.split('-')[1] ?? 'Q4'
    const targetYear = fiscalYear ?? new Date().getFullYear()

    // 3. Build context for Claude
    const contextPayload = {
      ticker: upperTicker,
      company: profileData?.companyName ?? upperTicker,
      sector: profileData?.sector ?? overviewData?.Sector ?? 'Unknown',
      industry: profileData?.industry ?? overviewData?.Industry ?? 'Unknown',
      marketCap: profileData?.mktCap ?? null,
      currentPrice: profileData?.price ?? null,
      consensusPriceTarget: consPT,
      overview: {
        peRatio: overviewData?.PERatio,
        forwardPE: overviewData?.ForwardPE,
        evToEBITDA: overviewData?.EVToEBITDA,
        profitMargin: overviewData?.ProfitMargin,
        analystTargetPrice: overviewData?.AnalystTargetPrice,
        eps: overviewData?.EPS,
        '52WeekHigh': overviewData?.['52WeekHigh'],
        '52WeekLow': overviewData?.['52WeekLow'],
      },
      recentEarnings: earningsData.slice(0, 6).map((e) => ({
        date: e.date,
        revenue: e.revenue,
        revenueEstimated: e.revenueEstimated,
        eps: e.eps,
        epsEstimated: e.epsEstimated,
        revenueBeats: e.revenue && e.revenueEstimated
          ? ((e.revenue - e.revenueEstimated) / e.revenueEstimated * 100).toFixed(1) + '%'
          : null,
        epsBeats: e.eps && e.epsEstimated
          ? ((e.eps - e.epsEstimated) / Math.abs(e.epsEstimated) * 100).toFixed(1) + '%'
          : null,
      })),
      forwardEstimates: estimatesData.map((est) => ({
        date: est.date,
        revenueLow: est.estimatedRevenueLow,
        revenueHigh: est.estimatedRevenueHigh,
        revenueAvg: est.estimatedRevenueAvg,
        epsLow: est.estimatedEpsLow,
        epsHigh: est.estimatedEpsHigh,
        epsAvg: est.estimatedEpsAvg,
      })),
    }

    // 4. Call Claude API
    const systemPrompt = `You are an elite Wall Street financial analyst specializing in equity research and earnings analysis. 
You produce structured, data-driven investment theses. Your analysis is sharp, quantitative, and backed by the data provided.
Always respond ONLY with a valid JSON object — no markdown, no preamble.`

    const userPrompt = `Analyze ${upperTicker} (${contextPayload.company}) based on this financial data:

${JSON.stringify(contextPayload, null, 2)}

Produce a comprehensive earnings and forward investment analysis. Respond ONLY with this JSON structure:
{
  "bull_case": "string: 2-3 sentence optimistic scenario with specific data points",
  "base_case": "string: 2-3 sentence base scenario aligned with consensus",
  "bear_case": "string: 2-3 sentence pessimistic scenario with key risk factors",
  "key_catalysts": ["array of 3-5 positive catalysts with specifics"],
  "key_risks": ["array of 3-5 key risks with specifics"],
  "eps_outlook_next_q": "string: specific EPS estimate/range for next quarter with rationale",
  "eps_outlook_q_plus_2": "string: specific EPS estimate/range for Q+2 with rationale",
  "summary": "string: 3-4 sentence executive summary of the investment case",
  "sentiment": "bullish" | "neutral" | "bearish",
  "consensus_pt": number | null
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const rawText = response.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('')

    // Parse JSON (strip any accidental markdown)
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    let analysis: AiAnalysisResponse

    try {
      analysis = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: rawText },
        { status: 500 }
      )
    }

    // 5. Save to Supabase
    const { data: saved, error: saveError } = await supabase
      .from('ai_analyses')
      .upsert(
        {
          ticker: upperTicker,
          quarter: targetQuarter,
          fiscal_year: targetYear,
          analysis_text: analysis.summary,
          bull_case: analysis.bull_case,
          base_case: analysis.base_case,
          bear_case: analysis.bear_case,
          key_risks: analysis.key_risks,
          key_catalysts: analysis.key_catalysts,
          consensus_pt: analysis.consensus_pt ?? consPT,
        },
        { onConflict: 'ticker,quarter,fiscal_year' }
      )
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save analysis:', saveError)
    }

    return NextResponse.json({
      success: true,
      ticker: upperTicker,
      analysis,
      saved: saved ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Analysis error for ${upperTicker}:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
