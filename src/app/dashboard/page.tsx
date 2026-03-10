import { createSupabaseAdmin } from '@/lib/supabase'
import { fetchMarketIndices } from '@/lib/yahoo'
import { getEarningsCalendar } from '@/lib/fmp'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { MarketOverview } from './MarketOverview'
import { WatchlistSection } from './WatchlistSection'
import { EarningsThisWeek } from './EarningsThisWeek'
import { RecentAnalyses } from './RecentAnalyses'
import { Signal, TrendingUp, Calendar, Brain } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function DashboardPage() {
  const now = new Date()
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [indices, earningsWeek, recentAnalyses] = await Promise.allSettled([
    fetchMarketIndices(),
    getEarningsCalendar(weekStart, weekEnd),
    createSupabaseAdmin()
      .from('ai_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const marketData = indices.status === 'fulfilled' ? indices.value : []
  const earningsData = earningsWeek.status === 'fulfilled' ? earningsWeek.value : []
  const analysesData = recentAnalyses.status === 'fulfilled'
    ? (recentAnalyses.value.data ?? [])
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Signal className="w-4 h-4 text-accent-green" />
            <span className="text-xs font-mono text-accent-green uppercase tracking-widest">
              Market Intelligence
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {format(now, "EEEE, MMMM d, yyyy '·' HH:mm 'UTC'")}
          </p>
        </div>
      </div>

      {/* Market overview */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-3.5 h-3.5 text-text-secondary" />
          <h2 className="font-display font-semibold text-sm text-text-secondary uppercase tracking-widest">
            Global Markets
          </h2>
        </div>
        <MarketOverview indices={marketData} />
      </section>

      <div className="glow-line" />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Watchlist (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-text-secondary" />
            <h2 className="font-display font-semibold text-sm text-text-secondary uppercase tracking-widest">
              Watchlist
            </h2>
          </div>
          <WatchlistSection />
        </div>

        {/* Right: Earnings this week (1/3) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-3.5 h-3.5 text-text-secondary" />
            <h2 className="font-display font-semibold text-sm text-text-secondary uppercase tracking-widest">
              Earnings This Week
            </h2>
          </div>
          <EarningsThisWeek events={earningsData} />
        </div>
      </div>

      <div className="glow-line" />

      {/* Recent analyses */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-3.5 h-3.5 text-text-secondary" />
          <h2 className="font-display font-semibold text-sm text-text-secondary uppercase tracking-widest">
            Recent AI Analyses
          </h2>
        </div>
        <RecentAnalyses analyses={analysesData} />
      </section>
    </div>
  )
}
