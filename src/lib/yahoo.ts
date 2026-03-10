import { CompanyQuote, MarketIndex } from '@/types'

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

const YF_BASE = 'https://query1.finance.yahoo.com/v7/finance/quote'

async function yfFetch(symbols: string[]): Promise<YFQuote[]> {
  const url = `${YF_BASE}?symbols=${symbols.join(',')}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    throw new Error(`Yahoo Finance HTTP ${res.status}`)
  }

  const json = await res.json()
  const results = json?.quoteResponse?.result
  if (!Array.isArray(results)) return []
  return results as YFQuote[]
}

export async function fetchYahooQuote(ticker: string): Promise<YFQuote | null> {
  try {
    const quotes = await yfFetch([ticker])
    return quotes[0] ?? null
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
    const quotes = await yfFetch(symbols.map((s) => s.symbol))
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]))

    return symbols.map(({ symbol, name }) => {
      const q = quoteMap.get(symbol)
      return {
        name,
        symbol,
        value: q?.regularMarketPrice ?? 0,
        change: q?.regularMarketChange ?? 0,
        changePct: q?.regularMarketChangePercent ?? 0,
      }
    })
  } catch {
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
