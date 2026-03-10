import { fetchYahooQuote } from '@/lib/yahoo'
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

  const results = await Promise.allSettled(
    tickers.map((t) => fetchYahooQuote(t))
  )

  const quotes: Record<string, {
    price: number | null
    changePct: number | null
    marketCap: number | null
    pe: number | null
    name: string | null
  }> = {}

  tickers.forEach((ticker, i) => {
    const result = results[i]
    const q = result.status === 'fulfilled' ? result.value : null
    quotes[ticker] = {
      price: q?.regularMarketPrice ?? null,
      changePct: q?.regularMarketChangePercent ?? null,
      marketCap: q?.marketCap ?? null,
      pe: q?.trailingPE ?? null,
      name: q?.longName ?? q?.shortName ?? null,
    }
  })

  return NextResponse.json({ quotes })
}
