import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getInsiderTransactions } from '@/lib/sec'

export const dynamic = 'force-dynamic'

// GET /api/insider?ticker=AAPL
export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  if (!ticker) {
    return NextResponse.json({ error: 'Missing ticker param' }, { status: 400 })
  }

  try {
    const transactions = await getInsiderTransactions(ticker, 10)

    // Calculate net insider sentiment (last 90 days)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    const recent = transactions.filter((t) => t.date >= cutoffStr)
    const buys = recent.filter((t) => t.transactionType === 'Buy').length
    const sells = recent.filter((t) => t.transactionType === 'Sell').length

    const sentiment: 'buying' | 'selling' | 'neutral' =
      buys > sells ? 'buying' : sells > buys ? 'selling' : 'neutral'

    return NextResponse.json({
      ticker,
      transactions,
      sentiment,
      recentBuys: buys,
      recentSells: sells,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Insider data error for ${ticker}:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
