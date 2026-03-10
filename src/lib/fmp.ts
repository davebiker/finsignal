import {
  FMPEarningsResult,
  FMPAnalystEstimate,
  FMPEarningsCalendar,
} from '@/types'

const BASE = 'https://financialmodelingprep.com/api/v3'

async function fmpFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) throw new Error('FMP_API_KEY not set')

  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('apikey', apiKey)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } })
  if (!res.ok) throw new Error(`FMP error: ${res.status}`)

  const data = await res.json()
  if (data?.['Error Message']) throw new Error(data['Error Message'])
  return data as T
}

// Last N earnings results for a ticker
export async function getEarningsResults(
  ticker: string,
  limit = 8
): Promise<FMPEarningsResult[]> {
  return fmpFetch<FMPEarningsResult[]>(`/earnings-surprises/${ticker}`, {
    limit: String(limit),
  })
}

// Analyst estimates
export async function getAnalystEstimates(
  ticker: string,
  period: 'annual' | 'quarter' = 'quarter',
  limit = 4
): Promise<FMPAnalystEstimate[]> {
  return fmpFetch<FMPAnalystEstimate[]>(`/analyst-estimates/${ticker}`, {
    period,
    limit: String(limit),
  })
}

// Earnings calendar — upcoming events
export async function getEarningsCalendar(
  from: string,
  to: string
): Promise<FMPEarningsCalendar[]> {
  return fmpFetch<FMPEarningsCalendar[]>(`/earning_calendar`, { from, to })
}

export interface FMPProfile {
  symbol: string
  companyName: string
  price: number
  mktCap: number
  sector: string
  industry: string
  exchange: string
  description: string
  image: string
  ipoDate: string
  website: string
  ceo: string
  fullTimeEmployees: string
  city: string
  country: string
  beta: number
  volAvg: number
  lastDiv: number
  changes: number
  currency: string
  dcf: number
  dcfDiff: number
  peRatio?: number
}

export async function getCompanyProfile(ticker: string): Promise<FMPProfile | null> {
  const data = await fmpFetch<FMPProfile[]>(`/profile/${ticker}`)
  return data[0] ?? null
}

export interface FMPRating {
  symbol: string
  date: string
  rating: string
  ratingScore: number
  ratingRecommendation: string
  ratingDetailsDCFScore: number
  ratingDetailsROEScore: number
  ratingDetailsROAScore: number
  ratingDetailsDEScore: number
  ratingDetailsPEScore: number
  ratingDetailsPBScore: number
}

export async function getCompanyRating(ticker: string): Promise<FMPRating | null> {
  const data = await fmpFetch<FMPRating[]>(`/rating/${ticker}`)
  return data[0] ?? null
}

export interface FMPAnalystRec {
  symbol: string
  date: string
  analystRatingbuy: number
  analystRatingHold: number
  analystRatingSell: number
  analystRatingStrongSell: number
  analystRatingStrongBuy: number
}

export async function getAnalystRecommendations(ticker: string): Promise<FMPAnalystRec[]> {
  return fmpFetch<FMPAnalystRec[]>(`/analyst-stock-recommendations/${ticker}`, { limit: '1' })
}

export interface FMPPriceTarget {
  symbol: string
  publishedDate: string
  newsURL: string
  newsTitle: string
  analystName: string
  priceTarget: number
  adjPriceTarget: number
  priceWhenPosted: number
  newsPublisher: string
  newsBaseURL: string
  analystCompany: string
}

export async function getPriceTargets(ticker: string): Promise<FMPPriceTarget[]> {
  return fmpFetch<FMPPriceTarget[]>(`/price-target`, {
    symbol: ticker,
  })
}

// Aggregate consensus price target from latest price targets
export async function getConsensusPriceTarget(ticker: string): Promise<number | null> {
  try {
    const pts = await getPriceTargets(ticker)
    if (!pts.length) return null
    const recent = pts.slice(0, 10)
    const avg = recent.reduce((sum, p) => sum + p.priceTarget, 0) / recent.length
    return Math.round(avg * 100) / 100
  } catch {
    return null
  }
}
