export interface FinnhubEarningsEvent {
  date: string
  epsActual: number | null
  epsEstimate: number | null
  hour: 'bmo' | 'amc' | 'dmh' | string
  quarter: number
  revenueActual: number | null
  revenueEstimate: number | null
  symbol: string
  year: number
}

/**
 * Fetch earnings calendar from Finnhub.
 * https://finnhub.io/api/v1/calendar/earnings?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export interface FinnhubEarningsResult {
  actual: number | null
  estimate: number | null
  period: string       // e.g. "2024-03-31"
  quarter: number      // 1–4
  surprise: number | null
  surprisePercent: number | null
  symbol: string
  year: number
}

/**
 * Fetch quarterly earnings history for a single ticker.
 * https://finnhub.io/api/v1/stock/earnings?symbol=AAPL
 */
export async function getStockEarnings(
  ticker: string
): Promise<FinnhubEarningsResult[]> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) throw new Error('FINNHUB_API_KEY not set')

  const url = `https://finnhub.io/api/v1/stock/earnings?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 1800 } })

  if (!res.ok) throw new Error(`Finnhub earnings error: ${res.status}`)

  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data as FinnhubEarningsResult[]
}

export async function getEarningsCalendar(
  from: string,
  to: string
): Promise<FinnhubEarningsEvent[]> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) throw new Error('FINNHUB_API_KEY not set')

  const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 1800 } })

  if (!res.ok) throw new Error(`Finnhub error: ${res.status}`)

  const data = await res.json()
  const events = data?.earningsCalendar
  if (!Array.isArray(events)) return []

  return events as FinnhubEarningsEvent[]
}
