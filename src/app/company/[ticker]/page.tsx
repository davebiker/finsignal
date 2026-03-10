import { notFound } from 'next/navigation'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getCompanyProfile, getAnalystRecommendations } from '@/lib/fmp'
import { getCompanyOverview } from '@/lib/alphavantage'
import { fetchYahooQuote, yfQuoteToCompanyQuote } from '@/lib/yahoo'
import { CompanyHeader } from './CompanyHeader'
import { EarningsTable } from './EarningsTable'
import { MetricsPanel } from './MetricsPanel'
import { AiAnalysisPanel } from './AiAnalysisPanel'
import { AnalystPanel } from './AnalystPanel'

export const revalidate = 300

interface Props {
  params: { ticker: string }
}

export default async function CompanyPage({ params }: Props) {
  const ticker = params.ticker.toUpperCase()
  const supabase = createSupabaseAdmin()

  // Parallel data fetching
  const [quoteResult, profileResult, overviewResult, earningsResult, analysisResult, analystResult] =
    await Promise.allSettled([
      fetchYahooQuote(ticker),
      getCompanyProfile(ticker),
      getCompanyOverview(ticker),
      supabase
        .from('earnings_snapshots')
        .select('*')
        .eq('ticker', ticker)
        .order('fiscal_year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(8),
      supabase
        .from('ai_analyses')
        .select('*')
        .eq('ticker', ticker)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      getAnalystRecommendations(ticker),
    ])

  const quote = quoteResult.status === 'fulfilled' && quoteResult.value
    ? yfQuoteToCompanyQuote(quoteResult.value)
    : null

  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null
  const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null
  const earnings = earningsResult.status === 'fulfilled' ? (earningsResult.value.data ?? []) : []
  const analysis = analysisResult.status === 'fulfilled' ? analysisResult.value.data : null
  const analystRec = analystResult.status === 'fulfilled' ? analystResult.value[0] : null

  // If we have no data at all, 404
  if (!quote && !profile && !overview) {
    notFound()
  }

  const companyName = profile?.companyName ?? overview?.Name ?? ticker
  const sector = profile?.sector ?? overview?.Sector ?? 'Unknown'
  const exchange = profile?.exchange ?? quote?.exchange ?? 'Unknown'
  const description = profile?.description ?? overview?.Description ?? null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      
      {/* Company header */}
      <CompanyHeader
        ticker={ticker}
        name={companyName}
        sector={sector}
        exchange={exchange}
        quote={quote}
        profile={profile}
        overview={overview}
      />

      <div className="glow-line" />

      {/* Key metrics */}
      <MetricsPanel
        quote={quote}
        overview={overview}
        profile={profile}
        description={description}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Earnings history table — 2/3 */}
        <div className="lg:col-span-2">
          <EarningsTable
            ticker={ticker}
            earnings={earnings}
          />
        </div>

        {/* Analyst consensus — 1/3 */}
        <div>
          <AnalystPanel
            ticker={ticker}
            analystRec={analystRec ?? null}
            overview={overview}
          />
        </div>
      </div>

      <div className="glow-line" />

      {/* AI Analysis */}
      <AiAnalysisPanel
        ticker={ticker}
        existingAnalysis={analysis}
      />
    </div>
  )
}
