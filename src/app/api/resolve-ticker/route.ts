import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveYahooSymbol, getExchangeLabel } from '@/lib/yahoo'

export const dynamic = 'force-dynamic'

// GET /api/resolve-ticker?ticker=VOW3
// Resolves a ticker to its Yahoo Finance symbol (trying exchange suffixes)
export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  if (!ticker) {
    return NextResponse.json({ error: 'Missing ticker param' }, { status: 400 })
  }

  try {
    const result = await resolveYahooSymbol(ticker)
    if (!result) {
      return NextResponse.json({ error: 'Ticker not found on any exchange' }, { status: 404 })
    }

    return NextResponse.json({
      ticker,
      yahooSymbol: result.symbol,
      name: result.quote.longName ?? result.quote.shortName ?? ticker,
      exchange: getExchangeLabel(result.quote.exchange),
      price: result.quote.regularMarketPrice ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
