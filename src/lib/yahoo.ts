import { CompanyQuote, MarketIndex } from '@/types'

// We call Yahoo Finance via our own API route to avoid CORS issues
// and to keep the yahoo-finance2 package server-side only.

export interface YFQuote {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  regularMarketVolume?: number
  averageDailyVolume3Month?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  marketCap?: number
  trailingPE?: number
  forwardPE?: number
  trailingEps?: number
  sector?: string
  exchange?: string
}

// Server-side only: use yahoo-finance2 directly
export async function fetchYahooQuote(ticker: string): Promise<YFQuote | null> {
  try {
    // Dynamic import so it stays server-side
    const yf = await import('yahoo-finance2')
    const quote = await yf.default.quote(ticker)
    return quote as unknown as YFQuote
  } catch (err) {
    console.error(`Yahoo Finance error for ${ticker}:`, err)
    return null
  }
}

export async function fetchMarketIndices(): Promise<MarketIndex[]> {
  const symbols = [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^GDAXI', name: 'DAX' },
    { symbol: '^DJI', name: 'DOW' },
    { symbol: '^VIX', name: 'VIX' },
  ]

  try {
    const yf = await import('yahoo-finance2')
    const results = await Promise.allSettled(
      symbols.map(({ symbol }) => yf.default.quote(symbol))
    )

    return results.map((result, i) => {
      const { symbol, name } = symbols[i]
      if (result.status === 'fulfilled') {
        const q = result.value as unknown as YFQuote
        return {
          name,
          symbol,
          value: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePct: q.regularMarketChangePercent ?? 0,
        }
      }
      return { name, symbol, value: 0, change: 0, changePct: 0 }
    })
  } catch {
    // Return mock data if Yahoo Finance is unavailable
    return symbols.map(({ symbol, name }) => ({
      name, symbol, value: 0, change: 0, changePct: 0,
    }))
  }
}

export function yfQuoteToCompanyQuote(q: YFQuote): CompanyQuote {
  return {
    ticker: q.symbol,
    name: q.longName ?? q.shortName ?? q.symbol,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePct: q.regularMarketChangePercent ?? 0,
    marketCap: q.marketCap ?? 0,
    pe: q.trailingPE ?? null,
    eps: q.trailingEps ?? null,
    volume: q.regularMarketVolume ?? 0,
    avgVolume: q.averageDailyVolume3Month ?? 0,
    weekHigh52: q.fiftyTwoWeekHigh ?? 0,
    weekLow52: q.fiftyTwoWeekLow ?? 0,
    sector: q.sector ?? 'Unknown',
    exchange: q.exchange ?? 'Unknown',
  }
}
