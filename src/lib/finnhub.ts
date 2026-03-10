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
