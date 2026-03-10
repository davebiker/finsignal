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

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// ── Cookie cache for EU consent ─────────────────────────────
// Yahoo redirects to a consent page for EU-based servers (Vercel).
// We obtain a consent cookie once and reuse it.

let cachedCookie: { value: string; ts: number } | null = null
const COOKIE_TTL = 10 * 60 * 1000 // 10 minutes

async function getYahooCookie(): Promise<string> {
  if (cachedCookie && Date.now() - cachedCookie.ts < COOKIE_TTL) {
    return cachedCookie.value
  }

  try {
    // Hit the Yahoo consent page to get A1/A3 cookies
    const res = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': UA },
      redirect: 'manual',
    })
    const setCookies = res.headers.getSetCookie?.() ?? []
    const cookie = setCookies.map((c) => c.split(';')[0]).join('; ')

    if (cookie) {
      cachedCookie = { value: cookie, ts: Date.now() }
      return cookie
    }
  } catch (err) {
    console.warn('Yahoo cookie fetch failed:', err)
  }

  // Fallback: try with a synthetic consent cookie
  const fallback = 'A1=d=AQABBCFe_mYCEE&S=AQAAAiK; A3=d=AQABBCFe_mYCEE&S=AQAAAiK'
  cachedCookie = { value: fallback, ts: Date.now() }
  return fallback
}

// ── v8 chart fetcher ────────────────────────────────────────

async function yfFetchChart(symbol: string): Promise<YFQuote | null> {
  const cookie = await getYahooCookie()
  const encoded = encodeURIComponent(symbol)

  // Try both query hosts
  const hosts = [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ]

  let lastError = ''

  for (const host of hosts) {
    try {
      const url = `${host}/v8/finance/chart/${encoded}?interval=1d&range=1d`
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Cookie: cookie,
        },
        cache: 'no-store',
      })

      if (!res.ok) {
        lastError = `${host} HTTP ${res.status}`
        // Invalidate cookie on 401/403 so next call retries
        if (res.status === 401 || res.status === 403) cachedCookie = null
        continue
      }

      const json = await res.json()
      const result = json?.chart?.result?.[0]
      const meta = result?.meta
      if (!meta?.regularMarketPrice) {
        lastError = `${host} no price in meta`
        continue
      }

      const price: number = meta.regularMarketPrice
      const prevClose: number | undefined =
        meta.chartPreviousClose ?? meta.previousClose

      let change: number | undefined
      let changePct: number | undefined

      if (prevClose != null && prevClose !== 0) {
        change = price - prevClose
        changePct = (change / prevClose) * 100
      }

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
    } catch (err) {
      lastError = `${host}: ${err instanceof Error ? err.message : err}`
    }
  }

  console.error(`Yahoo Finance failed for ${symbol}: ${lastError}`)
  return null
}

// ── YTD performance fetcher ──────────────────────────────────

export async function fetchYtdChange(symbol: string): Promise<number | null> {
  const cookie = await getYahooCookie()
  const encoded = encodeURIComponent(symbol)

  const hosts = [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ]

  for (const host of hosts) {
    try {
      const url = `${host}/v8/finance/chart/${encoded}?interval=1d&range=ytd`
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Cookie: cookie },
        cache: 'no-store',
      })

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) cachedCookie = null
        continue
      }

      const json = await res.json()
      const result = json?.chart?.result?.[0]
      const meta = result?.meta
      const closes = result?.indicators?.quote?.[0]?.close as number[] | undefined

      if (!meta?.regularMarketPrice || !closes?.length) continue

      // First close of the year
      const firstClose = closes.find((c: number | null) => c != null && c > 0)
      if (!firstClose) continue

      const currentPrice: number = meta.regularMarketPrice
      return ((currentPrice - firstClose) / firstClose) * 100
    } catch {
      continue
    }
  }

  return null
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
