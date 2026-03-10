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

// ── v8 chart API (primary — no auth/crumb needed) ──────────

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function yfFetchChart(symbol: string): Promise<YFQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d&includePrePost=false`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
  })

  if (!res.ok) return null
  const json = await res.json()
  const meta = json?.chart?.result?.[0]?.meta
  if (!meta) return null

  const price = meta.regularMarketPrice
  const prevClose = meta.chartPreviousClose ?? meta.previousClose
  const change = price != null && prevClose != null ? price - prevClose : undefined
  const changePct = change != null && prevClose && prevClose !== 0
    ? (change / prevClose) * 100
    : undefined

  return {
    symbol: meta.symbol ?? symbol,
    shortName: meta.shortName,
    longName: meta.longName,
    regularMarketPrice: price,
    regularMarketChange: change,
    regularMarketChangePercent: changePct,
    regularMarketVolume: meta.regularMarketVolume,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    marketCap: meta.marketCap,
    exchange: meta.exchangeName,
  }
}

// ── Public API ──────────────────────────────────────────────

export async function fetchYahooQuote(ticker: string): Promise<YFQuote | null> {
  try {
    return await yfFetchChart(ticker)
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

  const results = await Promise.allSettled(
    symbols.map(({ symbol }) => yfFetchChart(symbol))
  )

  return symbols.map(({ symbol, name }, i) => {
    const result = results[i]
    const q = result.status === 'fulfilled' ? result.value : null
    return {
      name,
      symbol,
      value: q?.regularMarketPrice ?? 0,
      change: q?.regularMarketChange ?? 0,
      changePct: q?.regularMarketChangePercent ?? 0,
    }
  })
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
