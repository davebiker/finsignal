import { AlphaVantageEarnings } from '@/types'

const BASE = 'https://www.alphavantage.co/query'

async function avFetch<T>(params: Record<string, string>): Promise<T> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) throw new Error('ALPHA_VANTAGE_API_KEY not set')

  const url = new URL(BASE)
  Object.entries({ ...params, apikey: apiKey }).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  )

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Alpha Vantage error: ${res.status}`)
  const data = await res.json()

  // Detect rate limit / error messages
  if (data?.Note || data?.Information) {
    const msg = data.Note ?? data.Information
    if (msg.includes('rate limit') || msg.includes('API call frequency')) {
      throw new Error('Alpha Vantage rate limit reached. Please wait before retrying.')
    }
  }

  return data as T
}

export async function getEarningsHistory(ticker: string): Promise<AlphaVantageEarnings> {
  return avFetch<AlphaVantageEarnings>({
    function: 'EARNINGS',
    symbol: ticker,
  })
}

export interface AVIncomeStatement {
  symbol: string
  annualReports: Array<{
    fiscalDateEnding: string
    reportedCurrency: string
    grossProfit: string
    totalRevenue: string
    ebitda: string
    operatingIncome: string
    netIncome: string
    eps: string
    epsDiluted: string
  }>
  quarterlyReports: Array<{
    fiscalDateEnding: string
    reportedCurrency: string
    grossProfit: string
    totalRevenue: string
    ebitda: string
    operatingIncome: string
    netIncome: string
    eps: string
    epsDiluted: string
  }>
}

export async function getIncomeStatement(ticker: string): Promise<AVIncomeStatement> {
  return avFetch<AVIncomeStatement>({
    function: 'INCOME_STATEMENT',
    symbol: ticker,
  })
}

export interface AVOverview {
  Symbol: string
  Name: string
  Description: string
  Sector: string
  Industry: string
  Exchange: string
  MarketCapitalization: string
  PERatio: string
  ForwardPE: string
  EPS: string
  DividendYield: string
  ProfitMargin: string
  RevenueTTM: string
  GrossProfitTTM: string
  EBITDA: string
  EV: string
  EVToEBITDA: string
  PriceToBookRatio: string
  AnalystTargetPrice: string
  '52WeekHigh': string
  '52WeekLow': string
}

export async function getCompanyOverview(ticker: string): Promise<AVOverview> {
  return avFetch<AVOverview>({
    function: 'OVERVIEW',
    symbol: ticker,
  })
}

// ── Earnings Calendar (CSV endpoint) ────────────────────────

export interface AVEarningsCalendarEvent {
  symbol: string
  name: string
  reportDate: string
  fiscalDateEnding: string
  estimate: number | null
  currency: string
}

/**
 * Fetch upcoming earnings calendar from Alpha Vantage.
 * `horizon` can be '3month', '6month', or '12month'.
 * Returns CSV parsed into objects.
 */
export async function getAVEarningsCalendar(
  horizon: '3month' | '6month' | '12month' = '3month'
): Promise<AVEarningsCalendarEvent[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) throw new Error('ALPHA_VANTAGE_API_KEY not set')

  const url = `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=${horizon}&apikey=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 1800 } })
  if (!res.ok) throw new Error(`Alpha Vantage earnings calendar error: ${res.status}`)

  const text = await res.text()

  // Detect rate limit messages (comes back as JSON instead of CSV)
  if (text.startsWith('{')) {
    const data = JSON.parse(text)
    if (data?.Note || data?.Information) {
      throw new Error('Alpha Vantage rate limit reached.')
    }
  }

  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  // CSV header: symbol,name,reportDate,fiscalDateEnding,estimate,currency
  return lines.slice(1).map((line) => {
    const [symbol, name, reportDate, fiscalDateEnding, estimate, currency] = line.split(',')
    return {
      symbol: symbol?.trim() ?? '',
      name: name?.trim() ?? '',
      reportDate: reportDate?.trim() ?? '',
      fiscalDateEnding: fiscalDateEnding?.trim() ?? '',
      estimate: estimate?.trim() ? parseFloat(estimate.trim()) : null,
      currency: currency?.trim() ?? 'USD',
    }
  }).filter((e) => e.symbol && e.reportDate)
}
